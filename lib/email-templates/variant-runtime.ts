import { buildEmlMessage } from "@/lib/email-templates/eml"
import { buildStandaloneHtmlEmail } from "@/lib/email-templates/html-export"
import { getFixedAmountValues } from "@/lib/email-templates/fixed-amounts"
import { renderEmailTemplate } from "@/lib/email-templates/render"
import type { TemplateFieldMapping, TemplateVariantItem, TemplateVariantRuntimeValues } from "@/lib/email-templates/types"

type VariantRenderInput = {
  variant: TemplateVariantItem
  mappings: TemplateFieldMapping[]
  safeName: string
  safeUntil: string
  displayCurrency: "HUF" | "EUR" | "USD"
  values: TemplateVariantRuntimeValues
  calculatorTableHtml: string
  calculatorTablePlain: string
  subject?: string
  previewMode?: boolean
}

type VariantArtifactInput = VariantRenderInput & {
  fromAddress: string
  toAddress: string
  date: Date
}

function toTemplateCurrencyLabel(currency: "HUF" | "EUR" | "USD"): string {
  return currency === "HUF" ? "Ft" : currency
}

function toVariantGoalPhrase(goal: TemplateVariantItem["goal"]): string {
  return goal === "nyugdij" ? "nyugdíj" : "tőkenövelés"
}

function extractRenderableHtmlBody(input: string): string {
  const raw = String(input || "").trim()
  if (!raw) return ""
  const bodyMatch = raw.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)
  if (bodyMatch?.[1]?.trim()) return bodyMatch[1].trim()
  return raw.replace(/<!doctype[^>]*>/gi, "").trim()
}

function simplifyPreviewInlineImages(input: string): string {
  return input.replace(
    /<img\b[^>]*\bsrc=(["'])data:image\/[^"']*\1[^>]*>/gi,
    '<div data-dm-preview-image-truncated="true" style="margin:8px 0;padding:10px 12px;border:1px dashed #9ca3af;border-radius:6px;background:#f8fafc;color:#475569;font-size:12px;">Inline kép az előnézetben egyszerűsítve. Kuldeskor a teljes kep megy ki.</div>',
  )
}

export function renderStoredTemplateVariant(input: VariantRenderInput): {
  subject: string
  html: string
  plain: string
} {
  const sourceHtml = input.previewMode
    ? simplifyPreviewInlineImages(extractRenderableHtmlBody(input.variant.htmlContent || ""))
    : extractRenderableHtmlBody(input.variant.htmlContent || "")
  const fixedAmounts = getFixedAmountValues(input.displayCurrency)
  const rendered = renderEmailTemplate({
    template: {
      htmlContent: sourceHtml,
      textContent: input.variant.plainContent || "",
      mappings: input.mappings || [],
    },
    values: {
      name: input.safeName,
      amount: input.values.monthlyPayment,
      deadline: input.safeUntil,
      currency: toTemplateCurrencyLabel(input.displayCurrency),
      tone: input.variant.tone === "tegezo" ? "Kedves" : "Tisztelt",
      calculator_table: "{{calculator_table}}",
      fixed_small_amount: fixedAmounts.fixedSmallAmount,
      fixed_large_amount: fixedAmounts.fixedLargeAmount,
      retirement_section: "{{retirement_section}}",
      bonus_section: "{{bonus_section}}",
    },
    calculatorTableHtml: input.calculatorTableHtml,
    calculatorTablePlain: input.calculatorTablePlain,
    accountGoalPhrase: toVariantGoalPhrase(input.variant.goal),
    isAllianzEletprogram: input.variant.product === "allianz_eletprogram",
  })

  return {
    subject: input.subject || input.variant.subject || "",
    html: rendered.html || input.variant.htmlContent || "",
    plain: rendered.plain || input.variant.plainContent || "",
  }
}

export function buildStoredTemplateVariantArtifacts(input: VariantArtifactInput): {
  subject: string
  html: string
  plain: string
  standaloneHtml: string
  eml: string
} {
  const rendered = renderStoredTemplateVariant(input)
  return {
    ...rendered,
    standaloneHtml: buildStandaloneHtmlEmail({
      subject: rendered.subject,
      htmlBody: rendered.html,
    }),
    eml: buildEmlMessage({
      from: input.fromAddress,
      to: input.toAddress,
      subject: rendered.subject,
      html: rendered.html,
      plain: rendered.plain,
      date: input.date,
    }),
  }
}
