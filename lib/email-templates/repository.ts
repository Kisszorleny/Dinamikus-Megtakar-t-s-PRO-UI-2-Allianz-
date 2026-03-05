import { promises as fs } from "node:fs"
import os from "node:os"
import path from "node:path"
import { randomUUID } from "node:crypto"
import type {
  EmailTemplate,
  EmailTemplateCreatePayload,
  EmailTemplateUpdatePayload,
  TemplateFieldMapping,
} from "@/lib/email-templates/types"

type RepositoryState = {
  templates: EmailTemplate[]
}

type AuthContext = {
  userId: string
  isAdmin: boolean
}

const PRIMARY_STORAGE_DIR = path.join(process.cwd(), ".runtime-data")
const PRIMARY_STORAGE_FILE = path.join(PRIMARY_STORAGE_DIR, "email-templates.json")
const FALLBACK_STORAGE_DIR = path.join(os.tmpdir(), "dm-pro-ui-runtime-data")
const FALLBACK_STORAGE_FILE = path.join(FALLBACK_STORAGE_DIR, "email-templates.json")

let inMemoryCache: RepositoryState | null = null

async function readState(): Promise<RepositoryState> {
  if (inMemoryCache) return inMemoryCache
  for (const storageFile of [PRIMARY_STORAGE_FILE, FALLBACK_STORAGE_FILE]) {
    try {
      const raw = await fs.readFile(storageFile, "utf8")
      const parsed = JSON.parse(raw) as RepositoryState
      inMemoryCache = { templates: Array.isArray(parsed?.templates) ? parsed.templates : [] }
      return inMemoryCache
    } catch {
      // try next location
    }
  }
  inMemoryCache = { templates: [] }
  return inMemoryCache
}

async function writeState(next: RepositoryState): Promise<void> {
  inMemoryCache = next
  try {
    await fs.mkdir(PRIMARY_STORAGE_DIR, { recursive: true })
    await fs.writeFile(PRIMARY_STORAGE_FILE, JSON.stringify(next, null, 2), "utf8")
    return
  } catch {
    // In serverless environments (e.g. /var/task) fallback to temp storage.
  }
  await fs.mkdir(FALLBACK_STORAGE_DIR, { recursive: true })
  await fs.writeFile(FALLBACK_STORAGE_FILE, JSON.stringify(next, null, 2), "utf8")
}

function canReadTemplate(template: EmailTemplate, auth: AuthContext): boolean {
  return auth.isAdmin || template.ownerId === auth.userId
}

function canWriteTemplate(template: EmailTemplate, auth: AuthContext): boolean {
  return template.ownerId === auth.userId
}

function normalizeMappings(input: unknown): TemplateFieldMapping[] {
  if (!Array.isArray(input)) return []
  const seen = new Set<string>()
  const normalized: TemplateFieldMapping[] = []
  for (const entry of input) {
    if (!entry || typeof entry !== "object") continue
    const candidate = entry as Record<string, unknown>
    const key = String(candidate.key ?? "").trim() as TemplateFieldMapping["key"]
    if (
      key !== "name" &&
      key !== "amount" &&
      key !== "deadline" &&
      key !== "currency" &&
      key !== "tone" &&
      key !== "calculator_table" &&
      key !== "fixed_small_amount" &&
      key !== "fixed_large_amount" &&
      key !== "retirement_section" &&
      key !== "bonus_section"
    )
      continue
    if (seen.has(key)) continue
    const tokenRaw = String(candidate.token ?? "").trim()
    const token = tokenRaw || `{{${key}}}`
    const labelRaw = String(candidate.label ?? "").trim()
    const label =
      labelRaw ||
      (key === "name"
        ? "Név"
        : key === "amount"
          ? "Összeg"
          : key === "deadline"
            ? "Határidő"
            : key === "currency"
              ? "Pénznem"
              : key === "tone"
                ? "Hangnem"
                : key === "calculator_table"
                  ? "Kalkulátor táblázat"
                  : key === "fixed_small_amount"
                    ? "Fix kis összeg"
                    : key === "fixed_large_amount"
                      ? "Fix nagy összeg"
                      : key === "retirement_section"
                        ? "Nyugdíj szekció"
                        : "Bónusz szekció")
    const sourceSnippet = String(candidate.sourceSnippet ?? "").trim() || undefined
    const confidence = Number(candidate.confidence)
    normalized.push({
      key,
      token,
      label,
      sourceSnippet,
      confidence: Number.isFinite(confidence) ? confidence : undefined,
    })
    seen.add(key)
  }
  return normalized
}

