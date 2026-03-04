function getIcloudCaldavConfig() {
  const baseUrl = process.env.ICLOUD_CALDAV_URL
  const username = process.env.ICLOUD_CALDAV_USERNAME
  const appPassword = process.env.ICLOUD_CALDAV_APP_PASSWORD
  if (!baseUrl || !username || !appPassword) {
    throw new Error(
      "Hiányzó iCloud CalDAV konfiguráció. Adj meg ICLOUD_CALDAV_URL, ICLOUD_CALDAV_USERNAME, ICLOUD_CALDAV_APP_PASSWORD értékeket.",
    )
  }
  return { baseUrl, username, appPassword }
}

function escapeIcal(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;")
}

function toIcalLocalDateTimeStamp(dateTime: string) {
  return dateTime.replace(/[-:]/g, "").slice(0, 15)
}

export async function upsertIcloudCaldavEvent(input: {
  eventId?: string | null
  title: string
  description?: string
  startAt: string
  endAt: string
}) {
  const { baseUrl, username, appPassword } = getIcloudCaldavConfig()
  const eventId = input.eventId ?? crypto.randomUUID()
  const start = toIcalLocalDateTimeStamp(input.startAt)
  const end = toIcalLocalDateTimeStamp(input.endAt)

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DM PRO//Lead Sync//HU",
    "BEGIN:VEVENT",
    `UID:${eventId}`,
    `DTSTAMP:${toIcalLocalDateTimeStamp(new Date().toISOString())}Z`,
    `DTSTART;TZID=Europe/Budapest:${start}`,
    `DTEND;TZID=Europe/Budapest:${end}`,
    `SUMMARY:${escapeIcal(input.title)}`,
    `DESCRIPTION:${escapeIcal(input.description ?? "")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")

  const targetUrl = `${baseUrl.replace(/\/$/, "")}/${eventId}.ics`
  const auth = Buffer.from(`${username}:${appPassword}`).toString("base64")
  const response = await fetch(targetUrl, {
    method: "PUT",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "text/calendar; charset=utf-8",
    },
    body: ics,
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`iCloud CalDAV hiba (${response.status}): ${body.slice(0, 400)}`)
  }

  return eventId
}
