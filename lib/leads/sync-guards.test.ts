import { describe, expect, it } from "vitest"
import {
  normalizeComparableDate,
  normalizeComparablePhone,
  normalizeComparableText,
  normalizeComparableTime,
  parseTimeKey,
  shouldSkipMassDelete,
} from "@/lib/leads/sync-guards"

describe("sync-guards normalization", () => {
  it("normalizes placeholder-like text values to empty", () => {
    expect(normalizeComparableText("  N/A ")).toBe("")
    expect(normalizeComparableText("-")).toBe("")
    expect(normalizeComparableText("unknown")).toBe("")
    expect(normalizeComparableText(" Valami  szoveg ")).toBe("valami szoveg")
  })

  it("normalizes hungarian phone variants to stable comparable format", () => {
    expect(normalizeComparablePhone("06303361209")).toBe("+36303361209")
    expect(normalizeComparablePhone("303361209")).toBe("+36303361209")
    expect(normalizeComparablePhone("+36 30 336 1209")).toBe("+36303361209")
    expect(normalizeComparablePhone("6303361209")).toBe("+36303361209")
  })

  it("normalizes date and time variants", () => {
    expect(normalizeComparableDate("25.11.24.")).toBe("2025-11-24")
    expect(normalizeComparableDate("2025/11/24")).toBe("2025-11-24")
    expect(normalizeComparableTime("20")).toBe("20:00")
    expect(normalizeComparableTime("2045")).toBe("20:45")
    expect(normalizeComparableTime("20:45")).toBe("20:45")
  })

  it("parses compact time formats", () => {
    expect(parseTimeKey("20")).toEqual({ hour: 20, minute: 0 })
    expect(parseTimeKey("745")).toEqual({ hour: 7, minute: 45 })
    expect(parseTimeKey("0745")).toEqual({ hour: 7, minute: 45 })
  })
})

describe("sync-guards mass delete safety", () => {
  it("does not block small deletions", () => {
    expect(
      shouldSkipMassDelete({
        candidateDeleteCount: 5,
        totalManagedCount: 100,
      }),
    ).toBe(false)
  })

  it("blocks suspiciously large mass deletions", () => {
    expect(
      shouldSkipMassDelete({
        candidateDeleteCount: 60,
        totalManagedCount: 100,
        minCandidateCount: 20,
        maxDeleteRatio: 0.35,
      }),
    ).toBe(true)
  })
})
