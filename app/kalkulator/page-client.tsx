"use client"

import dynamic from "next/dynamic"

const SavingsCalculator = dynamic(
  () => import("@/components/savings-calculator").then((mod) => mod.SavingsCalculator),
  { ssr: false },
)

export default function KalkulatorClient() {
  return <SavingsCalculator />
}
