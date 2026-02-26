import { listProductCatalog } from "@/lib/product-catalog/repository"

async function main() {
  const rows = await listProductCatalog({ includeInactive: true })

  const totals = {
    total: rows.length,
    confirmed: 0,
    unknown: 0,
    inactive: 0,
  }

  const byInsurer: Record<string, { total: number; confirmed: number; unknown: number }> = {}
  const invalidRows: Array<{ id: string; insurer: string; productValue: string; reason: string }> = []

  for (const row of rows) {
    if (!byInsurer[row.insurer]) {
      byInsurer[row.insurer] = { total: 0, confirmed: 0, unknown: 0 }
    }
    byInsurer[row.insurer].total += 1

    if (!row.is_active) totals.inactive += 1

    if (row.product_code_status === "confirmed") {
      totals.confirmed += 1
      byInsurer[row.insurer].confirmed += 1
      if (!row.product_code || !row.product_code.trim()) {
        invalidRows.push({
          id: row.id,
          insurer: row.insurer,
          productValue: row.product_value,
          reason: "confirmed státusz, de hiányzó product_code",
        })
      }
    } else {
      totals.unknown += 1
      byInsurer[row.insurer].unknown += 1
    }
  }

  const report = {
    ok: invalidRows.length === 0,
    totals,
    byInsurer,
    invalidRows,
  }

  console.log(JSON.stringify(report, null, 2))

  if (invalidRows.length > 0) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
