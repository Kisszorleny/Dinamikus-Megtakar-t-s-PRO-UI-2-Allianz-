import { NextResponse } from "next/server"
import { Resend } from "resend"
import { promises as fs } from "node:fs"
import path from "node:path"
import { buildSummaryEmailTemplate, getSummaryEmailTone, type Currency } from "@/lib/summary-email/template"

type SummaryEmailPayload = {
  recipientEmail: string
  safeName: string
  safeUntil: string
  emailTegezo: boolean
  displayCurrency: Currency
  subject: string
  values: {
    accountName: string
    accountGoal: string
    monthlyPayment: string
    yearlyPayment: string
    years: string
    totalContributions: string
    strategy: string
    annualYield: string
    totalReturn: string
    endBalance: string
    totalBonus?: string
    finalNet: string
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isCurrency(value: string): value is Currency {
  return value === "HUF" || value === "EUR" || value === "USD"
}

function parsePayload(raw: unknown): SummaryEmailPayload | null {
  if (!raw || typeof raw !== "object") return null
  const candidate = raw as Record<string, unknown>
  const values = candidate.values as Record<string, unknown> | undefined
  if (!values || typeof values !== "object") return null

  const recipientEmail = String(candidate.recipientEmail ?? "").trim()
  const safeName = String(candidate.safeName ?? "").trim()
  const safeUntil = String(candidate.safeUntil ?? "").trim()
  const subject = String(candidate.subject ?? "").trim()
  const emailTegezo = Boolean(candidate.emailTegezo)
  const displayCurrency = String(candidate.displayCurrency ?? "").trim()

  if (!EMAIL_REGEX.test(recipientEmail)) return null
  if (!safeName) return null
  if (!subject) return null
  if (!isCurrency(displayCurrency)) return null

  const requiredValueKeys = [
    "accountName",
    "accountGoal",
    "monthlyPayment",
    "yearlyPayment",
    "years",
    "totalContributions",
    "strategy",
    "annualYield",
    "totalReturn",
    "endBalance",
    "finalNet",
  ] as const

  for (const key of requiredValueKeys) {
    if (!String(values[key] ?? "").trim()) return null
  }

  return {
    recipientEmail,
    safeName,
    safeUntil,
    emailTegezo,
    displayCurrency,
    subject,
    values: {
      accountName: String(values.accountName),
      accountGoal: String(values.accountGoal),
      monthlyPayment: String(values.monthlyPayment),
      yearlyPayment: String(values.yearlyPayment),
      years: String(values.years),
      totalContributions: String(values.totalContributions),
      strategy: String(values.strategy),
      annualYield: String(values.annualYield),
      totalReturn: String(values.totalReturn),
      endBalance: String(values.endBalance),
      totalBonus: String(values.totalBonus ?? ""),
      finalNet: String(values.finalNet),
    },
  }
}

type InlineImageDescriptor = {
  fileName: string
  contentType: string
  contentId: string
}

const inlineImageMap: Record<string, InlineImageDescriptor> = {
  tkm: {
    fileName: "tkm-chart.png",
    contentType: "image/png",
    contentId: "summary-tkm-chart",
  },
}

async function loadInlineImages() {
  const attachments: Array<{
    filename: string
    content: Buffer
    contentType: string
    contentId: string
  }> = []
  const imageSlots: Record<string, string> = {}

  for (const [slot, descriptor] of Object.entries(inlineImageMap)) {
    const absolute = path.join(process.cwd(), "public", "email-assets", descriptor.fileName)
    try {
      const content = await fs.readFile(absolute)
      attachments.push({
        filename: descriptor.fileName,
        content,
        contentType: descriptor.contentType,
        contentId: descriptor.contentId,
      })
      imageSlots[slot] = `cid:${descriptor.contentId}`
    } catch (error) {
      console.warn("[summary-email] Missing inline image, continuing without it:", {
        slot,
        file: absolute,
        message: error instanceof Error ? error.message : "unknown",
      })
    }
  }

  return { attachments, imageSlots }
}

export async function POST(request: Request) {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ ok: false, message: "Hibás JSON kérés." }, { status: 400 })
  }

  const payload = parsePayload(raw)
  if (!payload) {
    return NextResponse.json({ ok: false, message: "Hiányzó vagy hibás mezők." }, { status: 400 })
  }

  const resendApiKey = process.env.RESEND_API_KEY
  const from = process.env.SUMMARY_FROM_EMAIL ?? process.env.LEAD_FROM_EMAIL ?? "DM PRO Summary <onboarding@resend.dev>"

  if (!resendApiKey) {
    return NextResponse.json({ ok: false, message: "Hiányzó RESEND_API_KEY környezeti változó." }, { status: 500 })
  }

  try {
    const tone = getSummaryEmailTone(payload.emailTegezo)
    const { attachments, imageSlots } = await loadInlineImages()
    const email = buildSummaryEmailTemplate({
      safeName: payload.safeName,
      safeUntil: payload.safeUntil,
      emailTegezo: payload.emailTegezo,
      displayCurrency: payload.displayCurrency,
      tone,
      subject: payload.subject,
      values: payload.values,
      images: {
        tkm: imageSlots.tkm,
      },
    })

    const resend = new Resend(resendApiKey)
    await resend.emails.send({
      from,
      to: payload.recipientEmail,
      subject: payload.subject,
      html: email.html,
      text: email.plain,
      attachments,
    })

    return NextResponse.json({
      ok: true,
      message: "E-mail sikeresen elküldve.",
      imagesAttached: attachments.length,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Ismeretlen e-mail küldési hiba.",
      },
      { status: 502 },
    )
  }
}
