"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Calendar as CalendarIcon,
  Settings,
  Calculator,
  BarChart3,
  Table2,
  Info,
  Plus,
  X,
  GitCompare,
  FileText,
  Upload,
  Trash2,
  LogOut,
} from "lucide-react"
import { calculate } from "@/lib/engine/calculate"
import { ALFA_EXCLUSIVE_PLUS_MIN_EXTRAORDINARY_PAYMENT } from "@/lib/engine/products/alfa-exclusive-plus-config"
import type {
  InputsDaily,
  Currency,
  PaymentFrequency,
  ManagementFeeFrequency, // Added import
  ManagementFeeValueType, // Added import
} from "@/lib/engine/calculate-results-daily"
import type { ProductId } from "@/lib/engine/products"
import { getFxRateWithFallback, type FxState } from "@/lib/fx-rate" // Updated import
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { buildYearlyPlan } from "@/lib/plan"
import { convertForDisplay, convertFromDisplayToCalc, formatMoney } from "@/lib/currency-conversion"
import { formatNumber, parseNumber } from "@/lib/format-number"
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useRouter } from "next/navigation"
import { useCalculatorData, type CalculatorData } from "@/lib/calculator-context"
import { useMobile } from "@/lib/mobile-context"
import { InitialCostByYear } from "./initial-cost-by-year"
import { RedemptionFeeByYear } from "@/components/redemption-fee-by-year" // Added import
import { InvestedShareByYear } from "./invested-share-by-year" // Added import
import { ColumnHoverInfoPanel } from "@/components/column-hover-info-panel"
import { parseChartImageToSeries } from "@/lib/chart-image-parser"
import type { ParsedChartSeries } from "@/lib/chart-series"
import type { CustomPreset } from "@/lib/custom-presets/types"
import {
  buildFortisBonusPercentByYear,
  FORTIS_MAX_ENTRY_AGE,
  FORTIS_MIN_ENTRY_AGE,
  getFortisVariantConfig,
  resolveFortisVariant,
  toFortisProductVariantId,
} from "@/lib/engine/products/alfa-fortis-config"
import {
  buildJadeInitialCostByYear,
  buildJadeInvestedShareByYear,
  buildJadeRedemptionSchedule,
  getJadeVariantConfig,
  resolveJadeVariant,
  toJadeProductVariantId,
} from "@/lib/engine/products/alfa-jade-config"
import {
  buildJovokepInitialCostByYear,
  buildJovokepInvestedShareByYear,
  buildJovokepRedemptionSchedule,
  clampJovokepEntryAge,
  JOVOKEP_MAX_DURATION_YEARS,
  JOVOKEP_EXTRAORDINARY_ADMIN_FEE_PERCENT,
  JOVOKEP_MAX_AGE_AT_MATURITY,
  JOVOKEP_MAX_ENTRY_AGE,
  JOVOKEP_MIN_ANNUAL_PAYMENT,
  JOVOKEP_MIN_DURATION_YEARS,
  JOVOKEP_MIN_ENTRY_AGE,
  JOVOKEP_MIN_EXTRAORDINARY_PAYMENT,
  JOVOKEP_PRODUCT_CODE,
  JOVOKEP_REGULAR_ADMIN_FEE_PERCENT,
} from "@/lib/engine/products/alfa-jovokep-config"
import {
  buildJovotervezoInitialCostByYear,
  buildJovotervezoInvestedShareByYear,
  buildJovotervezoRedemptionSchedule,
  JOVOTERVEZO_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT,
  JOVOTERVEZO_EXTRAORDINARY_ADMIN_FEE_PERCENT,
  JOVOTERVEZO_MIN_ANNUAL_PAYMENT,
  JOVOTERVEZO_MAX_DURATION_YEARS,
  JOVOTERVEZO_MIN_DURATION_YEARS,
  JOVOTERVEZO_MIN_EXTRAORDINARY_PAYMENT,
  JOVOTERVEZO_PRODUCT_CODE,
  JOVOTERVEZO_REGULAR_ADMIN_FEE_PERCENT,
} from "@/lib/engine/products/alfa-jovotervezo-config"
import {
  buildPremiumSelectionBonusAmountByYear,
  buildPremiumSelectionInitialCostByYear,
  buildPremiumSelectionInvestedShareByYear,
  buildPremiumSelectionRedemptionSchedule,
  estimatePremiumSelectionDurationYears,
  getPremiumSelectionVariantConfig,
  PREMIUM_SELECTION_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT,
  PREMIUM_SELECTION_EUR_PRODUCT_CODE,
  PREMIUM_SELECTION_NY22_PRODUCT_CODE,
  PREMIUM_SELECTION_NY12_PRODUCT_CODE,
  PREMIUM_SELECTION_EXTRAORDINARY_ADMIN_FEE_PERCENT,
  PREMIUM_SELECTION_MIN_ANNUAL_PAYMENT,
  PREMIUM_SELECTION_MIN_EXTRAORDINARY_PAYMENT,
  PREMIUM_SELECTION_NY12_MIN_ANNUAL_PAYMENT,
  PREMIUM_SELECTION_NY12_MIN_EXTRAORDINARY_PAYMENT,
  PREMIUM_SELECTION_NY06_MIN_DURATION_YEARS,
  PREMIUM_SELECTION_NYUGDIJ_PRODUCT_CODE,
  PREMIUM_SELECTION_OTP_BUX_FUND_ID,
  PREMIUM_SELECTION_PRODUCT_CODE,
  PREMIUM_SELECTION_REGULAR_ADMIN_FEE_PERCENT,
  PREMIUM_SELECTION_TR18_MAX_DURATION_YEARS,
  PREMIUM_SELECTION_TR18_MIN_ANNUAL_PAYMENT,
  PREMIUM_SELECTION_TR18_MIN_DURATION_YEARS,
  PREMIUM_SELECTION_TR18_MIN_EXTRAORDINARY_PAYMENT,
  PREMIUM_SELECTION_USD_PRODUCT_CODE,
  resolvePremiumSelectionAccountMaintenanceMonthlyPercent,
  resolvePremiumSelectionTaxCreditCapPerYear,
  resolvePremiumSelectionVariant,
} from "@/lib/engine/products/alfa-premium-selection-config"
import {
  buildRelaxPluszInitialCostByYear,
  buildRelaxPluszInvestedShareByYear,
  buildRelaxPluszRedemptionSchedule,
  RELAX_PLUSZ_PRODUCT_CODE,
} from "@/lib/engine/products/alfa-relax-plusz-config"
import {
  buildZenProBonusAmountByYear,
  buildZenProInitialCostByYear,
  buildZenProInvestedShareByYear,
  buildZenProRedemptionSchedule,
  estimateZenProDurationYears,
  getZenProVariantConfig,
  resolveZenProTaxCreditCapPerYear,
  resolveZenProVariant,
  resolveZenProMinimumAnnualPayment,
  toZenProProductVariantId,
  ZEN_PRO_ACCOUNT_MAINTENANCE_CLIENT_START_MONTH,
  ZEN_PRO_ACCOUNT_MAINTENANCE_INVESTED_START_MONTH,
  ZEN_PRO_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT,
  ZEN_PRO_ACCOUNT_MAINTENANCE_TAXBONUS_START_MONTH,
  ZEN_PRO_EXTRAORDINARY_ADMIN_FEE_PERCENT,
  ZEN_PRO_NY08_PRODUCT_CODE,
  ZEN_PRO_NY14_PRODUCT_CODE,
  ZEN_PRO_NY24_PRODUCT_CODE,
  ZEN_PRO_REGULAR_ADMIN_FEE_PERCENT,
  ZEN_PRO_TAX_CREDIT_RATE_PERCENT,
} from "@/lib/engine/products/alfa-zen-pro-config"
import {
  ALFA_ZEN_ACCOUNT_MAINTENANCE_CLIENT_START_MONTH,
  ALFA_ZEN_ACCOUNT_MAINTENANCE_INVESTED_START_MONTH,
  ALFA_ZEN_ACCOUNT_MAINTENANCE_TAXBONUS_START_MONTH,
  ALFA_ZEN_EXTRAORDINARY_ADMIN_FEE_PERCENT,
  ALFA_ZEN_MIN_EXTRAORDINARY_PAYMENT,
  ALFA_ZEN_NY13_PRODUCT_CODE,
  ALFA_ZEN_NY23_PRODUCT_CODE,
  ALFA_ZEN_REGULAR_ADMIN_FEE_PERCENT,
  ALFA_ZEN_TAX_CREDIT_RATE_PERCENT,
  buildAlfaZenBonusAmountByYear,
  buildAlfaZenInitialCostByYear,
  buildAlfaZenInvestedShareByYear,
  buildAlfaZenRedemptionSchedule,
  estimateAlfaZenDurationYears,
  getAlfaZenVariantConfig,
  resolveAlfaZenAccountMaintenanceMonthlyPercent,
  resolveAlfaZenMinimumAnnualPayment,
  resolveAlfaZenTaxCreditCapPerYear,
  resolveAlfaZenVariant,
  toAlfaZenProductVariantId,
} from "@/lib/engine/products/alfa-zen-config"
import {
  buildCigEsszenciaeBonusAmountByYear,
  buildCigEsszenciaeBonusPercentByYear,
  buildCigEsszenciaeInitialCostByYear,
  buildCigEsszenciaeInvestedShareByYear,
  buildCigEsszenciaeRedemptionFeeByYear,
  CIG_ESSZENCIAE_EUR_MNB_CODE,
  CIG_ESSZENCIAE_HUF_MNB_CODE,
  CIG_ESSZENCIAE_MIN_DURATION_YEARS,
  CIG_ESSZENCIAE_PRODUCT_CODE,
  CIG_ESSZENCIAE_PRODUCT_VARIANT_EUR,
  CIG_ESSZENCIAE_PRODUCT_VARIANT_HUF,
  CIG_ESSZENCIAE_PARTIAL_SURRENDER_MIN_EUR,
  CIG_ESSZENCIAE_PARTIAL_SURRENDER_MIN_HUF,
  estimateCigEsszenciaeDurationYears,
  getCigEsszenciaeVariantConfig,
  resolveCigEsszenciaeVariant,
  toCigEsszenciaeProductVariantId,
} from "@/lib/engine/products/cig-esszenciae-config"
import {
  buildCigNyugdijkotvenyeBonusAmountByYear,
  buildCigNyugdijkotvenyeBonusPercentByYear,
  buildCigNyugdijkotvenyeInitialCostByYear,
  buildCigNyugdijkotvenyeInvestedShareByYear,
  buildCigNyugdijkotvenyeRedemptionFeeByYear,
  CIG_NYUGDIJKOTVENYE_MIN_ANNUAL_PAYMENT,
  CIG_NYUGDIJKOTVENYE_MIN_DURATION_YEARS,
  CIG_NYUGDIJKOTVENYE_MIN_EXTRAORDINARY_PAYMENT,
  CIG_NYUGDIJKOTVENYE_MIN_REGULAR_WITHDRAWAL_MONTHLY,
  CIG_NYUGDIJKOTVENYE_PAID_UP_MAINTENANCE_MONTHLY_AMOUNT,
  CIG_NYUGDIJKOTVENYE_PRODUCT_CODE,
  CIG_NYUGDIJKOTVENYE_PRODUCT_VARIANT,
  CIG_NYUGDIJKOTVENYE_TAX_CREDIT_RATE_PERCENT,
  estimateCigNyugdijkotvenyeDurationYears,
  resolveCigNyugdijkotvenyeAssetFeeAnnualPercent,
  resolveCigNyugdijkotvenyeTaxCreditCapPerYear,
} from "@/lib/engine/products/cig-nyugdijkotvenye-config"
import {
  buildGeneraliKabalaU91AdminPlusCostByYear,
  buildGeneraliKabalaU91BonusOnContributionPercentByYear,
  buildGeneraliKabalaU91FidelityAccountBonusAmountByYear,
  buildGeneraliKabalaU91InitialCostByYear,
  buildGeneraliKabalaU91InvestedShareByYear,
  buildGeneraliKabalaU91LoyaltyCreditBonusAmountByYear,
  buildGeneraliKabalaU91RedemptionFeeByYear,
  buildGeneraliKabalaU91WealthBonusPercentByYear,
  estimateGeneraliKabalaU91DurationYears,
  GENERALI_KABALA_U91_ACCOUNT_MAINTENANCE_REGULAR_START_MONTH,
  GENERALI_KABALA_U91_ACCOUNT_MAINTENANCE_TAXBONUS_START_MONTH,
  GENERALI_KABALA_U91_EXTRA_DISTRIBUTION_FEE_PERCENT,
  GENERALI_KABALA_U91_PENSION_MAX_ENTRY_AGE,
  GENERALI_KABALA_U91_PENSION_MIN_ENTRY_AGE,
  GENERALI_KABALA_U91_MIN_EXTRAORDINARY_PAYMENT,
  GENERALI_KABALA_U91_PRODUCT_CODE,
  GENERALI_KABALA_U91_TAX_CREDIT_CAP_HUF,
  GENERALI_KABALA_U91_TAX_CREDIT_RATE_PERCENT,
  getGeneraliKabalaU91VariantConfig,
  resolveGeneraliKabalaU91AccountMaintenanceMonthlyPercent,
  resolveGeneraliKabalaU91Variant,
  toGeneraliKabalaU91ProductVariantId,
} from "@/lib/engine/products/generali-kabala-u91-config"
import {
  buildGeneraliMylifeExtraPluszAdminPlusCostByYear,
  buildGeneraliMylifeExtraPluszBonusOnContributionPercentByYear,
  buildGeneraliMylifeExtraPluszInitialCostByYear,
  buildGeneraliMylifeExtraPluszInvestedShareByYear,
  buildGeneraliMylifeExtraPluszLoyaltyBonusAmountByYear,
  buildGeneraliMylifeExtraPluszRedemptionFeeByYear,
  buildGeneraliMylifeExtraPluszWealthBonusPercentByYear,
  estimateGeneraliMylifeExtraPluszDurationYears,
  GENERALI_MYLIFE_EXTRA_PLUSZ_ACCOUNT_MAINTENANCE_EXTRA_START_MONTH,
  GENERALI_MYLIFE_EXTRA_PLUSZ_ACCOUNT_MAINTENANCE_REGULAR_START_MONTH,
  GENERALI_MYLIFE_EXTRA_PLUSZ_EXTRA_DISTRIBUTION_FEE_PERCENT,
  GENERALI_MYLIFE_EXTRA_PLUSZ_MIN_EXTRAORDINARY_PAYMENT,
  GENERALI_MYLIFE_EXTRA_PLUSZ_MIN_REGULAR_WITHDRAWAL_MONTHLY,
  GENERALI_MYLIFE_EXTRA_PLUSZ_PRODUCT_CODE,
  GENERALI_MYLIFE_EXTRA_PLUSZ_TAX_CREDIT_CAP_HUF,
  GENERALI_MYLIFE_EXTRA_PLUSZ_TAX_CREDIT_RATE_PERCENT,
  getGeneraliMylifeExtraPluszVariantConfig,
  resolveGeneraliMylifeExtraPluszAccountMaintenanceMonthlyPercent,
  resolveGeneraliMylifeExtraPluszVariant,
  toGeneraliMylifeExtraPluszProductVariantId,
} from "@/lib/engine/products/generali-mylife-extra-plusz-config"
import {
  getKnhHozamhalmozoVariantConfig,
  KNH_HOZAMHALMOZO_MNB_CODE,
  KNH_HOZAMHALMOZO_PRODUCT_CODE,
  KNH_HOZAMHALMOZO_PRODUCT_VARIANT_HUF,
  resolveKnhHozamhalmozoVariant,
  toKnhHozamhalmozoProductVariantId,
} from "@/lib/engine/products/knh-hozamhalmozo-config"
import {
  getKnhNyugdijbiztositas4VariantConfig,
  KNH_NYUGDIJBIZTOSITAS4_MNB_CODE,
  KNH_NYUGDIJBIZTOSITAS4_PRODUCT_CODE,
  KNH_NYUGDIJBIZTOSITAS4_PRODUCT_VARIANT_HUF,
  resolveKnhNyugdijbiztositas4Variant,
  toKnhNyugdijbiztositas4ProductVariantId,
} from "@/lib/engine/products/knh-nyugdijbiztositas4-config"
import {
  getMetlifeManhattanVariantConfig,
  METLIFE_MANHATTAN_EUR_MNB_CODE,
  METLIFE_MANHATTAN_HUF_MNB_CODE,
  METLIFE_MANHATTAN_PRODUCT_CODE_EUR,
  METLIFE_MANHATTAN_PRODUCT_CODE_HUF,
  METLIFE_MANHATTAN_PRODUCT_VARIANT_EUR,
  METLIFE_MANHATTAN_PRODUCT_VARIANT_HUF,
  resolveMetlifeManhattanVariant,
  toMetlifeManhattanProductVariantId,
} from "@/lib/engine/products/metlife-manhattan-config"
import {
  getMetlifeNyugdijprogramVariantConfig,
  METLIFE_NYUGDIJPROGRAM_EUR_MNB_CODE,
  METLIFE_NYUGDIJPROGRAM_HUF_MNB_CODE,
  METLIFE_NYUGDIJPROGRAM_PRODUCT_CODE_EUR,
  METLIFE_NYUGDIJPROGRAM_PRODUCT_CODE_HUF,
  METLIFE_NYUGDIJPROGRAM_PRODUCT_VARIANT_EUR,
  METLIFE_NYUGDIJPROGRAM_PRODUCT_VARIANT_HUF,
  resolveMetlifeNyugdijprogramVariant,
  toMetlifeNyugdijprogramProductVariantId,
} from "@/lib/engine/products/metlife-nyugdijprogram-config"
import {
  getPostaTrendVariantConfig,
  POSTA_TREND_MNB_CODE,
  POSTA_TREND_PRODUCT_CODE,
  POSTA_TREND_PRODUCT_VARIANT_HUF,
  resolvePostaTrendVariant,
  toPostaTrendProductVariantId,
} from "@/lib/engine/products/posta-trend-config"
import {
  getPostaTrendNyugdijVariantConfig,
  POSTA_TREND_NYUGDIJ_MNB_CODE,
  POSTA_TREND_NYUGDIJ_PRODUCT_CODE,
  POSTA_TREND_NYUGDIJ_PRODUCT_VARIANT_HUF,
  resolvePostaTrendNyugdijVariant,
  toPostaTrendNyugdijProductVariantId,
} from "@/lib/engine/products/posta-trend-nyugdij-config"
import {
  getNnEletkapu119VariantConfig,
  NN_ELETKAPU_119_MNB_CODE,
  NN_ELETKAPU_119_PRODUCT_CODE,
  NN_ELETKAPU_119_PRODUCT_VARIANT_HUF,
  resolveNnEletkapu119Variant,
  toNnEletkapu119ProductVariantId,
} from "@/lib/engine/products/nn-eletkapu-119-config"
import {
  getNnMotiva158VariantConfig,
  NN_MOTIVA_168_MNB_CODE,
  NN_MOTIVA_168_PRODUCT_CODE,
  NN_MOTIVA_168_PRODUCT_VARIANT_EUR,
  NN_MOTIVA_158_MNB_CODE,
  NN_MOTIVA_158_PRODUCT_CODE,
  NN_MOTIVA_158_PRODUCT_VARIANT_HUF,
  resolveNnMotiva158VariantFromInputs,
  toNnMotiva158ProductVariantId,
} from "@/lib/engine/products/nn-motiva-158-config"
import {
  getNnVisio118VariantConfig,
  NN_VISIO_118_MNB_CODE,
  NN_VISIO_118_PRODUCT_CODE,
  NN_VISIO_118_PRODUCT_VARIANT_HUF,
  toNnVisio118ProductVariantId,
} from "@/lib/engine/products/nn-visio-118-config"
import {
  getNnVista128VariantConfig,
  NN_VISTA_128_MNB_CODE,
  NN_VISTA_128_PRODUCT_CODE,
  NN_VISTA_128_PRODUCT_VARIANT_EUR,
  toNnVista128ProductVariantId,
} from "@/lib/engine/products/nn-vista-128-config"
import {
  getSignalElorelatoUl001VariantConfig,
  SIGNAL_ELORELATO_UL001_MNB_CODE,
  SIGNAL_ELORELATO_UL001_PRODUCT_CODE,
  SIGNAL_ELORELATO_UL001_PRODUCT_VARIANT_HUF,
  toSignalElorelatoUl001ProductVariantId,
  type SignalElorelatoUl001PaymentMethodProfile,
  type SignalElorelatoUl001VakProfile,
} from "@/lib/engine/products/signal-elorelato-ul001-config"
import {
  getSignalNyugdijTervPluszNy010VariantConfig,
  SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_MNB_CODE,
  SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PRODUCT_CODE,
  SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PRODUCT_VARIANT_HUF,
  toSignalNyugdijTervPluszNy010ProductVariantId,
} from "@/lib/engine/products/signal-nyugdij-terv-plusz-ny010-config"
import {
  getSignalNyugdijprogramSn005VariantConfig,
  SIGNAL_NYUGDIJPROGRAM_SN005_MNB_CODE,
  SIGNAL_NYUGDIJPROGRAM_SN005_PRODUCT_CODE,
  SIGNAL_NYUGDIJPROGRAM_SN005_PRODUCT_VARIANT_HUF,
  toSignalNyugdijprogramSn005ProductVariantId,
} from "@/lib/engine/products/signal-nyugdijprogram-sn005-config"
import {
  getSignalOngondoskodasiWl009VariantConfig,
  SIGNAL_ONGONDOSKODASI_WL009_MNB_CODE,
  SIGNAL_ONGONDOSKODASI_WL009_PRODUCT_CODE,
  SIGNAL_ONGONDOSKODASI_WL009_PRODUCT_VARIANT_HUF,
  toSignalOngondoskodasiWl009ProductVariantId,
} from "@/lib/engine/products/signal-ongondoskodasi-wl009-config"
import {
  getUnionViennaAge505VariantConfig,
  resolveUnionViennaAge505Variant,
  toUnionViennaAge505ProductVariantId,
  UNION_VIENNA_AGE_505_MNB_CODE,
  UNION_VIENNA_AGE_505_PRODUCT_CODE_EUR,
  UNION_VIENNA_AGE_505_PRODUCT_CODE_HUF,
  UNION_VIENNA_AGE_505_PRODUCT_CODE_USD,
  UNION_VIENNA_AGE_505_PRODUCT_VARIANT_EUR,
  UNION_VIENNA_AGE_505_PRODUCT_VARIANT_HUF,
  UNION_VIENNA_AGE_505_PRODUCT_VARIANT_USD,
} from "@/lib/engine/products/union-vienna-age-505-config"
import {
  getUnionViennaPlan500VariantConfig,
  resolveUnionViennaPlan500Variant,
  toUnionViennaPlan500ProductVariantId,
  UNION_VIENNA_PLAN_500_MNB_CODE,
  UNION_VIENNA_PLAN_500_PRODUCT_CODE_EUR,
  UNION_VIENNA_PLAN_500_PRODUCT_CODE_HUF,
  UNION_VIENNA_PLAN_500_PRODUCT_CODE_USD,
  UNION_VIENNA_PLAN_500_PRODUCT_VARIANT_EUR,
  UNION_VIENNA_PLAN_500_PRODUCT_VARIANT_HUF,
  UNION_VIENNA_PLAN_500_PRODUCT_VARIANT_USD,
} from "@/lib/engine/products/union-vienna-plan-500-config"
import {
  getUnionViennaTimeVariantConfig,
  resolveUnionViennaTimeVariant,
  toUnionViennaTimeProductVariantId,
  type UnionViennaTimeChannelProfile,
  UNION_VIENNA_TIME_MNB_CODE_564,
  UNION_VIENNA_TIME_MNB_CODE_584,
  UNION_VIENNA_TIME_MNB_CODE_606,
  UNION_VIENNA_TIME_PRODUCT_VARIANT_564,
  UNION_VIENNA_TIME_PRODUCT_VARIANT_584,
  UNION_VIENNA_TIME_PRODUCT_VARIANT_606,
} from "@/lib/engine/products/union-vienna-time-config"
import {
  getUniqaEletcel275VariantConfig,
  toUniqaEletcel275ProductVariantId,
  UNIQA_ELETCEL_275_MNB_CODE,
  UNIQA_ELETCEL_275_PRODUCT_CODE,
  UNIQA_ELETCEL_275_PRODUCT_VARIANT_HUF,
} from "@/lib/engine/products/uniqa-eletcel-275-config"
import {
  getUniqaPremiumLife190VariantConfig,
  toUniqaPremiumLife190ProductVariantId,
  UNIQA_PREMIUM_LIFE_190_MNB_CODE,
  UNIQA_PREMIUM_LIFE_190_PRODUCT_CODE,
  UNIQA_PREMIUM_LIFE_190_PRODUCT_VARIANT_HUF,
} from "@/lib/engine/products/uniqa-premium-life-190-config"
import {
  getGroupamaNextVariantConfig,
  resolveGroupamaNextVariant,
  toGroupamaNextProductVariantId,
  type GroupamaNextVariant,
  GROUPAMA_NEXT_MNB_CODE,
  GROUPAMA_NEXT_PRODUCT_CODE,
  GROUPAMA_NEXT_PRODUCT_VARIANT_UL100_TRAD0,
  GROUPAMA_NEXT_PRODUCT_VARIANT_UL75_TRAD25,
  GROUPAMA_NEXT_PRODUCT_VARIANT_UL0_TRAD100,
} from "@/lib/engine/products/groupama-next-config"
import {
  getGroupamaEasyVariantConfig,
  resolveGroupamaEasyVariant,
  toGroupamaEasyProductVariantId,
  GROUPAMA_EASY_MNB_CODE,
  GROUPAMA_EASY_PRODUCT_CODE,
  GROUPAMA_EASY_PRODUCT_VARIANT_LIFE_HUF,
  GROUPAMA_EASY_PRODUCT_VARIANT_LIFE_TAX_HUF,
} from "@/lib/engine/products/groupama-easy-config"
import { resolveProductContextKey } from "@/lib/column-explanations"

type DurationUnit = "year" | "month" | "day"
type YearlyAccountView = "summary" | "main" | "eseti" | "eseti_immediate_access" | "eseti_tax_eligible"
type FutureInflationMode = "fix" | "converging"
type DurationSource = "dates" | "value"
type ChartParseStatus = "idle" | "processing" | "success" | "error"
type YieldSourceMode = "manual" | "fund" | "ocr"
const INPUT_CURRENCY_OPTIONS: Array<{ value: Currency; label: string }> = [
  { value: "HUF", label: "HUF" },
  { value: "EUR", label: "EUR" },
  { value: "USD", label: "USD" },
]

const MAX_CHART_IMAGE_SIZE_MB = 8
const SUPPORTED_CHART_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"]
const MIN_CHART_SERIES_CONFIDENCE = 0.45
type CalculatorInputs = Omit<
  InputsDaily,
  "yearsPlanned" | "yearlyPaymentsPlan" | "yearlyWithdrawalsPlan" | "taxCreditLimitByYear"
> & {
  currency: Currency
  eurToHufRate: number
  usdToHufRate: number
  regularPayment: number
  annualIndexPercent: number
  keepYearlyPayment: boolean
  stopTaxCreditAfterFirstWithdrawal: boolean
  bonusPercent: number
  bonusStartYear: number
  bonusStopYear: number
}

type ProductPresetBaseline = {
  initialCostByYear: Record<number, number>
  initialCostDefaultPercent: number
  assetBasedFeePercent: number
  assetCostPercentByYear: Record<number, number>
  accountMaintenanceMonthlyPercent: number
  accountMaintenancePercentByYear: Record<number, number>
  adminFeePercentOfPayment: number
  adminFeePercentByYear: Record<number, number>
  bonusOnContributionPercentByYear: Record<number, number>
  refundInitialCostBonusPercentByYear: Record<number, number>
  bonusPercentByYear: Record<number, number>
}

type ExtraServiceFrequency = "daily" | "monthly" | "quarterly" | "semi-annual" | "annual"
type ExtraServiceType = "amount" | "percent"

interface ExtraService {
  id: string
  name: string
  type: ExtraServiceType
  value: number
  frequency: ExtraServiceFrequency
}

interface YieldMonitoringService {
  enabled: boolean
  fundCount: number
}

type FundSeriesPoint = {
  date: string
  price: number
}

function formatIsoDateDot(value: string): string {
  // Avoid String.prototype.replaceAll for broader browser compatibility
  return value.split("-").join(".")
}

function addDaysIsoClient(dateIso: string, deltaDays: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateIso)
  if (!m) return dateIso
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const dt = new Date(y, mo - 1, d, 12, 0, 0, 0)
  dt.setDate(dt.getDate() + deltaDays)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`
}

function addMonthsIsoClient(dateIso: string, deltaMonths: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateIso)
  if (!m) return dateIso
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const dt = new Date(y, mo - 1, d, 12, 0, 0, 0)
  const originalDay = dt.getDate()
  dt.setMonth(dt.getMonth() + deltaMonths)
  // clamp overflow (e.g. Jan 31 -> Feb)
  if (dt.getDate() !== originalDay) dt.setDate(0)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`
}

function minIsoDate(a: string, b: string): string {
  return a <= b ? a : b
}

function resolveCustomEntryYearValue(
  row: any,
  mode: "total" | "client" | "invested" | "taxBonus",
  entryId: string,
): number {
  if (!row || !entryId) return 0
  if (mode === "client") return row.client?.customEntriesById?.[entryId] ?? 0
  if (mode === "invested") return row.invested?.customEntriesById?.[entryId] ?? 0
  if (mode === "taxBonus") return row.taxBonus?.customEntriesById?.[entryId] ?? 0
  return row.customEntriesById?.[entryId] ?? 0
}

type FundSeriesApiResponse = {
  source?: string
  updatedAt?: string
  points?: FundSeriesPoint[]
  stats?: {
    annualizedReturnPercent?: number
  }
  available?: {
    startDate: string
    endDate: string
  }
  effective?: {
    from?: string
    to?: string
  }
  page?: {
    nextCursorTo?: string | null
    earliestTerm?: string
    latestTerm?: string
  }
  error?: string
}

interface ManagementFee {
  id: string
  label: string
  frequency: ManagementFeeFrequency
  valueType: ManagementFeeValueType
  value: number
  valueByYear?: Record<number, number>
  account: "client" | "invested" | "taxBonus" | "main" | "eseti"
}

interface Bonus {
  id: string
  valueType: "percent" | "amount"
  value: number
  label?: string
  valueByYear?: Record<number, number>
  account: "client" | "invested" | "taxBonus" | "main" | "eseti"
}

type CustomEntryKind = "cost" | "bonus"
type CustomEntryAccount = "client" | "invested" | "taxBonus" | "main" | "eseti"
type CustomEntryValueType = "percent" | "amount"

type CustomEntryDefinition = {
  id: string
  label: string
  kind: CustomEntryKind
  valueType: CustomEntryValueType
  value: number
  valueByYear?: Record<number, number>
  account: CustomEntryAccount
  frequency?: ManagementFeeFrequency
  startYear?: number
  stopYear?: number
}

// Added product metadata types
interface ProductMetadata {
  value: string
  label: string
  productType: string
  mnbCode: string
  productCode: string
  variants?: ProductVariantMetadata[]
}

interface ProductVariantMetadata {
  value: string
  label: string
  productType: string
  mnbCode: string
  productCode: string
}

// Added taxBonus view mode to YearRow type
type YearRow = {
  year: number
  totalContributions: number
  endBalance: number
  interestForYear: number
  costForYear: number
  upfrontCostForYear: number
  adminCostForYear: number
  accountMaintenanceCostForYear: number
  managementFeeCostForYear: number
  assetBasedCostForYear: number
  plusCostForYear: number
  wealthBonusForYear: number
  taxCreditForYear: number
  withdrawalForYear: number
  surrenderCharge: number
  surrenderValue: number
  endingInvestedValue: number
  endingClientValue: number
  endingTaxBonusValue?: number // Added for tooltip display
  customEntriesById?: Record<string, number>
  client: {
    endBalance: number
    interestForYear: number
    costForYear: number
    assetBasedCostForYear: number
    plusCostForYear: number
    wealthBonusForYear: number
    customEntriesById?: Record<string, number>
  }
  invested: {
    endBalance: number
    interestForYear: number
    costForYear: number
    assetBasedCostForYear: number
    plusCostForYear: number
    wealthBonusForYear: number
    customEntriesById?: Record<string, number>
  }
  taxBonus: {
    endBalance: number
    interestForYear: number
    costForYear: number
    assetBasedCostForYear: number
    plusCostForYear: number
    wealthBonusForYear: number
    customEntriesById?: Record<string, number>
  }
}
// </CHANGE>

type NetRow = {
  year: number
  grossBalance: number
  grossProfit: number
  taxRate: number
  taxDeduction: number
  netProfit: number
  netBalance: number
}

const DAYS_IN_TAX_YEAR = 365

const mainTaxRateByDays = (holdingDays: number, isCorporate: boolean) => {
  if (holdingDays <= 5 * DAYS_IN_TAX_YEAR) return isCorporate ? 0.15 : 0.28
  if (holdingDays <= 10 * DAYS_IN_TAX_YEAR) return isCorporate ? 0.075 : 0.14
  return 0
}

const esetiTaxRateByLotAgeDays = (ageDays: number, isCorporate: boolean) => {
  if (ageDays <= 3 * DAYS_IN_TAX_YEAR) return isCorporate ? 0.15 : 0.28
  if (ageDays <= 5 * DAYS_IN_TAX_YEAR) return isCorporate ? 0.075 : 0.14
  return 0
}

function calculateNetValuesMain(
  yearlyBreakdown: Array<{ year: number; endBalance: number; totalContributions: number; periodDays?: number }>,
  isCorporate: boolean,
): NetRow[] {
  let elapsedDays = 0
  return yearlyBreakdown.map((row) => {
    const rowDays = Math.max(0, Number.isFinite(row.periodDays) ? Number(row.periodDays) : DAYS_IN_TAX_YEAR)
    elapsedDays += rowDays
    const totalContributions = Number.isFinite(row.totalContributions) ? row.totalContributions : 0
    const grossProfit = row.endBalance - totalContributions
    const taxRate = mainTaxRateByDays(elapsedDays, isCorporate)
    const taxDeduction = grossProfit > 0 ? grossProfit * taxRate : 0
    const netProfit = grossProfit - taxDeduction
    const netBalance = totalContributions + netProfit

    return {
      year: row.year,
      grossBalance: row.endBalance,
      grossProfit,
      taxRate,
      taxDeduction,
      netProfit,
      netBalance,
    }
  })
}

function calculateNetValuesEseti(
  yearlyBreakdown: Array<{
    year: number
    endBalance: number
    totalContributions: number
    withdrawalForYear?: number
    periodDays?: number
  }>,
  isCorporate: boolean,
): NetRow[] {
  type Lot = { contributionDay: number; principalRemaining: number }
  const lots: Lot[] = []
  let previousTotalContributions = 0
  let elapsedDays = 0

  return yearlyBreakdown.map((row) => {
    const rowDays = Math.max(0, Number.isFinite(row.periodDays) ? Number(row.periodDays) : DAYS_IN_TAX_YEAR)
    elapsedDays += rowDays
    const totalContributions = Number.isFinite(row.totalContributions) ? row.totalContributions : 0
    const paymentThisYear = Math.max(0, totalContributions - previousTotalContributions)
    previousTotalContributions = totalContributions

    if (paymentThisYear > 0) {
      lots.push({ contributionDay: elapsedDays, principalRemaining: paymentThisYear })
    }

    const withdrawalThisYear = Math.max(0, row.withdrawalForYear ?? 0)
    if (withdrawalThisYear > 0) {
      const principalBeforeWithdrawal = lots.reduce((sum, lot) => sum + lot.principalRemaining, 0)
      if (principalBeforeWithdrawal > 0) {
        const reductionFactor = Math.max(0, (principalBeforeWithdrawal - withdrawalThisYear) / principalBeforeWithdrawal)
        for (const lot of lots) {
          lot.principalRemaining *= reductionFactor
        }
      }
    }

    const remainingPrincipal = lots.reduce((sum, lot) => sum + lot.principalRemaining, 0)
    const grossProfit = row.endBalance - remainingPrincipal

    const weightedTaxBase = lots.reduce((sum, lot) => {
      if (lot.principalRemaining <= 0) return sum
      const lotAgeDays = Math.max(0, elapsedDays - lot.contributionDay)
      return sum + lot.principalRemaining * esetiTaxRateByLotAgeDays(lotAgeDays, isCorporate)
    }, 0)
    const taxRate = remainingPrincipal > 0 ? weightedTaxBase / remainingPrincipal : 0

    const taxDeduction = grossProfit > 0 ? grossProfit * taxRate : 0
    const netProfit = grossProfit - taxDeduction
    const netBalance = remainingPrincipal + netProfit

    return {
      year: row.year,
      grossBalance: row.endBalance,
      grossProfit,
      taxRate,
      taxDeduction,
      netProfit,
      netBalance,
    }
  })
}

function combineNetRows(mainRows: NetRow[], esetiRows: NetRow[]): NetRow[] {
  const maxLength = Math.max(mainRows.length, esetiRows.length)
  const rows: NetRow[] = []
  for (let index = 0; index < maxLength; index++) {
    const main = mainRows[index]
    const eseti = esetiRows[index]
    const grossBalance = (main?.grossBalance ?? 0) + (eseti?.grossBalance ?? 0)
    const grossProfit = (main?.grossProfit ?? 0) + (eseti?.grossProfit ?? 0)
    const taxDeduction = (main?.taxDeduction ?? 0) + (eseti?.taxDeduction ?? 0)
    const netProfit = grossProfit - taxDeduction
    const netBalance = (main?.netBalance ?? 0) + (eseti?.netBalance ?? 0)
    rows.push({
      year: main?.year ?? eseti?.year ?? index + 1,
      grossBalance,
      grossProfit,
      taxRate: grossProfit > 0 ? taxDeduction / grossProfit : 0,
      taxDeduction,
      netProfit,
      netBalance,
    })
  }
  return rows
}

const buildCumulativeByYear = (yearlyBreakdown: Array<any> = []) => {
  const map: Record<number, any> = {}
  let acc = {
    interestForYear: 0,
    costForYear: 0,
    upfrontCostForYear: 0,
    adminCostForYear: 0,
    accountMaintenanceCostForYear: 0,
    managementFeeCostForYear: 0,
    assetBasedCostForYear: 0,
    plusCostForYear: 0,
    bonusForYear: 0,
    wealthBonusForYear: 0,
    taxCreditForYear: 0,
    withdrawalForYear: 0,
    riskInsuranceCostForYear: 0,
    client: {
      interestForYear: 0,
      costForYear: 0,
      assetBasedCostForYear: 0,
      plusCostForYear: 0,
      bonusForYear: 0,
      wealthBonusForYear: 0,
    },
    invested: {
      interestForYear: 0,
      costForYear: 0,
      assetBasedCostForYear: 0,
      plusCostForYear: 0,
      bonusForYear: 0,
      wealthBonusForYear: 0,
    },
    taxBonus: {
      interestForYear: 0,
      costForYear: 0,
      assetBasedCostForYear: 0,
      plusCostForYear: 0,
      bonusForYear: 0,
      wealthBonusForYear: 0,
    },
  }

  for (const row of yearlyBreakdown) {
    if (!row) continue
    acc = {
      interestForYear: acc.interestForYear + (row.interestForYear ?? 0),
      costForYear: acc.costForYear + (row.costForYear ?? 0),
      upfrontCostForYear: acc.upfrontCostForYear + (row.upfrontCostForYear ?? 0),
      adminCostForYear: acc.adminCostForYear + (row.adminCostForYear ?? 0),
      accountMaintenanceCostForYear: acc.accountMaintenanceCostForYear + (row.accountMaintenanceCostForYear ?? 0),
      managementFeeCostForYear: acc.managementFeeCostForYear + (row.managementFeeCostForYear ?? 0),
      assetBasedCostForYear: acc.assetBasedCostForYear + (row.assetBasedCostForYear ?? 0),
      plusCostForYear: acc.plusCostForYear + (row.plusCostForYear ?? 0),
      bonusForYear: acc.bonusForYear + (row.bonusForYear ?? 0),
      wealthBonusForYear: acc.wealthBonusForYear + (row.wealthBonusForYear ?? 0),
      taxCreditForYear: acc.taxCreditForYear + (row.taxCreditForYear ?? 0),
      withdrawalForYear: acc.withdrawalForYear + (row.withdrawalForYear ?? 0),
      riskInsuranceCostForYear: acc.riskInsuranceCostForYear + (row.riskInsuranceCostForYear ?? 0),
      client: {
        interestForYear: acc.client.interestForYear + (row.client?.interestForYear ?? 0),
        costForYear: acc.client.costForYear + (row.client?.costForYear ?? 0),
        assetBasedCostForYear: acc.client.assetBasedCostForYear + (row.client?.assetBasedCostForYear ?? 0),
        plusCostForYear: acc.client.plusCostForYear + (row.client?.plusCostForYear ?? 0),
        bonusForYear: acc.client.bonusForYear + (row.client?.bonusForYear ?? 0),
        wealthBonusForYear: acc.client.wealthBonusForYear + (row.client?.wealthBonusForYear ?? 0),
      },
      invested: {
        interestForYear: acc.invested.interestForYear + (row.invested?.interestForYear ?? 0),
        costForYear: acc.invested.costForYear + (row.invested?.costForYear ?? 0),
        assetBasedCostForYear: acc.invested.assetBasedCostForYear + (row.invested?.assetBasedCostForYear ?? 0),
        plusCostForYear: acc.invested.plusCostForYear + (row.invested?.plusCostForYear ?? 0),
        bonusForYear: acc.invested.bonusForYear + (row.invested?.bonusForYear ?? 0),
        wealthBonusForYear: acc.invested.wealthBonusForYear + (row.invested?.wealthBonusForYear ?? 0),
      },
      taxBonus: {
        interestForYear: acc.taxBonus.interestForYear + (row.taxBonus?.interestForYear ?? 0),
        costForYear: acc.taxBonus.costForYear + (row.taxBonus?.costForYear ?? 0),
        assetBasedCostForYear: acc.taxBonus.assetBasedCostForYear + (row.taxBonus?.assetBasedCostForYear ?? 0),
        plusCostForYear: acc.taxBonus.plusCostForYear + (row.taxBonus?.plusCostForYear ?? 0),
        bonusForYear: acc.taxBonus.bonusForYear + (row.taxBonus?.bonusForYear ?? 0),
        wealthBonusForYear: acc.taxBonus.wealthBonusForYear + (row.taxBonus?.wealthBonusForYear ?? 0),
      },
    }

    map[row.year] = {
      ...row,
      interestForYear: acc.interestForYear,
      costForYear: acc.costForYear,
      upfrontCostForYear: acc.upfrontCostForYear,
      adminCostForYear: acc.adminCostForYear,
      accountMaintenanceCostForYear: acc.accountMaintenanceCostForYear,
      managementFeeCostForYear: acc.managementFeeCostForYear,
      assetBasedCostForYear: acc.assetBasedCostForYear,
      plusCostForYear: acc.plusCostForYear,
      bonusForYear: acc.bonusForYear,
      wealthBonusForYear: acc.wealthBonusForYear,
      taxCreditForYear: acc.taxCreditForYear,
      withdrawalForYear: acc.withdrawalForYear,
      riskInsuranceCostForYear: acc.riskInsuranceCostForYear,
      client: {
        ...row.client,
        interestForYear: acc.client.interestForYear,
        costForYear: acc.client.costForYear,
        assetBasedCostForYear: acc.client.assetBasedCostForYear,
        plusCostForYear: acc.client.plusCostForYear,
        bonusForYear: acc.client.bonusForYear,
        wealthBonusForYear: acc.client.wealthBonusForYear,
      },
      invested: {
        ...row.invested,
        interestForYear: acc.invested.interestForYear,
        costForYear: acc.invested.costForYear,
        assetBasedCostForYear: acc.invested.assetBasedCostForYear,
        plusCostForYear: acc.invested.plusCostForYear,
        bonusForYear: acc.invested.bonusForYear,
        wealthBonusForYear: acc.invested.wealthBonusForYear,
      },
      taxBonus: {
        ...row.taxBonus,
        interestForYear: acc.taxBonus.interestForYear,
        costForYear: acc.taxBonus.costForYear,
        assetBasedCostForYear: acc.taxBonus.assetBasedCostForYear,
        plusCostForYear: acc.taxBonus.plusCostForYear,
        bonusForYear: acc.taxBonus.bonusForYear,
        wealthBonusForYear: acc.taxBonus.wealthBonusForYear,
      },
    }
  }

  return map
}

const numeric = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : 0)

const mergeYearRows = (mainRow?: any, esetiRow?: any) => {
  const main = mainRow ?? {}
  const eseti = esetiRow ?? {}
  const periodType = main.periodType === "partial" || eseti.periodType === "partial" ? "partial" : "year"
  const periodMonths = Math.max(0, Number(main.periodMonths ?? 0), Number(eseti.periodMonths ?? 0))
  const periodDays = Math.max(0, Number(main.periodDays ?? 0), Number(eseti.periodDays ?? 0))
  const periodLabel = periodType === "partial" ? undefined : (main.periodLabel ?? eseti.periodLabel)

  return {
    year: main.year ?? eseti.year ?? 0,
    periodType,
    periodMonths: periodType === "partial" ? Math.max(0, periodMonths) : 12,
    periodDays: periodType === "partial" ? periodDays || Math.round((periodMonths * 365) / 12) : 365,
    periodLabel,
    yearlyPayment: numeric(main.yearlyPayment) + numeric(eseti.yearlyPayment),
    totalContributions: numeric(main.totalContributions) + numeric(eseti.totalContributions),
    interestForYear: numeric(main.interestForYear) + numeric(eseti.interestForYear),
    costForYear: numeric(main.costForYear) + numeric(eseti.costForYear),
    upfrontCostForYear: numeric(main.upfrontCostForYear) + numeric(eseti.upfrontCostForYear),
    adminCostForYear: numeric(main.adminCostForYear) + numeric(eseti.adminCostForYear),
    accountMaintenanceCostForYear:
      numeric(main.accountMaintenanceCostForYear) + numeric(eseti.accountMaintenanceCostForYear),
    managementFeeCostForYear: numeric(main.managementFeeCostForYear) + numeric(eseti.managementFeeCostForYear),
    assetBasedCostForYear: numeric(main.assetBasedCostForYear) + numeric(eseti.assetBasedCostForYear),
    plusCostForYear: numeric(main.plusCostForYear) + numeric(eseti.plusCostForYear),
    bonusForYear: numeric(main.bonusForYear) + numeric(eseti.bonusForYear),
    wealthBonusForYear: numeric(main.wealthBonusForYear) + numeric(eseti.wealthBonusForYear),
    taxCreditForYear: numeric(main.taxCreditForYear) + numeric(eseti.taxCreditForYear),
    withdrawalForYear: numeric(main.withdrawalForYear) + numeric(eseti.withdrawalForYear),
    riskInsuranceCostForYear: numeric(main.riskInsuranceCostForYear) + numeric(eseti.riskInsuranceCostForYear),
    endBalance: numeric(main.endBalance) + numeric(eseti.endBalance),
    endingInvestedValue: numeric(main.endingInvestedValue) + numeric(eseti.endingInvestedValue),
    endingClientValue: numeric(main.endingClientValue) + numeric(eseti.endingClientValue),
    endingTaxBonusValue: numeric(main.endingTaxBonusValue) + numeric(eseti.endingTaxBonusValue),
    surrenderValue: numeric(main.surrenderValue) + numeric(eseti.surrenderValue),
    surrenderCharge: numeric(main.surrenderCharge) + numeric(eseti.surrenderCharge),
    client: {
      endBalance: numeric(main.client?.endBalance) + numeric(eseti.client?.endBalance),
      interestForYear: numeric(main.client?.interestForYear) + numeric(eseti.client?.interestForYear),
      costForYear: numeric(main.client?.costForYear) + numeric(eseti.client?.costForYear),
      assetBasedCostForYear: numeric(main.client?.assetBasedCostForYear) + numeric(eseti.client?.assetBasedCostForYear),
      plusCostForYear: numeric(main.client?.plusCostForYear) + numeric(eseti.client?.plusCostForYear),
      bonusForYear: numeric(main.client?.bonusForYear) + numeric(eseti.client?.bonusForYear),
      wealthBonusForYear: numeric(main.client?.wealthBonusForYear) + numeric(eseti.client?.wealthBonusForYear),
    },
    invested: {
      endBalance: numeric(main.invested?.endBalance) + numeric(eseti.invested?.endBalance),
      interestForYear: numeric(main.invested?.interestForYear) + numeric(eseti.invested?.interestForYear),
      costForYear: numeric(main.invested?.costForYear) + numeric(eseti.invested?.costForYear),
      assetBasedCostForYear:
        numeric(main.invested?.assetBasedCostForYear) + numeric(eseti.invested?.assetBasedCostForYear),
      plusCostForYear: numeric(main.invested?.plusCostForYear) + numeric(eseti.invested?.plusCostForYear),
      bonusForYear: numeric(main.invested?.bonusForYear) + numeric(eseti.invested?.bonusForYear),
      wealthBonusForYear: numeric(main.invested?.wealthBonusForYear) + numeric(eseti.invested?.wealthBonusForYear),
    },
    taxBonus: {
      endBalance: numeric(main.taxBonus?.endBalance) + numeric(eseti.taxBonus?.endBalance),
      interestForYear: numeric(main.taxBonus?.interestForYear) + numeric(eseti.taxBonus?.interestForYear),
      costForYear: numeric(main.taxBonus?.costForYear) + numeric(eseti.taxBonus?.costForYear),
      assetBasedCostForYear:
        numeric(main.taxBonus?.assetBasedCostForYear) + numeric(eseti.taxBonus?.assetBasedCostForYear),
      plusCostForYear: numeric(main.taxBonus?.plusCostForYear) + numeric(eseti.taxBonus?.plusCostForYear),
      bonusForYear: numeric(main.taxBonus?.bonusForYear) + numeric(eseti.taxBonus?.bonusForYear),
      wealthBonusForYear: numeric(main.taxBonus?.wealthBonusForYear) + numeric(eseti.taxBonus?.wealthBonusForYear),
    },
  }
}

const MOBILE_LAYOUT = {
  settingsRow1: "grid items-end gap-2 grid-cols-2 min-[430px]:grid-cols-10 md:grid-cols-12",
  settingsRow2: "grid items-end gap-2 grid-cols-2 min-[430px]:grid-cols-10 md:grid-cols-12",
  settingsField: "col-span-1 min-[430px]:col-span-2 min-w-0 space-y-1 md:col-span-2",
  settingsPaymentField: "col-span-1 min-[430px]:col-span-4 min-w-0 space-y-1 md:col-span-6",
  settingsYieldField: "col-span-2 min-[430px]:col-span-6 min-w-0 space-y-1 md:col-span-8",
  yearlyEditableGrid: "grid gap-2 mb-3 grid-cols-1 min-[390px]:grid-cols-2",
  yearlySecondaryGrid: "grid gap-2 grid-cols-1 min-[390px]:grid-cols-2",
  inputHeight: "h-10 md:h-11",
} as const

const SETTINGS_UI = {
  cardBase: "border-border/70 shadow-sm",
  cardEseti: "border-orange-200/90 bg-orange-50/40 dark:border-orange-800/50 dark:bg-orange-950/15",
  header: "flex flex-row items-center justify-between pb-3 md:pb-4",
  title: "text-lg md:text-xl font-semibold tracking-tight flex items-center gap-2",
  titleSuffix: "text-sm font-normal text-muted-foreground/70",
  navButton: "h-8 w-8 text-muted-foreground hover:text-foreground",
  formGroup: "rounded-xl border border-border/60 bg-muted/20 p-3 sm:p-4 space-y-3.5",
  field: "rounded-lg border-border/80 bg-background/95",
  label: "text-xs text-muted-foreground",
  helper: "text-[11px] text-muted-foreground",
} as const

const formatPartialPeriodLabel = (periodDaysRaw: number) => {
  const safeDays = Math.max(1, Math.round(periodDaysRaw))
  const monthLengthDays = 365 / 12

  let months = Math.floor(safeDays / monthLengthDays)
  let remDays = Math.round(safeDays - months * monthLengthDays)

  if (remDays >= Math.round(monthLengthDays)) {
    months += 1
    remDays = 0
  }

  if (months <= 0) return `+${safeDays} nap`
  if (remDays <= 0) return `+${months} hónap`
  return `+${months} hónap és ${remDays} nap`
}

const getYearRowLabel = (row: any) => {
  if (row?.periodType === "partial") {
    const days = Number(row?.periodDays ?? 0)
    return formatPartialPeriodLabel(days > 0 ? days : 1)
  }
  if (row?.periodLabel) return row.periodLabel
  return `${row?.year ?? 0}. év`
}

const formatHuDate = (date: Date): string => {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`
}

const parseHuDateInput = (raw: string): Date | null => {
  const value = raw.trim()
  if (!value) return null

  // Supported formats:
  // - YYYY.MM.DD (preferred for display)
  // - YYYY-MM-DD (ISO-like)
  // - YYYYMMDD (dotless for fast typing)
  const dot = value.match(/^(\d{4})\.(\d{2})\.(\d{2})$/)
  const dash = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const plain = value.match(/^(\d{4})(\d{2})(\d{2})$/)
  const match = dot || dash || plain
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  const date = new Date(year, month - 1, day)
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

const convertDurationValue = (value: number, fromUnit: DurationUnit, toUnit: DurationUnit): number => {
  const safeValue = Number.isFinite(value) ? value : 0
  const totalDays =
    fromUnit === "year" ? safeValue * 365 : fromUnit === "month" ? safeValue * (365 / 12) : safeValue
  const converted =
    toUnit === "year" ? totalDays / 365 : toUnit === "month" ? totalDays / (365 / 12) : totalDays
  return Math.max(1, Math.round(converted))
}

function MobileYearCard({
  row,
  planIndex,
  planPayment,
  indexByYear,
  paymentByYear,
  withdrawalByYear,
  taxCreditLimitByYear,
  displayCurrency,
  resultsCurrency,
  eurToHufRate,
  enableTaxCredit,
  editingFields,
  setFieldEditing,
  updateIndex,
  updatePayment,
  updateWithdrawal,
  updateTaxCreditLimit,
  formatValue,
  getRealValueForDays,
  realValueElapsedDays,
  enableNetting,
  netData,
  riskInsuranceCostForYear,
  isAccountSplitOpen,
  isRedemptionOpen,
  plusCostByYear,
  inputs,
  updatePlusCost,
  assetCostPercentByYear,
  updateAssetCostPercent,
  bonusPercentByYear,
  updateBonusPercent,
  yearlyViewMode, // Added prop
  yearlyAccountView,
  cumulativeByYear,
  shouldApplyTaxCreditPenalty,
  isTaxBonusSeparateAccount, // Added prop
  showSurrenderAsPrimary,
}: {
  row: any
  planIndex: Record<number, number>
  planPayment: Record<number, number>
  indexByYear: Record<number, number>
  paymentByYear: Record<number, number>
  withdrawalByYear: Record<number, number>
  taxCreditLimitByYear: Record<number, number>
  displayCurrency: Currency
  resultsCurrency: Currency
  eurToHufRate: number
  enableTaxCredit: boolean
  editingFields: Record<string, boolean | undefined>
  setFieldEditing: (field: string, isEditing: boolean) => void
  updateIndex: (year: number, value: number) => void
  updatePayment: (year: number, value: number) => void
  updateWithdrawal: (year: number, value: number) => void
  updateTaxCreditLimit: (year: number, value: number) => void
  formatValue: (value: number, currency: Currency) => string
  getRealValueForDays?: (value: number, elapsedDays: number) => number
  realValueElapsedDays?: number
  enableNetting?: boolean
  netData?: {
    grossBalance: number
    grossProfit: number
    taxRate: number
    taxDeduction: number
    netProfit: number
    netBalance: number
  }
  riskInsuranceCostForYear?: number
  isAccountSplitOpen?: boolean
  isRedemptionOpen?: boolean
  plusCostByYear?: Record<number, number>
  inputs?: any
  updatePlusCost?: (year: number, value: number) => void
  assetCostPercentByYear?: Record<number, number>
  updateAssetCostPercent?: (year: number, value: number) => void
  bonusPercentByYear?: Record<number, number>
  updateBonusPercent?: (year: number, percent: number) => void
  yearlyViewMode?: "total" | "client" | "invested" | "taxBonus" // Added prop
  yearlyAccountView?: YearlyAccountView
  cumulativeByYear?: Record<number, any>
  shouldApplyTaxCreditPenalty?: boolean
  isTaxBonusSeparateAccount?: boolean // Added prop
  showSurrenderAsPrimary?: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const currentIndex = planIndex[row.year]
  const currentPayment = planPayment[row.year]
  const currentWithdrawal = withdrawalByYear[row.year] || 0
  const currentTaxCreditLimit = taxCreditLimitByYear[row.year]

  const isIndexModified = indexByYear[row.year] !== undefined
  const isPaymentModified = paymentByYear[row.year] !== undefined
  const isWithdrawalModified = withdrawalByYear[row.year] !== undefined
  const isTaxCreditLimited = currentTaxCreditLimit !== undefined
  const isYearlyReadOnly = yearlyAccountView === "summary"
  const isPartialReadOnly = row.periodType === "partial"
  const isRowReadOnly = isYearlyReadOnly || isPartialReadOnly
  const isEsetiView =
    yearlyAccountView === "eseti" ||
    yearlyAccountView === "eseti_immediate_access" ||
    yearlyAccountView === "eseti_tax_eligible"
  const effectiveYearlyViewMode =
    yearlyAccountView === "main" && isAccountSplitOpen ? yearlyViewMode : "total"
  const isAlfaExclusivePlusVariant =
    typeof inputs?.productVariant === "string" && inputs.productVariant.startsWith("alfa_exclusive_plus")
  const shouldShowAcquisitionInCurrentView =
    !(isAlfaExclusivePlusVariant && isAccountSplitOpen && effectiveYearlyViewMode !== "total")
  const hideAssetFeeBreakdownInCurrentView =
    !!isAccountSplitOpen && !isEsetiView && effectiveYearlyViewMode === "total"
  const defaultAssetPercentForView =
    isAlfaExclusivePlusVariant && effectiveYearlyViewMode === "invested"
      ? 0.145
      : isAlfaExclusivePlusVariant && effectiveYearlyViewMode === "taxBonus"
        ? 0.145
        : (assetCostPercentByYear?.[row.year] ?? inputs?.assetBasedFeePercent ?? 0)
  const shouldShowTaxCreditInCurrentView =
    !!enableTaxCredit && !(isAlfaExclusivePlusVariant && effectiveYearlyViewMode !== "taxBonus")
  const effectiveCurrentIndex = isEsetiView ? indexByYear?.[row.year] ?? currentIndex ?? 0 : currentIndex
  const effectiveCurrentPayment = isEsetiView ? paymentByYear?.[row.year] ?? currentPayment ?? 0 : currentPayment
  const paymentInputValue = isPartialReadOnly ? row.yearlyPayment ?? 0 : effectiveCurrentPayment

  let displayData = {
    endBalance: row.endBalance,
    interestForYear: row.interestForYear,
    costForYear: row.costForYear,
    upfrontCostForYear: row.upfrontCostForYear ?? 0,
    adminCostForYear: row.adminCostForYear ?? 0,
    accountMaintenanceCostForYear: row.accountMaintenanceCostForYear ?? 0,
    managementFeeCostForYear: row.managementFeeCostForYear ?? 0,
    assetBasedCostForYear: row.assetBasedCostForYear,
    plusCostForYear: row.plusCostForYear,
    bonusForYear: row.bonusForYear,
    wealthBonusForYear: row.wealthBonusForYear,
  }

  if (effectiveYearlyViewMode === "client") {
    displayData = {
      endBalance: row.client.endBalance,
      interestForYear: row.client.interestForYear,
      costForYear: row.client.costForYear,
      upfrontCostForYear: 0,
      adminCostForYear: 0,
      accountMaintenanceCostForYear: 0,
      managementFeeCostForYear: 0,
      assetBasedCostForYear: row.client.assetBasedCostForYear,
      plusCostForYear: row.client.plusCostForYear,
      bonusForYear: row.client.bonusForYear,
      wealthBonusForYear: row.client.wealthBonusForYear,
    }
  } else if (effectiveYearlyViewMode === "invested") {
    displayData = {
      endBalance: row.invested.endBalance,
      interestForYear: row.invested.interestForYear,
      costForYear: row.invested.costForYear,
      upfrontCostForYear: 0,
      adminCostForYear: 0,
      accountMaintenanceCostForYear: 0,
      managementFeeCostForYear: 0,
      assetBasedCostForYear: row.invested.assetBasedCostForYear,
      plusCostForYear: row.invested.plusCostForYear,
      bonusForYear: row.invested.bonusForYear,
      wealthBonusForYear: row.invested.wealthBonusForYear,
    }
  } else if (effectiveYearlyViewMode === "taxBonus") {
    displayData = {
      endBalance: row.taxBonus.endBalance,
      interestForYear: row.taxBonus.interestForYear,
      costForYear: row.taxBonus.costForYear,
      upfrontCostForYear: 0,
      adminCostForYear: 0,
      accountMaintenanceCostForYear: 0,
      managementFeeCostForYear: 0,
      assetBasedCostForYear: row.taxBonus.assetBasedCostForYear,
      plusCostForYear: row.taxBonus.plusCostForYear,
      bonusForYear: row.taxBonus.bonusForYear,
      wealthBonusForYear: row.taxBonus.wealthBonusForYear,
    }
  }
  // </CHANGE>

  if (isEsetiView) {
    displayData = {
      ...displayData,
      costForYear: 0,
      upfrontCostForYear: 0,
      adminCostForYear: 0,
      accountMaintenanceCostForYear: 0,
      managementFeeCostForYear: 0,
      assetBasedCostForYear: 0,
      plusCostForYear: 0,
      bonusForYear: 0,
      wealthBonusForYear: 0,
    }
  }

  const cumulativeRow = cumulativeByYear?.[row.year] ?? row
  let displayBalance = enableNetting && netData ? netData.netBalance : displayData.endBalance
  if (shouldApplyTaxCreditPenalty) {
    displayBalance = Math.max(0, displayBalance - (cumulativeRow.taxCreditForYear ?? 0) * 1.2)
  }
  const effectiveWithdrawn = row.withdrawalForYear ?? currentWithdrawal
  const preWithdrawalBalance = displayBalance + effectiveWithdrawn
  const maxWithdrawalDisplay = convertForDisplay(preWithdrawalBalance, resultsCurrency, displayCurrency, eurToHufRate)
  displayBalance = Math.max(0, preWithdrawalBalance - effectiveWithdrawn)
  const applyRealValue = (value: number) =>
    getRealValueForDays ? getRealValueForDays(value, Math.max(0, realValueElapsedDays ?? 0)) : value
  const primaryDisplayValue = showSurrenderAsPrimary ? row.surrenderValue ?? displayBalance : displayBalance

  const showBreakdown = isAccountSplitOpen || isRedemptionOpen

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="font-semibold text-lg">{getYearRowLabel(row)}</div>
          <div className="text-2xl font-bold tabular-nums">
            {formatValue(applyRealValue(primaryDisplayValue), displayCurrency)}
          </div>
          {showBreakdown && (
            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
              {/* CASE A: Split is open - show full breakdown */}
              {isAccountSplitOpen && row.endingInvestedValue !== undefined && row.endingClientValue !== undefined && (
                <>
                  <div>Lejárati többletdíj: {formatValue(applyRealValue(row.endingInvestedValue), displayCurrency)}</div>
                  <div>Ügyfélérték: {formatValue(applyRealValue(row.endingClientValue), displayCurrency)}</div>
                  {isTaxBonusSeparateAccount && row.endingTaxBonusValue > 0 && (
                    <div>Adójóváírás: {formatValue(applyRealValue(row.endingTaxBonusValue), displayCurrency)}</div>
                  )}
                  {/* </CHANGE> */}
                  <div className="font-medium">
                    Összesen: {formatValue(applyRealValue(displayBalance), displayCurrency)}
                  </div>
                  {isRedemptionOpen && row.surrenderCharge > 0 && (
                    <>
                      <div className="text-orange-600 dark:text-orange-400">
                        Visszavásárlási költség: {formatValue(applyRealValue(row.surrenderCharge), displayCurrency)}
                      </div>
                      <div className="text-orange-600 dark:text-orange-400">
                        Visszavásárlási érték: {formatValue(applyRealValue(row.surrenderValue), displayCurrency)}
                      </div>
                    </>
                  )}
                </>
              )}
              {/* CASE B: Split is closed but redemption is open - show only redemption value */}
              {!isAccountSplitOpen && isRedemptionOpen && row.surrenderCharge > 0 && (
                <div className="text-orange-600 dark:text-orange-400">
                  Visszavásárlási érték: {formatValue(applyRealValue(row.surrenderValue), displayCurrency)}
                </div>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted-foreground hover:text-foreground p-2 -mr-2"
        >
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {/* Always visible: editable fields */}
      <div className={`${isYearlyReadOnly ? "grid grid-cols-1" : MOBILE_LAYOUT.yearlyEditableGrid} ${isRowReadOnly ? "opacity-60 pointer-events-none" : ""}`}>
        {!isYearlyReadOnly && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Indexálás (%)</Label>
            <Input
              type="text"
              inputMode="numeric"
              disabled={isRowReadOnly}
              value={
                editingFields[`index-${row.year}`]
                  ? String(effectiveCurrentIndex)
                  : formatNumber(effectiveCurrentIndex)
              }
              onFocus={() => setFieldEditing(`index-${row.year}`, true)}
              onBlur={() => setFieldEditing(`index-${row.year}`, false)}
              onChange={(e) => {
                const parsed = parseNumber(e.target.value)
                if (!isNaN(parsed)) updateIndex(row.year, parsed)
              }}
              className={`${MOBILE_LAYOUT.inputHeight} text-base tabular-nums ${isIndexModified ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
            />
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Befizetés / év</Label>
          <Input
            type="text"
            inputMode="numeric"
            disabled={isRowReadOnly}
            value={
              editingFields[`payment-${row.year}`]
                ? String(
                    Math.round(convertForDisplay(paymentInputValue, resultsCurrency, displayCurrency, eurToHufRate)),
                  )
                : formatNumber(
                    Math.round(convertForDisplay(paymentInputValue, resultsCurrency, displayCurrency, eurToHufRate)),
                  )
            }
            onFocus={() => setFieldEditing(`payment-${row.year}`, true)}
            onBlur={() => setFieldEditing(`payment-${row.year}`, false)}
            onChange={(e) => {
              const parsed = parseNumber(e.target.value)
              if (!isNaN(parsed)) updatePayment(row.year, parsed) // Fixed: 'year' to 'row.year'
            }}
            className={`${MOBILE_LAYOUT.inputHeight} text-base tabular-nums ${isPaymentModified ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
          />
        </div>
      </div>

      <div className={`${enableTaxCredit ? MOBILE_LAYOUT.yearlySecondaryGrid : "grid gap-3 grid-cols-1"} ${isPartialReadOnly ? "opacity-60" : ""}`}>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Pénzkivonás</Label>
          <Input
            type="text"
            inputMode="numeric"
            disabled={isRowReadOnly}
            value={
              editingFields[`withdrawal-${row.year}`]
                ? String(
                    Math.round(convertForDisplay(currentWithdrawal, resultsCurrency, displayCurrency, eurToHufRate)),
                  )
                : formatNumber(
                    Math.round(convertForDisplay(currentWithdrawal, resultsCurrency, displayCurrency, eurToHufRate)),
                  )
            }
            onFocus={() => setFieldEditing(`withdrawal-${row.year}`, true)}
            onBlur={() => setFieldEditing(`withdrawal-${row.year}`, false)}
            onChange={(e) => {
              const parsed = parseNumber(e.target.value)
              if (!isNaN(parsed)) {
                const capped = Math.min(parsed, maxWithdrawalDisplay)
                updateWithdrawal(row.year, capped)
              }
            }}
            className={`${MOBILE_LAYOUT.inputHeight} text-base tabular-nums ${isWithdrawalModified ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
          />
        </div>
        {shouldShowTaxCreditInCurrentView && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Adójóváírás limit</Label>
            <div className="flex items-center gap-1">
              <Input
                type="text"
                inputMode="numeric"
                disabled={isRowReadOnly}
                value={
                  editingFields[`taxLimit-${row.year}`]
                    ? currentTaxCreditLimit !== undefined
                      ? String(
                          Math.round(
                            convertForDisplay(currentTaxCreditLimit, resultsCurrency, displayCurrency, eurToHufRate),
                          ),
                        )
                      : ""
                    : currentTaxCreditLimit !== undefined
                      ? formatNumber(
                          Math.round(
                            convertForDisplay(currentTaxCreditLimit, resultsCurrency, displayCurrency, eurToHufRate),
                          ),
                        )
                      : ""
                }
                onFocus={() => setFieldEditing(`taxLimit-${row.year}`, true)}
                onBlur={() => setFieldEditing(`taxLimit-${row.year}`, false)}
                onChange={(e) => {
                  const parsed = parseNumber(e.target.value)
                  if (!isNaN(parsed)) updateTaxCreditLimit(row.year, parsed)
                }}
                placeholder="Auto"
                className={`${MOBILE_LAYOUT.inputHeight} text-base tabular-nums flex-1 ${isTaxCreditLimited ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
              />
              {isTaxCreditLimited && (
                <button
                  type="button"
                  onClick={() => updateTaxCreditLimit(row.year, 0)}
                  className={`${MOBILE_LAYOUT.inputHeight} text-muted-foreground hover:text-foreground w-8 flex items-center justify-center`}
                >
                  ×
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground tabular-nums">
              Tényleges: {formatValue(applyRealValue(row.taxCreditForYear), displayCurrency)}
            </p>
          </div>
        )}
      </div>

      {/* Expandable details */}
      {isExpanded && (
        <div
          className={`mt-4 pt-3 border-t space-y-2 ${
            isYearlyReadOnly ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Összes befizetés</span>
            <span className="tabular-nums">
              {formatValue(applyRealValue(displayData.endBalance), displayCurrency)}
            </span>{" "}
            {/* Display current view's balance */}
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Hozam</span>
            <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatValue(applyRealValue(displayData.interestForYear), displayCurrency)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Költség</span>
            <span className="text-destructive tabular-nums">
              {formatValue(applyRealValue(displayData.costForYear), displayCurrency)}
            </span>
          </div>
          {shouldShowAcquisitionInCurrentView && (displayData.upfrontCostForYear ?? 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Akvizíciós költség</span>
              <span className="text-destructive tabular-nums">
                {formatValue(applyRealValue(displayData.upfrontCostForYear), displayCurrency)}
              </span>
            </div>
          )}
          {(displayData.adminCostForYear ?? 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Admin. díj</span>
              <span className="text-destructive tabular-nums">
                {formatValue(applyRealValue(displayData.adminCostForYear), displayCurrency)}
              </span>
            </div>
          )}
          {(displayData.accountMaintenanceCostForYear ?? 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {selectedProduct === "generali_kabala" ? "Vagyonarányos költség" : "Számlavezetési költség"}
              </span>
              <span className="text-destructive tabular-nums">
                {formatValue(applyRealValue(displayData.accountMaintenanceCostForYear), displayCurrency)}
              </span>
            </div>
          )}
          {(displayData.managementFeeCostForYear ?? 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Kezelési díj</span>
              <span className="text-destructive tabular-nums">
                {formatValue(applyRealValue(displayData.managementFeeCostForYear), displayCurrency)}
              </span>
            </div>
          )}
          {(displayData.assetBasedCostForYear ?? 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Vagyonarányos költség</span>
              <span className="text-destructive tabular-nums">
                {formatValue(applyRealValue(displayData.assetBasedCostForYear), displayCurrency)}
              </span>
            </div>
          )}
          {(displayData.plusCostForYear ?? 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {selectedProduct === "generali_kabala" ? "Admin költs./hó" : "Plusz költség"}
              </span>
              <span className="text-destructive tabular-nums">
                {formatValue(applyRealValue(displayData.plusCostForYear), displayCurrency)}
              </span>
            </div>
          )}
          {row.assetBasedCostForYear > 0 &&
            inputs &&
            assetCostPercentByYear &&
            updateAssetCostPercent &&
            !hideAssetFeeBreakdownInCurrentView && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  {isAlfaExclusivePlusVariant
                    ? "Számlavezetési költség"
                    : selectedProduct === "generali_kabala"
                      ? "Vagyonarányos költség (%)"
                      : "Vagyon%"}
                </Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={isEsetiView ? 0 : defaultAssetPercentForView}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      if (!isNaN(val) && val >= 0 && val <= 100) {
                        updateAssetCostPercent(row.year, val)
                      }
                    }}
                    min={0}
                    max={100}
                    step={0.001}
                    className={`${MOBILE_LAYOUT.inputHeight} text-base tabular-nums flex-1 ${assetCostPercentByYear[row.year] !== undefined ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
                  />
                  {assetCostPercentByYear[row.year] !== undefined && (
                    <button
                      type="button"
                      onClick={() => updateAssetCostPercent(row.year, inputs.assetBasedFeePercent)}
                      className={`${MOBILE_LAYOUT.inputHeight} text-muted-foreground hover:text-foreground w-8 flex items-center justify-center`}
                    >
                      ×
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground tabular-nums">
                  Összeg: {formatValue(applyRealValue(isEsetiView ? 0 : row.assetBasedCostForYear), displayCurrency)}
                </p>
              </div>
            )}
          {/* </CHANGE> */}
          {plusCostByYear !== undefined && updatePlusCost && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {selectedProduct === "generali_kabala" ? "Admin költs./hó (Ft)" : "Plusz költség (Ft)"}
              </Label>
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={
                    editingFields[`plusCost-${row.year}`]
                      ? String(
                          Math.round(
                            convertForDisplay(
                              isEsetiView ? 0 : plusCostByYear[row.year] ?? 0,
                              resultsCurrency,
                              displayCurrency,
                              eurToHufRate,
                            ),
                          ),
                        )
                      : formatNumber(
                          Math.round(
                            convertForDisplay(
                              isEsetiView ? 0 : plusCostByYear[row.year] ?? 0,
                              resultsCurrency,
                              displayCurrency,
                              eurToHufRate,
                            ),
                          ),
                        )
                  }
                  onFocus={() => setFieldEditing(`plusCost-${row.year}`, true)}
                  onBlur={() => setFieldEditing(`plusCost-${row.year}`, false)}
                  onChange={(e) => {
                    const parsed = parseNumber(e.target.value)
                    if (!isNaN(parsed) && parsed >= 0) {
                      const calcValue = convertFromDisplayToCalc(parsed, resultsCurrency, displayCurrency, eurToHufRate)
                      updatePlusCost(row.year, calcValue)
                    }
                  }}
                  className={`${MOBILE_LAYOUT.inputHeight} text-base tabular-nums flex-1 ${plusCostByYear[row.year] !== undefined && plusCostByYear[row.year] > 0 ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
                />
                {plusCostByYear[row.year] !== undefined && plusCostByYear[row.year] > 0 && (
                  <button
                    type="button"
                    onClick={() => updatePlusCost(row.year, 0)}
                    className={`${MOBILE_LAYOUT.inputHeight} text-muted-foreground hover:text-foreground w-8 flex items-center justify-center`}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          )}
          {/* </CHANGE> */}
          {/* </CHANGE> Added bonusPercentByYear and updateBonusPercent */}
          {bonusPercentByYear !== undefined && updateBonusPercent && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Bónusz (%)</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  inputMode="decimal"
                  value={isEsetiView ? 0 : bonusPercentByYear[row.year] ?? 0}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    if (!isNaN(val) && val >= 0 && val <= 100) {
                      updateBonusPercent(row.year, val)
                    }
                  }}
                  min={0}
                  max={100}
                  step={0.1}
                  className={`${MOBILE_LAYOUT.inputHeight} text-base tabular-nums flex-1 ${bonusPercentByYear[row.year] !== undefined && bonusPercentByYear[row.year] > 0 ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
                />
                {bonusPercentByYear[row.year] !== undefined && bonusPercentByYear[row.year] > 0 && (
                  <button
                    type="button"
                    onClick={() => updateBonusPercent(row.year, 0)}
                    className={`${MOBILE_LAYOUT.inputHeight} text-muted-foreground hover:text-foreground w-8 flex items-center justify-center`}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          )}
          {/* </CHANGE> */}
          {riskInsuranceCostForYear !== undefined && riskInsuranceCostForYear > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Kockázati biztosítás</span>
              <span className="text-purple-600 dark:text-purple-400 tabular-nums">
                {formatValue(applyRealValue(riskInsuranceCostForYear), displayCurrency)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Bónusz</span>
            <span className="text-blue-600 dark:text-blue-400 tabular-nums">
              {formatValue(applyRealValue(displayData.wealthBonusForYear), displayCurrency)} {/* Use displayData */}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Adójóváírás</span>
            <span className="text-chart-3 tabular-nums">
              {formatValue(applyRealValue(row.taxCreditForYear), displayCurrency)}
            </span>
          </div>
          {row.withdrawalForYear > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pénzkivonás</span>
              <span className="text-orange-600 dark:text-orange-400 tabular-nums">
                {formatValue(applyRealValue(row.withdrawalForYear), displayCurrency)}
              </span>
            </div>
          )}
          {enableNetting && netData && (
            <>
              <div className="border-t pt-2 mt-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">Nettósítás</p>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bruttó hozam</span>
                <span className="tabular-nums">
                  {formatValue(applyRealValue(netData.grossProfit), displayCurrency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Adó ({Math.round(netData.taxRate * 100)}%)</span>
                <span className="text-destructive tabular-nums">
                  -{formatValue(applyRealValue(netData.taxDeduction), displayCurrency)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">Nettó hozam</span>
                <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatValue(applyRealValue(netData.netProfit), displayCurrency)}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  )
}

export function SavingsCalculator() {
  const router = useRouter()
  const { updateData } = useCalculatorData()
  const { isMobile } = useMobile()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isLandscapeOrientation, setIsLandscapeOrientation] = useState(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia("(orientation: landscape)").matches || window.innerWidth > window.innerHeight
  })

  const isHydratingRef = useRef(true)
  const lastAppliedPresetKeyRef = useRef<string | null>(null)

  useEffect(() => {
    isHydratingRef.current = false
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    const mediaQuery = window.matchMedia("(orientation: landscape)")
    const updateOrientation = () => {
      setIsLandscapeOrientation(mediaQuery.matches || window.innerWidth > window.innerHeight)
    }

    updateOrientation()
    window.addEventListener("resize", updateOrientation)
    window.addEventListener("orientationchange", updateOrientation)
    window.visualViewport?.addEventListener("resize", updateOrientation)

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateOrientation)
    } else {
      mediaQuery.addListener(updateOrientation)
    }

    return () => {
      window.removeEventListener("resize", updateOrientation)
      window.removeEventListener("orientationchange", updateOrientation)
      window.visualViewport?.removeEventListener("resize", updateOrientation)

      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", updateOrientation)
      } else {
        mediaQuery.removeListener(updateOrientation)
      }
    }
  }, [])

  const [yearlyViewMode, setYearlyViewMode] = useState<"total" | "client" | "invested" | "taxBonus">("total")
  const [yearlyAccountView, setYearlyAccountView] = useState<YearlyAccountView>("main")
  const [premiumSelectionEsetiMode, setPremiumSelectionEsetiMode] = useState<"taxEligible" | "immediateAccess">(
    "immediateAccess",
  )
  const [yearlyAggregationMode, setYearlyAggregationMode] = useState<"year" | "sum">("year")
  const [showCostBreakdown, setShowCostBreakdown] = useState(false)
  const [activeYearlyColumnInfoKey, setActiveYearlyColumnInfoKey] = useState<string | null>(null)
  const [showBonusBreakdown, setShowBonusBreakdown] = useState(false)
  const [productPresetBaseline, setProductPresetBaseline] = useState<ProductPresetBaseline>({
    initialCostByYear: {},
    initialCostDefaultPercent: 0,
    assetBasedFeePercent: 0,
    assetCostPercentByYear: {},
    accountMaintenanceMonthlyPercent: 0,
    accountMaintenancePercentByYear: {},
    adminFeePercentOfPayment: 0,
    adminFeePercentByYear: {},
    bonusOnContributionPercentByYear: {},
    refundInitialCostBonusPercentByYear: {},
    bonusPercentByYear: {},
  })
  // </CHANGE>

  const [yieldSourceMode, setYieldSourceMode] = useState<YieldSourceMode>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-yieldSourceMode")
      if (stored === "manual" || stored === "fund" || stored === "ocr") {
        return stored
      }
      const legacy = sessionStorage.getItem("calculator-annualYieldMode")
      if (legacy === "manual" || legacy === "fund") return legacy
    }
    return "manual"
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-yieldSourceMode", yieldSourceMode)
    }
  }, [yieldSourceMode])

  const [manualYieldPercent, setManualYieldPercent] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-manualYieldPercent")
      if (stored) {
        const parsed = Number(stored)
        if (Number.isFinite(parsed)) return parsed
      }
    }
    return 12
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-manualYieldPercent", String(manualYieldPercent))
    }
  }, [manualYieldPercent])

  const [fundCalculationMode, setFundCalculationMode] = useState<"replay" | "averaged">(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-fundCalculationMode")
      if (stored === "replay" || stored === "averaged") return stored
    }
    return "replay"
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-fundCalculationMode", fundCalculationMode)
    }
  }, [fundCalculationMode])

  // Selected fund ID for annual yield
  const [selectedFundId, setSelectedFundId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-selectedFundId")
      return stored || null
    }
    return null
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (selectedFundId) {
        sessionStorage.setItem("calculator-selectedFundId", selectedFundId)
      } else {
        sessionStorage.removeItem("calculator-selectedFundId")
      }
    }
  }, [selectedFundId])

  const [fundSeriesPoints, setFundSeriesPoints] = useState<FundSeriesPoint[]>([])
  const [fundSeriesSource, setFundSeriesSource] = useState<string | null>(null)
  const [fundSeriesAnnualizedReturn, setFundSeriesAnnualizedReturn] = useState<number | null>(null)
  const [fundSeriesLoading, setFundSeriesLoading] = useState(false)
  const [fundSeriesError, setFundSeriesError] = useState<string | null>(null)
  const [fundSeriesAvailableRange, setFundSeriesAvailableRange] = useState<{ startDate: string; endDate: string } | null>(
    null,
  )
  const [fundSeriesFundEarliestAvailable, setFundSeriesFundEarliestAvailable] = useState<string | null>(null)
  const chartImageInputRef = useRef<HTMLInputElement | null>(null)
  const [isChartDragActive, setIsChartDragActive] = useState(false)
  const [chartParseStatus, setChartParseStatus] = useState<ChartParseStatus>("idle")
  const [chartParseMessage, setChartParseMessage] = useState("")
  const [parsedChartSeries, setParsedChartSeries] = useState<ParsedChartSeries | null>(() => {
    if (typeof window === "undefined") return null
    const stored = sessionStorage.getItem("calculator-chartSeries")
    if (!stored) return null
    try {
      const parsed = JSON.parse(stored) as Partial<ParsedChartSeries>
      if (!parsed || !Array.isArray(parsed.points) || parsed.points.length < 2) return null
      return {
        source: "image-upload",
        sourceImageHash: String(parsed.sourceImageHash ?? "legacy-image"),
        startDate: String(parsed.startDate ?? ""),
        endDate: String(parsed.endDate ?? ""),
        confidence: Number(parsed.confidence ?? 0),
        derivedAnnualYieldPercent: Number(parsed.derivedAnnualYieldPercent ?? 0),
        points: parsed.points,
        diagnostics: parsed.diagnostics,
        detectedGranularity: parsed.detectedGranularity ?? "unknown",
        interpolationApplied: Boolean(parsed.interpolationApplied),
      }
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!parsedChartSeries) {
      sessionStorage.removeItem("calculator-chartSeries")
      return
    }
    sessionStorage.setItem("calculator-chartSeries", JSON.stringify(parsedChartSeries))
  }, [parsedChartSeries])

  const isParsedChartSeriesUsable = !!parsedChartSeries && parsedChartSeries.confidence >= MIN_CHART_SERIES_CONFIDENCE

  const fundSeriesComputedStats = useMemo(() => {
    if (!fundSeriesPoints || fundSeriesPoints.length < 2) return null
    const first = fundSeriesPoints[0]
    const last = fundSeriesPoints[fundSeriesPoints.length - 1]
    if (!first || !last) return null
    if (!Number.isFinite(first.price) || !Number.isFinite(last.price) || first.price <= 0 || last.price <= 0) return null
    const firstDate = new Date(first.date)
    const lastDate = new Date(last.date)
    const msPerDay = 24 * 60 * 60 * 1000
    const days = Math.max(1, Math.round((lastDate.getTime() - firstDate.getTime()) / msPerDay))
    const periodReturnPercent = (last.price / first.price - 1) * 100
    const annualized = Math.pow(last.price / first.price, 365 / days) - 1
    const annualizedReturnPercent = Number.isFinite(annualized) ? annualized * 100 : null
    return {
      firstDate: first.date,
      lastDate: last.date,
      firstPrice: first.price,
      lastPrice: last.price,
      days,
      periodReturnPercent: Number.isFinite(periodReturnPercent) ? periodReturnPercent : null,
      annualizedReturnPercent,
    }
  }, [fundSeriesPoints])

  type FundFeeClass = "equityOrMixed" | "bondOrMoneyMarket" | "europeanEquityOrInternationalBond" | "internationalMoneyMarket"
  type FundOption = { id: string; name: string; historicalYield: number; feeClass?: FundFeeClass }

  // Default fund data (non-Allianz or non-HUF)
  const baseFundOptions = [
    { id: "fund-1", name: "OTP Alapkezelő Részvényalap", historicalYield: 8.5 },
    { id: PREMIUM_SELECTION_OTP_BUX_FUND_ID, name: "OTP BUX Indexkövető eszközalap", historicalYield: 8.5 },
    { id: "fund-2", name: "ERSTE Alapkezelő Magyar Tőkepiaci Alap", historicalYield: 10.2 },
    { id: "fund-3", name: "K&H Alapkezelő Kétszínű Alap", historicalYield: 7.8 },
    { id: "fund-4", name: "Concordia Alapkezelő Konzervatív Alap", historicalYield: 5.3 },
    { id: "fund-5", name: "Raiffeisen Alapkezelő Kötvényalap", historicalYield: 6.1 },
    { id: "fund-6", name: "CIB Alapkezelő Részvényalap", historicalYield: 9.7 },
    { id: "fund-7", name: "MKB Alapkezelő Kevert Alap", historicalYield: 8.0 },
    { id: "fund-8", name: "Magyar Nemzeti Bank Devizaalap", historicalYield: 4.5 },
  ]

  // Allianz HUF fund data (use longest available horizon, not "Indulástól")
  const allianzHufFundOptions: FundOption[] = [
    { id: "AGA", name: "Allianz Állampapír Alap", historicalYield: 3.0 },
    { id: "AHA", name: "Allianz Aktív Menedzselt Hozamkereső Alap", historicalYield: 11.19 },
    { id: "AKA", name: "Allianz Aktív Menedzselt Kiegyensúlyozott Alap", historicalYield: 7.51 },
    { id: "AMA", name: "Allianz Menedzselt Alap", historicalYield: 7.0 },
    { id: "CDA", name: "Allianz Céldátum 2025 Alap", historicalYield: 4.0 },
    { id: "CDB", name: "Allianz Céldátum 2030 Alap", historicalYield: 5.0 },
    { id: "CDC", name: "Allianz Céldátum 2035 Alap", historicalYield: 6.0 },
    { id: "CDD", name: "Allianz Céldátum 2040 Alap", historicalYield: 7.0 },
    { id: "CDE", name: "Allianz Céldátum 2045 Alap", historicalYield: 5.45 },
    { id: "CDF", name: "Allianz Céldátum 2050 Alap", historicalYield: 3.84 },
    { id: "CDG", name: "Allianz Céldátum 2055 Alap", historicalYield: 5.43 },
    { id: "DMA", name: "Allianz Demográfia Részvény Alap", historicalYield: 11.0 },
    { id: "EKA", name: "Allianz Európai Kötvény Alap", historicalYield: 1.0 },
    { id: "ERA", name: "Európai Részvény Alap", historicalYield: 11.0 },
    { id: "FPA", name: "Feltörekvő Piacok Részvény Alap", historicalYield: 11.16 },
    { id: "IPA", name: "Allianz Ipari Nyersanyagok Részvény Alap", historicalYield: 18.0 },
    { id: "KLA", name: "Klíma- és Környezetvédelem Részvény Alap", historicalYield: -4.23 },
    { id: "KTA", name: "Allianz Korszerű Energiatrendek Részvény Alap", historicalYield: 13.0 },
    { id: "MKA", name: "Allianz Magyar Kötvény Alap", historicalYield: 2.0 },
    { id: "MRA", name: "Allianz Magyar Részvény Alap", historicalYield: 17.0 },
    { id: "ORA", name: "Allianz Közép- és Kelet-Európa Részvény Alap", historicalYield: 16.0 },
    { id: "PPA", name: "Allianz Pénzpiaci Alap", historicalYield: 3.0 },
    { id: "VRA", name: "Allianz Világgazdasági Részvény Alap", historicalYield: 13.0 },
  ]

  // Allianz EUR fund data (use longest available horizon, not "Indulástól")
  const allianzEurFundOptions: FundOption[] = [
    { id: "AHE", name: "Allianz Aktív Menedzselt Hozamkereső Euró Alap", historicalYield: 12.83 },
    { id: "AKE", name: "Allianz Aktív Menedzselt Kiegyensúlyozott Euró Alap", historicalYield: 9.54 },
    { id: "BKE", name: "Allianz Biztonságos Kötvény Euró Alap", historicalYield: -0.36 },
    { id: "CEC", name: "Allianz Céldátum 2035 Vegyes Euró Alap", historicalYield: 5.56 },
    { id: "CED", name: "Allianz Céldátum 2040 Vegyes Euró Alap", historicalYield: 6.26 },
    { id: "CEE", name: "Allianz Céldátum 2045 Vegyes Euró Alap", historicalYield: 7.4 },
    { id: "EKE", name: "Allianz Európai Kötvény Euró Alap", historicalYield: 0.62 },
    { id: "ERE", name: "Európai Részvény Euró Alap", historicalYield: 6.59 },
    { id: "FPE", name: "Feltörekvő Piacok Részvény Euró Alap", historicalYield: 13.23 },
    { id: "KLE", name: "Klíma- és Környezetvédelem Részvény Euró Alap", historicalYield: 4.76 },
    { id: "NPE", name: "Allianz Nemzetközi Pénzpiaci Euró Alap", historicalYield: 1.89 },
    { id: "VRE", name: "Allianz Világgazdasági Részvény Euró Alap", historicalYield: 10.09 },
  ]

  const fortisHufFundOptions: FundOption[] = [
    { id: "FORTIS_HUF_EQ_1", name: "Alfa Fortis HUF Részvény Alap", historicalYield: 10.5, feeClass: "equityOrMixed" },
    { id: "FORTIS_HUF_MIX_1", name: "Alfa Fortis HUF Vegyes Alap", historicalYield: 7.4, feeClass: "equityOrMixed" },
    { id: "FORTIS_HUF_BOND_1", name: "Alfa Fortis HUF Kötvény Alap", historicalYield: 3.8, feeClass: "bondOrMoneyMarket" },
    { id: "FORTIS_HUF_MM_1", name: "Alfa Fortis HUF Pénzpiaci Alap", historicalYield: 2.5, feeClass: "bondOrMoneyMarket" },
  ]

  const fortisEurFundOptions: FundOption[] = [
    { id: "FORTIS_EUR_EQ_1", name: "Alfa Fortis EUR Részvény Alap", historicalYield: 9.1, feeClass: "equityOrMixed" },
    { id: "FORTIS_EUR_MIX_1", name: "Alfa Fortis EUR Vegyes Alap", historicalYield: 6.2, feeClass: "equityOrMixed" },
    {
      id: "FORTIS_EUR_EU_EQ_1",
      name: "Alfa Fortis Európai Részvény Alap (EUR)",
      historicalYield: 7.6,
      feeClass: "europeanEquityOrInternationalBond",
    },
    {
      id: "FORTIS_EUR_INT_BOND_1",
      name: "Alfa Fortis Nemzetközi Kötvény Alap (EUR)",
      historicalYield: 3.1,
      feeClass: "europeanEquityOrInternationalBond",
    },
    {
      id: "ALFA_INT_MM_EUR",
      name: "Alfa International Money Market Fund (EUR)",
      historicalYield: 1.8,
      feeClass: "internationalMoneyMarket",
    },
  ]
  const fortisUsdFundOptions: FundOption[] = [
    {
      id: "FORTIS_USD_AE",
      name: "Alfa American Equity (USD)",
      historicalYield: 8.4,
      feeClass: "europeanEquityOrInternationalBond",
    },
    {
      id: "FORTIS_USD_IB",
      name: "Alfa Int. Bond (USD)",
      historicalYield: 3.2,
      feeClass: "europeanEquityOrInternationalBond",
    },
    {
      id: "ALFA_INT_MM_USD",
      name: "Alfa International Money Market Fund (USD)",
      historicalYield: 2.0,
      feeClass: "internationalMoneyMarket",
    },
    { id: "FORTIS_USD_GLOBAL", name: "Alfa Global Equity (USD)", historicalYield: 7.1, feeClass: "equityOrMixed" },
    { id: "FORTIS_USD_ESG", name: "Alfa ESG Equity (USD)", historicalYield: 6.8, feeClass: "equityOrMixed" },
    { id: "FORTIS_USD_TREND", name: "Alfa Trend Equity (USD)", historicalYield: 7.9, feeClass: "equityOrMixed" },
    { id: "FORTIS_USD_GOLD", name: "Alfa Gold Fund (USD)", historicalYield: 5.9, feeClass: "equityOrMixed" },
  ]

  const [durationUnit, setDurationUnit] = useState<DurationUnit>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-durationUnit")
      if (stored) {
        try {
          return JSON.parse(stored) as DurationUnit
        } catch (e) {
          console.error("[v0] Failed to parse stored durationUnit:", e)
        }
      }
    }
    return "year"
  })

  const [durationValue, setDurationValue] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-durationValue")
      if (stored) {
        try {
          // </CHANGE> Fixed typo: JSON.Parse -> JSON.parse
          return JSON.parse(stored) as number
        } catch (e) {
          console.error("[v0] Failed to parse stored durationValue:", e)
        }
      }
    }
    return 10
  })
  const [esetiDurationUnit, setEsetiDurationUnit] = useState<DurationUnit>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-esetiDurationUnit")
      if (stored) {
        try {
          return JSON.parse(stored) as DurationUnit
        } catch (e) {
          console.error("[v0] Failed to parse stored esetiDurationUnit:", e)
        }
      }
    }
    return "year"
  })
  const [esetiDurationValue, setEsetiDurationValue] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-esetiDurationValue")
      if (stored) {
        try {
          return JSON.parse(stored) as number
        } catch (e) {
          console.error("[v0] Failed to parse stored esetiDurationValue:", e)
        }
      }
    }
    return 10
  })

  const [inputs, setInputs] = useState<CalculatorInputs>(() => {
    const defaultInputs = {
      currency: "HUF",
      eurToHufRate: 400,
      usdToHufRate: 380,
      regularPayment: 20000,
      frequency: "havi",
      annualYieldPercent: 12,
      annualIndexPercent: 3,
      keepYearlyPayment: true,
      initialCostByYear: {},
      initialCostDefaultPercent: 0,
      yearlyManagementFeePercent: 0, // This is now replaced by managementFeeValue
      yearlyFixedManagementFeeAmount: 0, // This is now replaced by managementFeeValue
      managementFeeStartYear: 1,
      managementFeeStopYear: 0,
      assetBasedFeePercent: 0,
      bonusMode: "none",
      bonusOnContributionPercent: 0, // This field seems unused in current logic, but kept for potential future use
      bonusFromYear: 1, // This field seems unused in current logic, but kept for potential future use
      enableTaxCredit: false,
      taxCreditRatePercent: 20,
      taxCreditCapPerYear: 130000,
      taxCreditStartYear: 1,
      taxCreditEndYear: undefined,
      stopTaxCreditAfterFirstWithdrawal: false,
      taxCreditYieldPercent: 12,
      paidUpMaintenanceFeeMonthlyAmount: 0,
      paidUpMaintenanceFeeStartMonth: 10,
      insuredEntryAge: 38,
      taxCreditCalendarPostingEnabled: false,
      calculationMode: "simple",
      startDate: new Date().toISOString().split("T")[0],
      bonusPercent: 0, // Added for bonus functionality
      bonusStartYear: 1, // Added for bonus functionality
      bonusStopYear: 0, // Added for bonus functionality
      investedShareByYear: {},
      investedShareDefaultPercent: 100,
      // Added fields for management fee
      managementFeeFrequency: "éves",
      managementFeeValueType: "percent",
      managementFeeValue: 0,
      // </CHANGE>
    }

    // Try to load from sessionStorage first
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-inputs")
      if (stored) {
        try {
          // Deserialize the stored data, ensuring startDate is a string
          const parsedData = JSON.parse(stored)
          if (parsedData.startDate && typeof parsedData.startDate === "string" && parsedData.startDate.split("T")[0]) {
            return { ...defaultInputs, ...parsedData, startDate: parsedData.startDate.split("T")[0] }
          }
          return { ...defaultInputs, ...parsedData }
        } catch (e) {
          console.error("[v0] Failed to parse stored inputs:", e)
        }
      }
    }

    // Default values if nothing stored
    return defaultInputs
  })

  useEffect(() => {
    if (yieldSourceMode !== "manual") return
    if (!Number.isFinite(inputs.annualYieldPercent)) return
    if (manualYieldPercent === inputs.annualYieldPercent) return
    setManualYieldPercent(inputs.annualYieldPercent)
  }, [yieldSourceMode, inputs.annualYieldPercent, manualYieldPercent])

  const [durationFromInput, setDurationFromInput] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-durationFromInput")
      if (stored) return stored
    }
    const today = new Date()
    const base = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0, 0)
    return formatHuDate(base)
  })
  const [durationToInput, setDurationToInput] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-durationToInput")
      if (stored) return stored
    }
    const today = new Date()
    const end = new Date(today.getFullYear() + 10, today.getMonth(), today.getDate(), 12, 0, 0, 0)
    return formatHuDate(end)
  })
  const [durationFromPickerOpen, setDurationFromPickerOpen] = useState(false)
  const [durationToPickerOpen, setDurationToPickerOpen] = useState(false)
  const [durationSource, setDurationSource] = useState<DurationSource>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-durationSource")
      if (stored === "dates" || stored === "value") return stored
    }
    return "dates"
  })
  const [esetiBaseInputs, setEsetiBaseInputs] = useState<{
    regularPayment: number
    frequency: PaymentFrequency
    annualYieldPercent: number
    annualIndexPercent: number
    keepYearlyPayment: boolean
  }>(() => {
    const defaults = {
      regularPayment: 20000,
      frequency: "éves" as PaymentFrequency,
      annualYieldPercent: 12,
      annualIndexPercent: 0,
      keepYearlyPayment: true,
    }
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-esetiBaseInputs")
      if (stored) {
        try {
          return { ...defaults, ...(JSON.parse(stored) as Partial<typeof defaults>) }
        } catch (e) {
          console.error("[v0] Failed to parse stored esetiBaseInputs:", e)
        }
      }
    }
    return defaults
  })

  const [indexByYear, setIndexByYear] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-indexByYear")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored indexByYear:", e)
        }
      }
    }
    return {}
  })

  const [paymentByYear, setPaymentByYear] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-paymentByYear")
      if (stored) {
        try {
          return JSON.parse(stored)
          // </CHANGE>
        } catch (e) {
          console.error("[v0] Failed to parse stored paymentByYear:", e)
        }
      }
    }
    return {}
  })
  const [esetiPaymentByYear, setEsetiPaymentByYear] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-esetiPaymentByYear")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored esetiPaymentByYear:", e)
        }
      }
    }
    return {}
  })
  const [esetiPaymentByYearTaxEligible, setEsetiPaymentByYearTaxEligible] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-esetiPaymentByYearTaxEligible")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored esetiPaymentByYearTaxEligible:", e)
        }
      }
    }
    return {}
  })

  const [withdrawalByYear, setWithdrawalByYear] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-withdrawalByYear")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored withdrawalByYear:", e)
        }
      }
    }
    return {}
  })
  const [esetiWithdrawalByYear, setEsetiWithdrawalByYear] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-esetiWithdrawalByYear")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored esetiWithdrawalByYear:", e)
        }
      }
    }
    return {}
  })
  const [esetiWithdrawalByYearTaxEligible, setEsetiWithdrawalByYearTaxEligible] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-esetiWithdrawalByYearTaxEligible")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored esetiWithdrawalByYearTaxEligible:", e)
        }
      }
    }
    return {}
  })

  const [taxCreditLimitByYear, setTaxCreditLimitByYear] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-taxCreditLimitByYear")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored taxCreditLimitByYear:", e)
        }
      }
    }
    return {}
  })
  const [esetiIndexByYear, setEsetiIndexByYear] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-esetiIndexByYear")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored esetiIndexByYear:", e)
        }
      }
    }
    return {}
  })
  const [esetiIndexByYearTaxEligible, setEsetiIndexByYearTaxEligible] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-esetiIndexByYearTaxEligible")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored esetiIndexByYearTaxEligible:", e)
        }
      }
    }
    return {}
  })
  const [esetiFrequency, setEsetiFrequency] = useState<PaymentFrequency>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-esetiFrequency")
      if (stored === "havi" || stored === "negyedéves" || stored === "féléves" || stored === "éves") {
        return stored
      }
    }
    return "éves"
  })
  useEffect(() => {
    if (esetiFrequency !== esetiBaseInputs.frequency) {
      setEsetiFrequency(esetiBaseInputs.frequency)
    }
  }, [esetiBaseInputs.frequency, esetiFrequency])

  const [taxCreditAmountByYear, setTaxCreditAmountByYear] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-taxCreditAmountByYear")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored taxCreditAmountByYear:", e)
        }
      }
    }
    return {}
  })
  const [taxCreditNotUntilRetirement, setTaxCreditNotUntilRetirement] = useState(false)

  const [investedShareByYear, setInvestedShareByYear] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-investedShareByYear")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored investedShareByYear:", e)
        }
      }
    }
    return {}
  })

  const [assetCostPercentByYear, setAssetCostPercentByYear] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-assetCostPercentByYear")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored assetCostPercentByYear:", e)
        }
      }
    }
    return {}
  })
  // </CHANGE>
  const [accountMaintenancePercentByYear, setAccountMaintenancePercentByYear] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-accountMaintenancePercentByYear")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored accountMaintenancePercentByYear:", e)
        }
      }
    }
    return {}
  })
  const [adminFeePercentByYear, setAdminFeePercentByYear] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-adminFeePercentByYear")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored adminFeePercentByYear:", e)
        }
      }
    }
    return {}
  })

  const [plusCostByYear, setPlusCostByYear] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-plusCostByYear")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored plusCostByYear:", e)
        }
      }
    }
    return {}
  })
  // </CHANGE>

  // Bonuses array (multiple bonuses can be added)
  // Initialize with default value to avoid hydration mismatch
  const [bonuses, setBonuses] = useState<Bonus[]>([])
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([])
  const [selectedCustomPresetId, setSelectedCustomPresetId] = useState<string>("")
  const [customPresetName, setCustomPresetName] = useState("")
  const [customPresetError, setCustomPresetError] = useState("")
  
  // Load from sessionStorage after hydration
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("bonuses")
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            const normalized = parsed
              .filter(Boolean)
              .map((bonus: any, index: number) => ({
                ...bonus,
                account:
                  bonus?.account === "client" ||
                  bonus?.account === "invested" ||
                  bonus?.account === "taxBonus" ||
                  bonus?.account === "main" ||
                  bonus?.account === "eseti"
                    ? bonus.account
                    : "main",
                id: typeof bonus?.id === "string" ? bonus.id : `bonus-${Date.now()}-${index}`,
              }))
            setBonuses(normalized)
          }
        } catch (e) {
          console.error("[v0] Failed to parse stored bonuses:", e)
        }
      }
    }
  }, [])

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } finally {
      router.replace("/login")
      router.refresh()
      setIsLoggingOut(false)
    }
  }, [isLoggingOut, router])

  // Save bonuses to sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("bonuses", JSON.stringify(bonuses))
    }
  }, [bonuses])

  const addBonus = () => {
    const newBonus: Bonus = {
      id: `bonus-${Date.now()}`,
      valueType: "percent",
      value: 0,
      account: customAccountOptions[0]?.value ?? "main",
    }
    setBonuses([...bonuses, newBonus])
    if (appliedPresetLabel) setAppliedPresetLabel(null)
  }

  const removeBonus = (id: string) => {
    setBonuses(bonuses.filter((b) => b.id !== id))
    if (appliedPresetLabel) setAppliedPresetLabel(null)
  }

  const updateBonus = (id: string, updates: Partial<Bonus>) => {
    setBonuses(bonuses.map((b) => (b.id === id ? { ...b, ...updates } : b)))
    if (appliedPresetLabel) setAppliedPresetLabel(null)
  }

  const updateBonusValueByYear = (id: string, year: number, value: number) => {
    setBonuses((prev) =>
      prev.map((bonus) => {
        if (bonus.id !== id) return bonus
        const nextByYear = { ...(bonus.valueByYear ?? {}) }
        nextByYear[year] = value
        return { ...bonus, valueByYear: nextByYear }
      }),
    )
    if (appliedPresetLabel) setAppliedPresetLabel(null)
  }

  // Keep bonusPercentByYear for backward compatibility (deprecated, will be removed later)
  const [bonusPercentByYear, setBonusPercentByYear] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-bonusPercentByYear")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored bonusPercentByYear:", e)
        }
      }
    }
    return {}
  })
  // </CHANGE>
  const [bonusOnContributionPercentByYear, setBonusOnContributionPercentByYear] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-bonusOnContributionPercentByYear")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored bonusOnContributionPercentByYear:", e)
        }
      }
    }
    return {}
  })
  const [refundInitialCostBonusPercentByYear, setRefundInitialCostBonusPercentByYear] = useState<Record<number, number>>(
    () => {
      if (typeof window !== "undefined") {
        const stored = sessionStorage.getItem("calculator-refundInitialCostBonusPercentByYear")
        if (stored) {
          try {
            return JSON.parse(stored)
          } catch (e) {
            console.error("[v0] Failed to parse stored refundInitialCostBonusPercentByYear:", e)
          }
        }
      }
      return {}
    },
  )

  const [isTaxBonusSeparateAccount, setIsTaxBonusSeparateAccount] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("isTaxBonusSeparateAccount")
      return stored ? JSON.parse(stored) : false
    }
    return false
  })
  // </CHANGE>

  const [displayCurrency, setDisplayCurrency] = useState<Currency>("HUF")
  const [isDisplayCurrencyUserOverridden, setIsDisplayCurrencyUserOverridden] = useState(false)
  const [eurRateManuallyChanged, setEurRateManuallyChanged] = useState(false)
  const [fxState, setFxState] = useState<FxState>({ rate: 400, date: null, source: "default" })
  const [isLoadingFx, setIsLoadingFx] = useState(false)

  const [enableNetting, setEnableNetting] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-enableNetting")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored enableNetting:", e)
        }
      }
    }
    return false
  })

  // Added isAccountSplitOpen and isRedemptionOpen state variables
  const [isAccountSplitOpen, setIsAccountSplitOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("isAccountSplitOpen")
      return stored ? JSON.parse(stored) : false
    }
    return false
  })

  const [isRedemptionOpen, setIsRedemptionOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("isRedemptionOpen")
      return stored ? JSON.parse(stored) : true // Default to open
    }
    return true
  })
  // </CHANGE>

  // Management fees array (multiple fees can be added)
  // Start empty; user adds rows via plus button (same UX as bonuses)
  const [managementFees, setManagementFees] = useState<ManagementFee[]>([])

  // Load from sessionStorage after hydration
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("managementFees")
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            const normalized: ManagementFee[] = parsed
              .filter(Boolean)
              .map((fee: any, index: number): ManagementFee => ({
                id: typeof fee?.id === "string" ? fee.id : `fee-${Date.now()}-${index}`,
                label:
                  typeof fee?.label === "string" && fee.label.trim().length > 0
                    ? fee.label.trim()
                    : `Egyedi költség ${index + 1}`,
                frequency:
                  fee?.frequency === "napi" ||
                  fee?.frequency === "havi" ||
                  fee?.frequency === "negyedéves" ||
                  fee?.frequency === "féléves" ||
                  fee?.frequency === "éves"
                    ? fee.frequency
                    : "éves",
                valueType:
                  fee?.valueType === "amount" || fee?.valueType === "percent" ? fee.valueType : "percent",
                value: Number.isFinite(Number(fee?.value)) ? Number(fee.value) : 0,
                valueByYear:
                  fee?.valueByYear && typeof fee.valueByYear === "object"
                    ? Object.fromEntries(
                        Object.entries(fee.valueByYear)
                          .map(([year, value]) => [Number(year), Number(value)])
                          .filter(([year, value]) => Number.isFinite(year) && Number.isFinite(value)),
                      )
                    : {},
                account:
                  fee?.account === "invested" ||
                  fee?.account === "taxBonus" ||
                  fee?.account === "client" ||
                  fee?.account === "main" ||
                  fee?.account === "eseti"
                    ? fee.account
                    : "main",
              }))
            const isLegacyDefaultOnly =
              normalized.length === 1 &&
              normalized[0]?.id === "fee-default" &&
              (normalized[0]?.value ?? 0) === 0 &&
              normalized[0]?.valueType === "percent" &&
              normalized[0]?.frequency === "éves" &&
              normalized[0]?.account === "client"
            setManagementFees(isLegacyDefaultOnly ? [] : normalized)
          }
        } catch (e) {
          console.error("[v0] Failed to parse stored managementFees:", e)
        }
      }
    }
  }, [])

  // Save managementFees to sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("managementFees", JSON.stringify(managementFees))
    }
  }, [managementFees])

  const addManagementFee = () => {
    const newFee: ManagementFee = {
      id: `fee-${Date.now()}`,
      label: `Egyedi költség ${managementFees.length + 1}`,
      frequency: "éves",
      valueType: "percent",
      value: 0,
      valueByYear: {},
      account: customAccountOptions[0]?.value ?? "main",
    }
    setManagementFees([...managementFees, newFee])
    if (appliedPresetLabel) setAppliedPresetLabel(null)
  }

  const removeManagementFee = (id: string) => {
    setManagementFees(managementFees.filter((f) => f.id !== id))
    if (appliedPresetLabel) setAppliedPresetLabel(null)
  }

  const updateManagementFee = (id: string, updates: Partial<ManagementFee>) => {
    setManagementFees(managementFees.map((f) => (f.id === id ? { ...f, ...updates } : f)))
    if (appliedPresetLabel) setAppliedPresetLabel(null)
  }

  const updateManagementFeeValueByYear = (id: string, year: number, value: number) => {
    setManagementFees((prev) =>
      prev.map((fee) => {
        if (fee.id !== id) return fee
        const nextByYear = { ...(fee.valueByYear ?? {}) }
        nextByYear[year] = value
        return { ...fee, valueByYear: nextByYear }
      }),
    )
    if (appliedPresetLabel) setAppliedPresetLabel(null)
  }

  const customEntryDefinitions = useMemo<CustomEntryDefinition[]>(() => {
    const feeEntries: CustomEntryDefinition[] = managementFees.map((fee, index) => ({
      id: fee.id,
      label: fee.label?.trim() || `Egyedi költség ${index + 1}`,
      kind: "cost",
      valueType: fee.valueType,
      value: fee.value,
      valueByYear: fee.valueByYear ?? {},
      account: fee.account,
      frequency: fee.frequency,
      startYear: 1,
      stopYear: 0,
    }))
    const bonusEntries: CustomEntryDefinition[] = bonuses.map((bonus, index) => ({
      id: bonus.id,
      label: `Egyedi bónusz ${index + 1}`,
      kind: "bonus",
      valueType: bonus.valueType,
      value: bonus.value,
      valueByYear: bonus.valueByYear ?? {},
      account: bonus.account,
      frequency: "éves",
      startYear: 1,
      stopYear: 0,
    }))
    return [...feeEntries, ...bonusEntries]
  }, [managementFees, bonuses])
  const customEntryDefinitionsMain = useMemo<CustomEntryDefinition[]>(
    () => customEntryDefinitions.filter((entry) => entry.account !== "eseti"),
    [customEntryDefinitions],
  )
  const customEntryDefinitionsEseti = useMemo<CustomEntryDefinition[]>(
    () => customEntryDefinitions.filter((entry) => entry.account !== "main"),
    [customEntryDefinitions],
  )

  const [redemptionFeeByYear, setRedemptionFeeByYear] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("redemptionFeeByYear")
      return stored ? JSON.parse(stored) : {} // Corrected from JSON.Parse
    }
    return {}
  })

  const [redemptionFeeDefaultPercent, setRedemptionFeeDefaultPercent] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-redemptionFeeDefaultPercent")
      return stored ? JSON.parse(stored) : 0
    }
    return 0
  })
  // </CHANGE>

  // Initialize with default value to avoid hydration mismatch
  const [redemptionBaseMode, setRedemptionBaseMode] = useState<"surplus-only" | "total-account">("surplus-only")
  
  // Load from sessionStorage after hydration
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("redemptionBaseMode")
      if (stored === "surplus-only" || stored === "total-account") {
        setRedemptionBaseMode(stored)
    }
    }
  }, [])
  // </CHANGE>

  const [isCorporateBond, setIsCorporateBond] = useState(false)

  const [enableRealValue, setEnableRealValue] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-enableRealValue")
      return stored === "true"
    }
    return false
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-enableRealValue", String(enableRealValue))
    }
  }, [enableRealValue])

  const [inflationRate, setInflationRate] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-inflationRate")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored inflationRate:", e)
        }
      }
    }
    return 3.0 // Default 3%
  })
  const [inflationAutoEnabled, setInflationAutoEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-inflationAutoEnabled")
      if (stored) {
        return stored === "true"
      }
    }
    return true
  })
  const [inflationKshYear, setInflationKshYear] = useState<number | null>(null)
  const [inflationKshValue, setInflationKshValue] = useState<number | null>(null)
  const [inflationKshMonthlySeries, setInflationKshMonthlySeries] = useState<
    Array<{ year: number; month: number; inflationPercent: number }>
  >([])
  const [futureInflationMode, setFutureInflationMode] = useState<FutureInflationMode>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-futureInflationMode")
      if (stored === "fix" || stored === "converging") return stored
    }
    return "converging"
  })
  const [futureInflationTargetRate, setFutureInflationTargetRate] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-futureInflationTargetRate")
      if (stored) {
        const parsed = Number(stored)
        if (Number.isFinite(parsed)) return parsed
      }
    }
    return 3
  })
  const [futureInflationConvergenceMonths, setFutureInflationConvergenceMonths] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-futureInflationConvergenceMonths")
      if (stored) {
        const parsed = Number(stored)
        if (Number.isFinite(parsed)) return parsed
      }
    }
    return 12
  })
  const [inflationKshLoading, setInflationKshLoading] = useState(false)
  const [inflationKshError, setInflationKshError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-inflationRate", JSON.stringify(inflationRate))
    }
  }, [inflationRate])
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-inflationAutoEnabled", String(inflationAutoEnabled))
    }
  }, [inflationAutoEnabled])
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-futureInflationMode", futureInflationMode)
    }
  }, [futureInflationMode])
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-futureInflationTargetRate", String(futureInflationTargetRate))
    }
  }, [futureInflationTargetRate])
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "calculator-futureInflationConvergenceMonths",
        String(futureInflationConvergenceMonths),
      )
    }
  }, [futureInflationConvergenceMonths])

  useEffect(() => {
    if (!enableRealValue || !inflationAutoEnabled) return
    let cancelled = false

    const loadInflation = async () => {
      setInflationKshLoading(true)
      setInflationKshError(null)
      try {
        const response = await fetch("/api/ksh/inflation")
        if (!response.ok) {
          throw new Error("KSH adat nem elerheto")
        }
        const data = await response.json()
        if (cancelled) return
        if (typeof data?.inflationPercent === "number") {
          setInflationRate(data.inflationPercent)
          setInflationKshYear(typeof data?.year === "number" ? data.year : null)
          setInflationKshValue(data.inflationPercent)
          if (Array.isArray(data?.monthlySeries)) {
            const parsed = data.monthlySeries
              .map((point: any) => ({
                year: Number(point?.year),
                month: Number(point?.month),
                inflationPercent: Number(point?.inflationPercent),
              }))
              .filter(
                (point: any) =>
                  Number.isFinite(point.year) &&
                  Number.isFinite(point.month) &&
                  point.month >= 1 &&
                  point.month <= 12 &&
                  Number.isFinite(point.inflationPercent),
              )
            setInflationKshMonthlySeries(parsed)
          } else {
            setInflationKshMonthlySeries([])
          }
        } else {
          throw new Error("KSH adat nem ertelmezheto")
        }
      } catch (error) {
        if (!cancelled) {
          setInflationKshError("KSH adat nem elerheto")
          setInflationKshMonthlySeries([])
        }
      } finally {
        if (!cancelled) {
          setInflationKshLoading(false)
        }
      }
    }

    loadInflation()
    return () => {
      cancelled = true
    }
  }, [enableRealValue, inflationAutoEnabled])

  // Collapsible states for cards

  const [isPresetCardOpen, setIsPresetCardOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-isPresetCardOpen")
      return stored === "true"
    }
    return false
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-isPresetCardOpen", String(isPresetCardOpen))
    }
  }, [isPresetCardOpen])

  const [isCustomCostsCardOpen, setIsCustomCostsCardOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-isCustomCostsCardOpen")
      return stored === "true"
    }
    return false
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-isCustomCostsCardOpen", String(isCustomCostsCardOpen))
    }
  }, [isCustomCostsCardOpen])


  const [isServicesCardOpen, setIsServicesCardOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-isServicesCardOpen")
      return stored === "true"
    }
    return false
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-isServicesCardOpen", String(isServicesCardOpen))
    }
  }, [isServicesCardOpen])

  const [isCalendarRangeOpen, setIsCalendarRangeOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-isCalendarRangeOpen")
      if (stored === null) return true
      return stored === "true"
    }
    return true
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-isCalendarRangeOpen", String(isCalendarRangeOpen))
    }
  }, [isCalendarRangeOpen])
  const [selectedInsurer, setSelectedInsurer] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-selectedInsurer")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored selectedInsurer:", e)
        }
      }
    }
    return "Allianz"
  })

  const [selectedProduct, setSelectedProduct] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-selectedProduct")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored selectedProduct:", e)
        }
      }
    }
    return "allianz_bonusz_eletprogram"
  })
  const [signalUl001PaymentMethodProfile, setSignalUl001PaymentMethodProfile] =
    useState<SignalElorelatoUl001PaymentMethodProfile>("bank-transfer")
  const [signalUl001VakProfile, setSignalUl001VakProfile] = useState<SignalElorelatoUl001VakProfile>("standard")
  const [signalUl001LoyaltyBonusEnabled, setSignalUl001LoyaltyBonusEnabled] = useState(true)
  const [union505LoyaltyBonusEligible, setUnion505LoyaltyBonusEligible] = useState(true)
  const [unionViennaTimeChannelProfile, setUnionViennaTimeChannelProfile] =
    useState<UnionViennaTimeChannelProfile>("standard")
  const [groupamaNextAllocationProfile, setGroupamaNextAllocationProfile] = useState<GroupamaNextVariant>("ul100-trad0")

  const normalizedInsurer = (selectedInsurer ?? "").trim().toLowerCase()
  const isAllianzFundMode =
    normalizedInsurer.includes("allianz") ||
    (selectedProduct !== null &&
      (selectedProduct === "allianz_eletprogram" || selectedProduct === "allianz_bonusz_eletprogram"))
  const isFortisProduct = selectedProduct === "alfa_fortis"
  const effectiveFortisVariant = isFortisProduct
    ? resolveFortisVariant(undefined, inputs.currency)
    : resolveFortisVariant(undefined, inputs.currency)
  const fortisVariantConfig = useMemo(
    () => getFortisVariantConfig(toFortisProductVariantId(effectiveFortisVariant), inputs.currency),
    [effectiveFortisVariant, inputs.currency],
  )
  const jadeVariantConfig = useMemo(
    () => getJadeVariantConfig(undefined, inputs.currency),
    [inputs.currency],
  )
  const premiumSelectionVariantConfig = useMemo(
    () => getPremiumSelectionVariantConfig(undefined, inputs.enableTaxCredit, inputs.currency),
    [inputs.enableTaxCredit, inputs.currency],
  )
  const isAllianzEletprogramView =
    selectedProduct === "allianz_eletprogram" || selectedProduct === "allianz_bonusz_eletprogram"
  const customAccountOptions = useMemo<Array<{ value: CustomEntryAccount; label: string }>>(() => {
    if (isAllianzEletprogramView) {
      return [
        { value: "main", label: "Fő" },
        { value: "eseti", label: "Eseti" },
      ]
    }

    if (isAccountSplitOpen) {
      const splitOptions: Array<{ value: CustomEntryAccount; label: string }> = [
        { value: "client", label: "Ügyfélérték" },
        { value: "invested", label: "Többletdíj" },
      ]
      if (isTaxBonusSeparateAccount) {
        splitOptions.push({ value: "taxBonus", label: "Adójóváírási számla" })
      }
      return splitOptions
    }

    return [{ value: "main", label: "Fő" }]
  }, [isAccountSplitOpen, isTaxBonusSeparateAccount, isAllianzEletprogramView])

  const normalizeCustomAccountForEditor = useCallback(
    (account: CustomEntryAccount | undefined): CustomEntryAccount => {
      if (!account) return customAccountOptions[0]?.value ?? "main"
      const valid = customAccountOptions.some((option) => option.value === account)
      return valid ? account : customAccountOptions[0]?.value ?? "main"
    },
    [customAccountOptions],
  )
  useEffect(() => {
    setManagementFees((prev) => {
      const normalized = prev.map((fee) => {
        const nextAccount = normalizeCustomAccountForEditor(fee.account)
        return nextAccount === fee.account ? fee : { ...fee, account: nextAccount }
      })
      return normalized
    })
    setBonuses((prev) => {
      const normalized = prev.map((bonus) => {
        const nextAccount = normalizeCustomAccountForEditor(bonus.account)
        return nextAccount === bonus.account ? bonus : { ...bonus, account: nextAccount }
      })
      return normalized
    })
  }, [normalizeCustomAccountForEditor])
  const canUseFundYield = Boolean(selectedProduct)
  const allowedInputCurrencies = useMemo<Currency[]>(() => {
    if (selectedProduct === "alfa_exclusive_plus") return ["HUF"]
    if (selectedProduct === "alfa_fortis") {
      return ["HUF", "EUR", "USD"]
    }
    if (selectedProduct === "union_vienna_age_505") {
      return ["HUF", "EUR", "USD"]
    }
    if (selectedProduct === "union_vienna_plan_500") {
      return ["HUF", "EUR", "USD"]
    }
    if (selectedProduct === "union_vienna_time") {
      return ["HUF"]
    }
    if (selectedProduct === "uniqa_eletcel_275") {
      return ["HUF"]
    }
    if (selectedProduct === "uniqa_premium_life_190") {
      return ["HUF"]
    }
    if (selectedProduct === "groupama_next") {
      return ["HUF"]
    }
    if (selectedProduct === "groupama_easy") {
      return ["HUF"]
    }
    if (selectedProduct === "alfa_jade") return ["EUR", "USD"]
    if (selectedProduct === "alfa_jovokep") return ["HUF"]
    if (selectedProduct === "alfa_jovotervezo") return ["HUF"]
    if (selectedProduct === "alfa_relax_plusz") return ["HUF"]
    if (selectedProduct === "nn_vista_128") return ["EUR"]
    if (
      selectedProduct === "generali_kabala" ||
      selectedProduct === "generali_mylife_extra_plusz" ||
      selectedProduct === "cig_nyugdijkotvenye" ||
      selectedProduct === "knh_hozamhalmozo" ||
      selectedProduct === "knh_nyugdijbiztositas4" ||
      selectedProduct === "nn_eletkapu_119" ||
      selectedProduct === "nn_visio_118" ||
      selectedProduct === "signal_elorelato_ul001" ||
      selectedProduct === "signal_nyugdij_terv_plusz_ny010" ||
      selectedProduct === "signal_nyugdijprogram_sn005" ||
      selectedProduct === "signal_ongondoskodasi_wl009" ||
      selectedProduct === "uniqa_eletcel_275" ||
      selectedProduct === "uniqa_premium_life_190" ||
      selectedProduct === "groupama_next" ||
      selectedProduct === "groupama_easy" ||
      selectedProduct === "posta_trend" ||
      selectedProduct === "posta_trend_nyugdij"
    ) {
      return ["HUF"]
    }
    if (selectedProduct === "nn_motiva_158") return ["HUF", "EUR"]
    if (selectedProduct === "cig_esszenciae") return ["HUF", "EUR"]
    if (selectedProduct === "metlife_manhattan") return ["HUF", "EUR"]
    if (selectedProduct === "metlife_nyugdijprogram") return ["HUF", "EUR"]
    if (selectedProduct === "alfa_zen_pro") return ["HUF", "EUR", "USD"]
    if (selectedProduct === "alfa_premium_selection") return ["HUF", "EUR", "USD"]
    if (selectedProduct === "alfa_zen") return ["EUR", "USD"]
    if (selectedProduct === "allianz_eletprogram" || selectedProduct === "allianz_bonusz_eletprogram") {
      return ["HUF", "EUR"]
    }
    return ["HUF", "EUR", "USD"]
  }, [selectedProduct])

  useEffect(() => {
    if (!allowedInputCurrencies.includes(inputs.currency)) {
      setInputs((prev) => ({ ...prev, currency: allowedInputCurrencies[0] }))
    }
  }, [allowedInputCurrencies, inputs.currency])

  const fundOptions: FundOption[] = isFortisProduct
    ? inputs.currency === "HUF"
      ? fortisHufFundOptions
      : inputs.currency === "EUR"
        ? fortisEurFundOptions
        : inputs.currency === "USD"
          ? fortisUsdFundOptions
          : baseFundOptions
    : isAllianzFundMode
      ? inputs.currency === "HUF"
        ? allianzHufFundOptions
        : inputs.currency === "EUR"
          ? allianzEurFundOptions
          : baseFundOptions
      : baseFundOptions

  useEffect(() => {
    if (yieldSourceMode !== "fund") return
    if (fundCalculationMode !== "replay") return
    if (!isAllianzFundMode) return
    if (!selectedFundId) return
    if (!(inputs.currency === "HUF" || inputs.currency === "EUR")) return
    if (!fundSeriesAvailableRange?.startDate || !fundSeriesAvailableRange?.endDate) return

    if (typeof window !== "undefined") {
      try {
        const key = `fundEarliest:${inputs.currency}:${selectedFundId}`
        const stored = sessionStorage.getItem(key)
        if (stored) {
          setFundSeriesFundEarliestAvailable(stored)
          return
        }
      } catch {
        // ignore storage access errors (private mode / blocked storage)
      }
    }

    let cancelled = false
    const controller = new AbortController()

    const run = async () => {
      try {
        const programStart = fundSeriesAvailableRange.startDate
        const programEnd = fundSeriesAvailableRange.endDate

        let probeFrom = programStart
        for (let guard = 0; guard < 40 && !cancelled; guard++) {
          const probeTo = minIsoDate(addMonthsIsoClient(probeFrom, 18), programEnd)

          const query = new URLSearchParams({
            fundId: selectedFundId,
            from: probeFrom,
            to: probeTo,
            provider: "allianz-ulexchange",
            program: "ul2005",
            currency: inputs.currency,
            mode: "replay",
          })
          const response = await fetch(`/api/funds/prices?${query.toString()}`, { signal: controller.signal })
          const data = (await response.json()) as FundSeriesApiResponse
          if (!response.ok || data.error) {
            throw new Error(data.error || "Eszközalap idősor nem elérhető")
          }

          const points = Array.isArray(data.points) ? data.points : []
          if (points.length > 0) {
            const earliest = points.reduce((min, p) => (p?.date && p.date < min ? p.date : min), points[0]!.date)
            setFundSeriesFundEarliestAvailable(earliest)
            if (typeof window !== "undefined") {
              try {
                const key = `fundEarliest:${inputs.currency}:${selectedFundId}`
                sessionStorage.setItem(key, earliest)
              } catch {
                // ignore
              }
            }
            return
          }

          if (probeTo >= programEnd) return
          probeFrom = addDaysIsoClient(probeTo, 1)
        }
      } catch {
        // ignore probe errors; UI still shows loaded span and program range
      }
    }

    run()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [
    yieldSourceMode,
    fundCalculationMode,
    isAllianzFundMode,
    selectedFundId,
    inputs.currency,
    fundSeriesAvailableRange?.startDate,
    fundSeriesAvailableRange?.endDate,
  ])

  useEffect(() => {
    if (yieldSourceMode !== "fund") return
    if (fundOptions.length === 0) return
    const currentFund = fundOptions.find((f) => f.id === selectedFundId)
    const nextFund = currentFund ?? fundOptions[0]

    if (!currentFund) {
      setSelectedFundId(nextFund.id)
    }
    setInputs((prev) =>
      prev.annualYieldPercent === nextFund.historicalYield
        ? prev
        : { ...prev, annualYieldPercent: nextFund.historicalYield },
    )
  }, [yieldSourceMode, fundOptions, selectedFundId])

  useEffect(() => {
    if (!isFortisProduct) return
    if (fundOptions.length === 0) return
    if (selectedFundId) {
      const exists = fundOptions.some((fund) => fund.id === selectedFundId)
      if (exists) return
    }
    setSelectedFundId(fundOptions[0].id)
  }, [isFortisProduct, fundOptions, selectedFundId])

  useEffect(() => {
    if (!isFortisProduct) return
    if (fundOptions.length === 0) return
    const activeFund = fundOptions.find((fund) => fund.id === selectedFundId) ?? fundOptions[0]
    if (!activeFund) return

    const vakByClass = fortisVariantConfig.vakPercentByFundClass
    const vakPercent =
      activeFund.feeClass === "bondOrMoneyMarket"
        ? vakByClass.bondOrMoneyMarket
        : activeFund.feeClass === "europeanEquityOrInternationalBond"
          ? (vakByClass.europeanEquityOrInternationalBond ?? vakByClass.bondOrMoneyMarket)
          : activeFund.feeClass === "internationalMoneyMarket"
            ? (vakByClass.internationalMoneyMarket ?? vakByClass.bondOrMoneyMarket)
            : vakByClass.equityOrMixed
    const maintenancePercent =
      activeFund.feeClass === "internationalMoneyMarket" && inputs.currency === "EUR"
        ? (fortisVariantConfig.eurMoneyMarketReducedMaintenancePercent ?? fortisVariantConfig.accountMaintenanceMonthlyPercent)
        : activeFund.feeClass === "internationalMoneyMarket" && inputs.currency === "USD"
          ? (fortisVariantConfig.usdMoneyMarketReducedMaintenancePercent ?? fortisVariantConfig.accountMaintenanceMonthlyPercent)
        : fortisVariantConfig.accountMaintenanceMonthlyPercent

    setInputs((prev) => {
      if (
        Math.abs((prev.assetBasedFeePercent ?? 0) - vakPercent) < 1e-9 &&
        Math.abs((prev.accountMaintenanceMonthlyPercent ?? 0) - maintenancePercent) < 1e-9
      ) {
        return prev
      }
      return {
        ...prev,
        assetBasedFeePercent: vakPercent,
        accountMaintenanceMonthlyPercent: maintenancePercent,
      }
    })
  }, [isFortisProduct, fundOptions, selectedFundId, fortisVariantConfig, inputs.currency])

  useEffect(() => {
    if (selectedProduct !== "alfa_premium_selection") return
    if (fundOptions.length === 0) return
    const activeFund = fundOptions.find((fund) => fund.id === selectedFundId) ?? fundOptions[0]
    if (!activeFund) return

    const maintenancePercent = resolvePremiumSelectionAccountMaintenanceMonthlyPercent(
      activeFund.id,
      premiumSelectionVariantConfig,
    )

    setInputs((prev) => {
      if (Math.abs((prev.accountMaintenanceMonthlyPercent ?? 0) - maintenancePercent) < 1e-9) {
        return prev
      }
      return {
        ...prev,
        accountMaintenanceMonthlyPercent: maintenancePercent,
      }
    })
    setProductPresetBaseline((prev) => {
      if (!prev) return prev
      if (Math.abs((prev.accountMaintenanceMonthlyPercent ?? 0) - maintenancePercent) < 1e-9) {
        return prev
      }
      return {
        ...prev,
        accountMaintenanceMonthlyPercent: maintenancePercent,
      }
    })
  }, [selectedProduct, fundOptions, selectedFundId, premiumSelectionVariantConfig])

  const getAcquisitionCostTitle = () => {
    if (
      selectedProduct === "alfa_fortis" ||
      selectedProduct === "alfa_jade" ||
      selectedProduct === "alfa_jovokep" ||
      selectedProduct === "alfa_jovotervezo" ||
      selectedProduct === "alfa_premium_selection" ||
      selectedProduct === "alfa_zen" ||
      selectedProduct === "alfa_zen_pro" ||
      selectedProduct === "cig_esszenciae" ||
      selectedProduct === "cig_nyugdijkotvenye" ||
      selectedProduct === "generali_kabala" ||
      selectedProduct === "generali_mylife_extra_plusz" ||
      selectedProduct === "alfa_exclusive_plus"
    ) {
      return "Szerződéskötési költség (év szerint)"
    }
    const baseTitle = "Akvizíciós költség (év szerint)"
    return baseTitle
  }
  const hasMapDiff = useCallback((current: Record<number, number> = {}, baseline: Record<number, number> = {}) => {
    const years = new Set<number>([
      ...Object.keys(current).map((key) => Number(key)),
      ...Object.keys(baseline).map((key) => Number(key)),
    ])
    for (const year of years) {
      const currentValue = current[year] ?? 0
      const baselineValue = baseline[year] ?? 0
      if (Math.abs(currentValue - baselineValue) > 1e-9) return true
    }
    return false
  }, [])
  const hasInitialCostOverrides = useMemo(() => {
    if (Math.abs((inputs.initialCostDefaultPercent ?? 0) - productPresetBaseline.initialCostDefaultPercent) > 1e-9) {
      return true
    }
    return hasMapDiff(inputs.initialCostByYear ?? {}, productPresetBaseline.initialCostByYear)
  }, [hasMapDiff, inputs.initialCostByYear, inputs.initialCostDefaultPercent, productPresetBaseline])
  const hasAssetCostOverrides = useMemo(
    () =>
      Math.abs((inputs.assetBasedFeePercent ?? 0) - productPresetBaseline.assetBasedFeePercent) > 1e-9 ||
      hasMapDiff(assetCostPercentByYear, productPresetBaseline.assetCostPercentByYear),
    [assetCostPercentByYear, hasMapDiff, inputs.assetBasedFeePercent, productPresetBaseline],
  )
  const hasAccountMaintenanceOverrides = useMemo(
    () =>
      Math.abs((inputs.accountMaintenanceMonthlyPercent ?? 0) - productPresetBaseline.accountMaintenanceMonthlyPercent) >
        1e-9 ||
      hasMapDiff(accountMaintenancePercentByYear, productPresetBaseline.accountMaintenancePercentByYear),
    [accountMaintenancePercentByYear, hasMapDiff, inputs.accountMaintenanceMonthlyPercent, productPresetBaseline],
  )
  const hasAdminFeeOverrides = useMemo(() => {
    if (Math.abs((inputs.adminFeePercentOfPayment ?? 0) - productPresetBaseline.adminFeePercentOfPayment) > 1e-9) {
      return true
    }
    const years = new Set<number>([
      ...Object.keys(adminFeePercentByYear).map((key) => Number(key)),
      ...Object.keys(productPresetBaseline.adminFeePercentByYear).map((key) => Number(key)),
    ])
    for (const year of years) {
      const currentValue = adminFeePercentByYear[year]
      const baselineValue =
        productPresetBaseline.adminFeePercentByYear[year] ?? productPresetBaseline.adminFeePercentOfPayment
      // Explicit per-year entry can override fallback even with 0, so key presence matters.
      if (currentValue !== undefined && Math.abs(currentValue - baselineValue) > 1e-9) {
        return true
      }
    }
    return false
  }, [adminFeePercentByYear, inputs.adminFeePercentOfPayment, productPresetBaseline])
  const hasBonusOnContributionOverrides = useMemo(
    () => hasMapDiff(bonusOnContributionPercentByYear, productPresetBaseline.bonusOnContributionPercentByYear),
    [bonusOnContributionPercentByYear, hasMapDiff, productPresetBaseline],
  )
  const hasRefundInitialCostBonusOverrides = useMemo(
    () => hasMapDiff(refundInitialCostBonusPercentByYear, productPresetBaseline.refundInitialCostBonusPercentByYear),
    [hasMapDiff, productPresetBaseline, refundInitialCostBonusPercentByYear],
  )
  const hasWealthBonusOverrides = useMemo(
    () => hasMapDiff(bonusPercentByYear, productPresetBaseline.bonusPercentByYear),
    [bonusPercentByYear, hasMapDiff, productPresetBaseline],
  )

  const [appliedPresetLabel, setAppliedPresetLabel] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string>("settings")
  const [editingFields, setEditingFields] = useState<Record<string, boolean | undefined>>({})
  const [settingsAnnualIndexDraft, setSettingsAnnualIndexDraft] = useState<string | null>(null)
  const [settingsDurationDraft, setSettingsDurationDraft] = useState<string | null>(null)
  const [settingsAnnualYieldDraft, setSettingsAnnualYieldDraft] = useState<string | null>(null)
  const [assetCostInputByYear, setAssetCostInputByYear] = useState<Record<number, string>>({})
  const [accountMaintenanceInputByYear, setAccountMaintenanceInputByYear] = useState<Record<number, string>>({})
  const [adminFeeInputByYear, setAdminFeeInputByYear] = useState<Record<number, string>>({})
  const [bonusOnContributionInputByYear, setBonusOnContributionInputByYear] = useState<Record<number, string>>({})
  const [refundInitialCostBonusInputByYear, setRefundInitialCostBonusInputByYear] = useState<Record<number, string>>({})
  const [acquisitionCostInputByYear, setAcquisitionCostInputByYear] = useState<Record<number, string>>({})

  const getAvailableProductsForInsurer = (insurer: string): ProductMetadata[] => {
    switch (insurer) {
      case "Alfa":
        return [
          {
            value: "alfa_exclusive_plus",
            label: "Alfa Exclusive Plus",
            productType: "Nyugdíjbiztosítás / Életbiztosítás",
            mnbCode: "13430 / 13450",
            productCode: "NY-05 / TR-08",
            variants: [
              {
                value: "alfa_exclusive_plus_ny05",
                label: "NY-05 (Nyugdíjbiztosítás)",
                productType: "Nyugdíjbiztosítás",
                mnbCode: "13430",
                productCode: "NY-05",
              },
              {
                value: "alfa_exclusive_plus_tr08",
                label: "TR-08 (Életbiztosítás)",
                productType: "Életbiztosítás",
                mnbCode: "13450",
                productCode: "TR-08",
              },
            ],
          },
          {
            value: "alfa_fortis",
            label: "Alfa Fortis",
            productType: "Életbiztosítás",
            mnbCode: "13470 / 13471 / 13472",
            productCode: "WL-02 / WL-12 / WL-22",
            variants: [
              {
                value: "alfa_fortis_wl02",
                label: "WL-02",
                productType: "Életbiztosítás",
                mnbCode: "13470",
                productCode: "WL-02",
              },
              {
                value: "alfa_fortis_wl12",
                label: "WL-12",
                productType: "Életbiztosítás",
                mnbCode: "13471",
                productCode: "WL-12",
              },
              {
                value: "alfa_fortis_wl22",
                label: "WL-22",
                productType: "Életbiztosítás",
                mnbCode: "13472",
                productCode: "WL-22",
              },
            ],
          },
          {
            value: "alfa_jade",
            label: "Alfa Jáde",
            productType: "Életbiztosítás",
            mnbCode: "13415 / 13416",
            productCode: "TR19 / TR29",
            variants: [
              {
                value: "alfa_jade_tr19",
                label: "TR19 (EUR)",
                productType: "Életbiztosítás",
                mnbCode: "13415",
                productCode: "TR19",
              },
              {
                value: "alfa_jade_tr29",
                label: "TR29 (USD)",
                productType: "Életbiztosítás",
                mnbCode: "13416",
                productCode: "TR29",
              },
            ],
          },
          {
            value: "alfa_jovokep",
            label: "Alfa Jövőkép",
            productType: "Életbiztosítás",
            mnbCode: "13452",
            productCode: JOVOKEP_PRODUCT_CODE,
            variants: [
              {
                value: "alfa_jovokep_tr10",
                label: "TR10 (HUF)",
                productType: "Életbiztosítás",
                mnbCode: "13452",
                productCode: JOVOKEP_PRODUCT_CODE,
              },
            ],
          },
          {
            value: "alfa_jovotervezo",
            label: "Alfa Jövőtervező",
            productType: "Életbiztosítás",
            mnbCode: "13403",
            productCode: JOVOTERVEZO_PRODUCT_CODE,
            variants: [
              {
                value: "alfa_jovotervezo_tr03",
                label: "TR03 (HUF)",
                productType: "Életbiztosítás",
                mnbCode: "13403",
                productCode: JOVOTERVEZO_PRODUCT_CODE,
              },
            ],
          },
          {
            value: "alfa_premium_selection",
            label: "Alfa Premium Selection",
            productType: "Nyugdíjbiztosítás / Életbiztosítás",
            mnbCode: "13431 / 13451 / 13413 / 13422 / 13414 / 13423",
            productCode: `${PREMIUM_SELECTION_PRODUCT_CODE} / ${PREMIUM_SELECTION_NYUGDIJ_PRODUCT_CODE} / ${PREMIUM_SELECTION_EUR_PRODUCT_CODE} / ${PREMIUM_SELECTION_NY12_PRODUCT_CODE} / ${PREMIUM_SELECTION_USD_PRODUCT_CODE} / ${PREMIUM_SELECTION_NY22_PRODUCT_CODE}`,
            variants: [
              {
                value: "alfa_premium_selection_tr09",
                label: "TR09 (HUF)",
                productType: "Életbiztosítás",
                mnbCode: "13431",
                productCode: PREMIUM_SELECTION_PRODUCT_CODE,
              },
              {
                value: "alfa_premium_selection_ny06",
                label: "NY06 (Nyugdíjbiztosítás)",
                productType: "Nyugdíjbiztosítás",
                mnbCode: "13451",
                productCode: PREMIUM_SELECTION_NYUGDIJ_PRODUCT_CODE,
              },
              {
                value: "alfa_premium_selection_tr18",
                label: "TR18 (EUR)",
                productType: "Életbiztosítás",
                mnbCode: "13413",
                productCode: PREMIUM_SELECTION_EUR_PRODUCT_CODE,
              },
              {
                value: "alfa_premium_selection_ny12",
                label: "NY12 (EUR Nyugdíjbiztosítás)",
                productType: "Nyugdíjbiztosítás",
                mnbCode: "13422",
                productCode: PREMIUM_SELECTION_NY12_PRODUCT_CODE,
              },
              {
                value: "alfa_premium_selection_tr28",
                label: "TR28 (USD)",
                productType: "Életbiztosítás",
                mnbCode: "13414",
                productCode: PREMIUM_SELECTION_USD_PRODUCT_CODE,
              },
              {
                value: "alfa_premium_selection_ny22",
                label: "NY22 (USD Nyugdíjbiztosítás)",
                productType: "Nyugdíjbiztosítás",
                mnbCode: "13423",
                productCode: PREMIUM_SELECTION_NY22_PRODUCT_CODE,
              },
            ],
          },
          {
            value: "alfa_relax_plusz",
            label: "Alfa Relax Plusz",
            productType: "Nyugdíjbiztosítás",
            mnbCode: "13401",
            productCode: RELAX_PLUSZ_PRODUCT_CODE,
            variants: [
              {
                value: "alfa_relax_plusz_ny01",
                label: "NY01 (Nyugdíjbiztosítás)",
                productType: "Nyugdíjbiztosítás",
                mnbCode: "13401",
                productCode: RELAX_PLUSZ_PRODUCT_CODE,
              },
            ],
          },
          {
            value: "alfa_zen",
            label: "Alfa Zen",
            productType: "Nyugdíjbiztosítás",
            mnbCode: "13424 / 13425",
            productCode: `${ALFA_ZEN_NY13_PRODUCT_CODE} / ${ALFA_ZEN_NY23_PRODUCT_CODE}`,
            variants: [
              {
                value: "alfa_zen_ny13",
                label: "NY13 (EUR Nyugdíjbiztosítás)",
                productType: "Nyugdíjbiztosítás",
                mnbCode: "13424",
                productCode: ALFA_ZEN_NY13_PRODUCT_CODE,
              },
              {
                value: "alfa_zen_ny23",
                label: "NY23 (USD Nyugdíjbiztosítás)",
                productType: "Nyugdíjbiztosítás",
                mnbCode: "13425",
                productCode: ALFA_ZEN_NY23_PRODUCT_CODE,
              },
            ],
          },
          {
            value: "alfa_zen_pro",
            label: "Alfa Zen Pro",
            productType: "Nyugdíjbiztosítás",
            mnbCode: "13433 / 13426 / 13427",
            productCode: `${ZEN_PRO_NY08_PRODUCT_CODE} / ${ZEN_PRO_NY14_PRODUCT_CODE} / ${ZEN_PRO_NY24_PRODUCT_CODE}`,
            variants: [
              {
                value: "alfa_zen_pro_ny08",
                label: "NY-08 (HUF Nyugdíjbiztosítás)",
                productType: "Nyugdíjbiztosítás",
                mnbCode: "13433",
                productCode: ZEN_PRO_NY08_PRODUCT_CODE,
              },
              {
                value: "alfa_zen_pro_ny14",
                label: "NY-14 (EUR Nyugdíjbiztosítás)",
                productType: "Nyugdíjbiztosítás",
                mnbCode: "13426",
                productCode: ZEN_PRO_NY14_PRODUCT_CODE,
              },
              {
                value: "alfa_zen_pro_ny24",
                label: "NY-24 (USD Nyugdíjbiztosítás)",
                productType: "Nyugdíjbiztosítás",
                mnbCode: "13427",
                productCode: ZEN_PRO_NY24_PRODUCT_CODE,
              },
            ],
          },
          // </CHANGE>
        ]
      case "Allianz":
        return [
          {
            value: "allianz_eletprogram",
            label: "Allianz Életprogram",
            productType: "Életbiztosítás",
            mnbCode: "12345",
            productCode: "AL-01",
          },
          {
            value: "allianz_bonusz_eletprogram",
            label: "Allianz Bónusz Életprogram",
            productType: "Életbiztosítás",
            mnbCode: "12346",
            productCode: "AL-02",
          },
        ]
      case "CIG Pannonia":
        return [
          {
            value: "cig_esszenciae",
            label: "CIG Pannonia EsszenciaE",
            productType: "Életbiztosítás",
            mnbCode: `${CIG_ESSZENCIAE_HUF_MNB_CODE} / ${CIG_ESSZENCIAE_EUR_MNB_CODE}`,
            productCode: CIG_ESSZENCIAE_PRODUCT_CODE,
            variants: [
              {
                value: CIG_ESSZENCIAE_PRODUCT_VARIANT_HUF,
                label: "EsszenciaE (HUF)",
                productType: "Életbiztosítás",
                mnbCode: CIG_ESSZENCIAE_HUF_MNB_CODE,
                productCode: CIG_ESSZENCIAE_PRODUCT_CODE,
              },
              {
                value: CIG_ESSZENCIAE_PRODUCT_VARIANT_EUR,
                label: "EsszenciaE (EUR)",
                productType: "Életbiztosítás",
                mnbCode: CIG_ESSZENCIAE_EUR_MNB_CODE,
                productCode: CIG_ESSZENCIAE_PRODUCT_CODE,
              },
            ],
          },
          {
            value: "cig_nyugdijkotvenye",
            label: "CIG Pannonia NyugdijkotvenyE",
            productType: "Nyugdíjbiztosítás",
            mnbCode: CIG_NYUGDIJKOTVENYE_PRODUCT_CODE,
            productCode: CIG_NYUGDIJKOTVENYE_PRODUCT_CODE,
            variants: [
              {
                value: CIG_NYUGDIJKOTVENYE_PRODUCT_VARIANT,
                label: `${CIG_NYUGDIJKOTVENYE_PRODUCT_CODE} (Nyugdíjbiztosítás)`,
                productType: "Nyugdíjbiztosítás",
                mnbCode: CIG_NYUGDIJKOTVENYE_PRODUCT_CODE,
                productCode: CIG_NYUGDIJKOTVENYE_PRODUCT_CODE,
              },
            ],
          },
        ]
      case "Generali":
        return [
          {
            value: "generali_kabala",
            label: "Generali Kabala",
            productType: "Életbiztosítás / Nyugdíjbiztosítás",
            mnbCode: GENERALI_KABALA_U91_PRODUCT_CODE,
            productCode: GENERALI_KABALA_U91_PRODUCT_CODE,
            variants: [
              {
                value: "generali_kabala_u91_life",
                label: "U91 (Életbiztosítás)",
                productType: "Életbiztosítás",
                mnbCode: GENERALI_KABALA_U91_PRODUCT_CODE,
                productCode: GENERALI_KABALA_U91_PRODUCT_CODE,
              },
              {
                value: "generali_kabala_u91_pension",
                label: "U91 (Nyugdíjbiztosítás)",
                productType: "Nyugdíjbiztosítás",
                mnbCode: GENERALI_KABALA_U91_PRODUCT_CODE,
                productCode: GENERALI_KABALA_U91_PRODUCT_CODE,
              },
            ],
          },
          {
            value: "generali_mylife_extra_plusz",
            label: "Generali MyLife Extra Plusz",
            productType: "Életbiztosítás / Nyugdíjbiztosítás",
            mnbCode: GENERALI_MYLIFE_EXTRA_PLUSZ_PRODUCT_CODE,
            productCode: GENERALI_MYLIFE_EXTRA_PLUSZ_PRODUCT_CODE,
            variants: [
              {
                value: "generali_mylife_extra_plusz_u67p_life",
                label: "U67P (Életbiztosítás)",
                productType: "Életbiztosítás",
                mnbCode: GENERALI_MYLIFE_EXTRA_PLUSZ_PRODUCT_CODE,
                productCode: GENERALI_MYLIFE_EXTRA_PLUSZ_PRODUCT_CODE,
              },
              {
                value: "generali_mylife_extra_plusz_u67p_pension",
                label: "U67P (Nyugdíjbiztosítás)",
                productType: "Nyugdíjbiztosítás",
                mnbCode: GENERALI_MYLIFE_EXTRA_PLUSZ_PRODUCT_CODE,
                productCode: GENERALI_MYLIFE_EXTRA_PLUSZ_PRODUCT_CODE,
              },
            ],
          },
        ]
      case "Grupama":
        return [
          {
            value: "groupama_easy",
            label: "Groupama Easy Életbiztosítás",
            productType: "Életbiztosítás",
            mnbCode: GROUPAMA_EASY_MNB_CODE,
            productCode: GROUPAMA_EASY_PRODUCT_CODE,
            variants: [
              {
                value: GROUPAMA_EASY_PRODUCT_VARIANT_LIFE_HUF,
                label: "Easy Life (adójóváírás nélkül)",
                productType: "Életbiztosítás",
                mnbCode: GROUPAMA_EASY_MNB_CODE,
                productCode: GROUPAMA_EASY_PRODUCT_CODE,
              },
              {
                value: GROUPAMA_EASY_PRODUCT_VARIANT_LIFE_TAX_HUF,
                label: "Easy Life (adójóváírással)",
                productType: "Életbiztosítás",
                mnbCode: GROUPAMA_EASY_MNB_CODE,
                productCode: GROUPAMA_EASY_PRODUCT_CODE,
              },
            ],
          },
          {
            value: "groupama_next",
            label: "Groupama Next Életbiztosítás",
            productType: "Életbiztosítás",
            mnbCode: GROUPAMA_NEXT_MNB_CODE,
            productCode: GROUPAMA_NEXT_PRODUCT_CODE,
            variants: [
              {
                value: GROUPAMA_NEXT_PRODUCT_VARIANT_UL100_TRAD0,
                label: "100% UL / 0% hagyományos",
                productType: "Életbiztosítás",
                mnbCode: GROUPAMA_NEXT_MNB_CODE,
                productCode: GROUPAMA_NEXT_PRODUCT_CODE,
              },
              {
                value: GROUPAMA_NEXT_PRODUCT_VARIANT_UL75_TRAD25,
                label: "75% UL / 25% hagyományos",
                productType: "Életbiztosítás",
                mnbCode: GROUPAMA_NEXT_MNB_CODE,
                productCode: GROUPAMA_NEXT_PRODUCT_CODE,
              },
              {
                value: GROUPAMA_NEXT_PRODUCT_VARIANT_UL0_TRAD100,
                label: "0% UL / 100% hagyományos",
                productType: "Életbiztosítás",
                mnbCode: GROUPAMA_NEXT_MNB_CODE,
                productCode: GROUPAMA_NEXT_PRODUCT_CODE,
              },
            ],
          },
        ]
      case "KnH":
        return [
          {
            value: "knh_hozamhalmozo",
            label: "K&H Hozamhalmozo 4",
            productType: "Életbiztosítás",
            mnbCode: KNH_HOZAMHALMOZO_MNB_CODE,
            productCode: KNH_HOZAMHALMOZO_PRODUCT_CODE,
            variants: [
              {
                value: KNH_HOZAMHALMOZO_PRODUCT_VARIANT_HUF,
                label: "HUF",
                productType: "Életbiztosítás",
                mnbCode: KNH_HOZAMHALMOZO_MNB_CODE,
                productCode: KNH_HOZAMHALMOZO_PRODUCT_CODE,
              },
            ],
          },
          {
            value: "knh_nyugdijbiztositas4",
            label: "K&H Nyugdijbiztositas 4",
            productType: "Nyugdíjbiztosítás",
            mnbCode: KNH_NYUGDIJBIZTOSITAS4_MNB_CODE,
            productCode: KNH_NYUGDIJBIZTOSITAS4_PRODUCT_CODE,
            variants: [
              {
                value: KNH_NYUGDIJBIZTOSITAS4_PRODUCT_VARIANT_HUF,
                label: "HUF",
                productType: "Nyugdíjbiztosítás",
                mnbCode: KNH_NYUGDIJBIZTOSITAS4_MNB_CODE,
                productCode: KNH_NYUGDIJBIZTOSITAS4_PRODUCT_CODE,
              },
            ],
          },
        ]
      case "Magyar Posta":
        return [
          {
            value: "posta_trend",
            label: "Posta Trend",
            productType: "Életbiztosítás",
            mnbCode: POSTA_TREND_MNB_CODE,
            productCode: POSTA_TREND_PRODUCT_CODE,
            variants: [
              {
                value: POSTA_TREND_PRODUCT_VARIANT_HUF,
                label: "HUF",
                productType: "Életbiztosítás",
                mnbCode: POSTA_TREND_MNB_CODE,
                productCode: POSTA_TREND_PRODUCT_CODE,
              },
            ],
          },
          {
            value: "posta_trend_nyugdij",
            label: "Posta Trend Nyugdij",
            productType: "Nyugdíjbiztosítás",
            mnbCode: POSTA_TREND_NYUGDIJ_MNB_CODE,
            productCode: POSTA_TREND_NYUGDIJ_PRODUCT_CODE,
            variants: [
              {
                value: POSTA_TREND_NYUGDIJ_PRODUCT_VARIANT_HUF,
                label: "HUF",
                productType: "Nyugdíjbiztosítás",
                mnbCode: POSTA_TREND_NYUGDIJ_MNB_CODE,
                productCode: POSTA_TREND_NYUGDIJ_PRODUCT_CODE,
              },
            ],
          },
        ]
      case "MetLife":
        return [
          {
            value: "metlife_manhattan",
            label: "MetLife Manhattan",
            productType: "Életbiztosítás",
            mnbCode: `${METLIFE_MANHATTAN_HUF_MNB_CODE} / ${METLIFE_MANHATTAN_EUR_MNB_CODE}`,
            productCode: `${METLIFE_MANHATTAN_PRODUCT_CODE_HUF} / ${METLIFE_MANHATTAN_PRODUCT_CODE_EUR}`,
            variants: [
              {
                value: METLIFE_MANHATTAN_PRODUCT_VARIANT_HUF,
                label: "MET-689 (HUF)",
                productType: "Életbiztosítás",
                mnbCode: METLIFE_MANHATTAN_HUF_MNB_CODE,
                productCode: METLIFE_MANHATTAN_PRODUCT_CODE_HUF,
              },
              {
                value: METLIFE_MANHATTAN_PRODUCT_VARIANT_EUR,
                label: "MET-789 (EUR)",
                productType: "Életbiztosítás",
                mnbCode: METLIFE_MANHATTAN_EUR_MNB_CODE,
                productCode: METLIFE_MANHATTAN_PRODUCT_CODE_EUR,
              },
            ],
          },
          {
            value: "metlife_nyugdijprogram",
            label: "MetLife Nyugdijprogram",
            productType: "Nyugdíjbiztosítás",
            mnbCode: `${METLIFE_NYUGDIJPROGRAM_HUF_MNB_CODE} / ${METLIFE_NYUGDIJPROGRAM_EUR_MNB_CODE}`,
            productCode: `${METLIFE_NYUGDIJPROGRAM_PRODUCT_CODE_HUF} / ${METLIFE_NYUGDIJPROGRAM_PRODUCT_CODE_EUR}`,
            variants: [
              {
                value: METLIFE_NYUGDIJPROGRAM_PRODUCT_VARIANT_HUF,
                label: "MET-688 (HUF)",
                productType: "Nyugdíjbiztosítás",
                mnbCode: METLIFE_NYUGDIJPROGRAM_HUF_MNB_CODE,
                productCode: METLIFE_NYUGDIJPROGRAM_PRODUCT_CODE_HUF,
              },
              {
                value: METLIFE_NYUGDIJPROGRAM_PRODUCT_VARIANT_EUR,
                label: "MET-788 (EUR)",
                productType: "Nyugdíjbiztosítás",
                mnbCode: METLIFE_NYUGDIJPROGRAM_EUR_MNB_CODE,
                productCode: METLIFE_NYUGDIJPROGRAM_PRODUCT_CODE_EUR,
              },
            ],
          },
        ]
      case "NN":
        return [
          {
            value: "nn_eletkapu_119",
            label: "NN Életkapu 119",
            productType: "Életbiztosítás",
            mnbCode: NN_ELETKAPU_119_MNB_CODE,
            productCode: NN_ELETKAPU_119_PRODUCT_CODE,
            variants: [
              {
                value: NN_ELETKAPU_119_PRODUCT_VARIANT_HUF,
                label: "119 (HUF)",
                productType: "Életbiztosítás",
                mnbCode: NN_ELETKAPU_119_MNB_CODE,
                productCode: NN_ELETKAPU_119_PRODUCT_CODE,
              },
            ],
          },
          {
            value: "nn_motiva_158",
            label: "NN Motiva 158",
            productType: "Nyugdíjbiztosítás",
            mnbCode: `${NN_MOTIVA_158_MNB_CODE} / ${NN_MOTIVA_168_MNB_CODE}`,
            productCode: `${NN_MOTIVA_158_PRODUCT_CODE} / ${NN_MOTIVA_168_PRODUCT_CODE}`,
            variants: [
              {
                value: NN_MOTIVA_158_PRODUCT_VARIANT_HUF,
                label: "158 (HUF)",
                productType: "Nyugdíjbiztosítás",
                mnbCode: NN_MOTIVA_158_MNB_CODE,
                productCode: NN_MOTIVA_158_PRODUCT_CODE,
              },
              {
                value: NN_MOTIVA_168_PRODUCT_VARIANT_EUR,
                label: "168 (EUR)",
                productType: "Nyugdíjbiztosítás",
                mnbCode: NN_MOTIVA_168_MNB_CODE,
                productCode: NN_MOTIVA_168_PRODUCT_CODE,
              },
            ],
          },
          {
            value: "nn_visio_118",
            label: "NN Visio 118",
            productType: "Életbiztosítás",
            mnbCode: NN_VISIO_118_MNB_CODE,
            productCode: NN_VISIO_118_PRODUCT_CODE,
            variants: [
              {
                value: NN_VISIO_118_PRODUCT_VARIANT_HUF,
                label: "118 (HUF)",
                productType: "Életbiztosítás",
                mnbCode: NN_VISIO_118_MNB_CODE,
                productCode: NN_VISIO_118_PRODUCT_CODE,
              },
            ],
          },
          {
            value: "nn_vista_128",
            label: "NN Vista 128",
            productType: "Életbiztosítás",
            mnbCode: NN_VISTA_128_MNB_CODE,
            productCode: NN_VISTA_128_PRODUCT_CODE,
            variants: [
              {
                value: NN_VISTA_128_PRODUCT_VARIANT_EUR,
                label: "128 (EUR)",
                productType: "Életbiztosítás",
                mnbCode: NN_VISTA_128_MNB_CODE,
                productCode: NN_VISTA_128_PRODUCT_CODE,
              },
            ],
          },
        ]
      case "Signal Iduna":
        return [
          {
            value: "signal_elorelato_ul001",
            label: "Előrelátó Program",
            productType: "Életbiztosítás",
            mnbCode: SIGNAL_ELORELATO_UL001_MNB_CODE,
            productCode: SIGNAL_ELORELATO_UL001_PRODUCT_CODE,
            variants: [
              {
                value: SIGNAL_ELORELATO_UL001_PRODUCT_VARIANT_HUF,
                label: "UL001 (HUF)",
                productType: "Életbiztosítás",
                mnbCode: SIGNAL_ELORELATO_UL001_MNB_CODE,
                productCode: SIGNAL_ELORELATO_UL001_PRODUCT_CODE,
              },
            ],
          },
          {
            value: "signal_nyugdij_terv_plusz_ny010",
            label: "SIGNAL Nyugdíj terv Plusz",
            productType: "Nyugdíjbiztosítás",
            mnbCode: SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_MNB_CODE,
            productCode: SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PRODUCT_CODE,
            variants: [
              {
                value: SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PRODUCT_VARIANT_HUF,
                label: "NY010 (HUF)",
                productType: "Nyugdíjbiztosítás",
                mnbCode: SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_MNB_CODE,
                productCode: SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PRODUCT_CODE,
              },
            ],
          },
          {
            value: "signal_nyugdijprogram_sn005",
            label: "SIGNAL IDUNA Nyugdíjprogram",
            productType: "Nyugdíjbiztosítás",
            mnbCode: SIGNAL_NYUGDIJPROGRAM_SN005_MNB_CODE,
            productCode: SIGNAL_NYUGDIJPROGRAM_SN005_PRODUCT_CODE,
            variants: [
              {
                value: SIGNAL_NYUGDIJPROGRAM_SN005_PRODUCT_VARIANT_HUF,
                label: "SN005 (HUF)",
                productType: "Nyugdíjbiztosítás",
                mnbCode: SIGNAL_NYUGDIJPROGRAM_SN005_MNB_CODE,
                productCode: SIGNAL_NYUGDIJPROGRAM_SN005_PRODUCT_CODE,
              },
            ],
          },
          {
            value: "signal_ongondoskodasi_wl009",
            label: "Öngondoskodási terv 2.0 Plusz",
            productType: "Életbiztosítás",
            mnbCode: SIGNAL_ONGONDOSKODASI_WL009_MNB_CODE,
            productCode: SIGNAL_ONGONDOSKODASI_WL009_PRODUCT_CODE,
            variants: [
              {
                value: SIGNAL_ONGONDOSKODASI_WL009_PRODUCT_VARIANT_HUF,
                label: "WL009 (HUF)",
                productType: "Életbiztosítás",
                mnbCode: SIGNAL_ONGONDOSKODASI_WL009_MNB_CODE,
                productCode: SIGNAL_ONGONDOSKODASI_WL009_PRODUCT_CODE,
              },
            ],
          },
        ]
      case "Union":
        return [
          {
            value: "union_vienna_age_505",
            label: "UNION Vienna Age Nyugdíjbiztosítás",
            productType: "Nyugdíjbiztosítás",
            mnbCode: UNION_VIENNA_AGE_505_MNB_CODE,
            productCode: `${UNION_VIENNA_AGE_505_PRODUCT_CODE_HUF} / ${UNION_VIENNA_AGE_505_PRODUCT_CODE_EUR} / ${UNION_VIENNA_AGE_505_PRODUCT_CODE_USD}`,
            variants: [
              {
                value: UNION_VIENNA_AGE_505_PRODUCT_VARIANT_HUF,
                label: "505 (HUF)",
                productType: "Nyugdíjbiztosítás",
                mnbCode: UNION_VIENNA_AGE_505_MNB_CODE,
                productCode: UNION_VIENNA_AGE_505_PRODUCT_CODE_HUF,
              },
              {
                value: UNION_VIENNA_AGE_505_PRODUCT_VARIANT_EUR,
                label: "505 (EUR)",
                productType: "Nyugdíjbiztosítás",
                mnbCode: UNION_VIENNA_AGE_505_MNB_CODE,
                productCode: UNION_VIENNA_AGE_505_PRODUCT_CODE_EUR,
              },
              {
                value: UNION_VIENNA_AGE_505_PRODUCT_VARIANT_USD,
                label: "505 (USD)",
                productType: "Nyugdíjbiztosítás",
                mnbCode: UNION_VIENNA_AGE_505_MNB_CODE,
                productCode: UNION_VIENNA_AGE_505_PRODUCT_CODE_USD,
              },
            ],
          },
          {
            value: "union_vienna_plan_500",
            label: "UNION Vienna Plan Életbiztosítás",
            productType: "Életbiztosítás",
            mnbCode: UNION_VIENNA_PLAN_500_MNB_CODE,
            productCode: `${UNION_VIENNA_PLAN_500_PRODUCT_CODE_HUF} / ${UNION_VIENNA_PLAN_500_PRODUCT_CODE_EUR} / ${UNION_VIENNA_PLAN_500_PRODUCT_CODE_USD}`,
            variants: [
              {
                value: UNION_VIENNA_PLAN_500_PRODUCT_VARIANT_HUF,
                label: "500 (HUF)",
                productType: "Életbiztosítás",
                mnbCode: UNION_VIENNA_PLAN_500_MNB_CODE,
                productCode: UNION_VIENNA_PLAN_500_PRODUCT_CODE_HUF,
              },
              {
                value: UNION_VIENNA_PLAN_500_PRODUCT_VARIANT_EUR,
                label: "500 (EUR)",
                productType: "Életbiztosítás",
                mnbCode: UNION_VIENNA_PLAN_500_MNB_CODE,
                productCode: UNION_VIENNA_PLAN_500_PRODUCT_CODE_EUR,
              },
              {
                value: UNION_VIENNA_PLAN_500_PRODUCT_VARIANT_USD,
                label: "500 (USD)",
                productType: "Életbiztosítás",
                mnbCode: UNION_VIENNA_PLAN_500_MNB_CODE,
                productCode: UNION_VIENNA_PLAN_500_PRODUCT_CODE_USD,
              },
            ],
          },
          {
            value: "union_vienna_time",
            label: "UNION Vienna Time Nyugdíjbiztosítás",
            productType: "Nyugdíjbiztosítás",
            mnbCode: `${UNION_VIENNA_TIME_MNB_CODE_564} / ${UNION_VIENNA_TIME_MNB_CODE_584} / ${UNION_VIENNA_TIME_MNB_CODE_606}`,
            productCode: "564 / 584 / 606",
            variants: [
              {
                value: UNION_VIENNA_TIME_PRODUCT_VARIANT_564,
                label: "Erste 564 (HUF)",
                productType: "Nyugdíjbiztosítás",
                mnbCode: UNION_VIENNA_TIME_MNB_CODE_564,
                productCode: "564",
              },
              {
                value: UNION_VIENNA_TIME_PRODUCT_VARIANT_584,
                label: "Standard 584 (HUF)",
                productType: "Nyugdíjbiztosítás",
                mnbCode: UNION_VIENNA_TIME_MNB_CODE_584,
                productCode: "584",
              },
              {
                value: UNION_VIENNA_TIME_PRODUCT_VARIANT_606,
                label: "Select 606 (HUF)",
                productType: "Nyugdíjbiztosítás",
                mnbCode: UNION_VIENNA_TIME_MNB_CODE_606,
                productCode: "606",
              },
            ],
          },
          {
            value: "union_classic",
            label: "Classic",
            productType: "Életbiztosítás",
            mnbCode: "98765",
            productCode: "UN-01",
          },
        ]
      case "Uniqa":
        return [
          {
            value: "uniqa_eletcel_275",
            label: "Életcél",
            productType: "Életbiztosítás",
            mnbCode: UNIQA_ELETCEL_275_MNB_CODE,
            productCode: UNIQA_ELETCEL_275_PRODUCT_CODE,
            variants: [
              {
                value: UNIQA_ELETCEL_275_PRODUCT_VARIANT_HUF,
                label: "275 (HUF)",
                productType: "Életbiztosítás",
                mnbCode: UNIQA_ELETCEL_275_MNB_CODE,
                productCode: UNIQA_ELETCEL_275_PRODUCT_CODE,
              },
            ],
          },
          {
            value: "uniqa_premium_life_190",
            label: "Premium Life",
            productType: "Életbiztosítás",
            mnbCode: UNIQA_PREMIUM_LIFE_190_MNB_CODE,
            productCode: UNIQA_PREMIUM_LIFE_190_PRODUCT_CODE,
            variants: [
              {
                value: UNIQA_PREMIUM_LIFE_190_PRODUCT_VARIANT_HUF,
                label: "190 (HUF)",
                productType: "Életbiztosítás",
                mnbCode: UNIQA_PREMIUM_LIFE_190_MNB_CODE,
                productCode: UNIQA_PREMIUM_LIFE_190_PRODUCT_CODE,
              },
            ],
          },
        ]
      default:
        return []
    }
  }

  const getAvailableProducts = () => {
    if (!selectedInsurer) return []
    return getAvailableProductsForInsurer(selectedInsurer)
  }

  const selectedProductMetadata = useMemo(() => {
    if (!selectedInsurer || !selectedProduct) return null
    return getAvailableProductsForInsurer(selectedInsurer).find((p) => p.value === selectedProduct) ?? null
  }, [selectedInsurer, selectedProduct])

  const effectiveSelectedProductVariantCode = useMemo(() => {
    if (selectedProduct === "alfa_exclusive_plus") {
      return inputs.enableTaxCredit ? "NY-05" : "TR-08"
    }
    if (selectedProduct === "alfa_fortis") {
      return fortisVariantConfig.code
    }
    if (selectedProduct === "alfa_jade") {
      return getJadeVariantConfig(undefined, inputs.currency).code
    }
    if (selectedProduct === "alfa_jovokep") {
      return JOVOKEP_PRODUCT_CODE
    }
    if (selectedProduct === "alfa_jovotervezo") {
      return JOVOTERVEZO_PRODUCT_CODE
    }
    if (selectedProduct === "alfa_premium_selection") {
      return getPremiumSelectionVariantConfig(undefined, inputs.enableTaxCredit, inputs.currency).code
    }
    if (selectedProduct === "alfa_zen" || selectedProduct === "alfa_zen_eur") {
      return getAlfaZenVariantConfig(undefined, inputs.currency).code
    }
    if (selectedProduct === "alfa_zen_pro") {
      return getZenProVariantConfig(undefined, inputs.currency).code
    }
    if (selectedProduct === "generali_kabala") {
      return getGeneraliKabalaU91VariantConfig(undefined, inputs.enableTaxCredit).code
    }
    if (selectedProduct === "generali_mylife_extra_plusz") {
      return getGeneraliMylifeExtraPluszVariantConfig(undefined, inputs.enableTaxCredit).code
    }
    if (selectedProduct === "cig_nyugdijkotvenye") {
      return CIG_NYUGDIJKOTVENYE_PRODUCT_CODE
    }
    if (selectedProduct === "cig_esszenciae") {
      return CIG_ESSZENCIAE_PRODUCT_CODE
    }
    if (selectedProduct === "knh_hozamhalmozo") {
      return getKnhHozamhalmozoVariantConfig().productCode
    }
    if (selectedProduct === "knh_nyugdijbiztositas4") {
      return getKnhNyugdijbiztositas4VariantConfig().productCode
    }
    if (selectedProduct === "metlife_manhattan") {
      return getMetlifeManhattanVariantConfig(undefined, inputs.currency).productCode
    }
    if (selectedProduct === "metlife_nyugdijprogram") {
      return getMetlifeNyugdijprogramVariantConfig(undefined, inputs.currency).productCode
    }
    if (selectedProduct === "posta_trend") {
      return getPostaTrendVariantConfig().productCode
    }
    if (selectedProduct === "posta_trend_nyugdij") {
      return getPostaTrendNyugdijVariantConfig().productCode
    }
    if (selectedProduct === "nn_eletkapu_119") {
      return getNnEletkapu119VariantConfig().productCode
    }
    if (selectedProduct === "nn_motiva_158") {
      return getNnMotiva158VariantConfig(
        undefined,
        resolveNnMotiva158VariantFromInputs({ currency: inputs.currency }),
      ).productCode
    }
    if (selectedProduct === "nn_visio_118") {
      return getNnVisio118VariantConfig().productCode
    }
    if (selectedProduct === "nn_vista_128") {
      return getNnVista128VariantConfig().productCode
    }
    if (selectedProduct === "signal_elorelato_ul001") {
      return getSignalElorelatoUl001VariantConfig().productCode
    }
    if (selectedProduct === "signal_nyugdij_terv_plusz_ny010") {
      return getSignalNyugdijTervPluszNy010VariantConfig().productCode
    }
    if (selectedProduct === "signal_nyugdijprogram_sn005") {
      return getSignalNyugdijprogramSn005VariantConfig().productCode
    }
    if (selectedProduct === "signal_ongondoskodasi_wl009") {
      return getSignalOngondoskodasiWl009VariantConfig().productCode
    }
    if (selectedProduct === "union_vienna_age_505") {
      return getUnionViennaAge505VariantConfig(undefined, inputs.currency).productCode
    }
    if (selectedProduct === "union_vienna_plan_500") {
      return getUnionViennaPlan500VariantConfig(undefined, inputs.currency).productCode
    }
    if (selectedProduct === "union_vienna_time") {
      return getUnionViennaTimeVariantConfig(undefined, unionViennaTimeChannelProfile).productCode
    }
    if (selectedProduct === "uniqa_eletcel_275") {
      return getUniqaEletcel275VariantConfig().productCode
    }
    if (selectedProduct === "uniqa_premium_life_190") {
      return getUniqaPremiumLife190VariantConfig().productCode
    }
    if (selectedProduct === "groupama_next") {
      return getGroupamaNextVariantConfig(toGroupamaNextProductVariantId(groupamaNextAllocationProfile)).productCode
    }
    if (selectedProduct === "groupama_easy") {
      return getGroupamaEasyVariantConfig(undefined, inputs.enableTaxCredit).productCode
    }
    return undefined
  }, [
    selectedProduct,
    inputs.enableTaxCredit,
    fortisVariantConfig.code,
    inputs.currency,
    unionViennaTimeChannelProfile,
    groupamaNextAllocationProfile,
    inputs.enableTaxCredit,
  ])

  const activeProductVariantMetadata = useMemo(() => {
    if (!selectedProductMetadata?.variants || selectedProductMetadata.variants.length === 0) return null
    if (selectedProduct === "alfa_exclusive_plus") {
      const wantedCode = inputs.enableTaxCredit ? "NY-05" : "TR-08"
      return (
        selectedProductMetadata.variants.find((variant) => variant.productCode === wantedCode) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "alfa_fortis") {
      return (
        selectedProductMetadata.variants.find((variant) => variant.productCode === fortisVariantConfig.code) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "alfa_jade") {
      const wantedCode = getJadeVariantConfig(undefined, inputs.currency).code
      return (
        selectedProductMetadata.variants.find((variant) => variant.productCode === wantedCode) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "alfa_jovokep") {
      return (
        selectedProductMetadata.variants.find((variant) => variant.productCode === JOVOKEP_PRODUCT_CODE) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "alfa_jovotervezo") {
      return (
        selectedProductMetadata.variants.find((variant) => variant.productCode === JOVOTERVEZO_PRODUCT_CODE) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "alfa_premium_selection") {
      const wantedCode = getPremiumSelectionVariantConfig(undefined, inputs.enableTaxCredit, inputs.currency).code
      return (
        selectedProductMetadata.variants.find((variant) => variant.productCode === wantedCode) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "alfa_relax_plusz") {
      return (
        selectedProductMetadata.variants.find((variant) => variant.productCode === RELAX_PLUSZ_PRODUCT_CODE) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "alfa_zen" || selectedProduct === "alfa_zen_eur") {
      const wantedCode = getAlfaZenVariantConfig(undefined, inputs.currency).code
      return (
        selectedProductMetadata.variants.find((variant) => variant.productCode === wantedCode) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "alfa_zen_pro") {
      const wantedCode = getZenProVariantConfig(undefined, inputs.currency).code
      return (
        selectedProductMetadata.variants.find((variant) => variant.productCode === wantedCode) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "generali_kabala") {
      const wantedVariantValue = toGeneraliKabalaU91ProductVariantId(
        resolveGeneraliKabalaU91Variant(undefined, inputs.enableTaxCredit),
      )
      return (
        selectedProductMetadata.variants.find((variant) => variant.value === wantedVariantValue) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "generali_mylife_extra_plusz") {
      const wantedVariantValue = toGeneraliMylifeExtraPluszProductVariantId(
        resolveGeneraliMylifeExtraPluszVariant(undefined, inputs.enableTaxCredit),
      )
      return (
        selectedProductMetadata.variants.find((variant) => variant.value === wantedVariantValue) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "cig_nyugdijkotvenye") {
      return (
        selectedProductMetadata.variants.find((variant) => variant.value === CIG_NYUGDIJKOTVENYE_PRODUCT_VARIANT) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "cig_esszenciae") {
      const wantedVariantValue = toCigEsszenciaeProductVariantId(resolveCigEsszenciaeVariant(undefined, inputs.currency))
      return (
        selectedProductMetadata.variants.find((variant) => variant.value === wantedVariantValue) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "knh_hozamhalmozo") {
      const wantedVariantValue = toKnhHozamhalmozoProductVariantId(resolveKnhHozamhalmozoVariant())
      return (
        selectedProductMetadata.variants.find((variant) => variant.value === wantedVariantValue) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "knh_nyugdijbiztositas4") {
      const wantedVariantValue = toKnhNyugdijbiztositas4ProductVariantId(resolveKnhNyugdijbiztositas4Variant())
      return (
        selectedProductMetadata.variants.find((variant) => variant.value === wantedVariantValue) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "metlife_manhattan") {
      const wantedVariantValue = toMetlifeManhattanProductVariantId(
        resolveMetlifeManhattanVariant(undefined, inputs.currency),
      )
      return (
        selectedProductMetadata.variants.find((variant) => variant.value === wantedVariantValue) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "metlife_nyugdijprogram") {
      const wantedVariantValue = toMetlifeNyugdijprogramProductVariantId(
        resolveMetlifeNyugdijprogramVariant(undefined, inputs.currency),
      )
      return (
        selectedProductMetadata.variants.find((variant) => variant.value === wantedVariantValue) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "posta_trend") {
      const wantedVariantValue = toPostaTrendProductVariantId(resolvePostaTrendVariant())
      return (
        selectedProductMetadata.variants.find((variant) => variant.value === wantedVariantValue) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "posta_trend_nyugdij") {
      const wantedVariantValue = toPostaTrendNyugdijProductVariantId(resolvePostaTrendNyugdijVariant())
      return (
        selectedProductMetadata.variants.find((variant) => variant.value === wantedVariantValue) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "nn_eletkapu_119") {
      const wantedVariantValue = toNnEletkapu119ProductVariantId(resolveNnEletkapu119Variant())
      return (
        selectedProductMetadata.variants.find((variant) => variant.value === wantedVariantValue) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "nn_motiva_158") {
      const wantedVariantValue = toNnMotiva158ProductVariantId(
        resolveNnMotiva158VariantFromInputs({ currency: inputs.currency }),
      )
      return (
        selectedProductMetadata.variants.find((variant) => variant.value === wantedVariantValue) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "nn_visio_118") {
      const wantedVariantValue = toNnVisio118ProductVariantId()
      return (
        selectedProductMetadata.variants.find((variant) => variant.value === wantedVariantValue) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "nn_vista_128") {
      const wantedVariantValue = toNnVista128ProductVariantId()
      return (
        selectedProductMetadata.variants.find((variant) => variant.value === wantedVariantValue) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "signal_elorelato_ul001") {
      const wantedVariantValue = toSignalElorelatoUl001ProductVariantId()
      return (
        selectedProductMetadata.variants.find((variant) => variant.value === wantedVariantValue) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "signal_nyugdij_terv_plusz_ny010") {
      const wantedVariantValue = toSignalNyugdijTervPluszNy010ProductVariantId()
      return (
        selectedProductMetadata.variants.find((variant) => variant.value === wantedVariantValue) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "signal_nyugdijprogram_sn005") {
      const wantedVariantValue = toSignalNyugdijprogramSn005ProductVariantId()
      return (
        selectedProductMetadata.variants.find((variant) => variant.value === wantedVariantValue) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "signal_ongondoskodasi_wl009") {
      const wantedVariantValue = toSignalOngondoskodasiWl009ProductVariantId()
      return (
        selectedProductMetadata.variants.find((variant) => variant.value === wantedVariantValue) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "union_vienna_age_505") {
      const wantedVariantValue = toUnionViennaAge505ProductVariantId(resolveUnionViennaAge505Variant(undefined, inputs.currency))
      return (
        selectedProductMetadata.variants.find((variant) => variant.value === wantedVariantValue) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "union_vienna_plan_500") {
      const wantedVariantValue = toUnionViennaPlan500ProductVariantId(resolveUnionViennaPlan500Variant(undefined, inputs.currency))
      return (
        selectedProductMetadata.variants.find((variant) => variant.value === wantedVariantValue) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "union_vienna_time") {
      const wantedVariantValue = toUnionViennaTimeProductVariantId(
        resolveUnionViennaTimeVariant(undefined, unionViennaTimeChannelProfile),
      )
      return (
        selectedProductMetadata.variants.find((variant) => variant.value === wantedVariantValue) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "uniqa_eletcel_275") {
      const wantedVariantValue = toUniqaEletcel275ProductVariantId()
      return (
        selectedProductMetadata.variants.find((variant) => variant.value === wantedVariantValue) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "uniqa_premium_life_190") {
      const wantedVariantValue = toUniqaPremiumLife190ProductVariantId()
      return (
        selectedProductMetadata.variants.find((variant) => variant.value === wantedVariantValue) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "groupama_next") {
      const wantedVariantValue = toGroupamaNextProductVariantId(groupamaNextAllocationProfile)
      return (
        selectedProductMetadata.variants.find((variant) => variant.value === wantedVariantValue) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    if (selectedProduct === "groupama_easy") {
      const wantedVariantValue = toGroupamaEasyProductVariantId(
        resolveGroupamaEasyVariant(undefined, inputs.enableTaxCredit),
      )
      return (
        selectedProductMetadata.variants.find((variant) => variant.value === wantedVariantValue) ??
        selectedProductMetadata.variants[0] ??
        null
      )
    }
    return selectedProductMetadata.variants[0] ?? null
  }, [
    selectedProductMetadata,
    selectedProduct,
    inputs.enableTaxCredit,
    fortisVariantConfig.code,
    inputs.currency,
    unionViennaTimeChannelProfile,
  ])

  useEffect(() => {
    if (selectedProduct === "alfa_zen_eur") {
      setSelectedProduct("alfa_zen")
      return
    }
    if (!selectedInsurer) {
      if (selectedProduct !== null) setSelectedProduct(null)
      return
    }
    const products = getAvailableProductsForInsurer(selectedInsurer)
    if (products.length === 0) {
      if (selectedProduct !== null) setSelectedProduct(null)
      return
    }
    const isValid = selectedProduct ? products.some((p) => p.value === selectedProduct) : false
    if (isValid) return

    const nextDefault =
      selectedInsurer === "Allianz" ? "allianz_bonusz_eletprogram" : (products[0]?.value ?? null)
    if (nextDefault !== selectedProduct) {
      setSelectedProduct(nextDefault)
    }
  }, [selectedInsurer, selectedProduct])

  const mapSelectedProductToProductId = (productValue: string | null, insurer: string | null): ProductId => {
    // Product mapping must primarily follow selected product value.
    // During fast insurer/product switches, the insurer field can briefly lag behind.
    if (productValue === "alfa_exclusive_plus") {
      return "alfa-exclusive-plus"
    }
    if (productValue === "alfa_fortis") {
      return "alfa-fortis"
    }
    if (productValue === "alfa_jade") {
      return "alfa-jade"
    }
    if (productValue === "alfa_jovokep") {
      return "alfa-jovokep"
    }
    if (productValue === "alfa_jovotervezo") {
      return "alfa-jovotervezo"
    }
    if (productValue === "alfa_premium_selection") {
      return "alfa-premium-selection"
    }
    if (productValue === "alfa_relax_plusz") {
      return "alfa-relax-plusz"
    }
    if (productValue === "alfa_zen" || productValue === "alfa_zen_eur") {
      return "alfa-zen"
    }
    if (productValue === "alfa_zen_pro") {
      return "alfa-zen-pro"
    }
    if (productValue === "generali_kabala") {
      return "generali-kabala-u91"
    }
    if (productValue === "generali_mylife_extra_plusz") {
      return "generali-mylife-extra-plusz"
    }
    if (productValue === "cig_nyugdijkotvenye") {
      return "cig-nyugdijkotvenye"
    }
    if (productValue === "cig_esszenciae") {
      return "cig-esszenciae"
    }
    if (productValue === "knh_hozamhalmozo") {
      return "knh-hozamhalmozo"
    }
    if (productValue === "knh_nyugdijbiztositas4") {
      return "knh-nyugdijbiztositas4"
    }
    if (productValue === "metlife_manhattan") {
      return "metlife-manhattan"
    }
    if (productValue === "metlife_nyugdijprogram") {
      return "metlife-nyugdijprogram"
    }
    if (productValue === "posta_trend") {
      return "posta-trend"
    }
    if (productValue === "posta_trend_nyugdij") {
      return "posta-trend-nyugdij"
    }
    if (productValue === "nn_eletkapu_119") {
      return "nn-eletkapu-119"
    }
    if (productValue === "nn_motiva_158") {
      return "nn-motiva-158"
    }
    if (productValue === "nn_visio_118") {
      return "nn-visio-118"
    }
    if (productValue === "nn_vista_128") {
      return "nn-vista-128"
    }
    if (productValue === "signal_elorelato_ul001") {
      return "signal-elorelato-ul001"
    }
    if (productValue === "signal_nyugdij_terv_plusz_ny010") {
      return "signal-nyugdij-terv-plusz-ny010"
    }
    if (productValue === "signal_nyugdijprogram_sn005") {
      return "signal-nyugdijprogram-sn005"
    }
    if (productValue === "signal_ongondoskodasi_wl009") {
      return "signal-ongondoskodasi-wl009"
    }
    if (productValue === "union_vienna_age_505") {
      return "union-vienna-age-505"
    }
    if (productValue === "union_vienna_plan_500") {
      return "union-vienna-plan-500"
    }
    if (productValue === "union_vienna_time") {
      if (unionViennaTimeChannelProfile === "erste") return "union-vienna-time-564"
      if (unionViennaTimeChannelProfile === "select") return "union-vienna-time-606"
      return "union-vienna-time-584"
    }
    if (productValue === "uniqa_eletcel_275") {
      return "uniqa-eletcel-275"
    }
    if (productValue === "uniqa_premium_life_190") {
      return "uniqa-premium-life-190"
    }
    if (productValue === "groupama_next") {
      return "groupama-next"
    }
    if (productValue === "groupama_easy") {
      return "groupama-easy"
    }
    if (insurer === "Allianz") {
      if (productValue === "allianz_eletprogram" || productValue === "allianz_bonusz_eletprogram") {
        return "allianz-eletprogram"
      }
    }

    return "dm-pro"
  }

  const setFieldEditing = (field: string, isEditing: boolean) => {
    setEditingFields((prev) => ({ ...prev, [field]: isEditing }))
  }

  const parseLocalizedDecimal = (rawValue: string) => {
    const normalized = rawValue.replace(",", ".").trim()
    if (!normalized) return null
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }

  const loadFxRate = async (currency: "EUR" | "USD" = "EUR") => {
    setIsLoadingFx(true)
    const rate = await getFxRateWithFallback(currency) // Use getFxRateWithFallback to support both EUR and USD
    setFxState({ rate: rate.rate, date: rate.date, source: rate.source })

    if (currency === "EUR") {
      setInputs((prev) => ({ ...prev, eurToHufRate: rate.rate }))
    } else {
      setInputs((prev) => ({ ...prev, usdToHufRate: rate.rate }))
    }

    setEurRateManuallyChanged(rate.source !== "default")
    setIsLoadingFx(false)
  }

  const relevantFxRate = inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate

  const applyPreset = useCallback(() => {
    const products = selectedInsurer ? getAvailableProductsForInsurer(selectedInsurer) : []
    const selected = products.find((p) => p.value === selectedProduct)
    if (selectedInsurer && selectedProduct && selected) {
      setAppliedPresetLabel(`${selectedInsurer} - ${selected.label}`)

      if (selectedProduct === "alfa_exclusive_plus") {
        const isTr08Variant = effectiveSelectedProductVariantCode === "TR-08"
        const durationInYears = Math.ceil(
          durationValue / (durationUnit === "year" ? 1 : durationUnit === "month" ? 12 / 12 : 365 / 12),
        )
        const aepAssetFeePercent = 0.145

        const investedShareConfig: Record<number, number> = {}
        for (let year = 1; year <= durationInYears; year++) {
          if (year === 1) {
            investedShareConfig[year] = 20
          } else if (year === 2) {
            investedShareConfig[year] = 50
          } else {
            investedShareConfig[year] = 80
          }
        }

        const redemptionFeeConfig: Record<number, number> = {}
        for (let year = 1; year <= durationInYears; year++) {
          if (year <= 10) {
            redemptionFeeConfig[year] = 100
          } else {
            redemptionFeeConfig[year] = isTr08Variant ? 20 : 15
          }
        }

        const initialCostConfig: Record<number, number> = {}
        if (durationInYears >= 5 && durationInYears <= 10) {
          // 5-10 years: Year 1 = 49%, Year 2 = 0%, Year 3 = 0%
          initialCostConfig[1] = 49
          initialCostConfig[2] = 0
          initialCostConfig[3] = 0
        } else if (durationInYears === 11) {
          // 11 years: Year 1 = 55%, Year 2 = 5%, Year 3 = 0%
          initialCostConfig[1] = 55
          initialCostConfig[2] = 5
          initialCostConfig[3] = 0
        } else if (durationInYears === 12) {
          // 12 years: Year 1 = 55%, Year 2 = 15%, Year 3 = 0%
          initialCostConfig[1] = 55
          initialCostConfig[2] = 15
          initialCostConfig[3] = 0
        } else if (durationInYears === 13) {
          // 13 years: Year 1 = 60%, Year 2 = 25%, Year 3 = 0%
          initialCostConfig[1] = 60
          initialCostConfig[2] = 25
          initialCostConfig[3] = 0
        } else if (durationInYears === 14) {
          // 14 years: Year 1 = 60%, Year 2 = 35%, Year 3 = 0%
          initialCostConfig[1] = 60
          initialCostConfig[2] = 35
          initialCostConfig[3] = 0
        } else if (durationInYears >= 15) {
          // 15+ years: Year 1 = 60%, Year 2 = 40%, Year 3 = 10%
          initialCostConfig[1] = 60
          initialCostConfig[2] = 40
          initialCostConfig[3] = 10
        }

        // Alfa Exclusive Plus base table UX:
        // show 0% in years 1-3, then 0.145% from year 4 onwards.
        // (Engine applies account-specific logic for client/invested/taxBonus internally.)
        const assetCostConfig: Record<number, number> = {}
        for (let year = 1; year <= durationInYears; year++) {
          assetCostConfig[year] = year <= 3 ? 0 : aepAssetFeePercent
        }
        // </CHANGE>

        // Apply preset values
        setInputs((prev) => ({
          ...prev,
          initialCostByYear: initialCostConfig,
          initialCostDefaultPercent: 0,
          yearlyManagementFeePercent: 0, // This field is now replaced by managementFeeValue
          yearlyFixedManagementFeeAmount: 0, // This field is now replaced by managementFeeValue
          assetBasedFeePercent: aepAssetFeePercent, // Set default asset fee
          bonusMode: "none",
          bonusPercent: 0,
          bonusStartYear: 1,
          bonusStopYear: 0,
          enableTaxCredit: !isTr08Variant,
          taxCreditRatePercent: isTr08Variant ? 0 : 20,
          taxCreditCapPerYear: isTr08Variant ? 0 : 130000,
          taxCreditYieldPercent: isTr08Variant ? 0 : prev.taxCreditYieldPercent,
          taxCreditCalendarPostingEnabled: isTr08Variant ? false : prev.taxCreditCalendarPostingEnabled,
          paidUpMaintenanceFeeMonthlyAmount: isTr08Variant ? 1000 : 0,
          paidUpMaintenanceFeeStartMonth: 10,
          insuredEntryAge: prev.insuredEntryAge ?? 38,
        }))

        setInvestedShareByYear(investedShareConfig)
        setAssetCostPercentByYear(assetCostConfig)
        setAccountMaintenancePercentByYear({})
        setAdminFeePercentByYear({})
        setBonusOnContributionPercentByYear({})
        setProductPresetBaseline({
          initialCostByYear: initialCostConfig,
          initialCostDefaultPercent: 0,
          assetBasedFeePercent: aepAssetFeePercent,
          assetCostPercentByYear: assetCostConfig,
          accountMaintenanceMonthlyPercent: 0,
          accountMaintenancePercentByYear: {},
          adminFeePercentOfPayment: 0,
          adminFeePercentByYear: {},
          bonusOnContributionPercentByYear: {},
          refundInitialCostBonusPercentByYear: {},
          bonusPercentByYear: {},
        })
        // </CHANGE>

        setIsTaxBonusSeparateAccount(true)
        // </CHANGE>

        // Open both collapsible sections
        setIsAccountSplitOpen(true)
        setIsRedemptionOpen(true)

        // Set redemption configuration
        setRedemptionBaseMode("surplus-only")
        setRedemptionFeeByYear(redemptionFeeConfig)
        setRedemptionFeeDefaultPercent(isTr08Variant ? 20 : 15) // Default for years beyond term
      } else if (selectedProduct === "allianz_eletprogram") {
        const fixedCost = inputs.currency === "HUF" ? 11880 : 39.6
        setInputs((prev) => ({
          ...prev,
          initialCostByYear: { 1: 33 },
          initialCostDefaultPercent: 0,
          yearlyManagementFeePercent: 0, // Replaced by managementFeeValue
          yearlyFixedManagementFeeAmount: 0, // Replaced by managementFeeValue
          managementFeeFrequency: "éves", // Reset to default
          managementFeeValueType: "amount", // Reset to default
          managementFeeValue: fixedCost, // Set the fixed cost
          assetBasedFeePercent: 1.19,
          bonusMode: "none",
          bonusPercent: 0,
          bonusStartYear: 1,
          bonusStopYear: 0,
        }))
        // Reset specific per-year configurations for this preset
        setInvestedShareByYear({})
        setAssetCostPercentByYear({})
        setAccountMaintenancePercentByYear({})
        setAdminFeePercentByYear({})
        setBonusOnContributionPercentByYear({})
        setRefundInitialCostBonusPercentByYear({})
        setProductPresetBaseline({
          initialCostByYear: { 1: 33 },
          initialCostDefaultPercent: 0,
          assetBasedFeePercent: 1.19,
          assetCostPercentByYear: {},
          accountMaintenanceMonthlyPercent: 0,
          accountMaintenancePercentByYear: {},
          adminFeePercentOfPayment: 0,
          adminFeePercentByYear: {},
          bonusOnContributionPercentByYear: {},
          refundInitialCostBonusPercentByYear: {},
          bonusPercentByYear: {},
        })
        setRedemptionFeeByYear({})
        setRedemptionFeeDefaultPercent(0)
        setRedemptionBaseMode("surplus-only")
        setIsTaxBonusSeparateAccount(false)
        // </CHANGE>
      } else if (selectedProduct === "allianz_bonusz_eletprogram") {
        const durationInYears = Math.ceil(
          durationValue / (durationUnit === "year" ? 1 : durationUnit === "month" ? 12 / 12 : 365 / 12),
        )
        const fixedCost = inputs.currency === "HUF" ? 11880 : 39.6
        setInputs((prev) => ({
          ...prev,
          initialCostByYear: { 1: 79 },
          initialCostDefaultPercent: 0,
          yearlyManagementFeePercent: 0, // Replaced by managementFeeValue
          yearlyFixedManagementFeeAmount: 0, // Replaced by managementFeeValue
          managementFeeFrequency: "éves", // Reset to default
          managementFeeValueType: "amount", // Reset to default
          managementFeeValue: fixedCost, // Set the fixed cost
          assetBasedFeePercent: 1.19,
          bonusMode: "refundInitialCostIncreasing", // Changed from "upfront" to "refundInitialCostIncreasing"
          bonusPercent: 0, // Bonus percent is not directly used in this model, it's implicitly handled by the cost refund logic
          bonusStartYear: 1,
          bonusStopYear: 0,
        }))
        // Reset specific per-year configurations for this preset
        setInvestedShareByYear({})
        setAssetCostPercentByYear({})
        setAccountMaintenancePercentByYear({})
        setAdminFeePercentByYear({})
        setBonusOnContributionPercentByYear({})
        const refundInitialBonusPercentConfig: Record<number, number> = {}
        for (let year = 1; year <= durationInYears; year++) {
          refundInitialBonusPercentConfig[year] = year >= 2 ? year - 1 : 0
        }
        setRefundInitialCostBonusPercentByYear(refundInitialBonusPercentConfig)
        setProductPresetBaseline({
          initialCostByYear: { 1: 79 },
          initialCostDefaultPercent: 0,
          assetBasedFeePercent: 1.19,
          assetCostPercentByYear: {},
          accountMaintenanceMonthlyPercent: 0,
          accountMaintenancePercentByYear: {},
          adminFeePercentOfPayment: 0,
          adminFeePercentByYear: {},
          bonusOnContributionPercentByYear: {},
          refundInitialCostBonusPercentByYear: refundInitialBonusPercentConfig,
          bonusPercentByYear: {},
        })
        setRedemptionFeeByYear({})
        setRedemptionFeeDefaultPercent(0)
        setIsTaxBonusSeparateAccount(false)
        // </CHANGE>
      } else if (selectedProduct === "alfa_fortis") {
        const durationInYears = Math.ceil(
          durationValue / (durationUnit === "year" ? 1 : durationUnit === "month" ? 12 / 12 : 365 / 12),
        )

        // Acquisition cost schedule (szerződéskötési költség):
        // Year 1: 75%, Year 2: 42%, Year 3: 15%, Year 4+: 0%
        const initialCostConfig: Record<number, number> = {
          1: 75,
          2: 42,
          3: 15,
        }

        // Redemption/Surrender fee schedule (visszavásárlási költség):
        // Year 1: 3.50%, Years 2-8: 1.95%, Years 9-15: 1.50%, Year 16+: 0.00%
        const redemptionFeeConfig: Record<number, number> = {}
        for (let year = 1; year <= durationInYears; year++) {
          if (year === 1) {
            redemptionFeeConfig[year] = 100
          } else if (year === 2) {
            redemptionFeeConfig[year] = 3.5
          } else if (year >= 3 && year <= 8) {
            redemptionFeeConfig[year] = 1.95
          } else if (year >= 9 && year <= 15) {
            redemptionFeeConfig[year] = 1.5
          } else {
            redemptionFeeConfig[year] = 0
          }
        }

        setInputs((prev) => ({
          ...prev,
          initialCostByYear: initialCostConfig,
          initialCostDefaultPercent: 0,
          yearlyManagementFeePercent: 0, // Replaced by managementFeeValue
          yearlyFixedManagementFeeAmount: 0, // Replaced by managementFeeValue
          managementFeeFrequency: "éves", // Reset to default
          managementFeeValueType: "amount",
          managementFeeValue: fortisVariantConfig.policyFeeAnnualAmount,
          adminFeePercentOfPayment: 4,
          assetBasedFeePercent: fortisVariantConfig.vakPercentByFundClass.equityOrMixed,
          bonusMode: "percentOnContribution",
          bonusOnContributionPercent: 0,
          bonusPercent: 0,
          bonusStartYear: 1,
          bonusStopYear: 0,
          accountMaintenanceMonthlyPercent: fortisVariantConfig.accountMaintenanceMonthlyPercent,
          riskInsuranceDeathBenefitAmount: fortisVariantConfig.riskBenefitAccidentalDeath,
        }))

        setInvestedShareByYear({})
        setAssetCostPercentByYear({})
        setAccountMaintenancePercentByYear({})
        setAdminFeePercentByYear({})
        const fortisBonusPercentConfig = buildFortisBonusPercentByYear(effectiveFortisVariant)
        setBonusOnContributionPercentByYear(fortisBonusPercentConfig)
        setRefundInitialCostBonusPercentByYear({})
        setProductPresetBaseline({
          initialCostByYear: initialCostConfig,
          initialCostDefaultPercent: 0,
          assetBasedFeePercent: fortisVariantConfig.vakPercentByFundClass.equityOrMixed,
          assetCostPercentByYear: {},
          accountMaintenanceMonthlyPercent: fortisVariantConfig.accountMaintenanceMonthlyPercent,
          accountMaintenancePercentByYear: {},
          adminFeePercentOfPayment: 4,
          adminFeePercentByYear: {},
          bonusOnContributionPercentByYear: fortisBonusPercentConfig,
          refundInitialCostBonusPercentByYear: {},
          bonusPercentByYear: {},
        })
        setRedemptionFeeByYear(redemptionFeeConfig)
        setRedemptionFeeDefaultPercent(0)
        setRedemptionBaseMode("surplus-only")
        setIsTaxBonusSeparateAccount(false)
        setIsAccountSplitOpen(false)
        setIsRedemptionOpen(true)
        // </CHANGE>
      } else if (selectedProduct === "alfa_jade") {
        const effectiveJadeCurrency: Currency = inputs.currency === "USD" ? "USD" : "EUR"
        const jadeConfig = getJadeVariantConfig(undefined, effectiveJadeCurrency)
        const jadeBonusPercentConfig = { ...jadeConfig.bonusPercentByYear }
        const durationInYears = Math.ceil(
          durationValue / (durationUnit === "year" ? 1 : durationUnit === "month" ? 12 / 12 : 365 / 12),
        )
        const initialCostConfig = buildJadeInitialCostByYear()
        const investedShareConfig = buildJadeInvestedShareByYear(durationInYears)
        const redemptionFeeConfig = buildJadeRedemptionSchedule(durationInYears)

        setDurationUnit("year")
        setDurationValue(15)
        setInputs((prev) => ({
          ...prev,
          currency: effectiveJadeCurrency,
          initialCostByYear: initialCostConfig,
          initialCostDefaultPercent: 0,
          initialCostBaseMode: "afterRisk",
          yearlyManagementFeePercent: 0,
          yearlyFixedManagementFeeAmount: 0,
          managementFeeFrequency: "éves",
          managementFeeValueType: "percent",
          managementFeeValue: 0,
          assetBasedFeePercent: 0,
          bonusMode: "none",
          bonusOnContributionPercent: 0,
          bonusPercent: 0,
          bonusStartYear: 1,
          bonusStopYear: 0,
          adminFeePercentOfPayment: jadeConfig.regularAdminFeePercent,
          adminFeeBaseMode: "afterRisk",
          accountMaintenanceMonthlyPercent: jadeConfig.accountMaintenanceMonthlyPercent,
          accountMaintenanceStartMonth: 1,
          accountMaintenanceClientStartMonth: jadeConfig.accountMaintenanceClientStartMonth,
          accountMaintenanceInvestedStartMonth: jadeConfig.accountMaintenanceInvestedStartMonth,
          accountMaintenanceTaxBonusStartMonth: jadeConfig.accountMaintenanceExtraStartMonth,
          riskInsuranceEnabled: true,
          riskInsuranceMonthlyFeeAmount: jadeConfig.riskMonthlyFeeAmount,
          riskInsuranceDeathBenefitAmount: jadeConfig.riskBenefitAccidentalDeath,
          riskInsuranceStartYear: 1,
          riskInsuranceEndYear: 15,
          partialSurrenderFeeAmount: jadeConfig.partialSurrenderFixedFeeAmount,
        }))
        setInvestedShareByYear(investedShareConfig)
        setAssetCostPercentByYear({})
        setAccountMaintenancePercentByYear({})
        setAdminFeePercentByYear({})
        setBonusOnContributionPercentByYear(jadeBonusPercentConfig)
        setRefundInitialCostBonusPercentByYear({})
        setProductPresetBaseline({
          initialCostByYear: initialCostConfig,
          initialCostDefaultPercent: 0,
          assetBasedFeePercent: 0,
          assetCostPercentByYear: {},
          accountMaintenanceMonthlyPercent: jadeConfig.accountMaintenanceMonthlyPercent,
          accountMaintenancePercentByYear: {},
          adminFeePercentOfPayment: jadeConfig.regularAdminFeePercent,
          adminFeePercentByYear: {},
          bonusOnContributionPercentByYear: jadeBonusPercentConfig,
          refundInitialCostBonusPercentByYear: {},
          bonusPercentByYear: {},
        })
        setRedemptionFeeByYear(redemptionFeeConfig)
        setRedemptionFeeDefaultPercent(0)
        setRedemptionBaseMode("surplus-only")
        setIsTaxBonusSeparateAccount(false)
        setIsAccountSplitOpen(true)
        setIsRedemptionOpen(true)
      } else if (selectedProduct === "alfa_jovokep") {
        const rawDurationYears = Math.ceil(
          durationValue / (durationUnit === "year" ? 1 : durationUnit === "month" ? 12 / 12 : 365 / 12),
        )
        const durationInYears = Math.max(JOVOKEP_MIN_DURATION_YEARS, Math.min(JOVOKEP_MAX_DURATION_YEARS, rawDurationYears))
        const initialCostConfig = buildJovokepInitialCostByYear(durationInYears)
        const investedShareConfig = buildJovokepInvestedShareByYear(durationInYears)
        const redemptionFeeConfig = buildJovokepRedemptionSchedule(durationInYears)
        const jovokepBonusPercentConfig = { 10: 120, 15: 50, 20: 25 }
        const clampedEntryAge = clampJovokepEntryAge(inputs.insuredEntryAge, durationInYears)

        setInputs((prev) => ({
          ...prev,
          currency: "HUF",
          initialCostByYear: initialCostConfig,
          initialCostDefaultPercent: 0,
          initialCostBaseMode: "afterRisk",
          yearlyManagementFeePercent: 0,
          yearlyFixedManagementFeeAmount: 0,
          managementFeeFrequency: "éves",
          managementFeeValueType: "percent",
          managementFeeValue: 0,
          assetBasedFeePercent: 0,
          bonusMode: "none",
          bonusOnContributionPercent: 0,
          bonusPercent: 0,
          bonusStartYear: 1,
          bonusStopYear: 0,
          adminFeePercentOfPayment: JOVOKEP_REGULAR_ADMIN_FEE_PERCENT,
          adminFeeBaseMode: "afterRisk",
          accountMaintenanceMonthlyPercent: 0.165,
          accountMaintenanceStartMonth: 1,
          accountMaintenanceClientStartMonth: 37,
          accountMaintenanceInvestedStartMonth: 1,
          accountMaintenanceTaxBonusStartMonth: 1,
          riskInsuranceEnabled: true,
          riskInsuranceMonthlyFeeAmount: 0,
          riskInsuranceDeathBenefitAmount: 1_000_000,
          riskInsuranceStartYear: 1,
          riskInsuranceEndYear: 3,
          partialSurrenderFeeAmount: 2_500,
          paidUpMaintenanceFeeMonthlyAmount: 1_000,
          paidUpMaintenanceFeeStartMonth: 10,
          insuredEntryAge: clampedEntryAge,
          minimumPaidUpValue: 0,
        }))
        setInvestedShareByYear(investedShareConfig)
        setAssetCostPercentByYear({})
        setAccountMaintenancePercentByYear({})
        setAdminFeePercentByYear({})
        setBonusOnContributionPercentByYear(jovokepBonusPercentConfig)
        setRefundInitialCostBonusPercentByYear({})
        setProductPresetBaseline({
          initialCostByYear: initialCostConfig,
          initialCostDefaultPercent: 0,
          assetBasedFeePercent: 0,
          assetCostPercentByYear: {},
          accountMaintenanceMonthlyPercent: 0.165,
          accountMaintenancePercentByYear: {},
          adminFeePercentOfPayment: JOVOKEP_REGULAR_ADMIN_FEE_PERCENT,
          adminFeePercentByYear: {},
          bonusOnContributionPercentByYear: jovokepBonusPercentConfig,
          refundInitialCostBonusPercentByYear: {},
          bonusPercentByYear: {},
        })
        setRedemptionFeeByYear(redemptionFeeConfig)
        setRedemptionFeeDefaultPercent(0)
        setRedemptionBaseMode("surplus-only")
        setIsTaxBonusSeparateAccount(false)
        setIsAccountSplitOpen(true)
        setIsRedemptionOpen(true)
      } else if (selectedProduct === "alfa_jovotervezo") {
        const rawDurationYears = Math.ceil(
          durationValue / (durationUnit === "year" ? 1 : durationUnit === "month" ? 12 / 12 : 365 / 12),
        )
        const durationInYears = Math.max(JOVOTERVEZO_MIN_DURATION_YEARS, Math.min(JOVOTERVEZO_MAX_DURATION_YEARS, rawDurationYears))
        const initialCostConfig = buildJovotervezoInitialCostByYear(durationInYears)
        const investedShareConfig = buildJovotervezoInvestedShareByYear(durationInYears)
        const redemptionFeeConfig = buildJovotervezoRedemptionSchedule(durationInYears)
        const jovotervezoBonusPercentConfig = { 10: 60, 15: 0, 20: 0 }

        setInputs((prev) => ({
          ...prev,
          currency: "HUF",
          initialCostByYear: initialCostConfig,
          initialCostDefaultPercent: 0,
          initialCostBaseMode: "afterRisk",
          yearlyManagementFeePercent: 0,
          yearlyFixedManagementFeeAmount: 0,
          managementFeeFrequency: "éves",
          managementFeeValueType: "percent",
          managementFeeValue: 0,
          assetBasedFeePercent: 0,
          bonusMode: "none",
          bonusOnContributionPercent: 0,
          bonusPercent: 0,
          bonusStartYear: 1,
          bonusStopYear: 0,
          adminFeePercentOfPayment: JOVOTERVEZO_REGULAR_ADMIN_FEE_PERCENT,
          adminFeeBaseMode: "afterRisk",
          accountMaintenanceMonthlyPercent: JOVOTERVEZO_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT,
          accountMaintenanceStartMonth: 1,
          accountMaintenanceClientStartMonth: 85,
          accountMaintenanceInvestedStartMonth: 1,
          accountMaintenanceTaxBonusStartMonth: 1,
          riskInsuranceEnabled: true,
          riskInsuranceMonthlyFeeAmount: 0,
          riskInsuranceDeathBenefitAmount: 1_000_000,
          riskInsuranceStartYear: 1,
          riskInsuranceEndYear: 1,
          partialSurrenderFeeAmount: 2_500,
          paidUpMaintenanceFeeMonthlyAmount: 1_000,
          paidUpMaintenanceFeeStartMonth: 10,
          minimumPaidUpValue: 0,
        }))
        setInvestedShareByYear(investedShareConfig)
        setAssetCostPercentByYear({})
        setAccountMaintenancePercentByYear({})
        setAdminFeePercentByYear({})
        setBonusOnContributionPercentByYear(jovotervezoBonusPercentConfig)
        setRefundInitialCostBonusPercentByYear({})
        setProductPresetBaseline({
          initialCostByYear: initialCostConfig,
          initialCostDefaultPercent: 0,
          assetBasedFeePercent: 0,
          assetCostPercentByYear: {},
          accountMaintenanceMonthlyPercent: JOVOTERVEZO_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT,
          accountMaintenancePercentByYear: {},
          adminFeePercentOfPayment: JOVOTERVEZO_REGULAR_ADMIN_FEE_PERCENT,
          adminFeePercentByYear: {},
          bonusOnContributionPercentByYear: jovotervezoBonusPercentConfig,
          refundInitialCostBonusPercentByYear: {},
          bonusPercentByYear: {},
        })
        setRedemptionFeeByYear(redemptionFeeConfig)
        setRedemptionFeeDefaultPercent(0)
        setRedemptionBaseMode("surplus-only")
        setIsTaxBonusSeparateAccount(false)
        setIsAccountSplitOpen(true)
        setIsRedemptionOpen(true)
      } else if (selectedProduct === "alfa_relax_plusz") {
        const durationInYears = Math.ceil(
          durationValue / (durationUnit === "year" ? 1 : durationUnit === "month" ? 12 / 12 : 365 / 12),
        )
        const initialCostConfig = buildRelaxPluszInitialCostByYear(durationInYears)
        const investedShareConfig = buildRelaxPluszInvestedShareByYear(durationInYears)
        const redemptionFeeConfig = buildRelaxPluszRedemptionSchedule(durationInYears)

        setInputs((prev) => ({
          ...prev,
          currency: "HUF",
          initialCostByYear: initialCostConfig,
          initialCostDefaultPercent: 0,
          initialCostBaseMode: "afterRisk",
          yearlyManagementFeePercent: 0,
          yearlyFixedManagementFeeAmount: 0,
          managementFeeFrequency: "éves",
          managementFeeValueType: "percent",
          managementFeeValue: 0,
          assetBasedFeePercent: 0,
          bonusMode: "none",
          bonusOnContributionPercent: 0,
          bonusPercent: 0,
          bonusStartYear: 1,
          bonusStopYear: 0,
          enableTaxCredit: true,
          taxCreditRatePercent: 20,
          taxCreditCapPerYear: 130000,
          taxCreditYieldPercent: 1,
          taxCreditStartYear: 1,
          taxCreditEndYear: 0,
          taxCreditAmountByYear: {},
          taxCreditLimitByYear: {},
          adminFeePercentOfPayment: 4.8,
          accountMaintenanceMonthlyPercent: 0.145,
          accountMaintenanceStartMonth: 1,
          accountMaintenanceClientStartMonth: 37,
          accountMaintenanceInvestedStartMonth: 1,
          accountMaintenanceTaxBonusStartMonth: 1,
          plusCostByYear: {},
        }))
        setInvestedShareByYear(investedShareConfig)
        setAssetCostPercentByYear({})
        setAccountMaintenancePercentByYear({})
        setAdminFeePercentByYear({})
        setBonusOnContributionPercentByYear({})
        setRefundInitialCostBonusPercentByYear({})
        setPlusCostByYear({})
        setProductPresetBaseline({
          initialCostByYear: initialCostConfig,
          initialCostDefaultPercent: 0,
          assetBasedFeePercent: 0,
          assetCostPercentByYear: {},
          accountMaintenanceMonthlyPercent: 0.145,
          accountMaintenancePercentByYear: {},
          adminFeePercentOfPayment: 4.8,
          adminFeePercentByYear: {},
          bonusOnContributionPercentByYear: {},
          refundInitialCostBonusPercentByYear: {},
          bonusPercentByYear: {},
        })
        setRedemptionFeeByYear(redemptionFeeConfig)
        setRedemptionFeeDefaultPercent(0)
        setRedemptionBaseMode("surplus-only")
        setIsTaxBonusSeparateAccount(true)
        setIsAccountSplitOpen(true)
        setIsRedemptionOpen(true)
      } else if (selectedProduct === "alfa_premium_selection") {
        const variant = resolvePremiumSelectionVariant(undefined, inputs.enableTaxCredit, inputs.currency)
        const variantConfig = getPremiumSelectionVariantConfig(undefined, inputs.enableTaxCredit, inputs.currency)
        const variantProductId =
          variant === "ny06"
            ? "alfa_premium_selection_ny06"
            : variant === "ny12"
              ? "alfa_premium_selection_ny12"
            : variant === "ny22"
              ? "alfa_premium_selection_ny22"
            : variant === "tr18"
              ? "alfa_premium_selection_tr18"
              : variant === "tr28"
                ? "alfa_premium_selection_tr28"
              : "alfa_premium_selection_tr09"
        const normalizedDurationValue =
          variantConfig.fixedDurationYears ??
          Math.min(variantConfig.maximumDurationYears, Math.max(variantConfig.minimumDurationYears, durationValue))
        const durationInYears = estimatePremiumSelectionDurationYears(
          {
            ...inputs,
            durationUnit,
            durationValue: normalizedDurationValue,
            productVariant: variantProductId,
            currency: variantConfig.currency,
          },
          variantConfig,
        )
        const initialCostConfig = buildPremiumSelectionInitialCostByYear(durationInYears, variantConfig)
        const investedShareConfig = buildPremiumSelectionInvestedShareByYear(durationInYears, variantConfig)
        const redemptionFeeConfig = buildPremiumSelectionRedemptionSchedule(durationInYears, variantConfig)
        const bonusAmountConfig = buildPremiumSelectionBonusAmountByYear(
          {
            ...inputs,
            durationUnit: "year",
            durationValue: durationInYears,
            productVariant: variantProductId,
            currency: variantConfig.currency,
          },
          durationInYears,
        )
        const accountMaintenanceForFund = resolvePremiumSelectionAccountMaintenanceMonthlyPercent(
          selectedFundId,
          variantConfig,
        )

        setDurationUnit("year")
        setDurationValue(durationInYears)
        setInputs((prev) => ({
          ...prev,
          currency: variantConfig.currency,
          initialCostByYear: initialCostConfig,
          initialCostDefaultPercent: 0,
          initialCostBaseMode: "afterRisk",
          yearlyManagementFeePercent: 0,
          yearlyFixedManagementFeeAmount: 0,
          managementFeeFrequency: "éves",
          managementFeeValueType: "percent",
          managementFeeValue: 0,
          assetBasedFeePercent: 0,
          bonusMode: "none",
          bonusOnContributionPercent: 0,
          bonusPercent: 0,
          bonusStartYear: 1,
          bonusStopYear: 0,
          adminFeePercentOfPayment: PREMIUM_SELECTION_REGULAR_ADMIN_FEE_PERCENT,
          adminFeeBaseMode: "afterRisk",
          accountMaintenanceMonthlyPercent: accountMaintenanceForFund,
          accountMaintenanceStartMonth: 1,
          accountMaintenanceClientStartMonth: 37,
          accountMaintenanceInvestedStartMonth: 1,
          accountMaintenanceTaxBonusStartMonth: 1,
          frequency: variant === "tr18" || variant === "tr28" || variant === "ny22" ? "éves" : prev.frequency,
          riskInsuranceEnabled: true,
          riskInsuranceMonthlyFeeAmount: variantConfig.riskAnnualFeeAmount > 0 ? variantConfig.riskAnnualFeeAmount / 12 : 0,
          riskInsuranceDeathBenefitAmount: variantConfig.riskAccidentalDeathBenefitAmount,
          riskInsuranceStartYear: 1,
          riskInsuranceEndYear: variant === "tr18" || variant === "tr28" || variant === "ny22" ? undefined : 1,
          partialSurrenderFeeAmount: variantConfig.partialSurrenderFeeAmount,
          paidUpMaintenanceFeeMonthlyAmount: variantConfig.paidUpMaintenanceFeeMonthlyAmount,
          paidUpMaintenanceFeeStartMonth: 10,
          minimumPaidUpValue: 0,
          enableTaxCredit: variant === "ny06" || variant === "ny12" || variant === "ny22",
          taxCreditRatePercent: variant === "ny06" || variant === "ny12" || variant === "ny22" ? 20 : 0,
          taxCreditCapPerYear:
            variant === "ny06"
              ? 130_000
              : variant === "ny12" || variant === "ny22"
                ? resolvePremiumSelectionTaxCreditCapPerYear(variantConfig, prev.eurToHufRate, prev.usdToHufRate)
                : 0,
          taxCreditYieldPercent: variant === "ny06" || variant === "ny12" || variant === "ny22" ? 1 : 0,
          taxCreditCalendarPostingEnabled:
            variant === "ny12" ? true : variant === "ny22" ? false : prev.taxCreditCalendarPostingEnabled,
          bonusAmountByYear: bonusAmountConfig,
          plusCostByYear: variant === "tr18" || variant === "tr28" ? { 1: variantConfig.policyIssuanceFeeAmount } : {},
          insuredEntryAge:
            variant === "tr18" || variant === "tr28"
              ? Math.min(variantConfig.maxEntryAge, Math.max(variantConfig.minEntryAge, prev.insuredEntryAge ?? 38))
              : prev.insuredEntryAge,
        }))
        setInvestedShareByYear(investedShareConfig)
        setAssetCostPercentByYear({})
        setAccountMaintenancePercentByYear({})
        setAdminFeePercentByYear({})
        setBonusOnContributionPercentByYear({})
        setRefundInitialCostBonusPercentByYear({})
        setPlusCostByYear(variant === "tr18" || variant === "tr28" ? { 1: variantConfig.policyIssuanceFeeAmount } : {})
        setProductPresetBaseline({
          initialCostByYear: initialCostConfig,
          initialCostDefaultPercent: 0,
          assetBasedFeePercent: 0,
          assetCostPercentByYear: {},
          accountMaintenanceMonthlyPercent: accountMaintenanceForFund,
          accountMaintenancePercentByYear: {},
          adminFeePercentOfPayment: PREMIUM_SELECTION_REGULAR_ADMIN_FEE_PERCENT,
          adminFeePercentByYear: {},
          bonusOnContributionPercentByYear: {},
          refundInitialCostBonusPercentByYear: {},
          bonusPercentByYear: {},
        })
        setRedemptionFeeByYear(redemptionFeeConfig)
        setRedemptionFeeDefaultPercent(0)
        setRedemptionBaseMode("surplus-only")
        setIsTaxBonusSeparateAccount(false)
        setIsAccountSplitOpen(true)
        setIsRedemptionOpen(true)
      } else if (selectedProduct === "alfa_zen" || selectedProduct === "alfa_zen_eur") {
        const resolvedVariant = resolveAlfaZenVariant(undefined, inputs.currency)
        const variantConfig = getAlfaZenVariantConfig(undefined, inputs.currency)
        const variantProductId = toAlfaZenProductVariantId(resolvedVariant)
        const durationInYears = estimateAlfaZenDurationYears({
          ...inputs,
          durationUnit,
          durationValue,
          currency: variantConfig.currency,
        })
        const initialCostConfig = buildAlfaZenInitialCostByYear(durationInYears)
        const investedShareConfig = buildAlfaZenInvestedShareByYear(durationInYears)
        const redemptionFeeConfig = buildAlfaZenRedemptionSchedule(durationInYears)
        const bonusAmountConfig = buildAlfaZenBonusAmountByYear(
          {
            ...inputs,
            durationUnit: "year",
            durationValue: durationInYears,
            currency: variantConfig.currency,
            productVariant: variantProductId,
          },
          durationInYears,
        )
        const accountMaintenanceForFund = resolveAlfaZenAccountMaintenanceMonthlyPercent(selectedFundId, variantConfig)

        setDurationUnit("year")
        setDurationValue(durationInYears)
        setInputs((prev) => ({
          ...prev,
          currency: variantConfig.currency,
          initialCostByYear: initialCostConfig,
          initialCostDefaultPercent: 0,
          initialCostBaseMode: "afterRisk",
          yearlyManagementFeePercent: 0,
          yearlyFixedManagementFeeAmount: 0,
          managementFeeFrequency: "éves",
          managementFeeValueType: "percent",
          managementFeeValue: 0,
          assetBasedFeePercent: 0,
          bonusMode: "none",
          bonusOnContributionPercent: 0,
          bonusPercent: 0,
          bonusStartYear: 1,
          bonusStopYear: 0,
          enableTaxCredit: true,
          taxCreditRatePercent: ALFA_ZEN_TAX_CREDIT_RATE_PERCENT,
          taxCreditCapPerYear: resolveAlfaZenTaxCreditCapPerYear(variantConfig, prev.eurToHufRate, prev.usdToHufRate),
          taxCreditYieldPercent: 1,
          taxCreditCalendarPostingEnabled: true,
          taxCreditStartYear: 1,
          taxCreditEndYear: 0,
          taxCreditAmountByYear: {},
          taxCreditLimitByYear: {},
          adminFeePercentOfPayment: ALFA_ZEN_REGULAR_ADMIN_FEE_PERCENT,
          extraordinaryAdminFeePercentOfPayment: ALFA_ZEN_EXTRAORDINARY_ADMIN_FEE_PERCENT,
          accountMaintenanceMonthlyPercent: accountMaintenanceForFund,
          accountMaintenanceStartMonth: 1,
          accountMaintenanceClientStartMonth: ALFA_ZEN_ACCOUNT_MAINTENANCE_CLIENT_START_MONTH,
          accountMaintenanceInvestedStartMonth: ALFA_ZEN_ACCOUNT_MAINTENANCE_INVESTED_START_MONTH,
          accountMaintenanceTaxBonusStartMonth: ALFA_ZEN_ACCOUNT_MAINTENANCE_TAXBONUS_START_MONTH,
          plusCostByYear: {},
          bonusAmountByYear: bonusAmountConfig,
          redemptionEnabled: true,
          redemptionBaseMode: "surplus-only",
          redemptionFeeByYear: redemptionFeeConfig,
          redemptionFeeDefaultPercent: 0,
          isAccountSplitOpen: true,
          isTaxBonusSeparateAccount: true,
        }))
        setInvestedShareByYear(investedShareConfig)
        setAssetCostPercentByYear({})
        setAccountMaintenancePercentByYear({})
        setAdminFeePercentByYear({})
        setBonusOnContributionPercentByYear({})
        setRefundInitialCostBonusPercentByYear({})
        setPlusCostByYear({})
        setProductPresetBaseline({
          initialCostByYear: initialCostConfig,
          initialCostDefaultPercent: 0,
          assetBasedFeePercent: 0,
          assetCostPercentByYear: {},
          accountMaintenanceMonthlyPercent: accountMaintenanceForFund,
          accountMaintenancePercentByYear: {},
          adminFeePercentOfPayment: ALFA_ZEN_REGULAR_ADMIN_FEE_PERCENT,
          adminFeePercentByYear: {},
          bonusOnContributionPercentByYear: {},
          refundInitialCostBonusPercentByYear: {},
          bonusPercentByYear: {},
        })
        setRedemptionFeeByYear(redemptionFeeConfig)
        setRedemptionFeeDefaultPercent(0)
        setRedemptionBaseMode("surplus-only")
        setIsTaxBonusSeparateAccount(true)
        setIsAccountSplitOpen(true)
        setIsRedemptionOpen(true)
      } else if (selectedProduct === "alfa_zen_pro") {
        const preferredCurrency = inputs.currency === "EUR" || inputs.currency === "USD" ? inputs.currency : "HUF"
        const variantConfig = getZenProVariantConfig(undefined, preferredCurrency)
        const durationInYears = estimateZenProDurationYears({
          ...inputs,
          durationUnit,
          durationValue,
          currency: variantConfig.currency,
        })
        const initialCostConfig = buildZenProInitialCostByYear(durationInYears)
        const investedShareConfig = buildZenProInvestedShareByYear(durationInYears)
        const redemptionFeeConfig = buildZenProRedemptionSchedule(durationInYears)
        const bonusAmountConfig = buildZenProBonusAmountByYear(
          {
            ...inputs,
            durationUnit: "year",
            durationValue: durationInYears,
            currency: variantConfig.currency,
            productVariant: toZenProProductVariantId(variantConfig.variant),
          },
          durationInYears,
          { variant: variantConfig.variant },
        )
        const taxCreditCapPerYear = resolveZenProTaxCreditCapPerYear(
          variantConfig,
          variantConfig.currency === "EUR" ? relevantFxRate : undefined,
          variantConfig.currency === "USD" ? relevantFxRate : undefined,
        )

        setDurationUnit("year")
        setDurationValue(durationInYears)
        setInputs((prev) => ({
          ...prev,
          currency: variantConfig.currency,
          initialCostByYear: initialCostConfig,
          initialCostDefaultPercent: 0,
          initialCostBaseMode: "afterRisk",
          yearlyManagementFeePercent: 0,
          yearlyFixedManagementFeeAmount: 0,
          managementFeeFrequency: "éves",
          managementFeeValueType: "percent",
          managementFeeValue: 0,
          assetBasedFeePercent: 0,
          bonusMode: "none",
          bonusOnContributionPercent: 0,
          bonusPercent: 0,
          bonusStartYear: 1,
          bonusStopYear: 0,
          enableTaxCredit: true,
          taxCreditRatePercent: ZEN_PRO_TAX_CREDIT_RATE_PERCENT,
          taxCreditCapPerYear,
          taxCreditYieldPercent: 1,
          taxCreditCalendarPostingEnabled: false,
          taxCreditStartYear: 1,
          taxCreditEndYear: 0,
          taxCreditAmountByYear: {},
          taxCreditLimitByYear: {},
          adminFeePercentOfPayment: ZEN_PRO_REGULAR_ADMIN_FEE_PERCENT,
          extraordinaryAdminFeePercentOfPayment: ZEN_PRO_EXTRAORDINARY_ADMIN_FEE_PERCENT,
          accountMaintenanceMonthlyPercent: ZEN_PRO_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT,
          accountMaintenanceStartMonth: 1,
          accountMaintenanceClientStartMonth: ZEN_PRO_ACCOUNT_MAINTENANCE_CLIENT_START_MONTH,
          accountMaintenanceInvestedStartMonth: ZEN_PRO_ACCOUNT_MAINTENANCE_INVESTED_START_MONTH,
          accountMaintenanceTaxBonusStartMonth: ZEN_PRO_ACCOUNT_MAINTENANCE_TAXBONUS_START_MONTH,
          plusCostByYear: {},
          bonusAmountByYear: bonusAmountConfig,
          redemptionEnabled: true,
          redemptionBaseMode: "total-account",
          redemptionFeeByYear: redemptionFeeConfig,
          redemptionFeeDefaultPercent: 0,
          isAccountSplitOpen: true,
          isTaxBonusSeparateAccount: true,
        }))
        setInvestedShareByYear(investedShareConfig)
        setAssetCostPercentByYear({})
        setAccountMaintenancePercentByYear({})
        setAdminFeePercentByYear({})
        setBonusOnContributionPercentByYear({})
        setRefundInitialCostBonusPercentByYear({})
        setPlusCostByYear({})
        setProductPresetBaseline({
          initialCostByYear: initialCostConfig,
          initialCostDefaultPercent: 0,
          assetBasedFeePercent: 0,
          assetCostPercentByYear: {},
          accountMaintenanceMonthlyPercent: ZEN_PRO_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT,
          accountMaintenancePercentByYear: {},
          adminFeePercentOfPayment: ZEN_PRO_REGULAR_ADMIN_FEE_PERCENT,
          adminFeePercentByYear: {},
          bonusOnContributionPercentByYear: {},
          refundInitialCostBonusPercentByYear: {},
          bonusPercentByYear: {},
        })
        setRedemptionFeeByYear(redemptionFeeConfig)
        setRedemptionFeeDefaultPercent(0)
        setRedemptionBaseMode("total-account")
        setIsTaxBonusSeparateAccount(true)
        setIsAccountSplitOpen(true)
        setIsRedemptionOpen(true)
      } else if (selectedProduct === "generali_kabala") {
        const variantConfig = getGeneraliKabalaU91VariantConfig(undefined, inputs.enableTaxCredit)
        const durationInYears = estimateGeneraliKabalaU91DurationYears(
          {
            ...inputs,
            durationUnit,
            durationValue,
            currency: "HUF",
          },
          variantConfig,
        )
        const periodsPerYear =
          inputs.frequency === "havi" ? 12 : inputs.frequency === "negyedéves" ? 4 : inputs.frequency === "féléves" ? 2 : 1
        const baseYearlyPayment = inputs.keepYearlyPayment ? inputs.regularPayment * 12 : inputs.regularPayment * periodsPerYear
        const yearlyPaymentsPlan = Array.from({ length: durationInYears + 1 }, (_, idx) => {
          if (idx === 0) return 0
          return baseYearlyPayment * Math.pow(1 + (inputs.annualIndexPercent ?? 0) / 100, idx - 1)
        })
        const yearlyWithdrawalsPlan = Array.from({ length: durationInYears + 1 }, () => 0)
        const syntheticInputsForBonuses: InputsDaily = {
          ...inputs,
          currency: "HUF",
          productVariant: toGeneraliKabalaU91ProductVariantId(variantConfig.variant),
          durationUnit: "year",
          durationValue: durationInYears,
          yearsPlanned: durationInYears,
          yearlyPaymentsPlan,
          yearlyWithdrawalsPlan,
          annualYieldPercent: inputs.annualYieldPercent,
          frequency: inputs.frequency,
        }
        const initialCostConfig = buildGeneraliKabalaU91InitialCostByYear(durationInYears, variantConfig.variant)
        const investedShareConfig = buildGeneraliKabalaU91InvestedShareByYear(durationInYears)
        const redemptionFeeConfig = buildGeneraliKabalaU91RedemptionFeeByYear(durationInYears)
        const bonusOnContributionPercentConfig = buildGeneraliKabalaU91BonusOnContributionPercentByYear(
          syntheticInputsForBonuses,
          durationInYears,
        )
        const wealthBonusPercentConfig = buildGeneraliKabalaU91WealthBonusPercentByYear(durationInYears)
        const loyaltyCreditBonusAmountConfig = buildGeneraliKabalaU91LoyaltyCreditBonusAmountByYear(
          syntheticInputsForBonuses,
          durationInYears,
          variantConfig.variant,
        )
        const fidelityAccountBonusAmountConfig = buildGeneraliKabalaU91FidelityAccountBonusAmountByYear(
          syntheticInputsForBonuses,
          durationInYears,
          variantConfig.variant,
        )
        const bonusAmountConfig: Record<number, number> = {}
        for (const [yearKey, amount] of Object.entries(loyaltyCreditBonusAmountConfig)) {
          const year = Number(yearKey)
          bonusAmountConfig[year] = (bonusAmountConfig[year] ?? 0) + amount
        }
        for (const [yearKey, amount] of Object.entries(fidelityAccountBonusAmountConfig)) {
          const year = Number(yearKey)
          bonusAmountConfig[year] = (bonusAmountConfig[year] ?? 0) + amount
        }
        const plusCostConfig = buildGeneraliKabalaU91AdminPlusCostByYear(durationInYears)
        const plusCostMonthlyInputConfig: Record<number, number> = {}
        for (let year = 1; year <= durationInYears; year++) {
          plusCostMonthlyInputConfig[year] = Math.round((plusCostConfig[year] ?? 0) / 12)
        }
        const accountMaintenanceForFund = resolveGeneraliKabalaU91AccountMaintenanceMonthlyPercent(selectedFundId)
        const accountMaintenancePercentConfig: Record<number, number> = {}
        for (let year = 1; year <= durationInYears; year++) {
          accountMaintenancePercentConfig[year] = year <= 3 ? 0 : accountMaintenanceForFund
        }

        setDurationUnit("year")
        setDurationValue(durationInYears)
        setInputs((prev) => ({
          ...prev,
          currency: "HUF",
          initialCostByYear: initialCostConfig,
          initialCostDefaultPercent: 0,
          initialCostBaseMode: "afterRisk",
          yearlyManagementFeePercent: 0,
          yearlyFixedManagementFeeAmount: 0,
          managementFeeFrequency: "éves",
          managementFeeValueType: "percent",
          managementFeeValue: 0,
          assetBasedFeePercent: 0,
          bonusMode: "percentOnContribution",
          bonusOnContributionPercent: 0,
          bonusPercent: 0,
          bonusStartYear: 1,
          bonusStopYear: 0,
          enableTaxCredit: variantConfig.taxCreditAllowed,
          taxCreditRatePercent: variantConfig.taxCreditAllowed ? GENERALI_KABALA_U91_TAX_CREDIT_RATE_PERCENT : 0,
          taxCreditCapPerYear: variantConfig.taxCreditAllowed ? GENERALI_KABALA_U91_TAX_CREDIT_CAP_HUF : 0,
          taxCreditYieldPercent: variantConfig.taxCreditAllowed ? 1 : 0,
          taxCreditCalendarPostingEnabled: variantConfig.taxCreditAllowed,
          taxCreditStartYear: variantConfig.taxCreditAllowed ? 1 : 0,
          taxCreditEndYear: variantConfig.taxCreditAllowed ? 0 : 0,
          taxCreditAmountByYear: {},
          taxCreditLimitByYear: {},
          adminFeePercentOfPayment: 0,
          extraordinaryAdminFeePercentOfPayment: GENERALI_KABALA_U91_EXTRA_DISTRIBUTION_FEE_PERCENT,
          accountMaintenanceMonthlyPercent: accountMaintenanceForFund,
          accountMaintenancePercentByYear: accountMaintenancePercentConfig,
          accountMaintenanceStartMonth: 1,
          accountMaintenanceClientStartMonth: GENERALI_KABALA_U91_ACCOUNT_MAINTENANCE_REGULAR_START_MONTH,
          accountMaintenanceInvestedStartMonth: GENERALI_KABALA_U91_ACCOUNT_MAINTENANCE_REGULAR_START_MONTH,
          accountMaintenanceTaxBonusStartMonth: variantConfig.taxCreditAllowed
            ? GENERALI_KABALA_U91_ACCOUNT_MAINTENANCE_TAXBONUS_START_MONTH
            : GENERALI_KABALA_U91_ACCOUNT_MAINTENANCE_REGULAR_START_MONTH,
          plusCostByYear: plusCostMonthlyInputConfig,
          bonusAmountByYear: bonusAmountConfig,
          redemptionEnabled: true,
          redemptionBaseMode: "total-account",
          redemptionFeeByYear: redemptionFeeConfig,
          redemptionFeeDefaultPercent: 0,
          isAccountSplitOpen: false,
          isTaxBonusSeparateAccount: variantConfig.taxCreditAllowed,
          riskInsuranceEnabled: true,
          riskInsuranceMonthlyFeeAmount: 0,
          riskInsuranceDeathBenefitAmount: 100_000,
          riskInsuranceStartYear: 1,
          riskInsuranceEndYear: 1,
          partialSurrenderFeeAmount: 0,
          minimumBalanceAfterPartialSurrender: 100_000,
        }))
        setInvestedShareByYear(investedShareConfig)
        setAssetCostPercentByYear({})
        setAccountMaintenancePercentByYear(accountMaintenancePercentConfig)
        setAdminFeePercentByYear({})
        setBonusOnContributionPercentByYear(bonusOnContributionPercentConfig)
        setBonusPercentByYear(wealthBonusPercentConfig)
        setRefundInitialCostBonusPercentByYear({})
        setPlusCostByYear(plusCostMonthlyInputConfig)
        setProductPresetBaseline({
          initialCostByYear: initialCostConfig,
          initialCostDefaultPercent: 0,
          assetBasedFeePercent: 0,
          assetCostPercentByYear: {},
          accountMaintenanceMonthlyPercent: accountMaintenanceForFund,
          accountMaintenancePercentByYear: accountMaintenancePercentConfig,
          adminFeePercentOfPayment: 0,
          adminFeePercentByYear: {},
          bonusOnContributionPercentByYear: bonusOnContributionPercentConfig,
          refundInitialCostBonusPercentByYear: {},
          bonusPercentByYear: wealthBonusPercentConfig,
        })
        setRedemptionFeeByYear(redemptionFeeConfig)
        setRedemptionFeeDefaultPercent(0)
        setRedemptionBaseMode("total-account")
        setIsTaxBonusSeparateAccount(variantConfig.taxCreditAllowed)
        setIsAccountSplitOpen(false)
        setIsRedemptionOpen(true)
      } else if (selectedProduct === "generali_mylife_extra_plusz") {
        const variantConfig = getGeneraliMylifeExtraPluszVariantConfig(undefined, inputs.enableTaxCredit)
        const durationInYears = estimateGeneraliMylifeExtraPluszDurationYears(
          {
            ...inputs,
            durationUnit,
            durationValue,
            currency: "HUF",
          },
          variantConfig,
        )
        const periodsPerYear =
          inputs.frequency === "havi" ? 12 : inputs.frequency === "negyedéves" ? 4 : inputs.frequency === "féléves" ? 2 : 1
        const baseYearlyPayment = inputs.keepYearlyPayment ? inputs.regularPayment * 12 : inputs.regularPayment * periodsPerYear
        const yearlyPaymentsPlan = Array.from({ length: durationInYears + 1 }, (_, idx) => {
          if (idx === 0) return 0
          return baseYearlyPayment * Math.pow(1 + (inputs.annualIndexPercent ?? 0) / 100, idx - 1)
        })
        const yearlyWithdrawalsPlan = Array.from({ length: durationInYears + 1 }, () => 0)
        const syntheticInputsForBonuses: InputsDaily = {
          ...inputs,
          currency: "HUF",
          productVariant: toGeneraliMylifeExtraPluszProductVariantId(variantConfig.variant),
          durationUnit: "year",
          durationValue: durationInYears,
          yearsPlanned: durationInYears,
          yearlyPaymentsPlan,
          yearlyWithdrawalsPlan,
          annualYieldPercent: inputs.annualYieldPercent,
          frequency: inputs.frequency,
        }
        const initialCostConfig = buildGeneraliMylifeExtraPluszInitialCostByYear(durationInYears)
        const investedShareConfig = buildGeneraliMylifeExtraPluszInvestedShareByYear(durationInYears)
        const redemptionFeeConfig = buildGeneraliMylifeExtraPluszRedemptionFeeByYear(durationInYears)
        const bonusOnContributionPercentConfig = buildGeneraliMylifeExtraPluszBonusOnContributionPercentByYear(
          syntheticInputsForBonuses,
          durationInYears,
        )
        const wealthBonusPercentConfig = buildGeneraliMylifeExtraPluszWealthBonusPercentByYear(durationInYears)
        const loyaltyBonusAmountConfig = buildGeneraliMylifeExtraPluszLoyaltyBonusAmountByYear(
          syntheticInputsForBonuses,
          durationInYears,
        )
        const plusCostConfig = buildGeneraliMylifeExtraPluszAdminPlusCostByYear(
          syntheticInputsForBonuses,
          durationInYears,
        )
        const accountMaintenanceForFund = resolveGeneraliMylifeExtraPluszAccountMaintenanceMonthlyPercent(selectedFundId)
        const accountMaintenancePercentConfig: Record<number, number> = {}
        for (let year = 1; year <= durationInYears; year++) {
          accountMaintenancePercentConfig[year] = year <= 3 ? 0 : accountMaintenanceForFund
        }

        setDurationUnit("year")
        setDurationValue(durationInYears)
        setInputs((prev) => ({
          ...prev,
          currency: "HUF",
          initialCostByYear: initialCostConfig,
          initialCostDefaultPercent: 0,
          initialCostBaseMode: "afterRisk",
          yearlyManagementFeePercent: 0,
          yearlyFixedManagementFeeAmount: 0,
          managementFeeFrequency: "éves",
          managementFeeValueType: "percent",
          managementFeeValue: 0,
          assetBasedFeePercent: 0,
          bonusMode: "percentOnContribution",
          bonusOnContributionPercent: 0,
          bonusPercent: 0,
          bonusStartYear: 1,
          bonusStopYear: 0,
          enableTaxCredit: variantConfig.taxCreditAllowed,
          taxCreditRatePercent: variantConfig.taxCreditAllowed ? GENERALI_MYLIFE_EXTRA_PLUSZ_TAX_CREDIT_RATE_PERCENT : 0,
          taxCreditCapPerYear: variantConfig.taxCreditAllowed ? GENERALI_MYLIFE_EXTRA_PLUSZ_TAX_CREDIT_CAP_HUF : 0,
          taxCreditYieldPercent: variantConfig.taxCreditAllowed ? 1 : 0,
          taxCreditCalendarPostingEnabled: variantConfig.taxCreditAllowed,
          taxCreditStartYear: variantConfig.taxCreditAllowed ? 1 : 0,
          taxCreditEndYear: variantConfig.taxCreditAllowed ? 0 : 0,
          taxCreditAmountByYear: {},
          taxCreditLimitByYear: {},
          adminFeePercentOfPayment: 0,
          extraordinaryAdminFeePercentOfPayment: GENERALI_MYLIFE_EXTRA_PLUSZ_EXTRA_DISTRIBUTION_FEE_PERCENT,
          accountMaintenanceMonthlyPercent: accountMaintenanceForFund,
          accountMaintenancePercentByYear: accountMaintenancePercentConfig,
          accountMaintenanceStartMonth: 1,
          accountMaintenanceClientStartMonth: GENERALI_MYLIFE_EXTRA_PLUSZ_ACCOUNT_MAINTENANCE_REGULAR_START_MONTH,
          accountMaintenanceInvestedStartMonth: GENERALI_MYLIFE_EXTRA_PLUSZ_ACCOUNT_MAINTENANCE_REGULAR_START_MONTH,
          accountMaintenanceTaxBonusStartMonth: GENERALI_MYLIFE_EXTRA_PLUSZ_ACCOUNT_MAINTENANCE_EXTRA_START_MONTH,
          plusCostByYear: plusCostConfig,
          bonusAmountByYear: loyaltyBonusAmountConfig,
          redemptionEnabled: true,
          redemptionBaseMode: "total-account",
          redemptionFeeByYear: redemptionFeeConfig,
          redemptionFeeDefaultPercent: 0,
          isAccountSplitOpen: false,
          isTaxBonusSeparateAccount: variantConfig.taxCreditAllowed,
          riskInsuranceEnabled: true,
          riskInsuranceMonthlyFeeAmount: 0,
          riskInsuranceDeathBenefitAmount: 0,
          riskInsuranceStartYear: 1,
          riskInsuranceEndYear: 1,
          partialSurrenderFeeAmount: 0,
          minimumBalanceAfterPartialSurrender: 100_000,
        }))
        setInvestedShareByYear(investedShareConfig)
        setAssetCostPercentByYear({})
        setAccountMaintenancePercentByYear(accountMaintenancePercentConfig)
        setAdminFeePercentByYear({})
        setBonusOnContributionPercentByYear(bonusOnContributionPercentConfig)
        setBonusPercentByYear(wealthBonusPercentConfig)
        setRefundInitialCostBonusPercentByYear({})
        setPlusCostByYear(plusCostConfig)
        setProductPresetBaseline({
          initialCostByYear: initialCostConfig,
          initialCostDefaultPercent: 0,
          assetBasedFeePercent: 0,
          assetCostPercentByYear: {},
          accountMaintenanceMonthlyPercent: accountMaintenanceForFund,
          accountMaintenancePercentByYear: accountMaintenancePercentConfig,
          adminFeePercentOfPayment: 0,
          adminFeePercentByYear: {},
          bonusOnContributionPercentByYear: bonusOnContributionPercentConfig,
          refundInitialCostBonusPercentByYear: {},
          bonusPercentByYear: wealthBonusPercentConfig,
        })
        setRedemptionFeeByYear(redemptionFeeConfig)
        setRedemptionFeeDefaultPercent(0)
        setRedemptionBaseMode("total-account")
        setIsTaxBonusSeparateAccount(variantConfig.taxCreditAllowed)
        setIsAccountSplitOpen(false)
        setIsRedemptionOpen(true)
      } else if (selectedProduct === "cig_esszenciae") {
        const variantConfig = getCigEsszenciaeVariantConfig(undefined, inputs.currency)
        const durationInYears = estimateCigEsszenciaeDurationYears({
          ...inputs,
          durationUnit,
          durationValue,
          currency: variantConfig.currency,
        })
        const syntheticInputsForBonuses: InputsDaily = {
          ...inputs,
          currency: variantConfig.currency,
          productVariant: toCigEsszenciaeProductVariantId(variantConfig.variant),
          durationUnit: "year",
          durationValue: durationInYears,
          yearsPlanned: durationInYears,
          annualYieldPercent: inputs.annualYieldPercent,
          frequency: inputs.frequency,
          yearlyPaymentsPlan: [],
          yearlyWithdrawalsPlan: [],
        }
        const initialCostConfig = buildCigEsszenciaeInitialCostByYear(durationInYears, variantConfig.variant)
        const investedShareConfig = buildCigEsszenciaeInvestedShareByYear(durationInYears)
        const redemptionFeeConfig = buildCigEsszenciaeRedemptionFeeByYear(durationInYears)
        const bonusAmountConfig = buildCigEsszenciaeBonusAmountByYear(
          syntheticInputsForBonuses,
          durationInYears,
          variantConfig.variant,
        )
        const bonusPercentConfig = buildCigEsszenciaeBonusPercentByYear(durationInYears)
        const partialSurrenderMin =
          variantConfig.currency === "EUR" ? CIG_ESSZENCIAE_PARTIAL_SURRENDER_MIN_EUR : CIG_ESSZENCIAE_PARTIAL_SURRENDER_MIN_HUF

        setDurationUnit("year")
        setDurationValue(durationInYears)
        setInputs((prev) => ({
          ...prev,
          currency: variantConfig.currency,
          initialCostByYear: initialCostConfig,
          initialCostDefaultPercent: 0,
          initialCostBaseMode: "payment",
          yearlyManagementFeePercent: 0,
          yearlyFixedManagementFeeAmount: 0,
          managementFeeFrequency: "éves",
          managementFeeValueType: "percent",
          managementFeeValue: 0,
          assetBasedFeePercent: 0,
          bonusMode: "none",
          bonusOnContributionPercent: 0,
          bonusPercent: 0,
          bonusStartYear: 1,
          bonusStopYear: 0,
          enableTaxCredit: false,
          taxCreditRatePercent: 0,
          taxCreditCapPerYear: 0,
          taxCreditYieldPercent: 0,
          taxCreditCalendarPostingEnabled: false,
          taxCreditStartYear: 0,
          taxCreditEndYear: 0,
          taxCreditAmountByYear: {},
          taxCreditLimitByYear: {},
          adminFeePercentOfPayment: 0,
          extraordinaryAdminFeePercentOfPayment: 0,
          accountMaintenanceMonthlyPercent: 0,
          plusCostByYear: {},
          bonusAmountByYear: bonusAmountConfig,
          bonusPercentByYear: bonusPercentConfig,
          redemptionEnabled: true,
          redemptionBaseMode: "total-account",
          redemptionFeeByYear: redemptionFeeConfig,
          redemptionFeeDefaultPercent: 0,
          isAccountSplitOpen: true,
          isTaxBonusSeparateAccount: false,
          riskInsuranceEnabled: false,
          riskInsuranceMonthlyFeeAmount: 0,
          riskInsuranceDeathBenefitAmount: 0,
          riskInsuranceStartYear: 1,
          riskInsuranceEndYear: 1,
          partialSurrenderFeeAmount: partialSurrenderMin,
          minimumBalanceAfterPartialSurrender: variantConfig.minAnnualPayment,
          paidUpMaintenanceFeeMonthlyAmount: variantConfig.paidUpMaintenanceMonthlyAmount,
          paidUpMaintenanceFeeStartMonth: 1,
        }))
        setInvestedShareByYear(investedShareConfig)
        setAssetCostPercentByYear({})
        setAccountMaintenancePercentByYear({})
        setAdminFeePercentByYear({})
        setBonusOnContributionPercentByYear({})
        setBonusPercentByYear(bonusPercentConfig)
        setRefundInitialCostBonusPercentByYear({})
        setPlusCostByYear({})
        setProductPresetBaseline({
          initialCostByYear: initialCostConfig,
          initialCostDefaultPercent: 0,
          assetBasedFeePercent: 0,
          assetCostPercentByYear: {},
          accountMaintenanceMonthlyPercent: 0,
          accountMaintenancePercentByYear: {},
          adminFeePercentOfPayment: 0,
          adminFeePercentByYear: {},
          bonusOnContributionPercentByYear: {},
          refundInitialCostBonusPercentByYear: {},
          bonusPercentByYear: bonusPercentConfig,
        })
        setRedemptionFeeByYear(redemptionFeeConfig)
        setRedemptionFeeDefaultPercent(0)
        setRedemptionBaseMode("total-account")
        setIsTaxBonusSeparateAccount(false)
        setIsAccountSplitOpen(true)
        setIsRedemptionOpen(true)
      } else if (selectedProduct === "cig_nyugdijkotvenye") {
        const durationInYears = estimateCigNyugdijkotvenyeDurationYears({
          ...inputs,
          durationUnit,
          durationValue,
          currency: "HUF",
        })
        const syntheticInputsForBonuses: InputsDaily = {
          ...inputs,
          currency: "HUF",
          productVariant: CIG_NYUGDIJKOTVENYE_PRODUCT_VARIANT,
          durationUnit: "year",
          durationValue: durationInYears,
          yearsPlanned: durationInYears,
          annualYieldPercent: inputs.annualYieldPercent,
          frequency: inputs.frequency,
          yearlyPaymentsPlan: [],
          yearlyWithdrawalsPlan: [],
        }
        const initialCostConfig = buildCigNyugdijkotvenyeInitialCostByYear(durationInYears)
        const investedShareConfig = buildCigNyugdijkotvenyeInvestedShareByYear(durationInYears)
        const redemptionFeeConfig = buildCigNyugdijkotvenyeRedemptionFeeByYear(durationInYears)
        const bonusAmountConfig = buildCigNyugdijkotvenyeBonusAmountByYear(syntheticInputsForBonuses, durationInYears)
        const bonusPercentConfig = buildCigNyugdijkotvenyeBonusPercentByYear(durationInYears)
        const assetFeePercent = resolveCigNyugdijkotvenyeAssetFeeAnnualPercent(selectedFundId)

        setDurationUnit("year")
        setDurationValue(durationInYears)
        setInputs((prev) => ({
          ...prev,
          currency: "HUF",
          initialCostByYear: initialCostConfig,
          initialCostDefaultPercent: 0,
          initialCostBaseMode: "payment",
          yearlyManagementFeePercent: 0,
          yearlyFixedManagementFeeAmount: 0,
          managementFeeFrequency: "éves",
          managementFeeValueType: "percent",
          managementFeeValue: 0,
          assetBasedFeePercent: assetFeePercent,
          bonusMode: "none",
          bonusOnContributionPercent: 0,
          bonusPercent: 0,
          bonusStartYear: 1,
          bonusStopYear: 0,
          enableTaxCredit: true,
          taxCreditRatePercent: CIG_NYUGDIJKOTVENYE_TAX_CREDIT_RATE_PERCENT,
          taxCreditCapPerYear: resolveCigNyugdijkotvenyeTaxCreditCapPerYear(),
          taxCreditYieldPercent: 1,
          taxCreditCalendarPostingEnabled: true,
          taxCreditStartYear: 1,
          taxCreditEndYear: 0,
          taxCreditAmountByYear: {},
          taxCreditLimitByYear: {},
          adminFeePercentOfPayment: 0,
          extraordinaryAdminFeePercentOfPayment: 0,
          accountMaintenanceMonthlyPercent: 0,
          plusCostByYear: {},
          bonusAmountByYear: bonusAmountConfig,
          bonusPercentByYear: bonusPercentConfig,
          redemptionEnabled: true,
          redemptionBaseMode: "total-account",
          redemptionFeeByYear: redemptionFeeConfig,
          redemptionFeeDefaultPercent: 0,
          isAccountSplitOpen: true,
          isTaxBonusSeparateAccount: true,
          riskInsuranceEnabled: false,
          riskInsuranceMonthlyFeeAmount: 0,
          riskInsuranceDeathBenefitAmount: 0,
          riskInsuranceStartYear: 1,
          riskInsuranceEndYear: 1,
          partialSurrenderFeeAmount: 300,
          minimumBalanceAfterPartialSurrender: 100_000,
          paidUpMaintenanceFeeMonthlyAmount: CIG_NYUGDIJKOTVENYE_PAID_UP_MAINTENANCE_MONTHLY_AMOUNT,
          paidUpMaintenanceFeeStartMonth: 1,
        }))
        setInvestedShareByYear(investedShareConfig)
        setAssetCostPercentByYear({})
        setAccountMaintenancePercentByYear({})
        setAdminFeePercentByYear({})
        setBonusOnContributionPercentByYear({})
        setBonusPercentByYear(bonusPercentConfig)
        setRefundInitialCostBonusPercentByYear({})
        setPlusCostByYear({})
        setProductPresetBaseline({
          initialCostByYear: initialCostConfig,
          initialCostDefaultPercent: 0,
          assetBasedFeePercent: assetFeePercent,
          assetCostPercentByYear: {},
          accountMaintenanceMonthlyPercent: 0,
          accountMaintenancePercentByYear: {},
          adminFeePercentOfPayment: 0,
          adminFeePercentByYear: {},
          bonusOnContributionPercentByYear: {},
          refundInitialCostBonusPercentByYear: {},
          bonusPercentByYear: bonusPercentConfig,
        })
        setRedemptionFeeByYear(redemptionFeeConfig)
        setRedemptionFeeDefaultPercent(0)
        setRedemptionBaseMode("total-account")
        setIsTaxBonusSeparateAccount(true)
        setIsAccountSplitOpen(true)
        setIsRedemptionOpen(true)
      } else {
        // Default placeholder for other products
        setInputs((prev) => ({
          ...prev,
          initialCostByYear: {},
          initialCostDefaultPercent: 0,
          yearlyManagementFeePercent: 0, // Replaced by managementFeeValue
          yearlyFixedManagementFeeAmount: 0, // Replaced by managementFeeValue
          managementFeeFrequency: "éves", // Reset to default
          managementFeeValueType: "percent", // Reset to default
          managementFeeValue: 0, // Reset to default
          assetBasedFeePercent: 0,
          bonusMode: "none",
          bonusPercent: 0,
          bonusStartYear: 1,
          bonusStopYear: 0,
        }))
        // Reset specific per-year configurations for default
        setInvestedShareByYear({})
        setAssetCostPercentByYear({})
        setAccountMaintenancePercentByYear({})
        setAdminFeePercentByYear({})
        setBonusOnContributionPercentByYear({})
        setRefundInitialCostBonusPercentByYear({})
        setProductPresetBaseline({
          initialCostByYear: {},
          initialCostDefaultPercent: 0,
          assetBasedFeePercent: 0,
          assetCostPercentByYear: {},
          accountMaintenanceMonthlyPercent: 0,
          accountMaintenancePercentByYear: {},
          adminFeePercentOfPayment: 0,
          adminFeePercentByYear: {},
          bonusOnContributionPercentByYear: {},
          refundInitialCostBonusPercentByYear: {},
          bonusPercentByYear: {},
        })
        setRedemptionFeeByYear({})
        setRedemptionFeeDefaultPercent(0)
        setRedemptionBaseMode("surplus-only")
        setIsTaxBonusSeparateAccount(false)
        // </CHANGE>
      }
    }
  }, [
    durationUnit,
    durationValue,
    effectiveFortisVariant,
    effectiveSelectedProductVariantCode,
    fortisVariantConfig,
    inputs.currency,
    inputs.enableTaxCredit,
    relevantFxRate,
    selectedFundId,
    selectedInsurer,
    selectedProduct,
  ])

  useEffect(() => {
    if (isHydratingRef.current) return
    if (!selectedInsurer || !selectedProduct) return

    const presetRunKey = [
      selectedInsurer,
      selectedProduct,
      effectiveSelectedProductVariantCode ?? "",
      String(inputs.currency ?? ""),
      String(inputs.enableTaxCredit ?? false),
      String(relevantFxRate ?? ""),
      selectedFundId ?? "",
    ].join("|")

    if (lastAppliedPresetKeyRef.current === presetRunKey) return
    lastAppliedPresetKeyRef.current = presetRunKey
    applyPreset()
  }, [
    applyPreset,
    selectedInsurer,
    selectedProduct,
    effectiveSelectedProductVariantCode,
    inputs.currency,
    inputs.enableTaxCredit,
    relevantFxRate,
    selectedFundId,
  ])

  useEffect(() => {
    // Only auto-update if product preset controls duration-dependent schedules.
    if (
      appliedPresetLabel &&
      (appliedPresetLabel.includes("Alfa Exclusive Plus") ||
        appliedPresetLabel.includes("Alfa Fortis") ||
        appliedPresetLabel.includes("Alfa Jáde") ||
        appliedPresetLabel.includes("Alfa Jövőkép") ||
        appliedPresetLabel.includes("Alfa Jövőtervező") ||
        appliedPresetLabel.includes("Alfa Premium Selection") ||
        appliedPresetLabel.includes("Alfa Relax Plusz"))
    ) {
      const durationInYears = Math.ceil(
        durationValue / (durationUnit === "year" ? 1 : durationUnit === "month" ? 12 / 12 : 365 / 12),
      )

      // Rebuild initial cost configuration based on new duration
      const initialCostConfig: Record<number, number> = {}
      if (appliedPresetLabel.includes("Alfa Exclusive Plus")) {
        if (durationInYears >= 5 && durationInYears <= 10) {
          initialCostConfig[1] = 49
          initialCostConfig[2] = 0
          initialCostConfig[3] = 0
        } else if (durationInYears === 11) {
          initialCostConfig[1] = 55
          initialCostConfig[2] = 5
          initialCostConfig[3] = 0
        } else if (durationInYears === 12) {
          initialCostConfig[1] = 55
          initialCostConfig[2] = 15
          initialCostConfig[3] = 0
        } else if (durationInYears === 13) {
          initialCostConfig[1] = 60
          initialCostConfig[2] = 25
          initialCostConfig[3] = 0
        } else if (durationInYears === 14) {
          initialCostConfig[1] = 60
          initialCostConfig[2] = 35
          initialCostConfig[3] = 0
        } else if (durationInYears >= 15) {
          initialCostConfig[1] = 60
          initialCostConfig[2] = 40
          initialCostConfig[3] = 10
        }
      } else if (appliedPresetLabel.includes("Alfa Fortis")) {
        // Alfa Fortis initial cost schedule
        initialCostConfig[1] = 75
        initialCostConfig[2] = 42
        initialCostConfig[3] = 15
      } else if (appliedPresetLabel.includes("Alfa Jáde")) {
        initialCostConfig[1] = 75
        initialCostConfig[2] = 45
        initialCostConfig[3] = 15
      } else if (appliedPresetLabel.includes("Alfa Jövőkép")) {
        Object.assign(initialCostConfig, buildJovokepInitialCostByYear(durationInYears))
      } else if (appliedPresetLabel.includes("Alfa Jövőtervező")) {
        Object.assign(initialCostConfig, buildJovotervezoInitialCostByYear(durationInYears))
      } else if (appliedPresetLabel.includes("Alfa Premium Selection")) {
        const variantConfig = getPremiumSelectionVariantConfig(undefined, inputs.enableTaxCredit, inputs.currency)
        Object.assign(initialCostConfig, buildPremiumSelectionInitialCostByYear(durationInYears, variantConfig))
      } else if (appliedPresetLabel.includes("Alfa Relax Plusz")) {
        Object.assign(initialCostConfig, buildRelaxPluszInitialCostByYear(durationInYears))
      }

      // Update initial costs without clearing the preset label
      setInputs((prev) => ({
        ...prev,
        initialCostByYear: initialCostConfig,
        initialCostDefaultPercent: 0,
      }))

      // Also rebuild invested share and redemption configs if relevant
      if (appliedPresetLabel.includes("Alfa Exclusive Plus")) {
        const investedShareConfig: Record<number, number> = {}
        const redemptionFeeConfig: Record<number, number> = {}
        for (let year = 1; year <= durationInYears; year++) {
          if (year === 1) {
            investedShareConfig[year] = 20
          } else if (year === 2) {
            investedShareConfig[year] = 50
          } else {
            investedShareConfig[year] = 80
          }

          if (year <= 10) {
            redemptionFeeConfig[year] = 100
          } else {
            redemptionFeeConfig[year] = 15
          }
        }
        setInvestedShareByYear(investedShareConfig)
        setRedemptionFeeByYear(redemptionFeeConfig)
        setRedemptionFeeDefaultPercent(15)
      } else if (appliedPresetLabel.includes("Alfa Fortis")) {
        // Alfa Fortis redemption fee schedule
        const redemptionFeeConfig: Record<number, number> = {}
        for (let year = 1; year <= durationInYears; year++) {
          if (year === 1) {
            redemptionFeeConfig[year] = 3.5
          } else if (year >= 2 && year <= 8) {
            redemptionFeeConfig[year] = 1.95
          } else if (year >= 9 && year <= 15) {
            redemptionFeeConfig[year] = 1.5
          } else {
            redemptionFeeConfig[year] = 0
          }
        }
        setInvestedShareByYear({}) // Reset invested share for Fortis
        setRedemptionFeeByYear(redemptionFeeConfig)
        setRedemptionFeeDefaultPercent(0) // Reset default redemption fee for Fortis
      } else if (appliedPresetLabel.includes("Alfa Jáde")) {
        const investedShareConfig = buildJadeInvestedShareByYear(durationInYears)
        const redemptionFeeConfig = buildJadeRedemptionSchedule(durationInYears)
        setInvestedShareByYear(investedShareConfig)
        setRedemptionFeeByYear(redemptionFeeConfig)
        setRedemptionFeeDefaultPercent(0)
      } else if (appliedPresetLabel.includes("Alfa Jövőkép")) {
        const investedShareConfig = buildJovokepInvestedShareByYear(durationInYears)
        const redemptionFeeConfig = buildJovokepRedemptionSchedule(durationInYears)
        setInvestedShareByYear(investedShareConfig)
        setRedemptionFeeByYear(redemptionFeeConfig)
        setRedemptionFeeDefaultPercent(0)
      } else if (appliedPresetLabel.includes("Alfa Jövőtervező")) {
        const investedShareConfig = buildJovotervezoInvestedShareByYear(durationInYears)
        const redemptionFeeConfig = buildJovotervezoRedemptionSchedule(durationInYears)
        setInvestedShareByYear(investedShareConfig)
        setRedemptionFeeByYear(redemptionFeeConfig)
        setRedemptionFeeDefaultPercent(0)
      } else if (appliedPresetLabel.includes("Alfa Premium Selection")) {
        const variantConfig = getPremiumSelectionVariantConfig(undefined, inputs.enableTaxCredit, inputs.currency)
        const investedShareConfig = buildPremiumSelectionInvestedShareByYear(durationInYears, variantConfig)
        const redemptionFeeConfig = buildPremiumSelectionRedemptionSchedule(durationInYears, variantConfig)
        setInvestedShareByYear(investedShareConfig)
        setRedemptionFeeByYear(redemptionFeeConfig)
        setRedemptionFeeDefaultPercent(0)
      } else if (appliedPresetLabel.includes("Alfa Relax Plusz")) {
        const investedShareConfig = buildRelaxPluszInvestedShareByYear(durationInYears)
        const redemptionFeeConfig = buildRelaxPluszRedemptionSchedule(durationInYears)
        setInvestedShareByYear(investedShareConfig)
        setRedemptionFeeByYear(redemptionFeeConfig)
        setRedemptionFeeDefaultPercent(0)
      }
    }
  }, [durationValue, durationUnit, appliedPresetLabel, inputs.enableTaxCredit, inputs.currency])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-durationUnit", JSON.stringify(durationUnit))
    }
  }, [durationUnit])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-durationValue", JSON.stringify(durationValue))
    }
  }, [durationValue])
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-durationFromInput", durationFromInput)
    }
  }, [durationFromInput])
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-durationToInput", durationToInput)
    }
  }, [durationToInput])
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-durationSource", durationSource)
    }
  }, [durationSource])
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-esetiDurationUnit", JSON.stringify(esetiDurationUnit))
    }
  }, [esetiDurationUnit])
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-esetiDurationValue", JSON.stringify(esetiDurationValue))
    }
  }, [esetiDurationValue])

  // Persist inputs to sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-inputs", JSON.stringify(inputs))
    }
  }, [inputs])
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-esetiBaseInputs", JSON.stringify(esetiBaseInputs))
    }
  }, [esetiBaseInputs])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-indexByYear", JSON.stringify(indexByYear))
    }
  }, [indexByYear])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-paymentByYear", JSON.stringify(paymentByYear))
    }
  }, [paymentByYear])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-withdrawalByYear", JSON.stringify(withdrawalByYear))
    }
  }, [withdrawalByYear])
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-esetiWithdrawalByYear", JSON.stringify(esetiWithdrawalByYear))
    }
  }, [esetiWithdrawalByYear])
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-esetiWithdrawalByYearTaxEligible", JSON.stringify(esetiWithdrawalByYearTaxEligible))
    }
  }, [esetiWithdrawalByYearTaxEligible])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-taxCreditAmountByYear", JSON.stringify(taxCreditAmountByYear))
    }
  }, [taxCreditAmountByYear])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-taxCreditLimitByYear", JSON.stringify(taxCreditLimitByYear))
    }
  }, [taxCreditLimitByYear])
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-esetiIndexByYear", JSON.stringify(esetiIndexByYear))
    }
  }, [esetiIndexByYear])
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-esetiIndexByYearTaxEligible", JSON.stringify(esetiIndexByYearTaxEligible))
    }
  }, [esetiIndexByYearTaxEligible])
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-esetiPaymentByYear", JSON.stringify(esetiPaymentByYear))
    }
  }, [esetiPaymentByYear])
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-esetiPaymentByYearTaxEligible", JSON.stringify(esetiPaymentByYearTaxEligible))
    }
  }, [esetiPaymentByYearTaxEligible])
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-esetiFrequency", esetiFrequency)
    }
  }, [esetiFrequency])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-investedShareByYear", JSON.stringify(investedShareByYear))
    }
  }, [investedShareByYear])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-assetCostPercentByYear", JSON.stringify(assetCostPercentByYear))
    }
  }, [assetCostPercentByYear])
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "calculator-accountMaintenancePercentByYear",
        JSON.stringify(accountMaintenancePercentByYear),
      )
    }
  }, [accountMaintenancePercentByYear])
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-adminFeePercentByYear", JSON.stringify(adminFeePercentByYear))
    }
  }, [adminFeePercentByYear])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-redemptionFeeByYear", JSON.stringify(redemptionFeeByYear))
    }
  }, [redemptionFeeByYear])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("isTaxBonusSeparateAccount", JSON.stringify(isTaxBonusSeparateAccount))
    }
  }, [isTaxBonusSeparateAccount])
  // </CHANGE>

  // Persist isAccountSplitOpen and isRedemptionOpen
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("isAccountSplitOpen", JSON.stringify(isAccountSplitOpen))
    }
  }, [isAccountSplitOpen])
  // </CHANGE>

  // Persist redemptionFeeByYear
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("redemptionFeeByYear", JSON.stringify(redemptionFeeByYear))
    }
  }, [redemptionFeeByYear])

  // Persist redemptionFeeDefaultPercent
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-redemptionFeeDefaultPercent", JSON.stringify(redemptionFeeDefaultPercent))
    }
  }, [redemptionFeeDefaultPercent])
  // </CHANGE>

  // Persist isRedemptionOpen
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("isRedemptionOpen", JSON.stringify(isRedemptionOpen))
    }
  }, [isRedemptionOpen])
  // </CHANGE>

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-selectedInsurer", JSON.stringify(selectedInsurer))
    }
  }, [selectedInsurer])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-selectedProduct", JSON.stringify(selectedProduct))
    }
  }, [selectedProduct])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-enableNetting", JSON.stringify(enableNetting))
    }
  }, [enableNetting])

  // Persist redemptionBaseMode
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("redemptionBaseMode", redemptionBaseMode)
    }
  }, [redemptionBaseMode])
  // </CHANGE>

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-plusCostByYear", JSON.stringify(plusCostByYear))
    }
  }, [plusCostByYear])
  // </CHANGE>

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-bonusPercentByYear", JSON.stringify(bonusPercentByYear))
    }
  }, [bonusPercentByYear])
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "calculator-bonusOnContributionPercentByYear",
        JSON.stringify(bonusOnContributionPercentByYear),
      )
    }
  }, [bonusOnContributionPercentByYear])
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "calculator-refundInitialCostBonusPercentByYear",
        JSON.stringify(refundInitialCostBonusPercentByYear),
      )
    }
  }, [refundInitialCostBonusPercentByYear])
  // </CHANGE>

  const toYearsFromDuration = (unit: DurationUnit, value: number) => {
    const totalDays = unit === "year" ? value * 365 : unit === "month" ? Math.round(value * (365 / 12)) : value
    return Math.max(1, Math.ceil(totalDays / 365))
  }

  const parsedDurationFrom = useMemo(() => parseHuDateInput(durationFromInput), [durationFromInput])
  const parsedDurationTo = useMemo(() => parseHuDateInput(durationToInput), [durationToInput])
  const durationDateError = useMemo(() => {
    if (!durationFromInput.trim() || !durationToInput.trim()) return ""
    if (!parsedDurationFrom || !parsedDurationTo) return "Dátum formátum: ÉÉÉÉ.HH.NN vagy ÉÉÉÉHHNN"
    if (parsedDurationTo.getTime() < parsedDurationFrom.getTime()) return "Az \"ig\" dátum nem lehet korábbi a \"tól\" dátumnál."
    return ""
  }, [durationFromInput, durationToInput, parsedDurationFrom, parsedDurationTo])

  useEffect(() => {
    if (durationSource !== "dates") return
    if (!parsedDurationFrom || !parsedDurationTo) return
    if (parsedDurationTo.getTime() < parsedDurationFrom.getTime()) return

    const dayMs = 24 * 60 * 60 * 1000
    const inclusiveDays = Math.floor((parsedDurationTo.getTime() - parsedDurationFrom.getTime()) / dayMs) + 1
    const safeDays = Math.max(1, inclusiveDays)

    if (durationUnit !== "day") setDurationUnit("day")
    if (durationValue !== safeDays) setDurationValue(safeDays)

    const fromIso = `${parsedDurationFrom.getFullYear()}-${String(parsedDurationFrom.getMonth() + 1).padStart(2, "0")}-${String(parsedDurationFrom.getDate()).padStart(2, "0")}`
    setInputs((prev) => {
      const nextMode = prev.calculationMode === "calendar" ? prev.calculationMode : "calendar"
      if (prev.startDate === fromIso && prev.calculationMode === nextMode) return prev
      return { ...prev, startDate: fromIso, calculationMode: nextMode }
    })
  }, [durationSource, parsedDurationFrom, parsedDurationTo, durationUnit, durationValue, setInputs])

  useEffect(() => {
    if (durationSource !== "value") return
    if (!Number.isFinite(durationValue) || durationValue <= 0) return

    const baseDate =
      parsedDurationFrom ??
      parseHuDateInput((inputs.startDate ?? "").split("-").join(".")) ??
      new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 12, 0, 0, 0)
    const fromIso = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, "0")}-${String(baseDate.getDate()).padStart(2, "0")}`
    const safeDurationValue = Math.max(1, Math.round(durationValue))

    let endIso = fromIso
    if (durationUnit === "day") {
      endIso = addDaysIsoClient(fromIso, safeDurationValue - 1)
    } else if (durationUnit === "month") {
      const endExclusiveIso = addMonthsIsoClient(fromIso, safeDurationValue)
      endIso = addDaysIsoClient(endExclusiveIso, -1)
    } else {
      const endExclusiveIso = addMonthsIsoClient(fromIso, safeDurationValue * 12)
      endIso = addDaysIsoClient(endExclusiveIso, -1)
    }

    const fromDate = parseHuDateInput(fromIso)
    const toDate = parseHuDateInput(endIso)
    if (!fromDate || !toDate) return

    const nextFromInput = formatHuDate(fromDate)
    const nextToInput = formatHuDate(toDate)

    if (durationFromInput !== nextFromInput) {
      setDurationFromInput(nextFromInput)
    }
    if (durationToInput !== nextToInput) {
      setDurationToInput(nextToInput)
    }

    setInputs((prev) => {
      const nextMode = prev.calculationMode === "calendar" ? prev.calculationMode : "calendar"
      if (prev.startDate === fromIso && prev.calculationMode === nextMode) return prev
      return { ...prev, startDate: fromIso, calculationMode: nextMode }
    })
  }, [
    durationSource,
    durationValue,
    durationUnit,
    parsedDurationFrom,
    inputs.startDate,
    durationFromInput,
    durationToInput,
    setInputs,
  ])

  useEffect(() => {
    // For real fund series (Allianz ulexchange), we can load without requiring a product selection,
    // as long as we are in Allianz fund mode and have a fund selected.
    const canLoadFundSeries = isAllianzFundMode && (inputs.currency === "HUF" || inputs.currency === "EUR")
    if (yieldSourceMode !== "fund" || !selectedFundId || !canLoadFundSeries) {
      setFundSeriesLoading(false)
      setFundSeriesError(null)
      setFundSeriesPoints([])
      setFundSeriesSource(null)
      setFundSeriesAnnualizedReturn(null)
      setFundSeriesAvailableRange(null)
      setFundSeriesFundEarliestAvailable(null)
      return
    }

    let cancelled = false
    const controller = new AbortController()
    const from = parsedDurationFrom
      ? `${parsedDurationFrom.getFullYear()}-${String(parsedDurationFrom.getMonth() + 1).padStart(2, "0")}-${String(parsedDurationFrom.getDate()).padStart(2, "0")}`
      : undefined
    const to = parsedDurationTo
      ? `${parsedDurationTo.getFullYear()}-${String(parsedDurationTo.getMonth() + 1).padStart(2, "0")}-${String(parsedDurationTo.getDate()).padStart(2, "0")}`
      : undefined

    const query = new URLSearchParams({ fundId: selectedFundId })
    if (from) query.set("from", from)
    if (to) query.set("to", to)
    if (isAllianzFundMode) {
      query.set("provider", "allianz-ulexchange")
      query.set("program", "ul2005")
      query.set("currency", inputs.currency)
    }
    query.set("mode", fundCalculationMode)

    const load = async () => {
      setFundSeriesLoading(true)
      setFundSeriesError(null)
      try {
        // Replay mode can require paging (multi-decade ranges). We loop client-side to avoid serverless timeouts.
        if (fundCalculationMode === "replay" && isAllianzFundMode && from && to) {
          const all: FundSeriesPoint[] = []
          const byDate = new Map<string, number>()
          let cursorTo: string | null = null
          let guard = 0

          while (!cancelled) {
            guard += 1
            if (guard > 400) break

            const paged = new URLSearchParams(query)
            if (cursorTo) paged.set("cursorTo", cursorTo)

            const response = await fetch(`/api/funds/prices?${paged.toString()}`, { signal: controller.signal })
            const data = (await response.json()) as FundSeriesApiResponse
            if (!response.ok || data.error) {
              throw new Error(data.error || "Eszközalap idősor nem elérhető")
            }
            if (data.available?.startDate && data.available?.endDate) {
              setFundSeriesAvailableRange({ startDate: data.available.startDate, endDate: data.available.endDate })
            }

            const points = Array.isArray(data.points) ? data.points : []
            if (points.length === 0) {
              // If the very first page has no points, it's almost certainly a configuration mismatch (fund/currency/provider).
              // For later pages (older history), the fund might not exist yet; stop paging in that case.
              if (all.length === 0) {
                const details = [
                  data.source ? `source=${data.source}` : null,
                  inputs.currency ? `currency=${inputs.currency}` : null,
                  selectedFundId ? `fund=${selectedFundId}` : null,
                  from ? `from=${from}` : null,
                  (cursorTo || to) ? `to=${cursorTo || to}` : null,
                ]
                  .filter(Boolean)
                  .join(", ")
                throw new Error(`Allianz idősor: 0 pont érkezett (${details}).`)
              }
              break
            }
            for (const p of points) {
              if (!p || typeof p.date !== "string" || typeof p.price !== "number") continue
              if (!Number.isFinite(p.price) || p.price <= 0) continue
              if (!byDate.has(p.date)) all.push(p)
              byDate.set(p.date, p.price)
            }

            setFundSeriesPoints(
              all
                .slice()
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((p) => ({ date: p.date, price: byDate.get(p.date) ?? p.price })),
            )
            setFundSeriesSource(data.source ?? null)

            const next = data.page?.nextCursorTo ?? null
            if (!next) {
              setFundSeriesAnnualizedReturn(
                typeof data.stats?.annualizedReturnPercent === "number" ? data.stats.annualizedReturnPercent : null,
              )
              break
            }
            cursorTo = next
          }
        } else {
          const response = await fetch(`/api/funds/prices?${query.toString()}`, { signal: controller.signal })
          const data = (await response.json()) as FundSeriesApiResponse
          if (!response.ok || data.error) {
            throw new Error(data.error || "Eszközalap idősor nem elérhető")
          }
          if (cancelled) return
          if (data.available?.startDate && data.available?.endDate) {
            setFundSeriesAvailableRange({ startDate: data.available.startDate, endDate: data.available.endDate })
          }
          const points = Array.isArray(data.points) ? data.points : []
          setFundSeriesPoints(points)
          setFundSeriesSource(data.source ?? null)
          setFundSeriesAnnualizedReturn(
            typeof data.stats?.annualizedReturnPercent === "number" ? data.stats.annualizedReturnPercent : null,
          )
        }
      } catch (error) {
        if (cancelled) return
        if (error instanceof DOMException && error.name === "AbortError") return
        const message = error instanceof Error ? error.message : "Eszközalap idősor nem elérhető"
        setFundSeriesError(message)
        setFundSeriesPoints([])
        setFundSeriesSource(null)
        setFundSeriesAnnualizedReturn(null)
        setFundSeriesAvailableRange(null)
        setFundSeriesFundEarliestAvailable(null)
      } finally {
        if (!cancelled) {
          setFundSeriesLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [yieldSourceMode, selectedFundId, selectedProduct, parsedDurationFrom, parsedDurationTo, fundCalculationMode, inputs.currency, isAllianzFundMode])

  useEffect(() => {
    if (yieldSourceMode !== "fund") return
    if (fundCalculationMode !== "averaged") return
    if (typeof fundSeriesAnnualizedReturn !== "number") return
    setInputs((prev) =>
      prev.annualYieldPercent === fundSeriesAnnualizedReturn
        ? prev
        : { ...prev, annualYieldPercent: fundSeriesAnnualizedReturn },
    )
  }, [yieldSourceMode, fundCalculationMode, fundSeriesAnnualizedReturn, setInputs])

  const totalYearsForPlan = useMemo(() => toYearsFromDuration(durationUnit, durationValue), [durationUnit, durationValue])
  const esetiDurationMaxByUnit = useMemo(() => {
    return {
      year: totalYearsForPlan,
      month: totalYearsForPlan * 12,
      day: totalYearsForPlan * 365,
    } as const
  }, [totalYearsForPlan])
  useEffect(() => {
    const maxForUnit = esetiDurationMaxByUnit[esetiDurationUnit]
    if (esetiDurationValue > maxForUnit) {
      setEsetiDurationValue(maxForUnit)
    }
  }, [esetiDurationValue, esetiDurationUnit, esetiDurationMaxByUnit])
  const esetiTotalYearsForPlan = useMemo(() => {
    const cappedValue = Math.min(esetiDurationValue, esetiDurationMaxByUnit[esetiDurationUnit])
    return toYearsFromDuration(esetiDurationUnit, cappedValue)
  }, [esetiDurationUnit, esetiDurationValue, esetiDurationMaxByUnit])

  const { planIndex, planPayment, yearlyBasePaymentYear1 } = useMemo(() => {
    const periodsPerYear =
      inputs.frequency === "havi" ? 12 : inputs.frequency === "negyedéves" ? 4 : inputs.frequency === "féléves" ? 2 : 1
    const baseYear1Payment = inputs.keepYearlyPayment
      ? inputs.regularPayment * 12
      : inputs.regularPayment * periodsPerYear

    const planIdx: Record<number, number> = {}
    const planPay: Record<number, number> = {}

    for (let y = 1; y <= totalYearsForPlan; y++) {
      planIdx[y] = indexByYear[y] ?? inputs.annualIndexPercent
    }

    planPay[1] = paymentByYear[1] ?? baseYear1Payment

    // TODO: Replace with real chaining calculation when implementing business logic
    // For UI-only: use base payment for all years (no chaining calculation)
    for (let y = 2; y <= totalYearsForPlan; y++) {
      planPay[y] = paymentByYear[y] ?? baseYear1Payment // Use base payment, no chaining
    }

    return { planIndex: planIdx, planPayment: planPay, yearlyBasePaymentYear1: baseYear1Payment }
  }, [
    inputs.regularPayment,
    inputs.frequency,
    inputs.keepYearlyPayment,
    totalYearsForPlan,
    inputs.annualIndexPercent,
    indexByYear,
    paymentByYear,
  ])

  const plan = useMemo(() => {
    const periodsPerYear =
      inputs.frequency === "havi" ? 12 : inputs.frequency === "negyedéves" ? 4 : inputs.frequency === "féléves" ? 2 : 1
    const baseYear1Payment = inputs.keepYearlyPayment
      ? inputs.regularPayment * 12
      : inputs.regularPayment * periodsPerYear

    return buildYearlyPlan({
      years: totalYearsForPlan,
      baseYear1Payment,
      baseAnnualIndexPercent: inputs.annualIndexPercent,
      indexByYear,
      paymentByYear,
      withdrawalByYear,
    })
  }, [
    totalYearsForPlan,
    inputs.regularPayment,
    inputs.frequency,
    inputs.keepYearlyPayment,
    inputs.annualIndexPercent,
    indexByYear,
    paymentByYear,
    withdrawalByYear,
  ])

  const esetiPlan = useMemo(() => {
    const buildEsetiPlan = (
      indexMap: Record<number, number>,
      paymentMap: Record<number, number>,
      withdrawalMap: Record<number, number>,
    ) => {
      const periodsPerYear =
        esetiBaseInputs.frequency === "havi"
          ? 12
          : esetiBaseInputs.frequency === "negyedéves"
            ? 4
            : esetiBaseInputs.frequency === "féléves"
              ? 2
              : 1
      const baseYear1Payment = esetiBaseInputs.keepYearlyPayment
        ? esetiBaseInputs.regularPayment * 12
        : esetiBaseInputs.regularPayment * periodsPerYear
      return buildYearlyPlan({
        years: esetiTotalYearsForPlan,
        baseYear1Payment,
        baseAnnualIndexPercent: esetiBaseInputs.annualIndexPercent,
        indexByYear: indexMap,
        paymentByYear: paymentMap,
        withdrawalByYear: withdrawalMap,
      })
    }

    return buildEsetiPlan(esetiIndexByYear, esetiPaymentByYear, esetiWithdrawalByYear)
  }, [esetiBaseInputs, esetiTotalYearsForPlan, esetiIndexByYear, esetiPaymentByYear, esetiWithdrawalByYear])
  const esetiPlanTaxEligible = useMemo(() => {
    const periodsPerYear =
      esetiBaseInputs.frequency === "havi"
        ? 12
        : esetiBaseInputs.frequency === "negyedéves"
          ? 4
          : esetiBaseInputs.frequency === "féléves"
            ? 2
            : 1
    const baseYear1Payment = esetiBaseInputs.keepYearlyPayment
      ? esetiBaseInputs.regularPayment * 12
      : esetiBaseInputs.regularPayment * periodsPerYear
    return buildYearlyPlan({
      years: esetiTotalYearsForPlan,
      baseYear1Payment,
      baseAnnualIndexPercent: esetiBaseInputs.annualIndexPercent,
      indexByYear: esetiIndexByYearTaxEligible,
      paymentByYear: esetiPaymentByYearTaxEligible,
      withdrawalByYear: esetiWithdrawalByYearTaxEligible,
    })
  }, [
    esetiBaseInputs,
    esetiTotalYearsForPlan,
    esetiIndexByYearTaxEligible,
    esetiPaymentByYearTaxEligible,
    esetiWithdrawalByYearTaxEligible,
  ])
  const esetiPlanIndex = useMemo(() => {
    const map: Record<number, number> = {}
    for (let y = 1; y <= esetiTotalYearsForPlan; y++) {
      map[y] = esetiPlan.indexEffective[y] ?? 0
    }
    return map
  }, [esetiPlan, esetiTotalYearsForPlan])
  const esetiPlanPayment = useMemo(() => {
    const map: Record<number, number> = {}
    for (let y = 1; y <= esetiTotalYearsForPlan; y++) {
      map[y] = esetiPlan.yearlyPaymentsPlan[y] ?? 0
    }
    return map
  }, [esetiPlan, esetiTotalYearsForPlan])
  const esetiPlanIndexTaxEligible = useMemo(() => {
    const map: Record<number, number> = {}
    for (let y = 1; y <= esetiTotalYearsForPlan; y++) {
      map[y] = esetiPlanTaxEligible.indexEffective[y] ?? 0
    }
    return map
  }, [esetiPlanTaxEligible, esetiTotalYearsForPlan])
  const esetiPlanPaymentTaxEligible = useMemo(() => {
    const map: Record<number, number> = {}
    for (let y = 1; y <= esetiTotalYearsForPlan; y++) {
      map[y] = esetiPlanTaxEligible.yearlyPaymentsPlan[y] ?? 0
    }
    return map
  }, [esetiPlanTaxEligible, esetiTotalYearsForPlan])

  // Risk Insurance Cost Calculation
  const [enableRiskInsurance, setEnableRiskInsurance] = useState(false)
  const [riskInsuranceType, setRiskInsuranceType] = useState<string>("")
  const [riskInsuranceFeePercentOfMonthlyPayment, setRiskInsuranceFeePercentOfMonthlyPayment] = useState(0)
  const [riskInsuranceMonthlyFeeAmount, setRiskInsuranceMonthlyFeeAmount] = useState(0)
  const [riskInsuranceStartYear, setRiskInsuranceStartYear] = useState(1)
  const [riskInsuranceEndYear, setRiskInsuranceEndYear] = useState<number | undefined>(undefined)
  const [riskInsuranceAnnualIndexPercent, setRiskInsuranceAnnualIndexPercent] = useState(0)

  const isFundDataReady =
    yieldSourceMode === "fund" &&
    (fundCalculationMode === "replay"
      ? fundSeriesPoints.length > 1
      : typeof fundSeriesAnnualizedReturn === "number")
  const isOcrDataReady =
    yieldSourceMode === "ocr" &&
    isParsedChartSeriesUsable &&
    (parsedChartSeries?.points.length ?? 0) > 1

  const effectiveYieldSourceMode: YieldSourceMode =
    yieldSourceMode === "fund"
      ? canUseFundYield && isFundDataReady
        ? "fund"
        : "manual"
      : yieldSourceMode === "ocr"
        ? isOcrDataReady
          ? "ocr"
          : "manual"
        : "manual"

  const yieldFallbackMessage =
    yieldSourceMode === "fund" && effectiveYieldSourceMode === "manual"
      ? canUseFundYield
        ? "Fund idősor nem elérhető, kézi hozam fallback aktív."
        : "Fund módhoz termékválasztás szükséges, kézi hozam fallback aktív."
      : yieldSourceMode === "ocr" && effectiveYieldSourceMode === "manual"
        ? "OCR idősor nem használható, kézi hozam fallback aktív."
        : null

  const engineProductVariant = useMemo(() => {
    if (selectedProduct === "alfa_exclusive_plus") {
      return inputs.enableTaxCredit ? "alfa_exclusive_plus_ny05" : "alfa_exclusive_plus_tr08"
    }
    if (selectedProduct === "alfa_fortis") {
      return toFortisProductVariantId(resolveFortisVariant(undefined, inputs.currency))
    }
    if (selectedProduct === "alfa_jade") {
      return toJadeProductVariantId(resolveJadeVariant(undefined, inputs.currency))
    }
    if (selectedProduct === "alfa_jovokep") {
      return "alfa_jovokep_tr10"
    }
    if (selectedProduct === "alfa_jovotervezo") {
      return "alfa_jovotervezo_tr03"
    }
    if (selectedProduct === "alfa_premium_selection") {
      const variant = resolvePremiumSelectionVariant(undefined, inputs.enableTaxCredit, inputs.currency)
      return variant === "ny06"
        ? "alfa_premium_selection_ny06"
        : variant === "ny12"
          ? "alfa_premium_selection_ny12"
        : variant === "ny22"
          ? "alfa_premium_selection_ny22"
        : variant === "tr18"
          ? "alfa_premium_selection_tr18"
          : variant === "tr28"
            ? "alfa_premium_selection_tr28"
          : "alfa_premium_selection_tr09"
    }
    if (selectedProduct === "alfa_zen" || selectedProduct === "alfa_zen_eur") {
      const variant = resolveAlfaZenVariant(undefined, inputs.currency)
      return toAlfaZenProductVariantId(variant)
    }
    if (selectedProduct === "alfa_zen_pro") {
      const variant = resolveZenProVariant(undefined, inputs.currency)
      return toZenProProductVariantId(variant)
    }
    if (selectedProduct === "generali_kabala") {
      const variant = resolveGeneraliKabalaU91Variant(undefined, inputs.enableTaxCredit)
      return toGeneraliKabalaU91ProductVariantId(variant)
    }
    if (selectedProduct === "generali_mylife_extra_plusz") {
      return toGeneraliMylifeExtraPluszProductVariantId(
        resolveGeneraliMylifeExtraPluszVariant(undefined, inputs.enableTaxCredit),
      )
    }
    if (selectedProduct === "cig_nyugdijkotvenye") {
      return CIG_NYUGDIJKOTVENYE_PRODUCT_VARIANT
    }
    if (selectedProduct === "cig_esszenciae") {
      return toCigEsszenciaeProductVariantId(resolveCigEsszenciaeVariant(undefined, inputs.currency))
    }
    if (selectedProduct === "knh_hozamhalmozo") {
      return toKnhHozamhalmozoProductVariantId(resolveKnhHozamhalmozoVariant())
    }
    if (selectedProduct === "knh_nyugdijbiztositas4") {
      return toKnhNyugdijbiztositas4ProductVariantId(resolveKnhNyugdijbiztositas4Variant())
    }
    if (selectedProduct === "metlife_manhattan") {
      return toMetlifeManhattanProductVariantId(resolveMetlifeManhattanVariant(undefined, inputs.currency))
    }
    if (selectedProduct === "metlife_nyugdijprogram") {
      return toMetlifeNyugdijprogramProductVariantId(resolveMetlifeNyugdijprogramVariant(undefined, inputs.currency))
    }
    if (selectedProduct === "posta_trend") {
      return toPostaTrendProductVariantId(resolvePostaTrendVariant())
    }
    if (selectedProduct === "posta_trend_nyugdij") {
      return toPostaTrendNyugdijProductVariantId(resolvePostaTrendNyugdijVariant())
    }
    if (selectedProduct === "nn_eletkapu_119") {
      return toNnEletkapu119ProductVariantId(resolveNnEletkapu119Variant())
    }
    if (selectedProduct === "nn_motiva_158") {
      return toNnMotiva158ProductVariantId(resolveNnMotiva158VariantFromInputs({ currency: inputs.currency }))
    }
    if (selectedProduct === "nn_visio_118") {
      return toNnVisio118ProductVariantId()
    }
    if (selectedProduct === "nn_vista_128") {
      return toNnVista128ProductVariantId()
    }
    if (selectedProduct === "signal_elorelato_ul001") {
      return toSignalElorelatoUl001ProductVariantId({
        paymentMethodProfile: signalUl001PaymentMethodProfile,
        vakProfile: signalUl001VakProfile,
        loyaltyBonusEnabled: signalUl001LoyaltyBonusEnabled,
      })
    }
    if (selectedProduct === "signal_nyugdij_terv_plusz_ny010") {
      return toSignalNyugdijTervPluszNy010ProductVariantId()
    }
    if (selectedProduct === "signal_nyugdijprogram_sn005") {
      return toSignalNyugdijprogramSn005ProductVariantId()
    }
    if (selectedProduct === "signal_ongondoskodasi_wl009") {
      return toSignalOngondoskodasiWl009ProductVariantId()
    }
    if (selectedProduct === "union_vienna_age_505") {
      const variant = resolveUnionViennaAge505Variant(undefined, inputs.currency)
      return toUnionViennaAge505ProductVariantId(
        variant,
        union505LoyaltyBonusEligible ? "eligible" : "blocked-after-partial-surrender",
      )
    }
    if (selectedProduct === "union_vienna_plan_500") {
      const variant = resolveUnionViennaPlan500Variant(undefined, inputs.currency)
      return toUnionViennaPlan500ProductVariantId(variant)
    }
    if (selectedProduct === "union_vienna_time") {
      const variant = resolveUnionViennaTimeVariant(undefined, unionViennaTimeChannelProfile)
      return toUnionViennaTimeProductVariantId(variant)
    }
    if (selectedProduct === "uniqa_eletcel_275") {
      return toUniqaEletcel275ProductVariantId()
    }
    if (selectedProduct === "uniqa_premium_life_190") {
      return toUniqaPremiumLife190ProductVariantId()
    }
    if (selectedProduct === "groupama_next") {
      return toGroupamaNextProductVariantId(resolveGroupamaNextVariant(groupamaNextAllocationProfile))
    }
    if (selectedProduct === "groupama_easy") {
      return toGroupamaEasyProductVariantId(resolveGroupamaEasyVariant(undefined, inputs.enableTaxCredit))
    }
    return selectedProduct ?? undefined
  }, [
    selectedProduct,
    inputs.currency,
    inputs.enableTaxCredit,
    signalUl001PaymentMethodProfile,
    signalUl001VakProfile,
    signalUl001LoyaltyBonusEnabled,
    union505LoyaltyBonusEligible,
    unionViennaTimeChannelProfile,
    groupamaNextAllocationProfile,
    inputs.enableTaxCredit,
  ])

  const dailyInputs = useMemo<InputsDaily>(() => {
    const taxCreditLimits = Object.entries(taxCreditLimitByYear).reduce(
      (acc, [year, limit]) => {
        acc[Number(year)] = limit
        return acc
      },
      {} as Record<number, number>,
    )

    const exchangeRate = inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate
    const useFundSeries =
      effectiveYieldSourceMode === "fund" && fundCalculationMode === "replay" && fundSeriesPoints.length > 1
    const useParsedChartSeries = effectiveYieldSourceMode === "ocr" && (parsedChartSeries?.points.length ?? 0) > 1
    const effectiveAnnualYieldPercent = effectiveYieldSourceMode === "manual" ? manualYieldPercent : inputs.annualYieldPercent
    const isFortisProduct = selectedProduct === "alfa_fortis"
    const isJovokepProduct = selectedProduct === "alfa_jovokep"
    const fortisConfig = isFortisProduct ? getFortisVariantConfig(engineProductVariant, inputs.currency) : null
    const resolvedDurationYears = toYearsFromDuration(durationUnit, durationValue)
    const isGeneraliKabalaPension = selectedProduct === "generali_kabala" && inputs.enableTaxCredit
    const clampedEntryAge = isFortisProduct
      ? Math.min(FORTIS_MAX_ENTRY_AGE, Math.max(FORTIS_MIN_ENTRY_AGE, Math.round(inputs.insuredEntryAge ?? 38)))
      : isJovokepProduct
        ? clampJovokepEntryAge(inputs.insuredEntryAge, resolvedDurationYears)
        : isGeneraliKabalaPension
          ? Math.min(
              GENERALI_KABALA_U91_PENSION_MAX_ENTRY_AGE,
              Math.max(GENERALI_KABALA_U91_PENSION_MIN_ENTRY_AGE, Math.round(inputs.insuredEntryAge ?? 38)),
            )
        : (inputs.insuredEntryAge ?? 38)

    return {
      currency: inputs.currency,
      durationUnit,
      durationValue,
      annualYieldPercent: effectiveAnnualYieldPercent,
      frequency: inputs.frequency,
      yearsPlanned: totalYearsForPlan,
      yearlyPaymentsPlan: plan.yearlyPaymentsPlan,
      yearlyWithdrawalsPlan: plan.yearlyWithdrawalsPlan,
      initialCostByYear: inputs.initialCostByYear,
      initialCostDefaultPercent: inputs.initialCostDefaultPercent,
      yearlyManagementFeePercent: inputs.yearlyManagementFeePercent, // This is now replaced by managementFeeValue
      yearlyFixedManagementFeeAmount: inputs.yearlyFixedManagementFeeAmount, // This is now replaced by managementFeeValue
      managementFeeStartYear: inputs.managementFeeStartYear,
      managementFeeStopYear: inputs.managementFeeStopYear || undefined,
      assetBasedFeePercent: inputs.assetBasedFeePercent,
      assetCostPercentByYear: assetCostPercentByYear,
      adminFeePercentByYear: adminFeePercentByYear,
      accountMaintenancePercentByYear: accountMaintenancePercentByYear,
      plusCostByYear:
        selectedProduct === "generali_kabala"
          ? Object.fromEntries(
              Object.entries(plusCostByYear).map(([year, value]) => [Number(year), Math.max(0, value) * 12]),
            )
          : plusCostByYear,
      // </CHANGE>
      managementFeeFrequency: inputs.managementFeeFrequency, // Added managementFeeFrequency
      managementFeeValueType: inputs.managementFeeValueType, // Added managementFeeValueType
      managementFeeValue: inputs.managementFeeValue, // Added managementFeeValue
      customEntries: customEntryDefinitionsMain,
      // </CHANGE>
      bonusPercentByYear: bonusPercentByYear, // Added bonusPercentByYear to daily inputs
      bonusOnContributionPercentByYear: bonusOnContributionPercentByYear,
      refundInitialCostBonusPercentByYear: refundInitialCostBonusPercentByYear,
      // </CHANGE>
      bonusMode: inputs.bonusMode,
      bonusOnContributionPercent: inputs.bonusOnContributionPercent,
      bonusFromYear: inputs.bonusFromYear,
      enableTaxCredit: inputs.enableTaxCredit,
      taxCreditRatePercent: inputs.taxCreditRatePercent,
      taxCreditCapPerYear: inputs.taxCreditCapPerYear,
      taxCreditStartYear: inputs.taxCreditStartYear,
      taxCreditEndYear: inputs.taxCreditEndYear,
      stopTaxCreditAfterFirstWithdrawal: inputs.stopTaxCreditAfterFirstWithdrawal,
      taxCreditLimitByYear: taxCreditLimits,
      taxCreditAmountByYear: taxCreditAmountByYear,
      taxCreditYieldPercent: inputs.taxCreditYieldPercent,
      taxCreditCalendarPostingEnabled: inputs.taxCreditCalendarPostingEnabled,
      productVariant: engineProductVariant,
      selectedFundId,
      calculationMode: inputs.calculationMode,
      startDate: inputs.startDate,
      referenceYear: parsedDurationFrom?.getFullYear(),
      fundCalculationMode: useParsedChartSeries ? "replay" : useFundSeries ? fundCalculationMode : undefined,
      fundPriceSeries: useParsedChartSeries ? parsedChartSeries?.points : useFundSeries ? fundSeriesPoints : undefined,
      fundReplayWrap: true,
      bonusPercent: inputs.bonusPercent,
      bonusStartYear: inputs.bonusStartYear,
      bonusStopYear: inputs.bonusStopYear,
      investedShareByYear,
      investedShareDefaultPercent: inputs.investedShareDefaultPercent,
      // Pass isAccountSplitOpen to calculation
      isAccountSplitOpen: isAccountSplitOpen,
      // </CHANGE>
      redemptionFeeByYear: redemptionFeeByYear,
      redemptionFeeDefaultPercent: redemptionFeeDefaultPercent,
      redemptionBaseMode: redemptionBaseMode === "total-account" ? "total" : redemptionBaseMode, // Map UI mode to engine mode
      redemptionEnabled: isRedemptionOpen,
      isTaxBonusSeparateAccount,
      // </CHANGE>
      eurToHufRate: exchangeRate, // Pass the correct rate based on currency
      riskInsuranceEnabled: enableRiskInsurance,
      riskInsuranceMonthlyFeeAmount: riskInsuranceMonthlyFeeAmount,
      riskInsuranceFeePercentOfMonthlyPayment: riskInsuranceFeePercentOfMonthlyPayment,
      riskInsuranceDeathBenefitAmount: inputs.riskInsuranceDeathBenefitAmount,
      riskInsuranceDisabilityBenefitAmount: inputs.riskInsuranceDisabilityBenefitAmount,
      riskInsuranceAnnualIndexPercent: riskInsuranceAnnualIndexPercent,
      riskInsuranceStartYear: riskInsuranceStartYear,
      riskInsuranceEndYear: riskInsuranceEndYear,
      insuredEntryAge: clampedEntryAge,
      paidUpMaintenanceFeeMonthlyAmount: inputs.paidUpMaintenanceFeeMonthlyAmount,
      paidUpMaintenanceFeeStartMonth: inputs.paidUpMaintenanceFeeStartMonth,
      partialSurrenderFeeAmount: isFortisProduct
        ? fortisConfig?.partialSurrenderFixedFee ?? inputs.partialSurrenderFeeAmount
        : inputs.partialSurrenderFeeAmount,
      minimumBalanceAfterPartialSurrender: isFortisProduct
        ? fortisConfig?.minBalanceAfterPartialSurrender ?? inputs.minimumBalanceAfterPartialSurrender
        : inputs.minimumBalanceAfterPartialSurrender,
      minimumPaidUpValue: isFortisProduct
        ? fortisConfig?.minPaidUpValue ?? inputs.minimumPaidUpValue
        : inputs.minimumPaidUpValue,
    }
  }, [
    effectiveYieldSourceMode,
    manualYieldPercent,
    isParsedChartSeriesUsable,
    parsedChartSeries,
    fundCalculationMode,
    fundSeriesPoints,
    inputs.currency,
    inputs.frequency,
    inputs.regularPayment,
    inputs.keepYearlyPayment,
    inputs.annualYieldPercent,
    inputs.annualIndexPercent,
    inputs.upfrontCostPercent,
    inputs.yearlyManagementFeePercent, // This is now replaced by managementFeeValue
    inputs.yearlyFixedManagementFeeAmount, // This is now replaced by managementFeeValue
    inputs.managementFeeStartYear,
    inputs.managementFeeStopYear,
    inputs.assetBasedFeePercent,
    inputs.bonusMode,
    inputs.bonusOnContributionPercent,
    inputs.bonusFromYear,
    inputs.enableTaxCredit,
    inputs.taxCreditRatePercent,
    inputs.taxCreditCapPerYear,
    inputs.taxCreditStartYear,
    inputs.taxCreditEndYear,
    inputs.taxCreditYieldPercent,
    inputs.taxCreditCalendarPostingEnabled,
    inputs.paidUpMaintenanceFeeMonthlyAmount,
    inputs.paidUpMaintenanceFeeStartMonth,
    inputs.insuredEntryAge,
    inputs.stopTaxCreditAfterFirstWithdrawal,
    inputs.calculationMode,
    inputs.startDate,
    parsedDurationFrom,
    engineProductVariant,
    selectedProduct,
    inputs.bonusPercent,
    inputs.bonusStartYear,
    inputs.bonusStopYear,
    inputs.eurToHufRate, // Added dependency
    inputs.usdToHufRate, // Added dependency
    durationUnit,
    durationValue,
    totalYearsForPlan,
    plan.yearlyPaymentsPlan,
    plan.yearlyWithdrawalsPlan,
    indexByYear,
    paymentByYear,
    withdrawalByYear,
    taxCreditLimitByYear,
    // Added dependencies for new fields
    inputs.initialCostByYear,
    inputs.initialCostDefaultPercent,
    investedShareByYear,
    withdrawalByYear,
    inputs.investedShareDefaultPercent,
    isAccountSplitOpen, // Added dependency
    redemptionFeeByYear,
    redemptionFeeDefaultPercent,
    redemptionBaseMode, // Added to dependency array
    isRedemptionOpen, // Added to dependency array
    assetCostPercentByYear,
    adminFeePercentByYear,
    accountMaintenancePercentByYear,
    plusCostByYear, // Added dependency
    bonusPercentByYear, // Added bonusPercentByYear dependency
    bonusOnContributionPercentByYear,
    refundInitialCostBonusPercentByYear,
    // Added dependencies for new management fee fields
    inputs.managementFeeFrequency,
    inputs.managementFeeValueType,
    inputs.managementFeeValue,
    customEntryDefinitionsMain,
    // </CHANGE>
    isTaxBonusSeparateAccount, // Added dependency
    // </CHANGE>
    enableRiskInsurance,
    riskInsuranceFeePercentOfMonthlyPayment,
    inputs.riskInsuranceDeathBenefitAmount,
    inputs.riskInsuranceDisabilityBenefitAmount,
    riskInsuranceMonthlyFeeAmount,
    riskInsuranceAnnualIndexPercent,
    riskInsuranceStartYear,
    riskInsuranceEndYear,
    selectedFundId,
    canUseFundYield,
    isFundDataReady,
    isOcrDataReady,
    yieldSourceMode,
    // Removed: surplusToExtraFeeDefaultPercent
  ])
  const productId = useMemo(
    () => mapSelectedProductToProductId(selectedProduct, selectedInsurer),
    [selectedProduct, selectedInsurer, unionViennaTimeChannelProfile],
  )

  const results = useMemo(
    () => calculate(productId, dailyInputs),
    [productId, dailyInputs],
  )
  const mainTaxCreditByYear = useMemo(() => {
    const map: Record<number, number> = {}
    for (const row of results.yearlyBreakdown ?? []) {
      if (!row) continue
      map[row.year] = row.taxCreditForYear ?? 0
    }
    return map
  }, [results.yearlyBreakdown])
  const esetiTaxCreditLimitsByYear = useMemo(() => {
    const map: Record<number, number> = {}
    const defaultCap = inputs.taxCreditCapPerYear ?? 0
    for (let year = 1; year <= totalYearsForPlan; year++) {
      const yearCap = taxCreditLimitByYear[year] ?? defaultCap
      const mainUsed = mainTaxCreditByYear[year] ?? 0
      map[year] = Math.max(0, yearCap - mainUsed)
    }
    return map
  }, [inputs.taxCreditCapPerYear, totalYearsForPlan, taxCreditLimitByYear, mainTaxCreditByYear])
  const isPremiumSelectionNy06 =
    selectedProduct === "alfa_premium_selection" &&
    (premiumSelectionVariantConfig.variant === "ny06" || premiumSelectionVariantConfig.variant === "ny22")
  const isPremiumSelectionTr18 =
    selectedProduct === "alfa_premium_selection" &&
    (premiumSelectionVariantConfig.variant === "tr18" ||
      premiumSelectionVariantConfig.variant === "tr28" ||
      premiumSelectionVariantConfig.variant === "ny22")

  useEffect(() => {
    if (!isPremiumSelectionTr18) return
    if (inputs.frequency === "éves") return
    setInputs((prev) => ({ ...prev, frequency: "éves" }))
  }, [isPremiumSelectionTr18, inputs.frequency])

  useEffect(() => {
    if (!isPremiumSelectionTr18) return
    if (esetiFrequency === "éves" && esetiBaseInputs.frequency === "éves") return
    setEsetiFrequency("éves")
    setEsetiBaseInputs((prev) => ({ ...prev, frequency: "éves" }))
  }, [isPremiumSelectionTr18, esetiFrequency, esetiBaseInputs.frequency])

  const dailyInputsEseti = useMemo<InputsDaily>(() => {
    const fortisConfig = selectedProduct === "alfa_fortis" ? getFortisVariantConfig(engineProductVariant, inputs.currency) : null
    const jadeConfig = selectedProduct === "alfa_jade" ? getJadeVariantConfig(engineProductVariant, inputs.currency) : null
    const isAllianzProductForEseti =
      selectedProduct === "allianz_eletprogram" || selectedProduct === "allianz_bonusz_eletprogram"
    const allianzEsetiAssetOverrides = isAllianzProductForEseti ? { ...assetCostPercentByYear } : {}

    return {
      ...dailyInputs,
      customEntries: customEntryDefinitionsEseti,
      disableProductDefaults: true,
      durationUnit: esetiDurationUnit,
      durationValue: Math.min(esetiDurationValue, esetiDurationMaxByUnit[esetiDurationUnit]),
      annualYieldPercent: esetiBaseInputs.annualYieldPercent,
      frequency: esetiFrequency,
      yearlyPaymentsPlan: esetiPlan.yearlyPaymentsPlan,
      yearlyWithdrawalsPlan: esetiPlan.yearlyWithdrawalsPlan,
      taxCreditLimitByYear: esetiTaxCreditLimitsByYear,
      annualIndexPercent: esetiBaseInputs.annualIndexPercent,
      initialCostByYear: {},
      initialCostDefaultPercent: 0,
      yearlyManagementFeePercent: 0,
      yearlyFixedManagementFeeAmount: 0,
      managementFeeValue: 0,
      assetBasedFeePercent: isAllianzProductForEseti ? 1.19 : 0,
      assetCostPercentByYear: isAllianzProductForEseti ? allianzEsetiAssetOverrides : {},
      accountMaintenancePercentByYear: selectedProduct === "alfa_exclusive_plus" ? accountMaintenancePercentByYear : {},
      plusCostByYear: {},
      bonusMode: "none",
      bonusOnContributionPercent: 0,
      bonusFromYear: 1,
      bonusPercent: 0,
      bonusStartYear: 1,
      bonusStopYear: 0,
      bonusPercentByYear: {},
      bonusOnContributionPercentByYear: {},
      refundInitialCostBonusPercentByYear: {},
      adminFeeMonthlyAmount: 0,
      adminFeePercentOfPayment:
        selectedProduct === "alfa_fortis"
          ? 2
          : selectedProduct === "alfa_jade"
            ? (jadeConfig?.extraordinaryAdminFeePercent ?? 2)
            : selectedProduct === "alfa_jovokep"
              ? JOVOKEP_EXTRAORDINARY_ADMIN_FEE_PERCENT
              : selectedProduct === "alfa_jovotervezo"
                ? JOVOTERVEZO_EXTRAORDINARY_ADMIN_FEE_PERCENT
                : selectedProduct === "alfa_premium_selection"
                  ? PREMIUM_SELECTION_EXTRAORDINARY_ADMIN_FEE_PERCENT
                  : selectedProduct === "alfa_zen_pro"
                    ? ZEN_PRO_EXTRAORDINARY_ADMIN_FEE_PERCENT
                : selectedProduct === "generali_kabala"
                  ? GENERALI_KABALA_U91_EXTRA_DISTRIBUTION_FEE_PERCENT
                  : 0,
      adminFeePercentByYear: {},
      accountMaintenanceMonthlyPercent:
        selectedProduct === "alfa_fortis"
          ? (fortisConfig?.accountMaintenanceMonthlyPercent ?? dailyInputs.accountMaintenanceMonthlyPercent ?? 0)
          : selectedProduct === "alfa_jade"
            ? (jadeConfig?.accountMaintenanceMonthlyPercent ?? dailyInputs.accountMaintenanceMonthlyPercent ?? 0)
            : selectedProduct === "alfa_jovokep"
              ? 0.165
              : selectedProduct === "alfa_jovotervezo"
                ? JOVOTERVEZO_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT
                : selectedProduct === "alfa_relax_plusz"
                  ? 0.145
                : selectedProduct === "alfa_zen_pro"
                  ? ZEN_PRO_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT
                : selectedProduct === "generali_kabala"
                  ? resolveGeneraliKabalaU91AccountMaintenanceMonthlyPercent(selectedFundId)
                : selectedProduct === "alfa_premium_selection"
                ? resolvePremiumSelectionAccountMaintenanceMonthlyPercent(
                    selectedFundId,
                    premiumSelectionVariantConfig,
                  )
                  : selectedProduct === "alfa_exclusive_plus"
                    ? 0.145
                    : 0,
      accountMaintenanceStartMonth:
        selectedProduct === "alfa_fortis"
          ? (fortisConfig?.accountMaintenanceStartMonthExtra ?? 1)
          : selectedProduct === "alfa_jade"
            ? (jadeConfig?.accountMaintenanceExtraStartMonth ?? 1)
            : 1,
      riskInsuranceEnabled: false,
      riskInsuranceMonthlyFeeAmount: 0,
      riskInsuranceFeePercentOfMonthlyPayment: 0,
      riskInsuranceAnnualIndexPercent: 0,
      selectedFundId,
      allowWithdrawals: true,
      allowPartialSurrender: true,
      redemptionEnabled: selectedProduct === "alfa_premium_selection" ? false : dailyInputs.redemptionEnabled,
      redemptionFeeByYear: selectedProduct === "alfa_premium_selection" ? {} : dailyInputs.redemptionFeeByYear,
      redemptionFeeDefaultPercent:
        selectedProduct === "alfa_premium_selection" ? 0 : (dailyInputs.redemptionFeeDefaultPercent ?? 0),
      extraordinaryAccountSubtype: "immediateAccess",
      enableTaxCredit: isPremiumSelectionNy06 ? false : dailyInputs.enableTaxCredit,
      taxCreditRatePercent: isPremiumSelectionNy06 ? 0 : dailyInputs.taxCreditRatePercent,
      taxCreditCapPerYear: isPremiumSelectionNy06 ? 0 : dailyInputs.taxCreditCapPerYear,
      taxCreditAmountByYear: isPremiumSelectionNy06 ? {} : dailyInputs.taxCreditAmountByYear,
      taxCreditYieldPercent: isPremiumSelectionNy06 ? 0 : dailyInputs.taxCreditYieldPercent,
    }
  }, [
    dailyInputs,
    customEntryDefinitionsEseti,
    esetiDurationUnit,
    esetiDurationValue,
    esetiDurationMaxByUnit,
    esetiBaseInputs,
    esetiPlan,
    esetiFrequency,
    esetiTaxCreditLimitsByYear,
    accountMaintenancePercentByYear,
    assetCostPercentByYear,
    selectedProduct,
    engineProductVariant,
    inputs.currency,
    selectedFundId,
    premiumSelectionVariantConfig,
    isPremiumSelectionNy06,
  ])
  const dailyInputsEsetiTaxEligible = useMemo<InputsDaily>(
    () => ({
      ...dailyInputsEseti,
      yearlyPaymentsPlan: esetiPlanTaxEligible.yearlyPaymentsPlan,
      yearlyWithdrawalsPlan: esetiPlanTaxEligible.yearlyWithdrawalsPlan,
      taxCreditLimitByYear: esetiTaxCreditLimitsByYear,
      allowWithdrawals: false,
      allowPartialSurrender: false,
      extraordinaryAccountSubtype: "taxEligible",
      enableTaxCredit: true,
      taxCreditRatePercent: inputs.taxCreditRatePercent ?? 20,
      taxCreditCapPerYear: inputs.taxCreditCapPerYear ?? 130_000,
      taxCreditYieldPercent: inputs.taxCreditYieldPercent ?? 1,
    }),
    [dailyInputsEseti, esetiPlanTaxEligible, esetiTaxCreditLimitsByYear, inputs.taxCreditRatePercent, inputs.taxCreditCapPerYear, inputs.taxCreditYieldPercent],
  )
  const resultsEseti = useMemo(() => calculate(productId, dailyInputsEseti), [productId, dailyInputsEseti])
  const resultsEsetiTaxEligible = useMemo(
    () => calculate(productId, dailyInputsEsetiTaxEligible),
    [productId, dailyInputsEsetiTaxEligible],
  )
  const dailyInputsWithoutTaxCredit = useMemo(
    () => ({
      ...dailyInputs,
      enableTaxCredit: false,
      taxCreditRatePercent: 0,
      taxCreditCapPerYear: 0,
      taxCreditStartYear: 1,
      taxCreditEndYear: 0,
      taxCreditLimitByYear: {},
      taxCreditAmountByYear: {},
      taxCreditYieldPercent: 0,
    }),
    [dailyInputs],
  )
  const resultsWithoutTaxCredit = useMemo(
    () => calculate(productId, dailyInputsWithoutTaxCredit),
    [productId, dailyInputsWithoutTaxCredit],
  )
  const totalRiskInsuranceCost = results.totalRiskInsuranceCost ?? 0

  // TODO: Replace with real net calculation logic
  // Static placeholder net values - NO calculations, just placeholder data for UI display
  const cumulativeByYear = useMemo(
    () => buildCumulativeByYear(results?.yearlyBreakdown ?? []),
    [results?.yearlyBreakdown],
  )
  const cumulativeByYearEseti = useMemo(
    () => buildCumulativeByYear(resultsEseti?.yearlyBreakdown ?? []),
    [resultsEseti?.yearlyBreakdown],
  )
  const cumulativeByYearEsetiTaxEligible = useMemo(
    () => buildCumulativeByYear(resultsEsetiTaxEligible?.yearlyBreakdown ?? []),
    [resultsEsetiTaxEligible?.yearlyBreakdown],
  )
  const summaryYearlyBreakdown = useMemo(() => {
    const mainRows = results?.yearlyBreakdown ?? []
    const esetiRows = resultsEseti?.yearlyBreakdown ?? []
    const esetiTaxEligibleRows = isPremiumSelectionNy06 ? (resultsEsetiTaxEligible?.yearlyBreakdown ?? []) : []
    const maxLength = Math.max(mainRows.length, esetiRows.length, esetiTaxEligibleRows.length)
    const merged: any[] = []

    for (let index = 0; index < maxLength; index++) {
      const mainAndImmediate = mergeYearRows(mainRows[index], esetiRows[index])
      merged.push(mergeYearRows(mainAndImmediate, esetiTaxEligibleRows[index]))
    }

    return merged
  }, [results?.yearlyBreakdown, resultsEseti?.yearlyBreakdown, resultsEsetiTaxEligible?.yearlyBreakdown, isPremiumSelectionNy06])
  const cumulativeByYearSummary = useMemo(
    () => buildCumulativeByYear(summaryYearlyBreakdown),
    [summaryYearlyBreakdown],
  )
  const netCalculationsMain = useMemo(() => {
    return calculateNetValuesMain(results.yearlyBreakdown, isCorporateBond)
  }, [results.yearlyBreakdown, isCorporateBond])
  const netCalculationsEseti = useMemo(() => {
    return calculateNetValuesEseti(resultsEseti.yearlyBreakdown, isCorporateBond)
  }, [resultsEseti.yearlyBreakdown, isCorporateBond])
  const netCalculationsEsetiTaxEligible = useMemo(() => {
    return calculateNetValuesEseti(resultsEsetiTaxEligible.yearlyBreakdown, isCorporateBond)
  }, [resultsEsetiTaxEligible.yearlyBreakdown, isCorporateBond])
  const netCalculationsSummary = useMemo(() => {
    const mainAndImmediate = combineNetRows(netCalculationsMain, netCalculationsEseti)
    return isPremiumSelectionNy06 ? combineNetRows(mainAndImmediate, netCalculationsEsetiTaxEligible) : mainAndImmediate
  }, [netCalculationsMain, netCalculationsEseti, netCalculationsEsetiTaxEligible, isPremiumSelectionNy06])
  const yearlyNetCalculations = useMemo(() => {
    if (yearlyAccountView === "eseti_tax_eligible") return netCalculationsEsetiTaxEligible
    if (yearlyAccountView === "eseti" || yearlyAccountView === "eseti_immediate_access") return netCalculationsEseti
    if (yearlyAccountView === "summary") return netCalculationsSummary
    return netCalculationsMain
  }, [yearlyAccountView, netCalculationsEseti, netCalculationsEsetiTaxEligible, netCalculationsSummary, netCalculationsMain])

  const finalNetData = useMemo(() => {
    if (yearlyNetCalculations.length === 0) return null
    return yearlyNetCalculations[yearlyNetCalculations.length - 1]
  }, [yearlyNetCalculations])

  const formatValue = (value: number, displayCurr: Currency) => {
    // When displaying in USD, use usdToHufRate; when displaying in EUR, use eurToHufRate
    const rate = displayCurr === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate
    const converted = convertForDisplay(value, results.currency, displayCurr, rate)
    return formatMoney(converted, displayCurr)
  }

  const formatCurrency = (value: number) => {
    const rate = displayCurrency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate
    const converted = convertForDisplay(value, results.currency, displayCurrency, rate)
    return formatMoney(converted, displayCurrency)
  }

  const realValueRowsForActiveView = useMemo(() => {
    if (yearlyAccountView === "summary") return summaryYearlyBreakdown
    if (yearlyAccountView === "eseti_tax_eligible") return resultsEsetiTaxEligible.yearlyBreakdown
    return yearlyAccountView === "eseti" || yearlyAccountView === "eseti_immediate_access"
      ? resultsEseti.yearlyBreakdown
      : results.yearlyBreakdown
  }, [yearlyAccountView, summaryYearlyBreakdown, resultsEseti.yearlyBreakdown, resultsEsetiTaxEligible.yearlyBreakdown, results.yearlyBreakdown])
  const realValueElapsedDaysByIndex = useMemo(() => {
    const rows = realValueRowsForActiveView ?? []
    const elapsed: number[] = []
    let runningDays = 0
    for (const row of rows) {
      if (!row) {
        elapsed.push(runningDays)
        continue
      }
      const explicitDays = Number(row.periodDays)
      const fallbackDays = row.periodType === "partial" ? Math.max(1, Math.round(((row.periodMonths ?? 0) * 365) / 12)) : 365
      const periodDays = Number.isFinite(explicitDays) && explicitDays > 0 ? explicitDays : fallbackDays
      runningDays += periodDays
      elapsed.push(runningDays)
    }
    return elapsed
  }, [realValueRowsForActiveView])
  const realValueTotalDurationDays = useMemo(() => {
    if (realValueElapsedDaysByIndex.length > 0) return realValueElapsedDaysByIndex[realValueElapsedDaysByIndex.length - 1] ?? 0
    const yearsFallback = Math.max(0, totalYearsForPlan)
    return Math.round(yearsFallback * 365)
  }, [realValueElapsedDaysByIndex, totalYearsForPlan])
  const realValueStartDate = useMemo(() => {
    if (inputs.calculationMode === "calendar" && parsedDurationFrom) {
      return new Date(
        parsedDurationFrom.getFullYear(),
        parsedDurationFrom.getMonth(),
        parsedDurationFrom.getDate(),
        12,
        0,
        0,
        0,
      )
    }
    const referenceYear = parsedDurationFrom ? parsedDurationFrom.getFullYear() : new Date().getFullYear()
    return new Date(referenceYear, 0, 1, 12, 0, 0, 0)
  }, [inputs.calculationMode, parsedDurationFrom])
  const realValueHasFuturePart = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0)
    if (parsedDurationTo) return parsedDurationTo.getTime() > today.getTime()

    const totalDays = Math.max(0, Math.round(realValueTotalDurationDays))
    if (totalDays <= 0) return false
    const endInclusive = new Date(realValueStartDate)
    endInclusive.setDate(endInclusive.getDate() + totalDays - 1)
    return endInclusive.getTime() > today.getTime()
  }, [parsedDurationTo, realValueTotalDurationDays, realValueStartDate])
  const realValueMonthlyInflationMeta = useMemo(() => {
    const map = new Map<string, number>()
    const ordered: Array<{ monthIndex: number; inflationPercent: number }> = []
    for (const point of inflationKshMonthlySeries) {
      const year = Number(point.year)
      const month = Number(point.month)
      const inflationPercent = Number(point.inflationPercent)
      if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(inflationPercent)) continue
      if (month < 1 || month > 12) continue
      const monthIndex = year * 12 + (month - 1)
      map.set(`${year}-${String(month).padStart(2, "0")}`, inflationPercent)
      ordered.push({ monthIndex, inflationPercent })
    }
    ordered.sort((a, b) => a.monthIndex - b.monthIndex)
    const lastMonthIndex = ordered.length > 0 ? ordered[ordered.length - 1].monthIndex : null
    const lastMonthYear = lastMonthIndex !== null ? Math.floor(lastMonthIndex / 12) : null
    const lastMonthNumber = lastMonthIndex !== null ? (lastMonthIndex % 12) + 1 : null
    const r0Window = ordered.slice(Math.max(0, ordered.length - 12))
    const r0FromKsh = r0Window.length > 0
      ? r0Window.reduce((sum, point) => sum + point.inflationPercent, 0) / r0Window.length
      : null
    return { map, lastMonthIndex, r0FromKsh, lastMonthYear, lastMonthNumber }
  }, [inflationKshMonthlySeries])
  const realValueInflationMultiplierByElapsedDays = useMemo(() => {
    const maxDays = Math.max(0, Math.round(realValueTotalDurationDays))
    const cumulative = new Array(maxDays + 1).fill(1) as number[]
    const annualDailyFactor = Math.pow(1 + inflationRate / 100, 1 / 365)
    if (!enableRealValue) return cumulative

    const r0 = Number.isFinite(realValueMonthlyInflationMeta.r0FromKsh)
      ? (realValueMonthlyInflationMeta.r0FromKsh as number)
      : inflationRate
    const target = Math.min(12, Math.max(0, futureInflationTargetRate))
    const tauMonths = Math.max(1, Math.round(futureInflationConvergenceMonths))
    const clampRate = (value: number) => Math.min(12, Math.max(0, value))
    const startMonthIndex = realValueStartDate.getFullYear() * 12 + realValueStartDate.getMonth()
    const now = new Date()
    const todayMonthIndex = now.getFullYear() * 12 + now.getMonth()

    let cursor = new Date(realValueStartDate)
    for (let elapsed = 1; elapsed <= maxDays; elapsed++) {
      const currentMonthIndex = cursor.getFullYear() * 12 + cursor.getMonth()
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`
      let monthAnnualRatePercent = inflationRate

      if (inflationAutoEnabled) {
        const monthlyInflation = realValueMonthlyInflationMeta.map.get(key)
        if (Number.isFinite(monthlyInflation)) {
          monthAnnualRatePercent = monthlyInflation as number
        } else {
          const forecastStartMonthIndex =
            realValueMonthlyInflationMeta.lastMonthIndex !== null
              ? realValueMonthlyInflationMeta.lastMonthIndex
              : Math.max(startMonthIndex, todayMonthIndex)
          const isFutureMonth = !realValueHasFuturePart
            ? false
            : realValueMonthlyInflationMeta.lastMonthIndex !== null
              ? currentMonthIndex > realValueMonthlyInflationMeta.lastMonthIndex
              : currentMonthIndex >= forecastStartMonthIndex

          if (!isFutureMonth) {
            monthAnnualRatePercent = inflationRate
          } else if (futureInflationMode === "converging") {
            const mAhead = Math.max(0, currentMonthIndex - forecastStartMonthIndex)
            const decay = Math.exp(-mAhead / tauMonths)
            monthAnnualRatePercent = target + (r0 - target) * decay
          } else {
            monthAnnualRatePercent = inflationRate
          }
        }
      }

      const monthAnnualRate = clampRate(monthAnnualRatePercent) / 100
      const dailyFactor = Math.pow(1 + monthAnnualRate, 1 / 365)
      const safeDailyFactor = Number.isFinite(dailyFactor) && dailyFactor > 0 ? dailyFactor : annualDailyFactor
      cumulative[elapsed] = cumulative[elapsed - 1] * safeDailyFactor
      cursor.setDate(cursor.getDate() + 1)
    }
    return cumulative
  }, [
    realValueTotalDurationDays,
    inflationRate,
    enableRealValue,
    inflationAutoEnabled,
    realValueMonthlyInflationMeta,
    realValueStartDate,
    realValueHasFuturePart,
    futureInflationMode,
    futureInflationTargetRate,
    futureInflationConvergenceMonths,
  ])
  const getRealValueForDays = (value: number, elapsedDays: number) => {
    if (!enableRealValue) return value
    const safeDays = Math.max(0, Math.round(elapsedDays))
    const multiplier = realValueInflationMultiplierByElapsedDays[safeDays]
    if (!Number.isFinite(multiplier) || multiplier <= 0) return value
    return value / multiplier
  }
  const getRealValue = (value: number) => getRealValueForDays(value, realValueTotalDurationDays)
  const r0FromKsh = Number.isFinite(realValueMonthlyInflationMeta.r0FromKsh)
    ? (realValueMonthlyInflationMeta.r0FromKsh as number)
    : null
  const lastKshMonthLabel =
    realValueMonthlyInflationMeta.lastMonthYear && realValueMonthlyInflationMeta.lastMonthNumber
      ? `${realValueMonthlyInflationMeta.lastMonthYear}.${String(realValueMonthlyInflationMeta.lastMonthNumber).padStart(2, "0")}`
      : null

  const shouldApplyTaxCreditPenalty = taxCreditNotUntilRetirement && inputs.enableTaxCredit
  const taxCreditPenaltyAmount = shouldApplyTaxCreditPenalty ? results.totalTaxCredit * 1.2 : 0
  const endBalanceWithTaxCreditPenalty = Math.max(0, results.endBalance - taxCreditPenaltyAmount)
  const endBalanceWithoutTaxCredit = resultsWithoutTaxCredit.endBalance
  const summaryTotalsByAccount = useMemo(
    () => {
      const mainTotals = {
        totalContributions: results.totalContributions,
        totalCosts: results.totalCosts,
        totalBonus: results.totalBonus,
        totalTaxCredit: results.totalTaxCredit,
        totalInterestNet: results.totalInterestNet,
        endBalance: results.endBalance,
        surrenderValue: results.yearlyBreakdown[results.yearlyBreakdown.length - 1]?.surrenderValue ?? results.endBalance,
        totalRiskInsuranceCost: results.totalRiskInsuranceCost ?? 0,
      }
      const esetiImmediateTotals = {
        totalContributions: resultsEseti.totalContributions,
        totalCosts: resultsEseti.totalCosts,
        totalBonus: resultsEseti.totalBonus,
        totalTaxCredit: resultsEseti.totalTaxCredit,
        totalInterestNet: resultsEseti.totalInterestNet,
        endBalance: resultsEseti.endBalance,
        surrenderValue:
          resultsEseti.yearlyBreakdown[resultsEseti.yearlyBreakdown.length - 1]?.surrenderValue ?? resultsEseti.endBalance,
        totalRiskInsuranceCost: resultsEseti.totalRiskInsuranceCost ?? 0,
      }
      const esetiTaxEligibleTotals = {
        totalContributions: resultsEsetiTaxEligible.totalContributions,
        totalCosts: resultsEsetiTaxEligible.totalCosts,
        totalBonus: resultsEsetiTaxEligible.totalBonus,
        totalTaxCredit: resultsEsetiTaxEligible.totalTaxCredit,
        totalInterestNet: resultsEsetiTaxEligible.totalInterestNet,
        endBalance: resultsEsetiTaxEligible.endBalance,
        surrenderValue:
          resultsEsetiTaxEligible.yearlyBreakdown[resultsEsetiTaxEligible.yearlyBreakdown.length - 1]?.surrenderValue ??
          resultsEsetiTaxEligible.endBalance,
        totalRiskInsuranceCost: resultsEsetiTaxEligible.totalRiskInsuranceCost ?? 0,
      }
      const summaryTotals = {
        totalContributions:
          results.totalContributions +
          resultsEseti.totalContributions +
          (isPremiumSelectionNy06 ? resultsEsetiTaxEligible.totalContributions : 0),
        totalCosts:
          results.totalCosts + resultsEseti.totalCosts + (isPremiumSelectionNy06 ? resultsEsetiTaxEligible.totalCosts : 0),
        totalBonus:
          results.totalBonus + resultsEseti.totalBonus + (isPremiumSelectionNy06 ? resultsEsetiTaxEligible.totalBonus : 0),
        totalTaxCredit:
          results.totalTaxCredit +
          resultsEseti.totalTaxCredit +
          (isPremiumSelectionNy06 ? resultsEsetiTaxEligible.totalTaxCredit : 0),
        totalInterestNet:
          results.totalInterestNet +
          resultsEseti.totalInterestNet +
          (isPremiumSelectionNy06 ? resultsEsetiTaxEligible.totalInterestNet : 0),
        endBalance:
          results.endBalance + resultsEseti.endBalance + (isPremiumSelectionNy06 ? resultsEsetiTaxEligible.endBalance : 0),
        surrenderValue:
          (results.yearlyBreakdown[results.yearlyBreakdown.length - 1]?.surrenderValue ?? results.endBalance) +
          (resultsEseti.yearlyBreakdown[resultsEseti.yearlyBreakdown.length - 1]?.surrenderValue ?? resultsEseti.endBalance) +
          (isPremiumSelectionNy06
            ? (resultsEsetiTaxEligible.yearlyBreakdown[resultsEsetiTaxEligible.yearlyBreakdown.length - 1]?.surrenderValue ??
              resultsEsetiTaxEligible.endBalance)
            : 0),
        totalRiskInsuranceCost:
          (results.totalRiskInsuranceCost ?? 0) +
          (resultsEseti.totalRiskInsuranceCost ?? 0) +
          (isPremiumSelectionNy06 ? (resultsEsetiTaxEligible.totalRiskInsuranceCost ?? 0) : 0),
      }
      return {
        summary: summaryTotals,
        main: mainTotals,
        eseti: esetiImmediateTotals,
        eseti_tax_eligible: esetiTaxEligibleTotals,
      }
    },
    [results, resultsEseti, resultsEsetiTaxEligible, isPremiumSelectionNy06],
  )
  const summaryAccountLabels: Record<"summary" | "main" | "eseti", string> = {
    summary: "Összesített",
    main: "Fő",
    eseti: "Eseti",
  }
  const summaryThemeByAccount: Record<"summary" | "main" | "eseti", { card: string; metric: string; final: string }> = {
    summary: {
      card: "border-sky-300 bg-sky-50/70 dark:border-sky-700 dark:bg-sky-950/25",
      metric: "bg-sky-50/65 dark:bg-sky-900/20",
      final: "bg-sky-700 text-sky-50 dark:bg-sky-800",
    },
    main: {
      card: "border-blue-300 bg-blue-50/65 dark:border-blue-700 dark:bg-blue-950/25",
      metric: "bg-blue-50/60 dark:bg-blue-900/20",
      final: "bg-primary text-primary-foreground",
    },
    eseti: {
      card: "border-orange-300 bg-orange-50/70 dark:border-orange-700 dark:bg-orange-950/25",
      metric: "bg-orange-50/60 dark:bg-orange-900/20",
      final: "bg-orange-700 text-orange-50 dark:bg-orange-800",
    },
  }
  const summaryAccountsOrder: Array<"summary" | "main" | "eseti"> = ["summary", "main", "eseti"]
  const summaryAccountViewKey: "summary" | "main" | "eseti" =
    yearlyAccountView === "main" ? "main" : yearlyAccountView === "summary" ? "summary" : "eseti"
  const activeSummaryTotals =
    isPremiumSelectionNy06 && yearlyAccountView === "eseti_tax_eligible"
      ? summaryTotalsByAccount.eseti_tax_eligible
      : summaryTotalsByAccount[summaryAccountViewKey]
  const activeSummaryTheme = summaryThemeByAccount[summaryAccountViewKey]
  const isAlfaExclusivePlus = selectedProduct === "alfa_exclusive_plus"
  const showSurrenderFinalBand =
    isRedemptionOpen &&
    !(isAlfaExclusivePlus && summaryAccountViewKey === "eseti") &&
    !(selectedProduct === "alfa_premium_selection" && summaryAccountViewKey === "eseti")
  const showBonusColumns = !isAlfaExclusivePlus && selectedProduct !== "allianz_eletprogram"
  const activeTaxCreditPenaltyAmount = shouldApplyTaxCreditPenalty ? activeSummaryTotals.totalTaxCredit * 1.2 : 0
  const summaryBaseBalance = enableNetting && finalNetData ? finalNetData.netBalance : activeSummaryTotals.endBalance
  const summaryBaseSurrenderValue = activeSummaryTotals.surrenderValue
  const summaryBalanceWithPenalty = Math.max(0, summaryBaseBalance - activeTaxCreditPenaltyAmount)
  const summarySurrenderWithPenalty = Math.max(0, summaryBaseSurrenderValue - activeTaxCreditPenaltyAmount)

  const handleDisplayCurrencyChange = (value: Currency) => {
    setDisplayCurrency(value)
    setIsDisplayCurrencyUserOverridden(true)
  }

  const convertBetweenCurrencies = (amount: number, from: Currency, to: Currency) => {
    if (from === to) return amount
    const eurRate = inputs.eurToHufRate || 400
    const usdRate = inputs.usdToHufRate || 380

    if (from === "HUF" && to === "EUR") return amount / eurRate
    if (from === "EUR" && to === "HUF") return amount * eurRate
    if (from === "HUF" && to === "USD") return amount / usdRate
    if (from === "USD" && to === "HUF") return amount * usdRate
    if (from === "EUR" && to === "USD") return (amount * eurRate) / usdRate
    if (from === "USD" && to === "EUR") return (amount * usdRate) / eurRate

    return amount
  }

  const handleCurrencyChange = (value: Currency) => {
    const previousCurrency = inputs.currency
    const convertedRegularPayment = convertBetweenCurrencies(inputs.regularPayment, previousCurrency, value)
    const convertedPaymentByYear = Object.fromEntries(
      Object.entries(paymentByYear).map(([year, amount]) => [
        year,
        convertBetweenCurrencies(amount as number, previousCurrency, value),
      ]),
    )
    setInputs({
      ...inputs,
      currency: value,
      regularPayment: convertedRegularPayment,
      enableTaxCredit: inputs.enableTaxCredit,
      taxCreditRatePercent: inputs.taxCreditRatePercent,
      taxCreditCapPerYear: inputs.taxCreditCapPerYear,
      taxCreditYieldPercent: inputs.taxCreditYieldPercent,
    })
    setPaymentByYear(convertedPaymentByYear)
    setDisplayCurrency(value)
    setIsDisplayCurrencyUserOverridden(false)
    setEurRateManuallyChanged(false) // Reset manual change flag when currency changes
    // Reset FX rate if currency changes and it wasn't manually set
    if (!eurRateManuallyChanged) {
      loadFxRate(value as "EUR" | "USD") // Reload FX rate for the new currency
    }
  }

  const processChartImageFile = async (file: File) => {
    if (!SUPPORTED_CHART_IMAGE_TYPES.includes(file.type)) {
      setChartParseStatus("error")
      setChartParseMessage("Csak PNG, JPG vagy WebP képet tudunk feldolgozni.")
      return
    }
    if (file.size > MAX_CHART_IMAGE_SIZE_MB * 1024 * 1024) {
      setChartParseStatus("error")
      setChartParseMessage(`A kép túl nagy. Maximum ${MAX_CHART_IMAGE_SIZE_MB} MB engedélyezett.`)
      return
    }

    setChartParseStatus("processing")
    setChartParseMessage("Kép feldolgozása folyamatban...")

    try {
      const fallbackStartDate = parsedDurationFrom
        ? `${parsedDurationFrom.getFullYear()}-${String(parsedDurationFrom.getMonth() + 1).padStart(2, "0")}-${String(
            parsedDurationFrom.getDate(),
          ).padStart(2, "0")}`
        : undefined
      const fallbackEndDate = parsedDurationTo
        ? `${parsedDurationTo.getFullYear()}-${String(parsedDurationTo.getMonth() + 1).padStart(2, "0")}-${String(
            parsedDurationTo.getDate(),
          ).padStart(2, "0")}`
        : undefined

      const parsedSeries = await parseChartImageToSeries(file, { fallbackStartDate, fallbackEndDate })
      setParsedChartSeries(parsedSeries)
      setDurationSource("dates")
      setDurationFromInput(formatIsoDateDot(parsedSeries.startDate))
      setDurationToInput(formatIsoDateDot(parsedSeries.endDate))
      setInputs((prev) => ({
        ...prev,
        annualYieldPercent: Number(parsedSeries.derivedAnnualYieldPercent.toFixed(2)),
        calculationMode: "calendar",
        startDate: parsedSeries.startDate,
      }))
      setYieldSourceMode("ocr")

      if (parsedSeries.confidence >= MIN_CHART_SERIES_CONFIDENCE) {
        setChartParseStatus("success")
        setChartParseMessage(
          `Sikeres feldolgozás. Napi pontok: ${parsedSeries.points.length}, biztonság: ${Math.round(
            parsedSeries.confidence * 100,
          )}%.`,
        )
      } else {
        setChartParseStatus("success")
        setChartParseMessage(
          `Alacsony biztonság (${Math.round(
            parsedSeries.confidence * 100,
          )}%). Képből számolt évesített hozam fallback kerül alkalmazásra.`,
        )
      }
    } catch (error) {
      setChartParseStatus("error")
      setChartParseMessage(
        error instanceof Error ? error.message : "A képfeldolgozás nem sikerült. Próbálj meg egy másik képet.",
      )
    }
  }

  const handleChartFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await processChartImageFile(file)
    event.target.value = ""
  }

  const clearParsedChartSeries = () => {
    setParsedChartSeries(null)
    setChartParseStatus("idle")
    setChartParseMessage("")
    if (yieldSourceMode === "ocr") {
      setYieldSourceMode("manual")
      setInputs((prev) =>
        prev.annualYieldPercent === manualYieldPercent
          ? prev
          : { ...prev, annualYieldPercent: manualYieldPercent },
      )
    }
  }

  const handlePaymentChange = (year: number, value: number) => {
    // TODO: Replace with real chaining calculation when implementing business logic
    // For UI-only: always use base payment as chained value (no calculation)
    const chainedValue = yearlyBasePaymentYear1

    if (Math.abs(value - chainedValue) < 0.01) {
      const newMap = { ...paymentByYear }
      delete newMap[year]
      setPaymentByYear(newMap)
    } else {
      setPaymentByYear({ ...paymentByYear, [year]: value })
    }
  }

  const updateIndex = (year: number, value: number) => {
    setIndexByYear((prev) => {
      const updated = { ...prev }
      for (let y = year; y <= totalYearsForPlan; y++) {
        if (value === inputs.annualIndexPercent) {
          delete updated[y]
        } else {
          updated[y] = value
        }
      }
      return updated
    })
  }

  const updatePayment = (year: number, displayValue: number) => {
    const rate = inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate
    const calcValue = convertFromDisplayToCalc(displayValue, results.currency, displayCurrency, rate)
    handlePaymentChange(year, calcValue)
  }

  const updateWithdrawal = (year: number, displayValue: number) => {
    const rate = inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate
    const calcValue = convertFromDisplayToCalc(displayValue, results.currency, displayCurrency, rate)

    if (calcValue === 0) {
      const newMap = { ...withdrawalByYear }
      delete newMap[year]
      setWithdrawalByYear(newMap)
    } else {
      setWithdrawalByYear({ ...withdrawalByYear, [year]: calcValue })
    }
  }

  const updateEsetiIndex = (year: number, value: number) => {
    const setTarget = yearlyAccountView === "eseti_tax_eligible" ? setEsetiIndexByYearTaxEligible : setEsetiIndexByYear
    setTarget((prev) => {
      const updated = { ...prev }
      for (let y = year; y <= totalYearsForPlan; y++) {
        if (value === 0) {
          delete updated[y]
        } else {
          updated[y] = value
        }
      }
      return updated
    })
  }

  const updateEsetiPayment = (year: number, displayValue: number) => {
    const rate = inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate
    const calcValue = convertFromDisplayToCalc(displayValue, results.currency, displayCurrency, rate)
    const setTarget = yearlyAccountView === "eseti_tax_eligible" ? setEsetiPaymentByYearTaxEligible : setEsetiPaymentByYear
    setTarget((prev) => {
      const updated = { ...prev }
      for (let y = year; y <= esetiTotalYearsForPlan; y++) {
        updated[y] = calcValue
      }
      return updated
    })
  }

  const updateEsetiWithdrawal = (year: number, displayValue: number) => {
    const rate = inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate
    const calcValue = convertFromDisplayToCalc(displayValue, results.currency, displayCurrency, rate)
    if (yearlyAccountView === "eseti_tax_eligible") {
      // Tax-eligible extraordinary account does not allow withdrawals.
      return
    }
    if (calcValue === 0) {
      const newMap = { ...esetiWithdrawalByYear }
      delete newMap[year]
      setEsetiWithdrawalByYear(newMap)
    } else {
      setEsetiWithdrawalByYear({ ...esetiWithdrawalByYear, [year]: calcValue })
    }
  }

  const clearAllModifications = () => {
    if (isEsetiView) {
      if (yearlyAccountView === "eseti_tax_eligible") {
        setEsetiIndexByYearTaxEligible({})
        setEsetiPaymentByYearTaxEligible({})
        setEsetiWithdrawalByYearTaxEligible({})
      } else {
        setEsetiIndexByYear({})
        setEsetiPaymentByYear({})
        setEsetiWithdrawalByYear({})
      }
      if (selectedProduct === "allianz_eletprogram" || selectedProduct === "allianz_bonusz_eletprogram") {
        // Eseti Allianz default asset fee is 1.19%; clearing should restore it.
        setAssetCostPercentByYear({})
      }
      return
    }

    setIndexByYear({})
    setPaymentByYear({})
    setWithdrawalByYear({})
    setTaxCreditLimitByYear({})
    setTaxCreditAmountByYear({})
    // Also clear custom initial costs
    setInputs((prev) => ({
      ...prev,
      initialCostByYear: { ...productPresetBaseline.initialCostByYear },
      initialCostDefaultPercent: productPresetBaseline.initialCostDefaultPercent,
      assetBasedFeePercent: productPresetBaseline.assetBasedFeePercent,
      accountMaintenanceMonthlyPercent: productPresetBaseline.accountMaintenanceMonthlyPercent,
      adminFeePercentOfPayment: productPresetBaseline.adminFeePercentOfPayment,
    }))
    // Clear new per-year configurations
    setInvestedShareByYear({})
    setInputs((prev) => ({
      ...prev,
      investedShareDefaultPercent: 100,
    }))
    // Clear redemption fee modifications
    setRedemptionFeeByYear({})
    setRedemptionFeeDefaultPercent(0)
    setRedemptionBaseMode("surplus-only")
    // Clear asset cost overrides
    setAssetCostPercentByYear({ ...productPresetBaseline.assetCostPercentByYear })
    setAccountMaintenancePercentByYear({ ...productPresetBaseline.accountMaintenancePercentByYear })
    setAdminFeePercentByYear({ ...productPresetBaseline.adminFeePercentByYear })
    setBonusOnContributionPercentByYear({ ...productPresetBaseline.bonusOnContributionPercentByYear })
    setRefundInitialCostBonusPercentByYear({ ...productPresetBaseline.refundInitialCostBonusPercentByYear })
    setPlusCostByYear({})
    // </CHANGE>
    // Clear bonus percent overrides
    setBonusPercentByYear({ ...productPresetBaseline.bonusPercentByYear })
    // </CHANGE>
    setAppliedPresetLabel(null) // Also clear applied preset
  }

  const updateTaxCreditLimit = (year: number, valueInDisplayCurrency: number) => {
    const rate = inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate
    const valueInCalc = convertFromDisplayToCalc(valueInDisplayCurrency, results.currency, displayCurrency, rate)

    if (valueInCalc <= 0 || !valueInDisplayCurrency) {
      setTaxCreditLimitByYear((prev) => {
        const updated = { ...prev }
        delete updated[year]
        return updated
      })
    } else {
      setTaxCreditLimitByYear((prev) => ({ ...prev, [year]: valueInCalc }))
    }
  }

  const updateTaxCreditAmount = (year: number, valueInDisplayCurrency: number, maxInCalcCurrency?: number) => {
    const rate = inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate
    const valueInCalc = convertFromDisplayToCalc(valueInDisplayCurrency, results.currency, displayCurrency, rate)

    if (Number.isNaN(valueInCalc)) {
      setTaxCreditAmountByYear((prev) => {
        const updated = { ...prev }
        delete updated[year]
        return updated
      })
      return
    }

    const safeMax = maxInCalcCurrency !== undefined ? Math.max(0, maxInCalcCurrency) : Number.POSITIVE_INFINITY
    setTaxCreditAmountByYear((prev) => ({ ...prev, [year]: Math.max(0, Math.min(valueInCalc, safeMax)) }))
  }

  const applyTaxCreditSettings = () => {
    setInputs({
      ...inputs,
      enableTaxCredit: true,
      taxCreditRatePercent: 20,
      taxCreditCapPerYear: 130000,
      taxCreditStartYear: 1,
      taxCreditEndYear: undefined,
      stopTaxCreditAfterFirstWithdrawal: false,
    })
  }

  // TODO: Replace with real tax credit future value calculation
  // Static placeholder values - NO calculations
  const estimateTaxCreditFV = useMemo(() => {
    if (!inputs.enableTaxCredit) return { futureValue: 0, estimatedReturn: 0 }
    // Static placeholder values
    const futureValue = results.totalTaxCredit + 100000 // Static placeholder addition
    const estimatedReturn = 100000 // Static placeholder
    return { futureValue, estimatedReturn }
  }, [results.totalTaxCredit, inputs.enableTaxCredit])

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId === "yearly-table" ? "yearly" : sectionId)
    const element = document.getElementById(sectionId)
    if (element) {
      const findScrollableParent = (node: HTMLElement | null): HTMLElement | null => {
        if (!node) return null
        const style = window.getComputedStyle(node)
        const overflowY = style.overflowY
        if (
          (overflowY === "auto" || overflowY === "scroll") &&
          node.scrollHeight > node.clientHeight
        ) {
          return node
        }
        return findScrollableParent(node.parentElement)
      }

      const scrollParent = findScrollableParent(element.parentElement)
      if (scrollParent) {
        const parentRect = scrollParent.getBoundingClientRect()
        const elementRect = element.getBoundingClientRect()
        const offset = elementRect.top - parentRect.top + scrollParent.scrollTop - 16
        scrollParent.scrollTo({ top: offset, behavior: "smooth" })
      } else {
        element.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }
  }

  // Extra Services Cost Calculation
  const [extraServices, setExtraServices] = useState<ExtraService[]>([])
  const [yieldMonitoring, setYieldMonitoring] = useState<YieldMonitoringService>({ enabled: false, fundCount: 1 })

  // TODO: Replace with real extra services cost calculation
  // Static placeholder values - NO calculations
  const extraServicesCostsByYear = useMemo(() => {
    // Static placeholder costs - no calculations
    const costsByYear: Record<number, number> = {}
    for (let year = 1; year <= totalYearsForPlan; year++) {
      // Static placeholder value - just counts services, doesn't calculate
      let yearCost = extraServices.length * 2000 // Static placeholder per service
      if (yieldMonitoring.enabled && yieldMonitoring.fundCount > 1) {
        yearCost += 3000 // Static placeholder for yield monitoring
      }
      costsByYear[year] = yearCost
    }
    return costsByYear
  }, [extraServices, yieldMonitoring, totalYearsForPlan])

  const totalExtraServicesCost = useMemo(() => {
    return Object.values(extraServicesCostsByYear).reduce((sum, cost) => sum + cost, 0)
  }, [extraServicesCostsByYear])

  const adjustedResults = useMemo(() => {
    if (yearlyAccountView === "summary") {
      return {
        ...results,
        yearlyBreakdown: summaryYearlyBreakdown,
      }
    }
    if (yearlyAccountView === "eseti_tax_eligible") return resultsEsetiTaxEligible
    return yearlyAccountView === "eseti" || yearlyAccountView === "eseti_immediate_access" ? resultsEseti : results
  }, [yearlyAccountView, results, resultsEseti, resultsEsetiTaxEligible, summaryYearlyBreakdown])
  const effectiveYearlyViewModeForColumns =
    yearlyAccountView === "main" && isAccountSplitOpen ? yearlyViewMode : "total"
  const getViewMetric = useCallback(
    (row: any, metric: "admin" | "accountMaintenance" | "management" | "asset" | "plus" | "acquisition" | "bonus") => {
      if (!row) return 0
      const isSplitAccountView =
        yearlyAccountView === "main" && isAccountSplitOpen && effectiveYearlyViewModeForColumns !== "total"
      if (!isSplitAccountView) {
        if (metric === "admin") return row.adminCostForYear ?? 0
        if (metric === "accountMaintenance") return row.accountMaintenanceCostForYear ?? 0
        if (metric === "management") return row.managementFeeCostForYear ?? 0
        if (metric === "asset") return row.assetBasedCostForYear ?? 0
        if (metric === "plus") return row.plusCostForYear ?? 0
        if (metric === "acquisition") return row.upfrontCostForYear ?? 0
        return (row.bonusForYear ?? 0) + (row.wealthBonusForYear ?? 0)
      }
      const accountKey =
        effectiveYearlyViewModeForColumns === "client"
          ? "client"
          : effectiveYearlyViewModeForColumns === "invested"
            ? "invested"
            : "taxBonus"
      const accountRow = row[accountKey] ?? {}
      const accountAssetCost = accountRow.assetBasedCostForYear ?? 0
      const accountPlusCost = accountRow.plusCostForYear ?? 0
      const accountMaintenanceCost = Math.max(0, (accountRow.costForYear ?? 0) - accountAssetCost - accountPlusCost)
      const accountBonusAmount = (accountRow.bonusForYear ?? 0) + (accountRow.wealthBonusForYear ?? 0)
      if (metric === "accountMaintenance") return accountMaintenanceCost
      if (metric === "asset") return accountRow.assetBasedCostForYear ?? 0
      if (metric === "plus") return accountRow.plusCostForYear ?? 0
      if (metric === "bonus" && accountKey === "taxBonus") return 0
      if (metric === "bonus") return accountBonusAmount
      return 0
    },
    [yearlyAccountView, isAccountSplitOpen, effectiveYearlyViewModeForColumns],
  )
  const showAdminCostColumn = useMemo(
    () => (adjustedResults?.yearlyBreakdown ?? []).some((row) => getViewMetric(row, "admin") > 0),
    [adjustedResults?.yearlyBreakdown, getViewMetric],
  )
  const showAccountMaintenanceColumn = useMemo(
    () => (adjustedResults?.yearlyBreakdown ?? []).some((row) => getViewMetric(row, "accountMaintenance") > 0),
    [adjustedResults?.yearlyBreakdown, getViewMetric],
  )
  const showManagementFeeColumn = useMemo(
    () => (adjustedResults?.yearlyBreakdown ?? []).some((row) => getViewMetric(row, "management") > 0),
    [adjustedResults?.yearlyBreakdown, getViewMetric],
  )
  const showAssetFeeColumn = useMemo(
    () => (adjustedResults?.yearlyBreakdown ?? []).some((row) => getViewMetric(row, "asset") > 0),
    [adjustedResults?.yearlyBreakdown, getViewMetric],
  )
  const effectiveShowAssetFeeColumn =
    showAssetFeeColumn ||
    isAllianzEletprogramView
  const showPlusCostColumn = useMemo(
    () => (adjustedResults?.yearlyBreakdown ?? []).some((row) => getViewMetric(row, "plus") > 0),
    [adjustedResults?.yearlyBreakdown, getViewMetric],
  )
  const showAcquisitionColumn = useMemo(
    () => (adjustedResults?.yearlyBreakdown ?? []).some((row) => getViewMetric(row, "acquisition") > 0),
    [adjustedResults?.yearlyBreakdown, getViewMetric],
  )
  const hasBonusInCurrentView = useMemo(
    () => (adjustedResults?.yearlyBreakdown ?? []).some((row) => getViewMetric(row, "bonus") > 0),
    [adjustedResults?.yearlyBreakdown, getViewMetric],
  )
  const effectiveShowBonusColumns = showBonusColumns
  const shouldShowWealthBonusPercentColumn =
    selectedProduct !== "allianz_bonusz_eletprogram" &&
    selectedProduct !== "alfa_fortis" &&
    selectedProduct !== "alfa_jade" &&
    selectedProduct !== "alfa_jovotervezo" &&
    selectedProduct !== "generali_kabala"
  const kabalaLoyaltyBonusByYear = useMemo(() => {
    if (selectedProduct !== "generali_kabala") return {}
    const out: Record<number, number> = {}
    const source = inputs.bonusAmountByYear ?? {}
    for (let year = 1; year <= totalYearsForPlan; year++) {
      out[year] = Math.max(0, source[year] ?? 0)
    }
    return out
  }, [selectedProduct, inputs.bonusAmountByYear, totalYearsForPlan])
  const kabalaLoyaltyBonusCumulativeByYear = useMemo(() => {
    if (selectedProduct !== "generali_kabala") return {}
    const out: Record<number, number> = {}
    let runningTotal = 0
    for (let year = 1; year <= totalYearsForPlan; year++) {
      runningTotal += kabalaLoyaltyBonusByYear[year] ?? 0
      out[year] = runningTotal
    }
    return out
  }, [selectedProduct, kabalaLoyaltyBonusByYear, totalYearsForPlan])

  const addExtraService = () => {
    const newService: ExtraService = {
      id: `service-${Date.now()}`,
      name: "Egyedi költség",
      type: "amount",
      value: 0,
      frequency: "monthly",
    }
    setExtraServices([...extraServices, newService])
  }

  const removeExtraService = (id: string) => {
    setExtraServices(extraServices.filter((s) => s.id !== id))
  }

  const updateExtraService = (id: string, updates: Partial<ExtraService>) => {
    setExtraServices(extraServices.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }

  const addYieldMonitoringService = () => {
    setYieldMonitoring({ enabled: true, fundCount: 1 })
  }

  const updateAssetCostPercent = (year: number, value: number) => {
    setAssetCostPercentByYear((prev) => {
      const updated = { ...prev }
      for (let y = year; y <= totalYearsForPlan; y++) {
        const defaultPercentForYear =
          productPresetBaseline.assetCostPercentByYear[y] ?? productPresetBaseline.assetBasedFeePercent
        if (Math.abs(value - defaultPercentForYear) < 1e-9) {
          delete updated[y]
        } else {
          updated[y] = value
        }
      }
      return updated
    })
    if (appliedPresetLabel) setAppliedPresetLabel(null)
  }
  const updateAccountMaintenancePercent = (year: number, value: number) => {
    const defaultPercent =
      productPresetBaseline.accountMaintenancePercentByYear[year] ?? productPresetBaseline.accountMaintenanceMonthlyPercent
    setAccountMaintenancePercentByYear((prev) => {
      const updated = { ...prev }
      if (Math.abs(value - defaultPercent) < 1e-9) {
        delete updated[year]
      } else {
        updated[year] = value
      }
      return updated
    })
    if (appliedPresetLabel) setAppliedPresetLabel(null)
  }
  const updateAdminFeePercent = (year: number, value: number) => {
    const defaultPercent = productPresetBaseline.adminFeePercentByYear[year] ?? productPresetBaseline.adminFeePercentOfPayment
    setAdminFeePercentByYear((prev) => {
      const updated = { ...prev }
      if (Math.abs(value - defaultPercent) < 1e-9) {
        delete updated[year]
      } else {
        updated[year] = value
      }
      return updated
    })
    if (appliedPresetLabel) setAppliedPresetLabel(null)
  }
  const updateInitialCostPercent = (year: number, value: number) => {
    const defaultPercent = productPresetBaseline.initialCostByYear[year] ?? productPresetBaseline.initialCostDefaultPercent
    setInputs((prev) => {
      const nextInitialCostByYear = { ...(prev.initialCostByYear ?? {}) }
      if (Math.abs(value - defaultPercent) < 1e-9) {
        delete nextInitialCostByYear[year]
      } else {
        nextInitialCostByYear[year] = value
      }
      return { ...prev, initialCostByYear: nextInitialCostByYear }
    })
    if (appliedPresetLabel) setAppliedPresetLabel(null)
  }

  const updatePlusCost = (year: number, value: number) => {
    if (value === 0) {
      setPlusCostByYear((prev) => {
        const updated = { ...prev }
        delete updated[year]
        return updated
      })
    } else {
      setPlusCostByYear((prev) => ({ ...prev, [year]: value }))
    }
    setManagementFees((prev) => {
      const target = prev.find((fee) => fee.valueType === "amount")
      if (!target) return prev
      return prev.map((fee) => {
        if (fee.id !== target.id) return fee
        const nextByYear = { ...(fee.valueByYear ?? {}) }
        if (value === 0) delete nextByYear[year]
        else nextByYear[year] = value
        return { ...fee, valueByYear: nextByYear }
      })
    })
    if (appliedPresetLabel) setAppliedPresetLabel(null)
  }
  // </CHANGE>

  const updateBonusPercent = (year: number, percent: number) => {
    setBonusPercentByYear((prev) => {
      const updated = { ...prev }
      if (percent === 0) {
        delete updated[year]
      } else {
        updated[year] = percent
      }
      return updated
    })
    setBonuses((prev) => {
      const target = prev.find((bonus) => bonus.valueType === "percent")
      if (!target) return prev
      return prev.map((bonus) => {
        if (bonus.id !== target.id) return bonus
        const nextByYear = { ...(bonus.valueByYear ?? {}) }
        if (percent === 0) delete nextByYear[year]
        else nextByYear[year] = percent
        return { ...bonus, valueByYear: nextByYear }
      })
    })
    if (appliedPresetLabel) setAppliedPresetLabel(null)
  }
  const updateBonusOnContributionPercent = (year: number, percent: number) => {
    const defaultPercent = productPresetBaseline.bonusOnContributionPercentByYear[year] ?? 0
    setBonusOnContributionPercentByYear((prev) => {
      const updated = { ...prev }
      if (Math.abs(percent - defaultPercent) < 1e-9) {
        delete updated[year]
      } else {
        updated[year] = percent
      }
      return updated
    })
    if (appliedPresetLabel) setAppliedPresetLabel(null)
  }
  const updateRefundInitialCostBonusPercent = (year: number, percent: number) => {
    const defaultPercent = productPresetBaseline.refundInitialCostBonusPercentByYear[year] ?? 0
    setRefundInitialCostBonusPercentByYear((prev) => {
      const updated = { ...prev }
      if (Math.abs(percent - defaultPercent) < 1e-9) {
        delete updated[year]
      } else {
        updated[year] = percent
      }
      return updated
    })
    if (appliedPresetLabel) setAppliedPresetLabel(null)
  }
  // </CHANGE>

  useEffect(() => {
    const periodsPerYear =
      inputs.frequency === "havi" ? 12 : inputs.frequency === "negyedéves" ? 4 : inputs.frequency === "féléves" ? 2 : 1
    const monthlyPayment = inputs.keepYearlyPayment ? inputs.regularPayment : inputs.regularPayment
    const yearlyPayment = inputs.keepYearlyPayment ? inputs.regularPayment * 12 : inputs.regularPayment * periodsPerYear

    const endBalanceEUR500 =
      results.currency === "EUR" ? convertForDisplay(results.endBalance, "EUR", "HUF", 500) : undefined
    const endBalanceEUR600 =
      results.currency === "EUR" ? convertForDisplay(results.endBalance, "EUR", "HUF", 600) : undefined

    // Update the context with calculated data
    const productHasBonus = inputs.bonusMode !== "none"

    const contextData: CalculatorData = {
      monthlyPayment,
      yearlyPayment,
      years: totalYearsForPlan,
      currency: inputs.currency,
      displayCurrency,
      eurToHufRate: inputs.eurToHufRate,
      totalContributions: results.totalContributions,
      totalReturn: results.endBalance - results.totalContributions,
      endBalance: results.endBalance,
      totalTaxCredit: results.totalTaxCredit,
      totalBonus: results.totalBonus,
      totalCost: results.totalCosts,
      totalAssetBasedCost: results.totalAssetBasedCost,
      totalRiskInsuranceCost,
      annualYieldPercent: inputs.annualYieldPercent,
      selectedInsurer: selectedInsurer ?? undefined,
      selectedProduct: selectedProduct ?? undefined,
      enableTaxCredit: inputs.enableTaxCredit,
      enableNetting,
      productHasBonus,
    }
    updateData(contextData)
  }, [
    inputs,
    results,
    displayCurrency,
    inputs.eurToHufRate,
    inputs.frequency,
    inputs.keepYearlyPayment,
    inputs.regularPayment,
    inputs.annualYieldPercent,
    totalYearsForPlan,
    enableNetting,
    finalNetData,
    totalRiskInsuranceCost,
    selectedInsurer,
    selectedProduct,
    appliedPresetLabel,
    updateData,
    inputs.enableTaxCredit, // Added as dependency
    inputs.usdToHufRate, // Added dependency
  ])

  const fxDate = fxState.date ? new Date(fxState.date).toLocaleDateString("hu-HU") : null

  // State for visible years in mobile view
  const [visibleYears, setVisibleYears] = useState(10)

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const isYearlyReadOnly = yearlyAccountView === "summary"
  const isYearlyMuted = yearlyAccountView === "summary"
  const isEsetiTaxEligibleView = yearlyAccountView === "eseti_tax_eligible"
  const isEsetiImmediateView = yearlyAccountView === "eseti_immediate_access"
  const isEsetiView = yearlyAccountView === "eseti" || isEsetiTaxEligibleView || isEsetiImmediateView
  const shouldShowDesktopYearlyTable = !isMobile || isLandscapeOrientation
  const yearlyAccountSelectValue: YearlyAccountView =
    isPremiumSelectionNy06 && (isEsetiImmediateView || isEsetiTaxEligibleView) ? "eseti" : yearlyAccountView
  const settingsAccountView: "main" | "eseti" = isEsetiView ? "eseti" : "main"
  const isSettingsEseti = settingsAccountView === "eseti"
  const isTaxCreditSupportedForSelectedProduct =
    selectedProduct !== "alfa_fortis" &&
    selectedProduct !== "alfa_jade" &&
    selectedProduct !== "alfa_jovokep" &&
    selectedProduct !== "alfa_jovotervezo" &&
    selectedProduct !== "cig_esszenciae"
  const isTaxCreditMandatoryForSelectedProduct =
    selectedProduct === "alfa_relax_plusz" ||
    selectedProduct === "alfa_zen" ||
    selectedProduct === "alfa_zen_eur" ||
    selectedProduct === "alfa_zen_pro" ||
    selectedProduct === "cig_nyugdijkotvenye"
  const isTaxCreditLockedByCurrentView =
    isSettingsEseti &&
    selectedProduct !== "generali_kabala" &&
    selectedProduct !== "generali_mylife_extra_plusz"
  const settingsDurationUnit = isSettingsEseti ? esetiDurationUnit : durationUnit
  const settingsDurationValue = isSettingsEseti ? esetiDurationValue : durationValue
  const settingsDurationMax =
    isSettingsEseti
      ? esetiDurationMaxByUnit[settingsDurationUnit]
      : settingsDurationUnit === "year"
        ? 50
        : settingsDurationUnit === "month"
          ? 600
          : 18250
  const effectiveYearlyViewMode =
    yearlyAccountView === "main" && isAccountSplitOpen ? yearlyViewMode : "total"
  const hideAssetFeeBreakdownInYearlyTable =
    isAccountSplitOpen &&
    yearlyAccountView === "main" &&
    effectiveYearlyViewMode === "total" &&
    !isAllianzEletprogramView
  const shouldShowTaxCreditInYearlyTable =
    inputs.enableTaxCredit &&
    !(selectedProduct === "alfa_exclusive_plus" && effectiveYearlyViewMode !== "taxBonus") &&
    !(isPremiumSelectionNy06 && isEsetiImmediateView)
  const shouldShowAcquisitionInYearlyTableView =
    !(selectedProduct === "alfa_exclusive_plus" && isAccountSplitOpen && effectiveYearlyViewMode !== "total")
  const yearlyPanelProductKey = useMemo(
    () => resolveProductContextKey(selectedProduct, { enableTaxCredit: inputs.enableTaxCredit, currency: inputs.currency }),
    [selectedProduct, inputs.enableTaxCredit, inputs.currency],
  )
  const customYearlyColumns = useMemo(
    () =>
      customEntryDefinitions
        .filter((entry) =>
          isEsetiView ? entry.account !== "main" : entry.account !== "eseti",
        )
        .map((entry) => ({
        id: `custom:${entry.id}`,
        entryId: entry.id,
        kind: entry.kind,
        account: entry.account,
        frequency: entry.frequency,
        valueType: entry.valueType,
        value: entry.value,
        valueByYear: entry.valueByYear ?? {},
        startYear: entry.startYear,
        stopYear: entry.stopYear,
        title: entry.label,
        infoKey: `custom-entry:${entry.id}`,
        className:
          entry.kind === "cost"
            ? "py-3 px-3 text-right font-medium whitespace-nowrap text-red-600"
            : "py-3 px-3 text-right font-medium whitespace-nowrap text-emerald-600",
        width: "130px",
      })),
    [customEntryDefinitions, isEsetiView],
  )
  const customCostYearlyColumns = useMemo(
    () => customYearlyColumns.filter((column) => column.kind === "cost"),
    [customYearlyColumns],
  )
  const customBonusYearlyColumns = useMemo(
    () => customYearlyColumns.filter((column) => column.kind === "bonus"),
    [customYearlyColumns],
  )
  const customColumnExplanations = useMemo(() => {
    const accountLabelByKey: Record<CustomEntryAccount, string> = {
      client: "Ügyfélérték",
      invested: "Többletdíj",
      taxBonus: "Adójóváírási számla",
      main: "Fő",
      eseti: "Eseti",
    }
    const frequencyLabelByKey: Record<ManagementFeeFrequency, string> = {
      napi: "napi",
      havi: "havi",
      negyedéves: "negyedéves",
      féléves: "féléves",
      éves: "éves",
    }

    return Object.fromEntries(
      customYearlyColumns.map((column) => {
        const infoKey = column.infoKey
        const typeLabel = column.kind === "cost" ? "Egyedi költség" : "Egyedi bónusz"
        const frequency =
          (column.frequency && frequencyLabelByKey[column.frequency]) || frequencyLabelByKey["éves"]
        const valueLabel =
          column.valueType === "percent"
            ? `${column.value.toLocaleString("hu-HU", { maximumFractionDigits: 4 })}% (alapérték, évenként felülírható)`
            : `${formatNumber(Math.round(column.value))} ${results.currency} (alapérték, évenként felülírható)`
        const startYear = Math.max(1, Number(column.startYear ?? 1))
        const stopYear = Number(column.stopYear ?? 0)
        const yearsLabel = stopYear > 0 ? `${startYear}-${stopYear}. év` : `${startYear}. évtől`
        const detail = `${typeLabel}, ${frequency} alkalmazás, ${valueLabel}, cél számla: ${accountLabelByKey[column.account]}, évek: ${yearsLabel}.`
        return [
          infoKey,
          {
            title: column.title,
            summary: `${typeLabel} – a megadott beállítások alapján számolt dinamikus éves oszlop.`,
            detail,
          },
        ]
      }),
    )
  }, [customYearlyColumns, results.currency])

  const loadCustomPresets = useCallback(async () => {
    try {
      setCustomPresetError("")
      const query = selectedProduct ? `?productScope=${encodeURIComponent(selectedProduct)}` : ""
      const response = await fetch(`/api/custom-presets${query}`)
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        setCustomPresetError(payload?.message ?? "A sablonlista betöltése sikertelen.")
        if (response.status === 401) {
          router.replace("/login")
          return
        }
        return
      }
      const data = await response.json()
      setCustomPresets(Array.isArray(data?.presets) ? data.presets : [])
    } catch (error) {
      console.error("[v0] custom preset list error:", error)
      setCustomPresetError("A sablonlista betöltése sikertelen.")
    }
  }, [selectedProduct, router])

  useEffect(() => {
    void loadCustomPresets()
  }, [loadCustomPresets])

  const saveCurrentCustomPreset = useCallback(async () => {
    const name = customPresetName.trim()
    if (!name || customEntryDefinitions.length === 0) return
    try {
      setCustomPresetError("")
      const response = await fetch("/api/custom-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          productScope: selectedProduct ?? null,
          entries: customEntryDefinitions,
        }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        setCustomPresetError(payload?.message ?? "A sablon mentése sikertelen.")
        if (response.status === 401) {
          router.replace("/login")
        }
        return
      }
      setCustomPresetName("")
      await loadCustomPresets()
    } catch (error) {
      console.error("[v0] custom preset save error:", error)
      setCustomPresetError("A sablon mentése sikertelen.")
    }
  }, [customPresetName, customEntryDefinitions, selectedProduct, loadCustomPresets, router])

  const applyCustomPreset = useCallback((preset: CustomPreset) => {
    const feeEntries = preset.entries.filter((entry) => entry.kind === "cost")
    const bonusEntries = preset.entries.filter((entry) => entry.kind === "bonus")
    setManagementFees(
      feeEntries.length > 0
        ? feeEntries.map((entry, index) => ({
            id: entry.id || `fee-${Date.now()}-${index}`,
            label: (entry.label || "").trim() || `Egyedi költség ${index + 1}`,
            frequency: entry.frequency ?? "éves",
            valueType: entry.valueType,
            value: Number(entry.value ?? 0),
            valueByYear:
              entry.valueByYear && typeof entry.valueByYear === "object"
                ? Object.fromEntries(
                    Object.entries(entry.valueByYear)
                      .map(([year, value]) => [Number(year), Number(value)])
                      .filter(([year, value]) => Number.isFinite(year) && Number.isFinite(value)),
                  )
                : {},
            account: normalizeCustomAccountForEditor(entry.account),
          }))
        : [
            {
              id: `fee-${Date.now()}`,
              label: "Egyedi költség 1",
              frequency: "éves",
              valueType: "percent",
              value: 0,
              valueByYear: {},
              account: "main",
            },
          ],
    )
    setBonuses(
      bonusEntries.map((entry, index) => ({
        id: entry.id || `bonus-${Date.now()}-${index}`,
        valueType: entry.valueType,
        value: Number(entry.value ?? 0),
        valueByYear:
          entry.valueByYear && typeof entry.valueByYear === "object"
            ? Object.fromEntries(
                Object.entries(entry.valueByYear)
                  .map(([year, value]) => [Number(year), Number(value)])
                  .filter(([year, value]) => Number.isFinite(year) && Number.isFinite(value)),
              )
            : {},
        account: normalizeCustomAccountForEditor(entry.account),
      })),
    )
  }, [normalizeCustomAccountForEditor])

  const onSelectCustomPreset = useCallback(
    (presetId: string) => {
      setSelectedCustomPresetId(presetId)
      const preset = customPresets.find((item) => item.id === presetId)
      if (!preset) return
      applyCustomPreset(preset)
    },
    [customPresets, applyCustomPreset],
  )

  const updateCurrentCustomPreset = useCallback(async () => {
    if (!selectedCustomPresetId || customEntryDefinitions.length === 0) return
    try {
      setCustomPresetError("")
      const response = await fetch(`/api/custom-presets/${selectedCustomPresetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: customEntryDefinitions, productScope: selectedProduct ?? null }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        setCustomPresetError(payload?.message ?? "A sablon frissítése sikertelen.")
        if (response.status === 401) {
          router.replace("/login")
        }
        return
      }
      await loadCustomPresets()
    } catch (error) {
      console.error("[v0] custom preset update error:", error)
      setCustomPresetError("A sablon frissítése sikertelen.")
    }
  }, [selectedCustomPresetId, customEntryDefinitions, selectedProduct, loadCustomPresets, router])

  const deleteCurrentCustomPreset = useCallback(async () => {
    if (!selectedCustomPresetId) return
    try {
      setCustomPresetError("")
      const response = await fetch(`/api/custom-presets/${selectedCustomPresetId}`, { method: "DELETE" })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        setCustomPresetError(payload?.message ?? "A sablon törlése sikertelen.")
        if (response.status === 401) {
          router.replace("/login")
        }
        return
      }
      setSelectedCustomPresetId("")
      await loadCustomPresets()
    } catch (error) {
      console.error("[v0] custom preset delete error:", error)
      setCustomPresetError("A sablon törlése sikertelen.")
    }
  }, [selectedCustomPresetId, loadCustomPresets, router])

  const getYearlyHeaderInfoHandlers = (key: string) => ({
    onMouseEnter: () => setActiveYearlyColumnInfoKey(key),
    onMouseLeave: () => setActiveYearlyColumnInfoKey(null),
    onFocus: () => setActiveYearlyColumnInfoKey(key),
    onBlur: () => setActiveYearlyColumnInfoKey(null),
    tabIndex: 0,
  })
  useEffect(() => {
    if (!isTaxCreditSupportedForSelectedProduct && inputs.enableTaxCredit) {
      setInputs((prev) => ({ ...prev, enableTaxCredit: false }))
      return
    }
    if (isTaxCreditMandatoryForSelectedProduct && !inputs.enableTaxCredit) {
      setInputs((prev) => ({ ...prev, enableTaxCredit: true }))
    }
  }, [isTaxCreditSupportedForSelectedProduct, isTaxCreditMandatoryForSelectedProduct, inputs.enableTaxCredit])

  const allianzExtraordinaryMinimumLabel = useMemo(() => {
    if (!(selectedProduct === "allianz_eletprogram" || selectedProduct === "allianz_bonusz_eletprogram")) return null
    const periodsPerYear =
      inputs.frequency === "havi" ? 12 : inputs.frequency === "negyedéves" ? 4 : inputs.frequency === "féléves" ? 2 : 1
    const yearlyPayment = inputs.keepYearlyPayment ? inputs.regularPayment * 12 : inputs.regularPayment * periodsPerYear
    const periodicPayment = periodsPerYear > 0 ? yearlyPayment / periodsPerYear : 0
    const minimumExtraordinaryPayment =
      inputs.frequency === "havi"
        ? yearlyPayment / 2
        : inputs.frequency === "negyedéves"
          ? yearlyPayment / 2
          : periodicPayment * 1.1
    const suffix = inputs.currency === "EUR" ? "Euro" : "Ft"
    return `${formatNumber(minimumExtraordinaryPayment)} ${suffix}`
  }, [selectedProduct, inputs.frequency, inputs.keepYearlyPayment, inputs.regularPayment, inputs.currency])

  const minimumAnnualFeeLabel =
    selectedProduct === "alfa_exclusive_plus"
      ? `${formatNumber(360000)} Ft`
      : selectedProduct === "alfa_fortis"
        ? inputs.currency === "EUR"
          ? `${formatNumber(fortisVariantConfig.minAnnualPayment)} Euro`
          : inputs.currency === "USD"
            ? `${formatNumber(fortisVariantConfig.minAnnualPayment)} USD`
            : `${formatNumber(fortisVariantConfig.minAnnualPayment)} Ft`
        : selectedProduct === "alfa_jade"
          ? inputs.currency === "USD"
            ? `${formatNumber(jadeVariantConfig.minAnnualPayment)} USD`
            : `${formatNumber(jadeVariantConfig.minAnnualPayment)} Euro`
        : selectedProduct === "alfa_jovokep"
          ? `${formatNumber(JOVOKEP_MIN_ANNUAL_PAYMENT)} Ft`
        : selectedProduct === "alfa_jovotervezo"
          ? `${formatNumber(JOVOTERVEZO_MIN_ANNUAL_PAYMENT)} Ft`
        : selectedProduct === "alfa_premium_selection"
          ? premiumSelectionVariantConfig.currency === "EUR"
            ? `${formatNumber(premiumSelectionVariantConfig.minAnnualPayment)} Euro`
            : premiumSelectionVariantConfig.currency === "USD"
              ? `${formatNumber(premiumSelectionVariantConfig.minAnnualPayment)} USD`
            : `${formatNumber(premiumSelectionVariantConfig.minAnnualPayment)} Ft`
        : selectedProduct === "alfa_zen" || selectedProduct === "alfa_zen_eur"
          ? (() => {
              const variantConfig = getAlfaZenVariantConfig(undefined, inputs.currency)
              const suffix = variantConfig.currency === "USD" ? "USD" : "Euro"
              return `${formatNumber(resolveAlfaZenMinimumAnnualPayment(toYearsFromDuration(durationUnit, durationValue)))} ${suffix}`
            })()
        : selectedProduct === "alfa_zen_pro"
          ? (() => {
              const variantConfig = getZenProVariantConfig(undefined, inputs.currency)
              const suffix =
                variantConfig.currency === "EUR" ? "Euro" : variantConfig.currency === "USD" ? "USD" : "Ft"
              return `${formatNumber(resolveZenProMinimumAnnualPayment(toYearsFromDuration(durationUnit, durationValue), variantConfig))} ${suffix}`
            })()
        : selectedProduct === "cig_nyugdijkotvenye"
          ? `${formatNumber(CIG_NYUGDIJKOTVENYE_MIN_ANNUAL_PAYMENT)} Ft`
        : selectedProduct === "cig_esszenciae"
          ? (() => {
              const variant = getCigEsszenciaeVariantConfig(undefined, inputs.currency)
              return `${formatNumber(variant.minAnnualPayment)} ${variant.currency === "EUR" ? "Euro" : "Ft"}`
            })()
        : isAllianzEletprogramView
          ? inputs.currency === "EUR"
            ? "840 Euro"
            : `${formatNumber(144000)} Ft`
          : null
  const cigDurationPolicyLabel =
    selectedProduct === "cig_nyugdijkotvenye"
      ? `Tartam: minimum ${formatNumber(CIG_NYUGDIJKOTVENYE_MIN_DURATION_YEARS)} év.`
      : null
  const cigEsszenciaeDurationPolicyLabel =
    selectedProduct === "cig_esszenciae"
      ? `Tartam: minimum ${formatNumber(CIG_ESSZENCIAE_MIN_DURATION_YEARS)} év, maximum 80 év (de legfeljebb 90 éves lejárati kor).`
      : null
  const generaliKabalaDurationLabel =
    selectedProduct === "generali_kabala"
      ? (() => {
          const variantConfig = getGeneraliKabalaU91VariantConfig(undefined, inputs.enableTaxCredit)
          return `${formatNumber(variantConfig.minimumDurationYears)}-${formatNumber(variantConfig.maximumDurationYears)} év tartam`
        })()
      : null
  const generaliMylifeDurationPolicyLabel =
    selectedProduct === "generali_mylife_extra_plusz"
      ? (inputs.enableTaxCredit
          ? "Nyugdíj variáns tartam: minimum 5 év, maximum 50 év."
          : "Kezdeti megtakarítási tartam: 55 év felett min. 5 év, egyébként min. 10 év (jelenleg tájékoztató jelleggel).")
      : null
  const generaliMylifePaymentModeLabel =
    selectedProduct === "generali_mylife_extra_plusz"
      ? "Díjfizetési mód: átutalás vagy csoportos beszedés (csekk nem elérhető)."
      : null
  const shouldWarnFortisAgeClamp =
    selectedProduct === "alfa_fortis" &&
    ((inputs.insuredEntryAge ?? 38) < FORTIS_MIN_ENTRY_AGE || (inputs.insuredEntryAge ?? 38) > FORTIS_MAX_ENTRY_AGE)
  const jovokepDurationYears = toYearsFromDuration(durationUnit, durationValue)
  const jovokepMaxAllowedEntryAge = Math.max(
    JOVOKEP_MIN_ENTRY_AGE,
    Math.min(JOVOKEP_MAX_ENTRY_AGE, JOVOKEP_MAX_AGE_AT_MATURITY - jovokepDurationYears),
  )
  const shouldWarnJovokepAgeClamp =
    selectedProduct === "alfa_jovokep" &&
    ((inputs.insuredEntryAge ?? 38) < JOVOKEP_MIN_ENTRY_AGE || (inputs.insuredEntryAge ?? 38) > jovokepMaxAllowedEntryAge)
  const shouldWarnGeneraliPensionAgeClamp =
    selectedProduct === "generali_kabala" &&
    inputs.enableTaxCredit &&
    ((inputs.insuredEntryAge ?? 38) < GENERALI_KABALA_U91_PENSION_MIN_ENTRY_AGE ||
      (inputs.insuredEntryAge ?? 38) > GENERALI_KABALA_U91_PENSION_MAX_ENTRY_AGE)

  useEffect(() => {
    // If account split controls are hidden, force the table back to total mode
    // so we don't keep a stale "client/invested/taxBonus" view with seemingly zero rows.
    if (!isAccountSplitOpen && yearlyViewMode !== "total") {
      setYearlyViewMode("total")
    }
  }, [isAccountSplitOpen, yearlyViewMode])

  useEffect(() => {
    if (isPremiumSelectionNy06) return
    if (yearlyAccountView === "eseti_tax_eligible" || yearlyAccountView === "eseti_immediate_access") {
      setYearlyAccountView("eseti")
    }
  }, [isPremiumSelectionNy06, yearlyAccountView])
  const activeEsetiIndexByYear = isEsetiTaxEligibleView ? esetiIndexByYearTaxEligible : esetiIndexByYear
  const activeEsetiPaymentByYear = isEsetiTaxEligibleView ? esetiPaymentByYearTaxEligible : esetiPaymentByYear
  const activeEsetiWithdrawalByYear = isEsetiTaxEligibleView ? esetiWithdrawalByYearTaxEligible : esetiWithdrawalByYear
  const hasMainYearlyOverrides =
    Object.keys(indexByYear).length > 0 ||
    Object.keys(paymentByYear).length > 0 ||
    Object.keys(withdrawalByYear).length > 0 ||
    Object.keys(taxCreditLimitByYear).length > 0 ||
    Object.keys(taxCreditAmountByYear).length > 0 ||
    hasAssetCostOverrides ||
    hasAccountMaintenanceOverrides ||
    hasAdminFeeOverrides ||
    Object.keys(plusCostByYear).length > 0 ||
    hasWealthBonusOverrides ||
    hasBonusOnContributionOverrides ||
    hasRefundInitialCostBonusOverrides ||
    Object.keys(investedShareByYear).length > 0 ||
    Object.keys(redemptionFeeByYear).length > 0 ||
    hasInitialCostOverrides
  const hasActiveEsetiOverrides =
    Object.keys(activeEsetiIndexByYear).length > 0 ||
    Object.keys(activeEsetiPaymentByYear).length > 0 ||
    Object.keys(activeEsetiWithdrawalByYear).length > 0 ||
    ((selectedProduct === "allianz_eletprogram" || selectedProduct === "allianz_bonusz_eletprogram") &&
      hasAssetCostOverrides)

  useEffect(() => {
    if (!canUseFundYield && yieldSourceMode === "fund") {
      setYieldSourceMode("manual")
    }
  }, [canUseFundYield, yieldSourceMode])

  useEffect(() => {
    if (!isMounted) return
    if (typeof window === "undefined") return
    const hash = window.location.hash
    if (!hash) return
    const target = document.querySelector(hash)
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 50)
    }
  }, [isMounted])

  useEffect(() => {
    if (!isDisplayCurrencyUserOverridden && displayCurrency !== inputs.currency) {
      setDisplayCurrency(inputs.currency)
    }
  }, [inputs.currency, isDisplayCurrencyUserOverridden, displayCurrency])

  return (
    <div className="min-h-screen bg-background" suppressHydrationWarning>
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg font-bold truncate md:text-xl">Megtakarítás Számláló</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/osszesites")}
                className="h-9 px-3 hidden sm:flex"
              >
                Összesítés
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/osszehasonlitas")}
                className="h-9 px-3 hidden sm:flex"
              >
                Összehasonlítás
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/reszletes-adatok")}
                className="h-9 px-3 hidden sm:flex"
              >
                Részletes adatok
              </Button>

              {/* Display currency selector */}
              <Select value={displayCurrency} onValueChange={handleDisplayCurrencyChange}>
                <SelectTrigger className="w-16 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HUF">Ft</SelectItem>
                  <SelectItem value="EUR">€</SelectItem>
                  <SelectItem value="USD">$</SelectItem>
                </SelectContent>
              </Select>

              {/* Calculation mode selector */}
              <Select
                value={inputs.calculationMode}
                onValueChange={(v) => setInputs({ ...inputs, calculationMode: v as "simple" | "calendar" })}
              >
                <SelectTrigger className="w-24 h-9 hidden sm:flex">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Egyszerű</SelectItem>
                  <SelectItem value="calendar">Naptár</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="h-9 px-3"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{isLoggingOut ? "Kilépés..." : "Kijelentkezés"}</span>
              </Button>
            </div>
          </div>

          <div className="flex gap-1 mt-2 overflow-x-auto pb-1 md:hidden">
            <Button
              variant={activeSection === "settings" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3 text-xs whitespace-nowrap"
              onClick={() => scrollToSection("settings")}
            >
              <Settings className="w-3 h-3 mr-1" />
              Beállítások
            </Button>
            <Button
              variant={activeSection === "summary" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3 text-xs whitespace-nowrap"
              onClick={() => scrollToSection("summary")}
            >
              <Calculator className="w-3 h-3 mr-1" />
              Összegzés
            </Button>
            <Button
              variant={activeSection === "yearly" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3 text-xs whitespace-nowrap"
              onClick={() => scrollToSection("yearly-table")}
            >
              <Table2 className="w-3 h-3 mr-1" />
              Éves bontás
            </Button>
            <Button
              variant={activeSection === "summary-link" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3 text-xs whitespace-nowrap"
              onClick={() => router.push("/osszesites")}
            >
              <BarChart3 className="w-3 h-3 mr-1" />
              Összesítés
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs whitespace-nowrap"
              onClick={() => router.push("/osszehasonlitas")}
            >
              <GitCompare className="w-3 h-3 mr-1" />
              Összehasonlítás
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs whitespace-nowrap"
              onClick={() => router.push("/reszletes-adatok")}
            >
              <FileText className="w-3 h-3 mr-1" />
              Részletes adatok
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 md:py-6">
        {/* Desktop subtitle */}
        <p className="hidden md:block text-pretty text-muted-foreground">
          Számítsa ki befektetésének várható hozamát költségekkel, bónuszokkal és adó jóváírással
        </p>

        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3">
          <div id="settings" className="lg:col-span-3 space-y-4 scroll-mt-28">
            <div className="space-y-6">
              <Card className={`${SETTINGS_UI.cardBase} ${isSettingsEseti ? SETTINGS_UI.cardEseti : ""}`}>
                <CardHeader className={SETTINGS_UI.header}>
                  <CardTitle className={SETTINGS_UI.title}>
                    <span>Alapbeállítások</span>
                    {isSettingsEseti ? (
                      <span className={SETTINGS_UI.titleSuffix}>- Eseti</span>
                    ) : null}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={SETTINGS_UI.navButton}
                      onClick={() => setYearlyAccountView(settingsAccountView === "eseti" ? "main" : "eseti")}
                      aria-label="Váltás fő és eseti között"
                    >
                      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={SETTINGS_UI.navButton}
                      onClick={() => setYearlyAccountView(settingsAccountView === "eseti" ? "main" : "eseti")}
                      aria-label="Váltás fő és eseti között"
                    >
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-5">
                  <div className={SETTINGS_UI.formGroup}>
                    {/* Compact row 1: frequency / payment / currency / index */}
                    <div className={`${MOBILE_LAYOUT.settingsRow1} ${isSettingsEseti ? "opacity-60" : ""}`}>
                      <div className={MOBILE_LAYOUT.settingsField}>
                        <Label htmlFor="frequency" className={SETTINGS_UI.label}>
                          Fiz. gyak.
                        </Label>
                        <Select
                          value={isSettingsEseti ? esetiBaseInputs.frequency : inputs.frequency}
                          disabled={isSettingsEseti}
                          onValueChange={(value: PaymentFrequency) => {
                            if (isSettingsEseti) {
                              setEsetiBaseInputs((prev) => ({ ...prev, frequency: value }))
                              setEsetiFrequency(value)
                            } else {
                              if (isPremiumSelectionTr18 && value !== "éves") return
                              setInputs({ ...inputs, frequency: value })
                            }
                          }}
                        >
                          <SelectTrigger id="frequency" className={`${MOBILE_LAYOUT.inputHeight} ${SETTINGS_UI.field}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="havi" disabled={isPremiumSelectionTr18}>
                              Havi
                            </SelectItem>
                            <SelectItem value="negyedéves" disabled={isPremiumSelectionTr18}>
                              Negyedéves
                            </SelectItem>
                            <SelectItem value="féléves" disabled={isPremiumSelectionTr18}>
                              Féléves
                            </SelectItem>
                            <SelectItem value="éves">Éves</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className={MOBILE_LAYOUT.settingsPaymentField}>
                        <Label htmlFor="regularPayment" className={SETTINGS_UI.label}>
                          Befizetés
                        </Label>
                        <Input
                          id="regularPayment"
                          type="text"
                          inputMode="numeric"
                          disabled={isSettingsEseti}
                          value={
                            editingFields.regularPayment
                              ? String(isSettingsEseti ? esetiBaseInputs.regularPayment : inputs.regularPayment)
                              : formatNumber(isSettingsEseti ? esetiBaseInputs.regularPayment : inputs.regularPayment)
                          }
                          onFocus={() => setFieldEditing("regularPayment", true)}
                          onBlur={() => setFieldEditing("regularPayment", false)}
                          onChange={(e) => {
                            const parsed = parseNumber(e.target.value)
                            if (!isNaN(parsed)) {
                              if (isSettingsEseti) {
                                setEsetiBaseInputs((prev) => ({ ...prev, regularPayment: parsed }))
                              } else {
                                setInputs({ ...inputs, regularPayment: parsed })
                              }
                            }
                          }}
                          className={`${MOBILE_LAYOUT.inputHeight} ${SETTINGS_UI.field}`}
                        />
                      </div>

                      <div className={MOBILE_LAYOUT.settingsField}>
                        <Label htmlFor="currency" className={SETTINGS_UI.label}>
                          Deviza
                        </Label>
                        <Select value={inputs.currency} onValueChange={handleCurrencyChange} disabled={isSettingsEseti}>
                          <SelectTrigger id="currency" className={`${MOBILE_LAYOUT.inputHeight} ${SETTINGS_UI.field}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {INPUT_CURRENCY_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                                disabled={!allowedInputCurrencies.includes(option.value)}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className={MOBILE_LAYOUT.settingsField}>
                        <Label htmlFor="annualIndex" className={SETTINGS_UI.label}>
                          Index %
                        </Label>
                        <Input
                          id="annualIndex"
                          type="text"
                          inputMode="decimal"
                          onWheel={(e) => e.currentTarget.blur()}
                          disabled={isSettingsEseti}
                          value={
                            settingsAnnualIndexDraft ??
                            String(isSettingsEseti ? esetiBaseInputs.annualIndexPercent : inputs.annualIndexPercent)
                          }
                          onFocus={() =>
                            setSettingsAnnualIndexDraft(
                              String(isSettingsEseti ? esetiBaseInputs.annualIndexPercent : inputs.annualIndexPercent),
                            )
                          }
                          onChange={(e) => {
                            const nextRaw = e.target.value
                            setSettingsAnnualIndexDraft(nextRaw)
                            const nextValue = parseLocalizedDecimal(nextRaw)
                            if (nextValue === null) return
                            if (isSettingsEseti) {
                              setEsetiBaseInputs((prev) => ({ ...prev, annualIndexPercent: nextValue }))
                            } else {
                              setInputs({ ...inputs, annualIndexPercent: nextValue })
                            }
                          }}
                          onBlur={() => {
                            const fallback = isSettingsEseti ? esetiBaseInputs.annualIndexPercent : inputs.annualIndexPercent
                            const parsed = parseLocalizedDecimal(settingsAnnualIndexDraft ?? "")
                            const nextValue = parsed ?? fallback
                            if (isSettingsEseti) {
                              setEsetiBaseInputs((prev) => ({ ...prev, annualIndexPercent: nextValue }))
                            } else {
                              setInputs((prev) => ({ ...prev, annualIndexPercent: nextValue }))
                            }
                            setSettingsAnnualIndexDraft(null)
                          }}
                          min={0}
                          max={100}
                          step={0.1}
                          className={`${MOBILE_LAYOUT.inputHeight} ${SETTINGS_UI.field}`}
                        />
                      </div>
                    </div>

                    {/* Compact row 2: duration value / unit / yield */}
                    <div className={MOBILE_LAYOUT.settingsRow2}>
                      <div className={MOBILE_LAYOUT.settingsField}>
                        <Label className={SETTINGS_UI.label}>Futamidő</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          onWheel={(e) => e.currentTarget.blur()}
                          value={settingsDurationDraft ?? String(settingsDurationValue)}
                          onFocus={() => setSettingsDurationDraft(String(settingsDurationValue))}
                          onChange={(e) => {
                            const nextRaw = e.target.value
                            setSettingsDurationDraft(nextRaw)
                            const normalized = nextRaw.trim()
                            if (!normalized || !/^\d+$/.test(normalized)) return
                            const parsed = Number(normalized)
                            if (isSettingsEseti) {
                              setEsetiDurationValue(Math.min(parsed, settingsDurationMax))
                            } else {
                              setDurationSource("value")
                              setDurationValue(parsed)
                            }
                          }}
                          onBlur={() => {
                            const normalized = (settingsDurationDraft ?? "").trim()
                            const parsed = /^\d+$/.test(normalized) ? Number(normalized) : Number.NaN
                            const fallback = settingsDurationValue
                            const nextValue = Number.isFinite(parsed)
                              ? Math.min(Math.max(1, Math.round(parsed)), settingsDurationMax)
                              : fallback
                            if (isSettingsEseti) {
                              setEsetiDurationValue(nextValue)
                            } else {
                              setDurationSource("value")
                              setDurationValue(nextValue)
                            }
                            setSettingsDurationDraft(null)
                          }}
                          min={1}
                          max={settingsDurationMax}
                          className={`${MOBILE_LAYOUT.inputHeight} ${SETTINGS_UI.field}`}
                        />
                        {selectedProduct === "alfa_jade" && !isSettingsEseti ? (
                          <p className={SETTINGS_UI.helper}>Fix 15 éves termék (TR19), az alapérték 15 év.</p>
                        ) : null}
                      </div>

                      <div className={MOBILE_LAYOUT.settingsField}>
                        <Label className={SETTINGS_UI.label}>Egység</Label>
                        <Select
                          value={settingsDurationUnit}
                          onValueChange={(v) => {
                            const nextUnit = v as DurationUnit
                            if (isSettingsEseti) {
                              const maxForUnit = esetiDurationMaxByUnit[nextUnit]
                              const converted = convertDurationValue(settingsDurationValue, settingsDurationUnit, nextUnit)
                              setEsetiDurationUnit(nextUnit)
                              setEsetiDurationValue(Math.min(converted, maxForUnit))
                            } else {
                              const converted = convertDurationValue(settingsDurationValue, settingsDurationUnit, nextUnit)
                              setDurationSource("value")
                              setDurationUnit(nextUnit)
                              setDurationValue(converted)
                            }
                          }}
                        >
                          <SelectTrigger className={`${MOBILE_LAYOUT.inputHeight} ${SETTINGS_UI.field}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="year">Év</SelectItem>
                            <SelectItem value="month">Hónap</SelectItem>
                            <SelectItem value="day">Nap</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className={MOBILE_LAYOUT.settingsYieldField}>
                        <div className="flex items-center justify-between gap-2">
                          <Label htmlFor="annualYield" className={SETTINGS_UI.label}>
                            Hozam (%)
                          </Label>
                          {!isSettingsEseti ? (
                            <div className="inline-flex items-center rounded-md border bg-background p-0.5">
                              <Button
                                type="button"
                                variant={yieldSourceMode === "manual" ? "secondary" : "ghost"}
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => {
                                  setYieldSourceMode("manual")
                                  setInputs((prev) =>
                                    prev.annualYieldPercent === manualYieldPercent
                                      ? prev
                                      : { ...prev, annualYieldPercent: manualYieldPercent },
                                  )
                                }}
                              >
                                Kézi
                              </Button>
                              <Button
                                type="button"
                                variant={yieldSourceMode === "fund" ? "secondary" : "ghost"}
                                size="sm"
                                className="h-6 px-2 text-xs"
                                disabled={!canUseFundYield}
                                onClick={() => setYieldSourceMode("fund")}
                              >
                                MNB
                              </Button>
                              <Button
                                type="button"
                                variant={yieldSourceMode === "ocr" ? "secondary" : "ghost"}
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => {
                                  setYieldSourceMode("ocr")
                                  if (parsedChartSeries) {
                                    setInputs((prev) => ({
                                      ...prev,
                                      annualYieldPercent: Number(parsedChartSeries.derivedAnnualYieldPercent.toFixed(2)),
                                    }))
                                  }
                                }}
                              >
                                OCR
                              </Button>
                            </div>
                          ) : null}
                        </div>
                        {yieldSourceMode === "fund" && !isSettingsEseti ? (
                          <div className="space-y-2">
                            <Select
                              value={selectedFundId || ""}
                              onValueChange={(value) => {
                                setSelectedFundId(value)
                                const selectedFund = fundOptions.find((f) => f.id === value)
                                if (selectedFund) {
                                  setInputs({ ...inputs, annualYieldPercent: selectedFund.historicalYield })
                                }
                              }}
                            >
                              <SelectTrigger className={`${MOBILE_LAYOUT.inputHeight} ${SETTINGS_UI.field} w-full min-w-0 max-w-full overflow-hidden text-left pr-8`}>
                                <SelectValue className="sr-only" placeholder="Válassz eszközalapot..." />
                                <span className="block min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs">
                                  {selectedFundId
                                    ? `${fundOptions.find((f) => f.id === selectedFundId)?.name ?? ""} (${fundOptions.find((f) => f.id === selectedFundId)?.historicalYield ?? ""}%)`
                                    : "Válassz eszközalapot..."}
                                </span>
                              </SelectTrigger>
                              <SelectContent>
                                {fundOptions.map((fund) => (
                                  <SelectItem key={fund.id} value={fund.id}>
                                    {fund.name} ({fund.historicalYield}%)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Select
                              value={fundCalculationMode}
                              onValueChange={(value) => setFundCalculationMode(value as "replay" | "averaged")}
                            >
                              <SelectTrigger className={`${MOBILE_LAYOUT.inputHeight} ${SETTINGS_UI.field}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="replay">Valós idősor (Replay)</SelectItem>
                                <SelectItem value="averaged">Idősor átlagolt (Évesített)</SelectItem>
                              </SelectContent>
                            </Select>

                            <p className={SETTINGS_UI.helper}>
                              {fundSeriesLoading
                                ? "Eszközalap idősor betöltése..."
                                : fundSeriesPoints.length > 1
                                  ? `Valós idősor aktív: ${fundSeriesPoints.length} pont${
                                      typeof fundSeriesComputedStats?.annualizedReturnPercent === "number"
                                        ? `, évesített: ${fundSeriesComputedStats.annualizedReturnPercent.toFixed(2)}%`
                                        : ""
                                    }${
                                      typeof fundSeriesComputedStats?.periodReturnPercent === "number"
                                        ? `, időszak: ${fundSeriesComputedStats.periodReturnPercent.toFixed(2)}%`
                                        : ""
                                    }${
                                      fundSeriesComputedStats?.firstPrice && fundSeriesComputedStats?.lastPrice
                                        ? ` (első: ${fundSeriesComputedStats.firstPrice.toFixed(6)}, utolsó: ${fundSeriesComputedStats.lastPrice.toFixed(6)})`
                                        : ""
                                    }${
                                      fundSeriesComputedStats?.firstDate && fundSeriesComputedStats?.lastDate
                                        ? `, idősor: ${formatIsoDateDot(fundSeriesComputedStats.firstDate)} → ${formatIsoDateDot(fundSeriesComputedStats.lastDate)}`
                                        : ""
                                    }${fundSeriesSource ? `, forrás: ${(() => {
                                      try { return new URL(fundSeriesSource).host } catch { return "publikus biztosítói adat" }
                                    })()}` : ""}
                                    }`
                                  : fundSeriesError
                                    ? `Valós idősor nem elérhető (${fundSeriesError}), manuális hozam fallback aktív.`
                                    : "Valós idősor még nem érhető el, manuális hozam fallback aktív."}
                            </p>
                            {fundSeriesAvailableRange?.startDate && fundSeriesAvailableRange?.endDate ? (
                              <p className={SETTINGS_UI.helper}>
                                Program elérhető idősor:{" "}
                                {formatIsoDateDot(fundSeriesAvailableRange.startDate)} →{" "}
                                {formatIsoDateDot(fundSeriesAvailableRange.endDate)}
                              </p>
                            ) : null}
                            {fundSeriesFundEarliestAvailable ? (
                              <p className={SETTINGS_UI.helper}>
                                Eszközalap legkorábbi adat: {formatIsoDateDot(fundSeriesFundEarliestAvailable)}
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <Input
                            id="annualYield"
                            type="text"
                            inputMode="decimal"
                            onWheel={(e) => e.currentTarget.blur()}
                            value={
                              settingsAnnualYieldDraft ??
                              String(isSettingsEseti ? esetiBaseInputs.annualYieldPercent : inputs.annualYieldPercent)
                            }
                            onFocus={() =>
                              setSettingsAnnualYieldDraft(
                                String(isSettingsEseti ? esetiBaseInputs.annualYieldPercent : inputs.annualYieldPercent),
                              )
                            }
                            onChange={(e) => {
                              const nextRaw = e.target.value
                              setSettingsAnnualYieldDraft(nextRaw)
                              const nextValue = parseLocalizedDecimal(nextRaw)
                              if (nextValue === null) return
                              if (isSettingsEseti) {
                                setEsetiBaseInputs((prev) => ({ ...prev, annualYieldPercent: nextValue }))
                              } else {
                                setYieldSourceMode("manual")
                                setManualYieldPercent(nextValue)
                                setInputs({ ...inputs, annualYieldPercent: nextValue })
                              }
                            }}
                            onBlur={() => {
                              const fallback = isSettingsEseti ? esetiBaseInputs.annualYieldPercent : inputs.annualYieldPercent
                              const parsed = parseLocalizedDecimal(settingsAnnualYieldDraft ?? "")
                              const nextValue = parsed ?? fallback
                              if (isSettingsEseti) {
                                setEsetiBaseInputs((prev) => ({ ...prev, annualYieldPercent: nextValue }))
                              } else {
                                setYieldSourceMode("manual")
                                setManualYieldPercent(nextValue)
                                setInputs((prev) => ({ ...prev, annualYieldPercent: nextValue }))
                              }
                              setSettingsAnnualYieldDraft(null)
                            }}
                            min={0}
                            max={100}
                            step={0.1}
                            className={`${MOBILE_LAYOUT.inputHeight} ${SETTINGS_UI.field} ${isSettingsEseti ? "border-orange-200/80 dark:border-orange-800/60" : ""}`}
                          />
                        )}
                        {!canUseFundYield ? (
                          <p className={SETTINGS_UI.helper}>
                            Eszközalap módhoz előbb válassz terméket a termékválasztóban.
                          </p>
                        ) : null}
                        {yieldFallbackMessage ? <p className={SETTINGS_UI.helper}>{yieldFallbackMessage}</p> : null}
                        {!isSettingsEseti && yieldSourceMode === "ocr" ? (
                          <div
                            className={`mt-2 rounded-md border-2 border-dashed p-2 ${
                              isChartDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30"
                            }`}
                            onDragOver={(event) => {
                              event.preventDefault()
                              setIsChartDragActive(true)
                            }}
                            onDragLeave={() => setIsChartDragActive(false)}
                            onDrop={(event) => {
                              event.preventDefault()
                              setIsChartDragActive(false)
                              const file = event.dataTransfer.files?.[0]
                              if (file) void processChartImageFile(file)
                            }}
                            onPaste={(event) => {
                              const file = event.clipboardData.files?.[0]
                              if (file) void processChartImageFile(file)
                            }}
                            tabIndex={0}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs bg-transparent"
                                onClick={() => chartImageInputRef.current?.click()}
                              >
                                <Upload className="h-3.5 w-3.5 mr-1.5" />
                                Kép behúzás / feltöltés
                              </Button>
                              <span className={SETTINGS_UI.helper}>Drag & drop vagy Ctrl/Cmd+V.</span>
                            </div>
                            <Input
                              ref={chartImageInputRef}
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className="hidden"
                              onChange={(event) => void handleChartFileInputChange(event)}
                            />

                            {chartParseStatus !== "idle" ? (
                              <p className={`mt-1 text-xs ${chartParseStatus === "error" ? "text-red-600" : "text-muted-foreground"}`}>
                                {chartParseMessage}
                              </p>
                            ) : null}

                            {parsedChartSeries ? (
                              <div className="mt-1 space-y-1 text-xs">
                                <p>
                                  Kinyert idősor: {formatIsoDateDot(parsedChartSeries.startDate)} -{" "}
                                  {formatIsoDateDot(parsedChartSeries.endDate)} ({parsedChartSeries.points.length} pont)
                                </p>
                                <p>
                                  Képből számolt évesített hozam:{" "}
                                  <span className="font-medium">{parsedChartSeries.derivedAnnualYieldPercent.toFixed(2)}%</span>
                                </p>
                                <p>
                                  Feldolgozási biztonság: {Math.round(parsedChartSeries.confidence * 100)}%
                                  {yieldSourceMode === "ocr" && effectiveYieldSourceMode === "ocr"
                                    ? " - OCR idősor aktív"
                                    : " - OCR idősor készen áll, de nem aktív"}
                                </p>
                                <p>Aktív hozamforrás: {effectiveYieldSourceMode === "manual" ? "Kézi" : effectiveYieldSourceMode === "fund" ? "MNB" : "OCR"}</p>
                                <p>
                                  Felismert nézet:{" "}
                                  {parsedChartSeries.detectedGranularity === "daily"
                                    ? "Napi"
                                    : parsedChartSeries.detectedGranularity === "weekly"
                                      ? "Heti"
                                      : parsedChartSeries.detectedGranularity === "monthly"
                                        ? "Havi"
                                        : parsedChartSeries.detectedGranularity === "yearly"
                                          ? "Éves"
                                          : "Ismeretlen"}
                                  {parsedChartSeries.interpolationApplied ? " (napi pontok interpolálva)" : ""}
                                </p>
                                {parsedChartSeries.diagnostics?.map((diagnostic, index) => (
                                  <p key={`${diagnostic}-${index}`} className="text-amber-700">
                                    {diagnostic}
                                  </p>
                                ))}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={clearParsedChartSeries}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                  Kép eltávolítása
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className={`pt-2 border-t ${isSettingsEseti ? "opacity-60" : ""}`}>
                      <Collapsible open={isCalendarRangeOpen} onOpenChange={setIsCalendarRangeOpen}>
                        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-1 py-1 text-left hover:bg-muted/50 transition-colors">
                          <span className={SETTINGS_UI.label}>Naptár szerinti számolás</span>
                          <ChevronDown
                            className={`h-4 w-4 text-muted-foreground transition-transform ${
                              isCalendarRangeOpen ? "rotate-180" : ""
                            }`}
                          />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-2">
                          <div className={MOBILE_LAYOUT.yearlySecondaryGrid}>
                            <div className="space-y-1">
                              <Label className={SETTINGS_UI.label} htmlFor="durationFromInput">
                                Futamidő tól (ÉÉÉÉ.HH.NN)
                              </Label>
                              <div className="relative">
                                <Input
                                  id="durationFromInput"
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="2019.04.05 / 20190405"
                                  value={durationFromInput}
                                  onChange={(e) => {
                                    setDurationSource("dates")
                                    setDurationFromInput(e.target.value)
                                  }}
                                  onBlur={() => {
                                    setDurationSource("dates")
                                    const parsed = parseHuDateInput(durationFromInput)
                                    if (parsed) setDurationFromInput(formatHuDate(parsed))
                                  }}
                                  disabled={isSettingsEseti}
                                  className={`${MOBILE_LAYOUT.inputHeight} ${SETTINGS_UI.field} pr-9`}
                                />
                                <Popover open={durationFromPickerOpen} onOpenChange={setDurationFromPickerOpen}>
                                  <PopoverTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      disabled={isSettingsEseti}
                                      className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground"
                                      aria-label="Dátum választása (tól)"
                                    >
                                      <CalendarIcon className="h-4 w-4" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent align="end" className="w-auto p-0">
                                    <Calendar
                                      mode="single"
                                      selected={parsedDurationFrom ?? undefined}
                                      defaultMonth={parsedDurationFrom ?? undefined}
                                      onSelect={(date) => {
                                        if (!date) return
                                        setDurationSource("dates")
                                        setDurationFromInput(formatHuDate(date))
                                        setDurationFromPickerOpen(false)
                                      }}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className={SETTINGS_UI.label} htmlFor="durationToInput">
                                Futamidő ig (ÉÉÉÉ.HH.NN)
                              </Label>
                              <div className="relative">
                                <Input
                                  id="durationToInput"
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="2026.04.07 / 20260407"
                                  value={durationToInput}
                                  onChange={(e) => {
                                    setDurationSource("dates")
                                    setDurationToInput(e.target.value)
                                  }}
                                  onBlur={() => {
                                    setDurationSource("dates")
                                    const parsed = parseHuDateInput(durationToInput)
                                    if (parsed) setDurationToInput(formatHuDate(parsed))
                                  }}
                                  disabled={isSettingsEseti}
                                  className={`${MOBILE_LAYOUT.inputHeight} ${SETTINGS_UI.field} pr-9`}
                                />
                                <Popover open={durationToPickerOpen} onOpenChange={setDurationToPickerOpen}>
                                  <PopoverTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      disabled={isSettingsEseti}
                                      className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground"
                                      aria-label="Dátum választása (ig)"
                                    >
                                      <CalendarIcon className="h-4 w-4" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent align="end" className="w-auto p-0">
                                    <Calendar
                                      mode="single"
                                      selected={parsedDurationTo ?? undefined}
                                      defaultMonth={parsedDurationTo ?? undefined}
                                      onSelect={(date) => {
                                        if (!date) return
                                        setDurationSource("dates")
                                        setDurationToInput(formatHuDate(date))
                                        setDurationToPickerOpen(false)
                                      }}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                          </div>
                          {durationDateError ? (
                            <p className="mt-2 text-xs text-destructive">{durationDateError}</p>
                          ) : (
                            <p className={SETTINGS_UI.helper}>A dátumtartomány automatikusan napokra állítja a futamidőt.</p>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </div>

                  {(
                    minimumAnnualFeeLabel ||
                    cigEsszenciaeDurationPolicyLabel ||
                    generaliKabalaDurationLabel ||
                    generaliMylifeDurationPolicyLabel ||
                    generaliMylifePaymentModeLabel ||
                    cigDurationPolicyLabel ||
                    ((selectedProduct === "alfa_fortis" || selectedProduct === "alfa_jade" || selectedProduct === "alfa_jovokep" || selectedProduct === "alfa_jovotervezo" || selectedProduct === "alfa_premium_selection" || selectedProduct === "alfa_zen" || selectedProduct === "alfa_zen_eur" || selectedProduct === "alfa_zen_pro" || selectedProduct === "generali_kabala" || selectedProduct === "generali_mylife_extra_plusz" || selectedProduct === "cig_nyugdijkotvenye" || selectedProduct === "cig_esszenciae") && isSettingsEseti) ||
                    (selectedProduct === "alfa_premium_selection" && inputs.enableTaxCredit && !isSettingsEseti) ||
                    shouldWarnFortisAgeClamp ||
                    shouldWarnJovokepAgeClamp ||
                    isSettingsEseti
                  ) && (
                    <div className={`flex flex-wrap items-center gap-3 text-xs ${isSettingsEseti ? "text-muted-foreground/70" : "text-muted-foreground"}`}>
                      {minimumAnnualFeeLabel && <p>Minimum éves díj: {minimumAnnualFeeLabel}</p>}
                      {cigEsszenciaeDurationPolicyLabel && <p>{cigEsszenciaeDurationPolicyLabel}</p>}
                      {cigDurationPolicyLabel && <p>{cigDurationPolicyLabel}</p>}
                      {generaliKabalaDurationLabel && <p>Tartam: {generaliKabalaDurationLabel}</p>}
                      {generaliMylifeDurationPolicyLabel && <p>{generaliMylifeDurationPolicyLabel}</p>}
                      {generaliMylifePaymentModeLabel && <p>{generaliMylifePaymentModeLabel}</p>}
                      {selectedProduct === "alfa_fortis" && isSettingsEseti && (
                        <p>
                          Eseti minimum díj:{" "}
                          {inputs.currency === "EUR"
                            ? `${formatNumber(fortisVariantConfig.minExtraordinaryPayment)} Euro`
                            : inputs.currency === "USD"
                              ? `${formatNumber(fortisVariantConfig.minExtraordinaryPayment)} USD`
                              : `${formatNumber(fortisVariantConfig.minExtraordinaryPayment)} Ft`}
                        </p>
                      )}
                      {selectedProduct === "alfa_jade" && isSettingsEseti && (
                        <p>
                          Eseti minimum díj:{" "}
                          {inputs.currency === "USD"
                            ? `${formatNumber(jadeVariantConfig.minExtraordinaryPayment)} USD`
                            : `${formatNumber(jadeVariantConfig.minExtraordinaryPayment)} Euro`}
                        </p>
                      )}
                      {selectedProduct === "alfa_jovokep" && isSettingsEseti && (
                        <p>Eseti minimum díj: {`${formatNumber(JOVOKEP_MIN_EXTRAORDINARY_PAYMENT)} Ft`}</p>
                      )}
                      {selectedProduct === "alfa_jovotervezo" && isSettingsEseti && (
                        <p>Eseti minimum díj: {`${formatNumber(JOVOTERVEZO_MIN_EXTRAORDINARY_PAYMENT)} Ft`}</p>
                      )}
                      {selectedProduct === "alfa_exclusive_plus" && isSettingsEseti && (
                        <p>Eseti minimum díj: {`${formatNumber(ALFA_EXCLUSIVE_PLUS_MIN_EXTRAORDINARY_PAYMENT)} Ft`}</p>
                      )}
                      {(selectedProduct === "allianz_eletprogram" || selectedProduct === "allianz_bonusz_eletprogram") &&
                        isSettingsEseti &&
                        allianzExtraordinaryMinimumLabel && (
                          <p>Eseti minimum díj: {allianzExtraordinaryMinimumLabel}</p>
                        )}
                      {selectedProduct === "alfa_premium_selection" && isSettingsEseti && (
                        <p>
                          Eseti minimum díj:{" "}
                          {premiumSelectionVariantConfig.currency === "EUR"
                            ? `${formatNumber(premiumSelectionVariantConfig.minExtraordinaryPayment)} Euro`
                            : premiumSelectionVariantConfig.currency === "USD"
                              ? `${formatNumber(premiumSelectionVariantConfig.minExtraordinaryPayment)} USD`
                            : `${formatNumber(premiumSelectionVariantConfig.minExtraordinaryPayment)} Ft`}
                        </p>
                      )}
                      {selectedProduct === "alfa_premium_selection" && inputs.enableTaxCredit && !isSettingsEseti && (
                        <p>Minimum tartam: {`${formatNumber(PREMIUM_SELECTION_NY06_MIN_DURATION_YEARS)} év`}</p>
                      )}
                      {(selectedProduct === "alfa_zen" || selectedProduct === "alfa_zen_eur") && isSettingsEseti && (
                        <p>
                          Eseti minimum díj:{" "}
                          {`${formatNumber(ALFA_ZEN_MIN_EXTRAORDINARY_PAYMENT)} ${getAlfaZenVariantConfig(undefined, inputs.currency).currency === "USD" ? "USD" : "Euro"}`}
                        </p>
                      )}
                      {selectedProduct === "alfa_zen_pro" && isSettingsEseti && (
                        <p>
                          Eseti minimum díj:{" "}
                          {(() => {
                            const variantConfig = getZenProVariantConfig(undefined, inputs.currency)
                            const suffix =
                              variantConfig.currency === "EUR" ? "Euro" : variantConfig.currency === "USD" ? "USD" : "Ft"
                            return `${formatNumber(variantConfig.minExtraordinaryPayment)} ${suffix}`
                          })()}
                        </p>
                      )}
                      {selectedProduct === "generali_kabala" && isSettingsEseti && (
                        <p>Eseti minimum díj: {`${formatNumber(GENERALI_KABALA_U91_MIN_EXTRAORDINARY_PAYMENT)} Ft`}</p>
                      )}
                      {selectedProduct === "generali_mylife_extra_plusz" && isSettingsEseti && (
                        <p>Eseti minimum díj: {`${formatNumber(GENERALI_MYLIFE_EXTRA_PLUSZ_MIN_EXTRAORDINARY_PAYMENT)} Ft`}</p>
                      )}
                      {selectedProduct === "generali_mylife_extra_plusz" && (
                        <p>Rendszeres pénzkivonás minimum: {`${formatNumber(GENERALI_MYLIFE_EXTRA_PLUSZ_MIN_REGULAR_WITHDRAWAL_MONTHLY)} Ft/hó`}</p>
                      )}
                      {selectedProduct === "cig_nyugdijkotvenye" && isSettingsEseti && (
                        <p>Eseti minimum díj: {`${formatNumber(CIG_NYUGDIJKOTVENYE_MIN_EXTRAORDINARY_PAYMENT)} Ft`}</p>
                      )}
                      {selectedProduct === "cig_esszenciae" && isSettingsEseti && (
                        <p>
                          Eseti minimum díj:{" "}
                          {(() => {
                            const variantConfig = getCigEsszenciaeVariantConfig(undefined, inputs.currency)
                            const suffix = variantConfig.currency === "EUR" ? "Euro" : "Ft"
                            return `${formatNumber(variantConfig.minExtraordinaryPayment)} ${suffix}`
                          })()}
                        </p>
                      )}
                      {selectedProduct === "cig_nyugdijkotvenye" && (
                        <p>Rendszeres pénzkivonás minimum: {`${formatNumber(CIG_NYUGDIJKOTVENYE_MIN_REGULAR_WITHDRAWAL_MONTHLY)} Ft/hó`}</p>
                      )}
                      {shouldWarnFortisAgeClamp && <p className="text-amber-600">A belépési életkor Fortisnál 16-70 év között kerül figyelembe vételre.</p>}
                      {shouldWarnJovokepAgeClamp && (
                        <p className="text-amber-600">
                          A belépési életkor Jövőképnél 16-{jovokepMaxAllowedEntryAge} év között kerül figyelembe vételre (max. 75 év lejáratkor).
                        </p>
                      )}
                      {shouldWarnGeneraliPensionAgeClamp && (
                        <p className="text-amber-600">
                          A Kabala Nyugdíj variánsnál a belépési életkor 15-55 év között kerül figyelembe vételre.
                        </p>
                      )}
                      {isSettingsEseti ? <p>Az eseti futamidő legfeljebb a fő számla futamideje lehet.</p> : null}
                    </div>
                  )}

                  {inputs.currency === "EUR" || inputs.currency === "USD" ? (
                    <div className={`space-y-2 ${isSettingsEseti ? "opacity-60" : ""}`}>
                      <Label htmlFor={inputs.currency === "USD" ? "usdToHufRate" : "eurToHufRate"} className="text-xs text-muted-foreground">
                        {inputs.currency === "USD" ? "USD/HUF árfolyam" : "EUR/HUF árfolyam"}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id={inputs.currency === "USD" ? "usdToHufRate" : "eurToHufRate"}
                          type="text"
                          inputMode="numeric"
                          disabled={isSettingsEseti}
                          value={
                            editingFields[inputs.currency === "USD" ? "usdToHufRate" : "eurToHufRate"]
                              ? String(inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate)
                              : formatNumber(inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate)
                          }
                          onFocus={() =>
                            setFieldEditing(inputs.currency === "USD" ? "usdToHufRate" : "eurToHufRate", true)
                          }
                          onBlur={() =>
                            setFieldEditing(inputs.currency === "USD" ? "usdToHufRate" : "eurToHufRate", false)
                          }
                          onChange={(e) => {
                            if (isSettingsEseti) return
                            const parsed = parseNumber(e.target.value)
                            if (!isNaN(parsed)) {
                              if (inputs.currency === "USD") {
                                setInputs({ ...inputs, usdToHufRate: parsed })
                              } else {
                                setInputs({ ...inputs, eurToHufRate: parsed })
                              }
                              setEurRateManuallyChanged(true)
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => loadFxRate(inputs.currency as "EUR" | "USD")}
                          disabled={isLoadingFx || isSettingsEseti}
                          className="shrink-0 bg-transparent"
                        >
                          {isLoadingFx ? "Betöltés..." : "Aktuális árfolyam"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {fxState.source === "live" && (
                          <>
                            <span className="text-emerald-600 font-medium">Élő árfolyam</span>
                            {fxState.date && ` (${fxDate})`}
                          </>
                        )}
                        {fxState.source === "cache" && (
                          <>
                            <span className="text-blue-600 font-medium">Gyorsítótárból betöltve</span>
                            {fxState.date && ` (${fxDate})`}
                          </>
                        )}
                        {fxState.source === "default" && (
                          <span className="text-amber-600 font-medium">Alapértelmezett érték (400)</span>
                        )}
                        {eurRateManuallyChanged && (
                          <span className="block text-muted-foreground mt-1">Manuálisan módosítva</span>
                        )}
                      </p>
                    </div>
                  ) : null}

                  <div className={`flex items-center gap-2 ${isSettingsEseti ? "opacity-60" : ""}`}>
                    <Checkbox
                      id="keepYearlyPayment"
                      disabled={isSettingsEseti}
                      checked={isSettingsEseti ? esetiBaseInputs.keepYearlyPayment : inputs.keepYearlyPayment}
                      onCheckedChange={(checked) => {
                        if (isSettingsEseti) {
                          setEsetiBaseInputs((prev) => ({ ...prev, keepYearlyPayment: checked === true }))
                        } else {
                          setInputs({ ...inputs, keepYearlyPayment: checked === true })
                        }
                      }}
                    />
                    <Label htmlFor="keepYearlyPayment" className="cursor-pointer">
                      Éves díjat tart
                    </Label>
                  </div>

                  {/* Tax Credit Section */}
                  <div
                    className={`pt-4 border-t space-y-4 ${
                      isTaxCreditLockedByCurrentView || !isTaxCreditSupportedForSelectedProduct ? "opacity-60" : ""
                    }`}
                  >
                    <label
                      className={`flex items-center gap-3 ${
                        isTaxCreditLockedByCurrentView ||
                        !isTaxCreditSupportedForSelectedProduct ||
                        isTaxCreditMandatoryForSelectedProduct
                          ? "cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <Checkbox
                        checked={inputs.enableTaxCredit}
                        onCheckedChange={(checked) => {
                          if (
                            !isTaxCreditLockedByCurrentView &&
                            isTaxCreditSupportedForSelectedProduct &&
                            !isTaxCreditMandatoryForSelectedProduct
                          ) {
                            const isEnabled = checked === true
                            setInputs({
                              ...inputs,
                              enableTaxCredit: isEnabled,
                              taxCreditYieldPercent: isEnabled ? 1 : inputs.taxCreditYieldPercent,
                            })
                          }
                        }}
                        disabled={
                          isTaxCreditLockedByCurrentView ||
                          !isTaxCreditSupportedForSelectedProduct ||
                          isTaxCreditMandatoryForSelectedProduct
                        }
                        className={`w-5 h-5 ${
                          isTaxCreditMandatoryForSelectedProduct
                            ? "[&[data-state=checked]]:bg-muted [&[data-state=checked]]:border-muted-foreground/40"
                            : ""
                        }`}
                      />
                      <span>Adójóváírás bekapcsolása</span>
                    </label>
                    {isTaxCreditMandatoryForSelectedProduct ? (
                      <p className="text-xs text-muted-foreground">
                        Ennél a terméknél az adójóváírás kötelező, ezért automatikusan bekapcsolt állapotban marad.
                      </p>
                    ) : null}
                    {!isTaxCreditSupportedForSelectedProduct ? (
                      <p className="text-xs text-muted-foreground">
                        Ennél a terméknél nincs adójóváírás.
                      </p>
                    ) : null}
                    {isTaxCreditLockedByCurrentView ? (
                      <p className="text-xs text-muted-foreground">
                        Itt csak megjelenítjük az alapbeállításokban kiválasztott adójóváírás állapotot.
                      </p>
                    ) : null}
                      {!isTaxCreditLockedByCurrentView && isTaxCreditSupportedForSelectedProduct && inputs.enableTaxCredit && (
                        <>
                      <div className="space-y-2">
                        <Label>Adójóváírás mértéke (%)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={inputs.taxCreditRatePercent}
                          onChange={(e) => setInputs({ ...inputs, taxCreditRatePercent: Number(e.target.value) })}
                          min={0}
                          max={100}
                          step={0.1}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Adójóváírás hozama (%)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={inputs.taxCreditYieldPercent}
                          onChange={(e) => setInputs({ ...inputs, taxCreditYieldPercent: Number(e.target.value) || 0 })}
                          min={0}
                          max={100}
                          step={0.1}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Maximális adójóváírás évente ({results.currency})</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={
                            editingFields.taxCreditCapPerYear
                              ? String(inputs.taxCreditCapPerYear)
                              : formatNumber(inputs.taxCreditCapPerYear ?? 0)
                          }
                          onFocus={() => setFieldEditing("taxCreditCapPerYear", true)}
                          onBlur={() => setFieldEditing("taxCreditCapPerYear", false)}
                          onChange={(e) => {
                            const parsed = parseNumber(e.target.value)
                            if (!isNaN(parsed)) setInputs({ ...inputs, taxCreditCapPerYear: parsed })
                          }}
                        />
                      </div>

                      <div className={MOBILE_LAYOUT.yearlySecondaryGrid}>
                        <div className="space-y-2">
                          <Label>Adójóváírás kezdete (év)</Label>
                          <Input
                            type="number"
                            inputMode="numeric"
                            value={inputs.taxCreditStartYear || 1}
                            onChange={(e) => setInputs({ ...inputs, taxCreditStartYear: Number(e.target.value) || 1 })}
                            min={1}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Adójóváírás vége (év)</Label>
                          <Input
                            type="number"
                            inputMode="numeric"
                            value={inputs.taxCreditEndYear || ""}
                            onChange={(e) => setInputs({ ...inputs, taxCreditEndYear: Number(e.target.value) || 0 })}
                            min={0}
                            placeholder="0 = nincs"
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          checked={inputs.stopTaxCreditAfterFirstWithdrawal}
                          onCheckedChange={(checked) =>
                            setInputs({ ...inputs, stopTaxCreditAfterFirstWithdrawal: checked === true })
                          }
                          className="w-5 h-5"
                        />
                        <span>Adójóváírás leállítása első pénzkivonás után</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          checked={inputs.taxCreditCalendarPostingEnabled === true}
                          onCheckedChange={(checked) =>
                            setInputs({ ...inputs, taxCreditCalendarPostingEnabled: checked === true })
                          }
                          className="w-5 h-5"
                        />
                        <span>Naptár szerinti NAV-jóváírás (június 20, első évforduló után)</span>
                      </label>

                      <p className="text-xs text-muted-foreground">
                        Ha nincs bepipálva, az adójóváírás az első hónaptól kerül jóváírásra a jelenlegi logika szerint.
                      </p>

                      <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <Checkbox
                            checked={taxCreditNotUntilRetirement}
                            onCheckedChange={(checked) => setTaxCreditNotUntilRetirement(checked === true)}
                            className="w-5 h-5"
                          />
                          <span>Nem nyugdíjig (20% visszafizetés)</span>
                        </label>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {taxCreditNotUntilRetirement
                              ? "Végösszeg adójóváírással (20% büntetéssel)"
                              : "Végösszeg adójóváírással"}
                          </span>
                          <span className="font-semibold tabular-nums">
                            {formatCurrency(
                              getRealValue(
                                taxCreditNotUntilRetirement ? endBalanceWithTaxCreditPenalty : results.endBalance,
                              ),
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Végösszeg adójóváírás nélkül</span>
                          <span className="font-semibold tabular-nums">
                            {formatCurrency(getRealValue(endBalanceWithoutTaxCredit))}
                          </span>
                        </div>
                      </div>
                        </>
                  )}
                  </div>
                </CardContent>
              </Card>

              <Card className="w-full p-4 md:p-6">
                <Collapsible open={isPresetCardOpen} onOpenChange={setIsPresetCardOpen}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="px-0 pt-0 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <CardTitle>Biztosító és termékválasztó</CardTitle>
                        <ChevronDown
                          className={`h-5 w-5 text-muted-foreground transition-transform ${
                            isPresetCardOpen ? "transform rotate-180" : ""
                          }`}
                        />
                      </div>
                </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                <CardContent className="px-0 pb-0">
                    <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="preset-insurer">Biztosító</Label>
                            <Select value={selectedInsurer ?? undefined} onValueChange={(value) => setSelectedInsurer(value)}>
                              <SelectTrigger id="preset-insurer">
                                <SelectValue placeholder="Válassz biztosítót" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Alfa">Alfa</SelectItem>
                                <SelectItem value="Allianz">Allianz</SelectItem>
                                <SelectItem value="CIG Pannonia">CIG Pannonia</SelectItem>
                                <SelectItem value="Generali">Generali</SelectItem>
                                <SelectItem value="Grupama">Grupama</SelectItem>
                                <SelectItem value="KnH">KnH</SelectItem>
                                <SelectItem value="Magyar Posta">Magyar Posta</SelectItem>
                                <SelectItem value="MetLife">MetLife</SelectItem>
                                <SelectItem value="NN">NN</SelectItem>
                                <SelectItem value="Signal Iduna">Signal Iduna</SelectItem>
                                <SelectItem value="Union">Union</SelectItem>
                                <SelectItem value="Uniqa">Uniqa</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="preset-product">Termék</Label>
                            <Select
                              value={selectedProduct ?? undefined}
                              onValueChange={(value) => setSelectedProduct(value)}
                              disabled={!selectedInsurer || getAvailableProducts().length === 0}
                            >
                              <SelectTrigger id="preset-product">
                                <SelectValue placeholder="Válassz terméket" />
                              </SelectTrigger>
                              <SelectContent>
                                {getAvailableProducts().map((product) => (
                                  <SelectItem key={product.value} value={product.value}>
                                    {product.label}
                                  </SelectItem>
                                ))}
                                {getAvailableProducts().length === 0 && (
                                  <SelectItem value="none" disabled>
                                    Nincs elérhető termék
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {selectedProduct && selectedInsurer && selectedProductMetadata && (
                          <>
                            {selectedProductMetadata.variants && selectedProductMetadata.variants.length > 0 ? (
                              <div className="mt-3 pt-3 border-t space-y-2">
                                {selectedProduct === "alfa_exclusive_plus" ? (
                                  <p className="text-xs text-muted-foreground">
                                    A termékváltozat automatikusan deviza + adójóváírás alapján választódik:
                                    bekapcsolva `NY-05`, kikapcsolva `TR-08`.
                                  </p>
                                ) : selectedProduct === "alfa_fortis" ? (
                                  <p className="text-xs text-muted-foreground">
                                    A Fortis termékváltozat automatikusan a deviza alapján választódik:
                                    HUF=`WL-02`, EUR=`WL-12`, USD=`WL-22`.
                                  </p>
                                ) : selectedProduct === "alfa_jade" ? (
                                  <p className="text-xs text-muted-foreground">
                                    A Jáde termékváltozat automatikusan a deviza alapján választódik:
                                    EUR=`TR19`, USD=`TR29`.
                                  </p>
                                ) : selectedProduct === "alfa_jovokep" ? (
                                  <p className="text-xs text-muted-foreground">
                                    A Jövőkép terméknél fix TR10 (HUF) variáns érhető el.
                                  </p>
                                ) : selectedProduct === "alfa_jovotervezo" ? (
                                  <p className="text-xs text-muted-foreground">
                                    A Jövőtervező terméknél fix TR03 (HUF) variáns érhető el.
                                  </p>
                                ) : selectedProduct === "alfa_premium_selection" ? (
                                  <p className="text-xs text-muted-foreground">
                                    A Premium Selection termékváltozat automatikusan deviza + adójóváírás alapján választódik:
                                    EUR + adójóváírás=`NY12`, EUR + adójóváírás nélkül=`TR18`, USD + adójóváírás=`NY22`,
                                    USD + adójóváírás nélkül=`TR28`, HUF + adójóváírás=`NY06`, HUF + adójóváírás nélkül=`TR09`.
                                  </p>
                                ) : selectedProduct === "alfa_zen" || selectedProduct === "alfa_zen_eur" ? (
                                  <p className="text-xs text-muted-foreground">
                                    Az Alfa Zen termékváltozat automatikusan deviza alapján választódik:
                                    EUR=`NY13`, USD=`NY23`.
                                  </p>
                                ) : selectedProduct === "alfa_zen_pro" ? (
                                  <p className="text-xs text-muted-foreground">
                                    Az Alfa Zen Pro termékváltozat automatikusan deviza alapján választódik:
                                    HUF=`NY-08`, EUR=`NY-14`, USD=`NY-24`.
                                  </p>
                                ) : selectedProduct === "nn_motiva_158" ? (
                                  <p className="text-xs text-muted-foreground">
                                    Az NN Motiva termékváltozat automatikusan deviza alapján választódik:
                                    HUF=`158`, EUR=`168`.
                                  </p>
                                ) : selectedProduct === "union_vienna_time" ? (
                                  <div className="space-y-2 text-xs text-muted-foreground">
                                    <p>
                                      A UNION Vienna Time terméknél a variáns csatorna-profil alapján választódik:
                                      Erste=`564`, Standard=`584`, Select=`606` (V1-ben HUF-only).
                                    </p>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Csatorna profil</Label>
                                      <Select
                                        value={unionViennaTimeChannelProfile}
                                        onValueChange={(value) =>
                                          setUnionViennaTimeChannelProfile(value as UnionViennaTimeChannelProfile)
                                        }
                                      >
                                        <SelectTrigger className="h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="erste">Erste (564)</SelectItem>
                                          <SelectItem value="standard">Standard (584)</SelectItem>
                                          <SelectItem value="select">Select (606)</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                ) : selectedProduct === "uniqa_eletcel_275" ? (
                                  <p className="text-xs text-muted-foreground">
                                    A UNIQA Életcél terméknél V1-ben fix 275 (HUF) variáns érhető el.
                                  </p>
                                ) : selectedProduct === "uniqa_premium_life_190" ? (
                                  <p className="text-xs text-muted-foreground">
                                    A UNIQA Premium Life terméknél V1-ben fix 190 (HUF) variáns érhető el.
                                  </p>
                                ) : selectedProduct === "groupama_next" ? (
                                  <div className="space-y-2 text-xs text-muted-foreground">
                                    <p>
                                      A Groupama Next terméknél V1-ben 3 fix termékrész-arány választható:
                                      100/0, 75/25, 0/100 (UL/hagyományos).
                                    </p>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Termékrész arány</Label>
                                      <Select
                                        value={groupamaNextAllocationProfile}
                                        onValueChange={(value) =>
                                          setGroupamaNextAllocationProfile(value as GroupamaNextVariant)
                                        }
                                      >
                                        <SelectTrigger className="h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="ul100-trad0">100% UL / 0% hagyományos</SelectItem>
                                          <SelectItem value="ul75-trad25">75% UL / 25% hagyományos</SelectItem>
                                          <SelectItem value="ul0-trad100">0% UL / 100% hagyományos</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                ) : selectedProduct === "groupama_easy" ? (
                                  <p className="text-xs text-muted-foreground">
                                    A Groupama Easy terméknél V1-ben HUF variáns érhető el, az adójóváírás külön kapcsolható.
                                  </p>
                                ) : selectedProduct === "union_vienna_age_505" ? (
                                  <div className="space-y-2 text-xs text-muted-foreground">
                                    <p>
                                      A UNION Vienna Age 505 termékváltozat automatikusan deviza alapján választódik:
                                      HUF/EUR/USD.
                                    </p>
                                    <div className="flex items-center justify-between gap-3 rounded border p-2">
                                      <div>
                                        <Label className="text-xs">Díjvisszatérítés jogosultság (10/15/20. év)</Label>
                                        <p className="text-[11px] text-muted-foreground">
                                          Ha részvisszavásárlás történt a folyamatos díjas számláról, kapcsold ki.
                                        </p>
                                      </div>
                                      <Switch
                                        checked={union505LoyaltyBonusEligible}
                                        onCheckedChange={(checked) => setUnion505LoyaltyBonusEligible(checked)}
                                      />
                                    </div>
                                  </div>
                                ) : selectedProduct === "signal_elorelato_ul001" ? (
                                  <div className="space-y-2 text-xs text-muted-foreground">
                                    <p>A Signal UL001-hez bővített V1 profilválasztás aktív.</p>
                                    <div className="grid gap-2 md:grid-cols-3">
                                      <div className="space-y-1">
                                        <Label className="text-xs">Díjfizetési mód profil</Label>
                                        <Select
                                          value={signalUl001PaymentMethodProfile}
                                          onValueChange={(value) =>
                                            setSignalUl001PaymentMethodProfile(value as SignalElorelatoUl001PaymentMethodProfile)
                                          }
                                        >
                                          <SelectTrigger className="h-8">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="bank-transfer">Átutalás</SelectItem>
                                            <SelectItem value="direct-debit">Csoportos beszedés</SelectItem>
                                            <SelectItem value="postal-check">Csekk</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs">VAK profil</Label>
                                        <Select
                                          value={signalUl001VakProfile}
                                          onValueChange={(value) => setSignalUl001VakProfile(value as SignalElorelatoUl001VakProfile)}
                                        >
                                          <SelectTrigger className="h-8">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="standard">Normál (2.00%)</SelectItem>
                                            <SelectItem value="reduced-funds">Kivételes alapok (1.60%)</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs">Lojalitási bónusz</Label>
                                        <Select
                                          value={signalUl001LoyaltyBonusEnabled ? "on" : "off"}
                                          onValueChange={(value) => setSignalUl001LoyaltyBonusEnabled(value === "on")}
                                        >
                                          <SelectTrigger className="h-8">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="on">Bekapcsolva</SelectItem>
                                            <SelectItem value="off">Kikapcsolva</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  </div>
                                ) : selectedProduct === "generali_kabala" ? (
                                  <div className="space-y-1 text-xs text-muted-foreground">
                                    <p>
                                      A Generali Kabala variáns az adójóváírás kapcsoló alapján választódik:
                                      kikapcsolva=`U91 Élet`, bekapcsolva=`U91 Nyugdíj`.
                                    </p>
                                  </div>
                                ) : selectedProduct === "generali_mylife_extra_plusz" ? (
                                  <div className="space-y-1 text-xs text-muted-foreground">
                                    <p>
                                      A Generali MyLife Extra Plusz variáns az adójóváírás kapcsoló alapján választódik:
                                      kikapcsolva=`U67P Élet`, bekapcsolva=`U67P Nyugdíj`.
                                    </p>
                                  </div>
                                ) : null}
                                {activeProductVariantMetadata ? (
                                  <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                                    <div>
                                      <span className="font-medium">Aktív variáns:</span> {activeProductVariantMetadata.label}
                                    </div>
                                    <div>
                                      <span className="font-medium">Termék típusa:</span> {activeProductVariantMetadata.productType}
                                    </div>
                                    <div>
                                      <span className="font-medium">MNB kód:</span> {activeProductVariantMetadata.mnbCode}
                                    </div>
                                    <div>
                                      <span className="font-medium">Termékkód:</span> {activeProductVariantMetadata.productCode}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            ) : (
                              <div className="mt-3 pt-3 border-t space-y-1 text-xs text-muted-foreground">
                                <div>
                                  <span className="font-medium">Termék típusa:</span> {selectedProductMetadata.productType}
                                </div>
                                <div>
                                  <span className="font-medium">MNB kód:</span> {selectedProductMetadata.mnbCode}
                                </div>
                                <div>
                                  <span className="font-medium">Termékkód:</span> {selectedProductMetadata.productCode}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                    </div>
                </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {/* New card for custom costs and bonuses */}
              <Card className="w-full p-4 md:p-6">
                <Collapsible open={isCustomCostsCardOpen} onOpenChange={setIsCustomCostsCardOpen}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="px-0 pt-0 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <CardTitle>Egyedi költségek és bónuszok</CardTitle>
                        <ChevronDown
                          className={`h-5 w-5 text-muted-foreground transition-transform ${
                            isCustomCostsCardOpen ? "transform rotate-180" : ""
                          }`}
                        />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="px-0 pb-0 space-y-6">
                  <div className="grid gap-2 md:grid-cols-[1fr_auto_auto] items-end p-3 rounded-lg border">
                    <div className="space-y-1">
                      <Label htmlFor="custom-preset-name">Sablon neve</Label>
                      <Input
                        id="custom-preset-name"
                        value={customPresetName}
                        onChange={(e) => setCustomPresetName(e.target.value)}
                        placeholder="Pl. Kiemelt költség/bónusz mix"
                        className="h-10"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-10"
                      onClick={() => void saveCurrentCustomPreset()}
                      disabled={!customPresetName.trim() || customEntryDefinitions.length === 0}
                    >
                      Mentés sablonként
                    </Button>
                    <Button type="button" variant="outline" className="h-10" onClick={() => void loadCustomPresets()}>
                      Lista frissítése
                    </Button>
                    <div className="space-y-1 md:col-span-3">
                      <Label htmlFor="custom-preset-select">Betöltés listából</Label>
                      <div className="flex flex-col gap-2 md:flex-row">
                        <Select value={selectedCustomPresetId} onValueChange={onSelectCustomPreset}>
                          <SelectTrigger id="custom-preset-select" className="h-10 w-full md:max-w-md">
                            <SelectValue placeholder="Válassz mentett sablont" />
                          </SelectTrigger>
                          <SelectContent>
                            {customPresets.map((preset) => (
                              <SelectItem key={preset.id} value={preset.id}>
                                {preset.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10"
                          onClick={() => void updateCurrentCustomPreset()}
                          disabled={!selectedCustomPresetId || customEntryDefinitions.length === 0}
                        >
                          Sablon frissítése
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          className="h-10"
                          onClick={() => void deleteCurrentCustomPreset()}
                          disabled={!selectedCustomPresetId}
                        >
                          Sablon törlése
                        </Button>
                      </div>
                    </div>
                    {customPresetError ? (
                      <p className="md:col-span-3 text-sm text-destructive">{customPresetError}</p>
                    ) : null}
                  </div>
                  {/* Management Fees Section */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-base border-b pb-2">Egyedi költségek</h3>
                    <div className="space-y-3">
                      {managementFees.map((fee, index) => (
                        <div key={fee.id} className="space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 space-y-2">
                              <Label className="text-sm flex items-center gap-1 flex-wrap">
                                <span>Rendszeres</span>
                                <Select
                                  value={fee.frequency}
                                  onValueChange={(value: ManagementFeeFrequency) => {
                                    updateManagementFee(fee.id, { frequency: value })
                                  }}
                                >
                                  <SelectTrigger className="h-6 w-auto px-2 py-0 text-sm font-normal inline-flex border-dashed">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="napi">napi</SelectItem>
                                    <SelectItem value="havi">havi</SelectItem>
                                    <SelectItem value="negyedéves">negyedéves</SelectItem>
                                    <SelectItem value="féléves">féléves</SelectItem>
                                    <SelectItem value="éves">éves</SelectItem>
                                  </SelectContent>
                                </Select>
                                <span>költség (</span>
                                <Select
                                  value={fee.valueType}
                                  onValueChange={(value: ManagementFeeValueType) => {
                                    updateManagementFee(fee.id, { valueType: value })
                                  }}
                                >
                                  <SelectTrigger className="h-6 w-auto px-2 py-0 text-sm font-normal inline-flex border-dashed">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="percent">%</SelectItem>
                                    <SelectItem value="amount">{results.currency}</SelectItem>
                                  </SelectContent>
                                </Select>
                                <span>)</span>
                                {customAccountOptions.length > 0 && (
                                  <>
                                    <span> rész</span>
                                    <Select
                                      value={normalizeCustomAccountForEditor(fee.account)}
                                      onValueChange={(value: CustomEntryAccount) => {
                                        updateManagementFee(fee.id, { account: normalizeCustomAccountForEditor(value) })
                                      }}
                                    >
                                      <SelectTrigger className="h-6 w-auto px-2 py-0 text-sm font-normal inline-flex border-dashed">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {customAccountOptions.map((option) => (
                                          <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </>
                                )}
                              </Label>
                              <Input
                                type="text"
                                value={fee.label}
                                onChange={(e) => updateManagementFee(fee.id, { label: e.target.value })}
                                placeholder={`Egyedi költség ${index + 1} neve`}
                                className="h-9"
                              />
                              <Input
                                type="text"
                                inputMode="numeric"
                                value={
                                  editingFields[`managementFee-${fee.id}`]
                                    ? String(fee.value)
                                    : formatNumber(fee.value)
                                }
                                onFocus={() => setFieldEditing(`managementFee-${fee.id}`, true)}
                                onBlur={() => setFieldEditing(`managementFee-${fee.id}`, false)}
                                onChange={(e) => {
                                  const parsed = parseNumber(e.target.value)
                                  if (!isNaN(parsed)) {
                                    if (fee.valueType !== "percent") {
                                      updateManagementFee(fee.id, { value: parsed })
                                      return
                                    }
                                    const selectedAccount = normalizeCustomAccountForEditor(fee.account)
                                    const otherPercentCostsOnSameAccount = managementFees.reduce((sum, otherFee) => {
                                      if (otherFee.id === fee.id) return sum
                                      if (otherFee.valueType !== "percent") return sum
                                      if (normalizeCustomAccountForEditor(otherFee.account) !== selectedAccount) return sum
                                      return sum + Math.max(0, otherFee.value ?? 0)
                                    }, 0)
                                    const acquisitionPercentForAccount =
                                      selectedAccount === "main" || selectedAccount === "eseti"
                                        ? Math.max(0, inputs.initialCostDefaultPercent ?? 0)
                                        : 0
                                    const maxAllowedForThisEntry = Math.max(
                                      0,
                                      100 - acquisitionPercentForAccount - otherPercentCostsOnSameAccount,
                                    )
                                    updateManagementFee(fee.id, { value: Math.min(parsed, maxAllowedForThisEntry) })
                                  }
                                }}
                                min={0}
                                className="h-11"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeManagementFee(fee.id)}
                              className="mt-8 text-muted-foreground hover:text-foreground p-2"
                              title="Törlés"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addManagementFee}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground py-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Költség hozzáadása</span>
                      </button>
                    </div>
                  </div>

                  {/* Bonuses Section */}
                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="font-semibold text-base border-b pb-2">Bónuszok</h3>
                    <div className="space-y-3">
                      {bonuses.map((bonus, index) => (
                        <div key={bonus.id} className="space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 space-y-2">
                              <Label className="text-sm flex items-center gap-1 flex-wrap">
                                <span>Bónusz (</span>
                                <Select
                                  value={bonus.valueType}
                                  onValueChange={(value: "percent" | "amount") => {
                                    updateBonus(bonus.id, { valueType: value })
                                  }}
                                >
                                  <SelectTrigger className="h-6 w-auto px-2 py-0 text-sm font-normal inline-flex border-dashed">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="percent">%</SelectItem>
                                    <SelectItem value="amount">{results.currency}</SelectItem>
                                  </SelectContent>
                                </Select>
                                <span>)</span>
                                {customAccountOptions.length > 0 && (
                                  <>
                                    <span> rész</span>
                                    <Select
                                      value={normalizeCustomAccountForEditor(bonus.account)}
                                      onValueChange={(value: CustomEntryAccount) => {
                                        updateBonus(bonus.id, { account: normalizeCustomAccountForEditor(value) })
                                      }}
                                    >
                                      <SelectTrigger className="h-6 w-auto px-2 py-0 text-sm font-normal inline-flex border-dashed">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {customAccountOptions.map((option) => (
                                          <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </>
                                )}
                              </Label>
                              <Input
                                type="text"
                                inputMode="numeric"
                                value={
                                  editingFields[`bonus-${bonus.id}`]
                                    ? String(bonus.value)
                                    : formatNumber(bonus.value)
                                }
                                onFocus={() => setFieldEditing(`bonus-${bonus.id}`, true)}
                                onBlur={() => setFieldEditing(`bonus-${bonus.id}`, false)}
                                onChange={(e) => {
                                  const parsed = parseNumber(e.target.value)
                                  if (!isNaN(parsed)) {
                                    updateBonus(bonus.id, { value: parsed })
                                  }
                                }}
                                min={0}
                                className="h-11"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeBonus(bonus.id)}
                              className="mt-8 text-muted-foreground hover:text-foreground p-2"
                              title="Törlés"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addBonus}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground py-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Bónusz hozzáadása</span>
                      </button>
                    </div>
                  </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            </div>
          </div>

          <div id="summary-section" className="hidden scroll-mt-28">
            <Card className="w-full p-4 md:p-6 bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/50 dark:border-purple-800/50">
              <Collapsible open={isServicesCardOpen} onOpenChange={setIsServicesCardOpen}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="px-0 pt-0 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle>Kockázati biztosítások és kiegészítő szolgáltatások</CardTitle>
                      <ChevronDown
                        className={`h-5 w-5 text-muted-foreground transition-transform ${
                          isServicesCardOpen ? "transform rotate-180" : ""
                        }`}
                      />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="px-0 pb-0 space-y-6">
                    {/* Risk Insurance Section */}
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          checked={enableRiskInsurance}
                          onCheckedChange={(checked) => setEnableRiskInsurance(checked === true)}
                          className="w-5 h-5"
                        />
                        <span className="text-sm font-medium">Kockázati biztosítás bekapcsolása</span>
                      </label>

                      {enableRiskInsurance && (
                        <>
                          <div className="space-y-2">
                            <Label>Kockázati biztosítás típusa</Label>
                            <Select value={riskInsuranceType} onValueChange={setRiskInsuranceType}>
                              <SelectTrigger>
                                <SelectValue placeholder="Válassz biztosítási típust" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="type1">Típus 1</SelectItem>
                                <SelectItem value="type2">Típus 2</SelectItem>
                                <SelectItem value="type3">Típus 3</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              Jelenleg csak kiválasztásra szolgál, később lesz egyedi költségszámítás
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>A havi díj hány %-a kockázati biztosítás költség?</Label>
                            <Input
                              type="number"
                              value={riskInsuranceFeePercentOfMonthlyPayment}
                              onChange={(e) => setRiskInsuranceFeePercentOfMonthlyPayment(Number(e.target.value))}
                              min={0}
                              max={100}
                              step={0.1}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Éves indexálás a kockázati költségre (%)</Label>
                            <Input
                              type="number"
                              value={riskInsuranceAnnualIndexPercent}
                              onChange={(e) => setRiskInsuranceAnnualIndexPercent(Number(e.target.value))}
                              min={0}
                              max={100}
                              step={0.1}
                            />
                          </div>

                          <div className={MOBILE_LAYOUT.yearlySecondaryGrid}>
                            <div className="space-y-2">
                              <Label>Kezdő év</Label>
                              <Input
                                type="number"
                                value={riskInsuranceStartYear}
                                onChange={(e) => setRiskInsuranceStartYear(Number(e.target.value) || 1)}
                                min={1}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Záró év</Label>
                              <Input
                                type="number"
                                value={riskInsuranceEndYear || ""}
                                onChange={(e) => {
                                  const value = e.target.value
                                  if (value === "" || value === "Végéig") {
                                    setRiskInsuranceEndYear(undefined)
                                  } else {
                                    setRiskInsuranceEndYear(Number(value) || undefined)
                                  }
                                }}
                                placeholder="Végéig"
                                min={0}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Additional Services Section */}
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="text-base font-semibold">Kiegészítő szolgáltatások</h3>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Előre definiált szolgáltatás hozzáadása</Label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <Checkbox
                              checked={yieldMonitoring.enabled}
                              onCheckedChange={(checked) => {
                                setYieldMonitoring({ ...yieldMonitoring, enabled: checked === true })
                              }}
                              className="w-5 h-5"
                            />
                            <span className="text-sm">Hozamfigyelő szolgáltatás</span>
                          </label>
                          
                          {yieldMonitoring.enabled && (
                            <div className="ml-8 space-y-2">
                              <Label className="text-sm font-medium">Hozamfigyelő szolgáltatás szabályai:</Label>
                              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside ml-2">
                                <li>1 eszközalap ingyenes (további eszközalapokra lehet díj)</li>
                                <li>
                                  EUR: ingyenes 1.500 €/év befizetés felett vagy 40.000 € egyenleg felett, különben 0,5 €/hó/eszközalap
                                </li>
                                <li>
                                  HUF: ingyenes 180.000 Ft/év befizetés felett vagy 2.000.000 Ft egyenleg felett, különben 100 Ft/hó/eszközalap
                                </li>
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          // TODO: Add custom cost functionality
                        }}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground py-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Egyedi költség hozzáadása</span>
                      </button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {totalExtraServicesCost > 0 && (
              <Card className="border-purple-200 dark:border-purple-800">
                <Collapsible open={isServicesCardOpen} onOpenChange={setIsServicesCardOpen}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-purple-600 dark:text-purple-400">Kiegészítő szolgáltatások</span>
                  </CardTitle>
                        <ChevronDown
                          className={`h-5 w-5 text-muted-foreground transition-transform ${
                            isServicesCardOpen ? "transform rotate-180" : ""
                          }`}
                        />
                      </div>
                </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-muted-foreground">Összes költség:</span>
                      <span className="text-2xl font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                        {formatCurrency(totalExtraServicesCost)}
                      </span>
                    </div>
                    {yieldMonitoring.enabled && (
                      <p className="text-xs text-muted-foreground">
                        Hozamfigyelő: {yieldMonitoring.fundCount} eszközalap
                      </p>
                    )}
                    {extraServices.length > 0 && (
                      <p className="text-xs text-muted-foreground">{extraServices.length} egyedi költség</p>
                    )}
                  </div>
                </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )}
          </div>

          <div id="yearly" className="lg:col-span-3 space-y-4 scroll-mt-28">
            <Card className="w-full p-4 md:p-6 bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/50 dark:border-purple-800/50">
              <Collapsible open={isServicesCardOpen} onOpenChange={setIsServicesCardOpen}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="px-0 pt-0 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle>Kockázati biztosítások és kiegészítő szolgáltatások</CardTitle>
                      <ChevronDown
                        className={`h-5 w-5 text-muted-foreground transition-transform ${
                          isServicesCardOpen ? "transform rotate-180" : ""
                        }`}
                      />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="px-0 pb-0 space-y-6">
                    {/* Risk Insurance Section */}
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          checked={enableRiskInsurance}
                          onCheckedChange={(checked) => setEnableRiskInsurance(checked === true)}
                          className="w-5 h-5"
                        />
                        <span className="text-sm font-medium">Kockázati biztosítás bekapcsolása</span>
                      </label>

                      {enableRiskInsurance && (
                        <>
                          <div className="space-y-2">
                            <Label>Kockázati biztosítás típusa</Label>
                            <Select value={riskInsuranceType} onValueChange={setRiskInsuranceType}>
                              <SelectTrigger>
                                <SelectValue placeholder="Válassz biztosítási típust" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="type1">Típus 1</SelectItem>
                                <SelectItem value="type2">Típus 2</SelectItem>
                                <SelectItem value="type3">Típus 3</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              Jelenleg csak kiválasztásra szolgál, később lesz egyedi költségszámítás
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>A havi díj hány %-a kockázati biztosítás költség?</Label>
                            <Input
                              type="number"
                              value={riskInsuranceFeePercentOfMonthlyPayment}
                              onChange={(e) => setRiskInsuranceFeePercentOfMonthlyPayment(Number(e.target.value))}
                              min={0}
                              max={100}
                              step={0.1}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Kockázati biztosítás fix havi díja (Ft)</Label>
                            <Input
                              type="number"
                              value={riskInsuranceMonthlyFeeAmount}
                              onChange={(e) => setRiskInsuranceMonthlyFeeAmount(Number(e.target.value))}
                              min={0}
                              step={100}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Éves indexálás a kockázati költségre (%)</Label>
                            <Input
                              type="number"
                              value={riskInsuranceAnnualIndexPercent}
                              onChange={(e) => setRiskInsuranceAnnualIndexPercent(Number(e.target.value))}
                              min={0}
                              max={100}
                              step={0.1}
                            />
                          </div>

                          <div className={MOBILE_LAYOUT.yearlySecondaryGrid}>
                            <div className="space-y-2">
                              <Label>Indulás éve</Label>
                              <Input
                                type="number"
                                value={riskInsuranceStartYear}
                                onChange={(e) => setRiskInsuranceStartYear(Number(e.target.value))}
                                min={1}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Leállás éve (0 = soha)</Label>
                              <Input
                                type="number"
                                value={riskInsuranceEndYear}
                                onChange={(e) => setRiskInsuranceEndYear(Number(e.target.value))}
                                min={0}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
            <Card
              id="summary"
              className={`w-full border-2 scroll-mt-28 ${activeSummaryTheme.card}`}
            >
              <CardHeader className="pb-2 md:pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg md:text-xl">
                  Összegzés - {summaryAccountLabels[summaryAccountViewKey]}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      const currentIndex = Math.max(0, summaryAccountsOrder.indexOf(summaryAccountViewKey))
                      const nextIndex = (currentIndex - 1 + summaryAccountsOrder.length) % summaryAccountsOrder.length
                      const nextSummaryView = summaryAccountsOrder[nextIndex]
                      if (nextSummaryView === "eseti") {
                        setYearlyAccountView(isPremiumSelectionNy06 ? "eseti_immediate_access" : "eseti")
                      } else {
                        setYearlyAccountView(nextSummaryView)
                      }
                    }}
                    aria-label="Előző számla"
                  >
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      const currentIndex = Math.max(0, summaryAccountsOrder.indexOf(summaryAccountViewKey))
                      const nextIndex = (currentIndex + 1) % summaryAccountsOrder.length
                      const nextSummaryView = summaryAccountsOrder[nextIndex]
                      if (nextSummaryView === "eseti") {
                        setYearlyAccountView(isPremiumSelectionNy06 ? "eseti_immediate_access" : "eseti")
                      } else {
                        setYearlyAccountView(nextSummaryView)
                      }
                    }}
                    aria-label="Következő számla"
                  >
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Netting checkboxes */}
                <div className="space-y-1.5 mb-4 pb-4 border-b">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={enableNetting}
                            onCheckedChange={(checked) => {
                              setEnableNetting(checked === true)
                              if (!checked) setIsCorporateBond(false)
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-sm font-medium">Nettósítás</span>
                        </label>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Kamatadó és szochó levonása a hozamból. A nettósítás a hozamra vonatkozik, a befizetett tőke adómentes. A számítás a hatályos magyar kamatadó és szochó szabályok egyszerűsített modellje.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {enableNetting && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={isCorporateBond}
                              onCheckedChange={(checked) => setIsCorporateBond(checked === true)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm font-medium">Céges kötés</span>
                          </label>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Csak kamatadó, szochó nélkül. Céges kötés esetén alacsonyabb adókulcs érvényes: 0-5 év: 15%, 5-10 év: 7,5%, 10+ év: adómentes.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={enableRealValue}
                            onCheckedChange={(checked) => setEnableRealValue(checked === true)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm font-medium">Reálérték</span>
                        </label>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          A reálérték számítás az inflációt is figyelembe veszi, így a jövőbeli értékeket mai vásárlóerőben mutatja.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {enableRealValue && (
                    <div className="ml-6 space-y-1">
                      <Label htmlFor="inflationRate" className="text-xs text-muted-foreground">
                        Éves átlagos infláció (%)
                      </Label>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Input
                          id="inflationRate"
                          type="number"
                          value={inflationRate}
                          onChange={(e) => {
                            setInflationRate(Number(e.target.value))
                            if (inflationAutoEnabled) setInflationAutoEnabled(false)
                          }}
                          min={0}
                          max={100}
                          step={0.1}
                          className="w-32 h-8 text-sm"
                        />
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Checkbox
                            checked={inflationAutoEnabled}
                            onCheckedChange={(checked) => setInflationAutoEnabled(checked === true)}
                            className="w-4 h-4"
                          />
                          KSH alapján
                        </label>
                        {!inflationAutoEnabled && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setInflationAutoEnabled(true)}
                          >
                            KSH vissza
                          </Button>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {inflationKshLoading && "KSH adat betöltése..."}
                        {!inflationKshLoading && inflationKshError && inflationKshError}
                        {!inflationKshLoading && !inflationKshError && inflationKshYear && inflationKshValue !== null && (
                          <>KSH {inflationKshYear}: {inflationKshValue.toFixed(1)}%</>
                        )}
                      </div>
                      {inflationAutoEnabled && realValueHasFuturePart && (
                        <div className="pt-1 space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Jövő infláció mód</Label>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Select
                              value={futureInflationMode}
                              onValueChange={(value) => setFutureInflationMode(value as FutureInflationMode)}
                            >
                              <SelectTrigger className="h-8 w-40 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fix">Fix</SelectItem>
                                <SelectItem value="converging">Konvergáló</SelectItem>
                              </SelectContent>
                            </Select>
                            {futureInflationMode === "converging" && (
                              <>
                                <Input
                                  type="number"
                                  value={futureInflationTargetRate}
                                  onChange={(e) => setFutureInflationTargetRate(Number(e.target.value))}
                                  min={0}
                                  max={12}
                                  step={0.1}
                                  className="w-28 h-8 text-xs"
                                  aria-label="Hosszú távú cél infláció"
                                />
                                <Input
                                  type="number"
                                  value={futureInflationConvergenceMonths}
                                  onChange={(e) => setFutureInflationConvergenceMonths(Number(e.target.value))}
                                  min={1}
                                  max={120}
                                  step={1}
                                  className="w-28 h-8 text-xs"
                                  aria-label="Konvergencia hónap"
                                />
                              </>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Múlt: KSH tényadat, jövő:{" "}
                            {futureInflationMode === "converging"
                              ? "célhoz simán közelítő pálya"
                              : "fix éves inflációs ráta"}.
                            {r0FromKsh !== null && (
                              <> r0: {r0FromKsh.toFixed(2)}% (utolsó 12 KSH hónap)</>
                            )}
                            {lastKshMonthLabel && <> | utolsó KSH hónap: {lastKshMonthLabel}</>}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-1">
                  <div className={`flex items-center justify-between rounded-lg p-3 md:p-4 ${activeSummaryTheme.metric}`}>
                    <span className="text-xs md:text-sm font-medium text-muted-foreground">Teljes befizetés</span>
                    <span className="text-lg md:text-xl font-bold tabular-nums">
                      {formatCurrency(getRealValue(activeSummaryTotals.totalContributions))}
                    </span>
                  </div>

                  <div className={`flex items-center justify-between rounded-lg p-3 md:p-4 ${activeSummaryTheme.metric}`}>
                    <span className="text-xs md:text-sm font-medium text-muted-foreground">Összes költség</span>
                    <span className="text-lg md:text-xl font-bold text-destructive tabular-nums">
                      {formatCurrency(getRealValue(activeSummaryTotals.totalCosts))}
                    </span>
                  </div>

                  {enableRiskInsurance && activeSummaryTotals.totalRiskInsuranceCost > 0 && (
                    <div className={`flex items-center justify-between rounded-lg p-3 md:p-4 ${activeSummaryTheme.metric}`}>
                      <span className="text-xs md:text-sm font-medium text-muted-foreground">
                        Ebből kockázati bizt.
                      </span>
                      <span className="text-lg md:text-xl font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                        {formatCurrency(getRealValue(activeSummaryTotals.totalRiskInsuranceCost))}
                      </span>
                    </div>
                  )}

                  <div className={`flex items-center justify-between rounded-lg p-3 md:p-4 ${activeSummaryTheme.metric}`}>
                    <span className="text-xs md:text-sm font-medium text-muted-foreground">Összes bónusz</span>
                    <span className="text-lg md:text-xl font-bold text-chart-2 tabular-nums">
                      {formatCurrency(getRealValue(activeSummaryTotals.totalBonus))}
                    </span>
                  </div>

                  <div className={`flex items-center justify-between rounded-lg p-3 md:p-4 ${activeSummaryTheme.metric}`}>
                    <span className="text-xs md:text-sm font-medium text-muted-foreground">Összes adójóváírás</span>
                    <span className="text-lg md:text-xl font-bold text-chart-3 tabular-nums">
                      {formatCurrency(getRealValue(activeSummaryTotals.totalTaxCredit))}
                    </span>
                  </div>

                  <div className={`flex items-center justify-between rounded-lg p-3 md:p-4 ${activeSummaryTheme.metric}`}>
                    <span className="text-xs md:text-sm font-medium text-muted-foreground">Teljes nettó hozam</span>
                    <span className="text-lg md:text-xl font-bold text-chart-1 tabular-nums">
                      {formatCurrency(getRealValue(activeSummaryTotals.totalInterestNet))}
                    </span>
                  </div>

                  {showSurrenderFinalBand && (
                    <div className={`flex items-center justify-between rounded-lg border border-primary/25 p-3 md:p-4 ${activeSummaryTheme.metric}`}>
                      <span className="text-xs md:text-sm font-medium text-muted-foreground">
                        Visszavásárlási érték
                      </span>
                      <span className="text-lg md:text-xl font-bold tabular-nums">
                        {formatCurrency(getRealValue(shouldApplyTaxCreditPenalty ? summarySurrenderWithPenalty : summaryBaseSurrenderValue))}
                      </span>
                    </div>
                  )}

                  <div className={`flex items-center justify-between rounded-lg p-3 md:p-4 sm:col-span-2 lg:col-span-1 ${activeSummaryTheme.final}`}>
                    <span className="text-xs md:text-sm font-medium">
                      Egyenleg a futamidő végén
                    </span>
                    <span className="text-xl md:text-2xl font-bold tabular-nums">
                      {formatCurrency(getRealValue(shouldApplyTaxCreditPenalty ? summaryBalanceWithPenalty : summaryBaseBalance))}
                    </span>
                  </div>
                </div>

                {/* Netting results display */}
                {enableNetting && finalNetData && (
                  <div className="space-y-3 pt-4 mt-4 border-t">
                    <div className="flex items-center justify-between rounded-lg bg-background p-2.5 md:p-3 border">
                      <span className="text-xs md:text-sm font-medium text-muted-foreground">Bruttó egyenleg</span>
                      <span className="text-base md:text-lg font-semibold tabular-nums">
                        {formatCurrency(getRealValue(finalNetData.grossBalance))}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-background p-2.5 md:p-3 border border-red-200 dark:border-red-800">
                      <div>
                        <span className="text-xs md:text-sm font-medium text-muted-foreground">Levonás összege</span>
                        <p className="text-xs text-muted-foreground">
                          {isCorporateBond ? "Csak kamatadó" : "Kamatadó + szochó"} (
                          {Math.round(finalNetData.taxRate * 100)}%)
                        </p>
                      </div>
                      <span className="text-base md:text-lg font-semibold text-red-600 dark:text-red-400 tabular-nums">
                        -{formatCurrency(getRealValue(finalNetData.taxDeduction))}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-background p-2.5 md:p-3 border border-emerald-200 dark:border-emerald-800">
                      <span className="text-xs md:text-sm font-medium text-muted-foreground">Nettó hozam</span>
                      <span className="text-base md:text-lg font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatCurrency(getRealValue(finalNetData.netProfit))}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-yellow-100 dark:bg-yellow-950/40 p-2.5 md:p-3 border border-yellow-300 dark:border-yellow-700">
                      <span className="text-xs md:text-sm font-semibold text-yellow-900 dark:text-yellow-300">
                        Nettó végösszeg
                      </span>
                      <span className="text-lg md:text-xl font-bold text-yellow-700 dark:text-yellow-400 tabular-nums">
                        {formatCurrency(getRealValue(finalNetData.netBalance))}
                      </span>
                    </div>

                    {/* Tax bracket info */}
                    <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md space-y-1">
                      <p className="font-medium">Adósávok ({isCorporateBond ? "céges" : "lakossági"})</p>
                      {isEsetiView ? (
                        <ul className="list-disc list-inside space-y-0.5">
                          <li>
                            0-3 év: {isCorporateBond ? "15%" : "28%"}{" "}
                            {!isCorporateBond && "(15% kamatadó + 13% szochó)"}
                          </li>
                          <li>
                            3-5 év: {isCorporateBond ? "7,5%" : "14%"} {!isCorporateBond && "(7,5% + 6,5%)"}
                          </li>
                          <li>5+ év: adómentes</li>
                        </ul>
                      ) : yearlyAccountView === "summary" ? (
                        <ul className="list-disc list-inside space-y-0.5">
                          <li>
                            Fő számla: 0-5 év / 5-10 év / 10+ év sávok ({isCorporateBond ? "15% / 7,5% / 0%" : "28% / 14% / 0%"})
                          </li>
                          <li>
                            Eseti számla: 0-3 év / 3-5 év / 5+ év sávok ({isCorporateBond ? "15% / 7,5% / 0%" : "28% / 14% / 0%"})
                          </li>
                        </ul>
                      ) : (
                        <ul className="list-disc list-inside space-y-0.5">
                          <li>
                            0-5 év: {isCorporateBond ? "15%" : "28%"}{" "}
                            {!isCorporateBond && "(15% kamatadó + 13% szochó)"}
                          </li>
                          <li>
                            5-10 év: {isCorporateBond ? "7,5%" : "14%"} {!isCorporateBond && "(7,5% + 6,5%)"}
                          </li>
                          <li>10+ év: adómentes</li>
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card id="yearly-table">
              <CardHeader className="sticky top-[96px] z-30 border-b bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:top-[53px]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-lg md:text-xl shrink-0">Éves bontás</CardTitle>
                  <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                  {isAccountSplitOpen && !isAllianzEletprogramView && !isEsetiView && (
                    <div className="flex items-center gap-1 border rounded-md p-1">
                      <Button
                        type="button"
                        variant={effectiveYearlyViewMode === "total" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setYearlyViewMode("total")}
                        className="h-7 text-xs px-2"
                        disabled={isYearlyReadOnly}
                      >
                        Összesített
                      </Button>
                      <Button
                        type="button"
                        variant={effectiveYearlyViewMode === "client" ? "default" : "ghost"}
                        size="sm"
                        className="text-xs"
                        onClick={() => setYearlyViewMode("client")}
                        disabled={isYearlyReadOnly}
                      >
                        Ügyfélérték számla
                      </Button>
                      <Button
                        type="button"
                        variant={effectiveYearlyViewMode === "invested" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setYearlyViewMode("invested")}
                        className="h-7 text-xs px-2"
                        disabled={isYearlyReadOnly}
                      >
                        Többletdíj számla
                      </Button>
                      {isTaxBonusSeparateAccount && (
                        <Button
                          type="button"
                          variant={effectiveYearlyViewMode === "taxBonus" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setYearlyViewMode("taxBonus")}
                          className="h-7 text-xs px-2"
                          disabled={isYearlyReadOnly}
                        >
                          Adójóváírás számla
                        </Button>
                      )}
                    </div>
                  )}
                  {/* </CHANGE> */}

                  {isPremiumSelectionNy06 && isEsetiView && (
                    <div className="flex items-center gap-1 border rounded-md p-1">
                      <Button
                        type="button"
                        variant={isEsetiImmediateView ? "default" : "ghost"}
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setYearlyAccountView("eseti_immediate_access")}
                        disabled={isYearlyReadOnly}
                      >
                        Eseti azonnali
                      </Button>
                      <Button
                        type="button"
                        variant={isEsetiTaxEligibleView ? "default" : "ghost"}
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setYearlyAccountView("eseti_tax_eligible")}
                        disabled={isYearlyReadOnly}
                      >
                        Eseti adójóváírásos
                      </Button>
                    </div>
                  )}

                  <Select
                    value={yearlyAccountSelectValue}
                    onValueChange={(value) => {
                      if (value === "eseti" && isPremiumSelectionNy06) {
                        setYearlyAccountView(isEsetiTaxEligibleView ? "eseti_tax_eligible" : "eseti_immediate_access")
                        return
                      }
                      setYearlyAccountView(value as YearlyAccountView)
                    }}
                  >
                    <SelectTrigger className="h-9 w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">Összesített</SelectItem>
                      <SelectItem value="main">Fő</SelectItem>
                      <SelectItem value="eseti">Eseti</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={yearlyAggregationMode}
                    onValueChange={(value) => setYearlyAggregationMode(value as "year" | "sum")}
                    disabled={isYearlyReadOnly}
                  >
                    <SelectTrigger className="h-9 w-28 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="year">Éves</SelectItem>
                      <SelectItem value="sum">Szum</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearAllModifications}
                    disabled={
                      !(isEsetiView ? hasActiveEsetiOverrides : hasMainYearlyOverrides)
                    }
                    className="h-9 text-xs md:text-sm bg-transparent"
                  >
                    Módosítások törlése
                  </Button>

                  {/* Display currency selector removed here; kept in top bar */}
                </div>
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                {/* Mobile view */}
                <div className={`${shouldShowDesktopYearlyTable ? "hidden" : "space-y-3"} ${isYearlyMuted ? "opacity-60" : ""}`}>
                  {(adjustedResults?.yearlyBreakdown ?? []).slice(0, visibleYears).map((row, index) => (
                    <MobileYearCard
                      key={`${row.year}-${row.periodType ?? "year"}-${index}`}
                      row={row}
                      planIndex={isEsetiTaxEligibleView ? esetiPlanIndexTaxEligible : isEsetiView ? esetiPlanIndex : planIndex}
                      planPayment={isEsetiTaxEligibleView ? esetiPlanPaymentTaxEligible : isEsetiView ? esetiPlanPayment : planPayment}
                      indexByYear={isEsetiTaxEligibleView ? esetiIndexByYearTaxEligible : isEsetiView ? esetiIndexByYear : indexByYear}
                      paymentByYear={isEsetiTaxEligibleView ? esetiPaymentByYearTaxEligible : isEsetiView ? esetiPaymentByYear : paymentByYear}
                      withdrawalByYear={isEsetiTaxEligibleView ? esetiWithdrawalByYearTaxEligible : isEsetiView ? esetiWithdrawalByYear : withdrawalByYear}
                      taxCreditLimitByYear={taxCreditLimitByYear}
                      displayCurrency={displayCurrency}
                      resultsCurrency={adjustedResults?.currency ?? results.currency}
                      eurToHufRate={inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate}
                      enableTaxCredit={!!inputs.enableTaxCredit}
                      editingFields={editingFields}
                      setFieldEditing={setFieldEditing}
                      updateIndex={isEsetiView ? updateEsetiIndex : updateIndex}
                      updatePayment={isEsetiView ? updateEsetiPayment : updatePayment}
                      updateWithdrawal={isEsetiView ? updateEsetiWithdrawal : updateWithdrawal}
                      updateTaxCreditLimit={updateTaxCreditLimit}
                      formatValue={formatValue}
                      enableNetting={enableNetting}
                      netData={yearlyNetCalculations[index]}
                      riskInsuranceCostForYear={enableRiskInsurance ? row.riskInsuranceCostForYear : undefined}
                      isAccountSplitOpen={isAccountSplitOpen}
                      isRedemptionOpen={isRedemptionOpen}
                      plusCostByYear={plusCostByYear}
                      inputs={inputs}
                      updatePlusCost={updatePlusCost}
                      assetCostPercentByYear={assetCostPercentByYear}
                      updateAssetCostPercent={updateAssetCostPercent}
                      bonusPercentByYear={bonusPercentByYear}
                      updateBonusPercent={updateBonusPercent}
                      yearlyViewMode={effectiveYearlyViewMode}
                      yearlyAccountView={yearlyAccountView}
                      cumulativeByYear={
                        isEsetiTaxEligibleView
                          ? cumulativeByYearEsetiTaxEligible
                          : isEsetiView
                            ? cumulativeByYearEseti
                            : yearlyAccountView === "summary"
                              ? cumulativeByYearSummary
                              : cumulativeByYear
                      }
                      shouldApplyTaxCreditPenalty={shouldApplyTaxCreditPenalty}
                      isTaxBonusSeparateAccount={isTaxBonusSeparateAccount}
                      showSurrenderAsPrimary={isAlfaExclusivePlus && !isEsetiView}
                      getRealValueForDays={getRealValueForDays}
                      realValueElapsedDays={realValueElapsedDaysByIndex[index] ?? 0}
                      // </CHANGE>
                    />
                  ))}
                  {(() => {
                    const rows = adjustedResults?.yearlyBreakdown ?? []
                    const remainingCount = Math.min(10, rows.length - visibleYears)
                    if (remainingCount <= 0) return null
                    const nextHiddenRow = rows[visibleYears]
                    const partialLabelRaw = nextHiddenRow?.periodType === "partial" ? getYearRowLabel(nextHiddenRow) : null
                    const partialLabel = partialLabelRaw ? partialLabelRaw.replace(/^\+/, "") : null
                    const showMoreLabel =
                      remainingCount === 1 && partialLabel
                        ? `Még ${partialLabel} mutatása`
                        : `Még ${remainingCount} év mutatása`

                    return (
                      <Button
                        variant="outline"
                        className="w-full h-11 mt-2 bg-transparent"
                        onClick={() =>
                          setVisibleYears((prev) =>
                            Math.min(prev + 10, adjustedResults?.yearlyBreakdown?.length ?? prev + 10),
                          )
                        }
                      >
                        {showMoreLabel}
                      </Button>
                    )
                  })()}

                  {visibleYears > 10 && (
                    <Button
                      variant="ghost"
                      className="w-full h-11 mt-2 text-muted-foreground"
                      onClick={() => setVisibleYears(10)}
                    >
                      Kevesebb mutatása
                    </Button>
                  )}
                </div>

                {/* Desktop table */}
                <div className={`${shouldShowDesktopYearlyTable ? "block" : "hidden"} overflow-x-auto ${isYearlyMuted ? "opacity-60" : ""}`}>
                  <table className="w-full min-w-[1100px] text-sm yearly-breakdown-table yearly-breakdown-table--auto">
                    <colgroup>
                      <col style={{ width: "60px" }} />
                      {!isYearlyReadOnly && <col style={{ width: "70px" }} />}
                      <col style={{ width: "120px" }} />
                      <col style={{ width: "100px" }} />
                      <col style={{ width: "100px" }} />
                      {showCostBreakdown && showAdminCostColumn && <col style={{ width: "110px" }} />}
                      {showCostBreakdown && showAccountMaintenanceColumn && <col style={{ width: "140px" }} />}
                      {showCostBreakdown && showManagementFeeColumn && <col style={{ width: "120px" }} />}
                      {showCostBreakdown && effectiveShowAssetFeeColumn && !hideAssetFeeBreakdownInYearlyTable && (
                        <col style={{ width: "90px" }} />
                      )}
                      {showCostBreakdown && showPlusCostColumn && <col style={{ width: "120px" }} />}
                      {showCostBreakdown && showAcquisitionColumn && shouldShowAcquisitionInYearlyTableView && (
                        <col style={{ width: "120px" }} />
                      )}
                      {showCostBreakdown &&
                        customCostYearlyColumns.map((column) => (
                          <col key={column.id} style={{ width: column.width }} />
                        ))}
                      <col style={{ width: "100px" }} />
                      {effectiveShowBonusColumns &&
                        showBonusBreakdown &&
                        customBonusYearlyColumns.map((column) => (
                          <col key={column.id} style={{ width: column.width }} />
                        ))}
                      {effectiveShowBonusColumns &&
                        showBonusBreakdown &&
                        shouldShowWealthBonusPercentColumn && (
                        <col style={{ width: "120px" }} />
                      )}
                      {effectiveShowBonusColumns && showBonusBreakdown && <col style={{ width: "120px" }} />}
                      {effectiveShowBonusColumns && showBonusBreakdown && selectedProduct === "generali_kabala" && (
                        <col style={{ width: "120px" }} />
                      )}
                      {enableRiskInsurance && <col style={{ width: "100px" }} />}
                      {totalExtraServicesCost > 0 && <col style={{ width: "100px" }} />}
                      {shouldShowTaxCreditInYearlyTable && <col style={{ width: "110px" }} />}
                      <col style={{ width: "110px" }} />
                      {isAlfaExclusivePlus && !isEsetiView && <col style={{ width: "120px" }} />}
                      <col style={{ width: "1%" }} />
                    </colgroup>
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-3 text-center font-medium w-16 sticky left-0 z-20 bg-background/95" {...getYearlyHeaderInfoHandlers("year")}>Év</th>
                        {!isYearlyReadOnly && (
                          <th className="py-3 px-3 text-right font-medium whitespace-nowrap" {...getYearlyHeaderInfoHandlers("index")}>Index (%)</th>
                        )}
                        <th className="py-3 px-3 text-right font-medium whitespace-nowrap" {...getYearlyHeaderInfoHandlers("payment")}>
                          {isEsetiView ? (
                            <div className="flex items-center justify-end">
                              <Select
                                value={esetiFrequency}
                                onValueChange={(value) => {
                                  const nextFrequency = value as PaymentFrequency
                                  if (isPremiumSelectionTr18 && nextFrequency !== "éves") return
                                  setEsetiFrequency(nextFrequency)
                                  setEsetiBaseInputs((prev) => ({ ...prev, frequency: nextFrequency }))
                                }}
                                disabled={isYearlyReadOnly}
                              >
                                <SelectTrigger className="h-5 w-auto border-0 bg-transparent px-0 py-0 text-sm font-medium shadow-none ring-0 hover:bg-transparent focus:ring-0 focus:ring-offset-0 data-[size=default]:h-5 [&>svg]:size-3.5 [&>svg]:opacity-50">
                                  <span className="leading-none">Befizetés/év</span>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="éves">Éves</SelectItem>
                                  <SelectItem value="féléves" disabled={isPremiumSelectionTr18}>
                                    Féléves
                                  </SelectItem>
                                  <SelectItem value="negyedéves" disabled={isPremiumSelectionTr18}>
                                    Negyedéves
                                  </SelectItem>
                                  <SelectItem value="havi" disabled={isPremiumSelectionTr18}>
                                    Havi
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            "Befizetés/év"
                          )}
                        </th>
                        <th className="py-3 px-3 text-right font-medium whitespace-nowrap" {...getYearlyHeaderInfoHandlers("interest")}>Hozam</th>
                        <th className="py-3 px-2 text-right font-medium">
                          <button
                            type="button"
                            onClick={() => setShowCostBreakdown((prev) => !prev)}
                            onMouseEnter={() => setActiveYearlyColumnInfoKey("totalCost")}
                            onMouseLeave={() => setActiveYearlyColumnInfoKey(null)}
                            onFocus={() => setActiveYearlyColumnInfoKey("totalCost")}
                            onBlur={() => setActiveYearlyColumnInfoKey(null)}
                            className="text-red-600 hover:text-red-700 transition-colors whitespace-nowrap"
                          >
                            Költség
                          </button>
                        </th>
                        {showCostBreakdown && showAdminCostColumn && (
                          <th className="py-3 px-3 text-right font-medium whitespace-nowrap text-red-600" {...getYearlyHeaderInfoHandlers("adminFee")}>Admin. díj</th>
                        )}
                        {showCostBreakdown && showAccountMaintenanceColumn && (
                          <th className="py-3 px-3 text-right font-medium whitespace-nowrap text-red-600" {...getYearlyHeaderInfoHandlers("accountMaintenance")}>
                            {selectedProduct === "generali_kabala" ? "Vagyonarányos költség" : "Számlavezetési költség"}
                          </th>
                        )}
                        {showCostBreakdown && showManagementFeeColumn && (
                          <th className="py-3 px-3 text-right font-medium whitespace-nowrap text-red-600" {...getYearlyHeaderInfoHandlers("managementFee")}>
                            Kezelési díj
                          </th>
                        )}
                        {showCostBreakdown && effectiveShowAssetFeeColumn && !hideAssetFeeBreakdownInYearlyTable && (
                          <th className="py-3 px-3 text-right font-medium whitespace-nowrap text-red-600" {...getYearlyHeaderInfoHandlers("assetFee")}>
                            {selectedProduct === "alfa_exclusive_plus" ? "Számlavezetési költség" : "Vagyon (%)"}
                          </th>
                        )}
                        {showCostBreakdown && showPlusCostColumn && (
                          <th
                            className="py-3 px-3 text-right font-medium whitespace-nowrap text-red-600"
                            {...getYearlyHeaderInfoHandlers(
                              selectedProduct === "generali_kabala" ? "adminMonthlyCost" : "plusCost",
                            )}
                          >
                            {selectedProduct === "generali_kabala" ? "Admin költs./hó (Ft)" : "Plusz költség (Ft)"}
                          </th>
                        )}
                        {showCostBreakdown && showAcquisitionColumn && shouldShowAcquisitionInYearlyTableView && (
                          <th className="py-3 px-3 text-right font-medium whitespace-nowrap text-red-600" {...getYearlyHeaderInfoHandlers("acquisitionFee")}>
                            {selectedProduct === "alfa_fortis"
                              || selectedProduct === "alfa_jade"
                              || selectedProduct === "alfa_jovokep"
                              || selectedProduct === "alfa_jovotervezo"
                              || selectedProduct === "alfa_premium_selection"
                              || selectedProduct === "alfa_zen"
                              || selectedProduct === "alfa_zen_eur"
                              || selectedProduct === "alfa_zen_pro"
                              || selectedProduct === "generali_kabala"
                              || selectedProduct === "alfa_exclusive_plus"
                              ? "Szerződéskötési költség"
                              : isAllianzEletprogramView
                                ? "Kezdeti költség"
                                : "Akkvizíciós költség"}
                          </th>
                        )}
                        {showCostBreakdown && customCostYearlyColumns.map((column) => (
                          <th
                            key={column.id}
                            className={column.className}
                            {...getYearlyHeaderInfoHandlers(column.infoKey)}
                          >
                            {column.title}
                          </th>
                        ))}
                        {effectiveShowBonusColumns && (
                          <th className="py-3 px-3 text-right font-medium whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setShowBonusBreakdown((prev) => !prev)}
                              onMouseEnter={() => setActiveYearlyColumnInfoKey("bonus")}
                              onMouseLeave={() => setActiveYearlyColumnInfoKey(null)}
                              onFocus={() => setActiveYearlyColumnInfoKey("bonus")}
                              onBlur={() => setActiveYearlyColumnInfoKey(null)}
                              className="text-emerald-600 hover:text-emerald-700 transition-colors whitespace-nowrap"
                            >
                              Bónusz
                            </button>
                          </th>
                        )}
                        {effectiveShowBonusColumns &&
                          showBonusBreakdown &&
                          customBonusYearlyColumns.map((column) => (
                            <th
                              key={column.id}
                              className={column.className}
                              {...getYearlyHeaderInfoHandlers(column.infoKey)}
                            >
                              {column.title}
                            </th>
                          ))}
                        {effectiveShowBonusColumns &&
                          showBonusBreakdown &&
                          shouldShowWealthBonusPercentColumn && (
                          <th className="py-3 px-3 text-right font-medium whitespace-nowrap text-emerald-600" {...getYearlyHeaderInfoHandlers("wealthBonusPercent")}>
                            Vagyon bónusz (%)
                          </th>
                        )}
                        {effectiveShowBonusColumns && showBonusBreakdown && (
                          <th
                            className="py-3 px-3 text-right font-medium whitespace-nowrap text-emerald-600"
                            {...getYearlyHeaderInfoHandlers(selectedProduct === "alfa_fortis" ? "bonus" : "bonusAmount")}
                          >
                            {selectedProduct === "alfa_fortis"
                              ? "Bónusz (%)"
                              : selectedProduct === "allianz_bonusz_eletprogram"
                                ? "Bónusz (%)"
                                : selectedProduct === "generali_kabala"
                                  ? "Díjbónusz (Ft)"
                                : "Bónusz (Ft)"}
                          </th>
                        )}
                        {effectiveShowBonusColumns && showBonusBreakdown && selectedProduct === "generali_kabala" && (
                          <th
                            className="py-3 px-3 text-right font-medium whitespace-nowrap text-emerald-600"
                            {...getYearlyHeaderInfoHandlers("bonusAmount")}
                          >
                            Hűségjóváírás (Ft)
                          </th>
                        )}
                        {/* </CHANGE> */}
                        {enableRiskInsurance && (
                          <th className="py-3 px-3 text-right font-medium whitespace-nowrap" {...getYearlyHeaderInfoHandlers("riskFee")}>Kock.bizt.</th>
                        )}
                        {/* Display extra services cost column if totalExtraServicesCost > 0 */}
                        {totalExtraServicesCost > 0 && (
                          <th className="py-3 px-3 text-right font-medium whitespace-nowrap">Extrák</th>
                        )}
                        {shouldShowTaxCreditInYearlyTable && (
                          <th className="py-3 px-3 text-right font-medium whitespace-nowrap w-28 min-w-28" {...getYearlyHeaderInfoHandlers("taxCredit")}>Adójóv.</th>
                        )}
                        <th className="py-3 px-3 text-right font-medium whitespace-nowrap w-28 min-w-28" {...getYearlyHeaderInfoHandlers("withdrawal")}>Kivonás</th>
                        {isAlfaExclusivePlus && !isEsetiView && (
                          <th className="py-3 px-3 text-right font-medium whitespace-nowrap w-32 min-w-32" {...getYearlyHeaderInfoHandlers("balance")}>
                            {enableNetting ? "Nettó egyenleg" : "Egyenleg"}
                          </th>
                        )}
                        <th className="py-3 pl-1 pr-[2ch] text-right text-xs md:text-sm font-semibold sticky right-0 z-20 bg-background/95 w-[1%] whitespace-nowrap" {...getYearlyHeaderInfoHandlers(isAlfaExclusivePlus && !isEsetiView ? "surrenderValue" : "balance")}>
                          {isAlfaExclusivePlus && !isEsetiView ? "Visszavásárlási érték" : enableNetting ? "Nettó egyenleg" : "Egyenleg"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className={isYearlyReadOnly ? "pointer-events-none" : undefined}>
                  {(adjustedResults?.yearlyBreakdown ?? []).map((row, index) => {
                        if (!row) return null
                        const activePlanIndex =
                          (isEsetiTaxEligibleView ? esetiPlanIndexTaxEligible : isEsetiView ? esetiPlanIndex : planIndex) ?? {}
                        const activePlanPayment =
                          (isEsetiTaxEligibleView ? esetiPlanPaymentTaxEligible : isEsetiView ? esetiPlanPayment : planPayment) ??
                          {}
                        const activeEsetiIndexByYear = isEsetiTaxEligibleView ? esetiIndexByYearTaxEligible : esetiIndexByYear
                        const activeEsetiPaymentByYear = isEsetiTaxEligibleView ? esetiPaymentByYearTaxEligible : esetiPaymentByYear
                        const currentIndex = isEsetiView
                          ? activeEsetiIndexByYear[row.year] ?? activePlanIndex[row.year] ?? 0
                          : activePlanIndex[row.year] ?? 0
                        const currentPayment = isEsetiView
                          ? activeEsetiPaymentByYear[row.year] ?? activePlanPayment[row.year] ?? 0
                          : row.yearlyPayment ?? activePlanPayment[row.year] ?? 0
                        const activeWithdrawalByYear = isEsetiTaxEligibleView
                          ? esetiWithdrawalByYearTaxEligible
                          : isEsetiView
                            ? esetiWithdrawalByYear
                            : withdrawalByYear
                        const currentWithdrawal = activeWithdrawalByYear[row.year] || 0
                        const updateIndexForView = isEsetiView ? updateEsetiIndex : updateIndex
                        const updatePaymentForView = isEsetiView ? updateEsetiPayment : updatePayment
                        const updateWithdrawalForView = isEsetiView ? updateEsetiWithdrawal : updateWithdrawal
                        const currentTaxCreditLimit = taxCreditLimitByYear[row.year]
                        const baseTaxCreditCapForYear =
                          currentTaxCreditLimit ?? inputs.taxCreditCapPerYear ?? Number.POSITIVE_INFINITY
                        const remainingTaxCreditCapForYear = isEsetiView
                          ? Math.max(0, baseTaxCreditCapForYear - (mainTaxCreditByYear[row.year] ?? 0))
                          : baseTaxCreditCapForYear
                        const remainingTaxCreditCapDisplayForYear = convertForDisplay(
                          remainingTaxCreditCapForYear,
                          results.currency,
                          displayCurrency,
                          inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate,
                        )
                        const effectiveTaxCreditAmountForRow = Math.min(
                          taxCreditAmountByYear[row.year] ?? row.taxCreditForYear,
                          remainingTaxCreditCapForYear,
                        )

                        const isIndexModified = (isEsetiView ? esetiIndexByYear : indexByYear)[row.year] !== undefined
                        const isPaymentModified = (isEsetiView ? esetiPaymentByYear : paymentByYear)[row.year] !== undefined
                        const isWithdrawalModified = activeWithdrawalByYear[row.year] !== undefined
                        const isTaxCreditLimited = currentTaxCreditLimit !== undefined

                        const netData = yearlyNetCalculations[index]
                        const sourceCumulativeByYear = isEsetiTaxEligibleView
                          ? cumulativeByYearEsetiTaxEligible
                          : isEsetiView
                            ? cumulativeByYearEseti
                          : yearlyAccountView === "summary"
                            ? cumulativeByYearSummary
                            : cumulativeByYear
                        const sourceYearRow = row
                        const sourceCumulativeRow = sourceCumulativeByYear[row.year] ?? sourceYearRow
                        const sourceRow = yearlyAggregationMode === "sum" ? sourceCumulativeRow : sourceYearRow
                        const baselineAdminFeePercent =
                          productPresetBaseline.adminFeePercentByYear[row.year] ?? productPresetBaseline.adminFeePercentOfPayment
                        const isAlfaExclusivePlusEsetiView = selectedProduct === "alfa_exclusive_plus" && isEsetiView
                        const baselineAccountMaintenancePercent = isAlfaExclusivePlusEsetiView
                          ? 0.145
                          : (productPresetBaseline.accountMaintenancePercentByYear[row.year] ??
                            productPresetBaseline.accountMaintenanceMonthlyPercent)
                        const baselineAcquisitionPercent =
                          productPresetBaseline.initialCostByYear[row.year] ?? productPresetBaseline.initialCostDefaultPercent
                        const baselineBonusOnContributionPercent =
                          productPresetBaseline.bonusOnContributionPercentByYear[row.year] ?? 0
                        const baselineRefundInitialCostBonusPercent =
                          productPresetBaseline.refundInitialCostBonusPercentByYear[row.year] ?? 0
                        const isAllianzEsetiView =
                          isEsetiView &&
                          (selectedProduct === "allianz_eletprogram" || selectedProduct === "allianz_bonusz_eletprogram")
                        const isExclusivePlusSplitView = isAlfaExclusivePlus && isAccountSplitOpen
                        const assetPercentDefaultForView =
                          isExclusivePlusSplitView && effectiveYearlyViewMode === "invested"
                            ? 0.145
                            : isExclusivePlusSplitView && effectiveYearlyViewMode === "taxBonus"
                              ? 0.145
                              : isAllianzEsetiView
                                ? 1.19
                              : (productPresetBaseline.assetCostPercentByYear[row.year] ?? productPresetBaseline.assetBasedFeePercent)
                        const baselineAssetCostPercent =
                          assetPercentDefaultForView
                        const adminFeeDisplay = isEsetiView ? 0 : (sourceRow.adminCostForYear ?? 0)
                        const adminFeePercentDisplay = isEsetiView
                          ? 0
                          : (adminFeePercentByYear[row.year] ??
                              inputs.adminFeePercentOfPayment ??
                              (selectedProduct === "alfa_fortis"
                                ? 4
                                : selectedProduct === "alfa_jovokep"
                                  ? 5
                                  : selectedProduct === "alfa_jovotervezo"
                                    ? JOVOTERVEZO_REGULAR_ADMIN_FEE_PERCENT
                                    : selectedProduct === "alfa_premium_selection"
                                      ? PREMIUM_SELECTION_REGULAR_ADMIN_FEE_PERCENT
                                    : selectedProduct === "alfa_zen" || selectedProduct === "alfa_zen_eur"
                                      ? ALFA_ZEN_REGULAR_ADMIN_FEE_PERCENT
                                    : selectedProduct === "alfa_zen_pro"
                                      ? ZEN_PRO_REGULAR_ADMIN_FEE_PERCENT
                                    : selectedProduct === "generali_kabala"
                                      ? 0
                                    : 0))
                        const adminFeePercentDefault = baselineAdminFeePercent
                        const isAdminFeePercentModified = Math.abs(adminFeePercentDisplay - adminFeePercentDefault) > 1e-9
                        const accountMaintenanceDisplay = isAlfaExclusivePlusEsetiView
                          ? (sourceRow.accountMaintenanceCostForYear ?? 0)
                          : isEsetiView
                            ? 0
                            : (sourceRow.accountMaintenanceCostForYear ?? 0)
                        const accountMaintenancePercentDisplay = isAlfaExclusivePlusEsetiView
                          ? 0.145
                          : isEsetiView
                            ? 0
                          : (accountMaintenancePercentByYear[row.year] ??
                              inputs.accountMaintenanceMonthlyPercent ??
                              (selectedProduct === "alfa_fortis"
                                ? 0.165
                                : selectedProduct === "alfa_jovokep"
                                  ? 0.165
                                  : selectedProduct === "alfa_jovotervezo"
                                    ? JOVOTERVEZO_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT
                                  : selectedProduct === "alfa_relax_plusz"
                                    ? 0.145
                                    : selectedProduct === "alfa_premium_selection"
                                      ? PREMIUM_SELECTION_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT
                                    : selectedProduct === "alfa_zen" || selectedProduct === "alfa_zen_eur"
                                      ? resolveAlfaZenAccountMaintenanceMonthlyPercent(
                                          selectedFundId,
                                          getAlfaZenVariantConfig(undefined, inputs.currency),
                                        )
                                    : selectedProduct === "alfa_zen_pro"
                                      ? ZEN_PRO_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT
                                    : selectedProduct === "generali_kabala"
                                      ? resolveGeneraliKabalaU91AccountMaintenanceMonthlyPercent(selectedFundId)
                                    : 0))
                        const isAccountMaintenancePercentModified = Math.abs(
                          accountMaintenancePercentDisplay - baselineAccountMaintenancePercent,
                        ) > 1e-9
                        const managementFeeDisplay = isEsetiView ? 0 : (sourceRow.managementFeeCostForYear ?? 0)
                        const acquisitionCostDisplay = isEsetiView ? 0 : (sourceRow.upfrontCostForYear ?? 0)
                        const acquisitionPercentDisplay = isEsetiView
                          ? 0
                          : (inputs.initialCostByYear?.[row.year] ?? inputs.initialCostDefaultPercent ?? 0)
                        const acquisitionPercentDefault = baselineAcquisitionPercent
                        const isAcquisitionPercentModified =
                          Math.abs(acquisitionPercentDisplay - acquisitionPercentDefault) > 1e-9
                        const bonusOnContributionPercentDisplay = isEsetiView
                          ? 0
                          : (bonusOnContributionPercentByYear[row.year] ?? baselineBonusOnContributionPercent)
                        const bonusOnContributionPercentDefault = baselineBonusOnContributionPercent
                        const isBonusOnContributionPercentModified =
                          Math.abs(bonusOnContributionPercentDisplay - bonusOnContributionPercentDefault) > 1e-9
                        const refundInitialCostBonusPercentDisplay = isEsetiView
                          ? 0
                          : (refundInitialCostBonusPercentByYear[row.year] ?? baselineRefundInitialCostBonusPercent)
                        const refundInitialCostBonusPercentDefault = baselineRefundInitialCostBonusPercent
                        const isRefundInitialCostBonusPercentModified =
                          Math.abs(refundInitialCostBonusPercentDisplay - refundInitialCostBonusPercentDefault) > 1e-9
                        const assetCostPercentDisplay = isAllianzEsetiView
                          ? (assetCostPercentByYear[row.year] ?? 1.19)
                          : isEsetiView
                            ? 0
                          : isExclusivePlusSplitView && effectiveYearlyViewMode === "invested"
                            ? 0.145
                            : isExclusivePlusSplitView && effectiveYearlyViewMode === "taxBonus"
                              ? 0.145
                              : (assetCostPercentByYear[row.year] ?? inputs.assetBasedFeePercent)
                        const isAssetCostPercentModified = Math.abs(assetCostPercentDisplay - baselineAssetCostPercent) > 1e-9
                        const displayPaymentValue = row.yearlyPayment ?? currentPayment

                        const buildDisplayDataForView = (valueRow: any) => {
                          let calculatedDisplayData = {
                            endBalance: valueRow.endBalance,
                            interestForYear: valueRow.interestForYear,
                            costForYear: valueRow.costForYear,
                            upfrontCostForYear: valueRow.upfrontCostForYear ?? 0,
                            adminCostForYear: valueRow.adminCostForYear ?? 0,
                            accountMaintenanceCostForYear: valueRow.accountMaintenanceCostForYear ?? 0,
                            managementFeeCostForYear: valueRow.managementFeeCostForYear ?? 0,
                            assetBasedCostForYear: valueRow.assetBasedCostForYear,
                            plusCostForYear: valueRow.plusCostForYear,
                            bonusForYear: valueRow.bonusForYear,
                            wealthBonusForYear: valueRow.wealthBonusForYear,
                          }

                          if (effectiveYearlyViewMode === "client") {
                            const splitAssetCost = valueRow.client.assetBasedCostForYear ?? 0
                            const splitPlusCost = valueRow.client.plusCostForYear ?? 0
                            const splitAccountMaintenance = Math.max(0, (valueRow.client.costForYear ?? 0) - splitAssetCost - splitPlusCost)
                            calculatedDisplayData = {
                              endBalance: valueRow.client.endBalance,
                              interestForYear: valueRow.client.interestForYear,
                              costForYear: valueRow.client.costForYear,
                              upfrontCostForYear: 0,
                              adminCostForYear: 0,
                              accountMaintenanceCostForYear: splitAccountMaintenance,
                              managementFeeCostForYear: 0,
                              assetBasedCostForYear: splitAssetCost,
                              plusCostForYear: splitPlusCost,
                              bonusForYear: valueRow.client.bonusForYear,
                              wealthBonusForYear: valueRow.client.wealthBonusForYear,
                            }
                          } else if (effectiveYearlyViewMode === "invested") {
                            const splitAssetCost = valueRow.invested.assetBasedCostForYear ?? 0
                            const splitPlusCost = valueRow.invested.plusCostForYear ?? 0
                            const splitAccountMaintenance = Math.max(
                              0,
                              (valueRow.invested.costForYear ?? 0) - splitAssetCost - splitPlusCost,
                            )
                            calculatedDisplayData = {
                              endBalance: valueRow.invested.endBalance,
                              interestForYear: valueRow.invested.interestForYear,
                              costForYear: valueRow.invested.costForYear,
                              upfrontCostForYear: 0,
                              adminCostForYear: 0,
                              accountMaintenanceCostForYear: splitAccountMaintenance,
                              managementFeeCostForYear: 0,
                              assetBasedCostForYear: splitAssetCost,
                              plusCostForYear: splitPlusCost,
                              bonusForYear: valueRow.invested.bonusForYear,
                              wealthBonusForYear: valueRow.invested.wealthBonusForYear,
                            }
                          } else if (effectiveYearlyViewMode === "taxBonus") {
                            const splitAssetCost = valueRow.taxBonus.assetBasedCostForYear ?? 0
                            const splitPlusCost = valueRow.taxBonus.plusCostForYear ?? 0
                            const splitAccountMaintenance = Math.max(
                              0,
                              (valueRow.taxBonus.costForYear ?? 0) - splitAssetCost - splitPlusCost,
                            )
                            calculatedDisplayData = {
                              endBalance: valueRow.taxBonus.endBalance,
                              interestForYear: valueRow.taxBonus.interestForYear,
                              costForYear: valueRow.taxBonus.costForYear,
                              upfrontCostForYear: 0,
                              adminCostForYear: 0,
                              accountMaintenanceCostForYear: splitAccountMaintenance,
                              managementFeeCostForYear: 0,
                              assetBasedCostForYear: splitAssetCost,
                              plusCostForYear: splitPlusCost,
                              // Tax credit postings are shown in the Adójóv. column,
                              // not as product bonus in tax-bonus account view.
                              bonusForYear: 0,
                              wealthBonusForYear: 0,
                            }
                          }

                          if (isEsetiView) {
                            const esetiAccountMaintenanceCost = isAlfaExclusivePlusEsetiView
                              ? (valueRow.accountMaintenanceCostForYear ?? 0)
                              : 0
                            const esetiAssetCost = isAllianzEsetiView ? (valueRow.assetBasedCostForYear ?? 0) : 0
                            calculatedDisplayData = {
                              ...calculatedDisplayData,
                              costForYear: esetiAccountMaintenanceCost + esetiAssetCost,
                              upfrontCostForYear: 0,
                              adminCostForYear: 0,
                              accountMaintenanceCostForYear: esetiAccountMaintenanceCost,
                              managementFeeCostForYear: 0,
                              assetBasedCostForYear: esetiAssetCost,
                              plusCostForYear: 0,
                              bonusForYear: 0,
                              wealthBonusForYear: 0,
                            }
                          }

                          return calculatedDisplayData
                        }

                        const displayData = buildDisplayDataForView(sourceRow)
                        const yearlyDisplayData = buildDisplayDataForView(sourceYearRow)

                        const totalBonusForRow = (displayData.bonusForYear ?? 0) + (displayData.wealthBonusForYear ?? 0)
                        const kabalaLoyaltyBonusForRow =
                          selectedProduct === "generali_kabala"
                            ? yearlyAggregationMode === "sum"
                              ? (kabalaLoyaltyBonusCumulativeByYear[row.year] ?? 0)
                              : (kabalaLoyaltyBonusByYear[row.year] ?? 0)
                            : 0
                        const cumulativeRow = sourceCumulativeRow
                        let displayBalance = enableNetting ? netData.netBalance : yearlyDisplayData.endBalance

                        const taxCreditCumulativeForRow =
                          sourceCumulativeByYear[row.year]?.taxCreditForYear ?? sourceRow.taxCreditForYear ?? 0
                        const taxCreditPenaltyForRow = shouldApplyTaxCreditPenalty ? taxCreditCumulativeForRow * 1.2 : 0
                        let displayBalanceWithPenalty = Math.max(0, displayBalance - taxCreditPenaltyForRow)
                        const effectiveWithdrawn = row.withdrawalForYear ?? currentWithdrawal
                        const preWithdrawalBalanceWithPenalty = displayBalanceWithPenalty + effectiveWithdrawn
                        const maxWithdrawalDisplay = convertForDisplay(
                          preWithdrawalBalanceWithPenalty,
                          results.currency,
                          displayCurrency,
                          inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate,
                        )
                        const isPartialRow = row.periodType === "partial"
                        displayBalanceWithPenalty = Math.max(0, preWithdrawalBalanceWithPenalty - effectiveWithdrawn)
                        const elapsedDaysForRow = realValueElapsedDaysByIndex[index] ?? Math.max(0, row.year * 365)
                        const applyRealValueForYear = (value: number) => getRealValueForDays(value, elapsedDaysForRow)
                        // </CHANGE>

                        return (
                          <tr key={`${row.year}-${row.periodType ?? "year"}-${index}`} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-3 text-center font-medium sticky left-0 z-10 bg-background/95">
                              {row.periodType === "partial" ? getYearRowLabel(row) : row.year}
                            </td>

                            {!isYearlyReadOnly && (
                              <td className="py-2 px-3 text-right align-top">
                                <div className="flex flex-col items-end gap-1 min-h-[44px]">
                                  <Input
                                    type="text"
                                    inputMode="numeric"
                                    disabled={isPartialRow}
                                    value={
                                      editingFields[`index-${row.year}`] ? String(currentIndex) : formatNumber(currentIndex)
                                    }
                                    onFocus={() => setFieldEditing(`index-${row.year}`, true)}
                                    onBlur={() => setFieldEditing(`index-${row.year}`, false)}
                                    onChange={(e) => {
                                      const parsed = parseNumber(e.target.value)
                                      if (!isNaN(parsed)) updateIndexForView(row.year, parsed)
                                    }}
                                    className={`w-14 h-8 text-right tabular-nums ${isIndexModified ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
                                  />
                                  <p className="text-xs text-muted-foreground tabular-nums opacity-0">0</p>
                                </div>
                              </td>
                            )}

                            <td className="py-2 px-3 text-right align-top">
                              <div className="flex flex-col items-end gap-1 min-h-[44px]">
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  disabled={isPartialRow}
                                  value={
                                    editingFields[`payment-${row.year}`]
                                      ? String(
                                          Math.round(
                                            convertForDisplay(
                                              displayPaymentValue,
                                              results.currency,
                                              displayCurrency,
                                              inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate,
                                            ),
                                          ),
                                        )
                                      : formatNumber(
                                          Math.round(
                                            convertForDisplay(
                                              displayPaymentValue,
                                              results.currency,
                                              displayCurrency,
                                              inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate,
                                            ),
                                          ),
                                        )
                                  }
                                  onFocus={() => setFieldEditing(`payment-${row.year}`, true)}
                                  onBlur={() => setFieldEditing(`payment-${row.year}`, false)}
                                  onChange={(e) => {
                                    if (e.target.value.trim() === "") {
                                      updatePaymentForView(row.year, 0)
                                      return
                                    }
                                    const parsed = parseNumber(e.target.value)
                                    if (!isNaN(parsed)) updatePaymentForView(row.year, parsed)
                                  }}
                                  className={`w-full h-8 text-right tabular-nums ${isPaymentModified ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
                                />
                                <p className="text-xs text-muted-foreground tabular-nums">
                                  {formatValue(applyRealValueForYear(sourceRow.totalContributions), displayCurrency)}
                                </p>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap align-top">
                              <div className="flex items-center justify-end min-h-[44px]">
                                {formatValue(applyRealValueForYear(displayData.interestForYear), displayCurrency)}
                              </div>
                            </td>
                            <td className="py-2 px-3 text-right text-destructive tabular-nums whitespace-nowrap align-top">
                              <div className="flex items-center justify-end min-h-[44px]">
                                {formatValue(applyRealValueForYear(displayData.costForYear), displayCurrency)}
                              </div>
                            </td>
                            {showCostBreakdown && showAdminCostColumn && (
                              (selectedProduct === "alfa_fortis" || selectedProduct === "alfa_jade" || selectedProduct === "alfa_jovokep" || selectedProduct === "alfa_jovotervezo" || selectedProduct === "alfa_premium_selection" || selectedProduct === "alfa_zen" || selectedProduct === "alfa_zen_eur" || selectedProduct === "alfa_zen_pro" || selectedProduct === "generali_kabala") ? (
                                <td className="py-2 px-3 text-right align-top">
                                  <div className="flex flex-col items-end gap-1 min-h-[44px]">
                                    <Input
                                      type="text"
                                      inputMode="decimal"
                                      disabled={isPartialRow}
                                      value={
                                        editingFields[`adminFee-${row.year}`]
                                          ? adminFeeInputByYear[row.year] ?? ""
                                          : adminFeePercentDisplay
                                              .toLocaleString("hu-HU", { maximumFractionDigits: 2 })
                                              .replace(/\u00A0/g, " ")
                                      }
                                      onFocus={() => {
                                        setFieldEditing(`adminFee-${row.year}`, true)
                                        setAdminFeeInputByYear((prev) => ({
                                          ...prev,
                                          [row.year]: String(adminFeePercentDisplay),
                                        }))
                                      }}
                                      onBlur={() => {
                                        setFieldEditing(`adminFee-${row.year}`, false)
                                        setAdminFeeInputByYear((prev) => {
                                          const updated = { ...prev }
                                          delete updated[row.year]
                                          return updated
                                        })
                                      }}
                                      onChange={(e) => {
                                        const raw = e.target.value
                                        setAdminFeeInputByYear((prev) => ({ ...prev, [row.year]: raw }))
                                        const val = parseNumber(raw)
                                        if (!isNaN(val) && val >= 0 && val <= 100) {
                                          updateAdminFeePercent(row.year, val)
                                        }
                                      }}
                                      min={0}
                                      max={100}
                                      step={0.1}
                                      className={`w-20 h-8 text-right tabular-nums text-red-600 ${isAdminFeePercentModified ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
                                    />
                                    <p className="text-xs text-muted-foreground tabular-nums">
                                      {formatValue(
                                        applyRealValueForYear(isEsetiView ? 0 : adminFeeDisplay),
                                        displayCurrency,
                                      )}
                                    </p>
                                  </div>
                                </td>
                              ) : (
                                <td className="py-2 px-3 text-right tabular-nums whitespace-nowrap align-top text-red-600">
                                  <div className="flex items-center justify-end min-h-[44px]">
                                    {formatValue(
                                      applyRealValueForYear(isEsetiView ? 0 : adminFeeDisplay),
                                      displayCurrency,
                                    )}
                                  </div>
                                </td>
                              )
                            )}
                            {showCostBreakdown && showAccountMaintenanceColumn && (
                              <td className="py-2 px-3 text-right align-top">
                                <div className="flex flex-col items-end gap-1 min-h-[44px]">
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    disabled={isPartialRow}
                                    value={
                                      editingFields[`accountMaintenance-${row.year}`]
                                        ? accountMaintenanceInputByYear[row.year] ?? ""
                                        : accountMaintenancePercentDisplay
                                            .toLocaleString("hu-HU", { maximumFractionDigits: 3 })
                                            .replace(/\u00A0/g, " ")
                                    }
                                    onFocus={() => {
                                      setFieldEditing(`accountMaintenance-${row.year}`, true)
                                      setAccountMaintenanceInputByYear((prev) => ({
                                        ...prev,
                                        [row.year]: String(accountMaintenancePercentDisplay),
                                      }))
                                    }}
                                    onBlur={() => {
                                      setFieldEditing(`accountMaintenance-${row.year}`, false)
                                      setAccountMaintenanceInputByYear((prev) => {
                                        const updated = { ...prev }
                                        delete updated[row.year]
                                        return updated
                                      })
                                    }}
                                    onChange={(e) => {
                                      const raw = e.target.value
                                      setAccountMaintenanceInputByYear((prev) => ({ ...prev, [row.year]: raw }))
                                      const val = parseNumber(raw)
                                      if (!isNaN(val) && val >= 0 && val <= 100) {
                                        if (isAlfaExclusivePlusEsetiView) {
                                          setAccountMaintenancePercentByYear((prev) => {
                                            const updated = { ...prev }
                                            if (Math.abs(val - 0.145) < 1e-9) {
                                              delete updated[row.year]
                                            } else {
                                              updated[row.year] = val
                                            }
                                            return updated
                                          })
                                        } else {
                                          updateAccountMaintenancePercent(row.year, val)
                                        }
                                      }
                                    }}
                                    min={0}
                                    max={100}
                                    step={0.001}
                                    className={`w-20 h-8 text-right tabular-nums text-red-600 ${isAccountMaintenancePercentModified ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
                                  />
                                  <p className="text-xs text-muted-foreground tabular-nums">
                                    {formatValue(
                                      applyRealValueForYear(
                                        isEsetiView && !isAlfaExclusivePlusEsetiView ? 0 : accountMaintenanceDisplay,
                                      ),
                                      displayCurrency,
                                    )}
                                  </p>
                                </div>
                              </td>
                            )}
                            {showCostBreakdown && showManagementFeeColumn && (
                              <td className="py-2 px-3 text-right tabular-nums whitespace-nowrap align-top text-red-600">
                                <div className="flex items-center justify-end min-h-[44px]">
                                  {formatValue(
                                    applyRealValueForYear(isEsetiView ? 0 : managementFeeDisplay),
                                    displayCurrency,
                                  )}
                                </div>
                              </td>
                            )}
                            {showCostBreakdown && effectiveShowAssetFeeColumn && !hideAssetFeeBreakdownInYearlyTable && (
                              <td className="py-2 px-3 text-right align-top">
                                <div className="flex flex-col items-end gap-1 min-h-[44px]">
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    value={
                                      isEsetiView && !isAllianzEsetiView
                                        ? "0"
                                        : editingFields[`assetCost-${row.year}`]
                                          ? assetCostInputByYear[row.year] ?? ""
                                          : assetCostPercentDisplay
                                              .toLocaleString("hu-HU", { maximumFractionDigits: 3 })
                                              .replace(/\u00A0/g, " ")
                                    }
                                    onFocus={() => {
                                      setFieldEditing(`assetCost-${row.year}`, true)
                                      setAssetCostInputByYear((prev) => ({
                                        ...prev,
                                        [row.year]: String(assetCostPercentDisplay),
                                      }))
                                    }}
                                    onBlur={() => {
                                      setFieldEditing(`assetCost-${row.year}`, false)
                                      setAssetCostInputByYear((prev) => {
                                        const updated = { ...prev }
                                        delete updated[row.year]
                                        return updated
                                      })
                                    }}
                                    onChange={(e) => {
                                      const raw = e.target.value
                                      setAssetCostInputByYear((prev) => ({ ...prev, [row.year]: raw }))
                                      if (isAllianzEsetiView && raw.trim() === "") {
                                        updateAssetCostPercent(row.year, 0)
                                        return
                                      }
                                      const val = parseNumber(e.target.value)
                                      if (!isNaN(val) && val >= 0 && val <= 100) {
                                        updateAssetCostPercent(row.year, val)
                                      }
                                    }}
                                    min={0}
                                    max={100}
                                    step={0.001}
                                    className={`w-20 h-8 text-right tabular-nums text-red-600 ${isAssetCostPercentModified ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
                                  />
                                  <p className="text-xs text-muted-foreground tabular-nums">
                                    {formatValue(
                                      applyRealValueForYear(
                                        isEsetiView && !isAllianzEsetiView
                                          ? 0
                                          : effectiveYearlyViewMode === "total"
                                            ? sourceRow.assetBasedCostForYear
                                            : displayData.assetBasedCostForYear,
                                      ),
                                      displayCurrency,
                                    )}
                                  </p>
                                </div>
                              </td>
                            )}

                            {showCostBreakdown && showPlusCostColumn && (
                              <td className="py-2 px-3 text-right align-top">
                                <div className="flex flex-col items-end gap-1 min-h-[44px]">
                                  <Input
                                    type="text"
                                    inputMode="numeric"
                                    disabled={isPartialRow}
                                    value={
                                      editingFields[`plusCost-${row.year}`]
                                        ? String(
                                            Math.round(
                                              convertForDisplay(
                                                isEsetiView ? 0 : plusCostByYear[row.year] ?? 0,
                                                results.currency,
                                                displayCurrency,
                                                inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate,
                                              ),
                                            ),
                                          )
                                        : formatNumber(
                                            Math.round(
                                              convertForDisplay(
                                                isEsetiView ? 0 : plusCostByYear[row.year] ?? 0,
                                                results.currency,
                                                displayCurrency,
                                                inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate,
                                              ),
                                            ),
                                          )
                                    }
                                    onFocus={() => setFieldEditing(`plusCost-${row.year}`, true)}
                                    onBlur={() => setFieldEditing(`plusCost-${row.year}`, false)}
                                    onChange={(e) => {
                                      const parsed = parseNumber(e.target.value)
                                      if (!isNaN(parsed) && parsed >= 0) {
                                        const calcValue = convertFromDisplayToCalc(
                                          parsed,
                                          results.currency,
                                          displayCurrency,
                                          inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate,
                                        )
                                        updatePlusCost(row.year, calcValue)
                                      }
                                    }}
                                    className={`w-full h-8 text-right tabular-nums text-red-600 ${plusCostByYear[row.year] !== undefined && plusCostByYear[row.year] > 0 ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
                                  />
                                  <p className="text-xs text-muted-foreground tabular-nums opacity-0">0</p>
                                </div>
                              </td>
                            )}
                            {showCostBreakdown && showAcquisitionColumn && shouldShowAcquisitionInYearlyTableView && (
                              <td className="py-2 px-3 text-right align-top">
                                <div className="flex flex-col items-end gap-1 min-h-[44px]">
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    disabled={isPartialRow}
                                    value={
                                      editingFields[`acquisitionCost-${row.year}`]
                                        ? acquisitionCostInputByYear[row.year] ?? ""
                                        : acquisitionPercentDisplay
                                            .toLocaleString("hu-HU", { maximumFractionDigits: 2 })
                                            .replace(/\u00A0/g, " ")
                                    }
                                    onFocus={() => {
                                      setFieldEditing(`acquisitionCost-${row.year}`, true)
                                      setAcquisitionCostInputByYear((prev) => ({
                                        ...prev,
                                        [row.year]: String(acquisitionPercentDisplay),
                                      }))
                                    }}
                                    onBlur={() => {
                                      setFieldEditing(`acquisitionCost-${row.year}`, false)
                                      setAcquisitionCostInputByYear((prev) => {
                                        const updated = { ...prev }
                                        delete updated[row.year]
                                        return updated
                                      })
                                    }}
                                    onChange={(e) => {
                                      const raw = e.target.value
                                      setAcquisitionCostInputByYear((prev) => ({ ...prev, [row.year]: raw }))
                                      const val = parseNumber(raw)
                                      if (!isNaN(val) && val >= 0 && val <= 100) {
                                        updateInitialCostPercent(row.year, val)
                                      }
                                    }}
                                    min={0}
                                    max={100}
                                    step={0.1}
                                    className={`w-20 h-8 text-right tabular-nums text-red-600 ${isAcquisitionPercentModified ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
                                  />
                                  <p className="text-xs text-muted-foreground tabular-nums">
                                    {formatValue(
                                      applyRealValueForYear(isEsetiView ? 0 : acquisitionCostDisplay),
                                      displayCurrency,
                                    )}
                                  </p>
                                </div>
                              </td>
                            )}
                            {showCostBreakdown && customCostYearlyColumns.map((column) => {
                              const rawCustomValue = resolveCustomEntryYearValue(sourceRow, effectiveYearlyViewMode, column.entryId)
                              const customEntry = customEntryDefinitions.find((entry) => entry.id === column.entryId)
                              const isCustomPercent = customEntry?.valueType === "percent"
                              const customEditorKey = `custom-entry-${column.entryId}-${row.year}`
                              return (
                                <td
                                  key={`${row.year}-${column.id}`}
                                  className={`py-2 px-3 text-right tabular-nums whitespace-nowrap align-top ${
                                    column.kind === "cost"
                                      ? "text-red-600"
                                      : "text-emerald-600 dark:text-emerald-400"
                                  }`}
                                >
                                  <div className="flex flex-col items-end gap-1 min-h-[44px]">
                                    <Input
                                      type="text"
                                      inputMode="decimal"
                                      disabled={isPartialRow}
                                      value={
                                        editingFields[customEditorKey]
                                          ? String(customEntry?.valueByYear?.[row.year] ?? customEntry?.value ?? 0)
                                          : isCustomPercent
                                            ? (customEntry?.valueByYear?.[row.year] ?? customEntry?.value ?? 0)
                                                .toLocaleString("hu-HU", { maximumFractionDigits: 4 })
                                                .replace(/\u00A0/g, " ")
                                            : formatNumber(Math.round(customEntry?.valueByYear?.[row.year] ?? customEntry?.value ?? 0))
                                      }
                                      onFocus={() => setFieldEditing(customEditorKey, true)}
                                      onBlur={() => setFieldEditing(customEditorKey, false)}
                                      onChange={(e) => {
                                        const val = parseNumber(e.target.value)
                                        if (isNaN(val) || val < 0) return
                                        if (customEntry?.kind === "cost") {
                                        const selectedAccount = normalizeCustomAccountForEditor(customEntry.account)
                                          if (isCustomPercent) {
                                            const otherPercentCostsOnSameAccount = managementFees.reduce((sum, fee) => {
                                              if (fee.id === column.entryId) return sum
                                              if (fee.valueType !== "percent") return sum
                                              if (normalizeCustomAccountForEditor(fee.account) !== selectedAccount) return sum
                                              return sum + Math.max(0, fee.valueByYear?.[row.year] ?? fee.value ?? 0)
                                            }, 0)
                                            const acquisitionPercentForAccount =
                                              selectedAccount === "main" || selectedAccount === "eseti"
                                                ? Math.max(0, acquisitionPercentDisplay)
                                                : 0
                                            const maxAllowedForThisEntry = Math.max(
                                              0,
                                              100 - acquisitionPercentForAccount - otherPercentCostsOnSameAccount,
                                            )
                                            updateManagementFeeValueByYear(
                                              column.entryId,
                                              row.year,
                                              Math.min(val, maxAllowedForThisEntry),
                                            )
                                          } else {
                                            const otherCustomContributionCostsForYear = managementFees.reduce((sum, fee) => {
                                              if (fee.id === column.entryId) return sum
                                              if (fee.valueType === "percent") {
                                                const percentValue = Math.max(
                                                  0,
                                                  fee.valueByYear?.[row.year] ?? fee.value ?? 0,
                                                )
                                                return sum + (Math.max(0, displayPaymentValue) * percentValue) / 100
                                              }
                                              const amountValue = Math.max(
                                                0,
                                                fee.valueByYear?.[row.year] ?? fee.value ?? 0,
                                              )
                                              const frequencyMultiplier =
                                                fee.frequency === "napi"
                                                  ? 365
                                                  : fee.frequency === "havi"
                                                    ? 12
                                                    : fee.frequency === "negyedéves"
                                                      ? 4
                                                      : fee.frequency === "féléves"
                                                        ? 2
                                                        : 1
                                              return sum + amountValue * frequencyMultiplier
                                            }, 0)
                                            const nonCustomContributionCostsForYear = Math.max(
                                              0,
                                              (sourceRow.upfrontCostForYear ?? 0) +
                                                (sourceRow.adminCostForYear ?? 0) +
                                                (sourceRow.riskInsuranceCostForYear ?? 0),
                                            )
                                            const maxAllowedForThisEntry = Math.max(
                                              0,
                                              Math.floor(
                                                Math.max(0, displayPaymentValue) -
                                                  nonCustomContributionCostsForYear -
                                                  otherCustomContributionCostsForYear,
                                              ),
                                            )
                                            updateManagementFeeValueByYear(
                                              column.entryId,
                                              row.year,
                                              Math.min(val, maxAllowedForThisEntry),
                                            )
                                          }
                                        } else {
                                          updateBonusValueByYear(column.entryId, row.year, val)
                                        }
                                      }}
                                      className={`w-24 h-8 text-right tabular-nums ${
                                        column.kind === "cost" ? "text-red-600" : "text-emerald-600"
                                      }`}
                                    />
                                    <p className="text-xs text-muted-foreground tabular-nums">
                                      {formatValue(applyRealValueForYear(rawCustomValue), displayCurrency)}
                                    </p>
                                  </div>
                                </td>
                              )
                            })}
                            {effectiveShowBonusColumns && (
                              <td className="py-2 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 align-top whitespace-nowrap">
                                <div className="flex items-center justify-end min-h-[44px]">
                                  {formatValue(
                                    applyRealValueForYear(
                                      totalBonusForRow,
                                    ),
                                    displayCurrency,
                                  )}
                                </div>
                              </td>
                            )}
                            {effectiveShowBonusColumns && showBonusBreakdown && customBonusYearlyColumns.map((column) => {
                              const rawCustomValue = resolveCustomEntryYearValue(sourceRow, effectiveYearlyViewMode, column.entryId)
                              const customEntry = customEntryDefinitions.find((entry) => entry.id === column.entryId)
                              const isCustomPercent = customEntry?.valueType === "percent"
                              const customEditorKey = `custom-entry-${column.entryId}-${row.year}`
                              return (
                                <td
                                  key={`${row.year}-${column.id}`}
                                  className={`py-2 px-3 text-right tabular-nums whitespace-nowrap align-top ${
                                    column.kind === "cost"
                                      ? "text-red-600"
                                      : "text-emerald-600 dark:text-emerald-400"
                                  }`}
                                >
                                  <div className="flex flex-col items-end gap-1 min-h-[44px]">
                                    <Input
                                      type="text"
                                      inputMode="decimal"
                                      disabled={isPartialRow}
                                      value={
                                        editingFields[customEditorKey]
                                          ? String(customEntry?.valueByYear?.[row.year] ?? customEntry?.value ?? 0)
                                          : isCustomPercent
                                            ? (customEntry?.valueByYear?.[row.year] ?? customEntry?.value ?? 0)
                                                .toLocaleString("hu-HU", { maximumFractionDigits: 4 })
                                                .replace(/\u00A0/g, " ")
                                            : formatNumber(Math.round(customEntry?.valueByYear?.[row.year] ?? customEntry?.value ?? 0))
                                      }
                                      onFocus={() => setFieldEditing(customEditorKey, true)}
                                      onBlur={() => setFieldEditing(customEditorKey, false)}
                                      onChange={(e) => {
                                        const val = parseNumber(e.target.value)
                                        if (isNaN(val) || val < 0) return
                                        if (customEntry?.kind === "cost") {
                                        const selectedAccount = normalizeCustomAccountForEditor(customEntry.account)
                                          if (isCustomPercent) {
                                            const otherPercentCostsOnSameAccount = managementFees.reduce((sum, fee) => {
                                              if (fee.id === column.entryId) return sum
                                              if (fee.valueType !== "percent") return sum
                                              if (normalizeCustomAccountForEditor(fee.account) !== selectedAccount) return sum
                                              return sum + Math.max(0, fee.valueByYear?.[row.year] ?? fee.value ?? 0)
                                            }, 0)
                                            const acquisitionPercentForAccount =
                                              selectedAccount === "main" || selectedAccount === "eseti"
                                                ? Math.max(0, acquisitionPercentDisplay)
                                                : 0
                                            const maxAllowedForThisEntry = Math.max(
                                              0,
                                              100 - acquisitionPercentForAccount - otherPercentCostsOnSameAccount,
                                            )
                                            updateManagementFeeValueByYear(
                                              column.entryId,
                                              row.year,
                                              Math.min(val, maxAllowedForThisEntry),
                                            )
                                          } else {
                                            const otherCustomContributionCostsForYear = managementFees.reduce((sum, fee) => {
                                              if (fee.id === column.entryId) return sum
                                              if (fee.valueType === "percent") {
                                                const percentValue = Math.max(
                                                  0,
                                                  fee.valueByYear?.[row.year] ?? fee.value ?? 0,
                                                )
                                                return sum + (Math.max(0, displayPaymentValue) * percentValue) / 100
                                              }
                                              const amountValue = Math.max(
                                                0,
                                                fee.valueByYear?.[row.year] ?? fee.value ?? 0,
                                              )
                                              const frequencyMultiplier =
                                                fee.frequency === "napi"
                                                  ? 365
                                                  : fee.frequency === "havi"
                                                    ? 12
                                                    : fee.frequency === "negyedéves"
                                                      ? 4
                                                      : fee.frequency === "féléves"
                                                        ? 2
                                                        : 1
                                              return sum + amountValue * frequencyMultiplier
                                            }, 0)
                                            const nonCustomContributionCostsForYear = Math.max(
                                              0,
                                              (sourceRow.upfrontCostForYear ?? 0) +
                                                (sourceRow.adminCostForYear ?? 0) +
                                                (sourceRow.riskInsuranceCostForYear ?? 0),
                                            )
                                            const maxAllowedForThisEntry = Math.max(
                                              0,
                                              Math.floor(
                                                Math.max(0, displayPaymentValue) -
                                                  nonCustomContributionCostsForYear -
                                                  otherCustomContributionCostsForYear,
                                              ),
                                            )
                                            updateManagementFeeValueByYear(
                                              column.entryId,
                                              row.year,
                                              Math.min(val, maxAllowedForThisEntry),
                                            )
                                          }
                                        } else {
                                          updateBonusValueByYear(column.entryId, row.year, val)
                                        }
                                      }}
                                      className={`w-24 h-8 text-right tabular-nums ${
                                        column.kind === "cost" ? "text-red-600" : "text-emerald-600"
                                      }`}
                                    />
                                    <p className="text-xs text-muted-foreground tabular-nums">
                                      {formatValue(applyRealValueForYear(rawCustomValue), displayCurrency)}
                                    </p>
                                  </div>
                                </td>
                              )
                            })}
                            {effectiveShowBonusColumns &&
                              showBonusBreakdown &&
                              shouldShowWealthBonusPercentColumn && (
                              <td className="py-2 px-3 text-right align-top">
                                <div className="flex flex-col items-end gap-1 min-h-[44px]">
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    value={isEsetiView ? 0 : bonusPercentByYear[row.year] ?? 0}
                                    onChange={(e) => {
                                      const val = parseNumber(e.target.value)
                                      if (!isNaN(val) && val >= 0 && val <= 100) {
                                        updateBonusPercent(row.year, val)
                                      }
                                    }}
                                    min={0}
                                    max={100}
                                    step={0.1}
                                    className={`w-full h-8 text-right tabular-nums text-emerald-600 ${bonusPercentByYear[row.year] !== undefined && bonusPercentByYear[row.year] > 0 ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
                                  />
                                  <p className="text-xs text-muted-foreground tabular-nums opacity-0">0</p>
                                </div>
                              </td>
                            )}
                            {effectiveShowBonusColumns && showBonusBreakdown && (
                              (selectedProduct === "alfa_fortis" || selectedProduct === "alfa_jade" || selectedProduct === "alfa_jovokep" || selectedProduct === "alfa_jovotervezo") ? (
                                <td className="py-2 px-3 text-right align-top">
                                  <div className="flex flex-col items-end gap-1 min-h-[44px]">
                                    <Input
                                      type="text"
                                      inputMode="decimal"
                                      disabled={isPartialRow}
                                      value={
                                        editingFields[`bonusOnContribution-${row.year}`]
                                          ? bonusOnContributionInputByYear[row.year] ?? ""
                                          : bonusOnContributionPercentDisplay
                                              .toLocaleString("hu-HU", { maximumFractionDigits: 2 })
                                              .replace(/\u00A0/g, " ")
                                      }
                                      onFocus={() => {
                                        setFieldEditing(`bonusOnContribution-${row.year}`, true)
                                        setBonusOnContributionInputByYear((prev) => ({
                                          ...prev,
                                          [row.year]: String(bonusOnContributionPercentDisplay),
                                        }))
                                      }}
                                      onBlur={() => {
                                        setFieldEditing(`bonusOnContribution-${row.year}`, false)
                                        setBonusOnContributionInputByYear((prev) => {
                                          const updated = { ...prev }
                                          delete updated[row.year]
                                          return updated
                                        })
                                      }}
                                      onChange={(e) => {
                                        const raw = e.target.value
                                        setBonusOnContributionInputByYear((prev) => ({ ...prev, [row.year]: raw }))
                                        const val = parseNumber(raw)
                                        if (!isNaN(val) && val >= 0 && val <= 100) {
                                          updateBonusOnContributionPercent(row.year, val)
                                        }
                                      }}
                                      min={0}
                                      max={100}
                                      step={0.1}
                                      className={`w-20 h-8 text-right tabular-nums text-emerald-600 ${isBonusOnContributionPercentModified ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
                                    />
                                    <p className="text-xs text-muted-foreground tabular-nums">
                                      {formatValue(
                                        applyRealValueForYear(
                                          (displayData.bonusForYear ?? 0) + (displayData.wealthBonusForYear ?? 0),
                                        ),
                                        displayCurrency,
                                      )}
                                    </p>
                                  </div>
                                </td>
                              ) : selectedProduct === "allianz_bonusz_eletprogram" ? (
                                <td className="py-2 px-3 text-right align-top">
                                  <div className="flex flex-col items-end gap-1 min-h-[44px]">
                                    <Input
                                      type="text"
                                      inputMode="decimal"
                                      disabled={isPartialRow}
                                      value={
                                        editingFields[`refundInitialCostBonus-${row.year}`]
                                          ? refundInitialCostBonusInputByYear[row.year] ?? ""
                                          : refundInitialCostBonusPercentDisplay
                                              .toLocaleString("hu-HU", { maximumFractionDigits: 2 })
                                              .replace(/\u00A0/g, " ")
                                      }
                                      onFocus={() => {
                                        setFieldEditing(`refundInitialCostBonus-${row.year}`, true)
                                        setRefundInitialCostBonusInputByYear((prev) => ({
                                          ...prev,
                                          [row.year]: String(refundInitialCostBonusPercentDisplay),
                                        }))
                                      }}
                                      onBlur={() => {
                                        setFieldEditing(`refundInitialCostBonus-${row.year}`, false)
                                        setRefundInitialCostBonusInputByYear((prev) => {
                                          const updated = { ...prev }
                                          delete updated[row.year]
                                          return updated
                                        })
                                      }}
                                      onChange={(e) => {
                                        const raw = e.target.value
                                        setRefundInitialCostBonusInputByYear((prev) => ({ ...prev, [row.year]: raw }))
                                        const val = parseNumber(raw)
                                        if (!isNaN(val) && val >= 0 && val <= 100) {
                                          updateRefundInitialCostBonusPercent(row.year, val)
                                        }
                                      }}
                                      min={0}
                                      max={100}
                                      step={0.1}
                                      className={`w-20 h-8 text-right tabular-nums text-emerald-600 ${isRefundInitialCostBonusPercentModified ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
                                    />
                                    <p className="text-xs text-muted-foreground tabular-nums">
                                      {formatValue(applyRealValueForYear(totalBonusForRow), displayCurrency)}
                                    </p>
                                  </div>
                                </td>
                              ) : selectedProduct === "generali_kabala" ? (
                                <td className="py-2 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 align-top whitespace-nowrap">
                                  <div className="flex items-center justify-end min-h-[44px]">
                                    {formatValue(applyRealValueForYear(displayData.bonusForYear ?? 0), displayCurrency)}
                                  </div>
                                </td>
                              ) : (
                                <td className="py-2 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 align-top whitespace-nowrap">
                                  <div className="flex items-center justify-end min-h-[44px]">
                                    {formatValue(applyRealValueForYear(totalBonusForRow), displayCurrency)}
                                  </div>
                                </td>
                              )
                            )}
                            {effectiveShowBonusColumns && showBonusBreakdown && selectedProduct === "generali_kabala" && (
                              <td className="py-2 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 align-top whitespace-nowrap">
                                <div className="flex items-center justify-end min-h-[44px]">
                                  {formatValue(applyRealValueForYear(kabalaLoyaltyBonusForRow), displayCurrency)}
                                </div>
                              </td>
                            )}
                            {/* </CHANGE> */}
                            {enableRiskInsurance && (
                              <td className="py-2 px-3 text-right text-purple-600 dark:text-purple-400 tabular-nums align-top">
                                <div className="flex items-center justify-end min-h-[44px]">
                                {formatValue(
                                  applyRealValueForYear(sourceRow.riskInsuranceCostForYear || 0),
                                  displayCurrency,
                                )}
                                </div>
                              </td>
                            )}
                            {/* Display extra services cost if > 0 */}
                            {totalExtraServicesCost > 0 && (
                              <td className="py-2 px-3 text-right text-purple-600 dark:text-purple-400 tabular-nums align-top">
                                <div className="flex items-center justify-end min-h-[44px]">
                                  {formatValue(
                                    applyRealValueForYear(extraServicesCostsByYear[row.year] || 0),
                                    displayCurrency,
                                  )}
                                </div>
                              </td>
                            )}

                            {shouldShowTaxCreditInYearlyTable && (
                              <td className="py-2 px-3 text-right align-top w-28 min-w-28">
                                <div className="flex flex-col items-end gap-1 min-h-[44px]">
                                  <Input
                                    type="text"
                                    inputMode="numeric"
                                    disabled={isPartialRow}
                                    value={
                                      editingFields[`taxCreditAmount-${row.year}`]
                                        ? String(
                                            Math.round(
                                              convertForDisplay(
                                                effectiveTaxCreditAmountForRow,
                                                results.currency,
                                                displayCurrency,
                                                inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate,
                                              ),
                                            ),
                                          )
                                        : formatNumber(
                                            Math.round(
                                              convertForDisplay(
                                                effectiveTaxCreditAmountForRow,
                                                results.currency,
                                                displayCurrency,
                                                inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate,
                                              ),
                                            ),
                                          )
                                    }
                                    onFocus={() => setFieldEditing(`taxCreditAmount-${row.year}`, true)}
                                    onBlur={() => setFieldEditing(`taxCreditAmount-${row.year}`, false)}
                                    onChange={(e) => {
                                      const parsed = parseNumber(e.target.value)
                                      if (!isNaN(parsed) && parsed >= 0) {
                                        const capped = Math.min(parsed, remainingTaxCreditCapDisplayForYear)
                                        updateTaxCreditAmount(row.year, capped, remainingTaxCreditCapForYear)
                                      }
                                    }}
                                    className={`w-full h-8 text-right tabular-nums ${taxCreditAmountByYear[row.year] !== undefined ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
                                  />
                                  <p className="text-xs text-muted-foreground tabular-nums opacity-0">0</p>
                                </div>
                              </td>
                            )}

                            <td className="py-2 px-3 text-right align-top w-28 min-w-28">
                              <div className="flex flex-col items-end gap-1 min-h-[44px]">
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  disabled={isPartialRow}
                                  value={
                                    editingFields[`withdrawal-${row.year}`]
                                      ? String(
                                          Math.round(
                                            convertForDisplay(
                                              currentWithdrawal,
                                              results.currency,
                                              displayCurrency,
                                              inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate,
                                            ),
                                          ),
                                        )
                                      : formatNumber(
                                          Math.round(
                                            convertForDisplay(
                                              currentWithdrawal,
                                              results.currency,
                                              displayCurrency,
                                              inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate,
                                            ),
                                          ),
                                        )
                                  }
                                  onFocus={() => setFieldEditing(`withdrawal-${row.year}`, true)}
                                  onBlur={() => setFieldEditing(`withdrawal-${row.year}`, false)}
                                  onChange={(e) => {
                                    const parsed = parseNumber(e.target.value)
                                    if (!isNaN(parsed)) {
                                      const capped = Math.min(parsed, maxWithdrawalDisplay)
                                      updateWithdrawalForView(row.year, capped)
                                    }
                                  }}
                                  className={`w-full h-8 text-right tabular-nums ${isWithdrawalModified ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
                                />
                                <p className="text-xs text-muted-foreground tabular-nums opacity-0">0</p>
                              </div>
                            </td>
                            {isAlfaExclusivePlus && !isEsetiView && (
                              <td className="py-2 px-3 text-right text-xs md:text-sm font-semibold tabular-nums w-32 min-w-32 align-top">
                                <div className="flex items-center justify-end min-h-[44px]">
                                  <span className="inline-flex w-fit whitespace-nowrap leading-tight text-right">
                                    {formatValue(
                                      applyRealValueForYear(displayBalanceWithPenalty),
                                      displayCurrency,
                                    ).replace(/ /g, "\u00A0")}
                                  </span>
                                </div>
                              </td>
                            )}
                            <td className="py-2 pl-1 pr-[2ch] text-right text-xs md:text-sm font-semibold tabular-nums sticky right-0 z-10 bg-background/95 w-[1%] align-top">
                              {!isAlfaExclusivePlus &&
                              (isAccountSplitOpen || isRedemptionOpen) &&
                              row.endingInvestedValue !== undefined &&
                              row.endingClientValue !== undefined ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="cursor-help inline-flex justify-end">
                                        <span className="inline-flex w-fit whitespace-nowrap leading-tight text-right">
                                          {formatValue(
                                            applyRealValueForYear(displayBalanceWithPenalty),
                                            displayCurrency,
                                          ).replace(/ /g, "\u00A0")}
                                        </span>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                      <div className="space-y-1 text-xs">
                                        {/* CASE A: Split is open - show full breakdown */}
                                        {isAccountSplitOpen && (
                                          <>
                                            <div>
                                              Lejárati többletdíj:{" "}
                                              {formatValue(
                                                applyRealValueForYear(row.endingInvestedValue),
                                                displayCurrency,
                                              )}
                                            </div>
                                            <div>
                                              Ügyfélérték:{" "}
                                              {formatValue(
                                                applyRealValueForYear(row.endingClientValue),
                                                displayCurrency,
                                              )}
                                            </div>
                                            {isTaxBonusSeparateAccount && row.endingTaxBonusValue > 0 && (
                                              <div>
                                                Adójóváírás:{" "}
                                                {formatValue(
                                                  applyRealValueForYear(row.endingTaxBonusValue),
                                                  displayCurrency,
                                                )}
                                              </div>
                                            )}
                                            {/* </CHANGE> */}
                                            <div className="pt-1 border-t">
                                              Összesen:{" "}
                                              {formatValue(
                                                applyRealValueForYear(displayBalanceWithPenalty),
                                                displayCurrency,
                                              )}
                                            </div>
                                            {isRedemptionOpen && row.surrenderCharge > 0 && (
                                              <>
                                                <div className="text-orange-600 dark:text-orange-400 pt-1 border-t">
                                                  Visszavásárlási költség:{" "}
                                                  {formatValue(
                                                    applyRealValueForYear(row.surrenderCharge),
                                                    displayCurrency,
                                                  )}
                                                </div>
                                                <div className="text-orange-600 dark:text-orange-400">
                                                  Visszavásárlási érték:{" "}
                                                  {formatValue(
                                                    applyRealValueForYear(row.surrenderValue),
                                                    displayCurrency,
                                                  )}
                                                </div>
                                              </>
                                            )}
                                          </>
                                        )}
                                        {/* CASE B: Split is closed but redemption is open - show only redemption value */}
                                        {!isAccountSplitOpen && isRedemptionOpen && row.surrenderCharge > 0 && (
                                          <div className="text-orange-600 dark:text-orange-400">
                                            Visszavásárlási érték:{" "}
                                            {formatValue(
                                              applyRealValueForYear(row.surrenderValue),
                                              displayCurrency,
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                // Plain value for Alfa surrender or standard non-tooltip case
                                <div className="flex items-center justify-end min-h-[44px]">
                                  <span className="inline-flex w-fit whitespace-nowrap leading-tight text-right">
                                    {formatValue(
                                      applyRealValueForYear(
                                        isAlfaExclusivePlus
                                        && !isEsetiView
                                          ? (sourceYearRow.surrenderValue ?? row.surrenderValue ?? displayBalanceWithPenalty)
                                          : displayBalanceWithPenalty,
                                      ),
                                      displayCurrency,
                                    ).replace(/ /g, "\u00A0")}
                                  </span>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="hidden md:block mt-3">
                  <ColumnHoverInfoPanel
                    activeKey={activeYearlyColumnInfoKey}
                    productKey={yearlyPanelProductKey}
                    dynamicExplanations={customColumnExplanations}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
