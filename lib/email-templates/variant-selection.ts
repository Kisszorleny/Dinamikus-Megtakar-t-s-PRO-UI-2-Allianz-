import type {
  TemplateVariantBundle,
  TemplateVariantCurrency,
  TemplateVariantGoal,
  TemplateVariantItem,
  TemplateVariantProduct,
  TemplateVariantTone,
} from "@/lib/email-templates/types"

type VariantSelectionInput = {
  emailTegezo: boolean
  selectedProduct?: string
  displayCurrency: "HUF" | "EUR" | "USD"
  enableTaxCredit?: boolean
}

type VariantSelectionResult =
  | { status: "selected"; variant: TemplateVariantItem }
  | { status: "missing_bundle" }
  | { status: "missing_product" }
  | { status: "unsupported_currency"; message: string }
  | { status: "not_found" }

function toVariantProduct(selectedProduct?: string): TemplateVariantProduct | null {
  if (selectedProduct === "allianz_eletprogram") return "allianz_eletprogram"
  if (selectedProduct === "allianz_bonusz_eletprogram") return "allianz_bonusz_eletprogram"
  return null
}

function toVariantCurrency(currency: "HUF" | "EUR" | "USD"): TemplateVariantCurrency | null {
  if (currency === "HUF" || currency === "EUR") return currency
  return null
}

function toVariantTone(emailTegezo: boolean): TemplateVariantTone {
  return emailTegezo ? "tegezo" : "magazo"
}

function toVariantGoal(enableTaxCredit?: boolean): TemplateVariantGoal {
  return enableTaxCredit ? "nyugdij" : "tokenoveles"
}

export function selectTemplateVariant(
  variantBundle: TemplateVariantBundle | undefined,
  input: VariantSelectionInput,
): VariantSelectionResult {
  if (!variantBundle?.variants?.length) {
    return { status: "missing_bundle" }
  }
  const currency = toVariantCurrency(input.displayCurrency)
  if (!currency) {
    return { status: "unsupported_currency", message: "USD sablon még nincs" }
  }
  const product = toVariantProduct(input.selectedProduct)
  if (!product) {
    return { status: "missing_product" }
  }
  const tone = toVariantTone(input.emailTegezo)
  const goal = toVariantGoal(input.enableTaxCredit)
  const variant = variantBundle.variants.find(
    (item) => item.tone === tone && item.product === product && item.currency === currency && item.goal === goal,
  )
  if (!variant) return { status: "not_found" }
  return { status: "selected", variant }
}
