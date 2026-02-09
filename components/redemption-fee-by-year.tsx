"use client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Copy, RotateCcw, Trash2 } from "lucide-react"
import { useEffect } from "react"

interface RedemptionFeeByYearProps {
  termYears: number
  redemptionFeeByYear: Record<number, number>
  defaultPercent: number
  redemptionBaseMode: "surplus-only" | "total-account"
  isAccountSplitOpen: boolean
  onUpdate: (byYear: Record<number, number>, defaultPercent: number) => void
  onBaseModeChange: (mode: "surplus-only" | "total-account") => void
}

export function RedemptionFeeByYear({
  termYears,
  redemptionFeeByYear,
  defaultPercent,
  redemptionBaseMode,
  isAccountSplitOpen,
  onUpdate,
  onBaseModeChange,
}: RedemptionFeeByYearProps) {
  useEffect(() => {
    if (!isAccountSplitOpen && redemptionBaseMode === "surplus-only") {
      onBaseModeChange("total-account")
    }
  }, [isAccountSplitOpen, redemptionBaseMode, onBaseModeChange])

  const handleDefaultChange = (value: number) => {
    onUpdate(redemptionFeeByYear, value)
  }

  const handleYearChange = (year: number, value: string) => {
    const updated = { ...redemptionFeeByYear }
    const num = Number.parseFloat(value)
    if (value === "" || isNaN(num)) {
      delete updated[year]
    } else {
      updated[year] = Math.max(0, Math.min(100, num))
    }
    onUpdate(updated, defaultPercent)
  }

  const handleResetAll = () => {
    onUpdate({}, defaultPercent)
  }

  const handleClearAll = () => {
    const cleared: Record<number, number> = {}
    for (let i = 1; i <= termYears; i++) {
      cleared[i] = 0
    }
    onUpdate(cleared, 0)
  }

  const handleCopyFromPrevious = () => {
    const updated = { ...redemptionFeeByYear }
    let lastValue = defaultPercent
    for (let i = 1; i <= termYears; i++) {
      if (updated[i] !== undefined) {
        lastValue = updated[i]
      } else {
        updated[i] = lastValue
      }
    }
    onUpdate(updated, defaultPercent)
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2 pb-3 border-b">
        <Label className="text-sm font-medium">Visszavásárlási költség alapja</Label>
        <RadioGroup
          value={redemptionBaseMode}
          onValueChange={(value) => onBaseModeChange(value as "surplus-only" | "total-account")}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="surplus-only" id="base-surplus-only" disabled={!isAccountSplitOpen} />
            <Label
              htmlFor="base-surplus-only"
              className={`text-sm font-normal ${
                isAccountSplitOpen ? "cursor-pointer" : "cursor-not-allowed text-muted-foreground"
              }`}
            >
              Csak Lejárati többletdíj számlára
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="total-account" id="base-total-account" />
            <Label htmlFor="base-total-account" className="text-sm font-normal cursor-pointer">
              Teljes számlaértékre (egységszámlára)
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <Label htmlFor="defaultRedemptionFee" className="text-sm font-medium">
            Minden évre ugyanaz (%)
          </Label>
          <Input
            id="defaultRedemptionFee"
            type="number"
            inputMode="decimal"
            value={defaultPercent}
            onChange={(e) => handleDefaultChange(Number(e.target.value))}
            min={0}
            max={100}
            step={0.1}
            className="h-9 mt-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleResetAll}
          className="h-7 px-2 text-xs bg-transparent"
          title="Összes = alapértelmezett"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClearAll}
          className="h-7 px-2 text-xs bg-transparent"
          title="Minden év 0%"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Nullázás
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopyFromPrevious}
          className="h-7 px-2 text-xs bg-transparent"
          title="Üresek kitöltése előző év értékével"
        >
          <Copy className="h-3 w-3 mr-1" />
          Másolás
        </Button>
      </div>

      <div>
        <div className="text-xs text-muted-foreground mb-2">Visszavásárlási költség % / év</div>
        <div className="grid grid-cols-6 md:grid-cols-10 gap-2">
          {Array.from({ length: termYears }, (_, i) => i + 1).map((year) => (
            <div key={year} className="space-y-1">
              <Label htmlFor={`redemption-year-${year}`} className="text-xs text-muted-foreground">
                Év {year}
              </Label>
              <Input
                id={`redemption-year-${year}`}
                type="number"
                inputMode="decimal"
                value={redemptionFeeByYear[year] ?? ""}
                onChange={(e) => handleYearChange(year, e.target.value)}
                placeholder={defaultPercent.toString()}
                min={0}
                max={100}
                step={0.1}
                className="h-8 text-xs px-2"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
