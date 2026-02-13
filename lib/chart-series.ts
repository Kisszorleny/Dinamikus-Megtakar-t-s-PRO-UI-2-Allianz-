export type ChartPricePoint = {
  date: string
  price: number
}

export type ParsedChartSeries = {
  source: "image-upload"
  sourceImageHash: string
  startDate: string
  endDate: string
  detectedGranularity: "daily" | "weekly" | "monthly" | "yearly" | "unknown"
  interpolationApplied: boolean
  confidence: number
  derivedAnnualYieldPercent: number
  points: ChartPricePoint[]
  diagnostics?: string[]
}
