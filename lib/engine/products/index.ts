import type { ProductDefinition } from "./types"
import { dmPro } from "./dm-pro"
import { allianzEletprogram } from "./allianz-eletprogram"

export const PRODUCTS = {
  "dm-pro": dmPro,
  "allianz-eletprogram": allianzEletprogram,
} satisfies Record<string, ProductDefinition>

export type ProductId = keyof typeof PRODUCTS

export function getProduct(productId: ProductId): ProductDefinition {
  return PRODUCTS[productId]
}
