"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  COLUMN_EXPLANATIONS,
  getProductColumnTypeExplanation,
  type ProductContextKey,
} from "@/lib/column-explanations"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

type ColumnHoverInfoPanelProps = {
  activeKey: string | null
  productKey?: ProductContextKey | null
  className?: string
}

export function ColumnHoverInfoPanel({ activeKey, productKey, className }: ColumnHoverInfoPanelProps) {
  const [isHidden, setIsHidden] = useState(false)
  const active = activeKey ? COLUMN_EXPLANATIONS[activeKey] : undefined
  const typeExplanation = getProductColumnTypeExplanation(productKey, activeKey)

  if (isHidden) {
    return (
      <div className={`fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${className ?? ""}`}>
        <div className="mx-auto flex w-full max-w-5xl justify-end">
          <Button type="button" variant="secondary" size="sm" onClick={() => setIsHidden(false)}>
            Magyarázó megjelenítése
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${className ?? ""}`}>
      <Card className="mx-auto w-full max-w-5xl shadow-lg border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <CardContent className="py-3 px-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold text-muted-foreground">
              {active?.title ?? "Oszlopmagyarázat"}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => setIsHidden(true)}
              aria-label="Magyarázó bezárása"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1 text-sm">
            {active?.summary ?? "Vidd az egeret egy oszlopcímre, és itt megjelenik a rövid magyarázat."}
          </p>
          {typeExplanation ? (
            <p className="mt-1 text-xs">
              <span className="font-medium">Típus ennél a terméknél: </span>
              {typeExplanation.costTypeLabel}. {typeExplanation.rationale}
            </p>
          ) : null}
          {active?.detail ? (
            <p className="mt-1 text-xs text-muted-foreground">{active.detail}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

