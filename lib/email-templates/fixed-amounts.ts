export type FixedAmountValues = {
  fixedSmallAmount: string
  fixedLargeAmount: string
}

export type FixedAmountPairValues = {
  fixedSmallAmountHuf: string
  fixedSmallAmountEur: string
  fixedLargeAmountHuf: string
  fixedLargeAmountEur: string
}

export function getFixedAmountPairValues(): FixedAmountPairValues {
  return {
    fixedSmallAmountHuf: "990 Ft",
    fixedSmallAmountEur: "3.3 Euro",
    fixedLargeAmountHuf: "3 000 000 Ft",
    fixedLargeAmountEur: "12 000 Euro",
  }
}

export function getFixedAmountValues(displayCurrency: "HUF" | "EUR" | "USD"): FixedAmountValues {
  const pair = getFixedAmountPairValues()
  if (displayCurrency === "EUR") {
    return {
      fixedSmallAmount: pair.fixedSmallAmountEur,
      fixedLargeAmount: pair.fixedLargeAmountEur,
    }
  }
  return {
    fixedSmallAmount: pair.fixedSmallAmountHuf,
    fixedLargeAmount: pair.fixedLargeAmountHuf,
  }
}
