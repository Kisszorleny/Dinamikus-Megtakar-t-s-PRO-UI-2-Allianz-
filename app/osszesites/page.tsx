"use client"

import { useMemo, useState, useEffect, useRef, type MouseEvent as ReactMouseEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Table2, LayoutGrid, Copy, Upload, Wand2, Save, Trash2, ChevronDown } from "lucide-react"
import { useCalculatorData } from "@/lib/calculator-context"
import { convertForDisplay } from "@/lib/currency-conversion"
import { formatNumber, parseNumber } from "@/lib/format-number"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ColumnHoverInfoPanel } from "@/components/column-hover-info-panel"
import { resolveProductContextKey } from "@/lib/column-explanations"
import { getProductLabelFromCatalog } from "@/lib/product-catalog/ui"
import { buildSummaryEmailTemplate, getSummaryEmailTone } from "@/lib/summary-email/template"
import type { EmailTemplateFieldKey, EmailTemplateSourceType, TemplateFieldMapping } from "@/lib/email-templates/types"
import { renderEmailTemplate } from "@/lib/email-templates/render"
import { buildCalculatorTableHtmlFromTemplate, buildCalculatorTablePlain } from "@/lib/email-templates/calculator-table"
import { getFixedAmountValues } from "@/lib/email-templates/fixed-amounts"
// TODO: Replace with real calculation import when implementing business logic
// import { calculateResultsDaily, type InputsDaily, type Currency } from "@/lib/engine/calculate-results-daily"
type InputsDaily = any
type Currency = "HUF" | "EUR" | "USD"
import { buildYearlyPlan } from "@/lib/plan"
import { calculate, type ProductId } from "@/lib/engine"

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
  [key in RowKey]?: {
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
}

type StoredEmailTemplateDetails = {
  id: string
  name: string
  sourceType?: EmailTemplateSourceType
  originalFileName?: string
  rawContent?: string
  subject?: string
  htmlContent: string
  textContent: string
  mappings: TemplateFieldMapping[]
}

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

function inferSourceTypeFromFileName(fileName: string): EmailTemplateSourceType | null {
  const lower = fileName.trim().toLowerCase()
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "html"
  if (lower.endsWith(".txt")) return "text"
  if (lower.endsWith(".eml")) return "eml"
  return null
}

function sanitizePreviewHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    // Preview-only fallback for very large inline images:
    // keep send path untouched, but avoid rendering extremely heavy blobs in the editor.
    .replace(
      /<img\b[^>]*\bsrc=(["'])data:image\/[^"']{2000000,}\1[^>]*>/gi,
      '<div data-dm-preview-image-truncated="true" style="margin:8px 0;padding:10px 12px;border:1px dashed #9ca3af;border-radius:6px;background:#f8fafc;color:#475569;font-size:12px;">Nagy inline kép az előnézetben egyszerűsítve. Küldéskor a teljes kép megy ki.</div>',
    )
}

function toTemplateCurrencyLabel(currency: Currency): string {
  return currency === "HUF" ? "Ft" : currency
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

export default function OsszesitesPage() {
  const router = useRouter()
  const { data: contextData, isHydrated, updateData } = useCalculatorData()
  const [activeColumnInfoKey, setActiveColumnInfoKey] = useState<string | null>(null)
  const OFFER_UNTIL_STORAGE_KEY = "summary-emailOfferUntil"
  const FX_BASE_COLOR_STORAGE_KEY = "summary-emailFxBaseColor"

  const getDefaultOfferUntil = () => {
    const pad2 = (n: number) => String(n).padStart(2, "0")
    const now = new Date()
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    d.setDate(d.getDate() + 7)
    return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`
  }

  const [computedData, setComputedData] = useState<typeof contextData>(null)
  const [isComputing, setIsComputing] = useState(false)
  const [fallbackProductLabel, setFallbackProductLabel] = useState<string | null>(null)
  const [enableRealValue, setEnableRealValue] = useState(false)
  const [inflationRate, setInflationRate] = useState(3)

  const [isExcelView, setIsExcelView] = useState(false)
  const [summaryOverrides, setSummaryOverrides] = useState<SummaryOverrides>({})
  const [editingCell, setEditingCell] = useState<{ key: RowKey; type: "label" | "value" } | null>(null)
  const [editingText, setEditingText] = useState<string>("")
  const [isActivelyEditing, setIsActivelyEditing] = useState(false)

  const [emailClientName, setEmailClientName] = useState("Viktor")
  const [emailRecipient, setEmailRecipient] = useState("")
  const [emailOfferUntil, setEmailOfferUntil] = useState(() => {
    // Avoid SSR/client timezone mismatch: compute only in browser.
    if (typeof window === "undefined") return ""
    const stored = localStorage.getItem(OFFER_UNTIL_STORAGE_KEY)
    if (stored && /^\d{4}\.\d{2}\.\d{2}$/.test(stored)) {
      return stored
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
  const [emailTegezo, setEmailTegezo] = useState(false)
  const [emailTemplates, setEmailTemplates] = useState<StoredEmailTemplate[]>([])
  const [isTemplateAdminView, setIsTemplateAdminView] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [templateSourceType, setTemplateSourceType] = useState<EmailTemplateSourceType>("html")
  const [templateRawContent, setTemplateRawContent] = useState("")
  const [templatePreviewHtml, setTemplatePreviewHtml] = useState("")
  const [templateRenderedPreviewHtml, setTemplateRenderedPreviewHtml] = useState("")
  const [templateRenderedPreviewError, setTemplateRenderedPreviewError] = useState("")
  const [templateSuggestedSubject, setTemplateSuggestedSubject] = useState("")
  const [templateName, setTemplateName] = useState("")
  const [templateOriginalFileName, setTemplateOriginalFileName] = useState("")
  const [templateStatus, setTemplateStatus] = useState<"idle" | "loading" | "saving" | "failed">("idle")
  const [templateError, setTemplateError] = useState("")
  const [templateSelectedSnippet, setTemplateSelectedSnippet] = useState("")
  const [templateSelectedTableSnippet, setTemplateSelectedTableSnippet] = useState("")
  const [isFxColorPickerOpen, setIsFxColorPickerOpen] = useState(false)
  const [isTemplateUploaderOpen, setIsTemplateUploaderOpen] = useState(true)
  const [templateMappings, setTemplateMappings] = useState<TemplateFieldMapping[]>([
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
  ])
  const [templateSelectionFieldKey, setTemplateSelectionFieldKey] = useState<EmailTemplateFieldKey>("name")
  const templatePreviewRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const trimmed = emailOfferUntil.trim()
    if (trimmed && /^\d{4}\.\d{2}\.\d{2}$/.test(trimmed)) {
      localStorage.setItem(OFFER_UNTIL_STORAGE_KEY, trimmed)
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

  const loadEmailTemplates = async () => {
    try {
      const response = await fetch("/api/email-templates")
      const result = await response.json().catch(() => ({}))
      if (!response.ok) return
      const templates = Array.isArray(result?.templates) ? (result.templates as StoredEmailTemplate[]) : []
      setEmailTemplates(templates)
      setIsTemplateAdminView(Boolean(result?.isAdmin))
    } catch {
      // ignore list errors in main page flow
    }
  }

  useEffect(() => {
    void loadEmailTemplates()
  }, [])

  useEffect(() => {
    const id = selectedTemplateId.trim()
    if (!id) return

    let cancelled = false
    const loadSelectedTemplateDetails = async () => {
      setIsTemplateUploaderOpen(true)
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
        const previewHtml = template.htmlContent || (template.textContent ? `<pre>${template.textContent}</pre>` : "")

        if (!cancelled) {
          setTemplateName(template.name || "")
          if (template.sourceType) setTemplateSourceType(template.sourceType)
          setTemplateOriginalFileName(template.originalFileName || "")
          setTemplateRawContent(template.rawContent || template.htmlContent || template.textContent || "")
          setTemplateSuggestedSubject(template.subject || "")
          setTemplatePreviewHtml(sanitizePreviewHtml(previewHtml))
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

  const parseTemplateContentOnServer = async (sourceType: EmailTemplateSourceType, rawContent: string) => {
    setTemplateStatus("loading")
    setTemplateError("")
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 15000)
    try {
      const response = await fetch("/api/email-templates/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ sourceType, rawContent }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result?.candidate) {
        setTemplateStatus("failed")
        setTemplateError(
          typeof result?.message === "string" && result.message
            ? result.message
            : "Nem sikerült feldolgozni a sablont.",
        )
        return
      }
      const candidate = result.candidate as {
        htmlContent: string
        textContent: string
        suggestedMappings: TemplateFieldMapping[]
        subject?: string
      }
      const previewHtml = candidate.htmlContent || (candidate.textContent ? `<pre>${candidate.textContent}</pre>` : "")
      setTemplatePreviewHtml(sanitizePreviewHtml(previewHtml))
      setTemplateSelectedSnippet("")
      setTemplateSuggestedSubject(candidate.subject || "")
      if (Array.isArray(candidate.suggestedMappings)) {
        setTemplateMappings((current) => {
          const byKey = new Map<EmailTemplateFieldKey, TemplateFieldMapping>()
          for (const item of current) {
            byKey.set(item.key, item)
          }
          for (const suggestion of candidate.suggestedMappings) {
            const existing = byKey.get(suggestion.key)
            const sanitizedSnippet =
              suggestion.key === "calculator_table" && suggestion.sourceSnippet
                ? sanitizePreviewHtml(suggestion.sourceSnippet)
                : suggestion.sourceSnippet
            byKey.set(suggestion.key, {
              ...(existing ?? {
                key: suggestion.key,
                label: suggestion.label || TEMPLATE_FIELD_LABELS[suggestion.key],
                token: suggestion.token || `{{${suggestion.key}}}`,
              }),
              ...suggestion,
              sourceSnippet: sanitizedSnippet,
              token: existing?.token || suggestion.token || `{{${suggestion.key}}}`,
            })
          }
          return [...byKey.values()]
        })
      }
      setTemplateStatus("idle")
    } catch (error) {
      setTemplateStatus("failed")
      if (error instanceof DOMException && error.name === "AbortError") {
        setTemplateError("A sablon feldolgozása túl sokáig tartott. Próbáld újra, vagy kisebb/kevesebb mellékletes EML-t tölts fel.")
      } else {
        setTemplateError("Nem sikerült feldolgozni a sablont.")
      }
    } finally {
      window.clearTimeout(timeoutId)
    }
  }

  const saveTemplate = async () => {
    const hasToken = templateMappings.some((mapping) => Boolean(mapping.token?.trim()))
    if (!templateName.trim()) {
      setTemplateStatus("failed")
      setTemplateError("Adj meg sablon nevet.")
      return
    }
    if (!templateRawContent.trim()) {
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
          name: templateName.trim(),
          sourceType: templateSourceType,
          originalFileName: templateOriginalFileName || undefined,
          rawContent: templateRawContent,
          subject: templateSuggestedSubject || undefined,
          mappings: templateMappings.filter((mapping) => mapping.token.trim()),
        }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result?.template) {
        setTemplateStatus("failed")
        setTemplateError(typeof result?.message === "string" ? result.message : "Sablon mentési hiba.")
        return
      }
      setTemplateStatus("idle")
      // Keep the built-in template as default after saving.
      setIsTemplateUploaderOpen(true)
      await loadEmailTemplates()
    } catch {
      setTemplateStatus("failed")
      setTemplateError("Sablon mentési hiba.")
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
      setTemplateRenderedPreviewError("")
      return
    }
    if (!computedData) {
      setTemplateRenderedPreviewHtml(templatePreviewHtml)
      setTemplateRenderedPreviewError("")
      return
    }

    try {
      const summaryValues = getSummaryEmailValues()
      const displayCurrency = computedData.displayCurrency
      const templateCurrencyLabel = toTemplateCurrencyLabel(displayCurrency)
      const fixedAmounts = getFixedAmountValues(displayCurrency)
      const safeName = (emailClientName || "Ügyfél").trim()
      const safeUntil = (emailOfferUntil || "").trim()
      const tableMapping = templateMappings.find((mapping) => mapping.key === "calculator_table")
      const calculatorTableHtml = buildCalculatorTableHtmlFromTemplate(summaryValues, tableMapping?.sourceSnippet, {
        fxBaseColor,
      })
      const calculatorTablePlain = buildCalculatorTablePlain(summaryValues)
      const rendered = renderEmailTemplate({
        template: {
          htmlContent: templatePreviewHtml,
          textContent: "",
          mappings: templateMappings,
        },
        values: {
          name: safeName,
          amount: summaryValues.monthlyPayment,
          deadline: safeUntil,
          currency: templateCurrencyLabel,
          tone: emailTegezo ? "Kedves" : "Tisztelt",
          calculator_table: "{{calculator_table}}",
          fixed_small_amount: fixedAmounts.fixedSmallAmount,
          fixed_large_amount: fixedAmounts.fixedLargeAmount,
          retirement_section: "{{retirement_section}}",
          bonus_section: "{{bonus_section}}",
        },
        calculatorTableHtml,
        calculatorTablePlain,
        accountGoalPhrase: summaryValues.accountGoal,
        isAllianzEletprogram: computedData.selectedProduct === "allianz_eletprogram",
      })
      setTemplateRenderedPreviewHtml(sanitizePreviewHtml(rendered.html || templatePreviewHtml))
      setTemplateRenderedPreviewError("")
    } catch {
      setTemplateRenderedPreviewHtml(templatePreviewHtml)
      setTemplateRenderedPreviewError("A kitöltött előnézet számítása közben hiba történt, a nyers sablon látható.")
    }
  }, [
    templatePreviewHtml,
    computedData,
    summaryOverrides,
    templateMappings,
    emailClientName,
    emailOfferUntil,
    emailTegezo,
    fxBaseColor,
  ])

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
      const storedEnableRealValue = sessionStorage.getItem("calculator-enableRealValue")
      const storedInflationRate = sessionStorage.getItem("calculator-inflationRate")

      if (!storedInputs || !storedUnit || !storedValue) {
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

      try {
        inputs = JSON.parse(storedInputs)
      } catch (e) {
        console.error("[v0] /osszesites failed to parse inputs:", e)
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

      // Validate required fields in inputs
      if (!inputs.currency || !inputs.frequency) {
        console.error("[v0] /osszesites inputs missing required fields:", {
          hasCurrency: !!inputs.currency,
          hasFrequency: !!inputs.frequency,
        })
        setIsComputing(false)
        return
      }

      let yearsValue = durationValue
      if (durationUnit === "month") {
        yearsValue = durationValue / 12
      } else if (durationUnit === "day") {
        yearsValue = durationValue / 365
      }

      const totalYearsForPlan = Math.max(1, Math.ceil(yearsValue))
      const periodsPerYear =
        inputs.frequency === "havi"
          ? 12
          : inputs.frequency === "negyedéves"
            ? 4
            : inputs.frequency === "féléves"
              ? 2
              : 1
      const baseYear1Payment = inputs.keepYearlyPayment
        ? (inputs.regularPayment || 0) * 12
        : (inputs.regularPayment || 0) * periodsPerYear

      const plan = buildYearlyPlan({
        years: totalYearsForPlan,
        baseYear1Payment,
        baseAnnualIndexPercent: inputs.annualIndexPercent || 0,
        indexByYear,
        paymentByYear,
        withdrawalByYear,
      })

      const monthlyPayment = inputs.regularPayment || 0
      const yearlyPayment = monthlyPayment * 12

      const effectiveCurrency =
        selectedProduct === "alfa_jade"
          ? (inputs.currency === "USD" ? "USD" : "EUR")
          : selectedProduct === "alfa_jovokep"
            ? "HUF"
            : selectedProduct === "alfa_jovotervezo"
              ? "HUF"
            : selectedProduct === "alfa_relax_plusz"
              ? "HUF"
            : selectedProduct === "generali_kabala"
              ? "HUF"
            : selectedProduct === "generali_mylife_extra_plusz"
              ? "HUF"
            : selectedProduct === "cig_esszenciae"
              ? (inputs.currency === "EUR" ? "EUR" : "HUF")
            : selectedProduct === "cig_nyugdijkotvenye"
              ? "HUF"
            : selectedProduct === "alfa_zen_pro"
              ? (inputs.currency === "USD" ? "USD" : inputs.currency === "EUR" ? "EUR" : "HUF")
            : selectedProduct === "alfa_zen" || selectedProduct === "alfa_zen_eur"
              ? (inputs.currency === "USD" ? "USD" : "EUR")
            : selectedProduct === "alfa_premium_selection"
              ? inputs.currency === "USD"
                ? "USD"
                : inputs.enableTaxCredit
                  ? (inputs.currency === "EUR" ? "EUR" : "HUF")
                  : inputs.currency === "EUR"
                    ? "EUR"
                    : "HUF"
            : selectedProduct === "signal_elorelato_ul001"
              ? "HUF"
            : selectedProduct === "signal_nyugdij_terv_plusz_ny010"
              ? "HUF"
            : selectedProduct === "signal_nyugdijprogram_sn005"
              ? "HUF"
            : selectedProduct === "signal_ongondoskodasi_wl009"
              ? "HUF"
            : selectedProduct === "union_vienna_age_505"
              ? (inputs.currency === "USD" ? "USD" : inputs.currency === "EUR" ? "EUR" : "HUF")
            : selectedProduct === "union_vienna_plan_500"
              ? (inputs.currency === "USD" ? "USD" : inputs.currency === "EUR" ? "EUR" : "HUF")
            : selectedProduct === "union_vienna_time"
              ? "HUF"
            : selectedProduct === "uniqa_eletcel_275"
              ? "HUF"
            : selectedProduct === "uniqa_premium_life_190"
              ? "HUF"
            : selectedProduct === "groupama_next"
              ? "HUF"
            : selectedProduct === "groupama_easy"
              ? "HUF"
            : inputs.currency
      let results: any
      let totalBonus = 0
      try {
        const productId = mapSelectedProductToProductId(selectedProduct, selectedInsurer)
        const effectiveProductVariant =
          selectedProduct === "alfa_exclusive_plus"
            ? inputs.enableTaxCredit
              ? "alfa_exclusive_plus_ny05"
              : "alfa_exclusive_plus_tr08"
            : selectedProduct === "alfa_jade"
              ? effectiveCurrency === "USD"
                ? "alfa_jade_tr29"
                : "alfa_jade_tr19"
            : selectedProduct === "alfa_jovokep"
              ? "alfa_jovokep_tr10"
            : selectedProduct === "alfa_jovotervezo"
              ? "alfa_jovotervezo_tr03"
            : selectedProduct === "alfa_relax_plusz"
              ? "alfa_relax_plusz_ny01"
            : selectedProduct === "alfa_zen_pro"
              ? (effectiveCurrency === "USD"
                  ? "alfa_zen_pro_ny24"
                  : effectiveCurrency === "EUR"
                    ? "alfa_zen_pro_ny14"
                    : "alfa_zen_pro_ny08")
            : selectedProduct === "alfa_zen" || selectedProduct === "alfa_zen_eur"
              ? (effectiveCurrency === "USD" ? "alfa_zen_ny23" : "alfa_zen_ny13")
            : selectedProduct === "generali_kabala"
              ? (inputs.enableTaxCredit ? "generali_kabala_u91_pension" : "generali_kabala_u91_life")
            : selectedProduct === "generali_mylife_extra_plusz"
              ? (inputs.enableTaxCredit
                  ? "generali_mylife_extra_plusz_u67p_pension"
                  : "generali_mylife_extra_plusz_u67p_life")
            : selectedProduct === "cig_esszenciae"
              ? (effectiveCurrency === "EUR" ? "cig_esszenciae_eur" : "cig_esszenciae_huf")
            : selectedProduct === "cig_nyugdijkotvenye"
              ? "cig_nyugdijkotvenye_nyugdij"
            : selectedProduct === "alfa_premium_selection"
              ? effectiveCurrency === "USD"
                ? (inputs.enableTaxCredit ? "alfa_premium_selection_ny22" : "alfa_premium_selection_tr28")
                : inputs.enableTaxCredit
                ? effectiveCurrency === "EUR"
                  ? "alfa_premium_selection_ny12"
                  : "alfa_premium_selection_ny06"
                : effectiveCurrency === "EUR"
                  ? "alfa_premium_selection_tr18"
                  : "alfa_premium_selection_tr09"
            : selectedProduct === "signal_elorelato_ul001"
              ? "signal_elorelato_ul001_huf"
            : selectedProduct === "signal_nyugdij_terv_plusz_ny010"
              ? "signal_nyugdij_terv_plusz_ny010_huf"
            : selectedProduct === "signal_nyugdijprogram_sn005"
              ? "signal_nyugdijprogram_sn005_huf"
            : selectedProduct === "signal_ongondoskodasi_wl009"
              ? "signal_ongondoskodasi_wl009_huf"
            : selectedProduct === "union_vienna_age_505"
              ? (
                  effectiveCurrency === "USD"
                    ? ((inputs.productVariant ?? "").includes("__bonus_blocked")
                        ? "union_vienna_age_505_usd__bonus_blocked"
                        : "union_vienna_age_505_usd")
                    : effectiveCurrency === "EUR"
                      ? ((inputs.productVariant ?? "").includes("__bonus_blocked")
                          ? "union_vienna_age_505_eur__bonus_blocked"
                          : "union_vienna_age_505_eur")
                      : ((inputs.productVariant ?? "").includes("__bonus_blocked")
                          ? "union_vienna_age_505_huf__bonus_blocked"
                          : "union_vienna_age_505_huf")
                )
            : selectedProduct === "union_vienna_plan_500"
              ? (
                  effectiveCurrency === "USD"
                    ? "union_vienna_plan_500_usd"
                    : effectiveCurrency === "EUR"
                      ? "union_vienna_plan_500_eur"
                      : "union_vienna_plan_500_huf"
                )
            : selectedProduct === "union_vienna_time"
              ? (inputs.productVariant?.includes("564")
                  ? "union_vienna_time_564"
                  : inputs.productVariant?.includes("606")
                    ? "union_vienna_time_606"
                    : "union_vienna_time_584")
            : selectedProduct === "uniqa_eletcel_275"
              ? "uniqa_eletcel_275_huf"
            : selectedProduct === "uniqa_premium_life_190"
              ? "uniqa_premium_life_190_huf"
            : selectedProduct === "groupama_next"
              ? (
                  (inputs.productVariant ?? "").includes("ul0")
                    ? "groupama_next_ul0_trad100_huf"
                    : (inputs.productVariant ?? "").includes("ul75")
                      ? "groupama_next_ul75_trad25_huf"
                      : "groupama_next_ul100_trad0_huf"
                )
            : selectedProduct === "groupama_easy"
              ? (inputs.enableTaxCredit ? "groupama_easy_life_tax_huf" : "groupama_easy_life_huf")
            : (selectedProduct ?? undefined)
        const dailyInputs: InputsDaily = {
          ...inputs,
          currency: effectiveCurrency,
          durationUnit,
          durationValue,
          yearsPlanned: totalYearsForPlan,
          yearlyPaymentsPlan: plan.yearlyPaymentsPlan,
          yearlyWithdrawalsPlan: plan.yearlyWithdrawalsPlan,
          assetCostPercentByYear,
          plusCostByYear,
          bonusPercentByYear,
          investedShareByYear,
          redemptionFeeByYear,
          redemptionEnabled: isRedemptionOpen,
          isAccountSplitOpen,
          isTaxBonusSeparateAccount,
          taxCreditAmountByYear,
          taxCreditLimitByYear,
          productVariant: effectiveProductVariant,
        }
        results = calculate(productId, dailyInputs)
        totalBonus = results.totalBonus ?? 0
      } catch (error) {
        console.error("[v0] /osszesites calculation failed, using defaults for results:", error)
        results = {
          totalContributions: 0,
          totalBonus: 0,
          endBalance: 0,
          totalTaxCredit: 0,
          totalCosts: 0,
          totalAssetBasedCost: 0,
          totalWithdrawals: 0,
        }
      }

      // Determine if product has bonus
      const productHasBonus = inputs.bonusMode !== "none"

      // Build context data structure
      const hufRate =
        inputs.currency === "EUR" ? inputs.eurToHufRate || 400 : inputs.currency === "USD" ? inputs.usdToHufRate || 360 : 1
      const endBalanceHufCurrent =
        inputs.currency && inputs.currency !== "HUF" ? (results.endBalance || 0) * hufRate : undefined
      const endBalanceHuf500 =
        inputs.currency === "EUR" ? (results.endBalance || 0) * 500 : undefined
      const endBalanceHuf600 =
        inputs.currency === "EUR" ? (results.endBalance || 0) * 600 : undefined

      const computed = {
        monthlyPayment, // Always from inputs, never from calculation
        yearlyPayment, // Always calculated as monthly * 12
        years: yearsValue, // Always from duration inputs
        currency: inputs.currency as Currency,
        displayCurrency: inputs.currency as Currency,
        eurToHufRate: inputs.eurToHufRate || 400,
        totalContributions: results.totalContributions,
        totalReturn: results.endBalance - results.totalContributions,
        endBalance: results.endBalance,
        totalTaxCredit: results.totalTaxCredit,
        totalBonus, // From results.totalBonus with fallback to 0
        totalCost: results.totalCosts,
        totalAssetBasedCost: results.totalAssetBasedCost,
        totalRiskInsuranceCost: 0,
        annualYieldPercent: inputs.annualYieldPercent || 0,
        selectedInsurer: selectedInsurer || undefined,
        selectedProduct: selectedProduct || undefined,
        enableTaxCredit: inputs.enableTaxCredit || false,
        enableNetting,
        productHasBonus,
        netEndBalance: results.endBalance,
        netEndBalanceWithTax: results.endBalance + results.totalTaxCredit,
        endBalanceHufCurrent,
        endBalanceEUR500: endBalanceHuf500,
        endBalanceEUR600: endBalanceHuf600,
      }

      setComputedData(computed)
      updateData(computed)
    } catch (error) {
      console.error("[v0] /osszesites failed to compute data from sessionStorage:", error)
    } finally {
      setIsComputing(false)
    }
  }, [isHydrated, contextData, updateData, computedData])

  // Use computed data instead of contextData
  const data = computedData

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

  const getComputedValue = (key: RowKey): number | string => {
    switch (key) {
      case "accountName":
        if (data.selectedProduct) {
          return getProductLabel(data.selectedProduct)
        }
        if (contextData?.selectedProduct) {
          return getProductLabel(contextData.selectedProduct)
        }
        return fallbackProductLabel || "—"
      case "accountGoal":
        return data.enableTaxCredit ? "Nyugdíjmegtakarítás és tőkenövelés" : "Tőkenövelés"
      case "strategy":
        return "Vegyes" // Always default to "Vegyes", never from context
      case "annualYield":
        return data.annualYieldPercent !== undefined && !isNaN(data.annualYieldPercent)
          ? `${data.annualYieldPercent.toFixed(data.annualYieldPercent % 1 === 0 ? 0 : 1)}%`
          : "—"
      case "finalEndBalance":
        return (data.endBalance as number) || 0
      case "netFinalEndBalance":
        return (data.netEndBalance as number) || 0
      default:
        return (data[key] as number) || 0
    }
  }

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
    if (typeof value === "string") return value

    let adjustedValue = value
    if (enableRealValue) {
      const yearsForReal = typeof data?.years === "number" ? data.years : 0
      const inflationMultiplier = Math.pow(1 + inflationRate / 100, yearsForReal)
      if (isFinite(inflationMultiplier) && inflationMultiplier > 0) {
        adjustedValue = value / inflationMultiplier
      }
    }

    const fromCurrency = valueCurrency ?? data.currency
    const displayCurrency = displayCurrencyOverride ?? data.displayCurrency
    const displayValue = Math.round(convertForDisplay(adjustedValue, fromCurrency, displayCurrency, data.eurToHufRate))
    const formatted = formatNumber(displayValue)
    if (!showCurrency) return formatted + suffix
    return `${formatted} ${displayCurrency === "HUF" ? "Ft" : "€"}${suffix}`
  }

  const handleCellClick = (key: RowKey, type: "label" | "value", currentValue: string) => {
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
          const calcValue = convertForDisplay(parsed, data.displayCurrency, data.currency, data.eurToHufRate)

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
        ...(data.enableTaxCredit
          ? [
              {
                key: "totalTaxCredit" as RowKey,
                defaultLabel: "Adójóváírás a tartam alatt összesen",
                value: getValue("totalTaxCredit"),
                isNumeric: true,
              },
            ]
          : []),
        ...(data.productHasBonus
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
        ...(data.enableNetting
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
        ...(data.endBalanceHufCurrent !== undefined
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
        ...(data.endBalanceEUR500 !== undefined
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
        ...(data.endBalanceEUR600 !== undefined
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

  const getSummaryEmailValues = () => {
    const getText = (key: RowKey) => String(getValue(key) ?? "")
    const getMoney = (key: RowKey) => formatValue(getValue(key) as number, true, "", undefined, data.displayCurrency)
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
      return typeof v === "number" ? formatValue(v, true, "", undefined, data.displayCurrency) : String(v)
    }
    const getPositiveMoneyOrBlank = (key: RowKey) => {
      const v = getValue(key)
      if (v === undefined || v === null || v === "") return ""
      if (typeof v === "number") {
        if (v <= 0) return ""
        return formatValue(v, true, "", undefined, data.displayCurrency)
      }
      const raw = String(v).trim()
      if (!raw || /^0([,.]0+)?(?:\s*(Ft|HUF|EUR|USD|€))?$/i.test(raw)) return ""
      return raw
    }
    const hasFxSourceValues =
      (typeof data.endBalanceHufCurrent === "number" && data.endBalanceHufCurrent > 0) ||
      (typeof data.endBalanceEUR500 === "number" && data.endBalanceEUR500 > 0) ||
      (typeof data.endBalanceEUR600 === "number" && data.endBalanceEUR600 > 0)
    const includeFxConversionRows = data.currency !== "HUF" && hasFxSourceValues

    return {
      accountName: getText("accountName"),
      accountGoal: getText("accountGoal"),
      monthlyPayment: getMoney("monthlyPayment"),
      yearlyPayment: getMoney("yearlyPayment"),
      years: formatValue(getValue("years") as number, false, " év", undefined, data.displayCurrency),
      totalContributions: getMoney("totalContributions"),
      strategy: getText("strategy"),
      annualYield: getText("annualYield"),
      totalReturn: getMoney("totalReturn"),
      totalTaxCredit: getPositiveMoneyOrBlank("totalTaxCredit"),
      endBalance: getMoney("endBalance"),
      totalBonus: data.productHasBonus ? getMoneyOrBlank("totalBonus") : "",
      finalNet: getMoney("endBalance"),
      endBalanceHufCurrent: includeFxConversionRows ? getMoneyWithCurrencyOrBlank("endBalanceHufCurrent", "HUF", "HUF") : "",
      endBalanceEUR500: includeFxConversionRows ? getMoneyWithCurrencyOrBlank("endBalanceEUR500", "HUF", "HUF") : "",
      endBalanceEUR600: includeFxConversionRows ? getMoneyWithCurrencyOrBlank("endBalanceEUR600", "HUF", "HUF") : "",
    }
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
    const templateCurrencyLabel = toTemplateCurrencyLabel(data.displayCurrency)
    const fixedAmounts = getFixedAmountValues(data.displayCurrency)
    const selectedTemplateIdValue = selectedTemplateId.trim()
    if (selectedTemplateIdValue) {
      const templateResponse = await fetch(`/api/email-templates/${encodeURIComponent(selectedTemplateIdValue)}`)
      const templateResult = await templateResponse.json().catch(() => ({}))
      if (!templateResponse.ok || !templateResult?.template) {
        throw new Error(
          typeof templateResult?.message === "string" && templateResult.message
            ? templateResult.message
            : "Nem sikerült betölteni a kiválasztott sablont.",
        )
      }

      const template = templateResult.template as StoredEmailTemplateDetails
      const tableMapping = template.mappings.find((mapping) => mapping.key === "calculator_table")
      const calculatorTableHtml = buildCalculatorTableHtmlFromTemplate(summaryValues, tableMapping?.sourceSnippet, {
        fxBaseColor,
      })
      const calculatorTablePlain = buildCalculatorTablePlain(summaryValues)
      const rendered = renderEmailTemplate({
        template: {
          htmlContent: template.htmlContent || "",
          textContent: template.textContent || "",
          mappings: template.mappings || [],
        },
        values: {
          name: safeName,
          amount: summaryValues.monthlyPayment,
          deadline: safeUntil,
          currency: templateCurrencyLabel,
          tone: emailTegezo ? "Kedves" : "Tisztelt",
          calculator_table: "{{calculator_table}}",
          fixed_small_amount: fixedAmounts.fixedSmallAmount,
          fixed_large_amount: fixedAmounts.fixedLargeAmount,
          retirement_section: "{{retirement_section}}",
          bonus_section: "{{bonus_section}}",
        },
        calculatorTableHtml,
        calculatorTablePlain,
        accountGoalPhrase: summaryValues.accountGoal,
        isAllianzEletprogram: data.selectedProduct === "allianz_eletprogram",
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
      html,
      plain: [plain, "", `Megnyitás: ${window.location.origin}/osszesites`].join("\n"),
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

                const safeName = (emailClientName || "Ügyfél").trim()
                const safeUntil = (emailOfferUntil || "").trim()
                const { html, plain } = await buildOutlookEmail(safeName, safeUntil)

                try {
                  const ok = await copyHtmlToClipboard(html, plain)
                  setEmailCopyStatus(ok ? "copied" : "failed")
                } catch {
                  setEmailCopyStatus("failed")
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
                      subject,
                      values: emailValues,
                      templateId: selectedTemplateId || undefined,
                      selectedProduct: data.selectedProduct || undefined,
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

            <div className={MOBILE_SUMMARY_LAYOUT.helperText}>
              Mobilon a `mailto:` gyakran csak sima szöveget támogat. Nyomd meg a{" "}
              <span className="font-medium">Formázott sablon másolása</span> gombot, majd az Outlook levélbe illeszd be.
            </div>
            {emailSendError ? <div className={`${MOBILE_SUMMARY_LAYOUT.helperText} text-red-600`}>{emailSendError}</div> : null}

            <div className="min-[560px]:col-span-2 lg:col-span-12 rounded-md border p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium">E-mail sablon feltöltés (HTML/TXT/EML)</div>
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
                    id="templateSelect"
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                    value={selectedTemplateId}
                    onChange={(e) => {
                      setSelectedTemplateId(e.target.value)
                      setIsTemplateUploaderOpen(true)
                    }}
                  >
                    <option value="">Beépített sablon (jelenlegi)</option>
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

                <div className="grid gap-1 lg:col-span-6">
                  <Label className="text-xs text-muted-foreground" htmlFor="templateFile">
                    Sablon fájl
                  </Label>
                  <Input
                    id="templateFile"
                    type="file"
                    accept=".html,.htm,.txt,.eml,text/html,text/plain,message/rfc822"
                    onChange={async (event) => {
                      const file = event.target.files?.[0]
                      if (!file) return
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
                      setTemplateSourceType(sourceType)
                      setTemplateOriginalFileName(file.name)
                      setTemplateRawContent(content)
                      if (!templateName.trim()) {
                        setTemplateName(file.name.replace(/\.[^.]+$/, ""))
                      }
                      await parseTemplateContentOnServer(sourceType, content)
                    }}
                  />
                </div>
                <div className="flex items-end gap-2 lg:col-span-6">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => void parseTemplateContentOnServer(templateSourceType, templateRawContent)}
                    disabled={!templateRawContent.trim() || templateStatus === "loading"}
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Auto-felismerés frissítése
                  </Button>
                  <Button type="button" onClick={() => void saveTemplate()} disabled={templateStatus === "saving"}>
                    <Save className="w-4 h-4 mr-2" />
                    {templateStatus === "saving" ? "Mentés..." : "Sablon mentése"}
                  </Button>
                </div>
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
                  {templateRenderedPreviewHtml ? (
                    <div className="grid gap-2">
                      <Label className="text-xs text-muted-foreground">
                        Kitöltött HTML előnézet (név, dátum, pénznem, hangnem, táblázat behelyettesítve)
                      </Label>
                      <div
                        className="w-full min-h-56 rounded border bg-white px-3 py-2 text-sm overflow-auto max-h-[460px]"
                        dangerouslySetInnerHTML={{ __html: templateRenderedPreviewHtml }}
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
                  <div className="text-xs text-muted-foreground">
                    A beépített eredeti sablon megmarad alapértelmezettnek; új sablon mentése nem írja felül.
                  </div>
                  {templateError ? <div className="text-xs text-red-600">{templateError}</div> : null}
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mb-2 flex items-center justify-end gap-2">
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
        {isExcelView ? (
          <Card>
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
        <div className="mt-3">
          <ColumnHoverInfoPanel activeKey={activeColumnInfoKey} productKey={summaryPanelProductKey} />
        </div>
      </div>
    </div>
  )
}
