import { z } from "zod"

const requestTypeSchema = z.enum(["A", "B", "C"])
const durationUnitSchema = z.enum(["year", "month", "day"])
const paymentFrequencySchema = z.enum(["havi", "negyedéves", "féléves", "éves"])
const currencySchema = z.enum(["HUF", "EUR", "USD"])

const contactSchema = z.object({
  name: z.string().trim().min(2, "A név megadása kötelező."),
  email: z.string().trim().email("Érvényes email cím szükséges."),
  phone: z.string().trim().min(8, "Érvényes telefonszám szükséges."),
})

const calcSummarySchema = z
  .object({
    insurer: z.string().optional(),
    product: z.string().optional(),
    durationUnit: durationUnitSchema.optional(),
    durationValue: z.number().optional(),
    frequency: paymentFrequencySchema.optional(),
    regularPayment: z.number().optional(),
    totalContributions: z.number().optional(),
    estimatedEndBalance: z.number().optional(),
    totalTaxCredit: z.number().optional(),
    currency: currencySchema.optional(),
  })
  .partial()

export const leadPayloadSchema = z.object({
  source: z.string().trim().min(1).default("landing_popup"),
  requestType: requestTypeSchema,
  contact: contactSchema,
  formPayload: z.record(z.unknown()).default({}),
  calcSnapshot: z.record(z.unknown()).default({}),
  calcSummary: calcSummarySchema.default({}),
})

export type LeadPayload = z.infer<typeof leadPayloadSchema>
export type RequestType = z.infer<typeof requestTypeSchema>

export const leadSourceTypeSchema = z.enum(["landing_form", "manual_import", "sheets", "app_edit"])

export const manualLeadUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  sourceType: leadSourceTypeSchema.default("manual_import"),
  source: z.string().trim().min(1).default("manual_upload"),
  requestType: requestTypeSchema.default("A"),
  contactName: z.string().trim().min(1, "A név kötelező."),
  contactEmail: z.string().trim().email("Érvényes e-mail cím szükséges."),
  contactPhone: z.string().trim().min(1, "Telefonszám kötelező."),
  birthDate: z.string().optional().nullable(),
  ageText: z.string().optional().nullable(),
  callTime: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  costFlag: z.boolean().default(false),
  tax20Flag: z.boolean().default(false),
  netFlag: z.boolean().default(false),
  savingsAmountText: z.string().optional().nullable(),
  goalText: z.string().optional().nullable(),
  durationText: z.string().optional().nullable(),
  deadlineDate: z.string().optional().nullable(),
  deadlineReason: z.string().optional().nullable(),
  owner: z.string().optional().nullable(),
  paidFlag: z.boolean().default(false),
  leadTypeText: z.string().optional().nullable(),
  clientNumber: z.string().optional().nullable(),
  calendarLink: z.string().optional().nullable(),
  helpNeeded: z.string().optional().nullable(),
  leadsPerDay: z.number().int().optional().nullable(),
  dayText: z.string().optional().nullable(),
  timeText: z.string().optional().nullable(),
  followupNote: z.string().optional().nullable(),
  reportText: z.string().optional().nullable(),
  revisitText: z.string().optional().nullable(),
  sheetRowId: z.string().optional().nullable(),
  formPayload: z.record(z.unknown()).default({}),
  calcSnapshot: z.record(z.unknown()).default({}),
  calcSummary: z.record(z.unknown()).default({}),
})

export const manualLeadImportSchema = z.object({
  leads: z.array(manualLeadUpsertSchema).min(1, "Legalább egy lead szükséges."),
  previewOnly: z.boolean().default(false),
})

export const leadUpdateSchema = manualLeadUpsertSchema.partial().extend({
  id: z.string().uuid(),
})

export type ManualLeadUpsert = z.infer<typeof manualLeadUpsertSchema>
export type ManualLeadImportPayload = z.infer<typeof manualLeadImportSchema>
