"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { REPORT_OPTIONS, UNKNOWN_REPORT_LABEL } from "@/lib/leads/constants"

type LeadsStatsResponse = {
  reportTotals?: Record<string, number>
  reportMonthly?: Record<string, number>
}

type LeadsStatsApiResponse = {
  ok?: boolean
  message?: string
  stats?: LeadsStatsResponse
  monthsWithData?: string[]
}

type ReportRow = {
  label: string
  count: number
  percent: number
}

type SourceFilter = "all" | "landing_form" | "sheets" | "manual_import" | "app_edit"

const SOURCE_FILTER_LABELS: Record<SourceFilter, string> = {
  all: "Összes forrás",
  landing_form: "Űrlap",
  sheets: "Google Sheets",
  manual_import: "Manuális import",
  app_edit: "App edit",
}

function formatMonthKey(date: Date) {
  return date.toISOString().slice(0, 7)
}

function getMonthRange(monthKey: string) {
  const monthStart = `${monthKey}-01`
  const monthEndDate = new Date(`${monthStart}T00:00:00.000Z`)
  monthEndDate.setUTCMonth(monthEndDate.getUTCMonth() + 1, 0)
  const monthEnd = monthEndDate.toISOString().slice(0, 10)
  return { monthStart, monthEnd }
}

const HUNGARIAN_MONTH_NAMES = [
  "Január",
  "Február",
  "Március",
  "Április",
  "Május",
  "Június",
  "Július",
  "Augusztus",
  "Szeptember",
  "Október",
  "November",
  "December",
]

function formatMonthTitle(monthKey: string) {
  const [yearText, monthText] = monthKey.split("-")
  const year = Number(yearText)
  const month = Number(monthText)
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return monthKey
  return `${year} ${HUNGARIAN_MONTH_NAMES[month - 1]}`
}

const REPORT_COLOR_MAP: Record<string, string> = {
  "Elértem kötés": "#84cc16",
  "Adatbekérő kiment": "#bef264",
  "Elértem elutasít": "#fca5a5",
  "Elértem új ip.": "#fcd34d",
  "Nem értem el új ip-ra": "#facc15",
  "Nem értem el": "#d4d4d8",
  "Többször nvf, hagyom..": "#f9a8d4",
  "Később térjünk rá vissza": "#ddd6fe",
  "Később megkeresni szerintem.": "#d8b4fe",
  "Keres ha érdekes": "#c4b5fd",
  "Keres ha érdekes/nem keresett": "#fecdd3",
  [UNKNOWN_REPORT_LABEL]: "#94a3b8",
}

function getReportColor(label: string) {
  return REPORT_COLOR_MAP[label] ?? REPORT_COLOR_MAP[UNKNOWN_REPORT_LABEL]
}

async function readApiResponse(res: Response) {
  const rawText = await res.text()
  if (!rawText) {
    return { ok: false as const, message: `Ures szerver valasz (HTTP ${res.status}).` }
  }

  try {
    const json = JSON.parse(rawText) as LeadsStatsApiResponse
    return { ok: true as const, json }
  } catch {
    return { ok: false as const, message: `A szerver nem JSON valaszt adott (HTTP ${res.status}).` }
  }
}

function normalizeReportCounts(input?: Record<string, number>) {
  const result: Record<string, number> = Object.fromEntries(REPORT_OPTIONS.map((option) => [option, 0]))
  result[UNKNOWN_REPORT_LABEL] = 0
  for (const [key, value] of Object.entries(input ?? {})) {
    if (typeof value !== "number" || !Number.isFinite(value)) continue
    if (key in result) {
      result[key] = value
    } else {
      result[UNKNOWN_REPORT_LABEL] = (result[UNKNOWN_REPORT_LABEL] ?? 0) + value
    }
  }
  return result
}

