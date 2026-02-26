export type ProductCatalogUiVariant = {
  value?: string
  label?: string
  productType: string
  mnbCode: string
  productCode: string
}

export type ProductCatalogUiItem = {
  insurer: string
  value: string
  label: string
  productType: string
  mnbCode: string
  productCode: string
  variants?: ProductCatalogUiVariant[]
}

export type ProductCatalogSeedItem = {
  insurer: string
  productName: string
  productValue: string
  variantValue?: string | null
  productType: string
  mnbCode: string
  productCode: string | null
  productCodeStatus: "confirmed" | "unknown"
  sourceRef: string
  metadata?: Record<string, unknown>
}
