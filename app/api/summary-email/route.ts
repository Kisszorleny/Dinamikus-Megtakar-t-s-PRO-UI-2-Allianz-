import { NextResponse } from "next/server"
import { Resend } from "resend"
import { promises as fs } from "node:fs"
import path from "node:path"
import { buildSummaryEmailTemplate, getSummaryEmailTone, type Currency } from "@/lib/summary-email/template"
import { getSessionUserFromRequest } from "@/lib/auth-session"
import { getEmailTemplateById } from "@/lib/email-templates/repository"
import { renderEmailTemplate } from "@/lib/email-templates/render"
import { buildCalculatorTableHtmlFromTemplate, buildCalculatorTablePlain } from "@/lib/email-templates/calculator-table"
import { getFixedAmountValues } from "@/lib/email-templates/fixed-amounts"

type SummaryEmailPayload = {
  recipientEmail: string
  safeName: string
  safeUntil: string
  emailTegezo: boolean
  fxBaseColor?: string
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
    totalTaxCredit?: string
    endBalance: string
    totalBonus?: string
    finalNet: string
    endBalanceHufCurrent?: string
    endBalanceEUR500?: string
    endBalanceEUR600?: string
  }
  templateId?: string
  selectedProduct?: string
  dynamicValues?: {
    name?: string
    amount?: string
    deadline?: string
    currency?: string
    tone?: string
    calculator_table?: string
    fixed_small_amount?: string
    fixed_large_amount?: string
    retirement_section?: string
    bonus_section?: string
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isCurrency(value: string): value is Currency {
  return value === "HUF" || value === "EUR" || value === "USD"
}

function toTemplateCurrencyLabel(currency: Currency): string {
  return currency === "HUF" ? "Ft" : currency
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
  const fxBaseColorRaw = String(candidate.fxBaseColor ?? "").trim()
  const fxBaseColor = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(fxBaseColorRaw)
    ? `#${fxBaseColorRaw.replace(/^#/, "").toLowerCase()}`
    : undefined

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
    fxBaseColor,
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
      totalTaxCredit: String(values.totalTaxCredit ?? ""),
      endBalance: String(values.endBalance),
      totalBonus: String(values.totalBonus ?? ""),
      finalNet: String(values.finalNet),
      endBalanceHufCurrent: String(values.endBalanceHufCurrent ?? ""),
      endBalanceEUR500: String(values.endBalanceEUR500 ?? ""),
      endBalanceEUR600: String(values.endBalanceEUR600 ?? ""),
    },
    templateId: String(candidate.templateId ?? "").trim() || undefined,
    selectedProduct: String(candidate.selectedProduct ?? "").trim() || undefined,
    dynamicValues:
      candidate.dynamicValues && typeof candidate.dynamicValues === "object"
        ? {
            name: String((candidate.dynamicValues as Record<string, unknown>).name ?? "").trim() || undefined,
            amount: String((candidate.dynamicValues as Record<string, unknown>).amount ?? "").trim() || undefined,
            deadline: String((candidate.dynamicValues as Record<string, unknown>).deadline ?? "").trim() || undefined,
            currency: String((candidate.dynamicValues as Record<string, unknown>).currency ?? "").trim() || undefined,
            tone: String((candidate.dynamicValues as Record<string, unknown>).tone ?? "").trim() || undefined,
            calculator_table:
              String((candidate.dynamicValues as Record<string, unknown>).calculator_table ?? "").trim() || undefined,
            fixed_small_amount:
              String((candidate.dynamicValues as Record<string, unknown>).fixed_small_amount ?? "").trim() || undefined,
            fixed_large_amount:
              String((candidate.dynamicValues as Record<string, unknown>).fixed_large_amount ?? "").trim() || undefined,
            retirement_section:
              String((candidate.dynamicValues as Record<string, unknown>).retirement_section ?? "").trim() || undefined,
            bonus_section:
              String((candidate.dynamicValues as Record<string, unknown>).bonus_section ?? "").trim() || undefined,
          }
        : undefined,
  }
}

