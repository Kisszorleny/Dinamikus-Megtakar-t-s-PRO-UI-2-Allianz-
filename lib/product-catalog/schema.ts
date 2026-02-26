import { z } from "zod"

const productCodeStatusSchema = z.enum(["confirmed", "unknown"])

const mnbCodeSchema = z.string().trim().min(1, "Az MNB kód kötelező.")

const placeholderProductCodePattern = /^(todo|unknown|n\/a|null|na|-|placeholder)$/i
const productCodeSchema = z
  .string()
  .trim()
  .min(1, "A termékkód nem lehet üres.")
  .refine((value) => !placeholderProductCodePattern.test(value), {
    message: "A termékkód nem lehet placeholder érték.",
  })

const sourceRefSchema = z.string().trim().max(500).optional()

export const productCatalogCreateSchema = z
  .object({
    insurer: z.string().trim().min(1, "A biztosító kötelező."),
    productName: z.string().trim().min(1, "A terméknév kötelező."),
    productValue: z.string().trim().min(1, "A productValue kötelező."),
    variantValue: z.string().trim().min(1).optional().nullable(),
    productType: z.string().trim().min(1, "A terméktípus kötelező."),
    mnbCode: mnbCodeSchema,
    productCodeStatus: productCodeStatusSchema.default("unknown"),
    productCode: productCodeSchema.optional().nullable(),
    sourceRef: sourceRefSchema,
    createdBy: z.string().trim().optional(),
    changeReason: z.string().trim().optional(),
    metadata: z.record(z.unknown()).optional(),
    validFrom: z.string().datetime().optional(),
    validTo: z.string().datetime().optional().nullable(),
  })
  .superRefine((value, ctx) => {
    const hasProductCode = typeof value.productCode === "string" && value.productCode.trim().length > 0
    if (value.productCodeStatus === "confirmed" && !hasProductCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Megerősített státusznál kötelező a termékkód.",
        path: ["productCode"],
      })
    }
  })

export const productCatalogUpdateSchema = z
  .object({
    productName: z.string().trim().min(1).optional(),
    productType: z.string().trim().min(1).optional(),
    mnbCode: mnbCodeSchema.optional(),
    productCodeStatus: productCodeStatusSchema.optional(),
    productCode: productCodeSchema.optional().nullable(),
    sourceRef: sourceRefSchema,
    isActive: z.boolean().optional(),
    updatedBy: z.string().trim().optional(),
    changeReason: z.string().trim().optional(),
    metadata: z.record(z.unknown()).optional(),
    validFrom: z.string().datetime().optional(),
    validTo: z.string().datetime().optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.productCodeStatus === "confirmed" && !value.productCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Megerősített státusznál kötelező a termékkód.",
        path: ["productCode"],
      })
    }
  })

export const productCatalogListQuerySchema = z.object({
  insurer: z.string().trim().optional(),
  includeInactive: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((value) => value === "true"),
  productValue: z.string().trim().optional(),
})

export type ProductCodeStatus = z.infer<typeof productCodeStatusSchema>
export type ProductCatalogCreatePayload = z.infer<typeof productCatalogCreateSchema>
export type ProductCatalogUpdatePayload = z.infer<typeof productCatalogUpdateSchema>
