"use client"

import { useMemo, useState, useEffect, useRef, type MouseEvent as ReactMouseEvent, type DragEvent as ReactDragEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Table2, LayoutGrid, Copy, Upload, Wand2, Save, Trash2, ChevronDown, Plus } from "lucide-react"
import { useCalculatorData, type CalculatorData } from "@/lib/calculator-context"
import { convertForDisplay } from "@/lib/currency-conversion"
import { formatNumber, parseNumber } from "@/lib/format-number"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ColumnHoverInfoPanel } from "@/components/column-hover-info-panel"
import { resolveProductContextKey } from "@/lib/column-explanations"
import { getAvailableProductsForInsurerFromCatalog, getProductLabelFromCatalog } from "@/lib/product-catalog/ui"
import { buildSummaryEmailTemplate, getSummaryEmailTone } from "@/lib/summary-email/template"
import type {
  EmailTemplateFieldKey,
  EmailTemplateSourceType,
  ToneConversionMode,
  TemplateFieldMapping,
  TemplateVariantRuntimeValues,
} from "@/lib/email-templates/types"
import { renderEmailTemplate } from "@/lib/email-templates/render"
import {
  buildCalculatorTableHtmlFromTemplate,
  buildCalculatorTablePlain,
} from "@/lib/email-templates/calculator-table"
import { getFixedAmountValues } from "@/lib/email-templates/fixed-amounts"
import { selectTemplateVariant } from "@/lib/email-templates/variant-selection"
import type { TemplateVariantItem } from "@/lib/email-templates/types"
import { buildStoredTemplateVariantArtifacts, renderStoredTemplateVariant } from "@/lib/email-templates/variant-runtime"
import { convertExtraEmailTablePaymentAmount } from "@/lib/email-templates/extra-email-table"
import { buildYearlyPlan } from "@/lib/plan"
import { calculate, type InputsDaily, type Currency, type PaymentFrequency, type ProductId } from "@/lib/engine"
import { getFortisVariantConfig } from "@/lib/engine/products/alfa-fortis-config"
import { getJadeVariantConfig } from "@/lib/engine/products/alfa-jade-config"
import { JOVOKEP_EXTRAORDINARY_ADMIN_FEE_PERCENT } from "@/lib/engine/products/alfa-jovokep-config"
import {
  JOVOTERVEZO_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT,
  JOVOTERVEZO_EXTRAORDINARY_ADMIN_FEE_PERCENT,
} from "@/lib/engine/products/alfa-jovotervezo-config"
import {
  getPremiumSelectionVariantConfig,
  PREMIUM_SELECTION_EXTRAORDINARY_ADMIN_FEE_PERCENT,
  resolvePremiumSelectionAccountMaintenanceMonthlyPercent,
} from "@/lib/engine/products/alfa-premium-selection-config"
import {
  ZEN_PRO_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT,
  ZEN_PRO_EXTRAORDINARY_ADMIN_FEE_PERCENT,
} from "@/lib/engine/products/alfa-zen-pro-config"
import {
  GENERALI_KABALA_U91_EXTRA_DISTRIBUTION_FEE_PERCENT,
  resolveGeneraliKabalaU91AccountMaintenanceMonthlyPercent,
} from "@/lib/engine/products/generali-kabala-u91-config"

type RowKey =
  | "accountName"
  | "accountGoal"
  | "monthlyPayment"
  | "yearlyPayment"
  | "years"
  | "totalContributions"
  | "strategy"
  | "annualYield"
  | "totalReturn"
  | "endBalance"
  | "totalTaxCredit"
  | "totalBonus"
  | "netEndBalance"
  | "netEndBalanceWithTax"
  | "endBalanceHufCurrent"
  | "endBalanceEUR500"
  | "endBalanceEUR600"
  | "finalEndBalance"
  | "netFinalEndBalance"

type SummaryOverrides = {
  [key: string]: {
    label?: string
    value?: number | string
  }
}

const SUMMARY_ROW_INFO_KEY_BY_ROW: Partial<Record<RowKey, string>> = {
  monthlyPayment: "payment",
  yearlyPayment: "payment",
  years: "duration",
  totalContributions: "totalContributions",
  annualYield: "annualYield",
  totalReturn: "netReturn",
  endBalance: "balance",
  totalTaxCredit: "taxCredit",
  totalBonus: "bonus",
  netEndBalance: "balance",
  netEndBalanceWithTax: "balance",
  finalEndBalance: "balance",
  netFinalEndBalance: "balance",
}

const MOBILE_SUMMARY_LAYOUT = {
  toolbarGrid: "grid w-full items-end gap-3 rounded-lg border bg-card px-3 py-3 grid-cols-1 min-[560px]:grid-cols-2 lg:grid-cols-12",
  field: "grid gap-1 min-w-0",
  button: "min-h-10 h-auto w-full whitespace-normal break-words text-left leading-tight py-2 min-[560px]:w-auto lg:w-full lg:justify-center lg:text-center",
  input: "h-10 w-full",
  helperText: "text-xs text-muted-foreground min-[560px]:col-span-2 lg:col-span-12",
} as const

type StoredEmailTemplate = {
  id: string
  name: string
  ownerId: string
  ownerRole: "admin" | "user"
  sourceType: EmailTemplateSourceType
  mappings: TemplateFieldMapping[]
  updatedAt: string
  variantBundle?: {
    templateId: string
    updatedAt: string
    variants: Array<{
      id: string
      name: string
      tone: "magazo" | "tegezo"
      product: "allianz_eletprogram" | "allianz_bonusz_eletprogram"
      currency: "HUF" | "EUR"
      goal: "tokenoveles" | "nyugdij"
      emlFileName: string
      htmlFileName: string
      subject: string
      htmlContent: string
      plainContent: string
      emlContent: string
    }>
  }
}

type StoredEmailTemplateDetails = {
  id: string
  name: string
  sourceType?: EmailTemplateSourceType
  originalFileName?: string
  rawContent?: string
  originalPreviewHtml?: string
  removeClosingSectionApplied?: boolean
  subject?: string
  htmlContent: string
  textContent: string
  mappings: TemplateFieldMapping[]
  conversionStatus?: "none" | "pending_review" | "approved" | "rejected"
  conversionTargetTone?: "tegezo"
  convertedSubject?: string
  convertedHtmlContent?: string
  convertedTextContent?: string
  conversionNotes?: string
  variantBundle?: StoredEmailTemplate["variantBundle"]
}

type OfferUntilStoragePayload = {
  value: string
  editedOn: string
}

type SelectedTemplateByUserStoragePayload = Record<string, string>
type LastSelectedTemplateStoragePayload = {
  id: string
  name?: string
  ownerId?: string
  isAdminView?: boolean
  userId?: string
  updatedAt?: number
}

type TemplateConversionData = {
  convertedSubject?: string
  convertedHtmlContent?: string
  convertedTextContent?: string
}

type ParsedTemplateClientResult = {
  suggestedSubject?: string
  mappings: TemplateFieldMapping[]
  conversionData: TemplateConversionData | null
}

type SaveTemplateOverrides = {
  name: string
  sourceType: EmailTemplateSourceType
  originalFileName?: string
  rawContent: string
  removeClosingSection?: boolean
  suggestedSubject?: string
  mappings: TemplateFieldMapping[]
  conversionData: TemplateConversionData | null
}
type ParsedTemplateRequestResult = {
  candidate?: {
    htmlContent: string
    textContent: string
    suggestedMappings: TemplateFieldMapping[]
    subject?: string
    conversionSuggestion?: {
      modeUsed?: ToneConversionMode
      convertedSubject?: string
      convertedHtmlContent?: string
      convertedTextContent?: string
    }
  }
  conversionSkippedReason?: string
  message?: string
}
type TemplateUploaderOpenByUserStoragePayload = Record<string, boolean>
type ExcelViewByUserStoragePayload = Record<string, boolean>

type AutosaveStatus = "idle" | "saving" | "saved" | "failed"

const TEMPLATE_FIELD_LABELS: Record<EmailTemplateFieldKey, string> = {
  name: "Név",
  amount: "Összeg",
  deadline: "Határidő",
  currency: "Pénznem",
  tone: "Hangnem",
  calculator_table: "Kalkulátor táblázat",
  fixed_small_amount: "Fix kis összeg",
  fixed_large_amount: "Fix nagy összeg",
  retirement_section: "Nyugdíj szekció",
  bonus_section: "Bónusz szekció",
}

const RENDERED_SNAPSHOT_MARKER = "<!--dm-rendered-snapshot-->"
const TEMPLATE_DRAFT_STORAGE_KEY = "summary-emailTemplateDraft-v1"
const SELECTED_TEMPLATE_BY_USER_STORAGE_KEY = "summary-selectedTemplateByUser-v1"
const LAST_SELECTED_TEMPLATE_STORAGE_KEY = "summary-lastSelectedTemplate-v1"
const TEMPLATE_UPLOADER_OPEN_BY_USER_STORAGE_KEY = "summary-templateUploaderOpenByUser-v1"
const EXCEL_VIEW_BY_USER_STORAGE_KEY = "summary-excelViewByUser-v1"
const LAST_SESSION_USER_ID_STORAGE_KEY = "summary-lastSessionUserId-v1"
const LAST_TEMPLATE_ADMIN_VIEW_STORAGE_KEY = "summary-lastTemplateAdminView-v1"

const DEFAULT_TEMPLATE_MAPPINGS: TemplateFieldMapping[] = [
  { key: "name", label: TEMPLATE_FIELD_LABELS.name, token: "{{name}}" },
  { key: "amount", label: TEMPLATE_FIELD_LABELS.amount, token: "{{amount}}" },
  { key: "deadline", label: TEMPLATE_FIELD_LABELS.deadline, token: "{{deadline}}" },
  { key: "currency", label: TEMPLATE_FIELD_LABELS.currency, token: "{{currency}}" },
  { key: "tone", label: TEMPLATE_FIELD_LABELS.tone, token: "{{tone}}" },
  { key: "calculator_table", label: TEMPLATE_FIELD_LABELS.calculator_table, token: "{{calculator_table}}" },
  { key: "fixed_small_amount", label: TEMPLATE_FIELD_LABELS.fixed_small_amount, token: "{{fixed_small_amount}}" },
  { key: "fixed_large_amount", label: TEMPLATE_FIELD_LABELS.fixed_large_amount, token: "{{fixed_large_amount}}" },
  { key: "retirement_section", label: TEMPLATE_FIELD_LABELS.retirement_section, token: "{{retirement_section}}" },
  { key: "bonus_section", label: TEMPLATE_FIELD_LABELS.bonus_section, token: "{{bonus_section}}" },
]

function cloneDefaultTemplateMappings(): TemplateFieldMapping[] {
  return DEFAULT_TEMPLATE_MAPPINGS.map((item) => ({ ...item }))
}

function toSafeTemplateMappings(input: unknown): TemplateFieldMapping[] {
  if (!Array.isArray(input)) return cloneDefaultTemplateMappings()
  const allowedKeys = new Set<EmailTemplateFieldKey>(Object.keys(TEMPLATE_FIELD_LABELS) as EmailTemplateFieldKey[])
  const items = input
    .map((item) => (typeof item === "object" && item ? (item as Partial<TemplateFieldMapping>) : null))
    .filter((item): item is Partial<TemplateFieldMapping> => Boolean(item))
    .filter((item) => typeof item.key === "string" && allowedKeys.has(item.key as EmailTemplateFieldKey))
    .map((item) => ({
      key: item.key as EmailTemplateFieldKey,
      label: typeof item.label === "string" && item.label.trim() ? item.label : TEMPLATE_FIELD_LABELS[item.key as EmailTemplateFieldKey],
      token:
        typeof item.token === "string" && item.token.trim()
          ? item.token
          : `{{${item.key as EmailTemplateFieldKey}}}`,
      sourceSnippet: typeof item.sourceSnippet === "string" && item.sourceSnippet ? item.sourceSnippet : undefined,
      confidence: typeof item.confidence === "number" ? item.confidence : undefined,
    }))
  if (items.length === 0) return cloneDefaultTemplateMappings()
  return items
}

function inferSourceTypeFromFileName(fileName: string): EmailTemplateSourceType | null {
  const lower = fileName.trim().toLowerCase()
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "html"
  if (lower.endsWith(".txt")) return "text"
  if (lower.endsWith(".eml")) return "eml"
  return null
}

type DurationUnit = "year" | "month" | "day"

type CalculatorSnapshot = {
  inputs: InputsDaily
  durationUnit: DurationUnit
  durationValue: number
  selectedInsurer: string | null
  selectedProduct: string | null
  enableNetting: boolean
  indexByYear: Record<number, number>
  paymentByYear: Record<number, number>
  withdrawalByYear: Record<number, number>
  taxCreditAmountByYear: Record<number, number>
  taxCreditLimitByYear: Record<number, number>
  investedShareByYear: Record<number, number>
  redemptionFeeByYear: Record<number, number>
  assetCostPercentByYear: Record<number, number>
  plusCostByYear: Record<number, number>
  bonusPercentByYear: Record<number, number>
  isAccountSplitOpen: boolean
  isRedemptionOpen: boolean
  isTaxBonusSeparateAccount: boolean
  eseti: EsetiSnapshot | null
}

type StoredCustomEntryAccount = "client" | "invested" | "taxBonus" | "main" | "eseti"
type StoredCustomEntryValueType = "percent" | "amount"
type StoredManagementFeeFrequency = PaymentFrequency

type EsetiBaseInputs = {
  regularPayment: number
  frequency: PaymentFrequency
  annualYieldPercent: number
  annualIndexPercent: number
  keepYearlyPayment: boolean
}

type StoredManagementFee = {
  id: string
  label: string
  frequency: StoredManagementFeeFrequency
  valueType: StoredCustomEntryValueType
  value: number
  valueByYear?: Record<number, number>
  account: StoredCustomEntryAccount
  dayOfMonth?: number
  month?: number
}

type StoredBonus = {
  id: string
  valueType: StoredCustomEntryValueType
  value: number
  label?: string
  valueByYear?: Record<number, number>
  account: StoredCustomEntryAccount
  frequency?: StoredManagementFeeFrequency
  dayOfMonth?: number
  month?: number
  baseMode?: "contribution" | "asset" | "costRefundAll" | "costRefundCustom"
}

type SummaryCustomEntryDefinition = {
  id: string
  label: string
  kind: "cost" | "bonus"
  valueType: StoredCustomEntryValueType
  value: number
  valueByYear?: Record<number, number>
  account: StoredCustomEntryAccount
  frequency?: StoredManagementFeeFrequency
  startYear?: number
  stopYear?: number
  dayOfMonth?: number
  month?: number
  baseMode?: "contribution" | "asset" | "costRefundAll" | "costRefundCustom"
}

type EsetiSnapshot = {
  durationUnit: DurationUnit
  durationValue: number
  baseInputs: EsetiBaseInputs
  frequency: PaymentFrequency
  indexByYear: Record<number, number>
  paymentByYear: Record<number, number>
  withdrawalByYear: Record<number, number>
  indexByYearTaxEligible: Record<number, number>
  paymentByYearTaxEligible: Record<number, number>
  withdrawalByYearTaxEligible: Record<number, number>
  accountMaintenancePercentByYear: Record<number, number>
  redemptionFeeDefaultPercent: number
  managementFees: StoredManagementFee[]
  bonuses: StoredBonus[]
}

type EsetiSummaryRow = {
  key: string
  defaultLabel: string
  value: number | string
  isNumeric: boolean
  sourceData: CalculatorData
  highlight?: "header" | "details" | "primary" | "secondary" | "default"
  showCurrency?: boolean
  suffix?: string
  valueCurrency?: Currency
  displayCurrency?: Currency
  fullWidth?: boolean
}

type ExtraEmailTableConfig = {
  id: string
  selectedProduct: string
  currency: Currency
  frequency: PaymentFrequency
  paymentAmount: number
  durationYears: number
  annualYieldPercent: number
  enableTaxCredit: boolean
}

type ExtraEmailTableArtifacts = {
  id: string
  html: string
  plain: string
}

const SESSION_EXTRA_EMAIL_TABLE_ATTR = "data-dm-session-extra-table"

function sanitizePreviewHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    // Preview-only fallback for inline base64 images:
    // keep send path untouched, but avoid heavy DOM freezes in the editor.
    .replace(
      /<img\b[^>]*\bsrc=(["'])data:image\/[^"']*\1[^>]*>/gi,
      '<div data-dm-preview-image-truncated="true" style="margin:8px 0;padding:10px 12px;border:1px dashed #9ca3af;border-radius:6px;background:#f8fafc;color:#475569;font-size:12px;">Inline kép az előnézetben egyszerűsítve. Kuldeskor a teljes kep megy ki.</div>',
    )
}

function stripSessionExtraEmailTables(input: string): string {
  return input.replace(
    new RegExp(`<div\\b[^>]*${SESSION_EXTRA_EMAIL_TABLE_ATTR}=(["'])true\\1[^>]*>[\\s\\S]*?<\\/div>`, "gi"),
    "",
  )
}

function sanitizeStoredHtml(input: string): string {
  return stripSessionExtraEmailTables(input)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
}

function normalizeEditablePreviewHtml(input: string): string {
  return input.replace(
    /<(div|p)(\b[^>]*)>(?:\s|&nbsp;|&#160;|\u00a0)+<\/\1>/gi,
    (_match, tagName: string, attrs: string) => `<${tagName}${attrs}><br></${tagName}>`,
  )
}

function looksLikeHtmlContent(input: string): boolean {
  const raw = String(input || "").trim()
  if (!raw) return false
  return /<\s*(?:!doctype|html|body|head|table|div|p|span|section|article|header|footer|main|a|img)\b/i.test(raw)
}

function buildOriginalRawPreviewHtml(sourceType: EmailTemplateSourceType | undefined, rawContent: string): string {
  const normalizedRawContent = String(rawContent || "")
  const shouldUseRawContentPreview =
    (sourceType === "html" && normalizedRawContent.trim().length > 0) ||
    (!sourceType && looksLikeHtmlContent(normalizedRawContent))
  return shouldUseRawContentPreview ? normalizedRawContent : ""
}

function toConvertedPreviewHtml(convertedHtmlContent?: string, convertedTextContent?: string): string {
  if (convertedHtmlContent?.trim()) return sanitizePreviewHtml(convertedHtmlContent)
  if (convertedTextContent?.trim()) return sanitizePreviewHtml(`<pre>${convertedTextContent}</pre>`)
  return ""
}

function stripSnapshotMarker(input: string): string {
  return input.replace(RENDERED_SNAPSHOT_MARKER, "").trim()
}

function buildTemplateFieldAutosaveSignature(input: {
  templateId: string
  name: string
  subject: string
  mappings: TemplateFieldMapping[]
  conversionData: TemplateConversionData | null
}) {
  return JSON.stringify({
    templateId: input.templateId.trim(),
    name: input.name.trim(),
    subject: input.subject.trim(),
    mappings: input.mappings.map((mapping) => ({
      key: mapping.key,
      label: mapping.label,
      token: mapping.token,
      sourceSnippet: mapping.sourceSnippet ?? "",
      confidence: mapping.confidence ?? null,
    })),
    conversionData: input.conversionData
      ? {
          convertedSubject: input.conversionData.convertedSubject ?? "",
          convertedHtmlContent: input.conversionData.convertedHtmlContent ?? "",
          convertedTextContent: input.conversionData.convertedTextContent ?? "",
        }
      : null,
  })
}

function buildTemplatePreviewAutosaveSignature(templateId: string, html: string) {
  return `${templateId.trim()}::${sanitizeStoredHtml(html).trim()}`
}

function resolveTemplateContentByTone(
  template: Pick<StoredEmailTemplateDetails, "htmlContent" | "textContent" | "convertedHtmlContent" | "convertedTextContent">,
  emailTegezo: boolean,
) {
  if (emailTegezo && (template.convertedHtmlContent?.trim() || template.convertedTextContent?.trim())) {
    return {
      htmlContent: template.convertedHtmlContent || template.htmlContent || "",
      textContent: template.convertedTextContent || template.textContent || "",
    }
  }
  return {
    htmlContent: template.htmlContent || "",
    textContent: template.textContent || "",
  }
}

function htmlToPlainText(input: string): string {
  if (typeof window !== "undefined") {
    const parser = new DOMParser()
    const doc = parser.parseFromString(input, "text/html")
    return (doc.body?.textContent || "").replace(/\n{3,}/g, "\n\n").trim()
  }
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function toTemplateCurrencyLabel(currency: Currency): string {
  return currency === "HUF" ? "Ft" : currency
}

function getPaymentFrequencyLabel(frequency: PaymentFrequency): string {
  if (frequency === "negyedéves") return "Negyedéves"
  if (frequency === "féléves") return "Féléves"
  if (frequency === "éves") return "Éves"
  return "Havi"
}

function getPeriodsPerYear(frequency: PaymentFrequency): number {
  return frequency === "havi" ? 12 : frequency === "negyedéves" ? 4 : frequency === "féléves" ? 2 : 1
}

function getAllowedCurrenciesForProduct(product: string | null | undefined): Currency[] {
  if (product === "alfa_exclusive_plus") return ["HUF"]
  if (product === "alfa_fortis") return ["HUF", "EUR", "USD"]
  if (product === "alfa_jade") return ["EUR", "USD"]
  if (product === "alfa_jovokep") return ["HUF"]
  if (product === "alfa_jovotervezo") return ["HUF"]
  if (product === "alfa_premium_selection") return ["HUF", "EUR", "USD"]
  if (product === "alfa_relax_plusz") return ["HUF"]
  if (product === "alfa_zen" || product === "alfa_zen_eur") return ["EUR", "USD"]
  if (product === "alfa_zen_pro") return ["HUF", "EUR", "USD"]
  if (product === "generali_kabala") return ["HUF"]
  if (product === "generali_mylife_extra_plusz") return ["HUF"]
  if (product === "cig_esszenciae") return ["HUF", "EUR"]
  if (product === "cig_nyugdijkotvenye") return ["HUF"]
  if (product === "allianz_eletprogram" || product === "allianz_bonusz_eletprogram") return ["HUF", "EUR"]
  if (product === "signal_elorelato_ul001") return ["HUF"]
  if (product === "signal_nyugdij_terv_plusz_ny010") return ["HUF"]
  if (product === "signal_nyugdijprogram_sn005") return ["HUF"]
  if (product === "signal_ongondoskodasi_wl009") return ["HUF"]
  if (product === "union_vienna_age_505") return ["HUF", "EUR", "USD"]
  if (product === "union_vienna_plan_500") return ["HUF", "EUR", "USD"]
  if (product === "union_vienna_time") return ["HUF"]
  if (product === "uniqa_eletcel_275") return ["HUF"]
  if (product === "uniqa_premium_life_190") return ["HUF"]
  if (product === "groupama_next") return ["HUF"]
  if (product === "groupama_easy") return ["HUF"]
  return ["HUF", "EUR", "USD"]
}

function coerceCurrencyForProduct(product: string | null | undefined, currency: Currency): Currency {
  const allowedCurrencies = getAllowedCurrenciesForProduct(product)
  return allowedCurrencies.includes(currency) ? currency : allowedCurrencies[0]
}

function resolveEffectiveCurrencyForProduct(
  product: string | null | undefined,
  currency: Currency,
  enableTaxCredit: boolean,
): Currency {
  if (product === "alfa_jade") return currency === "USD" ? "USD" : "EUR"
  if (product === "alfa_jovokep") return "HUF"
  if (product === "alfa_jovotervezo") return "HUF"
  if (product === "alfa_relax_plusz") return "HUF"
  if (product === "generali_kabala") return "HUF"
  if (product === "generali_mylife_extra_plusz") return "HUF"
  if (product === "cig_esszenciae") return currency === "EUR" ? "EUR" : "HUF"
  if (product === "cig_nyugdijkotvenye") return "HUF"
  if (product === "alfa_zen_pro") return currency === "USD" ? "USD" : currency === "EUR" ? "EUR" : "HUF"
  if (product === "alfa_zen" || product === "alfa_zen_eur") return currency === "USD" ? "USD" : "EUR"
  if (product === "alfa_premium_selection") {
    if (currency === "USD") return "USD"
    if (enableTaxCredit) return currency === "EUR" ? "EUR" : "HUF"
    return currency === "EUR" ? "EUR" : "HUF"
  }
  if (product === "signal_elorelato_ul001") return "HUF"
  if (product === "signal_nyugdij_terv_plusz_ny010") return "HUF"
  if (product === "signal_nyugdijprogram_sn005") return "HUF"
  if (product === "signal_ongondoskodasi_wl009") return "HUF"
  if (product === "union_vienna_age_505") return currency === "USD" ? "USD" : currency === "EUR" ? "EUR" : "HUF"
  if (product === "union_vienna_plan_500") return currency === "USD" ? "USD" : currency === "EUR" ? "EUR" : "HUF"
  if (product === "union_vienna_time") return "HUF"
  if (product === "uniqa_eletcel_275") return "HUF"
  if (product === "uniqa_premium_life_190") return "HUF"
  if (product === "groupama_next") return "HUF"
  if (product === "groupama_easy") return "HUF"
  return currency
}

function resolveEffectiveProductVariantForProduct(
  product: string | null | undefined,
  inputs: InputsDaily,
  effectiveCurrency: Currency,
): string | undefined {
  if (product === "alfa_exclusive_plus") return inputs.enableTaxCredit ? "alfa_exclusive_plus_ny05" : "alfa_exclusive_plus_tr08"
  if (product === "alfa_jade") return effectiveCurrency === "USD" ? "alfa_jade_tr29" : "alfa_jade_tr19"
  if (product === "alfa_jovokep") return "alfa_jovokep_tr10"
  if (product === "alfa_jovotervezo") return "alfa_jovotervezo_tr03"
  if (product === "alfa_relax_plusz") return "alfa_relax_plusz_ny01"
  if (product === "alfa_zen_pro") {
    return effectiveCurrency === "USD" ? "alfa_zen_pro_ny24" : effectiveCurrency === "EUR" ? "alfa_zen_pro_ny14" : "alfa_zen_pro_ny08"
  }
  if (product === "alfa_zen" || product === "alfa_zen_eur") return effectiveCurrency === "USD" ? "alfa_zen_ny23" : "alfa_zen_ny13"
  if (product === "generali_kabala") return inputs.enableTaxCredit ? "generali_kabala_u91_pension" : "generali_kabala_u91_life"
  if (product === "generali_mylife_extra_plusz") {
    return inputs.enableTaxCredit ? "generali_mylife_extra_plusz_u67p_pension" : "generali_mylife_extra_plusz_u67p_life"
  }
  if (product === "cig_esszenciae") return effectiveCurrency === "EUR" ? "cig_esszenciae_eur" : "cig_esszenciae_huf"
  if (product === "cig_nyugdijkotvenye") return "cig_nyugdijkotvenye_nyugdij"
  if (product === "alfa_premium_selection") {
    if (effectiveCurrency === "USD") return inputs.enableTaxCredit ? "alfa_premium_selection_ny22" : "alfa_premium_selection_tr28"
    if (inputs.enableTaxCredit) return effectiveCurrency === "EUR" ? "alfa_premium_selection_ny12" : "alfa_premium_selection_ny06"
    return effectiveCurrency === "EUR" ? "alfa_premium_selection_tr18" : "alfa_premium_selection_tr09"
  }
  if (product === "signal_elorelato_ul001") return "signal_elorelato_ul001_huf"
  if (product === "signal_nyugdij_terv_plusz_ny010") return "signal_nyugdij_terv_plusz_ny010_huf"
  if (product === "signal_nyugdijprogram_sn005") return "signal_nyugdijprogram_sn005_huf"
  if (product === "signal_ongondoskodasi_wl009") return "signal_ongondoskodasi_wl009_huf"
  if (product === "union_vienna_age_505") {
    if (effectiveCurrency === "USD") return (inputs.productVariant ?? "").includes("__bonus_blocked") ? "union_vienna_age_505_usd__bonus_blocked" : "union_vienna_age_505_usd"
    if (effectiveCurrency === "EUR") return (inputs.productVariant ?? "").includes("__bonus_blocked") ? "union_vienna_age_505_eur__bonus_blocked" : "union_vienna_age_505_eur"
    return (inputs.productVariant ?? "").includes("__bonus_blocked") ? "union_vienna_age_505_huf__bonus_blocked" : "union_vienna_age_505_huf"
  }
  if (product === "union_vienna_plan_500") {
    return effectiveCurrency === "USD" ? "union_vienna_plan_500_usd" : effectiveCurrency === "EUR" ? "union_vienna_plan_500_eur" : "union_vienna_plan_500_huf"
  }
  if (product === "union_vienna_time") {
    return inputs.productVariant?.includes("564")
      ? "union_vienna_time_564"
      : inputs.productVariant?.includes("606")
        ? "union_vienna_time_606"
        : "union_vienna_time_584"
  }
  if (product === "uniqa_eletcel_275") return "uniqa_eletcel_275_huf"
  if (product === "uniqa_premium_life_190") return "uniqa_premium_life_190_huf"
  if (product === "groupama_next") {
    return (inputs.productVariant ?? "").includes("ul0")
      ? "groupama_next_ul0_trad100_huf"
      : (inputs.productVariant ?? "").includes("ul75")
        ? "groupama_next_ul75_trad25_huf"
        : "groupama_next_ul100_trad0_huf"
  }
  if (product === "groupama_easy") return inputs.enableTaxCredit ? "groupama_easy_life_tax_huf" : "groupama_easy_life_huf"
  return product ?? undefined
}

function getAllowedFrequenciesForProduct(
  product: string | null | undefined,
  currency: Currency,
  enableTaxCredit: boolean,
  inputs: InputsDaily,
): PaymentFrequency[] {
  const variant = resolveEffectiveProductVariantForProduct(product, { ...inputs, enableTaxCredit }, currency)
  if (variant === "alfa_premium_selection_tr18" || variant === "alfa_premium_selection_tr28" || variant === "alfa_premium_selection_ny22") {
    return ["éves"]
  }
  return ["havi", "negyedéves", "féléves", "éves"]
}

function wrapSessionExtraEmailTableHtml(id: string, html: string): string {
  return `<div ${SESSION_EXTRA_EMAIL_TABLE_ATTR}="true" data-extra-table-id="${id}" style="margin:16px 0;">${html}</div>`
}

function appendExtraTablesAfterPrimaryTable(renderedHtml: string, primaryTableHtml: string, extraHtml: string): string {
  if (!extraHtml.trim()) return renderedHtml
  if (primaryTableHtml.trim() && renderedHtml.includes(primaryTableHtml)) {
    return renderedHtml.replace(primaryTableHtml, `${primaryTableHtml}${extraHtml}`)
  }
  const firstTableEnd = renderedHtml.search(/<\/table>/i)
  if (firstTableEnd >= 0) {
    return `${renderedHtml.slice(0, firstTableEnd + 8)}${extraHtml}${renderedHtml.slice(firstTableEnd + 8)}`
  }
  return `${renderedHtml}${extraHtml}`
}

function normalizeSnippetForField(key: EmailTemplateFieldKey, input: string): string {
  const normalized = input.replace(/\s+/g, " ").trim()
  if (key === "name") {
    return normalized.replace(/[!?,.;:]+$/g, "").trim()
  }
  return normalized
}

function normalizeHexColorInput(input: string): string | null {
  const raw = String(input ?? "").trim()
  const match = raw.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  if (!match) return null
  const hex = match[1]
  const normalized =
    hex.length === 3
      ? hex
          .split("")
          .map((ch) => `${ch}${ch}`)
          .join("")
      : hex
  return `#${normalized.toLowerCase()}`
}

function darkenHexColor(hex: string, ratio: number): string {
  const normalized = normalizeHexColorInput(hex)
  if (!normalized) return hex
  const raw = normalized.slice(1)
  const r = Math.max(0, Math.min(255, Math.round(Number.parseInt(raw.slice(0, 2), 16) * (1 - ratio))))
  const g = Math.max(0, Math.min(255, Math.round(Number.parseInt(raw.slice(2, 4), 16) * (1 - ratio))))
  const b = Math.max(0, Math.min(255, Math.round(Number.parseInt(raw.slice(4, 6), 16) * (1 - ratio))))
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
}

function getYearsFromDuration(durationUnit: DurationUnit, durationValue: number): number {
  if (durationUnit === "month") return durationValue / 12
  if (durationUnit === "day") return durationValue / 365
  return durationValue
}

function buildSummaryCustomEntries(eseti: EsetiSnapshot): SummaryCustomEntryDefinition[] {
  const feeEntries: SummaryCustomEntryDefinition[] = eseti.managementFees.map((fee, index) => ({
    id: fee.id,
    label: fee.label?.trim() || `Egyedi költség ${index + 1}`,
    kind: "cost",
    valueType: fee.valueType,
    value: fee.value,
    valueByYear: fee.valueByYear ?? {},
    account: fee.account,
    frequency: fee.frequency,
    startYear: 1,
    stopYear: 0,
    dayOfMonth: fee.dayOfMonth,
    month: fee.month,
  }))
  const bonusEntries: SummaryCustomEntryDefinition[] = eseti.bonuses.map((bonus, index) => ({
    id: bonus.id,
    label: bonus.label?.trim() || `Egyedi bónusz ${index + 1}`,
    kind: "bonus",
    valueType: bonus.valueType,
    value: bonus.value,
    valueByYear: bonus.valueByYear ?? {},
    account: bonus.account,
    frequency: bonus.frequency ?? "éves",
    startYear: 1,
    stopYear: 0,
    dayOfMonth: bonus.dayOfMonth,
    month: bonus.month,
    baseMode: bonus.baseMode,
  }))
  return [...feeEntries, ...bonusEntries].filter((entry) => entry.account !== "main")
}

function buildSummaryCalculatorData(params: {
  selectedInsurer: string | null
  selectedProduct: string | null
  inputs: InputsDaily
  monthlyPayment: number
  yearlyPayment: number
  yearsValue: number
  effectiveCurrency: Currency
  enableNetting: boolean
  endBalance: number
  totalContributions: number
  totalTaxCredit: number
  totalBonus: number
  totalCost: number
  totalAssetBasedCost: number
  totalRiskInsuranceCost: number
  annualYieldPercent: number
  enableTaxCredit: boolean
  productHasBonus: boolean
}): CalculatorData {
  const {
    selectedInsurer,
    selectedProduct,
    inputs,
    monthlyPayment,
    yearlyPayment,
    yearsValue,
    effectiveCurrency,
    enableNetting,
    endBalance,
    totalContributions,
    totalTaxCredit,
    totalBonus,
    totalCost,
    totalAssetBasedCost,
    totalRiskInsuranceCost,
    annualYieldPercent,
    enableTaxCredit,
    productHasBonus,
  } = params
  const hufRate =
    effectiveCurrency === "EUR" ? inputs.eurToHufRate || 400 : effectiveCurrency === "USD" ? inputs.usdToHufRate || 360 : 1
  const endBalanceHufCurrent = effectiveCurrency !== "HUF" ? endBalance * hufRate : undefined
  const endBalanceHuf500 = effectiveCurrency === "EUR" ? endBalance * 500 : undefined
  const endBalanceHuf600 = effectiveCurrency === "EUR" ? endBalance * 600 : undefined

  return {
    monthlyPayment,
    yearlyPayment,
    years: yearsValue,
    currency: effectiveCurrency,
    displayCurrency: effectiveCurrency,
    eurToHufRate: inputs.eurToHufRate || 400,
    totalContributions,
    totalReturn: endBalance - totalContributions,
    endBalance,
    totalTaxCredit,
    totalBonus,
    totalCost,
    totalAssetBasedCost,
    totalRiskInsuranceCost,
    annualYieldPercent,
    selectedInsurer: selectedInsurer || undefined,
    selectedProduct: selectedProduct || undefined,
    enableTaxCredit,
    enableNetting,
    productHasBonus,
    netEndBalance: endBalance,
    netEndBalanceWithTax: endBalance + totalTaxCredit,
    endBalanceHufCurrent,
    endBalanceEUR500: endBalanceHuf500,
    endBalanceEUR600: endBalanceHuf600,
  }
}

export default function OsszesitesPage() {
  const router = useRouter()
  const { data: contextData, isHydrated, updateData } = useCalculatorData()
  const [activeColumnInfoKey, setActiveColumnInfoKey] = useState<string | null>(null)
  const OFFER_UNTIL_STORAGE_KEY = "summary-emailOfferUntil"
  const FX_BASE_COLOR_STORAGE_KEY = "summary-emailFxBaseColor"
  const EMAIL_CLIENT_NAME_STORAGE_KEY = "summary-emailClientName"

  const getDefaultOfferUntil = () => {
    const pad2 = (n: number) => String(n).padStart(2, "0")
    const now = new Date()
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    d.setDate(d.getDate() + 7)
    return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`
  }
  const getTodayStamp = () => {
    const pad2 = (n: number) => String(n).padStart(2, "0")
    const now = new Date()
    return `${now.getFullYear()}.${pad2(now.getMonth() + 1)}.${pad2(now.getDate())}`
  }

  const [computedData, setComputedData] = useState<CalculatorData | null>(null)
  const [computedEsetiData, setComputedEsetiData] = useState<CalculatorData | null>(null)
  const [calculatorSnapshot, setCalculatorSnapshot] = useState<CalculatorSnapshot | null>(null)
  const [extraEmailTables, setExtraEmailTables] = useState<ExtraEmailTableConfig[]>([])
  const [isComputing, setIsComputing] = useState(false)
  const [fallbackProductLabel, setFallbackProductLabel] = useState<string | null>(null)
  const [enableRealValue, setEnableRealValue] = useState(false)
  const [inflationRate, setInflationRate] = useState(3)

  const [isExcelView, setIsExcelView] = useState(() => {
    if (typeof window === "undefined") return false
    try {
      const userId = (localStorage.getItem(LAST_SESSION_USER_ID_STORAGE_KEY) || "").trim()
      if (!userId) return false
      const raw = localStorage.getItem(EXCEL_VIEW_BY_USER_STORAGE_KEY)
      if (!raw) return false
      const byUser = JSON.parse(raw) as ExcelViewByUserStoragePayload
      return typeof byUser[userId] === "boolean" ? byUser[userId] : false
    } catch {
      return false
    }
  })
  const [summaryOverrides, setSummaryOverrides] = useState<SummaryOverrides>({})
  const [editingCell, setEditingCell] = useState<{ key: RowKey; type: "label" | "value" } | null>(null)
  const [editingText, setEditingText] = useState<string>("")
  const [isActivelyEditing, setIsActivelyEditing] = useState(false)
  const [esetiSummaryOverrides, setEsetiSummaryOverrides] = useState<SummaryOverrides>({})
  const [esetiEditingCell, setEsetiEditingCell] = useState<{ key: string; type: "label" | "value" } | null>(null)
  const [esetiEditingText, setEsetiEditingText] = useState("")
  const [isActivelyEditingEseti, setIsActivelyEditingEseti] = useState(false)
  const regularExcelFirstRowRef = useRef<HTMLTableRowElement | null>(null)
  const regularExcelFirstLabelCellRef = useRef<HTMLTableCellElement | null>(null)
  const regularNormalFirstRowRef = useRef<HTMLDivElement | null>(null)
  const regularNormalFirstLabelCellRef = useRef<HTMLDivElement | null>(null)
  const [esetiColumnWidths, setEsetiColumnWidths] = useState({ label: "50%", value: "50%" })

  const [emailClientName, setEmailClientName] = useState(() => {
    if (typeof window === "undefined") return "Viktor"
    const stored = localStorage.getItem(EMAIL_CLIENT_NAME_STORAGE_KEY)
    return stored !== null ? stored : "Viktor"
  })
  const [emailRecipient, setEmailRecipient] = useState("")
  const [emailOfferUntil, setEmailOfferUntil] = useState(() => {
    // Avoid SSR/client timezone mismatch: compute only in browser.
    if (typeof window === "undefined") return ""
    const storedRaw = localStorage.getItem(OFFER_UNTIL_STORAGE_KEY)
    if (storedRaw) {
      try {
        const parsed = JSON.parse(storedRaw) as Partial<OfferUntilStoragePayload>
        if (
          typeof parsed.value === "string" &&
          /^\d{4}\.\d{2}\.\d{2}$/.test(parsed.value) &&
          typeof parsed.editedOn === "string" &&
          parsed.editedOn === getTodayStamp()
        ) {
          return parsed.value
        }
      } catch {
        // Backward compatibility: legacy plain-string values are treated as non-persistent defaults.
      }
    }
    return getDefaultOfferUntil()
  })
  const [fxBaseColor, setFxBaseColor] = useState(() => {
    if (typeof window === "undefined") return "#c55a11"
    const stored = localStorage.getItem(FX_BASE_COLOR_STORAGE_KEY)
    return normalizeHexColorInput(stored || "") ?? "#c55a11"
  })
  const [emailCopyStatus, setEmailCopyStatus] = useState<"idle" | "copied" | "failed">("idle")
  const [emailSendStatus, setEmailSendStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle")
  const [emailSendError, setEmailSendError] = useState("")
  const [variantBundleStatus, setVariantBundleStatus] = useState<"idle" | "loading" | "done" | "failed">("idle")
  const [variantBundleMessage, setVariantBundleMessage] = useState("")
  const [emailTegezo, setEmailTegezo] = useState(false)
  const [emailTemplates, setEmailTemplates] = useState<StoredEmailTemplate[]>([])
  const [isTemplateAdminView, setIsTemplateAdminView] = useState(() => {
    if (typeof window === "undefined") return false
    try {
      return localStorage.getItem(LAST_TEMPLATE_ADMIN_VIEW_STORAGE_KEY) === "1"
    } catch {
      return false
    }
  })
  const [sessionUserId, setSessionUserId] = useState(() => {
    if (typeof window === "undefined") return ""
    try {
      const stored = localStorage.getItem(LAST_SESSION_USER_ID_STORAGE_KEY)
      return typeof stored === "string" ? stored.trim() : ""
    } catch {
      return ""
    }
  })
  const [isTemplateListLoading, setIsTemplateListLoading] = useState(true)
  const [selectedTemplateId, setSelectedTemplateId] = useState(() => {
    if (typeof window === "undefined") return ""
    try {
      const raw = localStorage.getItem(LAST_SELECTED_TEMPLATE_STORAGE_KEY)
      if (!raw) return ""
      const parsed = JSON.parse(raw) as Partial<LastSelectedTemplateStoragePayload>
      return typeof parsed.id === "string" ? parsed.id.trim() : ""
    } catch {
      return ""
    }
  })
  const [selectedTemplateNameHint, setSelectedTemplateNameHint] = useState(() => {
    if (typeof window === "undefined") return ""
    try {
      const raw = localStorage.getItem(LAST_SELECTED_TEMPLATE_STORAGE_KEY)
      if (!raw) return ""
      const parsed = JSON.parse(raw) as Partial<LastSelectedTemplateStoragePayload>
      return typeof parsed.name === "string" ? parsed.name.trim() : ""
    } catch {
      return ""
    }
  })
  const [selectedTemplateOwnerHint, setSelectedTemplateOwnerHint] = useState(() => {
    if (typeof window === "undefined") return ""
    try {
      const raw = localStorage.getItem(LAST_SELECTED_TEMPLATE_STORAGE_KEY)
      if (!raw) return ""
      const parsed = JSON.parse(raw) as Partial<LastSelectedTemplateStoragePayload>
      return typeof parsed.ownerId === "string" ? parsed.ownerId.trim() : ""
    } catch {
      return ""
    }
  })
  const [templateSourceType, setTemplateSourceType] = useState<EmailTemplateSourceType>("html")
  const [templateRawContent, setTemplateRawContent] = useState("")
  const [templatePreviewHtml, setTemplatePreviewHtml] = useState("")
  const [keepTemplateClosingSection, setKeepTemplateClosingSection] = useState(true)
  const [templateAiPreviewHtml, setTemplateAiPreviewHtml] = useState("")
  const [templateAiPreviewMode, setTemplateAiPreviewMode] = useState<ToneConversionMode | null>(null)
  const [templateConversionData, setTemplateConversionData] = useState<TemplateConversionData | null>(null)
  const [templateRenderedPreviewHtml, setTemplateRenderedPreviewHtml] = useState("")
  const [isRenderedPreviewDirty, setIsRenderedPreviewDirty] = useState(false)
  const [isSelectedTemplateSnapshot, setIsSelectedTemplateSnapshot] = useState(false)
  const [templateRenderedPreviewError, setTemplateRenderedPreviewError] = useState("")
  const [templateConversionMode, setTemplateConversionMode] = useState<ToneConversionMode>("ai_full")
  const [templateSuggestedSubject, setTemplateSuggestedSubject] = useState("")
  const [templateName, setTemplateName] = useState("")
  const [templateOriginalFileName, setTemplateOriginalFileName] = useState("")
  const [templateStatus, setTemplateStatus] = useState<"idle" | "loading" | "saving" | "failed">("idle")
  const [templateError, setTemplateError] = useState("")
  const [templateAutosaveStatus, setTemplateAutosaveStatus] = useState<AutosaveStatus>("idle")
  const [templateAutosaveError, setTemplateAutosaveError] = useState("")
  const [templateLastAutosavedAt, setTemplateLastAutosavedAt] = useState<number | null>(null)
  const [hasHydratedSelectedTemplate, setHasHydratedSelectedTemplate] = useState(false)
  const [isTemplateVariantBundleStale, setIsTemplateVariantBundleStale] = useState(false)
  const [templateSelectedSnippet, setTemplateSelectedSnippet] = useState("")
  const [templateSelectedTableSnippet, setTemplateSelectedTableSnippet] = useState("")
  const [isFxColorPickerOpen, setIsFxColorPickerOpen] = useState(false)
  const [isTemplateUploaderOpen, setIsTemplateUploaderOpen] = useState(() => {
    if (typeof window === "undefined") return true
    try {
      const userId = (localStorage.getItem(LAST_SESSION_USER_ID_STORAGE_KEY) || "").trim()
      if (!userId) return true
      const raw = localStorage.getItem(TEMPLATE_UPLOADER_OPEN_BY_USER_STORAGE_KEY)
      if (!raw) return true
      const byUser = JSON.parse(raw) as TemplateUploaderOpenByUserStoragePayload
      if (typeof byUser[userId] === "boolean") return byUser[userId]
      return true
    } catch {
      return true
    }
  })
  const [isTemplateMappingsOpen, setIsTemplateMappingsOpen] = useState(false)
  const [isTemplateDragActive, setIsTemplateDragActive] = useState(false)
  const [templateMappings, setTemplateMappings] = useState<TemplateFieldMapping[]>(() => cloneDefaultTemplateMappings())
  const [templateSelectionFieldKey, setTemplateSelectionFieldKey] = useState<EmailTemplateFieldKey>("name")
  const [isVariantBundleOpen, setIsVariantBundleOpen] = useState(false)
  const templatePreviewRef = useRef<HTMLDivElement | null>(null)
  const templateRenderedPreviewRef = useRef<HTMLDivElement | null>(null)
  const templateFileInputRef = useRef<HTMLInputElement | null>(null)
  const templateSelectRef = useRef<HTMLSelectElement | null>(null)
  const lastTonePreviewHydrationKeyRef = useRef("")
  const templateAutosaveInFlightRef = useRef(false)
  const lastTemplateFieldAutosaveSignatureRef = useRef("")
  const lastTemplatePreviewAutosaveSignatureRef = useRef("")
  const currentTemplateFieldAutosaveSignature = useMemo(
    () =>
      buildTemplateFieldAutosaveSignature({
        templateId: selectedTemplateId,
        name: templateName,
        subject: templateSuggestedSubject,
        mappings: templateMappings,
        conversionData: templateConversionData,
      }),
    [selectedTemplateId, templateName, templateSuggestedSubject, templateMappings, templateConversionData],
  )
  const currentTemplatePreviewAutosaveSignature = useMemo(
    () => buildTemplatePreviewAutosaveSignature(selectedTemplateId, templateRenderedPreviewHtml),
    [selectedTemplateId, templateRenderedPreviewHtml],
  )

  const updateTemplateListEntry = (
    templateId: string,
    updates: {
      name?: string
      variantBundle?: StoredEmailTemplate["variantBundle"] | null
    },
  ) => {
    setEmailTemplates((current) =>
      current.map((template) =>
        template.id === templateId
          ? {
              ...template,
              ...(updates.name !== undefined ? { name: updates.name } : {}),
              ...(updates.variantBundle === null
                ? { variantBundle: undefined }
                : updates.variantBundle !== undefined
                  ? { variantBundle: updates.variantBundle }
                  : {}),
            }
          : template,
      ),
    )
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    const trimmed = emailOfferUntil.trim()
    if (trimmed && /^\d{4}\.\d{2}\.\d{2}$/.test(trimmed)) {
      const payload: OfferUntilStoragePayload = {
        value: trimmed,
        editedOn: getTodayStamp(),
      }
      localStorage.setItem(OFFER_UNTIL_STORAGE_KEY, JSON.stringify(payload))
      return
    }
    localStorage.removeItem(OFFER_UNTIL_STORAGE_KEY)
  }, [emailOfferUntil])

  useEffect(() => {
    if (typeof window === "undefined") return
    const normalized = normalizeHexColorInput(fxBaseColor)
    if (!normalized) return
    localStorage.setItem(FX_BASE_COLOR_STORAGE_KEY, normalized)
  }, [fxBaseColor])

  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem(EMAIL_CLIENT_NAME_STORAGE_KEY, emailClientName)
  }, [emailClientName])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (selectedTemplateId.trim()) return
    const raw = sessionStorage.getItem(TEMPLATE_DRAFT_STORAGE_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as Partial<{
        templateSourceType: EmailTemplateSourceType
        templateRawContent: string
        templatePreviewHtml: string
        keepTemplateClosingSection: boolean
        templateName: string
        templateOriginalFileName: string
        templateSuggestedSubject: string
        templateMappings: TemplateFieldMapping[]
        isTemplateMappingsOpen: boolean
      }>
      if (parsed.templateSourceType && ["html", "text", "eml"].includes(parsed.templateSourceType)) {
        setTemplateSourceType(parsed.templateSourceType)
      }
      if (typeof parsed.templateRawContent === "string") setTemplateRawContent(parsed.templateRawContent)
      if (typeof parsed.templatePreviewHtml === "string") setTemplatePreviewHtml(parsed.templatePreviewHtml)
      if (typeof parsed.keepTemplateClosingSection === "boolean") setKeepTemplateClosingSection(parsed.keepTemplateClosingSection)
      if (typeof parsed.templateName === "string") setTemplateName(parsed.templateName)
      if (typeof parsed.templateOriginalFileName === "string") setTemplateOriginalFileName(parsed.templateOriginalFileName)
      if (typeof parsed.templateSuggestedSubject === "string") setTemplateSuggestedSubject(parsed.templateSuggestedSubject)
      if (typeof parsed.isTemplateMappingsOpen === "boolean") setIsTemplateMappingsOpen(parsed.isTemplateMappingsOpen)
      setTemplateMappings(toSafeTemplateMappings(parsed.templateMappings))
    } catch {
      // ignore malformed session data
    }
  }, [selectedTemplateId])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (selectedTemplateId.trim()) {
      sessionStorage.removeItem(TEMPLATE_DRAFT_STORAGE_KEY)
      return
    }
    const hasDraft = Boolean(
      templateRawContent.trim() || templatePreviewHtml.trim() || templateName.trim() || templateOriginalFileName.trim(),
    )
    if (!hasDraft) {
      sessionStorage.removeItem(TEMPLATE_DRAFT_STORAGE_KEY)
      return
    }
    if (templateRawContent.length > 2_500_000) return
    const payload = {
      templateSourceType,
      templateRawContent,
      templatePreviewHtml,
      keepTemplateClosingSection,
      templateName,
      templateOriginalFileName,
      templateSuggestedSubject,
      templateMappings,
      isTemplateMappingsOpen,
      updatedAt: Date.now(),
    }
    try {
      sessionStorage.setItem(TEMPLATE_DRAFT_STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // storage quota might be full; keep runtime state only
    }
  }, [
    templateSourceType,
    templateRawContent,
    templatePreviewHtml,
    keepTemplateClosingSection,
    templateName,
    templateOriginalFileName,
    templateSuggestedSubject,
    templateMappings,
    isTemplateMappingsOpen,
    selectedTemplateId,
  ])

  const loadEmailTemplates = async () => {
    setIsTemplateListLoading(true)
    try {
      const response = await fetch("/api/email-templates")
      const result = await response.json().catch(() => ({}))
      if (!response.ok) return
      const templates = Array.isArray(result?.templates) ? (result.templates as StoredEmailTemplate[]) : []
      const userId = typeof result?.userId === "string" ? result.userId.trim() : ""
      setSessionUserId(userId)
      if (typeof window !== "undefined" && userId) {
        try {
          localStorage.setItem(LAST_SESSION_USER_ID_STORAGE_KEY, userId)
        } catch {
          // ignore local storage errors
        }
      }
      setEmailTemplates(templates)
      const isAdmin = Boolean(result?.isAdmin)
      setIsTemplateAdminView(isAdmin)
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LAST_TEMPLATE_ADMIN_VIEW_STORAGE_KEY, isAdmin ? "1" : "0")
        } catch {
          // ignore local storage errors
        }
      }
      if (typeof window !== "undefined" && userId) {
        try {
          const raw = localStorage.getItem(SELECTED_TEMPLATE_BY_USER_STORAGE_KEY)
          if (raw) {
            const byUser = JSON.parse(raw) as SelectedTemplateByUserStoragePayload
            const rememberedTemplateId = typeof byUser?.[userId] === "string" ? byUser[userId].trim() : ""
            if (rememberedTemplateId && templates.some((template) => template.id === rememberedTemplateId)) {
              setSelectedTemplateId((current) => (current.trim() ? current : rememberedTemplateId))
              setSelectedTemplateNameHint((current) => {
                if (current.trim()) return current
                const remembered = templates.find((template) => template.id === rememberedTemplateId)
                return remembered?.name || current
              })
              setSelectedTemplateOwnerHint((current) => {
                if (current.trim()) return current
                const remembered = templates.find((template) => template.id === rememberedTemplateId)
                return remembered?.ownerId || current
              })
            }
          }
        } catch {
          // ignore malformed local storage payload
        }
      }
    } catch {
      // ignore list errors in main page flow
    } finally {
      setIsTemplateListLoading(false)
    }
  }

  useEffect(() => {
    void loadEmailTemplates()
  }, [])

  useEffect(() => {
    const id = selectedTemplateId.trim()
    if (!id) {
      setIsSelectedTemplateSnapshot(false)
      setHasHydratedSelectedTemplate(false)
      setTemplateAutosaveStatus("idle")
      setTemplateAutosaveError("")
      setTemplateLastAutosavedAt(null)
      setIsTemplateVariantBundleStale(false)
      lastTemplateFieldAutosaveSignatureRef.current = ""
      lastTemplatePreviewAutosaveSignatureRef.current = ""
      return
    }

    let cancelled = false
    const loadSelectedTemplateDetails = async () => {
      setTemplateStatus("loading")
      setTemplateError("")
      try {
        const response = await fetch(`/api/email-templates/${encodeURIComponent(id)}`)
        const result = await response.json().catch(() => ({}))
        if (!response.ok || !result?.template) {
          if (!cancelled) {
            setTemplateStatus("failed")
            setTemplateError(
              typeof result?.message === "string" && result.message ? result.message : "Nem sikerült betölteni a kiválasztott sablont.",
            )
          }
          return
        }

        const template = result.template as StoredEmailTemplateDetails
        const isSnapshotTemplate = (template.htmlContent || "").includes(RENDERED_SNAPSHOT_MARKER)
        const rawContent = typeof template.rawContent === "string" ? template.rawContent : ""
        const originalRawPreviewHtml =
          typeof template.originalPreviewHtml === "string"
            ? template.originalPreviewHtml
            : buildOriginalRawPreviewHtml(template.sourceType, rawContent)
        const previewHtml = originalRawPreviewHtml
          ? originalRawPreviewHtml
          : isSnapshotTemplate
            ? stripSnapshotMarker(template.htmlContent || "")
            : template.htmlContent || (template.textContent ? `<pre>${template.textContent}</pre>` : "")
        const nextConversionData =
          template.convertedSubject || template.convertedHtmlContent || template.convertedTextContent
            ? {
                convertedSubject: template.convertedSubject,
                convertedHtmlContent: template.convertedHtmlContent,
                convertedTextContent: template.convertedTextContent,
              }
            : null

        if (!cancelled) {
          setTemplateName(template.name || "")
          if (template.sourceType) setTemplateSourceType(template.sourceType)
          setTemplateOriginalFileName(template.originalFileName || "")
          setTemplateRawContent(template.rawContent || template.htmlContent || template.textContent || "")
          if (typeof template.removeClosingSectionApplied === "boolean") {
            setKeepTemplateClosingSection(!template.removeClosingSectionApplied)
          }
          setTemplateSuggestedSubject(template.subject || "")
          setTemplatePreviewHtml(sanitizePreviewHtml(previewHtml))
          setTemplateAiPreviewHtml(toConvertedPreviewHtml(template.convertedHtmlContent, template.convertedTextContent))
          setTemplateAiPreviewMode(null)
          setTemplateConversionData(nextConversionData)
          setIsRenderedPreviewDirty(false)
          setIsSelectedTemplateSnapshot(isSnapshotTemplate)
          setHasHydratedSelectedTemplate(true)
          setTemplateAutosaveStatus("idle")
          setTemplateAutosaveError("")
          setTemplateLastAutosavedAt(null)
          setIsTemplateVariantBundleStale(false)
          lastTemplateFieldAutosaveSignatureRef.current = buildTemplateFieldAutosaveSignature({
            templateId: id,
            name: template.name || "",
            subject: template.subject || "",
            mappings: Array.isArray(template.mappings) && template.mappings.length > 0 ? template.mappings : cloneDefaultTemplateMappings(),
            conversionData: nextConversionData,
          })
          lastTemplatePreviewAutosaveSignatureRef.current = ""
          setTemplateSelectedSnippet("")
          setTemplateSelectedTableSnippet("")
          if (Array.isArray(template.mappings) && template.mappings.length > 0) {
            setTemplateMappings(template.mappings)
          }
          setTemplateStatus("idle")
        }
      } catch {
        if (!cancelled) {
          setTemplateStatus("failed")
          setTemplateError("Nem sikerült betölteni a kiválasztott sablont.")
        }
      }
    }

    void loadSelectedTemplateDetails()
    return () => {
      cancelled = true
    }
  }, [selectedTemplateId])

  useEffect(() => {
    if (!selectedTemplateId.trim()) return
    setVariantBundleStatus("idle")
    setVariantBundleMessage("")
    setIsVariantBundleOpen(false)
  }, [selectedTemplateId])

  useEffect(() => {
    if (typeof window === "undefined") return
    const userId = sessionUserId.trim()
    if (!userId) return
    try {
      const raw = localStorage.getItem(SELECTED_TEMPLATE_BY_USER_STORAGE_KEY)
      const byUser = raw ? (JSON.parse(raw) as SelectedTemplateByUserStoragePayload) : {}
      const selectedId = selectedTemplateId.trim()
      if (selectedId) {
        byUser[userId] = selectedId
      } else {
        delete byUser[userId]
      }
      localStorage.setItem(SELECTED_TEMPLATE_BY_USER_STORAGE_KEY, JSON.stringify(byUser))
    } catch {
      // ignore local storage errors
    }
  }, [sessionUserId, selectedTemplateId])

  useEffect(() => {
    if (typeof window === "undefined") return
    const userId = sessionUserId.trim()
    if (!userId) return
    try {
      const raw = localStorage.getItem(TEMPLATE_UPLOADER_OPEN_BY_USER_STORAGE_KEY)
      const byUser = raw ? (JSON.parse(raw) as TemplateUploaderOpenByUserStoragePayload) : {}
      if (typeof byUser[userId] === "boolean") {
        setIsTemplateUploaderOpen(byUser[userId])
      }
    } catch {
      // ignore malformed local storage payload
    }
  }, [sessionUserId])

  useEffect(() => {
    if (typeof window === "undefined") return
    const userId = sessionUserId.trim()
    if (!userId) return
    try {
      const raw = localStorage.getItem(TEMPLATE_UPLOADER_OPEN_BY_USER_STORAGE_KEY)
      const byUser = raw ? (JSON.parse(raw) as TemplateUploaderOpenByUserStoragePayload) : {}
      byUser[userId] = isTemplateUploaderOpen
      localStorage.setItem(TEMPLATE_UPLOADER_OPEN_BY_USER_STORAGE_KEY, JSON.stringify(byUser))
    } catch {
      // ignore local storage errors
    }
  }, [sessionUserId, isTemplateUploaderOpen])

  useEffect(() => {
    if (typeof window === "undefined") return
    const userId = sessionUserId.trim()
    if (!userId) return
    try {
      const raw = localStorage.getItem(EXCEL_VIEW_BY_USER_STORAGE_KEY)
      const byUser = raw ? (JSON.parse(raw) as ExcelViewByUserStoragePayload) : {}
      if (typeof byUser[userId] === "boolean") {
        setIsExcelView(byUser[userId])
      }
    } catch {
      // ignore malformed local storage payload
    }
  }, [sessionUserId])

  useEffect(() => {
    if (typeof window === "undefined") return
    const userId = sessionUserId.trim()
    if (!userId) return
    try {
      const raw = localStorage.getItem(EXCEL_VIEW_BY_USER_STORAGE_KEY)
      const byUser = raw ? (JSON.parse(raw) as ExcelViewByUserStoragePayload) : {}
      byUser[userId] = isExcelView
      localStorage.setItem(EXCEL_VIEW_BY_USER_STORAGE_KEY, JSON.stringify(byUser))
    } catch {
      // ignore local storage errors
    }
  }, [sessionUserId, isExcelView])

  const upsertTemplateMapping = (mapping: TemplateFieldMapping) => {
    setTemplateMappings((current) => {
      const next = [...current]
      const index = next.findIndex((item) => item.key === mapping.key)
      if (index >= 0) {
        next[index] = { ...next[index], ...mapping }
      } else {
        next.push(mapping)
      }
      return next
    })
  }

  const requestParsedTemplateCandidate = async (
    sourceType: EmailTemplateSourceType,
    rawContent: string,
    conversionMode: ToneConversionMode,
    removeClosingSection: boolean,
    signal?: AbortSignal,
  ): Promise<ParsedTemplateRequestResult> => {
    const controller = new AbortController()
    const onAbort = () => controller.abort()
    signal?.addEventListener("abort", onAbort)
    try {
      const summaryValues = computedData ? getSummaryEmailValues() : null
      const response = await fetch("/api/email-templates/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          sourceType,
          rawContent,
          removeClosingSection,
          conversionMode,
          aiContext: summaryValues
            ? {
                accountGoal: summaryValues.accountGoal,
                currency: computedData?.displayCurrency || "HUF",
                isAllianzEletprogram: computedData?.selectedProduct === "allianz_eletprogram",
              }
            : undefined,
        }),
      })
      const result = (await response.json().catch(() => ({}))) as ParsedTemplateRequestResult
      if (!response.ok || !result?.candidate) {
        throw new Error(
          typeof result?.message === "string" && result.message ? result.message : "Nem sikerült feldolgozni a sablont.",
        )
      }
      return result
    } finally {
      signal?.removeEventListener("abort", onAbort)
    }
  }

  const parseTemplateContentOnServer = async (
    sourceType: EmailTemplateSourceType,
    rawContent: string,
    conversionMode: ToneConversionMode,
    removeClosingSection: boolean,
  ): Promise<ParsedTemplateClientResult | null> => {
    setTemplateStatus("loading")
    setTemplateError("")
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 95000)
    try {
      const result = await requestParsedTemplateCandidate(
        sourceType,
        rawContent,
        conversionMode,
        removeClosingSection,
        controller.signal,
      )
      const conversionSkippedReason =
        typeof result.conversionSkippedReason === "string" && result.conversionSkippedReason.trim()
          ? result.conversionSkippedReason
          : ""
      if (conversionSkippedReason) {
        setTemplateError(conversionSkippedReason)
      }
      const candidate = result.candidate
      if (!candidate) {
        setTemplateStatus("failed")
        setTemplateError("Nem sikerült feldolgozni a sablont.")
        return null
      }
      const originalUploadedHtml =
        !removeClosingSection && sourceType === "html" && looksLikeHtmlContent(rawContent) ? rawContent : ""
      const previewHtml =
        originalUploadedHtml || candidate.htmlContent || (candidate.textContent ? `<pre>${candidate.textContent}</pre>` : "")
      setTemplatePreviewHtml(sanitizePreviewHtml(previewHtml))
      const nextConversionData = candidate.conversionSuggestion
        ? {
            convertedSubject: candidate.conversionSuggestion.convertedSubject,
            convertedHtmlContent: candidate.conversionSuggestion.convertedHtmlContent,
            convertedTextContent: candidate.conversionSuggestion.convertedTextContent,
          }
        : null
      setTemplateConversionData(nextConversionData)
      const aiPreviewHtml = toConvertedPreviewHtml(
        candidate.conversionSuggestion?.convertedHtmlContent,
        candidate.conversionSuggestion?.convertedTextContent,
      )
      setTemplateAiPreviewHtml(aiPreviewHtml)
      setTemplateAiPreviewMode(candidate.conversionSuggestion?.modeUsed ?? null)
      setIsRenderedPreviewDirty(false)
      setIsSelectedTemplateSnapshot(false)
      setTemplateSelectedSnippet("")
      setTemplateSuggestedSubject(candidate.subject || "")
      const nextMappings = Array.isArray(candidate.suggestedMappings)
        ? candidate.suggestedMappings.map((suggestion) => ({
            ...suggestion,
            sourceSnippet:
              suggestion.key === "calculator_table" && suggestion.sourceSnippet
                ? sanitizePreviewHtml(suggestion.sourceSnippet)
                : suggestion.sourceSnippet,
            label: suggestion.label || TEMPLATE_FIELD_LABELS[suggestion.key],
            token: suggestion.token || `{{${suggestion.key}}}`,
          }))
        : []
      if (conversionMode === "ai_full" && emailTegezo && !aiPreviewHtml.trim() && !conversionSkippedReason) {
        setTemplateStatus("failed")
        setTemplateError("AI mód: nem érkezett használható kimenet. Próbáld újra, vagy kapcsold ki az AI-t.")
        return null
      }
      if (nextMappings.length > 0) {
        setTemplateMappings((current) => {
          const byKey = new Map<EmailTemplateFieldKey, TemplateFieldMapping>()
          for (const item of current) {
            byKey.set(item.key, item)
          }
          for (const suggestion of nextMappings) {
            const existing = byKey.get(suggestion.key)
            byKey.set(suggestion.key, {
              ...(existing ?? {
                key: suggestion.key,
                label: suggestion.label || TEMPLATE_FIELD_LABELS[suggestion.key],
                token: suggestion.token || `{{${suggestion.key}}}`,
              }),
              ...suggestion,
              sourceSnippet: suggestion.sourceSnippet,
              token: existing?.token || suggestion.token || `{{${suggestion.key}}}`,
            })
          }
          return [...byKey.values()]
        })
      }
      setTemplateStatus("idle")
      return {
        suggestedSubject: candidate.subject || "",
        mappings: nextMappings,
        conversionData: nextConversionData,
      }
    } catch (error) {
      setTemplateStatus("failed")
      if (error instanceof DOMException && error.name === "AbortError") {
        setTemplateError("A sablon feldolgozása túl sokáig tartott. Próbáld újra, vagy kisebb/kevesebb mellékletes EML-t tölts fel.")
      } else {
        setTemplateError("Nem sikerült feldolgozni a sablont.")
      }
      return null
    } finally {
      window.clearTimeout(timeoutId)
    }
  }

  const handleTemplateFileUpload = async (file: File) => {
    const sourceType = inferSourceTypeFromFileName(file.name)
    if (!sourceType) {
      setTemplateStatus("failed")
      setTemplateError("Csak HTML, TXT vagy EML fájl tölthető fel az MVP-ben.")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setTemplateStatus("failed")
      setTemplateError("A fájl túl nagy. Maximum 2 MB.")
      return
    }
    const content = await file.text()
    const nextTemplateName = file.name.replace(/\.[^.]+$/, "")
    const removeClosingSection = !keepTemplateClosingSection
    setTemplateSourceType(sourceType)
    setTemplateOriginalFileName(file.name)
    setTemplateRawContent(content)
    setTemplateName(nextTemplateName)
    const parsedTemplate = await parseTemplateContentOnServer(
      sourceType,
      content,
      templateConversionMode,
      removeClosingSection,
    )
    if (!parsedTemplate) return
    await saveTemplate({
      name: nextTemplateName,
      sourceType,
      originalFileName: file.name,
      rawContent: content,
      removeClosingSection,
      suggestedSubject: parsedTemplate.suggestedSubject,
      mappings: parsedTemplate.mappings,
      conversionData: parsedTemplate.conversionData,
    })
  }

  const onTemplateFileDragOver = (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!isTemplateDragActive) setIsTemplateDragActive(true)
  }

  const onTemplateFileDragLeave = (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsTemplateDragActive(false)
  }

  const onTemplateFileDrop = async (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsTemplateDragActive(false)
    const file = event.dataTransfer?.files?.[0]
    if (!file) return
    await handleTemplateFileUpload(file)
  }

  const saveTemplate = async (overrides?: SaveTemplateOverrides) => {
    const nameValue = overrides?.name?.trim() || templateName.trim()
    const sourceTypeValue = overrides?.sourceType || templateSourceType
    const originalFileNameValue = overrides?.originalFileName || templateOriginalFileName || undefined
    const rawContentValue = overrides?.rawContent ?? templateRawContent
    const removeClosingSectionValue = overrides?.removeClosingSection ?? !keepTemplateClosingSection
    const suggestedSubjectValue = overrides?.suggestedSubject ?? templateSuggestedSubject
    const mappingsValue = overrides?.mappings ?? templateMappings
    const conversionDataValue = overrides?.conversionData ?? templateConversionData
    const hasToken = mappingsValue.some((mapping) => Boolean(mapping.token?.trim()))
    if (!nameValue) {
      setTemplateStatus("failed")
      setTemplateError("Adj meg sablon nevet.")
      return
    }
    if (!rawContentValue.trim()) {
      setTemplateStatus("failed")
      setTemplateError("Tölts fel sablonfájlt.")
      return
    }
    if (!hasToken) {
      setTemplateStatus("failed")
      setTemplateError("Legalább egy dinamikus mező token szükséges.")
      return
    }
    setTemplateStatus("saving")
    setTemplateError("")
    try {
      const response = await fetch("/api/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameValue,
          sourceType: sourceTypeValue,
          originalFileName: originalFileNameValue,
          rawContent: rawContentValue,
          removeClosingSection: removeClosingSectionValue,
          subject: suggestedSubjectValue || undefined,
          mappings: mappingsValue.filter((mapping) => mapping.token.trim()),
          conversion:
            conversionDataValue &&
            (conversionDataValue.convertedSubject ||
              conversionDataValue.convertedHtmlContent ||
              conversionDataValue.convertedTextContent)
              ? {
                  status: "approved",
                  targetTone: "tegezo",
                  convertedSubject: conversionDataValue.convertedSubject,
                  convertedHtmlContent: conversionDataValue.convertedHtmlContent,
                  convertedTextContent: conversionDataValue.convertedTextContent,
                }
              : undefined,
        }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result?.template) {
        setTemplateStatus("failed")
        setTemplateError(typeof result?.message === "string" ? result.message : "Sablon mentési hiba.")
        return
      }
      const savedTemplateId = typeof result.template?.id === "string" ? result.template.id : ""
      await loadEmailTemplates()
      if (savedTemplateId) {
        setSelectedTemplateId(savedTemplateId)
      }
      const editedHtml = (templateRenderedPreviewRef.current?.innerHTML || templateRenderedPreviewHtml || "").trim()
      if (savedTemplateId && isRenderedPreviewDirty && editedHtml) {
        const storedHtml = `${RENDERED_SNAPSHOT_MARKER}\n${sanitizeStoredHtml(editedHtml)}`
        const storedPlain = htmlToPlainText(storedHtml)
        const snapshotResponse = await fetch(`/api/email-templates/${encodeURIComponent(savedTemplateId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            htmlContent: storedHtml,
            textContent: storedPlain,
          }),
        })
        const snapshotResult = await snapshotResponse.json().catch(() => ({}))
        if (!snapshotResponse.ok || !snapshotResult?.template) {
          setTemplateStatus("failed")
          setTemplateError(
            typeof snapshotResult?.message === "string"
              ? snapshotResult.message
              : "A sablon mentve lett, de a szerkesztett kitöltött előnézet mentése nem sikerült.",
          )
          return
        }
        setIsRenderedPreviewDirty(false)
      }
      if (savedTemplateId) {
        const autoBundleResult = await generateVariantBundle({
          templateIdOverride: savedTemplateId,
          skipZip: true,
          silent: true,
        })
        if (!autoBundleResult.ok) {
          setTemplateError("A sablon mentve lett, de a 16 variáns automatikus frissítése nem sikerült.")
        }
      }
      setTemplateStatus("idle")
    } catch {
      setTemplateStatus("failed")
      setTemplateError("Sablon mentési hiba.")
    }
  }

  const updateSelectedTemplateDraft = async ({
    regenerateVariants = false,
    autosave = false,
  }: {
    regenerateVariants?: boolean
    autosave?: boolean
  } = {}): Promise<boolean> => {
    const templateId = selectedTemplateId.trim()
    const nameValue = templateName.trim()
    const suggestedSubjectValue = templateSuggestedSubject.trim()
    const mappingsValue = templateMappings.filter((mapping) => mapping.token.trim())
    const conversionDataValue = templateConversionData
    const hasToken = mappingsValue.some((mapping) => Boolean(mapping.token?.trim()))
    if (!templateId) {
      if (!autosave) {
        setTemplateStatus("failed")
        setTemplateError("Előbb válassz ki vagy ments el egy sablont.")
      }
      return false
    }
    if (!nameValue) {
      if (!autosave) {
        setTemplateStatus("failed")
        setTemplateError("Adj meg sablon nevet.")
      }
      return false
    }
    if (!hasToken) {
      if (!autosave) {
        setTemplateStatus("failed")
        setTemplateError("Legalább egy dinamikus mező token szükséges.")
      }
      return false
    }
    if (autosave && templateAutosaveInFlightRef.current) {
      return false
    }

    if (autosave) {
      templateAutosaveInFlightRef.current = true
      setTemplateAutosaveStatus("saving")
      setTemplateAutosaveError("")
    } else {
      setTemplateStatus("saving")
      setTemplateError("")
    }

    try {
      const response = await fetch(`/api/email-templates/${encodeURIComponent(templateId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameValue,
          subject: suggestedSubjectValue || undefined,
          mappings: mappingsValue,
          conversion:
            conversionDataValue &&
            (conversionDataValue.convertedSubject ||
              conversionDataValue.convertedHtmlContent ||
              conversionDataValue.convertedTextContent)
              ? {
                  status: "approved",
                  targetTone: "tegezo",
                  convertedSubject: conversionDataValue.convertedSubject,
                  convertedHtmlContent: conversionDataValue.convertedHtmlContent,
                  convertedTextContent: conversionDataValue.convertedTextContent,
                }
              : {
                  status: "none",
                },
        }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result?.template) {
        if (autosave) {
          setTemplateAutosaveStatus("failed")
          setTemplateAutosaveError(typeof result?.message === "string" ? result.message : "Automatikus mentési hiba.")
        } else {
          setTemplateStatus("failed")
          setTemplateError(typeof result?.message === "string" ? result.message : "Sablon mentési hiba.")
        }
        return false
      }

      const responseTemplate = result.template as StoredEmailTemplateDetails
      const nextConversionData =
        responseTemplate.convertedSubject || responseTemplate.convertedHtmlContent || responseTemplate.convertedTextContent
          ? {
              convertedSubject: responseTemplate.convertedSubject,
              convertedHtmlContent: responseTemplate.convertedHtmlContent,
              convertedTextContent: responseTemplate.convertedTextContent,
            }
          : null
      setTemplateConversionData(nextConversionData)
      setTemplateAiPreviewHtml(toConvertedPreviewHtml(nextConversionData?.convertedHtmlContent, nextConversionData?.convertedTextContent))
      setTemplateAiPreviewMode(nextConversionData ? templateConversionMode : null)
      setSelectedTemplateNameHint(responseTemplate.name || nameValue)
      lastTemplateFieldAutosaveSignatureRef.current = buildTemplateFieldAutosaveSignature({
        templateId,
        name: responseTemplate.name || nameValue,
        subject: responseTemplate.subject || suggestedSubjectValue,
        mappings: mappingsValue,
        conversionData: nextConversionData,
      })

      if (regenerateVariants) {
        const autoBundleResult = await generateVariantBundle({
          templateIdOverride: templateId,
          skipZip: true,
          silent: true,
        })
        if (!autoBundleResult.ok) {
          updateTemplateListEntry(templateId, {
            name: responseTemplate.name || nameValue,
            variantBundle: null,
          })
          setIsTemplateVariantBundleStale(true)
          if (autosave) {
            setTemplateAutosaveStatus("failed")
            setTemplateAutosaveError("A háttérmentés sikerült, de a 16 variáns frissítése nem.")
          } else {
            setTemplateStatus("failed")
            setTemplateError("A sablon mentve lett, de a 16 variáns automatikus frissítése nem sikerült.")
          }
          return false
        }
        setIsTemplateVariantBundleStale(false)
      } else {
        updateTemplateListEntry(templateId, {
          name: responseTemplate.name || nameValue,
          variantBundle: null,
        })
        setIsTemplateVariantBundleStale(true)
      }

      if (autosave) {
        setTemplateAutosaveStatus("saved")
        setTemplateLastAutosavedAt(Date.now())
      } else {
        setTemplateStatus("idle")
      }
      return true
    } catch {
      if (autosave) {
        setTemplateAutosaveStatus("failed")
        setTemplateAutosaveError("Automatikus mentési hiba.")
      } else {
        setTemplateStatus("failed")
        setTemplateError("Sablon mentési hiba.")
      }
      return false
    } finally {
      if (autosave) {
        templateAutosaveInFlightRef.current = false
      }
    }
  }

  const saveRenderedPreviewAsBaseTemplate = async ({
    regenerateVariants = true,
    autosave = false,
  }: {
    regenerateVariants?: boolean
    autosave?: boolean
  } = {}) => {
    const templateId = selectedTemplateId.trim()
    const nameValue = templateName.trim()
    const editedHtml = sanitizeStoredHtml((templateRenderedPreviewRef.current?.innerHTML || templateRenderedPreviewHtml || "").trim())
    const mappingsValue = templateMappings.filter((mapping) => mapping.token.trim())
    const originalRawContent = templateRawContent
    const originalRawPreviewHtml = buildOriginalRawPreviewHtml(templateSourceType, originalRawContent)
    if (!templateId) {
      setTemplateStatus("failed")
      setTemplateError("Előbb válassz ki vagy ments el egy sablont.")
      return
    }
    if (!nameValue) {
      setTemplateStatus("failed")
      setTemplateError("Adj meg sablon nevet.")
      return
    }
    if (!editedHtml) {
      setTemplateStatus("failed")
      setTemplateError("Nincs menthető szerkesztett előnézet.")
      return
    }
    if (!mappingsValue.length) {
      setTemplateStatus("failed")
      setTemplateError("Legalább egy dinamikus mező token szükséges.")
      return
    }

    if (autosave && templateAutosaveInFlightRef.current) {
      return
    }
    if (autosave) {
      templateAutosaveInFlightRef.current = true
      setTemplateAutosaveStatus("saving")
      setTemplateAutosaveError("")
    } else {
      setTemplateStatus("saving")
      setTemplateError("")
    }
    try {
      const parseController = new AbortController()
      const timeoutId = window.setTimeout(() => parseController.abort(), 95000)
      let nextConversionData: TemplateConversionData | null = null
      let conversionWarning = ""
      let nextBaseTextContent = htmlToPlainText(editedHtml)
      try {
        const parseResult = await requestParsedTemplateCandidate("html", editedHtml, templateConversionMode, false, parseController.signal)
        nextBaseTextContent = parseResult.candidate?.textContent || nextBaseTextContent
        if (parseResult.candidate?.conversionSuggestion) {
          nextConversionData = {
            convertedSubject: parseResult.candidate.conversionSuggestion.convertedSubject,
            convertedHtmlContent: parseResult.candidate.conversionSuggestion.convertedHtmlContent,
            convertedTextContent: parseResult.candidate.conversionSuggestion.convertedTextContent,
          }
        }
        conversionWarning =
          typeof parseResult.conversionSkippedReason === "string" && parseResult.conversionSkippedReason.trim()
            ? parseResult.conversionSkippedReason
            : ""
      } finally {
        window.clearTimeout(timeoutId)
      }

      const response = await fetch(`/api/email-templates/${encodeURIComponent(templateId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameValue,
          subject: templateSuggestedSubject || undefined,
          htmlContent: editedHtml,
          textContent: nextBaseTextContent,
          mappings: mappingsValue,
          conversion:
            nextConversionData &&
            (nextConversionData.convertedSubject ||
              nextConversionData.convertedHtmlContent ||
              nextConversionData.convertedTextContent)
              ? {
                  status: "approved",
                  targetTone: "tegezo",
                  convertedSubject: nextConversionData.convertedSubject,
                  convertedHtmlContent: nextConversionData.convertedHtmlContent,
                  convertedTextContent: nextConversionData.convertedTextContent,
                }
              : {
                  status: "none",
                },
        }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result?.template) {
        setTemplateStatus("failed")
        setTemplateError(typeof result?.message === "string" ? result.message : "Alapsablon mentési hiba.")
        return
      }

      const responseTemplate = result.template as StoredEmailTemplateDetails
      const nextOriginalPreviewHtml =
        typeof responseTemplate?.originalPreviewHtml === "string"
          ? responseTemplate.originalPreviewHtml
          : originalRawPreviewHtml || editedHtml || (nextBaseTextContent ? `<pre>${nextBaseTextContent}</pre>` : "")
      setTemplatePreviewHtml(sanitizePreviewHtml(nextOriginalPreviewHtml))
      setTemplateConversionData(nextConversionData)
      setTemplateAiPreviewHtml(
        toConvertedPreviewHtml(nextConversionData?.convertedHtmlContent, nextConversionData?.convertedTextContent),
      )
      setTemplateAiPreviewMode(nextConversionData ? templateConversionMode : null)
      setTemplateRenderedPreviewHtml(normalizeEditablePreviewHtml(editedHtml))
      setIsRenderedPreviewDirty(false)
      setIsSelectedTemplateSnapshot(false)
      setSelectedTemplateNameHint(responseTemplate.name || nameValue)
      lastTemplateFieldAutosaveSignatureRef.current = buildTemplateFieldAutosaveSignature({
        templateId,
        name: responseTemplate.name || nameValue,
        subject: responseTemplate.subject || templateSuggestedSubject || "",
        mappings: mappingsValue,
        conversionData: nextConversionData,
      })
      lastTemplatePreviewAutosaveSignatureRef.current = buildTemplatePreviewAutosaveSignature(templateId, editedHtml)

      if (regenerateVariants) {
        const autoBundleResult = await generateVariantBundle({
          templateIdOverride: templateId,
          skipZip: true,
          silent: true,
        })
        if (!autoBundleResult.ok) {
          updateTemplateListEntry(templateId, {
            name: responseTemplate.name || nameValue,
            variantBundle: null,
          })
          setIsTemplateVariantBundleStale(true)
          if (autosave) {
            setTemplateAutosaveStatus("failed")
            setTemplateAutosaveError("A háttérmentés sikerült, de a 16 variáns frissítése nem.")
          } else {
            setTemplateStatus("failed")
            setTemplateError("Az alapsablon mentve lett, de a 16 variáns automatikus frissítése nem sikerült.")
          }
          return
        }
        setIsTemplateVariantBundleStale(false)
      } else {
        updateTemplateListEntry(templateId, {
          name: responseTemplate.name || nameValue,
          variantBundle: null,
        })
        setIsTemplateVariantBundleStale(true)
      }

      if (autosave) {
        setTemplateAutosaveStatus("saved")
        setTemplateLastAutosavedAt(Date.now())
        if (conversionWarning) {
          setTemplateAutosaveError(conversionWarning)
        }
      } else {
        setTemplateStatus("idle")
        if (conversionWarning) {
          setTemplateError(conversionWarning)
        }
      }
    } catch (error) {
      if (autosave) {
        setTemplateAutosaveStatus("failed")
        if (error instanceof DOMException && error.name === "AbortError") {
          setTemplateAutosaveError("Az automatikus háttérmentés közben az AI feldolgozás túl sokáig tartott.")
        } else if (error instanceof Error && error.message.trim()) {
          setTemplateAutosaveError(error.message)
        } else {
          setTemplateAutosaveError("Automatikus alapsablon mentési hiba.")
        }
      } else if (error instanceof DOMException && error.name === "AbortError") {
        setTemplateStatus("failed")
        setTemplateError("Az alapsablon mentése közben az AI feldolgozás túl sokáig tartott.")
      } else if (error instanceof Error && error.message.trim()) {
        setTemplateStatus("failed")
        setTemplateError(error.message)
      } else {
        setTemplateStatus("failed")
        setTemplateError("Alapsablon mentési hiba.")
      }
    } finally {
      if (autosave) {
        templateAutosaveInFlightRef.current = false
      }
    }
  }

  const deleteSelectedTemplate = async () => {
    const id = selectedTemplateId.trim()
    if (!id) return
    setTemplateError("")
    try {
      const response = await fetch(`/api/email-templates/${encodeURIComponent(id)}`, { method: "DELETE" })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result?.ok) {
        setTemplateError(typeof result?.message === "string" ? result.message : "Nem sikerült törölni a sablont.")
        return
      }
      setSelectedTemplateId("")
      await loadEmailTemplates()
    } catch {
      setTemplateError("Nem sikerült törölni a sablont.")
    }
  }

  const captureSelectedHtmlSnippet = () => {
    const extractSelectedTableHtml = () => {
      const selectionInFn = window.getSelection()
      const previewElementInFn = templatePreviewRef.current
      if (!selectionInFn || !previewElementInFn || selectionInFn.rangeCount === 0) return ""
      const rangeInFn = selectionInFn.getRangeAt(0)
      const common = rangeInFn.commonAncestorContainer
      const commonElement =
        common.nodeType === Node.ELEMENT_NODE
          ? (common as Element)
          : common.parentElement
      const nearestTable = commonElement?.closest("table")
      if (nearestTable) return nearestTable.outerHTML.trim()
      const fragmentRoot = document.createElement("div")
      fragmentRoot.appendChild(rangeInFn.cloneContents())
      const selectedTable = fragmentRoot.querySelector("table")
      return selectedTable?.outerHTML.trim() || ""
    }

    const selection = window.getSelection()
    const previewElement = templatePreviewRef.current
    if (!selection || !previewElement || selection.rangeCount === 0) {
      setTemplateSelectedSnippet("")
      setTemplateSelectedTableSnippet("")
      return
    }
    const anchorNode = selection.anchorNode
    const focusNode = selection.focusNode
    if (!anchorNode || !focusNode || !previewElement.contains(anchorNode) || !previewElement.contains(focusNode)) {
      setTemplateSelectedSnippet("")
      setTemplateSelectedTableSnippet("")
      return
    }
    const range = selection.getRangeAt(0)
    if (range.collapsed) {
      const collapsedElement =
        anchorNode.nodeType === Node.ELEMENT_NODE ? (anchorNode as Element) : anchorNode.parentElement
      const collapsedTable = collapsedElement?.closest("table")
      if (collapsedTable) {
        const collapsedTableHtml = collapsedTable.outerHTML.trim()
        setTemplateSelectedTableSnippet(collapsedTableHtml)
        if (templateSelectionFieldKey === "calculator_table") {
          setTemplateSelectedSnippet(collapsedTableHtml)
        } else {
          setTemplateSelectedSnippet("")
        }
        return
      }
      setTemplateSelectedSnippet("")
      setTemplateSelectedTableSnippet("")
      return
    }
    const selectedTableHtmlForAnyField = extractSelectedTableHtml()
    setTemplateSelectedTableSnippet(selectedTableHtmlForAnyField || "")
    if (templateSelectionFieldKey === "calculator_table") {
      const selectedTableHtml = selectedTableHtmlForAnyField
      if (selectedTableHtml) {
        setTemplateSelectedSnippet(selectedTableHtml)
        return
      }
      const fragmentRoot = document.createElement("div")
      fragmentRoot.appendChild(range.cloneContents())
      const selectedHtml = fragmentRoot.innerHTML.trim()
      const selectedText = selection.toString().replace(/\s+/g, " ").trim()
      setTemplateSelectedSnippet(selectedHtml || selectedText)
      return
    }
    const selectedText = selection.toString().replace(/\s+/g, " ").trim()
    setTemplateSelectedSnippet(selectedText)
  }

  const captureClickedTableSnippet = (event: ReactMouseEvent<HTMLDivElement>) => {
    const clicked = event.target as Element | null
    const table = clicked?.closest("table")
    if (!table) return
    const tableHtml = table.outerHTML.trim()
    setTemplateSelectedTableSnippet(tableHtml)
    if (templateSelectionFieldKey === "calculator_table") {
      setTemplateSelectedSnippet(tableHtml)
    }
  }

  const selectedSnippetToField = () => {
    const selected = normalizeSnippetForField(templateSelectionFieldKey, templateSelectedSnippet)
    if (!selected) return
    upsertTemplateMapping({
      key: templateSelectionFieldKey,
      label: TEMPLATE_FIELD_LABELS[templateSelectionFieldKey],
      token: `{{${templateSelectionFieldKey}}}`,
      sourceSnippet: selected,
      confidence: 1,
    })
  }

  const assignSelectedTableField = () => {
    const selection = window.getSelection()
    const previewElement = templatePreviewRef.current
    let selectedTableHtml = ""
    if (selection && previewElement && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const common = range.commonAncestorContainer
      const commonElement = common.nodeType === Node.ELEMENT_NODE ? (common as Element) : common.parentElement
      const nearestTable = commonElement?.closest("table")
      if (nearestTable) {
        selectedTableHtml = nearestTable.outerHTML.trim()
      } else {
        const fragmentRoot = document.createElement("div")
        fragmentRoot.appendChild(range.cloneContents())
        selectedTableHtml = fragmentRoot.querySelector("table")?.outerHTML.trim() || ""
      }
    }

    if (!selectedTableHtml && templateSelectedTableSnippet.trim().startsWith("<table")) {
      selectedTableHtml = templateSelectedTableSnippet.trim()
    }
    if (!selectedTableHtml && templateSelectedSnippet.trim().startsWith("<table")) {
      selectedTableHtml = templateSelectedSnippet.trim()
    }
    if (!selectedTableHtml) {
      setTemplateError("A táblázat-hozzárendeléshez jelölj ki legalább egy cellát a táblázatból.")
      return
    }
    setTemplateError("")
    setTemplateSelectionFieldKey("calculator_table")
    setTemplateSelectedSnippet(selectedTableHtml)
    setTemplateSelectedTableSnippet(selectedTableHtml)
    upsertTemplateMapping({
      key: "calculator_table",
      label: TEMPLATE_FIELD_LABELS.calculator_table,
      token: "{{calculator_table}}",
      sourceSnippet: selectedTableHtml,
      confidence: 1,
    })
  }
  const summaryPanelProductKey = useMemo(
    () =>
      resolveProductContextKey(computedData?.selectedProduct ?? contextData?.selectedProduct, {
        enableTaxCredit: computedData?.enableTaxCredit ?? contextData?.enableTaxCredit,
        currency: computedData?.currency ?? contextData?.currency,
      }),
    [
      computedData?.selectedProduct,
      contextData?.selectedProduct,
      computedData?.enableTaxCredit,
      contextData?.enableTaxCredit,
      computedData?.currency,
      contextData?.currency,
    ],
  )
  const getSummaryInfoHandlers = (rowKey: RowKey) => {
    const mapped = SUMMARY_ROW_INFO_KEY_BY_ROW[rowKey]
    if (!mapped) return {}
    return {
      onMouseEnter: () => setActiveColumnInfoKey(mapped),
      onMouseLeave: () => setActiveColumnInfoKey(null),
      onFocus: () => setActiveColumnInfoKey(mapped),
      onBlur: () => setActiveColumnInfoKey(null),
      tabIndex: 0,
    }
  }

  const emailOfferUntilWeekday = useMemo(() => {
    const raw = (emailOfferUntil || "").trim()
    const m = raw.match(/^(\d{4})\.(\d{2})\.(\d{2})$/)
    if (!m) return ""
    const year = Number(m[1])
    const month = Number(m[2])
    const day = Number(m[3])
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return ""
    const dt = new Date(year, month - 1, day)
    if (Number.isNaN(dt.getTime())) return ""
    return new Intl.DateTimeFormat("hu-HU", { weekday: "long" }).format(dt)
  }, [emailOfferUntil])

  const selectedTemplate = useMemo(
    () => emailTemplates.find((template) => template.id === selectedTemplateId) ?? null,
    [emailTemplates, selectedTemplateId],
  )
  const hasSelectedTemplateInList = useMemo(() => {
    const id = selectedTemplateId.trim()
    if (!id) return false
    return emailTemplates.some((template) => template.id === id)
  }, [emailTemplates, selectedTemplateId])

  useEffect(() => {
    if (!selectedTemplate?.name) return
    setSelectedTemplateNameHint(selectedTemplate.name)
  }, [selectedTemplate])

  useEffect(() => {
    if (!selectedTemplate?.ownerId) return
    setSelectedTemplateOwnerHint(selectedTemplate.ownerId)
  }, [selectedTemplate])

  useEffect(() => {
    if (typeof window === "undefined") return
    const id = selectedTemplateId.trim()
    if (!id) {
      localStorage.removeItem(LAST_SELECTED_TEMPLATE_STORAGE_KEY)
      return
    }
    const name = selectedTemplate?.name || selectedTemplateNameHint
    const ownerId = selectedTemplate?.ownerId || selectedTemplateOwnerHint
    const payload: LastSelectedTemplateStoragePayload = {
      id,
      name: name || undefined,
      ownerId: ownerId || undefined,
      isAdminView: isTemplateAdminView,
      userId: sessionUserId.trim() || undefined,
      updatedAt: Date.now(),
    }
    try {
      localStorage.setItem(LAST_SELECTED_TEMPLATE_STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // ignore local storage errors
    }
  }, [selectedTemplateId, selectedTemplate, selectedTemplateNameHint, selectedTemplateOwnerHint, sessionUserId, isTemplateAdminView])

  useEffect(() => {
    if (isTemplateListLoading) return
    if (!selectedTemplateId.trim()) return
    const exists = emailTemplates.some((template) => template.id === selectedTemplateId)
    if (!exists) {
      setSelectedTemplateId("")
      setSelectedTemplateNameHint("")
    }
  }, [emailTemplates, selectedTemplateId, isTemplateListLoading])
  const fxSummaryPalette = useMemo(() => {
    const base = normalizeHexColorInput(fxBaseColor) ?? "#c55a11"
    return {
      finalEndBalance: base,
      endBalanceHufCurrent: darkenHexColor(base, 0.12),
      endBalanceEUR500: darkenHexColor(base, 0.24),
      endBalanceEUR600: darkenHexColor(base, 0.36),
    }
  }, [fxBaseColor])

  useEffect(() => {
    if (!templatePreviewHtml.trim()) {
      setTemplateRenderedPreviewHtml("")
      setIsRenderedPreviewDirty(false)
      setTemplateRenderedPreviewError("")
      return
    }
    const effectiveTemplateHtml = emailTegezo && templateAiPreviewHtml.trim() ? templateAiPreviewHtml : templatePreviewHtml
    if (!computedData) {
      setTemplateRenderedPreviewHtml(normalizeEditablePreviewHtml(effectiveTemplateHtml))
      setTemplateRenderedPreviewError("")
      return
    }
    if (isSelectedTemplateSnapshot) {
      setTemplateRenderedPreviewHtml((current) =>
        isRenderedPreviewDirty ? current : normalizeEditablePreviewHtml(effectiveTemplateHtml),
      )
      setTemplateRenderedPreviewError("")
      return
    }

    try {
      const summaryValues = getSummaryEmailValues()
      const safeName = (emailClientName || "Ügyfél").trim()
      const safeUntil = (emailOfferUntil || "").trim()
      const rendered = buildTemplateEmailArtifacts({
        htmlContent: effectiveTemplateHtml,
        textContent: "",
        mappings: templateMappings,
        safeName,
        safeUntil,
        summaryValues,
        displayCurrency: computedData.displayCurrency,
        selectedProduct: computedData.selectedProduct,
      })
      const nextRenderedPreviewHtml = normalizeEditablePreviewHtml(sanitizePreviewHtml(rendered.html || effectiveTemplateHtml))
      setTemplateRenderedPreviewHtml((current) => (isRenderedPreviewDirty ? current : nextRenderedPreviewHtml))
      setTemplateRenderedPreviewError("")
    } catch {
      setTemplateRenderedPreviewHtml((current) =>
        isRenderedPreviewDirty ? current : normalizeEditablePreviewHtml(effectiveTemplateHtml),
      )
      setTemplateRenderedPreviewError("A kitöltött előnézet számítása közben hiba történt, a nyers sablon látható.")
    }
  }, [
    templatePreviewHtml,
    templateAiPreviewHtml,
    templateConversionMode,
    computedData,
    summaryOverrides,
    templateMappings,
    extraEmailTables,
    emailClientName,
    emailOfferUntil,
    emailTegezo,
    isRenderedPreviewDirty,
    isSelectedTemplateSnapshot,
  ])

  useEffect(() => {
    if (!emailTegezo) return
    if (!selectedTemplateId.trim()) return
    if (!templateRawContent.trim()) return
    if (templateStatus === "loading") return
    const desiredMode = templateConversionMode
    const needsHydration = !templateAiPreviewHtml.trim() || templateAiPreviewMode !== desiredMode
    if (!needsHydration) return
    const hydrationKey = `${selectedTemplateId.trim()}::${templateSourceType}::${templateRawContent.length}::${desiredMode}::${keepTemplateClosingSection ? "keep" : "trim"}`
    if (lastTonePreviewHydrationKeyRef.current === hydrationKey) return
    lastTonePreviewHydrationKeyRef.current = hydrationKey
    void parseTemplateContentOnServer(templateSourceType, templateRawContent, desiredMode, !keepTemplateClosingSection)
  }, [
    emailTegezo,
    selectedTemplateId,
    templateAiPreviewHtml,
    templateAiPreviewMode,
    templateRawContent,
    templateSourceType,
    templateStatus,
    templateConversionMode,
    keepTemplateClosingSection,
  ])

  useEffect(() => {
    if (!selectedTemplateId.trim()) return
    if (!hasHydratedSelectedTemplate) return
    if (templateStatus !== "idle") return
    if (templateAutosaveInFlightRef.current) return
    if (isRenderedPreviewDirty) return
    if (currentTemplateFieldAutosaveSignature === lastTemplateFieldAutosaveSignatureRef.current) return
    const timeoutId = window.setTimeout(() => {
      void updateSelectedTemplateDraft({ regenerateVariants: false, autosave: true })
    }, 1200)
    return () => window.clearTimeout(timeoutId)
  }, [
    selectedTemplateId,
    hasHydratedSelectedTemplate,
    templateStatus,
    isRenderedPreviewDirty,
    currentTemplateFieldAutosaveSignature,
  ])

  useEffect(() => {
    if (!selectedTemplateId.trim()) return
    if (!hasHydratedSelectedTemplate) return
    if (templateStatus !== "idle") return
    if (templateAutosaveInFlightRef.current) return
    if (!isRenderedPreviewDirty) return
    if (!templateRenderedPreviewHtml.trim()) return
    if (currentTemplatePreviewAutosaveSignature === lastTemplatePreviewAutosaveSignatureRef.current) return
    const timeoutId = window.setTimeout(() => {
      void saveRenderedPreviewAsBaseTemplate({ regenerateVariants: false, autosave: true })
    }, 2200)
    return () => window.clearTimeout(timeoutId)
  }, [
    selectedTemplateId,
    hasHydratedSelectedTemplate,
    templateStatus,
    isRenderedPreviewDirty,
    templateRenderedPreviewHtml,
    currentTemplatePreviewAutosaveSignature,
  ])

  useEffect(() => {
    if (!templateRenderedPreviewRef.current) return
    if (document.activeElement === templateRenderedPreviewRef.current) return
    if (templateRenderedPreviewRef.current.innerHTML !== templateRenderedPreviewHtml) {
      templateRenderedPreviewRef.current.innerHTML = templateRenderedPreviewHtml
    }
  }, [templateRenderedPreviewHtml])

  const onRenderedPreviewInput = () => {
    const html = templateRenderedPreviewRef.current?.innerHTML ?? ""
    setTemplateRenderedPreviewHtml(html)
    setIsRenderedPreviewDirty(true)
  }

  const copyHtmlToClipboard = async (html: string, plain: string) => {
    // 1) Modern Clipboard API (works on most desktops; limited on mobile)
    try {
      const ClipboardItemCtor: any = (window as any).ClipboardItem
      if (ClipboardItemCtor && navigator.clipboard?.write) {
        const item = new ClipboardItemCtor({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" }),
        })
        await navigator.clipboard.write([item])
        return true
      }
    } catch {
      // fall through
    }

    // 2) Legacy execCommand('copy') using DOM selection (often works better on iOS/Safari)
    try {
      const container = document.createElement("div")
      container.style.position = "fixed"
      container.style.left = "-9999px"
      container.style.top = "0"
      container.style.opacity = "0"
      container.style.pointerEvents = "none"
      container.setAttribute("aria-hidden", "true")
      container.innerHTML = html
      document.body.appendChild(container)

      const selection = window.getSelection()
      if (!selection) throw new Error("No selection")
      selection.removeAllRanges()
      const range = document.createRange()
      range.selectNodeContents(container)
      selection.addRange(range)

      const ok = document.execCommand("copy")
      selection.removeAllRanges()
      document.body.removeChild(container)
      if (ok) return true
    } catch {
      // fall through
    }

    // 3) Plain text fallback
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(plain)
        return true
      }
    } catch {
      // ignore
    }

    return false
  }

  const getEmailSubject = () => {
    const goal = String(getValue("accountGoal") ?? "").trim()
    return goal || "Megtakarítási ajánlat"
  }

  const getProductLabel = (productValue: string): string => {
    const catalogLabel = getProductLabelFromCatalog(productValue)
    if (catalogLabel) return catalogLabel

    const productMap: Record<string, string> = {
      alfa_exclusive_plus: "Alfa Exclusive Plus",
      alfa_fortis: "Alfa Fortis (WL-02)",
      alfa_jade: "Alfa Jáde (TR19/TR29)",
      alfa_jovokep: "Alfa Jövőkép (TR10)",
      alfa_jovotervezo: "Alfa Jövőtervező (TR03)",
      alfa_premium_selection: "Alfa Premium Selection (TR09/NY06/TR18/NY12/TR28/NY22)",
      alfa_relax_plusz: "Alfa Relax Plusz (NY01)",
      alfa_zen: "Alfa Zen (NY13/NY23)",
      alfa_zen_eur: "Alfa Zen (NY13/NY23)",
      alfa_zen_pro: "Alfa Zen Pro (NY-08/NY-14/NY-24)",
      generali_kabala: "Generali Kabala (U91)",
      generali_mylife_extra_plusz: "Generali MyLife Extra Plusz (U67P)",
      cig_esszenciae: "CIG Pannonia EsszenciaE",
      cig_nyugdijkotvenye: "CIG Pannonia NyugdijkotvenyE",
      allianz_eletprogram: "Allianz Életprogram",
      allianz_bonusz_eletprogram: "Allianz Bónusz Életprogram",
      signal_elorelato_ul001: "Signal Előrelátó Program (UL001)",
      signal_nyugdij_terv_plusz_ny010: "SIGNAL Nyugdíj terv Plusz (NY010)",
      signal_nyugdijprogram_sn005: "SIGNAL IDUNA Nyugdíjprogram (SN005)",
      signal_ongondoskodasi_wl009: "Signal Öngondoskodási terv 2.0 Plusz (WL009)",
      union_vienna_age_505: "UNION Vienna Age Nyugdíjbiztosítás (505)",
      union_vienna_plan_500: "UNION Vienna Plan Életbiztosítás (500)",
      union_vienna_time: "UNION Vienna Time Nyugdíjbiztosítás (564/584/606)",
      uniqa_eletcel_275: "UNIQA Életcél (275)",
      uniqa_premium_life_190: "UNIQA Premium Life (190)",
      groupama_next: "Groupama Next Életbiztosítás",
      groupama_easy: "Groupama Easy Életbiztosítás",
    }
    return productMap[productValue] || productValue
  }

  const mapSelectedProductToProductId = (productValue: string | null, insurer: string | null): ProductId => {
    if (productValue === "alfa_exclusive_plus") {
      return "alfa-exclusive-plus"
    }
    if (productValue === "alfa_fortis") return "alfa-fortis"
    if (productValue === "alfa_jade") return "alfa-jade"
    if (productValue === "alfa_jovokep") return "alfa-jovokep"
    if (productValue === "alfa_jovotervezo") return "alfa-jovotervezo"
    if (productValue === "alfa_premium_selection") return "alfa-premium-selection"
    if (productValue === "alfa_relax_plusz") return "alfa-relax-plusz"
    if (productValue === "alfa_zen" || productValue === "alfa_zen_eur") return "alfa-zen"
    if (productValue === "alfa_zen_pro") return "alfa-zen-pro"
    if (productValue === "generali_kabala") return "generali-kabala-u91"
    if (productValue === "generali_mylife_extra_plusz") return "generali-mylife-extra-plusz"
    if (productValue === "cig_esszenciae") return "cig-esszenciae"
    if (productValue === "cig_nyugdijkotvenye") return "cig-nyugdijkotvenye"
    if (productValue === "signal_elorelato_ul001") return "signal-elorelato-ul001"
    if (productValue === "signal_nyugdij_terv_plusz_ny010") return "signal-nyugdij-terv-plusz-ny010"
    if (productValue === "signal_nyugdijprogram_sn005") return "signal-nyugdijprogram-sn005"
    if (productValue === "signal_ongondoskodasi_wl009") return "signal-ongondoskodasi-wl009"
    if (productValue === "union_vienna_age_505") return "union-vienna-age-505"
    if (productValue === "union_vienna_plan_500") return "union-vienna-plan-500"
    if (productValue === "union_vienna_time") return "union-vienna-time-584"
    if (productValue === "uniqa_eletcel_275") return "uniqa-eletcel-275"
    if (productValue === "uniqa_premium_life_190") return "uniqa-premium-life-190"
    if (productValue === "groupama_next") return "groupama-next"
    if (productValue === "groupama_easy") return "groupama-easy"
    if (insurer === "Allianz") {
      if (productValue === "allianz_eletprogram" || productValue === "allianz_bonusz_eletprogram") {
        return "allianz-eletprogram"
      }
    }
    return "dm-pro"
  }

  const computeSummaryDataFromSnapshot = (
    snapshot: CalculatorSnapshot,
    overrides?: {
      selectedProduct?: string | null
      inputOverrides?: Partial<InputsDaily>
      durationUnit?: DurationUnit
      durationValue?: number
    },
  ): CalculatorData => {
    const selectedInsurer = snapshot.selectedInsurer
    const selectedProduct = overrides?.selectedProduct ?? snapshot.selectedProduct
    const mergedInputs = {
      ...snapshot.inputs,
      ...(overrides?.inputOverrides ?? {}),
    } as InputsDaily
    const requestedCurrency = coerceCurrencyForProduct(selectedProduct, (mergedInputs.currency as Currency) || "HUF")
    const enableTaxCredit = Boolean(mergedInputs.enableTaxCredit)
    const effectiveCurrency = resolveEffectiveCurrencyForProduct(selectedProduct, requestedCurrency, enableTaxCredit)
    const allowedFrequencies = getAllowedFrequenciesForProduct(selectedProduct, effectiveCurrency, enableTaxCredit, mergedInputs)
    const effectiveFrequency = allowedFrequencies.includes((mergedInputs.frequency as PaymentFrequency) || "havi")
      ? ((mergedInputs.frequency as PaymentFrequency) || "havi")
      : allowedFrequencies[0]
    const durationUnit = overrides?.durationUnit ?? snapshot.durationUnit
    const durationValue = Math.max(1, Math.round(overrides?.durationValue ?? snapshot.durationValue))
    const inputs = {
      ...mergedInputs,
      currency: effectiveCurrency,
      frequency: effectiveFrequency,
      enableTaxCredit,
    } as InputsDaily

    let yearsValue = durationValue
    if (durationUnit === "month") {
      yearsValue = durationValue / 12
    } else if (durationUnit === "day") {
      yearsValue = durationValue / 365
    }

    const totalYearsForPlan = Math.max(1, Math.ceil(yearsValue))
    const periodsPerYear = getPeriodsPerYear(inputs.frequency)
    const baseYear1Payment = inputs.keepYearlyPayment ? (inputs.regularPayment || 0) * 12 : (inputs.regularPayment || 0) * periodsPerYear
    const plan = buildYearlyPlan({
      years: totalYearsForPlan,
      baseYear1Payment,
      baseAnnualIndexPercent: inputs.annualIndexPercent || 0,
      indexByYear: snapshot.indexByYear,
      paymentByYear: snapshot.paymentByYear,
      withdrawalByYear: snapshot.withdrawalByYear,
    })

    const monthlyPayment = Number(inputs.regularPayment || 0)
    const yearlyPayment = monthlyPayment * 12
    let results: Awaited<ReturnType<typeof calculate>>
    let totalBonus = 0
    try {
      const productId = mapSelectedProductToProductId(selectedProduct, selectedInsurer)
      const effectiveProductVariant = resolveEffectiveProductVariantForProduct(selectedProduct, inputs, effectiveCurrency)
      const dailyInputs: InputsDaily = {
        ...inputs,
        currency: effectiveCurrency,
        durationUnit,
        durationValue,
        yearsPlanned: totalYearsForPlan,
        yearlyPaymentsPlan: plan.yearlyPaymentsPlan,
        yearlyWithdrawalsPlan: plan.yearlyWithdrawalsPlan,
        assetCostPercentByYear: snapshot.assetCostPercentByYear,
        plusCostByYear: snapshot.plusCostByYear,
        bonusPercentByYear: snapshot.bonusPercentByYear,
        investedShareByYear: snapshot.investedShareByYear,
        redemptionFeeByYear: snapshot.redemptionFeeByYear,
        redemptionEnabled: snapshot.isRedemptionOpen,
        isAccountSplitOpen: snapshot.isAccountSplitOpen,
        isTaxBonusSeparateAccount: snapshot.isTaxBonusSeparateAccount,
        taxCreditAmountByYear: snapshot.taxCreditAmountByYear,
        taxCreditLimitByYear: snapshot.taxCreditLimitByYear,
        productVariant: effectiveProductVariant,
      }
      results = calculate(productId, dailyInputs)
      totalBonus = results.totalBonus ?? 0
    } catch (error) {
      console.error("[v0] /osszesites local calculation failed, using fallback results:", error)
      results = {
        totalContributions: 0,
        totalBonus: 0,
        endBalance: 0,
        totalTaxCredit: 0,
        totalCosts: 0,
        totalAssetBasedCost: 0,
        totalWithdrawals: 0,
      } as Awaited<ReturnType<typeof calculate>>
    }

    const productHasBonus = inputs.bonusMode !== "none"

    return buildSummaryCalculatorData({
      selectedInsurer,
      selectedProduct,
      inputs,
      monthlyPayment,
      yearlyPayment,
      yearsValue,
      effectiveCurrency,
      enableNetting: snapshot.enableNetting,
      endBalance: results.endBalance || 0,
      totalContributions: results.totalContributions || 0,
      totalTaxCredit: results.totalTaxCredit || 0,
      totalBonus,
      totalCost: results.totalCosts || 0,
      totalAssetBasedCost: results.totalAssetBasedCost || 0,
      totalRiskInsuranceCost: 0,
      annualYieldPercent: inputs.annualYieldPercent || 0,
      enableTaxCredit,
      productHasBonus,
    })
  }

  const computeEsetiSummaryDataFromSnapshot = (snapshot: CalculatorSnapshot): CalculatorData | null => {
    const eseti = snapshot.eseti
    if (!eseti) return null

    const selectedInsurer = snapshot.selectedInsurer
    const selectedProduct = snapshot.selectedProduct
    const requestedCurrency = coerceCurrencyForProduct(selectedProduct, (snapshot.inputs.currency as Currency) || "HUF")
    const baseEnableTaxCredit = Boolean(snapshot.inputs.enableTaxCredit)
    const effectiveCurrency = resolveEffectiveCurrencyForProduct(selectedProduct, requestedCurrency, baseEnableTaxCredit)
    const mainAllowedFrequencies = getAllowedFrequenciesForProduct(
      selectedProduct,
      effectiveCurrency,
      baseEnableTaxCredit,
      snapshot.inputs,
    )
    const mainEffectiveFrequency = mainAllowedFrequencies.includes((snapshot.inputs.frequency as PaymentFrequency) || "havi")
      ? ((snapshot.inputs.frequency as PaymentFrequency) || "havi")
      : mainAllowedFrequencies[0]
    const mainInputs = {
      ...snapshot.inputs,
      currency: effectiveCurrency,
      frequency: mainEffectiveFrequency,
      enableTaxCredit: baseEnableTaxCredit,
    } as InputsDaily
    const mainYearsValue = getYearsFromDuration(snapshot.durationUnit, Math.max(1, Math.round(snapshot.durationValue)))
    const totalYearsForPlan = Math.max(1, Math.ceil(mainYearsValue))
    const mainPeriodsPerYear = getPeriodsPerYear(mainInputs.frequency)
    const mainBaseYear1Payment = mainInputs.keepYearlyPayment
      ? (mainInputs.regularPayment || 0) * 12
      : (mainInputs.regularPayment || 0) * mainPeriodsPerYear
    const mainPlan = buildYearlyPlan({
      years: totalYearsForPlan,
      baseYear1Payment: mainBaseYear1Payment,
      baseAnnualIndexPercent: mainInputs.annualIndexPercent || 0,
      indexByYear: snapshot.indexByYear,
      paymentByYear: snapshot.paymentByYear,
      withdrawalByYear: snapshot.withdrawalByYear,
    })
    const productId = mapSelectedProductToProductId(selectedProduct, selectedInsurer)
    const effectiveProductVariant = resolveEffectiveProductVariantForProduct(selectedProduct, mainInputs, effectiveCurrency)
    const mainDailyInputs: InputsDaily = {
      ...mainInputs,
      currency: effectiveCurrency,
      durationUnit: snapshot.durationUnit,
      durationValue: Math.max(1, Math.round(snapshot.durationValue)),
      yearsPlanned: totalYearsForPlan,
      yearlyPaymentsPlan: mainPlan.yearlyPaymentsPlan,
      yearlyWithdrawalsPlan: mainPlan.yearlyWithdrawalsPlan,
      assetCostPercentByYear: snapshot.assetCostPercentByYear,
      plusCostByYear: snapshot.plusCostByYear,
      bonusPercentByYear: snapshot.bonusPercentByYear,
      investedShareByYear: snapshot.investedShareByYear,
      redemptionFeeByYear: snapshot.redemptionFeeByYear,
      redemptionEnabled: snapshot.isRedemptionOpen,
      isAccountSplitOpen: snapshot.isAccountSplitOpen,
      isTaxBonusSeparateAccount: snapshot.isTaxBonusSeparateAccount,
      taxCreditAmountByYear: snapshot.taxCreditAmountByYear,
      taxCreditLimitByYear: snapshot.taxCreditLimitByYear,
      productVariant: effectiveProductVariant,
    }

    try {
      const mainResults = calculate(productId, mainDailyInputs)
      const mainTaxCreditByYear: Record<number, number> = {}
      for (const row of mainResults.yearlyBreakdown ?? []) {
        if (!row) continue
        mainTaxCreditByYear[row.year] = row.taxCreditForYear ?? 0
      }

      const esetiDurationValue = Math.max(1, Math.round(eseti.durationValue))
      const esetiYearsValue = getYearsFromDuration(eseti.durationUnit, esetiDurationValue)
      const esetiTotalYearsForPlan = Math.max(1, Math.ceil(esetiYearsValue))
      const desiredEsetiFrequency = eseti.baseInputs.frequency || eseti.frequency || "éves"
      const esetiAllowedFrequencies = getAllowedFrequenciesForProduct(
        selectedProduct,
        effectiveCurrency,
        baseEnableTaxCredit,
        {
          ...mainInputs,
          annualYieldPercent: eseti.baseInputs.annualYieldPercent,
          annualIndexPercent: eseti.baseInputs.annualIndexPercent,
          frequency: desiredEsetiFrequency,
        } as InputsDaily,
      )
      const esetiFrequency = esetiAllowedFrequencies.includes(desiredEsetiFrequency)
        ? desiredEsetiFrequency
        : esetiAllowedFrequencies[0]
      const esetiPeriodsPerYear = getPeriodsPerYear(esetiFrequency)
      const esetiBaseYear1Payment = eseti.baseInputs.keepYearlyPayment
        ? (eseti.baseInputs.regularPayment || 0) * 12
        : (eseti.baseInputs.regularPayment || 0) * esetiPeriodsPerYear
      const esetiPlan = buildYearlyPlan({
        years: esetiTotalYearsForPlan,
        baseYear1Payment: esetiBaseYear1Payment,
        baseAnnualIndexPercent: eseti.baseInputs.annualIndexPercent || 0,
        indexByYear: eseti.indexByYear,
        paymentByYear: eseti.paymentByYear,
        withdrawalByYear: eseti.withdrawalByYear,
      })
      const esetiPlanTaxEligible = buildYearlyPlan({
        years: esetiTotalYearsForPlan,
        baseYear1Payment: esetiBaseYear1Payment,
        baseAnnualIndexPercent: eseti.baseInputs.annualIndexPercent || 0,
        indexByYear: eseti.indexByYearTaxEligible,
        paymentByYear: eseti.paymentByYearTaxEligible,
        withdrawalByYear: eseti.withdrawalByYearTaxEligible,
      })
      const taxCreditYears = Math.max(totalYearsForPlan, esetiTotalYearsForPlan)
      const defaultTaxCreditCap = mainInputs.taxCreditCapPerYear ?? 0
      const esetiTaxCreditLimitsByYear: Record<number, number> = {}
      for (let year = 1; year <= taxCreditYears; year += 1) {
        const yearCap = snapshot.taxCreditLimitByYear[year] ?? defaultTaxCreditCap
        const mainUsed = mainTaxCreditByYear[year] ?? 0
        esetiTaxCreditLimitsByYear[year] = Math.max(0, yearCap - mainUsed)
      }

      const customEntryDefinitionsEseti = buildSummaryCustomEntries(eseti)
      const isPremiumSelectionNy06 =
        selectedProduct === "alfa_premium_selection" &&
        (effectiveProductVariant === "alfa_premium_selection_ny06" || effectiveProductVariant === "alfa_premium_selection_ny22")
      const fortisConfig = selectedProduct === "alfa_fortis" ? getFortisVariantConfig(effectiveProductVariant, effectiveCurrency) : null
      const jadeConfig = selectedProduct === "alfa_jade" ? getJadeVariantConfig(effectiveProductVariant, effectiveCurrency) : null
      const premiumSelectionVariantConfig =
        selectedProduct === "alfa_premium_selection"
          ? getPremiumSelectionVariantConfig(effectiveProductVariant, baseEnableTaxCredit, effectiveCurrency)
          : undefined
      const isAllianzProductForEseti =
        selectedProduct === "allianz_eletprogram" || selectedProduct === "allianz_bonusz_eletprogram"

      const dailyInputsEseti: InputsDaily = {
        ...mainDailyInputs,
        customEntries: customEntryDefinitionsEseti,
        disableProductDefaults: true,
        durationUnit: eseti.durationUnit,
        durationValue: esetiDurationValue,
        annualYieldPercent: eseti.baseInputs.annualYieldPercent,
        frequency: esetiFrequency,
        yearlyPaymentsPlan: esetiPlan.yearlyPaymentsPlan,
        yearlyWithdrawalsPlan: esetiPlan.yearlyWithdrawalsPlan,
        taxCreditLimitByYear: esetiTaxCreditLimitsByYear,
        annualIndexPercent: eseti.baseInputs.annualIndexPercent,
        initialCostByYear: {},
        initialCostDefaultPercent: 0,
        yearlyManagementFeePercent: 0,
        yearlyFixedManagementFeeAmount: 0,
        managementFeeValue: 0,
        assetBasedFeePercent: isAllianzProductForEseti ? 1.19 : 0,
        assetCostPercentByYear: isAllianzProductForEseti ? snapshot.assetCostPercentByYear : {},
        accountMaintenancePercentByYear: selectedProduct === "alfa_exclusive_plus" ? eseti.accountMaintenancePercentByYear : {},
        plusCostByYear: {},
        bonusMode: "none",
        bonusOnContributionPercent: 0,
        bonusFromYear: 1,
        bonusPercent: 0,
        bonusStartYear: 1,
        bonusStopYear: 0,
        bonusPercentByYear: {},
        bonusOnContributionPercentByYear: {},
        refundInitialCostBonusPercentByYear: {},
        adminFeeMonthlyAmount: 0,
        adminFeePercentOfPayment:
          selectedProduct === "alfa_fortis"
            ? 2
            : selectedProduct === "alfa_jade"
              ? (jadeConfig?.extraordinaryAdminFeePercent ?? 2)
              : selectedProduct === "alfa_jovokep"
                ? JOVOKEP_EXTRAORDINARY_ADMIN_FEE_PERCENT
                : selectedProduct === "alfa_jovotervezo"
                  ? JOVOTERVEZO_EXTRAORDINARY_ADMIN_FEE_PERCENT
                  : selectedProduct === "alfa_premium_selection"
                    ? PREMIUM_SELECTION_EXTRAORDINARY_ADMIN_FEE_PERCENT
                    : selectedProduct === "alfa_zen_pro"
                      ? ZEN_PRO_EXTRAORDINARY_ADMIN_FEE_PERCENT
                      : selectedProduct === "generali_kabala"
                        ? GENERALI_KABALA_U91_EXTRA_DISTRIBUTION_FEE_PERCENT
                        : 0,
        adminFeePercentByYear: {},
        accountMaintenanceMonthlyPercent:
          selectedProduct === "alfa_fortis"
            ? (fortisConfig?.accountMaintenanceMonthlyPercent ?? mainDailyInputs.accountMaintenanceMonthlyPercent ?? 0)
            : selectedProduct === "alfa_jade"
              ? (jadeConfig?.accountMaintenanceMonthlyPercent ?? mainDailyInputs.accountMaintenanceMonthlyPercent ?? 0)
              : selectedProduct === "alfa_jovokep"
                ? 0.165
                : selectedProduct === "alfa_jovotervezo"
                  ? JOVOTERVEZO_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT
                  : selectedProduct === "alfa_relax_plusz"
                    ? 0.145
                    : selectedProduct === "alfa_zen_pro"
                      ? ZEN_PRO_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT
                      : selectedProduct === "generali_kabala"
                        ? resolveGeneraliKabalaU91AccountMaintenanceMonthlyPercent(mainInputs.selectedFundId)
                        : selectedProduct === "alfa_premium_selection"
                          ? resolvePremiumSelectionAccountMaintenanceMonthlyPercent(
                              mainInputs.selectedFundId,
                              premiumSelectionVariantConfig,
                            )
                          : selectedProduct === "alfa_exclusive_plus"
                            ? 0.145
                            : 0,
        accountMaintenanceStartMonth:
          selectedProduct === "alfa_fortis"
            ? (fortisConfig?.accountMaintenanceStartMonthExtra ?? 1)
            : selectedProduct === "alfa_jade"
              ? (jadeConfig?.accountMaintenanceExtraStartMonth ?? 1)
              : 1,
        riskInsuranceEnabled: false,
        riskInsuranceMonthlyFeeAmount: 0,
        riskInsuranceFeePercentOfMonthlyPayment: 0,
        riskInsuranceAnnualIndexPercent: 0,
        allowWithdrawals: true,
        allowPartialSurrender: true,
        redemptionEnabled: selectedProduct === "alfa_premium_selection" ? false : mainDailyInputs.redemptionEnabled,
        redemptionFeeByYear: selectedProduct === "alfa_premium_selection" ? {} : mainDailyInputs.redemptionFeeByYear,
        redemptionFeeDefaultPercent: selectedProduct === "alfa_premium_selection" ? 0 : eseti.redemptionFeeDefaultPercent,
        extraordinaryAccountSubtype: "immediateAccess",
        enableTaxCredit: isPremiumSelectionNy06 ? false : mainDailyInputs.enableTaxCredit,
        taxCreditRatePercent: isPremiumSelectionNy06 ? 0 : mainDailyInputs.taxCreditRatePercent,
        taxCreditCapPerYear: isPremiumSelectionNy06 ? 0 : mainDailyInputs.taxCreditCapPerYear,
        taxCreditAmountByYear: isPremiumSelectionNy06 ? {} : mainDailyInputs.taxCreditAmountByYear,
        taxCreditYieldPercent: isPremiumSelectionNy06 ? 0 : mainDailyInputs.taxCreditYieldPercent,
      }
      const resultsEseti = calculate(productId, dailyInputsEseti)
      let totalContributions = resultsEseti.totalContributions || 0
      let totalTaxCredit = resultsEseti.totalTaxCredit || 0
      let totalBonus = resultsEseti.totalBonus || 0
      let endBalance = resultsEseti.endBalance || 0
      let totalCost = resultsEseti.totalCosts || 0
      let totalAssetBasedCost = resultsEseti.totalAssetBasedCost || 0
      let totalRiskInsuranceCost = resultsEseti.totalRiskInsuranceCost || 0

      if (isPremiumSelectionNy06) {
        const dailyInputsEsetiTaxEligible: InputsDaily = {
          ...dailyInputsEseti,
          yearlyPaymentsPlan: esetiPlanTaxEligible.yearlyPaymentsPlan,
          yearlyWithdrawalsPlan: esetiPlanTaxEligible.yearlyWithdrawalsPlan,
          taxCreditLimitByYear: esetiTaxCreditLimitsByYear,
          allowWithdrawals: false,
          allowPartialSurrender: false,
          extraordinaryAccountSubtype: "taxEligible",
          enableTaxCredit: true,
          taxCreditRatePercent: mainInputs.taxCreditRatePercent ?? 20,
          taxCreditCapPerYear: mainInputs.taxCreditCapPerYear ?? 130_000,
          taxCreditYieldPercent: mainInputs.taxCreditYieldPercent ?? 1,
        }
        const resultsEsetiTaxEligible = calculate(productId, dailyInputsEsetiTaxEligible)
        totalContributions += resultsEsetiTaxEligible.totalContributions || 0
        totalTaxCredit += resultsEsetiTaxEligible.totalTaxCredit || 0
        totalBonus += resultsEsetiTaxEligible.totalBonus || 0
        endBalance += resultsEsetiTaxEligible.endBalance || 0
        totalCost += resultsEsetiTaxEligible.totalCosts || 0
        totalAssetBasedCost += resultsEsetiTaxEligible.totalAssetBasedCost || 0
        totalRiskInsuranceCost += resultsEsetiTaxEligible.totalRiskInsuranceCost || 0
      }

      return buildSummaryCalculatorData({
        selectedInsurer,
        selectedProduct,
        inputs: mainInputs,
        monthlyPayment: esetiBaseYear1Payment / 12,
        yearlyPayment: esetiBaseYear1Payment,
        yearsValue: esetiYearsValue,
        effectiveCurrency,
        enableNetting: snapshot.enableNetting,
        endBalance,
        totalContributions,
        totalTaxCredit,
        totalBonus,
        totalCost,
        totalAssetBasedCost,
        totalRiskInsuranceCost,
        annualYieldPercent: eseti.baseInputs.annualYieldPercent || 0,
        enableTaxCredit: totalTaxCredit > 0 || baseEnableTaxCredit,
        productHasBonus: totalBonus > 0,
      })
    } catch (error) {
      console.error("[v0] /osszesites local eseti calculation failed:", error)
      return null
    }
  }

  useEffect(() => {
    if (!isHydrated || computedData) return

    // Try to load and compute from sessionStorage
    setIsComputing(true)
    try {
      const storedInputs = sessionStorage.getItem("calculator-inputs")
      const storedUnit = sessionStorage.getItem("calculator-durationUnit")
      const storedValue = sessionStorage.getItem("calculator-durationValue")
      const storedInsurer = sessionStorage.getItem("calculator-selectedInsurer")
      const storedProduct = sessionStorage.getItem("calculator-selectedProduct")
      const storedNetting = sessionStorage.getItem("calculator-enableNetting")
      const storedIndexByYear = sessionStorage.getItem("calculator-indexByYear")
      const storedPaymentByYear = sessionStorage.getItem("calculator-paymentByYear")
      const storedWithdrawalByYear = sessionStorage.getItem("calculator-withdrawalByYear")
      const storedTaxCreditAmountByYear = sessionStorage.getItem("calculator-taxCreditAmountByYear")
      const storedTaxCreditLimitByYear = sessionStorage.getItem("calculator-taxCreditLimitByYear")
      const storedInvestedShareByYear = sessionStorage.getItem("calculator-investedShareByYear")
      const storedRedemptionFeeByYear = sessionStorage.getItem("calculator-redemptionFeeByYear")
      const storedAssetCostPercentByYear = sessionStorage.getItem("calculator-assetCostPercentByYear")
      const storedPlusCostByYear = sessionStorage.getItem("calculator-plusCostByYear")
      const storedBonusPercentByYear = sessionStorage.getItem("calculator-bonusPercentByYear")
      const storedIsAccountSplitOpen = sessionStorage.getItem("isAccountSplitOpen")
      const storedIsRedemptionOpen = sessionStorage.getItem("isRedemptionOpen")
      const storedIsTaxBonusSeparateAccount = sessionStorage.getItem("isTaxBonusSeparateAccount")
      const storedEsetiDurationUnit = sessionStorage.getItem("calculator-esetiDurationUnit")
      const storedEsetiDurationValue = sessionStorage.getItem("calculator-esetiDurationValue")
      const storedEsetiBaseInputs = sessionStorage.getItem("calculator-esetiBaseInputs")
      const storedEsetiFrequency = sessionStorage.getItem("calculator-esetiFrequency")
      const storedEsetiIndexByYear = sessionStorage.getItem("calculator-esetiIndexByYear")
      const storedEsetiPaymentByYear = sessionStorage.getItem("calculator-esetiPaymentByYear")
      const storedEsetiWithdrawalByYear = sessionStorage.getItem("calculator-esetiWithdrawalByYear")
      const storedEsetiIndexByYearTaxEligible = sessionStorage.getItem("calculator-esetiIndexByYearTaxEligible")
      const storedEsetiPaymentByYearTaxEligible = sessionStorage.getItem("calculator-esetiPaymentByYearTaxEligible")
      const storedEsetiWithdrawalByYearTaxEligible = sessionStorage.getItem("calculator-esetiWithdrawalByYearTaxEligible")
      const storedAccountMaintenancePercentByYear = sessionStorage.getItem("calculator-accountMaintenancePercentByYear")
      const storedRedemptionFeeDefaultPercent = sessionStorage.getItem("calculator-redemptionFeeDefaultPercent")
      const storedManagementFees = sessionStorage.getItem("managementFees")
      const storedBonuses = sessionStorage.getItem("bonuses")
      const storedEnableRealValue = sessionStorage.getItem("calculator-enableRealValue")
      const storedInflationRate = sessionStorage.getItem("calculator-inflationRate")

      if (!storedInputs || !storedUnit || !storedValue) {
        setComputedEsetiData(null)
        setIsComputing(false)
        return
      }

      // Parse with fallbacks
      let inputs: any
      let durationUnit: "year" | "month" | "day" = "year"
      let durationValue = 10
      let selectedInsurer: string | null = null
      let selectedProduct: string | null = null
      let enableNetting = false
      let indexByYear: Record<number, number> = {}
      let paymentByYear: Record<number, number> = {}
      let withdrawalByYear: Record<number, number> = {}
      let taxCreditAmountByYear: Record<number, number> = {}
      let taxCreditLimitByYear: Record<number, number> = {}
      let investedShareByYear: Record<number, number> = {}
      let redemptionFeeByYear: Record<number, number> = {}
      let assetCostPercentByYear: Record<number, number> = {}
      let plusCostByYear: Record<number, number> = {}
      let bonusPercentByYear: Record<number, number> = {}
      let isAccountSplitOpen = false
      let isRedemptionOpen = false
      let isTaxBonusSeparateAccount = false
      let eseti: EsetiSnapshot | null = null

      try {
        inputs = JSON.parse(storedInputs)
      } catch (e) {
        console.error("[v0] /osszesites failed to parse inputs:", e)
        setComputedEsetiData(null)
        setIsComputing(false)
        return
      }

      try {
        const parsed = JSON.parse(storedUnit)
        if (parsed === "year" || parsed === "month" || parsed === "day") {
          durationUnit = parsed
        }
      } catch (e) {
        console.error("[v0] /osszesites failed to parse durationUnit, using default 'year':", e)
      }

      try {
        const parsed = JSON.parse(storedValue)
        if (typeof parsed === "number" && parsed > 0) {
          durationValue = parsed
        }
      } catch (e) {
        console.error("[v0] /osszesites failed to parse durationValue, using default 10:", e)
      }

      try {
        selectedInsurer = storedInsurer ? JSON.parse(storedInsurer) : null
      } catch (e) {
        console.error("[v0] /osszesites failed to parse selectedInsurer:", e)
      }

      try {
        selectedProduct = storedProduct ? JSON.parse(storedProduct) : null
      } catch (e) {
        console.error("[v0] /osszesites failed to parse selectedProduct:", e)
      }
      if (selectedProduct) {
        setFallbackProductLabel(getProductLabel(selectedProduct))
      } else if (selectedInsurer) {
        setFallbackProductLabel(selectedInsurer)
      } else {
        setFallbackProductLabel(null)
      }

      try {
        enableNetting = storedNetting ? JSON.parse(storedNetting) : false
      } catch (e) {
        console.error("[v0] /osszesites failed to parse enableNetting:", e)
      }

      const parseRecord = (raw: string | null): Record<number, number> => {
        if (!raw) return {}
        try {
          return JSON.parse(raw)
        } catch {
          return {}
        }
      }
      const parseList = <T,>(raw: string | null): T[] => {
        if (!raw) return []
        try {
          const parsed = JSON.parse(raw)
          return Array.isArray(parsed) ? (parsed as T[]) : []
        } catch {
          return []
        }
      }

      indexByYear = parseRecord(storedIndexByYear)
      paymentByYear = parseRecord(storedPaymentByYear)
      withdrawalByYear = parseRecord(storedWithdrawalByYear)
      taxCreditAmountByYear = parseRecord(storedTaxCreditAmountByYear)
      taxCreditLimitByYear = parseRecord(storedTaxCreditLimitByYear)
      investedShareByYear = parseRecord(storedInvestedShareByYear)
      redemptionFeeByYear = parseRecord(storedRedemptionFeeByYear)
      assetCostPercentByYear = parseRecord(storedAssetCostPercentByYear)
      plusCostByYear = parseRecord(storedPlusCostByYear)
      bonusPercentByYear = parseRecord(storedBonusPercentByYear)

      isAccountSplitOpen = storedIsAccountSplitOpen ? JSON.parse(storedIsAccountSplitOpen) : false
      isRedemptionOpen = storedIsRedemptionOpen ? JSON.parse(storedIsRedemptionOpen) : false
      isTaxBonusSeparateAccount = storedIsTaxBonusSeparateAccount ? JSON.parse(storedIsTaxBonusSeparateAccount) : false
      setEnableRealValue(storedEnableRealValue ? JSON.parse(storedEnableRealValue) : false)
      setInflationRate(storedInflationRate ? JSON.parse(storedInflationRate) : 3)

      const hasStoredEsetiSource =
        Boolean(storedEsetiBaseInputs) ||
        Boolean(storedEsetiPaymentByYear) ||
        Boolean(storedEsetiWithdrawalByYear) ||
        Boolean(storedEsetiPaymentByYearTaxEligible) ||
        Boolean(storedEsetiWithdrawalByYearTaxEligible)
      if (hasStoredEsetiSource) {
        const baseInputsDefaults: EsetiBaseInputs = {
          regularPayment: 20000,
          frequency: "éves",
          annualYieldPercent: 12,
          annualIndexPercent: 0,
          keepYearlyPayment: true,
        }
        let esetiDurationUnit: DurationUnit = "year"
        let esetiDurationValue = durationValue
        let esetiBaseInputs = baseInputsDefaults
        let esetiFrequency: PaymentFrequency = "éves"

        try {
          const parsed = storedEsetiDurationUnit ? JSON.parse(storedEsetiDurationUnit) : "year"
          if (parsed === "year" || parsed === "month" || parsed === "day") esetiDurationUnit = parsed
        } catch {
          esetiDurationUnit = "year"
        }
        try {
          const parsed = storedEsetiDurationValue ? JSON.parse(storedEsetiDurationValue) : durationValue
          if (typeof parsed === "number" && parsed > 0) esetiDurationValue = parsed
        } catch {
          esetiDurationValue = durationValue
        }
        try {
          const parsed = storedEsetiBaseInputs ? JSON.parse(storedEsetiBaseInputs) : {}
          esetiBaseInputs = { ...baseInputsDefaults, ...(parsed as Partial<EsetiBaseInputs>) }
        } catch {
          esetiBaseInputs = baseInputsDefaults
        }
        if (
          storedEsetiFrequency === "havi" ||
          storedEsetiFrequency === "negyedéves" ||
          storedEsetiFrequency === "féléves" ||
          storedEsetiFrequency === "éves"
        ) {
          esetiFrequency = storedEsetiFrequency
        } else {
          esetiFrequency = esetiBaseInputs.frequency
        }
        let redemptionFeeDefaultPercent = 0
        try {
          redemptionFeeDefaultPercent = storedRedemptionFeeDefaultPercent ? JSON.parse(storedRedemptionFeeDefaultPercent) : 0
        } catch {
          redemptionFeeDefaultPercent = 0
        }

        eseti = {
          durationUnit: esetiDurationUnit,
          durationValue: esetiDurationValue,
          baseInputs: esetiBaseInputs,
          frequency: esetiFrequency,
          indexByYear: parseRecord(storedEsetiIndexByYear),
          paymentByYear: parseRecord(storedEsetiPaymentByYear),
          withdrawalByYear: parseRecord(storedEsetiWithdrawalByYear),
          indexByYearTaxEligible: parseRecord(storedEsetiIndexByYearTaxEligible),
          paymentByYearTaxEligible: parseRecord(storedEsetiPaymentByYearTaxEligible),
          withdrawalByYearTaxEligible: parseRecord(storedEsetiWithdrawalByYearTaxEligible),
          accountMaintenancePercentByYear: parseRecord(storedAccountMaintenancePercentByYear),
          redemptionFeeDefaultPercent,
          managementFees: parseList<StoredManagementFee>(storedManagementFees),
          bonuses: parseList<StoredBonus>(storedBonuses),
        }
      }

      // Validate required fields in inputs
      if (!inputs.currency || !inputs.frequency) {
        console.error("[v0] /osszesites inputs missing required fields:", {
          hasCurrency: !!inputs.currency,
          hasFrequency: !!inputs.frequency,
        })
        setComputedEsetiData(null)
        setIsComputing(false)
        return
      }

      const snapshot: CalculatorSnapshot = {
        inputs,
        durationUnit,
        durationValue,
        selectedInsurer,
        selectedProduct,
        enableNetting,
        indexByYear,
        paymentByYear,
        withdrawalByYear,
        taxCreditAmountByYear,
        taxCreditLimitByYear,
        investedShareByYear,
        redemptionFeeByYear,
        assetCostPercentByYear,
        plusCostByYear,
        bonusPercentByYear,
        isAccountSplitOpen,
        isRedemptionOpen,
        isTaxBonusSeparateAccount,
        eseti,
      }
      setCalculatorSnapshot(snapshot)
      const computed = computeSummaryDataFromSnapshot(snapshot)
      const computedEseti = computeEsetiSummaryDataFromSnapshot(snapshot)
      setComputedData(computed)
      setComputedEsetiData(computedEseti)
      updateData(computed)
    } catch (error) {
      console.error("[v0] /osszesites failed to compute data from sessionStorage:", error)
      setComputedEsetiData(null)
    } finally {
      setIsComputing(false)
    }
  }, [isHydrated, contextData, updateData, computedData])

  // Use computed data instead of contextData
  const data = computedData
  const safeData: CalculatorData = data ??
    contextData ?? {
      monthlyPayment: 0,
      yearlyPayment: 0,
      years: 0,
      currency: "HUF",
      displayCurrency: "HUF",
      eurToHufRate: 400,
      annualYieldPercent: 0,
      totalContributions: 0,
      totalReturn: 0,
      endBalance: 0,
      totalTaxCredit: 0,
      totalBonus: 0,
      totalCost: 0,
      totalAssetBasedCost: 0,
      totalRiskInsuranceCost: 0,
    }

  const getComputedValueForData = (sourceData: CalculatorData, key: RowKey): number | string => {
    switch (key) {
      case "accountName":
        if (sourceData.selectedProduct) {
          return getProductLabel(sourceData.selectedProduct)
        }
        if (contextData?.selectedProduct) {
          return getProductLabel(contextData.selectedProduct)
        }
        return fallbackProductLabel || "—"
      case "accountGoal":
        return sourceData.enableTaxCredit ? "Nyugdíjmegtakarítás és tőkenövelés" : "Tőkenövelés"
      case "strategy":
        return "Vegyes" // Always default to "Vegyes", never from context
      case "annualYield":
        return sourceData.annualYieldPercent !== undefined && !isNaN(sourceData.annualYieldPercent)
          ? `${sourceData.annualYieldPercent.toFixed(sourceData.annualYieldPercent % 1 === 0 ? 0 : 1)}%`
          : "—"
      case "finalEndBalance":
        return (sourceData.endBalance as number) || 0
      case "netFinalEndBalance":
        return (sourceData.netEndBalance as number) || 0
      default:
        return (sourceData[key] as number) || 0
    }
  }

  const getComputedValue = (key: RowKey): number | string => getComputedValueForData(safeData, key)

  const getValue = (key: RowKey): number | string => {
    if (summaryOverrides[key]?.value !== undefined) {
      return summaryOverrides[key]!.value!
    }
    return getComputedValue(key)
  }

  const getLabel = (key: RowKey, defaultLabel: string): string => {
    if (summaryOverrides[key]?.label !== undefined) {
      return summaryOverrides[key]!.label!
    }
    return defaultLabel
  }

  const formatValue = (
    value: number | string,
    showCurrency = true,
    suffix = "",
    valueCurrency?: Currency,
    displayCurrencyOverride?: Currency,
  ): string => {
    return formatValueForData(safeData, value, showCurrency, suffix, valueCurrency, displayCurrencyOverride)
  }

  const esetiSummaryData = computedEsetiData
  const hasEsetiSummaryData = Boolean(esetiSummaryData)

  const formatValueForData = (
    sourceData: CalculatorData,
    value: number | string,
    showCurrency = true,
    suffix = "",
    valueCurrency?: Currency,
    displayCurrencyOverride?: Currency,
  ): string => {
    if (typeof value === "string") return value

    let adjustedValue = value
    if (enableRealValue) {
      const yearsForReal = typeof sourceData.years === "number" ? sourceData.years : 0
      const inflationMultiplier = Math.pow(1 + inflationRate / 100, yearsForReal)
      if (isFinite(inflationMultiplier) && inflationMultiplier > 0) {
        adjustedValue = value / inflationMultiplier
      }
    }

    const fromCurrency = valueCurrency ?? sourceData.currency
    const displayCurrency = displayCurrencyOverride ?? sourceData.displayCurrency
    const displayValue = Math.round(convertForDisplay(adjustedValue, fromCurrency, displayCurrency, sourceData.eurToHufRate))
    const formatted = formatNumber(displayValue)
    if (!showCurrency) return formatted + suffix
    return `${formatted} ${displayCurrency === "HUF" ? "Ft" : "€"}${suffix}`
  }

  const buildTemplateRuntimeValuesFromData = (sourceData: CalculatorData): TemplateVariantRuntimeValues => {
    const sourceDataWithFx = sourceData as CalculatorData & { endBalanceHufCurrent?: number }
    const getMoney = (
      value: number,
      valueCurrency: Currency = sourceData.currency,
      displayCurrency: Currency = sourceData.displayCurrency,
    ) => formatValueForData(sourceData, value, true, "", valueCurrency, displayCurrency)
    const getMoneyOrBlank = (
      value: number | string | undefined | null,
      valueCurrency: Currency = sourceData.currency,
      displayCurrency: Currency = sourceData.displayCurrency,
    ) => {
      if (value === undefined || value === null || value === "") return ""
      return typeof value === "number" ? getMoney(value, valueCurrency, displayCurrency) : String(value)
    }
    const getPositiveMoneyOrBlank = (
      value: number | string | undefined | null,
      valueCurrency: Currency = sourceData.currency,
      displayCurrency: Currency = sourceData.displayCurrency,
    ) => {
      if (value === undefined || value === null || value === "") return ""
      if (typeof value === "number") {
        if (value <= 0) return ""
        return getMoney(value, valueCurrency, displayCurrency)
      }
      const raw = String(value).trim()
      if (!raw || /^0([,.]0+)?(?:\s*(Ft|HUF|EUR|USD|€))?$/i.test(raw)) return ""
      return raw
    }
    const hasFxSourceValues =
      (typeof sourceDataWithFx.endBalanceHufCurrent === "number" && sourceDataWithFx.endBalanceHufCurrent > 0) ||
      (typeof sourceData.endBalanceEUR500 === "number" && sourceData.endBalanceEUR500 > 0) ||
      (typeof sourceData.endBalanceEUR600 === "number" && sourceData.endBalanceEUR600 > 0)
    const includeFxConversionRows = sourceData.currency !== "HUF" && hasFxSourceValues

    return {
      accountName: sourceData.selectedProduct ? getProductLabel(sourceData.selectedProduct) : fallbackProductLabel || "—",
      accountGoal: sourceData.enableTaxCredit ? "Nyugdíjmegtakarítás és tőkenövelés" : "Tőkenövelés",
      monthlyPayment: getMoney(sourceData.monthlyPayment),
      yearlyPayment: getMoney(sourceData.yearlyPayment),
      years: formatValueForData(sourceData, sourceData.years, false, " év", undefined, sourceData.displayCurrency),
      totalContributions: getMoney(sourceData.totalContributions),
      strategy: sourceData.strategy?.trim() || "Vegyes",
      annualYield:
        sourceData.annualYieldPercent !== undefined && !isNaN(sourceData.annualYieldPercent)
          ? `${sourceData.annualYieldPercent.toFixed(sourceData.annualYieldPercent % 1 === 0 ? 0 : 1)}%`
          : "—",
      totalReturn: getMoney(sourceData.totalReturn),
      totalTaxCredit: getPositiveMoneyOrBlank(sourceData.totalTaxCredit),
      endBalance: getMoney(sourceData.endBalance),
      totalBonus: sourceData.productHasBonus ? getMoneyOrBlank(sourceData.totalBonus) : "",
      finalNet: getMoney(sourceData.endBalance),
      endBalanceHufCurrent: includeFxConversionRows ? getMoneyOrBlank(sourceDataWithFx.endBalanceHufCurrent, "HUF", "HUF") : "",
      endBalanceEUR500: includeFxConversionRows ? getMoneyOrBlank(sourceData.endBalanceEUR500, "HUF", "HUF") : "",
      endBalanceEUR600: includeFxConversionRows ? getMoneyOrBlank(sourceData.endBalanceEUR600, "HUF", "HUF") : "",
    }
  }

  const handleCellClick = (key: RowKey, type: "label" | "value", currentValue: string) => {
    setEsetiEditingCell(null)
    setEsetiEditingText("")
    setIsActivelyEditingEseti(false)
    setEditingCell({ key, type })
    setEditingText(currentValue)
    setIsActivelyEditing(true)
  }

  const handleSaveEdit = () => {
    if (!editingCell) return

    const { key, type } = editingCell

    if (type === "label") {
      // Save label override
      const trimmed = editingText.trim()
      setSummaryOverrides({
        ...summaryOverrides,
        [key]: {
          ...summaryOverrides[key],
          label: trimmed,
        },
      })
    } else {
      // Save value override
      const originalValue = getComputedValue(key)

      if (typeof originalValue === "string") {
        // String value (strategy, annualYield, etc.)
        setSummaryOverrides({
          ...summaryOverrides,
          [key]: {
            ...summaryOverrides[key],
            value: editingText.trim(),
          },
        })
      } else {
        // Numeric value (allow suffixes like "év")
        const sanitized = editingText.replace(/[^0-9,.\-]/g, "")
        const parsed = parseNumber(sanitized)
        if (!isNaN(parsed) && parsed >= 0) {
          const calcValue = convertForDisplay(parsed, safeData.displayCurrency, safeData.currency, safeData.eurToHufRate)

          // If value matches computed, remove override
          if (Math.abs(calcValue - (originalValue as number)) < 0.01) {
            const newOverrides = { ...summaryOverrides }
            if (newOverrides[key]) {
              delete newOverrides[key].value
              if (!newOverrides[key].label) {
                delete newOverrides[key]
              }
            }
            setSummaryOverrides(newOverrides)
          } else {
            setSummaryOverrides({
              ...summaryOverrides,
              [key]: {
                ...summaryOverrides[key],
                value: calcValue,
              },
            })
          }
        }
      }
    }

    setEditingCell(null)
    setEditingText("")
    setIsActivelyEditing(false)
  }

  type SummaryRow = {
    key: RowKey
    defaultLabel: string
    value: number | string
    isNumeric: boolean
    suffix?: string
    showCurrency?: boolean
    isHighlight?: boolean
    bgColor?: string
    valueCurrency?: Currency
    displayCurrency?: Currency
    textClass?: string
    textColor?: string
  }

  const sections: Array<{
    title: string
    highlight?: boolean
    rows: SummaryRow[]
  }> = [
    {
      title: "Alapadatok",
      rows: [
        {
          key: "accountName" as RowKey,
          defaultLabel: "Megtakarítási számla megnevezése",
          value: getValue("accountName"),
          isNumeric: false,
        },
        {
          key: "accountGoal" as RowKey,
          defaultLabel: "Megtakarítási számla célja",
          value: getValue("accountGoal"),
          isNumeric: false,
        },
        {
          key: "monthlyPayment" as RowKey,
          defaultLabel: "Megtakarítási havi összeg",
          value: getValue("monthlyPayment"),
          isNumeric: true,
        },
        {
          key: "yearlyPayment" as RowKey,
          defaultLabel: "Megtakarítási éves összeg",
          value: getValue("yearlyPayment"),
          isNumeric: true,
        },
        {
          key: "years" as RowKey,
          defaultLabel: "Tervezett időtartam",
          value: getValue("years"),
          isNumeric: true,
          suffix: " év",
          showCurrency: false,
        },
        {
          key: "totalContributions" as RowKey,
          defaultLabel: "Teljes befizetés",
          value: getValue("totalContributions"),
          isNumeric: true,
        },
        {
          key: "strategy" as RowKey,
          defaultLabel: "Hozam stratégia",
          value: getValue("strategy"),
          isNumeric: false,
        },
        {
          key: "annualYield" as RowKey,
          defaultLabel: "Éves nettó hozam",
          value: getValue("annualYield"),
          isNumeric: false,
        },
      ],
    },
    {
      title: "Hozamok és jóváírások",
      rows: [
        {
          key: "totalReturn" as RowKey,
          defaultLabel: "Várható hozam",
          value: getValue("totalReturn"),
          isNumeric: true,
        },
        {
          key: "endBalance" as RowKey,
          defaultLabel: "Megtakarítás számlán várható összeg",
          value: getValue("endBalance"),
          isNumeric: true,
        },
        ...(safeData.enableTaxCredit
          ? [
              {
                key: "totalTaxCredit" as RowKey,
                defaultLabel: "Adójóváírás a tartam alatt összesen",
                value: getValue("totalTaxCredit"),
                isNumeric: true,
              },
            ]
          : []),
        ...(safeData.productHasBonus
          ? [
              {
                key: "totalBonus" as RowKey,
                defaultLabel: "Bónuszjóváírás tartam alatt összesen",
                value: getValue("totalBonus"),
                isNumeric: true,
              },
            ]
          : []),
      ],
    },
    {
      title: "Végösszegek",
      highlight: true,
      rows: [
        {
          key: "finalEndBalance" as RowKey,
          defaultLabel: "Megtakarítási számlán várható összeg",
          value: getValue("finalEndBalance"),
          isNumeric: true,
          isHighlight: true,
          bgColor: "bg-primary text-primary-foreground",
        },
        ...(safeData.enableNetting
          ? [
              {
                key: "netFinalEndBalance" as RowKey,
                defaultLabel: "Megtakarítási számlán várható nettó összeg",
                value: getValue("netFinalEndBalance"),
                isNumeric: true,
                isHighlight: false,
                bgColor: "bg-secondary/80 text-secondary-foreground font-semibold",
              },
            ]
          : []),
        ...(safeData.endBalanceHufCurrent !== undefined
          ? [
              {
                key: "endBalanceHufCurrent" as RowKey,
                defaultLabel: "Jelen árfolyamon számolva",
                value: getValue("endBalanceHufCurrent"),
                isNumeric: true,
                bgColor: "bg-amber-700 dark:bg-amber-800",
                valueCurrency: "HUF",
                displayCurrency: "HUF",
                textClass: "text-white",
                textColor: "#ffffff",
              },
            ]
          : []),
        ...(safeData.endBalanceEUR500 !== undefined
          ? [
              {
                key: "endBalanceEUR500" as RowKey,
                defaultLabel: "500 Ft-os Euróval számolva",
                value: getValue("endBalanceEUR500"),
                isNumeric: true,
                bgColor: "bg-amber-800 dark:bg-amber-900",
                valueCurrency: "HUF",
                displayCurrency: "HUF",
                textClass: "text-white",
                textColor: "#ffffff",
              },
            ]
          : []),
        ...(safeData.endBalanceEUR600 !== undefined
          ? [
              {
                key: "endBalanceEUR600" as RowKey,
                defaultLabel: "600 Ft-os Euróval számolva",
                value: getValue("endBalanceEUR600"),
                isNumeric: true,
                bgColor: "bg-amber-900 dark:bg-amber-950",
                valueCurrency: "HUF",
                displayCurrency: "HUF",
                textClass: "text-white",
                textColor: "#ffffff",
              },
            ]
          : []),
      ],
    },
  ]

  const allRows = sections.flatMap((section) => section.rows)

  const totalSummaryData = useMemo<CalculatorData | null>(() => {
    if (!esetiSummaryData) return null
    const sumOptional = (left?: number, right?: number) => {
      if (left === undefined && right === undefined) return undefined
      return (left ?? 0) + (right ?? 0)
    }
    return {
      ...safeData,
      monthlyPayment: safeData.monthlyPayment + esetiSummaryData.monthlyPayment,
      yearlyPayment: safeData.yearlyPayment + esetiSummaryData.yearlyPayment,
      years: Math.max(safeData.years, esetiSummaryData.years),
      totalContributions: safeData.totalContributions + esetiSummaryData.totalContributions,
      totalReturn: safeData.totalReturn + esetiSummaryData.totalReturn,
      endBalance: safeData.endBalance + esetiSummaryData.endBalance,
      totalTaxCredit: safeData.totalTaxCredit + esetiSummaryData.totalTaxCredit,
      totalBonus: safeData.totalBonus + esetiSummaryData.totalBonus,
      totalCost: safeData.totalCost + esetiSummaryData.totalCost,
      totalAssetBasedCost: safeData.totalAssetBasedCost + esetiSummaryData.totalAssetBasedCost,
      totalRiskInsuranceCost: safeData.totalRiskInsuranceCost + esetiSummaryData.totalRiskInsuranceCost,
      enableTaxCredit: Boolean(safeData.enableTaxCredit || esetiSummaryData.enableTaxCredit),
      productHasBonus: Boolean(safeData.productHasBonus || esetiSummaryData.productHasBonus),
      endBalanceHufCurrent: sumOptional(safeData.endBalanceHufCurrent, esetiSummaryData.endBalanceHufCurrent),
      endBalanceEUR500: sumOptional(safeData.endBalanceEUR500, esetiSummaryData.endBalanceEUR500),
      endBalanceEUR600: sumOptional(safeData.endBalanceEUR600, esetiSummaryData.endBalanceEUR600),
      netEndBalance: sumOptional(safeData.netEndBalance, esetiSummaryData.netEndBalance),
      netEndBalanceWithTax: sumOptional(safeData.netEndBalanceWithTax, esetiSummaryData.netEndBalanceWithTax),
    }
  }, [safeData, esetiSummaryData])

  const esetiPaymentPattern = useMemo(() => {
    if (!calculatorSnapshot?.eseti || !esetiSummaryData) return null

    const snapshot = calculatorSnapshot
    const eseti = snapshot.eseti
    const selectedProduct = snapshot.selectedProduct
    const requestedCurrency = coerceCurrencyForProduct(selectedProduct, (snapshot.inputs.currency as Currency) || "HUF")
    const baseEnableTaxCredit = Boolean(snapshot.inputs.enableTaxCredit)
    const effectiveCurrency = resolveEffectiveCurrencyForProduct(selectedProduct, requestedCurrency, baseEnableTaxCredit)
    const mainAllowedFrequencies = getAllowedFrequenciesForProduct(
      selectedProduct,
      effectiveCurrency,
      baseEnableTaxCredit,
      snapshot.inputs,
    )
    const mainEffectiveFrequency = mainAllowedFrequencies.includes((snapshot.inputs.frequency as PaymentFrequency) || "havi")
      ? ((snapshot.inputs.frequency as PaymentFrequency) || "havi")
      : mainAllowedFrequencies[0]
    const mainInputs = {
      ...snapshot.inputs,
      currency: effectiveCurrency,
      frequency: mainEffectiveFrequency,
      enableTaxCredit: baseEnableTaxCredit,
    } as InputsDaily
    const effectiveProductVariant = resolveEffectiveProductVariantForProduct(selectedProduct, mainInputs, effectiveCurrency)
    const isPremiumSelectionNy06 =
      selectedProduct === "alfa_premium_selection" &&
      (effectiveProductVariant === "alfa_premium_selection_ny06" || effectiveProductVariant === "alfa_premium_selection_ny22")

    const esetiDurationValue = Math.max(1, Math.round(eseti.durationValue))
    const esetiYearsValue = getYearsFromDuration(eseti.durationUnit, esetiDurationValue)
    const esetiTotalYearsForPlan = Math.max(1, Math.ceil(esetiYearsValue))
    const desiredEsetiFrequency = eseti.baseInputs.frequency || eseti.frequency || "éves"
    const esetiAllowedFrequencies = getAllowedFrequenciesForProduct(
      selectedProduct,
      effectiveCurrency,
      baseEnableTaxCredit,
      {
        ...mainInputs,
        annualYieldPercent: eseti.baseInputs.annualYieldPercent,
        annualIndexPercent: eseti.baseInputs.annualIndexPercent,
        frequency: desiredEsetiFrequency,
      } as InputsDaily,
    )
    const esetiFrequency = esetiAllowedFrequencies.includes(desiredEsetiFrequency)
      ? desiredEsetiFrequency
      : esetiAllowedFrequencies[0]
    const esetiPeriodsPerYear = getPeriodsPerYear(esetiFrequency)
    const esetiBaseYear1Payment = eseti.baseInputs.keepYearlyPayment
      ? (eseti.baseInputs.regularPayment || 0) * 12
      : (eseti.baseInputs.regularPayment || 0) * esetiPeriodsPerYear

    const immediatePlan = buildYearlyPlan({
      years: esetiTotalYearsForPlan,
      baseYear1Payment: esetiBaseYear1Payment,
      baseAnnualIndexPercent: eseti.baseInputs.annualIndexPercent || 0,
      indexByYear: eseti.indexByYear,
      paymentByYear: eseti.paymentByYear,
      withdrawalByYear: eseti.withdrawalByYear,
    })
    const taxEligiblePlan = buildYearlyPlan({
      years: esetiTotalYearsForPlan,
      baseYear1Payment: esetiBaseYear1Payment,
      baseAnnualIndexPercent: eseti.baseInputs.annualIndexPercent || 0,
      indexByYear: eseti.indexByYearTaxEligible,
      paymentByYear: eseti.paymentByYearTaxEligible,
      withdrawalByYear: eseti.withdrawalByYearTaxEligible,
    })

    const combinedPaymentsByYear = Array.from({ length: esetiTotalYearsForPlan }, (_item, index) => {
      const year = index + 1
      const immediateAmount = immediatePlan.yearlyPaymentsPlan[year] ?? 0
      const taxEligibleAmount = isPremiumSelectionNy06 ? (taxEligiblePlan.yearlyPaymentsPlan[year] ?? 0) : 0
      return {
        year,
        amount: immediateAmount + taxEligibleAmount,
      }
    })
    const positivePayments = combinedPaymentsByYear.filter((item) => item.amount > 0)
    const firstPositive = positivePayments[0] ?? null
    const isSinglePayment =
      positivePayments.length === 1 &&
      firstPositive?.year === 1 &&
      combinedPaymentsByYear.slice(1).every((item) => item.amount <= 0)
    const isYearlyUniform =
      combinedPaymentsByYear.length > 0 &&
      combinedPaymentsByYear.every((item) => item.amount > 0) &&
      combinedPaymentsByYear.every((item) => item.amount === combinedPaymentsByYear[0]?.amount)

    return {
      combinedPaymentsByYear,
      positivePayments,
      isSinglePayment,
      isYearlyUniform,
      uniformAmount: isYearlyUniform ? (combinedPaymentsByYear[0]?.amount ?? 0) : null,
      singleAmount: isSinglePayment ? (firstPositive?.amount ?? 0) : null,
    }
  }, [calculatorSnapshot, esetiSummaryData])

  const esetiSummaryRows = useMemo<EsetiSummaryRow[]>(() => {
    if (!esetiSummaryData) return []
    const totalData = totalSummaryData ?? safeData
    const yearsLabel = formatValueForData(esetiSummaryData, esetiSummaryData.years, false, " év")
    const mixedPaymentRows: EsetiSummaryRow[] =
      esetiPaymentPattern && !esetiPaymentPattern.isSinglePayment && !esetiPaymentPattern.isYearlyUniform
        ? esetiPaymentPattern.positivePayments.map((item) => ({
            key: `esetiPaymentYear${item.year}`,
            defaultLabel: `${item.year}. év`,
            value: item.amount,
            isNumeric: true,
            sourceData: esetiSummaryData,
            highlight: "details" as const,
          }))
        : []
    const titleLabel = esetiPaymentPattern?.isSinglePayment
      ? `Eseti számla tervezete egyszeri ${formatValueForData(esetiSummaryData, esetiPaymentPattern.singleAmount ?? 0, true)}-os befizetés esetén`
      : esetiPaymentPattern?.isYearlyUniform
        ? `Eseti számla tervezete évi ${formatValueForData(esetiSummaryData, esetiPaymentPattern.uniformAmount ?? 0, true)}-os befizetés esetén`
        : "Eseti számla tervezete"
    return [
      {
        key: "esetiHeader",
        defaultLabel: titleLabel,
        value: "",
        isNumeric: false,
        sourceData: esetiSummaryData,
        highlight: "header" as const,
        fullWidth: true,
      },
      ...(mixedPaymentRows.length > 0
        ? [
            {
              key: "esetiPaymentDetailsHeader",
              defaultLabel: "Eseti befizetések év szerint",
              value: "",
              isNumeric: false,
              sourceData: esetiSummaryData,
              highlight: "details" as const,
              fullWidth: true,
            } satisfies EsetiSummaryRow,
            ...mixedPaymentRows,
          ]
        : []),
      {
        key: "esetiEndBalance",
        defaultLabel: `Eseti számlán várható összeg ${yearsLabel} alatt`,
        value: esetiSummaryData.endBalance,
        isNumeric: true,
        sourceData: esetiSummaryData,
        highlight: "primary" as const,
      },
      {
        key: "esetiTotalContributions",
        defaultLabel: `Eseti számla összes befizetése ${yearsLabel} alatt`,
        value: esetiSummaryData.totalContributions,
        isNumeric: true,
        sourceData: esetiSummaryData,
        highlight: "default" as const,
      },
      {
        key: "esetiTotalReturn",
        defaultLabel: `Eseti számla összes hozama ${yearsLabel} alatt`,
        value: esetiSummaryData.totalReturn,
        isNumeric: true,
        sourceData: esetiSummaryData,
        highlight: "default" as const,
      },
      {
        key: "esetiCombinedTotalContributions",
        defaultLabel: "Összes befizetés",
        value: totalData.totalContributions,
        isNumeric: true,
        sourceData: totalData,
        highlight: "default" as const,
      },
      {
        key: "esetiCombinedEndBalance",
        defaultLabel: "Teljes megtakarítás nettó értéke",
        value: totalData.endBalance,
        isNumeric: true,
        sourceData: totalData,
        highlight: "secondary" as const,
      },
      ...(typeof totalData.endBalanceHufCurrent === "number"
        ? [
            {
              key: "esetiCombinedCurrentFx",
              defaultLabel: "Teljes megtakarítás jelen árfolyamon",
              value: totalData.endBalance,
              isNumeric: true,
              sourceData: totalData,
              highlight: "default" as const,
            },
            {
              key: "esetiCombinedEur500",
              defaultLabel: "500 Ft-os Euróval számolva",
              value: typeof totalData.endBalanceEUR500 === "number" ? totalData.endBalanceEUR500 : "",
              isNumeric: typeof totalData.endBalanceEUR500 === "number",
              sourceData: totalData,
              highlight: "default" as const,
              valueCurrency: "HUF",
              displayCurrency: "HUF",
            },
            {
              key: "esetiCombinedEur600",
              defaultLabel: "600 Ft-os Euróval számolva",
              value: typeof totalData.endBalanceEUR600 === "number" ? totalData.endBalanceEUR600 : "",
              isNumeric: typeof totalData.endBalanceEUR600 === "number",
              sourceData: totalData,
              highlight: "default" as const,
              valueCurrency: "HUF",
              displayCurrency: "HUF",
            },
          ]
        : []),
    ]
  }, [esetiSummaryData, totalSummaryData, safeData, esetiPaymentPattern])

  const esetiSummaryPalette = useMemo(() => {
    const base = normalizeHexColorInput(fxBaseColor) ?? "#c55a11"
    return {
      header: base,
      details: darkenHexColor(base, 0.08),
      primary: darkenHexColor(base, 0.14),
      default: darkenHexColor(base, 0.22),
      secondary: darkenHexColor(base, 0.3),
    }
  }, [fxBaseColor])

  useEffect(() => {
    const measureDivider = () => {
      const rowEl = isExcelView ? regularExcelFirstRowRef.current : regularNormalFirstRowRef.current
      const labelEl = isExcelView ? regularExcelFirstLabelCellRef.current : regularNormalFirstLabelCellRef.current
      if (!rowEl || !labelEl) return
      const rowRect = rowEl.getBoundingClientRect()
      const labelRect = labelEl.getBoundingClientRect()
      if (rowRect.width <= 0 || labelRect.width <= 0) return
      const ratio = Math.min(0.9, Math.max(0.1, labelRect.width / rowRect.width))
      setEsetiColumnWidths({
        label: `${ratio * 100}%`,
        value: `${(1 - ratio) * 100}%`,
      })
    }

    const frameId = window.requestAnimationFrame(measureDivider)
    window.addEventListener("resize", measureDivider)
    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener("resize", measureDivider)
    }
  }, [isExcelView, allRows.length, sections.length, summaryOverrides])

  const getEsetiRowLabel = (row: EsetiSummaryRow) => esetiSummaryOverrides[row.key]?.label ?? row.defaultLabel
  const getEsetiRowValue = (row: EsetiSummaryRow) =>
    esetiSummaryOverrides[row.key]?.value !== undefined ? esetiSummaryOverrides[row.key]!.value! : row.value
  const formatEsetiRowValue = (row: EsetiSummaryRow) =>
    row.isNumeric
      ? formatValueForData(
          row.sourceData,
          getEsetiRowValue(row),
          row.showCurrency !== false,
          row.suffix || "",
          row.valueCurrency,
          row.displayCurrency,
        )
      : String(getEsetiRowValue(row) ?? "")
  const handleEsetiCellClick = (row: EsetiSummaryRow, type: "label" | "value", currentValue: string) => {
    setEditingCell(null)
    setEditingText("")
    setIsActivelyEditing(false)
    setEsetiEditingCell({ key: row.key, type })
    setEsetiEditingText(currentValue)
    setIsActivelyEditingEseti(true)
  }
  const handleSaveEsetiEdit = (row: EsetiSummaryRow) => {
    if (!esetiEditingCell) return
    const { key, type } = esetiEditingCell
    if (type === "label") {
      const trimmed = esetiEditingText.trim()
      setEsetiSummaryOverrides({
        ...esetiSummaryOverrides,
        [key]: {
          ...esetiSummaryOverrides[key],
          label: trimmed,
        },
      })
    } else {
      const originalValue = row.value
      if (typeof originalValue === "string") {
        setEsetiSummaryOverrides({
          ...esetiSummaryOverrides,
          [key]: {
            ...esetiSummaryOverrides[key],
            value: esetiEditingText.trim(),
          },
        })
      } else {
        const sanitized = esetiEditingText.replace(/[^0-9,.\-]/g, "")
        const parsed = parseNumber(sanitized)
        if (!isNaN(parsed) && parsed >= 0) {
          const sourceCurrency = row.valueCurrency ?? row.sourceData.currency
          const displayCurrency = row.displayCurrency ?? row.sourceData.displayCurrency
          const calcValue = convertForDisplay(parsed, displayCurrency, sourceCurrency, row.sourceData.eurToHufRate)
          if (Math.abs(calcValue - originalValue) < 0.01) {
            const newOverrides = { ...esetiSummaryOverrides }
            if (newOverrides[key]) {
              delete newOverrides[key].value
              if (!newOverrides[key].label) delete newOverrides[key]
            }
            setEsetiSummaryOverrides(newOverrides)
          } else {
            setEsetiSummaryOverrides({
              ...esetiSummaryOverrides,
              [key]: {
                ...esetiSummaryOverrides[key],
                value: calcValue,
              },
            })
          }
        }
      }
    }
    setEsetiEditingCell(null)
    setEsetiEditingText("")
    setIsActivelyEditingEseti(false)
  }

  const getSummaryEmailValues = (): TemplateVariantRuntimeValues => {
    const getText = (key: RowKey) => String(getValue(key) ?? "")
    const getMoney = (key: RowKey) => formatValue(getValue(key) as number, true, "", undefined, safeData.displayCurrency)
    const getMoneyWithCurrencyOrBlank = (
      key: RowKey,
      displayCurrency: "HUF" | "EUR" | "USD",
      valueCurrency: "HUF" | "EUR" | "USD",
    ) => {
      const v = getValue(key)
      if (v === undefined || v === null || v === "") return ""
      if (typeof v === "number") return formatValue(v, true, "", valueCurrency, displayCurrency)
      return String(v)
    }
    const getMoneyOrBlank = (key: RowKey) => {
      const v = getValue(key)
      if (v === undefined || v === null || v === "") return ""
      return typeof v === "number" ? formatValue(v, true, "", undefined, safeData.displayCurrency) : String(v)
    }
    const getPositiveMoneyOrBlank = (key: RowKey) => {
      const v = getValue(key)
      if (v === undefined || v === null || v === "") return ""
      if (typeof v === "number") {
        if (v <= 0) return ""
        return formatValue(v, true, "", undefined, safeData.displayCurrency)
      }
      const raw = String(v).trim()
      if (!raw || /^0([,.]0+)?(?:\s*(Ft|HUF|EUR|USD|€))?$/i.test(raw)) return ""
      return raw
    }
    const hasFxSourceValues =
      (typeof safeData.endBalanceHufCurrent === "number" && safeData.endBalanceHufCurrent > 0) ||
      (typeof safeData.endBalanceEUR500 === "number" && safeData.endBalanceEUR500 > 0) ||
      (typeof safeData.endBalanceEUR600 === "number" && safeData.endBalanceEUR600 > 0)
    const includeFxConversionRows = safeData.currency !== "HUF" && hasFxSourceValues

    return {
      accountName: getText("accountName"),
      accountGoal: getText("accountGoal"),
      monthlyPayment: getMoney("monthlyPayment"),
      yearlyPayment: getMoney("yearlyPayment"),
      years: formatValue(getValue("years") as number, false, " év", undefined, safeData.displayCurrency),
      totalContributions: getMoney("totalContributions"),
      strategy: getText("strategy"),
      annualYield: getText("annualYield"),
      totalReturn: getMoney("totalReturn"),
      totalTaxCredit: getPositiveMoneyOrBlank("totalTaxCredit"),
      endBalance: getMoney("endBalance"),
      totalBonus: safeData.productHasBonus ? getMoneyOrBlank("totalBonus") : "",
      finalNet: getMoney("endBalance"),
      endBalanceHufCurrent: includeFxConversionRows ? getMoneyWithCurrencyOrBlank("endBalanceHufCurrent", "HUF", "HUF") : "",
      endBalanceEUR500: includeFxConversionRows ? getMoneyWithCurrencyOrBlank("endBalanceEUR500", "HUF", "HUF") : "",
      endBalanceEUR600: includeFxConversionRows ? getMoneyWithCurrencyOrBlank("endBalanceEUR600", "HUF", "HUF") : "",
    }
  }

  const availableExtraEmailProducts = useMemo(() => {
    if (!calculatorSnapshot?.selectedInsurer) {
      return calculatorSnapshot?.selectedProduct
        ? [{ value: calculatorSnapshot.selectedProduct, label: getProductLabel(calculatorSnapshot.selectedProduct) }]
        : []
    }
    if (calculatorSnapshot.selectedInsurer === "Egyedi") {
      return calculatorSnapshot.selectedProduct
        ? [{ value: calculatorSnapshot.selectedProduct, label: getProductLabel(calculatorSnapshot.selectedProduct) }]
        : []
    }
    const catalogProducts = getAvailableProductsForInsurerFromCatalog(calculatorSnapshot.selectedInsurer)
    if (catalogProducts.length > 0) {
      return catalogProducts.map((product) => ({
        value: product.value,
        label: product.label,
      }))
    }
    return calculatorSnapshot.selectedProduct
      ? [{ value: calculatorSnapshot.selectedProduct, label: getProductLabel(calculatorSnapshot.selectedProduct) }]
      : []
  }, [calculatorSnapshot, getProductLabel])

  const createExtraEmailTableDefaults = (): ExtraEmailTableConfig | null => {
    if (!calculatorSnapshot || !data) return null
    const selectedProduct =
      data.selectedProduct ||
      calculatorSnapshot.selectedProduct ||
      availableExtraEmailProducts[0]?.value ||
      ""
    if (!selectedProduct) return null
    const baseCurrency = coerceCurrencyForProduct(selectedProduct, data.displayCurrency)
    const baseEnableTaxCredit = Boolean(data.enableTaxCredit ?? calculatorSnapshot.inputs.enableTaxCredit)
    const effectiveCurrency = resolveEffectiveCurrencyForProduct(selectedProduct, baseCurrency, baseEnableTaxCredit)
    const allowedFrequencies = getAllowedFrequenciesForProduct(selectedProduct, effectiveCurrency, baseEnableTaxCredit, calculatorSnapshot.inputs)
    const baseFrequencyCandidate = (calculatorSnapshot.inputs.frequency as PaymentFrequency) || "havi"
    return {
      id: `extra-table-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      selectedProduct,
      currency: baseCurrency,
      frequency: allowedFrequencies.includes(baseFrequencyCandidate) ? baseFrequencyCandidate : allowedFrequencies[0],
      paymentAmount: Number(calculatorSnapshot.inputs.regularPayment || data.monthlyPayment || 0),
      durationYears: Math.max(1, Math.round(data.years || 10)),
      annualYieldPercent: Number(data.annualYieldPercent || 0),
      enableTaxCredit: baseEnableTaxCredit,
    }
  }

  const extraEmailTableArtifacts = useMemo<ExtraEmailTableArtifacts[]>(() => {
    if (!calculatorSnapshot) return []
    const extraTableTemplateHtml = templateMappings.find((mapping) => mapping.key === "calculator_table")?.sourceSnippet
    return extraEmailTables
      .map((config) => {
        const selectedProduct = config.selectedProduct || calculatorSnapshot.selectedProduct || ""
        if (!selectedProduct) return null
        const requestedCurrency = coerceCurrencyForProduct(selectedProduct, config.currency)
        const effectiveCurrency = resolveEffectiveCurrencyForProduct(selectedProduct, requestedCurrency, config.enableTaxCredit)
        const allowedFrequencies = getAllowedFrequenciesForProduct(
          selectedProduct,
          effectiveCurrency,
          config.enableTaxCredit,
          calculatorSnapshot.inputs,
        )
        const effectiveFrequency = allowedFrequencies.includes(config.frequency) ? config.frequency : allowedFrequencies[0]
        const computed = computeSummaryDataFromSnapshot(calculatorSnapshot, {
          selectedProduct,
          inputOverrides: {
            currency: requestedCurrency,
            frequency: effectiveFrequency,
            regularPayment: config.paymentAmount,
            annualYieldPercent: config.annualYieldPercent,
            enableTaxCredit: config.enableTaxCredit,
          },
          durationUnit: "year",
          durationValue: Math.max(1, Math.round(config.durationYears)),
        })
        const runtimeValues = buildTemplateRuntimeValuesFromData(computed)
        return {
          id: config.id,
          html: wrapSessionExtraEmailTableHtml(config.id, buildCalculatorTableHtmlFromTemplate(runtimeValues, extraTableTemplateHtml)),
          plain: buildCalculatorTablePlain(runtimeValues),
        }
      })
      .filter((item): item is ExtraEmailTableArtifacts => Boolean(item))
  }, [buildTemplateRuntimeValuesFromData, calculatorSnapshot, computeSummaryDataFromSnapshot, extraEmailTables, templateMappings])

  const buildTemplateEmailArtifacts = (input: {
    htmlContent: string
    textContent: string
    mappings: TemplateFieldMapping[]
    safeName: string
    safeUntil: string
    summaryValues: TemplateVariantRuntimeValues
    displayCurrency: Currency
    selectedProduct?: string
  }) => {
    const tableMapping = input.mappings.find((mapping) => mapping.key === "calculator_table")
    const calculatorTableHtml = buildCalculatorTableHtmlFromTemplate(input.summaryValues, tableMapping?.sourceSnippet)
    const calculatorTablePlain = buildCalculatorTablePlain(input.summaryValues)
    const fixedAmounts = getFixedAmountValues(input.displayCurrency)
    const rendered = renderEmailTemplate({
      template: {
        htmlContent: input.htmlContent,
        textContent: input.textContent,
        mappings: input.mappings,
      },
      values: {
        name: input.safeName,
        amount: input.summaryValues.monthlyPayment,
        deadline: input.safeUntil,
        currency: toTemplateCurrencyLabel(input.displayCurrency),
        tone: emailTegezo ? "Kedves" : "Tisztelt",
        calculator_table: "{{calculator_table}}",
        fixed_small_amount: fixedAmounts.fixedSmallAmount,
        fixed_large_amount: fixedAmounts.fixedLargeAmount,
        retirement_section: "{{retirement_section}}",
        bonus_section: "{{bonus_section}}",
      },
      calculatorTableHtml,
      calculatorTablePlain,
      accountGoalPhrase: input.summaryValues.accountGoal,
      isAllianzEletprogram: input.selectedProduct === "allianz_eletprogram",
    })
    const extraHtml = extraEmailTableArtifacts.map((item) => item.html).join("")
    const extraPlain = extraEmailTableArtifacts.map((item) => item.plain).join("\n\n")
    const renderedHtml = rendered.html || input.htmlContent || ""
    const renderedPlain = rendered.plain || input.textContent || htmlToPlainText(renderedHtml)
    return {
      html: appendExtraTablesAfterPrimaryTable(renderedHtml, calculatorTableHtml, extraHtml),
      plain: extraPlain ? [renderedPlain, extraPlain].filter(Boolean).join("\n\n") : renderedPlain,
      calculatorTableHtml,
      calculatorTablePlain,
    }
  }

  const addExtraEmailTable = () => {
    const defaults = createExtraEmailTableDefaults()
    if (!defaults) return
    setExtraEmailTables((current) => [...current, defaults])
  }

  const updateExtraEmailTable = (id: string, patch: Partial<ExtraEmailTableConfig>) => {
    setExtraEmailTables((current) =>
      current.map((item) => {
        if (item.id !== id) return item
        const previousCurrency = coerceCurrencyForProduct(item.selectedProduct, item.currency)
        const next = { ...item, ...patch }
        const allowedCurrencies = getAllowedCurrenciesForProduct(next.selectedProduct)
        next.currency = allowedCurrencies.includes(next.currency) ? next.currency : allowedCurrencies[0]
        next.paymentAmount = Math.max(0, Number(next.paymentAmount || 0))
        if (next.currency !== previousCurrency && next.paymentAmount > 0) {
          const eurToHufRate = calculatorSnapshot?.inputs.eurToHufRate || safeData.eurToHufRate || 400
          next.paymentAmount = convertExtraEmailTablePaymentAmount(next.paymentAmount, previousCurrency, next.currency, eurToHufRate)
        }
        const effectiveCurrency = resolveEffectiveCurrencyForProduct(next.selectedProduct, next.currency, next.enableTaxCredit)
        const allowedFrequencies = calculatorSnapshot
          ? getAllowedFrequenciesForProduct(next.selectedProduct, effectiveCurrency, next.enableTaxCredit, calculatorSnapshot.inputs)
          : ["havi", "negyedéves", "féléves", "éves"]
        next.frequency = allowedFrequencies.includes(next.frequency) ? next.frequency : allowedFrequencies[0]
        next.durationYears = Math.max(1, Math.round(next.durationYears || 1))
        return next
      }),
    )
  }

  if (!isHydrated || isComputing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Betöltés...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Nincs elérhető adat</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Vissza a kalkulátorhoz
          </Button>
        </div>
      </div>
    )
  }

  const removeExtraEmailTable = (id: string) => {
    setExtraEmailTables((current) => current.filter((item) => item.id !== id))
  }

  const getCurrentVariantSelectionInput = () => ({
    emailTegezo,
    selectedProduct: data.selectedProduct || contextData?.selectedProduct || undefined,
    displayCurrency: data.displayCurrency,
    enableTaxCredit: Boolean(data.enableTaxCredit ?? contextData?.enableTaxCredit),
  })

  const renderCurrentTemplateVariant = (
    variant: TemplateVariantItem,
    mappings: TemplateFieldMapping[],
    options?: {
      displayCurrency?: "HUF" | "EUR" | "USD"
      subject?: string
      previewMode?: boolean
    },
  ) => {
    const summaryValues = getSummaryEmailValues()
    const safeName = (emailClientName || "Ügyfél").trim()
    const safeUntil = (emailOfferUntil || "").trim()
    const tableMapping = mappings.find((mapping) => mapping.key === "calculator_table")
    const calculatorTableHtml = buildCalculatorTableHtmlFromTemplate(summaryValues, tableMapping?.sourceSnippet)
    const calculatorTablePlain = buildCalculatorTablePlain(summaryValues)
    return renderStoredTemplateVariant({
      variant,
      mappings,
      safeName,
      safeUntil,
      displayCurrency: options?.displayCurrency || data.displayCurrency,
      values: summaryValues,
      calculatorTableHtml,
      calculatorTablePlain,
      subject: options?.subject,
      previewMode: options?.previewMode,
    })
  }

  const buildCurrentTemplateVariantArtifacts = (
    variant: TemplateVariantItem,
    mappings: TemplateFieldMapping[],
    options?: {
      displayCurrency?: "HUF" | "EUR" | "USD"
      subject?: string
    },
  ) => {
    const summaryValues = getSummaryEmailValues()
    const safeName = (emailClientName || "Ügyfél").trim()
    const safeUntil = (emailOfferUntil || "").trim()
    const tableMapping = mappings.find((mapping) => mapping.key === "calculator_table")
    const calculatorTableHtml = buildCalculatorTableHtmlFromTemplate(summaryValues, tableMapping?.sourceSnippet)
    const calculatorTablePlain = buildCalculatorTablePlain(summaryValues)
    return buildStoredTemplateVariantArtifacts({
      variant,
      mappings,
      safeName,
      safeUntil,
      displayCurrency: options?.displayCurrency || data.displayCurrency,
      values: summaryValues,
      calculatorTableHtml,
      calculatorTablePlain,
      subject: options?.subject || getEmailSubject(),
      fromAddress: "Dinamikus Megtakarítás <noreply@dinamikus.local>",
      toAddress: emailRecipient.trim() || "ugyfel@example.com",
      date: new Date(),
    })
  }

  const loadClipboardInlineImage = async (relativePath: string, asDataUrl: boolean) => {
    if (typeof window === "undefined") return undefined
    try {
      const response = await fetch(relativePath)
      if (!response.ok) {
        return undefined
      }
      if (!asDataUrl) return `${window.location.origin}${relativePath}`
      const blob = await response.blob()
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(String(reader.result || ""))
        reader.onerror = () => reject(new Error("image read failed"))
        reader.readAsDataURL(blob)
      })
      return dataUrl || `${window.location.origin}${relativePath}`
    } catch {
      return undefined
    }
  }

  const shouldUseDataUrlForClipboard = () => {
    if (typeof navigator === "undefined") return false
    const ua = navigator.userAgent || ""
    return !/Android|iPhone|iPad|iPod|Mobile/i.test(ua)
  }

  const buildOutlookEmail = async (safeName: string, safeUntil: string) => {
    const summaryValues = getSummaryEmailValues()
    const selectedTemplateIdValue = selectedTemplateId.trim()
    if (selectedTemplateIdValue) {
      const variantSelectionInput = getCurrentVariantSelectionInput()
      const loadTemplateById = async () => {
        const templateResponse = await fetch(`/api/email-templates/${encodeURIComponent(selectedTemplateIdValue)}`)
        const templateResult = await templateResponse.json().catch(() => ({}))
        return { templateResponse, templateResult }
      }
      if (isTemplateVariantBundleStale) {
        const generatedStaleBundle = await generateVariantBundle({
          templateIdOverride: selectedTemplateIdValue,
          skipZip: true,
          silent: true,
        })
        if (!generatedStaleBundle.ok) {
          throw new Error("Nem sikerült frissíteni a sablon variánsait a legutóbbi automatikus mentés után.")
        }
      }
      let { templateResponse, templateResult } = await loadTemplateById()
      if (!templateResponse.ok || !templateResult?.template) {
        throw new Error(
          typeof templateResult?.message === "string" && templateResult.message
            ? templateResult.message
            : "Nem sikerült betölteni a kiválasztott sablont.",
        )
      }
      let template = templateResult.template as StoredEmailTemplateDetails
      let selectedVariant = selectTemplateVariant(template.variantBundle, variantSelectionInput)
      if (selectedVariant.status === "unsupported_currency") {
        throw new Error(selectedVariant.message)
      }
      if (selectedVariant.status !== "selected" && (selectedVariant.status === "missing_bundle" || selectedVariant.status === "not_found")) {
        const generated = await generateVariantBundle({
          templateIdOverride: selectedTemplateIdValue,
          skipZip: true,
          silent: true,
        })
        if (generated.ok) {
          ;({ templateResponse, templateResult } = await loadTemplateById())
          if (templateResponse.ok && templateResult?.template) {
            template = templateResult.template as StoredEmailTemplateDetails
            selectedVariant = selectTemplateVariant(template.variantBundle, variantSelectionInput)
          }
        }
      }
      if (selectedVariant.status !== "selected" && (selectedVariant.status === "missing_bundle" || selectedVariant.status === "not_found")) {
        const generatedInline = await generateVariantBundle({
          templateIdOverride: selectedTemplateIdValue,
          skipZip: true,
          includeVariants: true,
          silent: true,
        })
        if (generatedInline.ok && Array.isArray(generatedInline.variants) && generatedInline.variants.length > 0) {
          selectedVariant = selectTemplateVariant(
            { templateId: selectedTemplateIdValue, variants: generatedInline.variants, updatedAt: new Date().toISOString() },
            variantSelectionInput,
          )
        }
      }
      const shouldHaveVariant =
        (variantSelectionInput.selectedProduct === "allianz_eletprogram" || variantSelectionInput.selectedProduct === "allianz_bonusz_eletprogram") &&
        (data.displayCurrency === "HUF" || data.displayCurrency === "EUR")
      if (shouldHaveVariant && selectedVariant.status !== "selected") {
        throw new Error("Nem található megfelelő variáns sablon. Mentsd újra a sablont vagy készíts 16 variáns csomagot.")
      }
      if ((template.htmlContent || "").includes(RENDERED_SNAPSHOT_MARKER)) {
        const snapshotHtml = stripSnapshotMarker(template.htmlContent || "")
        const plain = template.textContent?.trim() || htmlToPlainText(snapshotHtml)
        return {
          html: snapshotHtml,
          plain: [plain, "", `Megnyitás: ${window.location.origin}/osszesites`].join("\n"),
        }
      }
      const resolvedTemplateContent = resolveTemplateContentByTone(template, emailTegezo)
      const rendered = buildTemplateEmailArtifacts({
        htmlContent: resolvedTemplateContent.htmlContent,
        textContent: resolvedTemplateContent.textContent,
        mappings: template.mappings || [],
        safeName,
        safeUntil,
        summaryValues,
        displayCurrency: data.displayCurrency,
        selectedProduct: data.selectedProduct,
      })

      return {
        html: rendered.html || template.htmlContent || "",
        plain: [rendered.plain || template.textContent || "", "", `Megnyitás: ${window.location.origin}/osszesites`].join("\n"),
      }
    }

    const subject = getEmailSubject()
    const tone = getSummaryEmailTone(emailTegezo)
    const useDataUrl = shouldUseDataUrlForClipboard()
    const penzImageSrc = await loadClipboardInlineImage("/email-assets/penz.png", useDataUrl)
    const chartImageSrc = await loadClipboardInlineImage("/email-assets/chart.png", useDataUrl)
    const chart2ImageSrc = await loadClipboardInlineImage("/email-assets/chart2.png", useDataUrl)
    const penzkotegImageSrc = await loadClipboardInlineImage("/email-assets/penzkoteg.png", useDataUrl)
    const { html, plain } = buildSummaryEmailTemplate({
      safeName,
      safeUntil,
      emailTegezo,
      displayCurrency: data.displayCurrency,
      tone,
      subject,
      values: summaryValues,
      images: {
        penz: penzImageSrc,
        chart: chartImageSrc,
        chart2: chart2ImageSrc,
        penzkoteg: penzkotegImageSrc,
      },
    })

    return {
      html: extraEmailTableArtifacts.length ? `${html}${extraEmailTableArtifacts.map((item) => item.html).join("")}` : html,
      plain: [
        plain,
        extraEmailTableArtifacts.length ? extraEmailTableArtifacts.map((item) => item.plain).join("\n\n") : "",
        `Megnyitás: ${window.location.origin}/osszesites`,
      ]
        .filter(Boolean)
        .join("\n\n"),
    }
  }

  const downloadBase64File = (base64: string, fileName: string, mimeType: string) => {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index)
    }
    const blob = new Blob([bytes], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const downloadTextFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const generateVariantBundle = async ({
    templateIdOverride,
    skipZip = false,
    silent = false,
    includeVariants = false,
  }: {
    templateIdOverride?: string
    skipZip?: boolean
    silent?: boolean
    includeVariants?: boolean
  } = {}): Promise<{ ok: true; variants?: TemplateVariantItem[] } | { ok: false }> => {
    if (!silent) {
      setVariantBundleStatus("idle")
      setVariantBundleMessage("")
    }
    const templateId = templateIdOverride?.trim() || selectedTemplateId.trim() || templateSelectRef.current?.value.trim() || ""
    if (!templateId) {
      if (!silent) {
        setVariantBundleStatus("failed")
        setVariantBundleMessage("A csomaghoz előbb válassz ki egy aktív küldési sablont.")
      }
      return { ok: false }
    }
    const safeName = (emailClientName || "Ügyfél").trim()
    const safeUntil = (emailOfferUntil || "").trim()
    const values = getSummaryEmailValues()

    if (!silent) {
      setVariantBundleStatus("loading")
    }
    try {
      const response = await fetch("/api/email-templates/generate-variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          safeName,
          safeUntil,
          subject: getEmailSubject(),
          values,
          skipZip,
          includeVariants,
        }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result?.ok) {
        if (!silent) {
          setVariantBundleStatus("failed")
          setVariantBundleMessage(
            typeof result?.message === "string" && result.message ? result.message : "Nem sikerült létrehozni a variáns csomagot.",
          )
        }
        return { ok: false }
      }
      if (!skipZip && (typeof result?.zipBase64 !== "string" || typeof result?.zipFileName !== "string")) {
        if (!silent) {
          setVariantBundleStatus("failed")
          setVariantBundleMessage("Hiányos ZIP válasz érkezett a szervertől.")
        }
        return { ok: false }
      }
      if (!skipZip) {
        downloadBase64File(result.zipBase64, result.zipFileName, "application/zip")
      }
      await loadEmailTemplates()
      setIsTemplateVariantBundleStale(false)
      if (!silent) {
        setVariantBundleStatus("done")
        setVariantBundleMessage(
          skipZip
            ? `Elkészült a variáns mentés: ${typeof result?.createdCount === "number" ? result.createdCount : 16} sablon frissítve.`
            : `Elkészült a csomag: ${typeof result?.createdCount === "number" ? result.createdCount : 16} sablon mentve, ZIP letöltve.`,
        )
      }
      return {
        ok: true as const,
        variants: Array.isArray(result?.variants) ? (result.variants as TemplateVariantItem[]) : undefined,
      }
    } catch {
      if (!silent) {
        setVariantBundleStatus("failed")
        setVariantBundleMessage("Nem sikerült létrehozni a variáns csomagot. Próbáld újra.")
      }
      return { ok: false as const }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6 flex flex-wrap gap-3 items-center">
          <Button
            variant="outline"
            onClick={() => router.push("/kalkulator")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Vissza
          </Button>

          <Button variant={isExcelView ? "default" : "outline"} onClick={() => setIsExcelView(!isExcelView)}>
            {isExcelView ? (
              <>
                <LayoutGrid className="w-4 h-4 mr-2" />
                Normál nézet
              </>
            ) : (
              <>
                <Table2 className="w-4 h-4 mr-2" />
                Excel nézet
              </>
            )}
          </Button>

          <div className={MOBILE_SUMMARY_LAYOUT.toolbarGrid}>
            <div className={`${MOBILE_SUMMARY_LAYOUT.field} lg:col-span-3`}>
              <Label className="text-xs text-muted-foreground" htmlFor="emailClientName">
                Név (megszólítás)
              </Label>
              <Input
                id="emailClientName"
                value={emailClientName}
                onChange={(e) => setEmailClientName(e.target.value)}
                className={MOBILE_SUMMARY_LAYOUT.input}
                placeholder="pl. Viktor"
              />
            </div>
            <div className={`${MOBILE_SUMMARY_LAYOUT.field} lg:col-span-3`}>
              <Label className="text-xs text-muted-foreground" htmlFor="emailRecipient">
                Címzett e-mail
              </Label>
              <Input
                id="emailRecipient"
                type="email"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                className={MOBILE_SUMMARY_LAYOUT.input}
                placeholder="pl. ugyfel@email.hu"
              />
            </div>
            <div className={`${MOBILE_SUMMARY_LAYOUT.field} lg:col-span-4`}>
              <Label className="text-xs text-muted-foreground" htmlFor="emailOfferUntil">
                Ajánlat érvényes (YYYY.MM.DD)
              </Label>
              <div className="flex items-center gap-2 flex-wrap">
                <Input
                  id="emailOfferUntil"
                  value={emailOfferUntil}
                  onChange={(e) => setEmailOfferUntil(e.target.value)}
                  className={`${MOBILE_SUMMARY_LAYOUT.input} min-w-[11ch] flex-1`}
                  placeholder="2026.02.14"
                />
                {emailOfferUntilWeekday ? (
                  <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">({emailOfferUntilWeekday})</span>
                ) : null}
              </div>
            </div>
            <div className={`${MOBILE_SUMMARY_LAYOUT.field} lg:col-span-2`}>
              <div className="flex items-center gap-2">
                <Switch id="emailTegezo" checked={emailTegezo} onCheckedChange={setEmailTegezo} />
                <span className="text-xs text-muted-foreground">{emailTegezo ? "Tegező" : "Magázó"}</span>
              </div>
            </div>
            <Button
              variant="default"
              className={`${MOBILE_SUMMARY_LAYOUT.button} lg:col-span-6`}
              onClick={async () => {
                setEmailCopyStatus("idle")
                setVariantBundleStatus("idle")
                setVariantBundleMessage("")

                try {
                  const safeName = (emailClientName || "Ügyfél").trim()
                  const safeUntil = (emailOfferUntil || "").trim()
                  const { html, plain } = await buildOutlookEmail(safeName, safeUntil)
                  const ok = await copyHtmlToClipboard(html, plain)
                  setEmailCopyStatus(ok ? "copied" : "failed")
                } catch (error) {
                  setEmailCopyStatus("failed")
                  setVariantBundleStatus("failed")
                  setVariantBundleMessage(error instanceof Error ? error.message : "Nem sikerült előállítani a másolható sablont.")
                }
              }}
            >
              <Copy className="w-4 h-4 mr-2" />
              {emailCopyStatus === "copied"
                ? "Másolva!"
                : emailCopyStatus === "failed"
                  ? "Másolás sikertelen"
                  : "Formázott sablon másolása"}
            </Button>

            <Button
              variant="secondary"
              className={`${MOBILE_SUMMARY_LAYOUT.button} lg:col-span-6`}
              onClick={async () => {
                setEmailCopyStatus("idle")
                setVariantBundleStatus("idle")
                setVariantBundleMessage("")
                try {
                  const safeName = (emailClientName || "Ügyfél").trim()
                  const safeUntil = (emailOfferUntil || "").trim()
                  const { html, plain } = await buildOutlookEmail(safeName, safeUntil)

                  const subjectText = getEmailSubject()
                  const subject = encodeURIComponent(subjectText)
                  const body = encodeURIComponent(
                    "A formázott sablont megpróbáltam a vágólapra másolni. Illeszd be ide (Ctrl/Cmd+V).",
                  )

                  const ok = await copyHtmlToClipboard(html, plain)
                  setEmailCopyStatus(ok ? "copied" : "failed")

                  // Try to open mail app after copy (not guaranteed on all mobiles)
                  window.location.href = `mailto:?subject=${subject}&body=${body}`
                } catch (error) {
                  setEmailCopyStatus("failed")
                  setVariantBundleStatus("failed")
                  setVariantBundleMessage(error instanceof Error ? error.message : "Nem sikerült előállítani a másolható sablont.")
                }
              }}
            >
              <Copy className="w-4 h-4 mr-2" />
              Másol + e-mail
            </Button>

            <Button
              variant="outline"
              className={`${MOBILE_SUMMARY_LAYOUT.button} lg:col-span-12`}
              disabled={emailSendStatus === "sending"}
              onClick={async () => {
                setEmailSendError("")
                setEmailSendStatus("idle")

                const recipient = emailRecipient.trim()
                if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
                  setEmailSendStatus("failed")
                  setEmailSendError("Adj meg egy érvényes címzett e-mail címet.")
                  return
                }

                const safeName = (emailClientName || "Ügyfél").trim()
                const safeUntil = (emailOfferUntil || "").trim()
                const subject = getEmailSubject()
                const emailValues = getSummaryEmailValues()
                const templateCurrencyLabel = toTemplateCurrencyLabel(data.displayCurrency)
                const fixedAmounts = getFixedAmountValues(data.displayCurrency)

                setEmailSendStatus("sending")
                try {
                  if (selectedTemplateId.trim() && isTemplateVariantBundleStale) {
                    const refreshed = await generateVariantBundle({
                      templateIdOverride: selectedTemplateId.trim(),
                      skipZip: true,
                      silent: true,
                    })
                    if (!refreshed.ok) {
                      setEmailSendStatus("failed")
                      setEmailSendError("Nem sikerült frissíteni a variánsokat az automatikus mentés után.")
                      return
                    }
                  }
                  const previewEmail = await buildOutlookEmail(safeName, safeUntil)
                  const response = await fetch("/api/summary-email", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      recipientEmail: recipient,
                      safeName,
                      safeUntil,
                      emailTegezo,
                      fxBaseColor,
                      displayCurrency: data.displayCurrency,
                      enableTaxCredit: data.enableTaxCredit ?? contextData?.enableTaxCredit,
                      subject,
                      values: emailValues,
                      htmlOverride: previewEmail.html,
                      plainOverride: previewEmail.plain,
                      templateId: selectedTemplateId || undefined,
                      selectedProduct: data.selectedProduct || contextData?.selectedProduct || undefined,
                      dynamicValues: {
                        name: safeName,
                        amount: emailValues.monthlyPayment,
                        deadline: safeUntil,
                        currency: templateCurrencyLabel,
                        tone: emailTegezo ? "Kedves" : "Tisztelt",
                        calculator_table: "{{calculator_table}}",
                        fixed_small_amount: fixedAmounts.fixedSmallAmount,
                        fixed_large_amount: fixedAmounts.fixedLargeAmount,
                        retirement_section: "{{retirement_section}}",
                        bonus_section: "{{bonus_section}}",
                      },
                    }),
                  })

                  const result = await response.json().catch(() => ({}))
                  if (!response.ok || !result?.ok) {
                    setEmailSendStatus("failed")
                    setEmailSendError(
                      typeof result?.message === "string" && result.message
                        ? result.message
                        : "Nem sikerült elküldeni az e-mailt.",
                    )
                    return
                  }

                  setEmailSendStatus("sent")
                } catch {
                  setEmailSendStatus("failed")
                  setEmailSendError("Nem sikerült elküldeni az e-mailt. Próbáld újra.")
                }
              }}
            >
              {emailSendStatus === "sending"
                ? "Küldés folyamatban..."
                : emailSendStatus === "sent"
                  ? "E-mail elküldve!"
                  : emailSendStatus === "failed"
                    ? "Küldés sikertelen"
                    : "Küldés e-mailben (Resend)"}
            </Button>
            <Button
              variant="secondary"
              className={`${MOBILE_SUMMARY_LAYOUT.button} lg:col-span-12`}
              disabled={variantBundleStatus === "loading"}
              onClick={() => void generateVariantBundle()}
            >
              {variantBundleStatus === "loading"
                ? "16 variáns csomag készítése..."
                : "16 variáns csomag (ZIP + profil mentés)"}
            </Button>

            <div className={MOBILE_SUMMARY_LAYOUT.helperText}>
              Mobilon a `mailto:` gyakran csak sima szöveget támogat. Nyomd meg a{" "}
              <span className="font-medium">Formázott sablon másolása</span> gombot, majd az Outlook levélbe illeszd be.
            </div>
            {emailSendError ? <div className={`${MOBILE_SUMMARY_LAYOUT.helperText} text-red-600`}>{emailSendError}</div> : null}
            {variantBundleMessage ? (
              <div className={`${MOBILE_SUMMARY_LAYOUT.helperText} ${variantBundleStatus === "failed" ? "text-red-600" : "text-emerald-700"}`}>
                {variantBundleMessage}
              </div>
            ) : null}

            <div className="min-[560px]:col-span-2 lg:col-span-12 rounded-md border p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium">E-mail sablon feltöltés</div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsTemplateUploaderOpen((current) => !current)}
                  aria-label={isTemplateUploaderOpen ? "Sablon feltöltés összecsukása" : "Sablon feltöltés lenyitása"}
                  aria-expanded={isTemplateUploaderOpen}
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${isTemplateUploaderOpen ? "" : "-rotate-90"}`} />
                </Button>
              </div>
              {isTemplateUploaderOpen ? (
                <>
                  <div className="grid gap-3 grid-cols-1 lg:grid-cols-12">
                <div className="grid gap-1 lg:col-span-4">
                  <Label className="text-xs text-muted-foreground" htmlFor="templateName">
                    Sablon neve
                  </Label>
                  <Input
                    id="templateName"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="pl. Ügyfél díjbekérő sablon"
                  />
                </div>
                <div className="grid gap-1 lg:col-span-4">
                  <Label className="text-xs text-muted-foreground" htmlFor="templateSelect">
                    Aktív küldési sablon
                  </Label>
                  <select
                    ref={templateSelectRef}
                    id="templateSelect"
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                    value={selectedTemplateId}
                    onChange={(e) => {
                      setSelectedTemplateId(e.target.value)
                      setVariantBundleStatus("idle")
                      setVariantBundleMessage("")
                    }}
                  >
                    <option value="">Beépített sablon (jelenlegi)</option>
                    {selectedTemplateId.trim() && !hasSelectedTemplateInList ? (
                      <option value={selectedTemplateId}>
                        {selectedTemplateNameHint
                          ? isTemplateAdminView && selectedTemplateOwnerHint
                            ? `${selectedTemplateNameHint} - készítette: ${selectedTemplateOwnerHint}`
                            : selectedTemplateNameHint
                          : isTemplateListLoading
                            ? "Korabban valasztott sablon (betoltes...)"
                            : "Korabban valasztott sablon"}
                      </option>
                    ) : null}
                    {emailTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {isTemplateAdminView ? `${template.name} - készítette: ${template.ownerId}` : template.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-2 lg:col-span-4">
                  <Button variant="outline" type="button" onClick={() => void deleteSelectedTemplate()} disabled={!selectedTemplateId}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Kiválasztott törlése
                  </Button>
                </div>

                <div className="grid gap-2 lg:col-span-6">
                  <div className="flex items-start justify-between gap-3 rounded-md border p-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground" htmlFor="keepTemplateClosingSection">
                        Lezárás utáni rész megtartása új feltöltésnél
                      </Label>
                      <div className="text-xs text-muted-foreground">
                        Kikapcsolva az `Üdvözlettel:`, `Tisztelettel:` utáni aláírás-blokk levágásra kerül a preview-ból és a kiküldött sablonból is.
                      </div>
                    </div>
                    <Switch
                      id="keepTemplateClosingSection"
                      checked={keepTemplateClosingSection}
                      onCheckedChange={setKeepTemplateClosingSection}
                    />
                  </div>
                  <Label className="text-xs text-muted-foreground" htmlFor="templateFile">
                    Sablon fájl
                  </Label>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-labelledby="templateFile"
                    onDragEnter={onTemplateFileDragOver}
                    onDragOver={onTemplateFileDragOver}
                    onDragLeave={onTemplateFileDragLeave}
                    onDrop={(event) => void onTemplateFileDrop(event)}
                    onClick={() => templateFileInputRef.current?.click()}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        templateFileInputRef.current?.click()
                      }
                    }}
                    className={`rounded-md border border-dashed px-4 py-4 transition-colors cursor-pointer ${
                      isTemplateDragActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted-foreground/40 hover:bg-muted/40"
                    }`}
                  >
                    <Input
                      ref={templateFileInputRef}
                      id="templateFile"
                      type="file"
                      className="hidden"
                      accept=".html,.htm,.txt,.eml,text/html,text/plain,message/rfc822"
                      onClick={(event) => {
                        // Allow re-selecting the same file while keeping filename visible after upload.
                        event.currentTarget.value = ""
                      }}
                      onChange={async (event) => {
                        const file = event.currentTarget.files?.[0]
                        if (!file) return
                        await handleTemplateFileUpload(file)
                      }}
                    />
                    <div className="text-base font-medium text-foreground">
                      {templateOriginalFileName?.trim() ? templateOriginalFileName : "Fájl kiválasztása"}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Húzd ide a sablon fájlt (HTML/TXT/EML), vagy kattints a tallózáshoz.
                    </div>
                    {!keepTemplateClosingSection ? (
                      <div className="mt-2 text-xs text-amber-700">
                        Feltöltéskor a lezárás utáni aláírás-rész automatikusan levágásra kerül.
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-end gap-2 lg:col-span-6 flex-wrap">
                  <div className="flex items-center gap-1 rounded-md border p-1">
                    <Button
                      type="button"
                      size="sm"
                      variant={templateConversionMode === "ai_full" ? "default" : "ghost"}
                      onClick={() => setTemplateConversionMode("ai_full")}
                    >
                      AI mód
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={templateConversionMode === "builtin" ? "default" : "ghost"}
                      onClick={() => setTemplateConversionMode("builtin")}
                    >
                      Logika mód
                    </Button>
                  </div>
                  <Button
                    type="button"
                    onClick={() =>
                      void (selectedTemplateId.trim()
                        ? isRenderedPreviewDirty
                          ? saveRenderedPreviewAsBaseTemplate({ regenerateVariants: true })
                          : updateSelectedTemplateDraft({ regenerateVariants: true })
                        : saveTemplate())
                    }
                    disabled={templateStatus === "saving" || templateAutosaveStatus === "saving"}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {templateStatus === "saving"
                      ? "Mentés..."
                      : selectedTemplateId.trim() && isRenderedPreviewDirty
                        ? "Szerkesztett előnézet mentése új alapsablonként"
                        : "Sablon mentése"}
                  </Button>
                </div>
                {selectedTemplateId.trim() ? (
                  <div className="text-xs text-muted-foreground">
                    {templateAutosaveStatus === "saving"
                      ? "Automatikus mentés folyamatban..."
                      : templateAutosaveStatus === "failed"
                        ? templateAutosaveError || "Az automatikus mentés sikertelen."
                        : templateAutosaveStatus === "saved" && templateLastAutosavedAt
                          ? `Automatikusan mentve: ${new Intl.DateTimeFormat("hu-HU", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            }).format(templateLastAutosavedAt)}`
                          : isTemplateVariantBundleStale
                            ? "A sablon automatikusan mentve, a 16 variáns következő küldéskor/letöltéskor frissül."
                            : "A módosítások automatikusan mentődnek a háttérben."}
                  </div>
                ) : null}
                  </div>

                  <div className="rounded-md border p-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium">Dinamikus mezők hozzárendelése</div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setIsTemplateMappingsOpen((current) => !current)}
                        aria-label={isTemplateMappingsOpen ? "Mezők összecsukása" : "Mezők lenyitása"}
                        aria-expanded={isTemplateMappingsOpen}
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform ${isTemplateMappingsOpen ? "" : "-rotate-90"}`} />
                      </Button>
                    </div>
                    {isTemplateMappingsOpen ? (
                      <div className="mt-2 space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="text-xs text-muted-foreground">
                            Az automatikus felismerés a dinamikus mezők helyét próbálja újra beazonosítani.
                          </div>
                          <Button
                            variant="secondary"
                            type="button"
                            onClick={() =>
                              void parseTemplateContentOnServer(
                                templateSourceType,
                                templateRawContent,
                                templateConversionMode,
                                !keepTemplateClosingSection,
                              )
                            }
                            disabled={!templateRawContent.trim() || templateStatus === "loading"}
                          >
                            <Wand2 className="w-4 h-4 mr-2" />
                            Auto-felismerés frissítése
                          </Button>
                        </div>
                        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-9">
                          {(
                            [
                              "name",
                              "amount",
                              "deadline",
                              "currency",
                              "tone",
                              "calculator_table",
                              "fixed_small_amount",
                              "fixed_large_amount",
                              "retirement_section",
                              "bonus_section",
                            ] as EmailTemplateFieldKey[]
                          ).map((fieldKey) => {
                            const mapping = templateMappings.find((item) => item.key === fieldKey)
                            return (
                              <div key={fieldKey} className="rounded border p-2 space-y-1">
                                <Label className="text-xs text-muted-foreground">{TEMPLATE_FIELD_LABELS[fieldKey]} helye</Label>
                                <Input
                                  value={mapping?.sourceSnippet ?? ""}
                                  onChange={(event) =>
                                    upsertTemplateMapping({
                                      key: fieldKey,
                                      label: TEMPLATE_FIELD_LABELS[fieldKey],
                                      token: `{{${fieldKey}}}`,
                                      sourceSnippet: normalizeSnippetForField(fieldKey, event.target.value),
                                      confidence: 1,
                                    })
                                  }
                                  placeholder="Kézzel jelöld, vagy auto-javaslat"
                                />
                              </div>
                            )
                          })}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <select
                            className="h-9 rounded-md border bg-background px-3 text-sm"
                            value={templateSelectionFieldKey}
                            onChange={(e) => setTemplateSelectionFieldKey(e.target.value as EmailTemplateFieldKey)}
                          >
                            <option value="name">Név</option>
                            <option value="amount">Összeg</option>
                            <option value="deadline">Határidő</option>
                            <option value="currency">Pénznem</option>
                            <option value="tone">Hangnem</option>
                            <option value="calculator_table">Kalkulátor táblázat</option>
                            <option value="fixed_small_amount">Fix kis összeg</option>
                            <option value="fixed_large_amount">Fix nagy összeg</option>
                            <option value="retirement_section">Nyugdíj szekció</option>
                            <option value="bonus_section">Bónusz szekció</option>
                          </select>
                          <Button type="button" variant="outline" onClick={selectedSnippetToField} disabled={!templateSelectedSnippet.trim()}>
                            <Upload className="w-4 h-4 mr-2" />
                            Kijelölt rész hozzárendelése
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={assignSelectedTableField}
                            disabled={!templateSelectedSnippet.trim() && !templateSelectedTableSnippet.trim()}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Kijelölt táblázat hozzárendelése
                          </Button>
                          {templateSelectedSnippet ? (
                            <span className="text-xs text-muted-foreground truncate max-w-[380px]">
                              Kijelölt: {templateSelectedSnippet}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {templatePreviewHtml ? (
                    <div className="grid gap-2">
                      <Label className="text-xs text-muted-foreground">
                        Nyers HTML előnézet (jelöld ki az egérrel a szöveget, majd rendeld mezőhöz)
                      </Label>
                      <div className="text-xs text-muted-foreground">
                        Egyes nagy képek az előnézetben egyszerűsítve jelennek meg, de küldéskor a teljes kép megy ki.
                      </div>
                      <div
                        ref={templatePreviewRef}
                        className="w-full min-h-56 rounded border bg-white px-3 py-2 text-sm overflow-auto max-h-[460px]"
                        onMouseUp={captureSelectedHtmlSnippet}
                        onKeyUp={captureSelectedHtmlSnippet}
                        onClick={captureClickedTableSnippet}
                        dangerouslySetInnerHTML={{ __html: templatePreviewHtml }}
                      />
                    </div>
                  ) : null}
                  {templateRenderedPreviewHtml ? (
                    <div className="grid gap-2">
                      <Label className="text-xs text-muted-foreground">
                        Kitöltött HTML előnézet (név, dátum, pénznem, hangnem, táblázat behelyettesítve)
                      </Label>
                      <div className="text-xs text-muted-foreground">
                        Itt kézzel is szerkeszthetsz (törlés/átírás). Mentéskor a jelenlegi HTML lesz az új alapsablon, és abból frissül mind a 16 variáns.
                      </div>
                      {isRenderedPreviewDirty ? (
                        <div className="text-xs text-amber-600">
                          Kézi módosítás történt. A szerkesztett HTML automatikusan mentődik; a felső gombbal azonnal variánsokat is frissíthetsz.
                        </div>
                      ) : null}
                      <div className="rounded-md border p-3 bg-muted/20">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div>
                            <div className="text-sm font-medium">Extra táblázatok</div>
                            <div className="text-xs text-muted-foreground">
                              Ezek csak az aktuális emailhez tartoznak. A fő kalkulátor értékei nem változnak, és sablonmentéskor sem kerülnek bele az alapsablonba.
                            </div>
                            {calculatorSnapshot?.selectedInsurer ? (
                              <div className="text-xs text-muted-foreground mt-1">
                                Biztosító itt fix: <span className="font-medium">{calculatorSnapshot.selectedInsurer}</span>
                              </div>
                            ) : null}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={addExtraEmailTable}
                            disabled={!calculatorSnapshot || availableExtraEmailProducts.length === 0}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Táblázat hozzáadása
                          </Button>
                        </div>
                        {extraEmailTables.length ? (
                          <div className="grid gap-3 mt-3">
                            {extraEmailTables.map((item, index) => {
                              const allowedCurrencies = getAllowedCurrenciesForProduct(item.selectedProduct)
                              const effectiveCurrency = resolveEffectiveCurrencyForProduct(item.selectedProduct, item.currency, item.enableTaxCredit)
                              const allowedFrequencies = calculatorSnapshot
                                ? getAllowedFrequenciesForProduct(item.selectedProduct, effectiveCurrency, item.enableTaxCredit, calculatorSnapshot.inputs)
                                : ["havi", "negyedéves", "féléves", "éves"]
                              return (
                                <div key={item.id} className="rounded-md border bg-background p-3">
                                  <div className="flex items-center justify-between gap-2 mb-3">
                                    <div className="text-sm font-medium">Extra tábla #{index + 1}</div>
                                    <Button type="button" size="sm" variant="ghost" onClick={() => removeExtraEmailTable(item.id)}>
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Törlés
                                    </Button>
                                  </div>
                                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                    <div className="grid gap-1">
                                      <Label className="text-xs text-muted-foreground">Termék</Label>
                                      <select
                                        className="h-9 rounded-md border bg-background px-3 text-sm"
                                        value={item.selectedProduct}
                                        onChange={(event) => updateExtraEmailTable(item.id, { selectedProduct: event.target.value })}
                                      >
                                        {availableExtraEmailProducts.map((product) => (
                                          <option key={product.value} value={product.value}>
                                            {product.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="grid gap-1">
                                      <Label className="text-xs text-muted-foreground">Befizetés gyakorisága</Label>
                                      <select
                                        className="h-9 rounded-md border bg-background px-3 text-sm"
                                        value={item.frequency}
                                        onChange={(event) =>
                                          updateExtraEmailTable(item.id, { frequency: event.target.value as PaymentFrequency })
                                        }
                                      >
                                        {allowedFrequencies.map((frequency) => (
                                          <option key={frequency} value={frequency}>
                                            {getPaymentFrequencyLabel(frequency)}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="grid gap-1">
                                      <Label className="text-xs text-muted-foreground">Deviza</Label>
                                      <select
                                        className="h-9 rounded-md border bg-background px-3 text-sm"
                                        value={item.currency}
                                        onChange={(event) => updateExtraEmailTable(item.id, { currency: event.target.value as Currency })}
                                      >
                                        {allowedCurrencies.map((currency) => (
                                          <option key={currency} value={currency}>
                                            {toTemplateCurrencyLabel(currency)}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="grid gap-1">
                                      <Label className="text-xs text-muted-foreground">Befizetés összege</Label>
                                      <Input
                                        type="number"
                                        min={0}
                                        step={1000}
                                        value={item.paymentAmount}
                                        onChange={(event) =>
                                          updateExtraEmailTable(item.id, {
                                            paymentAmount: Number.parseFloat(event.target.value || "0") || 0,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="grid gap-1">
                                      <Label className="text-xs text-muted-foreground">Futamidő (év)</Label>
                                      <Input
                                        type="number"
                                        min={1}
                                        step={1}
                                        value={item.durationYears}
                                        onChange={(event) =>
                                          updateExtraEmailTable(item.id, {
                                            durationYears: Number.parseInt(event.target.value || "1", 10) || 1,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="grid gap-1">
                                      <Label className="text-xs text-muted-foreground">Hozam (%)</Label>
                                      <Input
                                        type="number"
                                        min={0}
                                        step={0.1}
                                        value={item.annualYieldPercent}
                                        onChange={(event) =>
                                          updateExtraEmailTable(item.id, {
                                            annualYieldPercent: Number.parseFloat(event.target.value || "0") || 0,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="grid gap-1">
                                      <Label className="text-xs text-muted-foreground">Adójóváírás</Label>
                                      <div className="flex items-center h-10 rounded-md border px-3 bg-background">
                                        <Switch
                                          checked={item.enableTaxCredit}
                                          onCheckedChange={(checked) => updateExtraEmailTable(item.id, { enableTaxCredit: checked })}
                                        />
                                        <span className="ml-3 text-sm">{item.enableTaxCredit ? "Bekapcsolva" : "Kikapcsolva"}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : null}
                      </div>
                      <div
                        ref={templateRenderedPreviewRef}
                        className="w-full min-h-56 rounded border bg-white px-3 py-2 text-sm overflow-auto max-h-[460px]"
                        contentEditable
                        suppressContentEditableWarning
                        onInput={onRenderedPreviewInput}
                      />
                    </div>
                  ) : null}
                  {templateRenderedPreviewError ? (
                    <div className="text-xs text-amber-600">{templateRenderedPreviewError}</div>
                  ) : null}
                  {selectedTemplate ? (
                    <div className="text-xs text-muted-foreground">
                      Kiválasztott sablon: <span className="font-medium">{selectedTemplate.name}</span>
                    </div>
                  ) : null}
                  {selectedTemplate && isTemplateVariantBundleStale ? (
                    <div className="text-xs text-amber-700">
                      A sablon tartalma automatikusan elmentve. A mentett variánsok a következő küldésnél, letöltésnél vagy kézi
                      variánsfrissítésnél készülnek újra.
                    </div>
                  ) : null}
                  {selectedTemplate?.variantBundle?.variants?.length ? (
                    <div className="rounded-md border p-2 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs text-muted-foreground">
                          Mentett variánsok: <span className="font-medium">{selectedTemplate.variantBundle.variants.length} db</span>
                        </div>
                        <Button type="button" size="sm" variant="outline" onClick={() => setIsVariantBundleOpen((current) => !current)}>
                          {isVariantBundleOpen ? "Variánsok elrejtése" : "Variánsok (16) megjelenítése"}
                        </Button>
                      </div>
                      {isVariantBundleOpen ? (
                        <div className="grid gap-2 max-h-64 overflow-auto">
                          {selectedTemplate.variantBundle.variants.map((variant) => (
                            <div key={variant.id} className="rounded border px-2 py-1 flex items-center justify-between gap-2">
                              <div className="text-xs truncate">{variant.name}</div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const materialized = buildCurrentTemplateVariantArtifacts(variant, templateMappings, {
                                      displayCurrency: variant.currency,
                                    })
                                    downloadTextFile(materialized.eml, variant.emlFileName, "message/rfc822")
                                  }}
                                >
                                  EML
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const materialized = buildCurrentTemplateVariantArtifacts(variant, templateMappings, {
                                      displayCurrency: variant.currency,
                                    })
                                    downloadTextFile(materialized.standaloneHtml, variant.htmlFileName, "text/html;charset=utf-8")
                                  }}
                                >
                                  HTML
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="text-xs text-muted-foreground">
                    A beépített eredeti sablon megmarad alapértelmezettnek; új sablon mentése nem írja felül.
                  </div>
                  {templateError ? <div className="text-xs text-red-600">{templateError}</div> : null}
                </>
              ) : null}
            </div>
          </div>
        </div>

        {isExcelView ? (
          <Card>
            <CardContent className="p-4 overflow-x-auto">
              <div className="mb-3 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsFxColorPickerOpen((current) => !current)}
                  title="FX sorok bázisszíne"
                  aria-label="FX sorok bázisszíne"
                  aria-expanded={isFxColorPickerOpen}
                >
                  <Wand2 className="h-4 w-4" />
                </Button>
                {isFxColorPickerOpen ? (
                  <div className="flex items-center gap-2 rounded-md border bg-card px-2 py-1">
                    <Input
                      id="fxBaseColor"
                      type="color"
                      value={normalizeHexColorInput(fxBaseColor) ?? "#c55a11"}
                      onChange={(e) => setFxBaseColor(normalizeHexColorInput(e.target.value) ?? "#c55a11")}
                      className="h-8 w-10 p-1"
                    />
                    <Input
                      value={fxBaseColor}
                      onChange={(e) => {
                        const next = e.target.value
                        setFxBaseColor(next)
                        const normalized = normalizeHexColorInput(next)
                        if (normalized) setFxBaseColor(normalized)
                      }}
                      className="h-8 w-[104px] text-xs"
                      placeholder="#c55a11"
                    />
                  </div>
                ) : null}
              </div>
              <table
                className="w-full border-collapse"
                style={{
                  borderCollapse: "collapse",
                  width: "100%",
                  userSelect: "text",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: "14px",
                  lineHeight: "1.3",
                }}
              >
                <thead></thead>
                <tbody>
                  {allRows.map((row, index) => {
                    const label = getLabel(row.key, row.defaultLabel)
                    const isEditingLabel = editingCell?.key === row.key && editingCell?.type === "label"
                    const isEditingValue = editingCell?.key === row.key && editingCell?.type === "value"
                    const displayValue = row.isNumeric
                      ? formatValue(
                          row.value as number,
                          row.showCurrency !== false,
                          row.suffix || "",
                          row.valueCurrency,
                          row.displayCurrency,
                        )
                      : (row.value as string)

                    const highlightStyle = row.isHighlight
                      ? { background: fxSummaryPalette.finalEndBalance, color: "#ffffff", fontWeight: 700 }
                      : {}
                    const fxRowBackground =
                      row.key === "endBalanceHufCurrent"
                        ? fxSummaryPalette.endBalanceHufCurrent
                        : row.key === "endBalanceEUR500"
                          ? fxSummaryPalette.endBalanceEUR500
                          : row.key === "endBalanceEUR600"
                            ? fxSummaryPalette.endBalanceEUR600
                            : null

                    const labelStyle = row.isHighlight
                      ? { color: "#ffffff" }
                      : { color: "#1f2937", fontWeight: 600 }
                    const valueStyle = row.isHighlight ? { color: "#ffffff" } : { color: "#2b6cb0", fontWeight: 600 }
                    const labelStyleWithOverride = row.textColor ? { ...labelStyle, color: row.textColor } : labelStyle
                    const valueStyleWithOverride = row.textColor ? { ...valueStyle, color: row.textColor } : valueStyle

                    return (
                      <tr
                        key={index}
                        ref={index === 0 ? regularExcelFirstRowRef : null}
                        className={`border-b border-border ${
                          row.isHighlight
                            ? "bg-primary text-primary-foreground font-bold"
                            : row.bgColor
                              ? row.bgColor
                              : ""
                        }`}
                        style={
                          fxRowBackground
                            ? { ...highlightStyle, backgroundColor: fxRowBackground }
                            : row.key === "finalEndBalance"
                              ? { ...highlightStyle, backgroundColor: fxSummaryPalette.finalEndBalance }
                              : highlightStyle
                        }
                      >
                        <td
                          ref={index === 0 ? regularExcelFirstLabelCellRef : null}
                          className="py-2 px-3 text-sm"
                          style={{ border: "1px solid #cfcfcf", padding: "6px 10px", ...labelStyleWithOverride }}
                          onClick={() => {
                            if (!isEditingLabel) handleCellClick(row.key, "label", label)
                          }}
                          {...getSummaryInfoHandlers(row.key)}
                        >
                          {isEditingLabel ? (
                            <input
                              type="text"
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onBlur={handleSaveEdit}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit()
                                if (e.key === "Escape") {
                                  setEditingCell(null)
                                  setEditingText("")
                                  setIsActivelyEditing(false)
                                }
                              }}
                              autoFocus
                              className="text-sm bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                            />
                          ) : (
                            <span>{label}</span>
                          )}
                        </td>
                        <td
                          className="py-2 px-3 text-sm text-right tabular-nums"
                          style={{
                            border: "1px solid #cfcfcf",
                            padding: "6px 10px",
                            textAlign: "right",
                            ...valueStyleWithOverride,
                          }}
                          onClick={() => {
                            if (!isEditingValue) handleCellClick(row.key, "value", displayValue)
                          }}
                        >
                          {isEditingValue ? (
                            <input
                              type="text"
                              inputMode={row.isNumeric ? "numeric" : "text"}
                              value={
                                isActivelyEditing
                                  ? editingText
                                  : row.isNumeric
                                    ? formatNumber(parseNumber(editingText))
                                    : editingText
                              }
                              onChange={(e) => setEditingText(e.target.value)}
                              onFocus={() => setIsActivelyEditing(true)}
                              onBlur={handleSaveEdit}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit()
                                if (e.key === "Escape") {
                                  setEditingCell(null)
                                  setEditingText("")
                                  setIsActivelyEditing(false)
                                }
                              }}
                              autoFocus
                              className="text-sm tabular-nums text-right bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                            />
                          ) : (
                            <span>{displayValue}</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-end gap-2 px-4 pt-3 md:px-6">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsFxColorPickerOpen((current) => !current)}
                  title="FX sorok bázisszíne"
                  aria-label="FX sorok bázisszíne"
                  aria-expanded={isFxColorPickerOpen}
                >
                  <Wand2 className="h-4 w-4" />
                </Button>
                {isFxColorPickerOpen ? (
                  <div className="flex items-center gap-2 rounded-md border bg-card px-2 py-1">
                    <Input
                      id="fxBaseColor"
                      type="color"
                      value={normalizeHexColorInput(fxBaseColor) ?? "#c55a11"}
                      onChange={(e) => setFxBaseColor(normalizeHexColorInput(e.target.value) ?? "#c55a11")}
                      className="h-8 w-10 p-1"
                    />
                    <Input
                      value={fxBaseColor}
                      onChange={(e) => {
                        const next = e.target.value
                        setFxBaseColor(next)
                        const normalized = normalizeHexColorInput(next)
                        if (normalized) setFxBaseColor(normalized)
                      }}
                      className="h-8 w-[104px] text-xs"
                      placeholder="#c55a11"
                    />
                  </div>
                ) : null}
              </div>
              <div className="divide-y divide-border">
                {sections.map((section, sectionIndex) => (
                  <div key={sectionIndex}>
                    {section.rows.map((row, rowIndex) => {
                      const label = getLabel(row.key, row.defaultLabel)
                      const isEditingLabel = editingCell?.key === row.key && editingCell?.type === "label"
                      const isEditingValue = editingCell?.key === row.key && editingCell?.type === "value"

                      const displayValue = row.isNumeric
                        ? formatValue(
                            row.value as number,
                            row.showCurrency !== false,
                            row.suffix || "",
                            row.valueCurrency,
                            row.displayCurrency,
                          )
                        : (row.value as string)

                      return (
                        <div
                          key={`${sectionIndex}-${rowIndex}`}
                          ref={sectionIndex === 0 && rowIndex === 0 ? regularNormalFirstRowRef : null}
                          className={`grid grid-cols-2 gap-4 px-4 md:px-6 py-3 md:py-4 transition-colors ${
                            row.isHighlight ? "summary-highlight-row hover:bg-primary/80" : "hover:bg-muted/30"
                          } ${row.bgColor || ""} ${row.isHighlight ? "font-bold text-base md:text-xl" : ""}`}
                          style={
                            row.key === "finalEndBalance"
                              ? { backgroundColor: fxSummaryPalette.finalEndBalance }
                              : row.key === "endBalanceHufCurrent"
                              ? { backgroundColor: fxSummaryPalette.endBalanceHufCurrent }
                              : row.key === "endBalanceEUR500"
                                ? { backgroundColor: fxSummaryPalette.endBalanceEUR500 }
                                : row.key === "endBalanceEUR600"
                                  ? { backgroundColor: fxSummaryPalette.endBalanceEUR600 }
                                  : undefined
                          }
                        >
                          {isEditingLabel ? (
                            <input
                              type="text"
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onBlur={handleSaveEdit}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit()
                                if (e.key === "Escape") {
                                  setEditingCell(null)
                                  setEditingText("")
                                  setIsActivelyEditing(false)
                                }
                              }}
                              autoFocus
                              className={`text-sm md:text-base bg-transparent border-none focus:outline-none focus:ring-0 w-full ${
                                row.textClass || ""
                              } ${row.isHighlight ? "font-bold text-base md:text-xl" : ""}`}
                            />
                          ) : (
                            <div
                              ref={sectionIndex === 0 && rowIndex === 0 ? regularNormalFirstLabelCellRef : null}
                              className={`text-sm md:text-base cursor-pointer ${row.isHighlight ? "font-bold" : ""} ${
                                row.textClass || ""
                              }`}
                              onClick={() => handleCellClick(row.key, "label", label)}
                              {...getSummaryInfoHandlers(row.key)}
                            >
                              {label}:
                            </div>
                          )}

                          {isEditingValue ? (
                            <input
                              type="text"
                              inputMode={row.isNumeric ? "numeric" : "text"}
                              value={
                                isActivelyEditing
                                  ? editingText
                                  : row.isNumeric
                                    ? formatNumber(parseNumber(editingText))
                                    : editingText
                              }
                              onChange={(e) => setEditingText(e.target.value)}
                              onFocus={() => setIsActivelyEditing(true)}
                              onBlur={handleSaveEdit}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit()
                                if (e.key === "Escape") {
                                  setEditingCell(null)
                                  setEditingText("")
                                  setIsActivelyEditing(false)
                                }
                              }}
                              autoFocus
                              className={`text-sm md:text-base tabular-nums font-medium text-right bg-transparent border-none focus:outline-none focus:ring-0 w-full ${
                                row.textClass ? `${row.textClass} placeholder:text-inherit/70` : ""
                              } ${row.isHighlight ? "font-bold text-base md:text-xl" : ""}`}
                            />
                          ) : (
                            <div
                              className={`text-sm md:text-base tabular-nums font-medium text-right cursor-pointer ${
                                row.isHighlight ? "font-bold text-base md:text-xl" : ""
                              } ${row.textClass || ""}`}
                              onClick={() => handleCellClick(row.key, "value", displayValue)}
                            >
                              {displayValue}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {hasEsetiSummaryData && esetiSummaryRows.length > 0 ? (
          isExcelView ? (
            <Card className="mt-6">
              <CardContent className="p-4 overflow-x-auto">
                <table
                  className="w-full border-collapse"
                  style={{
                    borderCollapse: "collapse",
                    width: "100%",
                    userSelect: "text",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontSize: "14px",
                    lineHeight: "1.3",
                  }}
                >
                  <colgroup>
                    <col style={{ width: esetiColumnWidths.label }} />
                    <col style={{ width: esetiColumnWidths.value }} />
                  </colgroup>
                  <tbody>
                    {esetiSummaryRows.map((row) => {
                      const label = getEsetiRowLabel(row)
                      const displayValue = formatEsetiRowValue(row)
                      const isEditingLabel = esetiEditingCell?.key === row.key && esetiEditingCell?.type === "label"
                      const isEditingValue = esetiEditingCell?.key === row.key && esetiEditingCell?.type === "value"
                      const rowBackground =
                        row.highlight === "header"
                          ? esetiSummaryPalette.header
                          : row.highlight === "details"
                            ? esetiSummaryPalette.details
                            : row.highlight === "primary"
                              ? esetiSummaryPalette.primary
                              : row.highlight === "secondary"
                                ? esetiSummaryPalette.secondary
                                : esetiSummaryPalette.default
                      const fontWeight = row.highlight === "header" || row.highlight === "primary" || row.highlight === "secondary" ? 700 : 600

                      if (row.fullWidth) {
                        return (
                          <tr key={row.key} style={{ backgroundColor: rowBackground }}>
                            <td
                              colSpan={2}
                              style={{
                                border: "1px solid rgba(255,255,255,0.35)",
                                padding: "10px 12px",
                                color: "#ffffff",
                                fontWeight,
                                fontSize: row.highlight === "header" ? "16px" : "14px",
                              }}
                              onClick={() => {
                                if (!isEditingLabel) handleEsetiCellClick(row, "label", label)
                              }}
                            >
                              {isEditingLabel ? (
                                <input
                                  type="text"
                                  value={esetiEditingText}
                                  onChange={(e) => setEsetiEditingText(e.target.value)}
                                  onBlur={() => handleSaveEsetiEdit(row)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveEsetiEdit(row)
                                    if (e.key === "Escape") {
                                      setEsetiEditingCell(null)
                                      setEsetiEditingText("")
                                      setIsActivelyEditingEseti(false)
                                    }
                                  }}
                                  autoFocus
                                  className="w-full bg-transparent border-none focus:outline-none focus:ring-0"
                                />
                              ) : (
                                <span>{label}:</span>
                              )}
                            </td>
                          </tr>
                        )
                      }

                      return (
                        <tr key={row.key} style={{ backgroundColor: rowBackground }}>
                          <td
                            style={{
                              border: "1px solid rgba(255,255,255,0.35)",
                              padding: "9px 12px",
                              color: "#ffffff",
                              fontWeight,
                            }}
                            onClick={() => {
                              if (!isEditingLabel) handleEsetiCellClick(row, "label", label)
                            }}
                          >
                            {isEditingLabel ? (
                              <input
                                type="text"
                                value={esetiEditingText}
                                onChange={(e) => setEsetiEditingText(e.target.value)}
                                onBlur={() => handleSaveEsetiEdit(row)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveEsetiEdit(row)
                                  if (e.key === "Escape") {
                                    setEsetiEditingCell(null)
                                    setEsetiEditingText("")
                                    setIsActivelyEditingEseti(false)
                                  }
                                }}
                                autoFocus
                                className="w-full bg-transparent border-none focus:outline-none focus:ring-0"
                              />
                            ) : (
                              <span>{label}:</span>
                            )}
                          </td>
                          <td
                            style={{
                              border: "1px solid rgba(255,255,255,0.35)",
                              padding: "9px 12px",
                              color: "#ffffff",
                              fontWeight,
                              textAlign: "right",
                              whiteSpace: "nowrap",
                            }}
                            onClick={() => {
                              if (!isEditingValue) handleEsetiCellClick(row, "value", displayValue)
                            }}
                          >
                            {isEditingValue ? (
                              <input
                                type="text"
                                inputMode={row.isNumeric ? "numeric" : "text"}
                                value={
                                  isActivelyEditingEseti
                                    ? esetiEditingText
                                    : row.isNumeric
                                      ? formatNumber(parseNumber(esetiEditingText))
                                      : esetiEditingText
                                }
                                onChange={(e) => setEsetiEditingText(e.target.value)}
                                onFocus={() => setIsActivelyEditingEseti(true)}
                                onBlur={() => handleSaveEsetiEdit(row)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveEsetiEdit(row)
                                  if (e.key === "Escape") {
                                    setEsetiEditingCell(null)
                                    setEsetiEditingText("")
                                    setIsActivelyEditingEseti(false)
                                  }
                                }}
                                autoFocus
                                className="w-full bg-transparent border-none text-right focus:outline-none focus:ring-0"
                              />
                            ) : (
                              <span>{displayValue}</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ) : (
            <Card className="mt-6 overflow-hidden">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {esetiSummaryRows.map((row) => {
                    const label = getEsetiRowLabel(row)
                    const displayValue = formatEsetiRowValue(row)
                    const isEditingLabel = esetiEditingCell?.key === row.key && esetiEditingCell?.type === "label"
                    const isEditingValue = esetiEditingCell?.key === row.key && esetiEditingCell?.type === "value"
                    const rowBackground =
                      row.highlight === "header"
                        ? esetiSummaryPalette.header
                        : row.highlight === "details"
                          ? esetiSummaryPalette.details
                          : row.highlight === "primary"
                            ? esetiSummaryPalette.primary
                            : row.highlight === "secondary"
                              ? esetiSummaryPalette.secondary
                              : esetiSummaryPalette.default

                    if (row.fullWidth) {
                      return (
                        <div
                          key={row.key}
                          className="px-4 md:px-6 py-3 md:py-4"
                          style={{ backgroundColor: rowBackground, color: "#ffffff" }}
                        >
                          {isEditingLabel ? (
                            <input
                              type="text"
                              value={esetiEditingText}
                              onChange={(e) => setEsetiEditingText(e.target.value)}
                              onBlur={() => handleSaveEsetiEdit(row)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEsetiEdit(row)
                                if (e.key === "Escape") {
                                  setEsetiEditingCell(null)
                                  setEsetiEditingText("")
                                  setIsActivelyEditingEseti(false)
                                }
                              }}
                              autoFocus
                              className="w-full bg-transparent border-none focus:outline-none focus:ring-0"
                            />
                          ) : (
                            <div
                              className={`${row.highlight === "header" ? "text-base md:text-xl font-bold" : "text-sm md:text-base font-semibold"} cursor-pointer`}
                              onClick={() => handleEsetiCellClick(row, "label", label)}
                            >
                              {label}:
                            </div>
                          )}
                        </div>
                      )
                    }

                    return (
                      <div
                        key={row.key}
                        className="grid gap-4 px-4 md:px-6 py-3 md:py-4"
                        style={{
                          backgroundColor: rowBackground,
                          color: "#ffffff",
                          gridTemplateColumns: `${esetiColumnWidths.label} ${esetiColumnWidths.value}`,
                        }}
                      >
                        {isEditingLabel ? (
                          <input
                            type="text"
                            value={esetiEditingText}
                            onChange={(e) => setEsetiEditingText(e.target.value)}
                            onBlur={() => handleSaveEsetiEdit(row)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEsetiEdit(row)
                              if (e.key === "Escape") {
                                setEsetiEditingCell(null)
                                setEsetiEditingText("")
                                setIsActivelyEditingEseti(false)
                              }
                            }}
                            autoFocus
                            className="w-full bg-transparent border-none focus:outline-none focus:ring-0"
                          />
                        ) : (
                          <div className="text-sm md:text-base cursor-pointer font-semibold" onClick={() => handleEsetiCellClick(row, "label", label)}>
                            {label}:
                          </div>
                        )}

                        {isEditingValue ? (
                          <input
                            type="text"
                            inputMode={row.isNumeric ? "numeric" : "text"}
                            value={
                              isActivelyEditingEseti
                                ? esetiEditingText
                                : row.isNumeric
                                  ? formatNumber(parseNumber(esetiEditingText))
                                  : esetiEditingText
                            }
                            onChange={(e) => setEsetiEditingText(e.target.value)}
                            onFocus={() => setIsActivelyEditingEseti(true)}
                            onBlur={() => handleSaveEsetiEdit(row)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEsetiEdit(row)
                              if (e.key === "Escape") {
                                setEsetiEditingCell(null)
                                setEsetiEditingText("")
                                setIsActivelyEditingEseti(false)
                              }
                            }}
                            autoFocus
                            className="w-full bg-transparent border-none text-right focus:outline-none focus:ring-0"
                          />
                        ) : (
                          <div className="text-sm md:text-base text-right cursor-pointer font-semibold" onClick={() => handleEsetiCellClick(row, "value", displayValue)}>
                            {displayValue}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        ) : null}
        <div className="mt-3">
          <ColumnHoverInfoPanel activeKey={activeColumnInfoKey} productKey={summaryPanelProductKey} />
        </div>
      </div>
    </div>
  )
}
