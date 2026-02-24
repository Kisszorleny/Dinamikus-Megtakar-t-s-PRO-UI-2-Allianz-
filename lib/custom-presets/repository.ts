import { promises as fs } from "node:fs"
import path from "node:path"
import { randomUUID } from "node:crypto"
import type {
  CustomPreset,
  CustomPresetCreatePayload,
  CustomPresetUpdatePayload,
} from "@/lib/custom-presets/types"

type RepositoryState = {
  presets: CustomPreset[]
}

type AuthContext = {
  userId: string
  isAdmin: boolean
}

const STORAGE_DIR = path.join(process.cwd(), ".runtime-data")
const STORAGE_FILE = path.join(STORAGE_DIR, "custom-presets.json")

let inMemoryCache: RepositoryState | null = null

async function readState(): Promise<RepositoryState> {
  if (inMemoryCache) return inMemoryCache
  try {
    const raw = await fs.readFile(STORAGE_FILE, "utf8")
    const parsed = JSON.parse(raw) as RepositoryState
    inMemoryCache = { presets: Array.isArray(parsed?.presets) ? parsed.presets : [] }
    return inMemoryCache
  } catch {
    inMemoryCache = { presets: [] }
    return inMemoryCache
  }
}

async function writeState(next: RepositoryState): Promise<void> {
  inMemoryCache = next
  await fs.mkdir(STORAGE_DIR, { recursive: true })
  await fs.writeFile(STORAGE_FILE, JSON.stringify(next, null, 2), "utf8")
}

function canReadPreset(preset: CustomPreset, auth: AuthContext): boolean {
  if (auth.isAdmin) return true
  if (preset.ownerId === auth.userId) return true
  return preset.ownerRole === "admin"
}

function canWritePreset(preset: CustomPreset, auth: AuthContext): boolean {
  if (auth.isAdmin) return true
  return preset.ownerId === auth.userId
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
        }))
    : undefined
  return { cleanName, productScope, entries }
}

export async function listCustomPresets(auth: AuthContext, productScope?: string | null): Promise<CustomPreset[]> {
  const state = await readState()
  return state.presets
    .filter((preset) => canReadPreset(preset, auth))
    .filter((preset) => {
      if (productScope === undefined) return true
      if (productScope === null) return preset.productScope === null
      return preset.productScope === productScope
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function createCustomPreset(auth: AuthContext, payload: CustomPresetCreatePayload): Promise<CustomPreset> {
  const { cleanName, productScope, entries } = normalizePayload(payload)
  if (!cleanName) {
    throw new Error("A sablon neve kötelező.")
  }
  if (!entries || entries.length === 0) {
    throw new Error("Legalább egy egyedi költség vagy bónusz szükséges.")
  }

  const state = await readState()
  const now = new Date().toISOString()
  const preset: CustomPreset = {
    id: randomUUID(),
    name: cleanName,
    ownerId: auth.userId,
    ownerRole: auth.isAdmin ? "admin" : "user",
    productScope: productScope === undefined ? null : productScope,
    entries,
    createdAt: now,
    updatedAt: now,
  }

  await writeState({
    presets: [preset, ...state.presets],
  })
  return preset
}

export async function updateCustomPreset(
  auth: AuthContext,
  id: string,
  payload: CustomPresetUpdatePayload,
): Promise<CustomPreset> {
  const state = await readState()
  const existing = state.presets.find((preset) => preset.id === id)
  if (!existing) throw new Error("A sablon nem található.")
  if (!canWritePreset(existing, auth)) throw new Error("Nincs jogosultság a sablon módosításához.")

  const { cleanName, productScope, entries } = normalizePayload(payload)
  const next: CustomPreset = {
    ...existing,
    name: cleanName ?? existing.name,
    productScope: productScope === undefined ? existing.productScope : productScope,
    entries: entries ?? existing.entries,
    updatedAt: new Date().toISOString(),
  }

  await writeState({
    presets: state.presets.map((preset) => (preset.id === id ? next : preset)),
  })
  return next
}

export async function deleteCustomPreset(auth: AuthContext, id: string): Promise<void> {
  const state = await readState()
  const existing = state.presets.find((preset) => preset.id === id)
  if (!existing) throw new Error("A sablon nem található.")
  if (!canWritePreset(existing, auth)) throw new Error("Nincs jogosultság a sablon törléséhez.")

  await writeState({
    presets: state.presets.filter((preset) => preset.id !== id),
  })
}
