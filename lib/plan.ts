export type PlanInputs = {
  years: number

  // 1. év alap éves befizetés (regularPayment + frequency + keepYearlyPayment alapján)
  baseYear1Payment: number

  // alap index (%) – a fő inputból
  baseAnnualIndexPercent: number

  // a táblázatból érkező "anchor" módosítások:
  indexByYear: Record<number, number | undefined> // index az adott évre
  paymentByYear: Record<number, number | undefined> // befizetés az adott évre (ha kézzel átírta)
  withdrawalByYear: Record<number, number | undefined> // kivonás az adott évben
}

export type BuiltPlan = {
  indexEffective: number[] // 1..years
  yearlyPaymentsPlan: number[] // 1..years
  yearlyWithdrawalsPlan: number[] // 1..years
}

export function buildYearlyPlan(p: PlanInputs): BuiltPlan {
  const { years, baseYear1Payment, baseAnnualIndexPercent } = p

  // 1-indexelt tömbök (0. elem nem használt)
  const indexEffective = Array<number>(years + 1).fill(0)
  const yearlyPaymentsPlan = Array<number>(years + 1).fill(0)
  const yearlyWithdrawalsPlan = Array<number>(years + 1).fill(0)

  // index kitöltése
  for (let y = 1; y <= years; y++) {
    const idx = p.indexByYear[y]
    indexEffective[y] = idx ?? baseAnnualIndexPercent
  }

  // withdrawals kitöltése
  for (let y = 1; y <= years; y++) {
    yearlyWithdrawalsPlan[y] = p.withdrawalByYear[y] ?? 0
  }

  // év1 befizetés (kézi vagy alap)
  yearlyPaymentsPlan[1] = p.paymentByYear[1] ?? baseYear1Payment

  for (let y = 2; y <= years; y++) {
    const manual = p.paymentByYear[y]
    if (manual !== undefined) {
      yearlyPaymentsPlan[y] = manual
      continue
    }

    const prevPayment = yearlyPaymentsPlan[y - 1] ?? baseYear1Payment
    const indexRate = (indexEffective[y] ?? baseAnnualIndexPercent) / 100
    yearlyPaymentsPlan[y] = prevPayment * (1 + indexRate)
  }

  return { indexEffective, yearlyPaymentsPlan, yearlyWithdrawalsPlan }
}
