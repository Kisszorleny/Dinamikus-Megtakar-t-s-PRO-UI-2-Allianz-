import { NextRequest, NextResponse } from "next/server"
import JSZip from "jszip"
import { randomUUID } from "node:crypto"
import { z } from "zod"
import { getSessionUser } from "@/lib/auth-session"
import { getEmailTemplateById, upsertTemplateVariantBundle } from "@/lib/email-templates/repository"
import { renderEmailTemplate } from "@/lib/email-templates/render"
import { buildCalculatorTableHtmlFromTemplate, buildCalculatorTablePlain } from "@/lib/email-templates/calculator-table"
import { getFixedAmountValues } from "@/lib/email-templates/fixed-amounts"
import { buildEmlMessage, slugifyVariantFileName } from "@/lib/email-templates/eml"
import { buildStandaloneHtmlEmail } from "@/lib/email-templates/html-export"
import type { TemplateVariantItem } from "@/lib/email-templates/types"
import { buildStoredTemplateVariantArtifacts } from "@/lib/email-templates/variant-runtime"

const renderedSnapshotMarker = "<!--dm-rendered-snapshot-->"

const valuesSchema = z.object({
  accountName: z.string(),
  accountGoal: z.string(),
  monthlyPayment: z.string(),
  yearlyPayment: z.string(),
  years: z.string(),
  totalContributions: z.string(),
  strategy: z.string(),
  annualYield: z.string(),
  totalReturn: z.string(),
  totalTaxCredit: z.string().optional(),
  endBalance: z.string(),
  totalBonus: z.string().optional(),
  finalNet: z.string(),
  endBalanceHufCurrent: z.string().optional(),
  endBalanceEUR500: z.string().optional(),
  endBalanceEUR600: z.string().optional(),
})

const payloadSchema = z.object({
  templateId: z.string().trim().min(1),
  safeName: z.string().trim().min(1),
  safeUntil: z.string().trim().optional().default(""),
  subject: z.string().trim().optional(),
  values: valuesSchema,
  fromAddress: z.string().trim().optional(),
  toAddress: z.string().trim().optional(),
  skipZip: z.boolean().optional().default(false),
  includeVariants: z.boolean().optional().default(false),
})

type VariantConfig = {
  tone: "magazo" | "tegezo"
  product: "allianz_eletprogram" | "allianz_bonusz_eletprogram"
  currency: "HUF" | "EUR"
  goal: "tokenoveles" | "nyugdij"
}

function toTemplateCurrencyLabel(currency: "HUF" | "EUR"): string {
  return currency === "HUF" ? "Ft" : "EUR"
}

function getVariantGoal(goal: VariantConfig["goal"]): string {
  return goal === "nyugdij" ? "nyugdíj" : "tőkenövelés"
}

function getVariantProductLabel(product: VariantConfig["product"]): string {
  return product === "allianz_eletprogram" ? "Allianz Életprogram" : "Allianz Bónusz Életprogram"
}

function getVariantCurrencyLabel(currency: VariantConfig["currency"]): string {
  return currency === "HUF" ? "Forintos" : "Eurós"
}

function getVariantGoalLabel(goal: VariantConfig["goal"]): string {
  return goal === "nyugdij" ? "Nyugdíj" : "Tőkenövelési"
}

function getVariantToneLabel(tone: VariantConfig["tone"]): string {
  return tone === "tegezo" ? "Tegező" : "Magázó"
}

function getVariantName(variant: VariantConfig): string {
  return `${getVariantProductLabel(variant.product)} ${getVariantGoalLabel(variant.goal)} ${getVariantCurrencyLabel(variant.currency)}`
}

function getAllVariants(): VariantConfig[] {
  const variants: VariantConfig[] = []
  const tones: VariantConfig["tone"][] = ["magazo", "tegezo"]
  const products: VariantConfig["product"][] = ["allianz_eletprogram", "allianz_bonusz_eletprogram"]
  const currencies: VariantConfig["currency"][] = ["HUF", "EUR"]
  const goals: VariantConfig["goal"][] = ["tokenoveles", "nyugdij"]
  for (const tone of tones) {
    for (const product of products) {
      for (const currency of currencies) {
        for (const goal of goals) {
          variants.push({ tone, product, currency, goal })
        }
      }
    }
  }
  return variants
}

function stripRenderedSnapshotMarker(input: string): string {
  return input.replace(renderedSnapshotMarker, "").trim()
}

function resolveVariantTemplateSource(
  template: Awaited<ReturnType<typeof getEmailTemplateById>> extends infer T ? Exclude<T, null> : never,
  variant: VariantConfig,
) {
  const baseHtml = (template.htmlContent || "").includes(renderedSnapshotMarker)
    ? stripRenderedSnapshotMarker(template.htmlContent || "")
    : template.htmlContent || ""
  const tegezoHtml = template.convertedHtmlContent || baseHtml
  const tegezoText = template.convertedTextContent || template.textContent || ""
  if (variant.tone === "tegezo") {
    return {
      htmlContent: tegezoHtml,
      textContent: tegezoText,
    }
  }
  return {
    htmlContent: baseHtml,
    textContent: template.textContent || "",
  }
}

