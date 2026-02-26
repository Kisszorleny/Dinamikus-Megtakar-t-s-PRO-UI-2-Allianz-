import { createProductVersion, listProductCatalog } from "@/lib/product-catalog/repository"
import { buildProductCatalogSeedItems, PRODUCT_CATALOG_SOURCE_REF } from "@/lib/product-catalog/data"
import { productCatalogCreateSchema } from "@/lib/product-catalog/schema"

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  const createdBy = process.env.PRODUCT_CATALOG_SEED_USER ?? "seed-script"
  const seedItems = buildProductCatalogSeedItems(PRODUCT_CATALOG_SOURCE_REF)

  const existing = await listProductCatalog({ includeInactive: true })
  const existingIndex = new Set(
    existing.map((row) => `${row.insurer}|${row.product_value}|${row.variant_value ?? ""}|${row.version}`),
  )

  let inserted = 0
  let skipped = 0

  for (const item of seedItems) {
    const parsed = productCatalogCreateSchema.parse({
      insurer: item.insurer,
      productName: item.productName,
      productValue: item.productValue,
      variantValue: item.variantValue ?? undefined,
      productType: item.productType,
      mnbCode: item.mnbCode,
      productCode: item.productCode,
      productCodeStatus: item.productCodeStatus,
      sourceRef: item.sourceRef,
      createdBy,
      metadata: item.metadata ?? {},
    })

    // Seed only base version if not present yet.
    const baseKey = `${parsed.insurer}|${parsed.productValue}|${parsed.variantValue ?? ""}|1`
    if (existingIndex.has(baseKey)) {
      skipped += 1
      continue
    }

    if (!dryRun) {
      await createProductVersion(parsed)
    }
    inserted += 1
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun,
        sourceRef: PRODUCT_CATALOG_SOURCE_REF,
        totalCandidates: seedItems.length,
        inserted,
        skipped,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
