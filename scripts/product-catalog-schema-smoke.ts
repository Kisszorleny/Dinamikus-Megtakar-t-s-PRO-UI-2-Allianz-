import assert from "node:assert/strict"
import { productCatalogCreateSchema } from "@/lib/product-catalog/schema"

function runConfirmedRequiresCodeCheck() {
  const result = productCatalogCreateSchema.safeParse({
    insurer: "Test",
    productName: "Termék",
    productValue: "test_product",
    productType: "Életbiztosítás",
    mnbCode: "12345",
    productCodeStatus: "confirmed",
    productCode: null,
  })
  assert.equal(result.success, false)
}

function runPlaceholderRejectionCheck() {
  const result = productCatalogCreateSchema.safeParse({
    insurer: "Test",
    productName: "Termék",
    productValue: "test_product",
    productType: "Életbiztosítás",
    mnbCode: "12345",
    productCodeStatus: "confirmed",
    productCode: "TODO",
  })
  assert.equal(result.success, false)
}

function runUnknownAllowsNullCheck() {
  const result = productCatalogCreateSchema.safeParse({
    insurer: "Test",
    productName: "Termék",
    productValue: "test_product",
    productType: "Életbiztosítás",
    mnbCode: "12345",
    productCodeStatus: "unknown",
    productCode: null,
  })
  assert.equal(result.success, true)
}

runConfirmedRequiresCodeCheck()
runPlaceholderRejectionCheck()
runUnknownAllowsNullCheck()

console.log("Product catalog schema smoke checks passed")
