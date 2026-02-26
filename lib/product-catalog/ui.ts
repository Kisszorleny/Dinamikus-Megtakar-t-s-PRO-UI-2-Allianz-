import { PRODUCT_CATALOG_UI } from "@/lib/product-catalog/data"
import type { ProductCatalogUiItem, ProductCatalogUiVariant } from "@/lib/product-catalog/types"

export type UiProductVariant = ProductCatalogUiVariant

export type UiProductMetadata = {
  value: string
  label: string
  productType: string
  mnbCode: string
  productCode: string
  variants?: UiProductVariant[]
  insurer?: string
}

export function listAllCatalogProducts(): ProductCatalogUiItem[] {
  return PRODUCT_CATALOG_UI
}

export function getAvailableProductsForInsurerFromCatalog(insurer: string): UiProductMetadata[] {
  return PRODUCT_CATALOG_UI.filter((item) => item.insurer === insurer).map((item) => ({
    value: item.value,
    label: item.label,
    productType: item.productType,
    mnbCode: item.mnbCode,
    productCode: item.productCode,
    variants: item.variants,
  }))
}

export function getAllProductsForInsurers(insurers: readonly string[]): UiProductMetadata[] {
  const out: UiProductMetadata[] = []
  for (const insurer of insurers) {
    const products = getAvailableProductsForInsurerFromCatalog(insurer)
    for (const product of products) {
      out.push({ ...product, insurer })
    }
  }
  return out
}

export function getProductLabelFromCatalog(productValue: string): string | null {
  return PRODUCT_CATALOG_UI.find((item) => item.value === productValue)?.label ?? null
}
