"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Copy, RotateCcw, Trash2 } from "lucide-react"

interface InitialCostByYearProps {
  termYears: number
  initialCostByYear: Record<number, number>
  defaultPercent: number
  onUpdate: (byYear: Record<number, number>, defaultPercent: number) => void
}

export function InitialCostByYear({ termYears, initialCostByYear, defaultPercent, onUpdate }: InitialCostByYearProps) {
  const handleDefaultChange = (value: number) => {
    onUpdate(initialCostByYear, value)
  }

  const handleYearChange = (year: number, value: string) => {
    const updated = { ...initialCostByYear }
    const num = Number.parseFloat(value)
    if (value === "" || isNaN(num)) {
      delete updated[year]
    } else {
      updated[year] = num
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
    const updated = { ...initialCostByYear }
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

  const getEffectiveValue = (year: number): number => {
    return initialCostByYear[year] ?? defaultPercent
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <Label htmlFor="defaultInitialCost" className="text-sm font-medium">
            Alapértelmezett % (minden évre)
          </Label>
          <Input
            id="defaultInitialCost"
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
        <div className="text-xs text-muted-foreground mb-2">Kezdeti költség % / év</div>
        <div className="grid grid-cols-6 md:grid-cols-10 gap-2">
          {Array.from({ length: termYears }, (_, i) => i + 1).map((year) => (
            <div key={year} className="space-y-1">
              <Label htmlFor={`year-${year}`} className="text-xs text-muted-foreground">
                Év {year}
              </Label>
              <Input
                id={`year-${year}`}
                type="number"
                inputMode="decimal"
                value={initialCostByYear[year] ?? ""}
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
