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
