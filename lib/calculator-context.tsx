"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { Currency } from "@/lib/engine/calculate-results-daily"

export interface CalculatorData {
  // Basic info
  name?: string
  goal?: string

  // Inputs
  monthlyPayment: number
  yearlyPayment: number
  years: number
  currency: Currency
  displayCurrency: Currency
  eurToHufRate: number
  annualYieldPercent: number // Added annualYieldPercent for "Éves nettó hozam" display
  enableTaxCredit?: boolean // Added enableTaxCredit flag to control conditional display in summary
  enableNetting?: boolean // Added enableNetting flag to interface
  productHasBonus?: boolean // Added productHasBonus flag to determine if bonus row should be shown

  // Results
  totalContributions: number
  totalReturn: number
  endBalance: number
  totalTaxCredit: number
  totalBonus: number
  totalCost: number
  totalAssetBasedCost: number
  totalRiskInsuranceCost: number

  // Net values (if netting enabled)
  netEndBalance?: number
  netEndBalanceWithTax?: number
  netProfit?: number
  taxDeduction?: number

  // EUR conversions (if applicable)
  endBalanceEUR500?: number
  endBalanceEUR600?: number

  // Strategy and product info for summary display
  strategy?: string
  contributionMode?: string
  selectedInsurer?: string
  selectedProduct?: string
}

interface CalculatorContextType {
  data: CalculatorData | null
  updateData: (newData: CalculatorData) => void
  isHydrated: boolean
}

const CalculatorContext = createContext<CalculatorContextType | undefined>(undefined)

export function CalculatorProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CalculatorData | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Set hydrated immediately after mount
    setIsHydrated(true)

    // Fallback: ensure it's set even if updateData never runs
    const timeout = setTimeout(() => {
      setIsHydrated(true)
    }, 500)

    return () => clearTimeout(timeout)
  }, [])

  const updateData = useCallback((newData: CalculatorData) => {
    setData(newData)
  }, [])

  return <CalculatorContext.Provider value={{ data, updateData, isHydrated }}>{children}</CalculatorContext.Provider>
}

export function useCalculatorData() {
  const context = useContext(CalculatorContext)
  if (context === undefined) {
    throw new Error("useCalculatorData must be used within a CalculatorProvider")
  }
  return context
}
