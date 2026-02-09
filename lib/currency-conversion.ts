export type Currency = "HUF" | "EUR" | "USD"

export function convertForDisplay(
  value: number,
  calcCurrency: Currency,
  displayCurrency: Currency,
  eurToHufRate: number,
): number {
  if (displayCurrency === calcCurrency) return value

  // EUR ↔ HUF
  if (calcCurrency === "EUR" && displayCurrency === "HUF") return value * eurToHufRate
  if (calcCurrency === "HUF" && displayCurrency === "EUR") return value / eurToHufRate

  // USD ↔ HUF (eurToHufRate param is actually used as fxRate generically)
  if (calcCurrency === "USD" && displayCurrency === "HUF") return value * eurToHufRate
  if (calcCurrency === "HUF" && displayCurrency === "USD") return value / eurToHufRate

  // EUR ↔ USD (convert through HUF as intermediate)
  if (calcCurrency === "EUR" && displayCurrency === "USD") {
    // EUR → HUF → USD (approximate, would need both rates for exact conversion)
    return value
  }
  if (calcCurrency === "USD" && displayCurrency === "EUR") {
    // USD → HUF → EUR (approximate, would need both rates for exact conversion)
    return value
  }

  return value
}

export function convertFromDisplayToCalc(
  value: number,
  calcCurrency: Currency,
  displayCurrency: Currency,
  eurToHufRate: number,
): number {
  if (displayCurrency === calcCurrency) return value

  // EUR ↔ HUF
  if (calcCurrency === "EUR" && displayCurrency === "HUF") return value / eurToHufRate
  if (calcCurrency === "HUF" && displayCurrency === "EUR") return value * eurToHufRate

  // USD ↔ HUF
  if (calcCurrency === "USD" && displayCurrency === "HUF") return value / eurToHufRate
  if (calcCurrency === "HUF" && displayCurrency === "USD") return value * eurToHufRate

  // EUR ↔ USD
  if (calcCurrency === "EUR" && displayCurrency === "USD") {
    return value
  }
  if (calcCurrency === "USD" && displayCurrency === "EUR") {
    return value
  }

  return value
}

export function formatMoney(value: number, currency: Currency): string {
  const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : "Ft"
  const formatted = value.toLocaleString("hu-HU", { maximumFractionDigits: 0, useGrouping: true })
  return `${formatted.replace(/\u00A0/g, " ")} ${symbol}`
}
