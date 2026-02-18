import type { ProductDefinition } from "./types"
import { dmPro } from "./dm-pro"
import { allianzEletprogram } from "./allianz-eletprogram"
import { alfaExclusivePlus } from "./alfa-exclusive-plus"
import { alfaFortis } from "./alfa-fortis"
import { alfaJade } from "./alfa-jade"
import { alfaJovokep } from "./alfa-jovokep"
import { alfaJovotervezo } from "./alfa-jovotervezo"
import { alfaPremiumSelection } from "./alfa-premium-selection"
import { alfaRelaxPlusz } from "./alfa-relax-plusz"

export const PRODUCTS = {
  "dm-pro": dmPro,
  "allianz-eletprogram": allianzEletprogram,
  "alfa-exclusive-plus": alfaExclusivePlus,
  "alfa-fortis": alfaFortis,
  "alfa-jade": alfaJade,
  "alfa-jovokep": alfaJovokep,
  "alfa-jovotervezo": alfaJovotervezo,
  "alfa-premium-selection": alfaPremiumSelection,
  "alfa-relax-plusz": alfaRelaxPlusz,
} satisfies Record<string, ProductDefinition>

export type ProductId = keyof typeof PRODUCTS

export function getProduct(productId: ProductId): ProductDefinition {
  return PRODUCTS[productId]
}