type InlineImageDescriptor = {
  fileName: string
  contentType: string
  contentId: string
}

const inlineImageMap: Record<string, InlineImageDescriptor> = {
  penz: {
    fileName: "penz.png",
    contentType: "image/png",
    contentId: "summary-penz-icon",
  },
  chart: {
    fileName: "chart.png",
    contentType: "image/png",
    contentId: "summary-chart-icon",
  },
  chart2: {
    fileName: "chart2.png",
    contentType: "image/png",
    contentId: "summary-chart2-icon",
  },
  penzkoteg: {
    fileName: "penzkoteg.png",
    contentType: "image/png",
    contentId: "summary-penzkoteg-icon",
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
    const { attachments, imageSlots } = await loadInlineImages()
    let html = ""
    let plain = ""
    if (payload.templateId) {
      const session = getSessionUserFromRequest(request)
      if (!session) {
        return NextResponse.json({ ok: false, message: "Egyedi sablon küldéséhez bejelentkezés szükséges." }, { status: 401 })
      }
      const template = await getEmailTemplateById(session, payload.templateId)
      if (!template) {
        return NextResponse.json({ ok: false, message: "A kiválasztott sablon nem található." }, { status: 404 })
      }
      const tableMapping = template.mappings.find((mapping) => mapping.key === "calculator_table")
      const calculatorTableHtml = buildCalculatorTableHtmlFromTemplate(payload.values, tableMapping?.sourceSnippet, {
        fxBaseColor: payload.fxBaseColor,
      })
      const calculatorTablePlain = buildCalculatorTablePlain(payload.values)
      const fixedAmounts = getFixedAmountValues(payload.displayCurrency)
      const rendered = renderEmailTemplate({
        template,
        values: {
          name: payload.dynamicValues?.name ?? payload.safeName,
          amount: payload.dynamicValues?.amount ?? payload.values.monthlyPayment,
          deadline: payload.dynamicValues?.deadline ?? payload.safeUntil,
          currency: payload.dynamicValues?.currency ?? toTemplateCurrencyLabel(payload.displayCurrency),
          tone: payload.dynamicValues?.tone ?? (payload.emailTegezo ? "Kedves" : "Tisztelt"),
          calculator_table: payload.dynamicValues?.calculator_table ?? "{{calculator_table}}",
          fixed_small_amount: payload.dynamicValues?.fixed_small_amount ?? fixedAmounts.fixedSmallAmount,
          fixed_large_amount: payload.dynamicValues?.fixed_large_amount ?? fixedAmounts.fixedLargeAmount,
          retirement_section: payload.dynamicValues?.retirement_section ?? "{{retirement_section}}",
          bonus_section: payload.dynamicValues?.bonus_section ?? "{{bonus_section}}",
        },
        calculatorTableHtml,
        calculatorTablePlain,
        accountGoalPhrase: payload.values.accountGoal,
        isAllianzEletprogram: payload.selectedProduct === "allianz_eletprogram",
      })
      html = rendered.html
      plain = rendered.plain
    } else {
      const tone = getSummaryEmailTone(payload.emailTegezo)
      const email = buildSummaryEmailTemplate({
        safeName: payload.safeName,
        safeUntil: payload.safeUntil,
        emailTegezo: payload.emailTegezo,
        displayCurrency: payload.displayCurrency,
        tone,
        subject: payload.subject,
        values: payload.values,
        images: {
          penz: imageSlots.penz,
          chart: imageSlots.chart,
          chart2: imageSlots.chart2,
          penzkoteg: imageSlots.penzkoteg,
        },
      })
      html = email.html
      plain = email.plain
    }

    const resend = new Resend(resendApiKey)
    await resend.emails.send({
      from,
      to: payload.recipientEmail,
      subject: payload.subject,
      html,
      text: plain,
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
