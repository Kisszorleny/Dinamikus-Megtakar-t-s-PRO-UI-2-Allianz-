import type { ProductDefinition } from "./types"
import { dmPro } from "./dm-pro"
import { allianzEletprogram } from "./allianz-eletprogram"
import { alfaExclusivePlus } from "./alfa-exclusive-plus"

export const PRODUCTS = {
  "dm-pro": dmPro,
  "allianz-eletprogram": allianzEletprogram,
  "alfa-exclusive-plus": alfaExclusivePlus,
} satisfies Record<string, ProductDefinition>

export type ProductId = keyof typeof PRODUCTS

export function getProduct(productId: ProductId): ProductDefinition {
  return PRODUCTS[productId]
}
