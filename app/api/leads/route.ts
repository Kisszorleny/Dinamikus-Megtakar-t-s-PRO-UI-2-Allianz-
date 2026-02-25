import { NextResponse } from "next/server"
import { Resend } from "resend"
import { buildLeadAdminEmail, buildLeadCustomerConfirmationEmail } from "@/lib/leads/email-template"
import { createLeadSubmission, markLeadEmailStatus } from "@/lib/leads/repository"
import { leadPayloadSchema } from "@/lib/leads/schema"
import { computeLeadEmailInsights } from "@/lib/leads/top-offers"

export async function POST(request: Request) {
  let payloadRaw: unknown
  try {
    payloadRaw = await request.json()
  } catch {
    return NextResponse.json({ ok: false, message: "Hibás kérés." }, { status: 400 })
  }

  const parsed = leadPayloadSchema.safeParse(payloadRaw)
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Hiányzó vagy hibás mezők.",
        issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      },
      { status: 400 },
    )
  }

  const payload = parsed.data

  let leadId: string
  try {
    const result = await createLeadSubmission(payload)
    leadId = result.id
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Nem sikerült menteni az adatokat." },
      { status: 500 },
    )
  }

  const resendApiKey = process.env.RESEND_API_KEY
  const adminEmail = process.env.LEAD_ADMIN_EMAIL
  const from = process.env.LEAD_FROM_EMAIL ?? "DM PRO Lead <onboarding@resend.dev>"

  if (!resendApiKey || !adminEmail) {
    await markLeadEmailStatus(leadId, "failed", "Hiányzó RESEND_API_KEY vagy LEAD_ADMIN_EMAIL.")
    return NextResponse.json(
      {
        ok: false,
        leadId,
        message: "A lead mentése sikerült, de az email küldés nincs megfelelően konfigurálva.",
      },
      { status: 500 },
    )
  }

  try {
    const resend = new Resend(resendApiKey)
    const insights = computeLeadEmailInsights(payload)

    const adminMessage = buildLeadAdminEmail(payload, { insights })
    await resend.emails.send({
      from,
      to: adminEmail,
      replyTo: payload.contact.email,
      subject: adminMessage.subject,
      html: adminMessage.html,
      text: adminMessage.text,
    })

    const customerMessage = buildLeadCustomerConfirmationEmail(payload, { insights })
    await resend.emails.send({
      from,
      to: payload.contact.email,
      subject: customerMessage.subject,
      html: customerMessage.html,
      text: customerMessage.text,
    })

    await markLeadEmailStatus(leadId, "sent")
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ismeretlen email hiba."
    await markLeadEmailStatus(leadId, "failed", message)
    return NextResponse.json(
      {
        ok: false,
        leadId,
        message: "A lead mentése sikerült, de az email küldés hibára futott.",
      },
      { status: 502 },
    )
  }

  return NextResponse.json({
    ok: true,
    leadId,
    message: "A lead mentése és email küldése sikeres.",
  })
}
