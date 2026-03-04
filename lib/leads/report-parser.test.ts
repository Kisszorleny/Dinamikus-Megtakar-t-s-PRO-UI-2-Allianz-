import { describe, expect, it } from "vitest"
import { mapCalendarLabelToReportText, mapReportToCalendarLabel } from "@/lib/leads/report-parser"

describe("report-parser", () => {
  it("maps canonical report to calendar label", () => {
    expect(mapReportToCalendarLabel("Elértem új ip.")).toBe("VH")
    expect(mapReportToCalendarLabel("Nem értem el új ip-ra")).toBe("VH NVF")
  })

  it("accepts VH/NVF order and casing variants from calendar", () => {
    expect(mapCalendarLabelToReportText("VH NVF")).toBe("Nem értem el új ip-ra")
    expect(mapCalendarLabelToReportText("vh nvf")).toBe("Nem értem el új ip-ra")
    expect(mapCalendarLabelToReportText("NVF VH")).toBe("Nem értem el új ip-ra")
    expect(mapCalendarLabelToReportText("nvf vh")).toBe("Nem értem el új ip-ra")
  })

  it("keeps existing direct labels working", () => {
    expect(mapCalendarLabelToReportText("Megkötve")).toBe("Elértem kötés")
    expect(mapCalendarLabelToReportText("OFF")).toBe("Elértem elutasít")
    expect(mapCalendarLabelToReportText("Ő keres (nem keresett)")).toBe("Keres ha érdekes/nem keresett")
  })

  it("does not over-match unknown labels", () => {
    expect(mapCalendarLabelToReportText("vh maybe")).toBeNull()
    expect(mapCalendarLabelToReportText("unknown status")).toBeNull()
  })
})
