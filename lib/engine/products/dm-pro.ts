import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import type { ProductDefinition } from "./types"

export const dmPro: ProductDefinition = {
  id: "dm-pro",
  label: "DM PRO",
  calculate: (inputs: InputsDaily): ResultsDaily => calculateResultsDaily(inputs),
}
