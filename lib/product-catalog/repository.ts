import { createSupabaseAdminClient } from "@/lib/supabase/server"
import type {
  ProductCatalogCreatePayload,
  ProductCatalogUpdatePayload,
  ProductCodeStatus,
} from "@/lib/product-catalog/schema"

export type ProductCatalogRecord = {
  id: string
  insurer: string
  product_name: string
  product_value: string
  variant_value: string | null
  product_type: string
  mnb_code: string
  product_code: string | null
  product_code_status: ProductCodeStatus
  source_ref: string | null
  version: number
  is_active: boolean
  valid_from: string
  valid_to: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  metadata: Record<string, unknown>
}

type ProductCatalogInsert = {
  insurer: string
  product_name: string
  product_value: string
  variant_value: string | null
  product_type: string
  mnb_code: string
  product_code: string | null
  product_code_status: ProductCodeStatus
  source_ref: string | null
  version: number
  is_active: boolean
  valid_from?: string
  valid_to?: string | null
  created_by: string | null
  updated_by: string | null
  metadata: Record<string, unknown>
}

type ProductCatalogUpdate = Partial<{
  product_name: string
  product_type: string
  mnb_code: string
  product_code: string | null
  product_code_status: ProductCodeStatus
  source_ref: string | null
  is_active: boolean
  valid_from: string
  valid_to: string | null
  updated_by: string | null
  metadata: Record<string, unknown>
}>

type ListOptions = {
  insurer?: string
  productValue?: string
  includeInactive?: boolean
}

function normalizeProductCode(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function listProductCatalog(options: ListOptions = {}): Promise<ProductCatalogRecord[]> {
  const supabase = createSupabaseAdminClient()
  let query = supabase.from("product_catalog").select("*").order("insurer").order("product_value").order("version", {
    ascending: false,
  })

  if (!options.includeInactive) query = query.eq("is_active", true)
  if (options.insurer) query = query.eq("insurer", options.insurer)
  if (options.productValue) query = query.eq("product_value", options.productValue)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as ProductCatalogRecord[]
}

export async function getLatestActiveByProductValue(
  insurer: string,
  productValue: string,
  variantValue?: string | null,
): Promise<ProductCatalogRecord | null> {
  const supabase = createSupabaseAdminClient()
  let query = supabase
    .from("product_catalog")
    .select("*")
    .eq("insurer", insurer)
    .eq("product_value", productValue)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)

  if (variantValue) {
    query = query.eq("variant_value", variantValue)
  } else {
    query = query.is("variant_value", null)
  }

  const { data, error } = await query.maybeSingle()
  if (error) throw new Error(error.message)
  return (data as ProductCatalogRecord | null) ?? null
}

export async function createProductVersion(payload: ProductCatalogCreatePayload): Promise<ProductCatalogRecord> {
  const supabase = createSupabaseAdminClient()
  const normalizedVariant = payload.variantValue?.trim() || null

  let latestQuery = supabase
    .from("product_catalog")
    .select("version")
    .eq("insurer", payload.insurer)
    .eq("product_value", payload.productValue)
    .order("version", { ascending: false })
    .limit(1)

  if (normalizedVariant) latestQuery = latestQuery.eq("variant_value", normalizedVariant)
  else latestQuery = latestQuery.is("variant_value", null)

  const { data: latestRows, error: latestError } = await latestQuery
  if (latestError) throw new Error(latestError.message)

  const nextVersion = ((latestRows?.[0]?.version as number | undefined) ?? 0) + 1
  const normalizedCode = normalizeProductCode(payload.productCode)

  const insert: ProductCatalogInsert = {
    insurer: payload.insurer,
    product_name: payload.productName,
    product_value: payload.productValue,
    variant_value: normalizedVariant,
    product_type: payload.productType,
    mnb_code: payload.mnbCode,
    product_code: normalizedCode,
    product_code_status: payload.productCodeStatus,
    source_ref: payload.sourceRef ?? null,
    version: nextVersion,
    is_active: true,
    valid_from: payload.validFrom,
    valid_to: payload.validTo,
    created_by: payload.createdBy ?? null,
    updated_by: payload.createdBy ?? null,
    metadata: payload.metadata ?? {},
  }

  const { data, error } = await supabase.from("product_catalog").insert(insert).select("*").single()
  if (error || !data) throw new Error(error?.message ?? "Nem sikerült létrehozni a termékverziót.")

  if (payload.changeReason?.trim()) {
    await supabase
      .from("product_catalog_audit")
      .update({ change_reason: payload.changeReason.trim() })
      .eq("product_catalog_id", data.id)
      .eq("action", "insert")
      .is("change_reason", null)
  }

  return data as ProductCatalogRecord
}

export async function updateProductVersion(id: string, payload: ProductCatalogUpdatePayload): Promise<ProductCatalogRecord> {
  const supabase = createSupabaseAdminClient()

  const normalizedCode =
    payload.productCode === undefined ? undefined : normalizeProductCode(payload.productCode ?? null)
  const updateData: ProductCatalogUpdate = {
    ...(payload.productName !== undefined ? { product_name: payload.productName } : {}),
    ...(payload.productType !== undefined ? { product_type: payload.productType } : {}),
    ...(payload.mnbCode !== undefined ? { mnb_code: payload.mnbCode } : {}),
    ...(payload.productCodeStatus !== undefined ? { product_code_status: payload.productCodeStatus } : {}),
    ...(normalizedCode !== undefined ? { product_code: normalizedCode } : {}),
    ...(payload.sourceRef !== undefined ? { source_ref: payload.sourceRef ?? null } : {}),
    ...(payload.isActive !== undefined ? { is_active: payload.isActive } : {}),
    ...(payload.validFrom !== undefined ? { valid_from: payload.validFrom } : {}),
    ...(payload.validTo !== undefined ? { valid_to: payload.validTo ?? null } : {}),
    ...(payload.updatedBy !== undefined ? { updated_by: payload.updatedBy ?? null } : {}),
    ...(payload.metadata !== undefined ? { metadata: payload.metadata } : {}),
  }

  const { data, error } = await supabase.from("product_catalog").update(updateData).eq("id", id).select("*").single()

  if (error || !data) throw new Error(error?.message ?? "Nem sikerült frissíteni a termékverziót.")

  if (payload.changeReason?.trim()) {
    await supabase
      .from("product_catalog_audit")
      .update({ change_reason: payload.changeReason.trim() })
      .eq("product_catalog_id", id)
      .eq("action", "update")
      .is("change_reason", null)
  }

  return data as ProductCatalogRecord
}
