export type FundPricePoint = {
  date: string
  price: number
}

export type FundPriceSeries = {
  fundId: string
  source: string
  currency?: string
  updatedAt?: string
  points: FundPricePoint[]
}

export type FundSeriesStats = {
  firstDate?: string
  lastDate?: string
  firstPrice?: number
  lastPrice?: number
  observations: number
  annualizedReturnPercent?: number
}
