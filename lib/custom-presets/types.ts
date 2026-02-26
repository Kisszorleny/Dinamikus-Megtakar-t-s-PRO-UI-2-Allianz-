export type CustomPresetAccount = "client" | "invested" | "taxBonus" | "main" | "eseti"
export type CustomPresetKind = "cost" | "bonus"
export type CustomPresetValueType = "percent" | "amount"
export type CustomPresetFrequency = "napi" | "havi" | "negyedéves" | "féléves" | "éves" | "fizetési_gyakoriság"

export interface CustomPresetEntry {
  id: string
  label: string
  kind: CustomPresetKind
  valueType: CustomPresetValueType
  value: number
  valueByYear?: Record<number, number>
  account: CustomPresetAccount
  frequency?: CustomPresetFrequency
  startYear?: number
  stopYear?: number
  dayOfMonth?: number
  month?: number
  baseMode?: "contribution" | "asset" | "costRefundAll" | "costRefundCustom"
}

export interface CustomPreset {
  id: string
  name: string
  ownerId: string
  ownerRole: "admin" | "user"
  productScope: string | null
  entries: CustomPresetEntry[]
  createdAt: string
  updatedAt: string
}

export interface CustomPresetCreatePayload {
  name: string
  productScope?: string | null
  entries: CustomPresetEntry[]
}

export interface CustomPresetUpdatePayload {
  name?: string
  productScope?: string | null
  entries?: CustomPresetEntry[]
}
