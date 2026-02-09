import type { InputsDaily, ResultsDaily } from "../calculate-results-daily"

export type EngineInputs = InputsDaily
export type EngineResults = ResultsDaily

export interface ProductDefinition {
  id: string
  label: string
  calculate: (inputs: EngineInputs) => EngineResults
}