export async function POST(request: NextRequest) {
  const session = getSessionUser(request)
  if (!session) {
    return NextResponse.json({ message: "Nincs jogosultság." }, { status: 401 })
  }

  const raw = await request.json().catch(() => null)
  const parsed = payloadSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ message: "Hibás kérés.", issues: parsed.error.issues }, { status: 400 })
  }

  try {
    const payload = parsed.data
    const template = await getEmailTemplateById(session, payload.templateId)
    if (!template) {
      return NextResponse.json({ message: "A kiválasztott sablon nem található." }, { status: 404 })
    }

    const baseSubject = template.subject || payload.subject || "Megtakarítási ajánlat"
    const variants = getAllVariants()
    const variantItems: TemplateVariantItem[] = []
    const now = new Date()
    const fromAddress = payload.fromAddress || "Dinamikus Megtakarítás <noreply@dinamikus.local>"
    const toAddress = payload.toAddress || "ugyfel@example.com"
    const structuralCalculatorTableHtml = "{{calculator_table}}"
    const structuralCalculatorTablePlain = "{{calculator_table}}"

    for (const variant of variants) {
      const structuralSource = resolveVariantTemplateSource(template, variant)
      const fixedAmounts = getFixedAmountValues(variant.currency)
      const rendered = renderEmailTemplate({
        template: {
          htmlContent: structuralSource.htmlContent,
          textContent: structuralSource.textContent,
          mappings: template.mappings || [],
        },
        values: {
          name: "{{name}}",
          amount: "{{amount}}",
          deadline: "{{deadline}}",
          currency: "{{currency}}",
          tone: variant.tone === "tegezo" ? "Kedves" : "Tisztelt",
          calculator_table: "{{calculator_table}}",
          fixed_small_amount: fixedAmounts.fixedSmallAmount,
          fixed_large_amount: fixedAmounts.fixedLargeAmount,
          retirement_section: "{{retirement_section}}",
          bonus_section: "{{bonus_section}}",
        },
        calculatorTableHtml: structuralCalculatorTableHtml,
        calculatorTablePlain: structuralCalculatorTablePlain,
        accountGoalPhrase: getVariantGoal(variant.goal),
        isAllianzEletprogram: variant.product === "allianz_eletprogram",
      })

      const variantName = getVariantName(variant)
      const toneLabel = getVariantToneLabel(variant.tone)
      const fileBase = slugifyVariantFileName(`${toneLabel}-${variantName}`)
      const subject = `${baseSubject} | ${toneLabel} | ${variantName}`
      const html = rendered.html || structuralSource.htmlContent || ""
      const plain = rendered.plain || structuralSource.textContent || ""
      const standaloneHtml = buildStandaloneHtmlEmail({
        subject,
        htmlBody: html,
      })
      const eml = buildEmlMessage({
        from: fromAddress,
        to: toAddress,
        subject,
        html,
        plain,
        date: now,
      })
      variantItems.push({
        id: randomUUID(),
        name: `${toneLabel} - ${variantName}`,
        tone: variant.tone,
        product: variant.product,
        currency: variant.currency,
        goal: variant.goal,
        emlFileName: `${fileBase}.eml`,
        htmlFileName: `${fileBase}.html`,
        subject,
        htmlContent: standaloneHtml,
        plainContent: plain,
        emlContent: eml,
      })
    }
    const savedBundle = await upsertTemplateVariantBundle(session, template.id, variantItems)

    if (payload.skipZip) {
      return NextResponse.json({
        ok: true,
        createdCount: variantItems.length,
        variantBundleUpdatedAt: savedBundle.updatedAt,
        variants: payload.includeVariants ? variantItems : undefined,
      })
    }

    const zip = new JSZip()
    const tableMapping = template.mappings.find((mapping) => mapping.key === "calculator_table")
    const calculatorTableHtml = buildCalculatorTableHtmlFromTemplate(payload.values, tableMapping?.sourceSnippet)
    const calculatorTablePlain = buildCalculatorTablePlain(payload.values)
    for (const variant of variantItems) {
      const materialized = buildStoredTemplateVariantArtifacts({
        variant,
        mappings: template.mappings || [],
        safeName: payload.safeName,
        safeUntil: payload.safeUntil,
        displayCurrency: variant.currency,
        values: payload.values,
        calculatorTableHtml,
        calculatorTablePlain,
        subject: variant.subject,
        fromAddress,
        toAddress,
        date: now,
      })
      zip.file(`eml/${variant.emlFileName}`, materialized.eml)
      zip.file(`html/${variant.htmlFileName}`, materialized.standaloneHtml)
    }
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })
    const zipBase64 = zipBuffer.toString("base64")
    const zipFileName = `eml-varians-csomag-${slugifyVariantFileName(template.name)}.zip`

    return NextResponse.json({
      ok: true,
      zipBase64,
      zipFileName,
      createdCount: variantItems.length,
      variantBundleUpdatedAt: savedBundle.updatedAt,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Variáns generálási hiba."
    return NextResponse.json({ message }, { status: 400 })
  }
}
