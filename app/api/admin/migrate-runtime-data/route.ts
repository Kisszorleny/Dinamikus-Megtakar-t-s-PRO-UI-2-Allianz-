import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "node:fs"
import path from "node:path"
import { getSessionUser } from "@/lib/auth-session"
import { createSupabaseAdminClient } from "@/lib/supabase/server"

type LegacyEmailTemplate = {
  id?: unknown
  name?: unknown
  ownerId?: unknown
  ownerRole?: unknown
  sourceType?: unknown
  originalFileName?: unknown
  subject?: unknown
  rawContent?: unknown
  htmlContent?: unknown
  textContent?: unknown
  mappings?: unknown
  createdAt?: unknown
  updatedAt?: unknown
}

type LegacyPreset = {
  id?: unknown
  name?: unknown
  ownerId?: unknown
  ownerRole?: unknown
  productScope?: unknown
  entries?: unknown
  createdAt?: unknown
  updatedAt?: unknown
}

function asIsoOrNow(value: unknown): string {
  if (typeof value !== "string") return new Date().toISOString()
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : new Date().toISOString()
}

function asNonEmptyString(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback
  const trimmed = value.trim()
  return trimmed || fallback
}

function asRole(value: unknown): "admin" | "user" {
  return value === "admin" ? "admin" : "user"
}

function asSourceType(value: unknown): "html" | "text" | "eml" {
  if (value === "html" || value === "text" || value === "eml") return value
  return "html"
}

async function readJsonFile<T>(absolutePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(absolutePath, "utf8")
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const session = getSessionUser(request)
  if (!session || !session.isAdmin) {
    return NextResponse.json({ ok: false, message: "Nincs jogosultság." }, { status: 401 })
  }

  const runtimeDir = path.join(process.cwd(), ".runtime-data")
  const templatesPath = path.join(runtimeDir, "email-templates.json")
  const presetsPath = path.join(runtimeDir, "custom-presets.json")

  const [legacyTemplatesRaw, legacyPresetsRaw] = await Promise.all([
    readJsonFile<{ templates?: unknown }>(templatesPath),
    readJsonFile<{ presets?: unknown }>(presetsPath),
  ])

  const legacyTemplates = Array.isArray(legacyTemplatesRaw?.templates)
    ? (legacyTemplatesRaw.templates as LegacyEmailTemplate[])
    : []
  const legacyPresets = Array.isArray(legacyPresetsRaw?.presets) ? (legacyPresetsRaw.presets as LegacyPreset[]) : []

  const supabase = createSupabaseAdminClient()

  let migratedTemplates = 0
  if (legacyTemplates.length > 0) {
    const rows = legacyTemplates
      .filter((item) => typeof item?.id === "string")
      .map((item) => ({
        id: String(item.id),
        name: asNonEmptyString(item.name, "Migrált sablon"),
        owner_id: asNonEmptyString(item.ownerId, session.userId),
        owner_role: asRole(item.ownerRole),
        source_type: asSourceType(item.sourceType),
        original_file_name: typeof item.originalFileName === "string" ? item.originalFileName : null,
        subject: typeof item.subject === "string" ? item.subject : null,
        raw_content: asNonEmptyString(item.rawContent, ""),
        html_content: typeof item.htmlContent === "string" ? item.htmlContent : "",
        text_content: typeof item.textContent === "string" ? item.textContent : "",
        mappings: Array.isArray(item.mappings) ? item.mappings : [],
        created_at: asIsoOrNow(item.createdAt),
        updated_at: asIsoOrNow(item.updatedAt),
      }))
      .filter((row) => row.raw_content.length > 0)

    if (rows.length > 0) {
      const { error } = await supabase.from("email_templates").upsert(rows, { onConflict: "id" })
      if (error) {
        return NextResponse.json(
          { ok: false, message: `Email template migrációs hiba: ${error.message}` },
          { status: 500 },
        )
      }
      migratedTemplates = rows.length
    }
  }

  let migratedPresets = 0
  if (legacyPresets.length > 0) {
    const rows = legacyPresets
      .filter((item) => typeof item?.id === "string")
      .map((item) => ({
        id: String(item.id),
        name: asNonEmptyString(item.name, "Migrált preset"),
        owner_id: asNonEmptyString(item.ownerId, session.userId),
        owner_role: asRole(item.ownerRole),
        product_scope: item.productScope === null ? null : typeof item.productScope === "string" ? item.productScope : null,
        entries: Array.isArray(item.entries) ? item.entries : [],
        created_at: asIsoOrNow(item.createdAt),
        updated_at: asIsoOrNow(item.updatedAt),
      }))

    if (rows.length > 0) {
      const { error } = await supabase.from("custom_presets").upsert(rows, { onConflict: "id" })
      if (error) {
        return NextResponse.json(
          { ok: false, message: `Custom preset migrációs hiba: ${error.message}` },
          { status: 500 },
        )
      }
      migratedPresets = rows.length
    }
  }

  return NextResponse.json({
    ok: true,
    migratedTemplates,
    migratedPresets,
    templateSourceFound: legacyTemplates.length > 0,
    presetSourceFound: legacyPresets.length > 0,
  })
}