function normalizePayload(payload: EmailTemplateCreatePayload | EmailTemplateUpdatePayload) {
  const name = typeof payload.name === "string" ? payload.name.trim() : undefined
  const sourceType =
    payload.sourceType === "html" || payload.sourceType === "text" || payload.sourceType === "eml"
      ? payload.sourceType
      : undefined
  const originalFileName = typeof payload.originalFileName === "string" ? payload.originalFileName.trim() || undefined : undefined
  const subject = typeof payload.subject === "string" ? payload.subject.trim() || undefined : undefined
  const rawContent = typeof payload.rawContent === "string" ? payload.rawContent : undefined
  const htmlContent = typeof payload.htmlContent === "string" ? payload.htmlContent : undefined
  const textContent = typeof payload.textContent === "string" ? payload.textContent : undefined
  const mappings = payload.mappings === undefined ? undefined : normalizeMappings(payload.mappings)

  return { name, sourceType, originalFileName, subject, rawContent, htmlContent, textContent, mappings }
}

export async function listEmailTemplates(auth: AuthContext): Promise<EmailTemplate[]> {
  const state = await readState()
  return state.templates.filter((template) => canReadTemplate(template, auth)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getEmailTemplateById(auth: AuthContext, id: string): Promise<EmailTemplate | null> {
  const state = await readState()
  const template = state.templates.find((item) => item.id === id)
  if (!template) return null
  if (!canReadTemplate(template, auth)) return null
  return template
}

export async function createEmailTemplate(auth: AuthContext, payload: EmailTemplateCreatePayload): Promise<EmailTemplate> {
  const normalized = normalizePayload(payload)
  if (!normalized.name) throw new Error("A sablon neve kötelező.")
  if (!normalized.sourceType) throw new Error("A sablon típusa kötelező.")
  if (!normalized.rawContent?.trim()) throw new Error("A sablon tartalma kötelező.")
  if (!normalized.mappings || normalized.mappings.length === 0) throw new Error("Legalább egy dinamikus mezőt jelölj ki.")

  const now = new Date().toISOString()
  const template: EmailTemplate = {
    id: randomUUID(),
    name: normalized.name,
    ownerId: auth.userId,
    ownerRole: auth.isAdmin ? "admin" : "user",
    sourceType: normalized.sourceType,
    originalFileName: normalized.originalFileName,
    subject: normalized.subject,
    rawContent: normalized.rawContent,
    htmlContent: normalized.htmlContent ?? (normalized.sourceType === "text" ? "" : normalized.rawContent),
    textContent: normalized.textContent ?? (normalized.sourceType === "html" ? "" : normalized.rawContent),
    mappings: normalized.mappings,
    createdAt: now,
    updatedAt: now,
  }

  const state = await readState()
  await writeState({ templates: [template, ...state.templates] })
  return template
}

export async function updateEmailTemplate(
  auth: AuthContext,
  id: string,
  payload: EmailTemplateUpdatePayload,
): Promise<EmailTemplate> {
  const state = await readState()
  const existing = state.templates.find((item) => item.id === id)
  if (!existing) throw new Error("A sablon nem található.")
  if (!canWriteTemplate(existing, auth)) throw new Error("Nincs jogosultság a sablon módosításához.")

  const normalized = normalizePayload(payload)
  const next: EmailTemplate = {
    ...existing,
    name: normalized.name ?? existing.name,
    sourceType: normalized.sourceType ?? existing.sourceType,
    originalFileName: normalized.originalFileName ?? existing.originalFileName,
    subject: normalized.subject ?? existing.subject,
    rawContent: normalized.rawContent ?? existing.rawContent,
    htmlContent: normalized.htmlContent ?? existing.htmlContent,
    textContent: normalized.textContent ?? existing.textContent,
    mappings: normalized.mappings ?? existing.mappings,
    updatedAt: new Date().toISOString(),
  }

  await writeState({
    templates: state.templates.map((item) => (item.id === id ? next : item)),
  })
  return next
}

export async function deleteEmailTemplate(auth: AuthContext, id: string): Promise<void> {
  const state = await readState()
  const existing = state.templates.find((item) => item.id === id)
  if (!existing) throw new Error("A sablon nem található.")
  if (!canWriteTemplate(existing, auth)) throw new Error("Nincs jogosultság a sablon törléséhez.")
  await writeState({
    templates: state.templates.filter((item) => item.id !== id),
  })
}
