"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface RiskInsuranceCardProps {
  enableRiskInsurance: boolean
  setEnableRiskInsurance: (value: boolean) => void
  selectedRiskInsurancePreset: string | null
  setSelectedRiskInsurancePreset: (value: string | null) => void
  riskInsuranceFeePercentOfMonthlyPayment: number
  setRiskInsuranceFeePercentOfMonthlyPayment: (value: number) => void
  riskInsuranceAnnualIndexPercent: number
  setRiskInsuranceAnnualIndexPercent: (value: number) => void
  riskInsuranceStartYear: number
  setRiskInsuranceStartYear: (value: number) => void
  riskInsuranceEndYear: number | undefined
  setRiskInsuranceEndYear: (value: number | undefined) => void
}

export function RiskInsuranceCard({
  enableRiskInsurance,
  setEnableRiskInsurance,
  selectedRiskInsurancePreset,
  setSelectedRiskInsurancePreset,
  riskInsuranceFeePercentOfMonthlyPayment,
  setRiskInsuranceFeePercentOfMonthlyPayment,
  riskInsuranceAnnualIndexPercent,
  setRiskInsuranceAnnualIndexPercent,
  riskInsuranceStartYear,
  setRiskInsuranceStartYear,
  riskInsuranceEndYear,
  setRiskInsuranceEndYear,
}: RiskInsuranceCardProps) {
  return (
    <Card className="p-3 md:p-4">
      <CardHeader className="p-0 pb-3">
        <CardTitle className="text-base">Kockázati biztosítás</CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-3">
        <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
          <Checkbox
            checked={enableRiskInsurance}
            onCheckedChange={(checked) => setEnableRiskInsurance(checked === true)}
            className="w-5 h-5"
          />
          <span className="text-sm">Kockázati biztosítás bekapcsolása</span>
        </label>

        {enableRiskInsurance && (
          <div className="space-y-3 pt-2">
            <div className="space-y-2">
              <Label className="text-sm">Kockázati biztosítás típusa</Label>
              <Select value={selectedRiskInsurancePreset || undefined} onValueChange={setSelectedRiskInsurancePreset}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Válassz biztosítási típust" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baleseti_halal">Baleseti halál</SelectItem>
                  <SelectItem value="baleseti_rokkantsag">Baleseti rokkantság</SelectItem>
                  <SelectItem value="baleseti_mutet">Baleseti műtét</SelectItem>
                  <SelectItem value="babavaro">Babaváró</SelectItem>
                  <SelectItem value="genetika_plus">Genetika+</SelectItem>
                  <SelectItem value="szabadon_beirhato">Szabadon beírható</SelectItem>
                  <SelectItem value="rokkantsagi_ellatas">Rokkantsági ellátás</SelectItem>
                  <SelectItem value="eletbiztositas">Életbiztosítás</SelectItem>
                  <SelectItem value="kritikus_betegseg">Kritikus betegség</SelectItem>
                  <SelectItem value="korhazi_napi_terites">Kórházi napi térítés</SelectItem>
                  <SelectItem value="rakdiagnosztika">Rákdiagnosztika</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Jelenleg csak kiválasztásra szolgál, később lesz egyedi költségszámítás
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">A havi díj hány %-a kockázati biztosítás költség?</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={riskInsuranceFeePercentOfMonthlyPayment}
                onChange={(e) => setRiskInsuranceFeePercentOfMonthlyPayment(Number(e.target.value) || 0)}
                min={0}
                max={100}
                step={0.1}
                className="h-11"
                placeholder="pl. 5"
              />
              <p className="text-xs text-muted-foreground">Ez a százalék levonódik minden befizetésből költségként</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Éves indexálás a kockázati költségre (%)</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={riskInsuranceAnnualIndexPercent}
                onChange={(e) => setRiskInsuranceAnnualIndexPercent(Number(e.target.value) || 0)}
                min={0}
                max={100}
                step={0.1}
                className="h-11"
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">A kockázati biztosítás költsége évente ennyivel nő</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">Kezdő év</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={riskInsuranceStartYear}
                  onChange={(e) => setRiskInsuranceStartYear(Number(e.target.value) || 1)}
                  min={1}
                  className="h-11"
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Záró év</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={riskInsuranceEndYear || ""}
                  onChange={(e) => setRiskInsuranceEndYear(Number(e.target.value) || undefined)}
                  min={1}
                  placeholder="Végéig"
                  className="h-11"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
