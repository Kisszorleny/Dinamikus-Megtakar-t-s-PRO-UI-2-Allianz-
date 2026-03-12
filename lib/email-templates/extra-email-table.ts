import { convertForDisplay } from "@/lib/currency-conversion"
import type { Currency } from "@/lib/engine"

export function convertExtraEmailTablePaymentAmount(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  eurToHufRate: number,
): number {
  const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0
  if (safeAmount === 0 || fromCurrency === toCurrency) return safeAmount
  return Math.round(convertForDisplay(safeAmount, fromCurrency, toCurrency, eurToHufRate))
}
