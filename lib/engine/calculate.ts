import { getProduct, type ProductId } from "./products"
import type { EngineInputs, EngineResults } from "./products/types"

export function calculate(productId: ProductId, inputs: EngineInputs): EngineResults {
  const product = getProduct(productId)
  return product.calculate(inputs)
}
