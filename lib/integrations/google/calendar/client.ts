import { google } from "googleapis"
import type { calendar_v3 } from "googleapis"

function getCalendarConfig() {
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n")
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if (!privateKey || !clientEmail || !calendarId) {
    throw new Error(
      "Hiányzó Google Calendar konfiguráció. Adj meg GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL, GOOGLE_CALENDAR_ID értékeket.",
    )
  }
  return { privateKey, clientEmail, calendarId }
}

function createCalendarClient() {
  const { privateKey, clientEmail } = getCalendarConfig()
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  })
  return google.calendar({ version: "v3", auth })
}

export type GoogleCalendarEvent = calendar_v3.Schema$Event

export async function upsertGoogleCalendarEvent(input: {
  eventId?: string | null
  title: string
  description?: string
  startAt: string
  endAt: string
  dedupeTitles?: string[]
}) {
  const calendar = createCalendarClient()
  const { calendarId } = getCalendarConfig()
  const eventBody = {
    summary: input.title,
    description: input.description ?? "",
    start: { dateTime: input.startAt, timeZone: "Europe/Budapest" },
    end: { dateTime: input.endAt, timeZone: "Europe/Budapest" },
    extendedProperties: {
      private: {
        dm_lead_sync_managed: "1",
      },
    },
  }

  if (input.eventId) {
    const updated = await calendar.events.update({
      calendarId,
      eventId: input.eventId,
      requestBody: eventBody,
    })
    return updated.data.id ?? input.eventId
  }

  // If no stored eventId yet, try to find a matching existing event
  // (e.g. legacy title format) and update it instead of inserting a duplicate.
  const list = await calendar.events.list({
    calendarId,
    timeMin: new Date(new Date(input.startAt).getTime() - 60_000).toISOString(),
    timeMax: new Date(new Date(input.endAt).getTime() + 60_000).toISOString(),
    singleEvents: true,
    maxResults: 25,
  })
  const expectedTitles = Array.from(new Set([input.title, ...(input.dedupeTitles ?? [])]))
  const matched = (list.data.items ?? []).find((event) => {
    const summary = String(event.summary ?? "")
    const start = event.start?.dateTime
    const end = event.end?.dateTime
    if (!start || !end) return false
    const sameWindow = new Date(start).getTime() === new Date(input.startAt).getTime() && new Date(end).getTime() === new Date(input.endAt).getTime()
    if (!sameWindow) return false
    return expectedTitles.includes(summary)
  })

  if (matched?.id) {
    const updated = await calendar.events.update({
      calendarId,
      eventId: matched.id,
      requestBody: eventBody,
    })
    return updated.data.id ?? matched.id
  }

  const created = await calendar.events.insert({
    calendarId,
    requestBody: eventBody,
  })
  return created.data.id ?? null
}

export async function cleanupGoogleCalendarDuplicates(input: {
  keepEventId: string
  startAt: string
  endAt: string
  dedupeTitles?: string[]
}) {
  const calendar = createCalendarClient()
  const { calendarId } = getCalendarConfig()
  const expectedTitles = Array.from(new Set(input.dedupeTitles ?? []))
  if (expectedTitles.length === 0) return 0

  const list = await calendar.events.list({
    calendarId,
    timeMin: new Date(new Date(input.startAt).getTime() - 60_000).toISOString(),
    timeMax: new Date(new Date(input.endAt).getTime() + 60_000).toISOString(),
    singleEvents: true,
    maxResults: 50,
  })

  const duplicates = (list.data.items ?? []).filter((event) => {
    if (!event.id || event.id === input.keepEventId) return false
    const summary = String(event.summary ?? "")
    if (!expectedTitles.includes(summary)) return false
    const start = event.start?.dateTime
    const end = event.end?.dateTime
    if (!start || !end) return false
    const sameWindow = new Date(start).getTime() === new Date(input.startAt).getTime() && new Date(end).getTime() === new Date(input.endAt).getTime()
    return sameWindow
  })

  let deleted = 0
  for (const event of duplicates) {
    if (!event.id) continue
    await calendar.events.delete({
      calendarId,
      eventId: event.id,
    })
    deleted += 1
  }
  return deleted
}

export async function deleteGoogleCalendarEvent(eventId: string) {
  const calendar = createCalendarClient()
  const { calendarId } = getCalendarConfig()
  await calendar.events.delete({
    calendarId,
    eventId,
  })
}

export async function listGoogleCalendarEvents(input: {
  timeMin?: string
  timeMax?: string
  updatedMin?: string
  maxResults?: number
}): Promise<GoogleCalendarEvent[]> {
  const calendar = createCalendarClient()
  const { calendarId } = getCalendarConfig()
  const items: GoogleCalendarEvent[] = []
  let pageToken: string | undefined

  do {
    const response = await calendar.events.list({
      calendarId,
      timeMin: input.timeMin,
      timeMax: input.timeMax,
      updatedMin: input.updatedMin,
      singleEvents: true,
      orderBy: input.updatedMin ? undefined : "startTime",
      maxResults: input.maxResults ?? 2000,
      pageToken,
    })
    items.push(...(response.data.items ?? []))
    pageToken = response.data.nextPageToken ?? undefined
  } while (pageToken)

  return items
}
