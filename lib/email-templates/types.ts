export type EmailTemplateFieldKey =
  | "name"
  | "amount"
  | "deadline"
  | "currency"
  | "tone"
  | "calculator_table"
  | "fixed_small_amount"
  | "fixed_large_amount"
  | "retirement_section"
  | "bonus_section"

export type EmailTemplateSourceType = "html" | "text" | "eml"

export type ToneConversionTarget = "tegezo"
export type ToneConversionStatus = "none" | "pending_review" | "approved" | "rejected"
export type ToneConversionMode = "ai_full" | "builtin"
export type ToneConversionLlmStatus =
  | "llm_full"
  | "llm_partial_fallback"
  | "builtin_fallback"
  | "llm_unavailable_fallback"

export type TemplateDocument = {
  sourceType: EmailTemplateSourceType
  rawContent: string
  subject?: string
  htmlContent: string
  textContent: string
}

export type TemplateFieldMapping = {
  key: EmailTemplateFieldKey
  label: string
  token: string
  sourceSnippet?: string
  confidence?: number
}

export type TemplateVariantTone = "magazo" | "tegezo"
export type TemplateVariantProduct = "allianz_eletprogram" | "allianz_bonusz_eletprogram"
export type TemplateVariantCurrency = "HUF" | "EUR"
export type TemplateVariantGoal = "tokenoveles" | "nyugdij"

export type TemplateVariantItem = {
  id: string
  name: string
  tone: TemplateVariantTone
  product: TemplateVariantProduct
  currency: TemplateVariantCurrency
  goal: TemplateVariantGoal
  emlFileName: string
  htmlFileName: string
  subject: string
  htmlContent: string
  plainContent: string
  emlContent: string
}

export type TemplateVariantBundle = {
  templateId: string
  variants: TemplateVariantItem[]
  updatedAt: string
}

export type ToneConversionPayload = {
  status: ToneConversionStatus
  targetTone?: ToneConversionTarget
  convertedSubject?: string
  convertedHtmlContent?: string
  convertedTextContent?: string
  notes?: string
}

export type TemplateToneConversionSuggestion = {
  status: "pending_review"
  targetTone: ToneConversionTarget
  modeUsed: ToneConversionMode
  llmStatus: ToneConversionLlmStatus
  modelUsed?: string
  detectedFormal: boolean
  detectedFormalScore: number
  convertedSubject?: string
  convertedHtmlContent?: string
  convertedTextContent?: string
  notes: string[]
}

export type EmailTemplate = {
  id: string
  name: string
  ownerId: string
  ownerRole: "admin" | "user"
  sourceType: EmailTemplateSourceType
  originalFileName?: string
  subject?: string
  rawContent: string
  htmlContent: string
  textContent: string
  mappings: TemplateFieldMapping[]
  conversionStatus: ToneConversionStatus
  conversionTargetTone?: ToneConversionTarget
  convertedSubject?: string
  convertedHtmlContent?: string
  convertedTextContent?: string
  conversionNotes?: string
  variantBundle?: TemplateVariantBundle
  createdAt: string
  updatedAt: string
}

export type EmailTemplateCreatePayload = {
  name: string
  sourceType: EmailTemplateSourceType
  originalFileName?: string
  rawContent: string
  subject?: string
  htmlContent?: string
  textContent?: string
  mappings: TemplateFieldMapping[]
  conversion?: ToneConversionPayload
}

export type EmailTemplateUpdatePayload = Partial<EmailTemplateCreatePayload> & {
  id?: string
}

export type ParsedTemplateCandidate = TemplateDocument & {
  suggestedMappings: TemplateFieldMapping[]
  conversionSuggestion?: TemplateToneConversionSuggestion
}
