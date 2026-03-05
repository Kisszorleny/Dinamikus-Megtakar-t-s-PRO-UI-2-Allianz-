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
}

export type EmailTemplateUpdatePayload = Partial<EmailTemplateCreatePayload> & {
  id?: string
}

export type ParsedTemplateCandidate = TemplateDocument & {
  suggestedMappings: TemplateFieldMapping[]
}