function toReportRows(input?: Record<string, number>): ReportRow[] {
  const counts = normalizeReportCounts(input)
  const labels = [...REPORT_OPTIONS, UNKNOWN_REPORT_LABEL]
  const total = labels.reduce((sum, label) => sum + (counts[label] ?? 0), 0)
  return labels.map((label) => {
    const count = counts[label] ?? 0
    return {
      label,
      count,
      percent: total > 0 ? (count / total) * 100 : 0,
    }
  })
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function sumCounts(rows: ReportRow[]) {
  return rows.reduce((sum, row) => sum + row.count, 0)
}

function StatsBlock({
  title,
  description,
  rows,
  headerActions,
}: {
  title: string
  description: string
  rows: ReportRow[]
  headerActions?: ReactNode
}) {
  const total = sumCounts(rows)
  const pieRows = rows.filter((row) => row.count > 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {headerActions ? <div className="flex items-center gap-2">{headerActions}</div> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-1">
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">Osszes darab</p>
            <p className="text-3xl font-semibold">{total}</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 text-sm font-medium">Darab bontas (oszlopdiagram)</h3>
            <ChartContainer
              config={{
                count: {
                  label: "Darab",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[460px] w-full"
            >
              <BarChart data={rows} layout="vertical" margin={{ left: 24, right: 16 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={200}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <span className="font-mono tabular-nums">{typeof value === "number" ? value : String(value)}</span>
                      )}
                    />
                  }
                />
                <Bar dataKey="count" radius={4}>
                  {rows.map((entry) => (
                    <Cell key={entry.label} fill={getReportColor(entry.label)} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="mb-3 text-sm font-medium">Megoszlas (kordiagram)</h3>
            {pieRows.length > 0 ? (
              <ChartContainer
                config={{
                  count: {
                    label: "Darab",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[460px] w-full"
              >
                <PieChart>
                  <Pie data={pieRows} dataKey="count" nameKey="label" innerRadius={65} outerRadius={150}>
                    {pieRows.map((entry) => (
                      <Cell key={entry.label} fill={getReportColor(entry.label)} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => {
                          const count = typeof value === "number" ? value : Number(value)
                          const percent = total > 0 ? (count / total) * 100 : 0
                          return (
                            <div className="flex items-center gap-2">
                              <span>{String(name)}</span>
                              <span className="font-mono tabular-nums">
                                {count} ({formatPercent(percent)})
                              </span>
                            </div>
                          )
                        }}
                      />
                    }
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-sm">Ehhez az idoszakhoz nincs adat.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kategoria</TableHead>
                <TableHead className="text-right">Darab</TableHead>
                <TableHead className="text-right">Szazalek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.label}>
                  <TableCell>{row.label}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{row.count}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{formatPercent(row.percent)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LeadsStatsPage() {
  const currentMonthKey = useMemo(() => formatMonthKey(new Date()), [])
  const [selectedMonthKey, setSelectedMonthKey] = useState(currentMonthKey)
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all")
  const [monthsWithData, setMonthsWithData] = useState<string[]>([])
  const [reportTotals, setReportTotals] = useState<Record<string, number> | undefined>(undefined)
  const [reportMonthly, setReportMonthly] = useState<Record<string, number> | undefined>(undefined)
  const [loadingTotals, setLoadingTotals] = useState(true)
  const [loadingMonths, setLoadingMonths] = useState(true)
  const [loadingMonthly, setLoadingMonthly] = useState(true)
  const [totalsError, setTotalsError] = useState<string | null>(null)
  const [monthlyError, setMonthlyError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadTotals() {
      setLoadingTotals(true)
      setLoadingMonths(true)
      setTotalsError(null)
      try {
        const params = new URLSearchParams()
        if (sourceFilter !== "all") params.set("sourceType", sourceFilter)
        const suffix = params.toString()
        const res = await fetch(`/api/leads/stats${suffix ? `?${suffix}` : ""}`)
        const parsed = await readApiResponse(res)
        if (!parsed.ok) throw new Error(parsed.message)
        if (!res.ok || !parsed.json.ok) throw new Error(parsed.json.message ?? "Nem sikerult lekerni a statisztikat.")
        if (cancelled) return
        setReportTotals(parsed.json.stats?.reportTotals)
        const months = Array.isArray(parsed.json.monthsWithData)
          ? parsed.json.monthsWithData.filter((month) => /^\d{4}-\d{2}$/.test(month))
          : []
        setMonthsWithData(months)
      } catch (error) {
        if (cancelled) return
        setTotalsError(error instanceof Error ? error.message : "Ismeretlen hiba.")
        setMonthsWithData([])
      } finally {
        if (!cancelled) {
          setLoadingTotals(false)
          setLoadingMonths(false)
        }
      }
    }
    void loadTotals()
    return () => {
      cancelled = true
    }
  }, [sourceFilter])

  useEffect(() => {
    if (monthsWithData.length === 0) return
    if (!monthsWithData.includes(selectedMonthKey)) {
      setSelectedMonthKey(monthsWithData[0])
    }
  }, [monthsWithData, selectedMonthKey])

  useEffect(() => {
    if (monthsWithData.length === 0) {
      setLoadingMonthly(false)
      setMonthlyError(null)
      setReportMonthly(undefined)
      return
    }
    if (!monthsWithData.includes(selectedMonthKey)) {
      setLoadingMonthly(false)
      return
    }

    let cancelled = false
    async function loadMonthly() {
      setLoadingMonthly(true)
      setMonthlyError(null)
      try {
        const params = new URLSearchParams()
        params.set("month", selectedMonthKey)
        if (sourceFilter !== "all") params.set("sourceType", sourceFilter)
        const res = await fetch(`/api/leads/stats?${params.toString()}`)
        const parsed = await readApiResponse(res)
        if (!parsed.ok) throw new Error(parsed.message)
        if (!res.ok || !parsed.json.ok) throw new Error(parsed.json.message ?? "Nem sikerult lekerni a statisztikat.")
        if (cancelled) return
        setReportMonthly(parsed.json.stats?.reportMonthly)
      } catch (error) {
        if (cancelled) return
        setMonthlyError(error instanceof Error ? error.message : "Ismeretlen hiba.")
      } finally {
        if (!cancelled) setLoadingMonthly(false)
      }
    }

    void loadMonthly()
    return () => {
      cancelled = true
    }
  }, [selectedMonthKey, sourceFilter, monthsWithData])

  const totalRows = useMemo(() => toReportRows(reportTotals), [reportTotals])
  const monthlyRows = useMemo(() => toReportRows(reportMonthly), [reportMonthly])

  const { monthStart, monthEnd } = useMemo(() => getMonthRange(selectedMonthKey), [selectedMonthKey])
  const selectedMonthIndex = useMemo(() => monthsWithData.indexOf(selectedMonthKey), [monthsWithData, selectedMonthKey])
  const canGoPrevious = selectedMonthIndex >= 0 && selectedMonthIndex < monthsWithData.length - 1
  const canGoNext = selectedMonthIndex > 0
  const selectedMonthTitle = useMemo(() => formatMonthTitle(selectedMonthKey), [selectedMonthKey])
  const selectedSourceLabel = SOURCE_FILTER_LABELS[sourceFilter]
  const noDataForFilter = !loadingMonths && monthsWithData.length === 0

  return (
    <main className="container mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Leads statisztika</h1>
          <p className="text-muted-foreground text-sm">
            Riport statusz bontas darabra es szazalekra, osszesitett es havi nezettel.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sourceFilter} onValueChange={(value) => setSourceFilter(value as SourceFilter)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Forras szures" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Összes forrás</SelectItem>
              <SelectItem value="landing_form">Űrlap</SelectItem>
              <SelectItem value="sheets">Google Sheets</SelectItem>
              <SelectItem value="manual_import">Manuális import</SelectItem>
              <SelectItem value="app_edit">App edit</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild variant="outline">
            <Link href="/leads" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Vissza a leadekhez
            </Link>
          </Button>
        </div>
      </div>

      {totalsError ? <p className="text-sm text-red-600">{totalsError}</p> : null}

      {noDataForFilter ? (
        <div className="flex min-h-[50vh] items-center justify-center rounded-lg border">
          <p className="text-muted-foreground text-lg font-medium">Erről az időszakról nincs adat</p>
        </div>
      ) : (
        <div className="space-y-6">
        <StatsBlock
          title="Osszesitett riport statisztika"
          description={loadingTotals ? "Betoltes..." : `Minden lead statusz szerinti bontasa. Szuro: ${selectedSourceLabel}.`}
          rows={totalRows}
        />
        <StatsBlock
          title={selectedMonthTitle}
          description={
            monthlyError
              ? monthlyError
              : loadingMonthly
                ? "Frissites..."
                : `Call time alapon, ${monthStart} - ${monthEnd} idoszakra. Szuro: ${selectedSourceLabel}.`
          }
          rows={monthlyRows}
          headerActions={
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={loadingMonthly || !canGoPrevious}
                onClick={() => {
                  if (!canGoPrevious) return
                  setSelectedMonthKey(monthsWithData[selectedMonthIndex + 1])
                }}
              >
                <ChevronLeft className="h-4 w-4" />
                Elozo honap
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={loadingMonthly || !canGoNext}
                onClick={() => {
                  if (!canGoNext) return
                  setSelectedMonthKey(monthsWithData[selectedMonthIndex - 1])
                }}
              >
                <ChevronRight className="h-4 w-4" />
                Kovetkezo honap
              </Button>
            </>
          }
        />
      </div>
      )}
    </main>
  )
}
