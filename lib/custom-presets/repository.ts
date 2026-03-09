import { randomUUID } from "node:crypto"
import { createSupabaseAdminClient } from "@/lib/supabase/server"
import type {
  CustomPreset,
  CustomPresetEntry,
  CustomPresetCreatePayload,
  CustomPresetUpdatePayload,
} from "@/lib/custom-presets/types"

type AuthContext = {
  userId: string
  isAdmin: boolean
}

type CustomPresetRow = {
  id: string
  name: string
  owner_id: string
  owner_role: "admin" | "user"
  product_scope: string | null
  entries: unknown
  created_at: string
  updated_at: string
}

function canReadPreset(preset: CustomPreset, auth: AuthContext): boolean {
  return preset.ownerId === auth.userId
}

function canWritePreset(preset: CustomPreset, auth: AuthContext): boolean {
  return preset.ownerId === auth.userId
}

function mapRowToPreset(row: CustomPresetRow): CustomPreset {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    ownerRole: row.owner_role,
    productScope: row.product_scope,
    entries: (Array.isArray(row.entries) ? row.entries : []) as CustomPresetEntry[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function normalizePayload(payload: CustomPresetCreatePayload | CustomPresetUpdatePayload) {
  const cleanName = typeof payload.name === "string" ? payload.name.trim() : undefined
  const productScope =
    payload.productScope === undefined ? undefined : payload.productScope === null ? null : String(payload.productScope)
  const entries = Array.isArray(payload.entries)
    ? payload.entries
        .filter(Boolean)
        .map((entry) => ({
          ...entry,
          label: String(entry.label ?? "").trim(),
          value: Number(entry.value ?? 0),
          valueByYear:
            entry.valueByYear && typeof entry.valueByYear === "object"
              ? Object.fromEntries(
                  Object.entries(entry.valueByYear)
                    .map(([year, value]) => [Number(year), Number(value)])
                    .filter(([year, value]) => Number.isFinite(year) && Number.isFinite(value)),
                )
              : {},
          startYear: entry.startYear ? Math.max(1, Number(entry.startYear)) : undefined,
          stopYear: entry.stopYear ? Math.max(0, Number(entry.stopYear)) : undefined,
          dayOfMonth:
            entry.dayOfMonth != null && entry.dayOfMonth >= 1 && entry.dayOfMonth <= 31
              ? Math.round(entry.dayOfMonth)
              : undefined,
          month:
            entry.month != null && entry.month >= 1 && entry.month <= 12 ? Math.round(entry.month) : undefined,
          baseMode:
            entry.baseMode === "contribution" ||
            entry.baseMode === "asset" ||
            entry.baseMode === "costRefundAll" ||
            entry.baseMode === "costRefundCustom"
              ? entry.baseMode
              : undefined,
        }))
    : undefined
  return { cleanName, productScope, entries }
}

export async function listCustomPresets(auth: AuthContext, productScope?: string | null): Promise<CustomPreset[]> {
  const supabase = createSupabaseAdminClient()
  let query = supabase.from("custom_presets").select("*").eq("owner_id", auth.userId).order("updated_at", { ascending: false })

  if (productScope !== undefined) {
    if (productScope === null) query = query.is("product_scope", null)
    else query = query.eq("product_scope", productScope)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return (data ?? [])
    .map((row) => mapRowToPreset(row as CustomPresetRow))
    .filter((preset) => canReadPreset(preset, auth))
    .filter((preset) => {
      if (productScope === undefined) return true
      if (productScope === null) return preset.productScope === null
      return preset.productScope === productScope
    })
}

export async function createCustomPreset(auth: AuthContext, payload: CustomPresetCreatePayload): Promise<CustomPreset> {
  const { cleanName, productScope, entries } = normalizePayload(payload)
  if (!cleanName) {
    throw new Error("A sablon neve kötelező.")
  }
  if (!entries || entries.length === 0) {
    throw new Error("Legalább egy egyedi költség vagy bónusz szükséges.")
  }

  const preset: CustomPreset = {
    id: randomUUID(),
    name: cleanName,
    ownerId: auth.userId,
    ownerRole: auth.isAdmin ? "admin" : "user",
    productScope: productScope === undefined ? null : productScope,
    entries,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const supabase = createSupabaseAdminClient()
  const insert = {
    id: preset.id,
    name: preset.name,
    owner_id: preset.ownerId,
    owner_role: preset.ownerRole,
    product_scope: preset.productScope,
    entries: preset.entries,
  }
  const { data, error } = await supabase.from("custom_presets").insert(insert).select("*").single()
  if (error || !data) throw new Error(error?.message ?? "Mentési hiba.")
  return mapRowToPreset(data as CustomPresetRow)
}

export async function updateCustomPreset(
  auth: AuthContext,
  id: string,
  payload: CustomPresetUpdatePayload,
): Promise<CustomPreset> {
  const supabase = createSupabaseAdminClient()
  const { data: existingRow, error: existingError } = await supabase
    .from("custom_presets")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (existingError) throw new Error(existingError.message)
  const existing = existingRow ? mapRowToPreset(existingRow as CustomPresetRow) : null
  if (!existing) throw new Error("A sablon nem található.")
  if (!canWritePreset(existing, auth)) throw new Error("Nincs jogosultság a sablon módosításához.")

  const { cleanName, productScope, entries } = normalizePayload(payload)
  const updateData = {
    ...(cleanName !== undefined ? { name: cleanName } : {}),
    ...(productScope !== undefined ? { product_scope: productScope } : {}),
    ...(entries !== undefined ? { entries } : {}),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from("custom_presets")
    .update(updateData)
    .eq("id", id)
    .eq("owner_id", auth.userId)
    .select("*")
    .single()
  if (error || !data) throw new Error(error?.message ?? "Mentési hiba.")
  return mapRowToPreset(data as CustomPresetRow)
}

export async function deleteCustomPreset(auth: AuthContext, id: string): Promise<void> {
  const supabase = createSupabaseAdminClient()
  const { data: existingRow, error: existingError } = await supabase
    .from("custom_presets")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (existingError) throw new Error(existingError.message)
  const existing = existingRow ? mapRowToPreset(existingRow as CustomPresetRow) : null
  if (!existing) throw new Error("A sablon nem található.")
  if (!canWritePreset(existing, auth)) throw new Error("Nincs jogosultság a sablon törléséhez.")

  const { error } = await supabase.from("custom_presets").delete().eq("id", id).eq("owner_id", auth.userId)
  if (error) throw new Error(error.message)
}
