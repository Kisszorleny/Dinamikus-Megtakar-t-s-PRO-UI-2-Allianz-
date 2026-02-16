export interface ColumnExplanation {
  title: string
  summary: string
  detail?: string
}

export type ProductContextKey =
  | "dm_pro"
  | "allianz_eletprogram"
  | "allianz_bonusz_eletprogram"
  | "alfa_exclusive_plus_ny05"
  | "alfa_exclusive_plus_tr08"
  | "alfa_fortis"
  | "mixed"

export interface ProductColumnTypeExplanation {
  costTypeLabel: string
  rationale: string
}

export const COLUMN_EXPLANATIONS: Record<string, ColumnExplanation> = {
  year: {
    title: "Év",
    summary: "A szimuláció aktuális futamidei éve.",
  },
  month: {
    title: "Hónap",
    summary: "Az adott éven belüli hónap.",
  },
  cumulativeMonth: {
    title: "Hónapok",
    summary: "A szerződés indulása óta eltelt összes hónap.",
  },
  duration: {
    title: "Futamidő",
    summary: "A megtakarítás teljes időtartama években.",
  },
  index: {
    title: "Index (%)",
    summary: "Az éves díjnövelés (indexálás) mértéke.",
    detail: "A következő évi rendszeres befizetés ehhez igazodva emelkedik.",
  },
  payment: {
    title: "Befizetés / év",
    summary: "Az adott évben tervezett teljes befizetés.",
  },
  totalContributions: {
    title: "Összes befizetés",
    summary: "A tartam elejétől addig az évig befizetett összeg.",
  },
  interest: {
    title: "Hozam",
    summary: "Az adott időszakban termelt nettó befektetési hozam.",
  },
  totalCost: {
    title: "Költség",
    summary: "Az időszak összes levonása egy sorban összesítve.",
    detail:
      "Tartalmazhat akvizíciós költséget, admin díjat, számlavezetési költséget, kezelési díjat, vagyonarányos és plusz költségeket.",
  },
  adminFee: {
    title: "Admin. díj",
    summary: "Szerződéskezelési/adminisztrációs levonás.",
    detail: "A termék feltételei szerinti fix vagy díjarányos admin költség.",
  },
  acquisitionFee: {
    title: "Akvizíciós költség",
    summary: "A befizetésből a kezdeti években levont induló költség.",
  },
  accountMaintenance: {
    title: "Számlavezetési költség",
    summary: "A számla fenntartásához kapcsolódó rendszeres levonás.",
    detail: "Fortisnál ez a számlaértékre vetített havi költségként jelenik meg.",
  },
  managementFee: {
    title: "Kezelési díj",
    summary: "A vagyon kezeléséhez/portfóliókezeléshez kötött levonás.",
  },
  assetFee: {
    title: "Vagyonarányos költség",
    summary: "A számlaérték százalékában számolt költség.",
    detail: "A költség az aktuális vagyonhoz igazodik, ezért az összeg idővel változhat.",
  },
  plusCost: {
    title: "Plusz költség",
    summary: "Külön, kézzel megadott extra éves levonás.",
  },
  riskFee: {
    title: "Kock.bizt. / Kocka díj",
    summary: "Kockázati biztosítási díj levonása (halál/egészségkárosodás fedezet).",
  },
  bonus: {
    title: "Bónusz",
    summary: "Az időszak összes bónusza egy sorban összesítve.",
  },
  wealthBonusPercent: {
    title: "Vagyon bónusz (%)",
    summary: "A vagyonra vetített bónusz mértéke százalékban.",
  },
  bonusAmount: {
    title: "Bónusz (Ft)",
    summary: "Az adott időszakban jóváírt bónusz összege.",
  },
  taxCredit: {
    title: "Adójóváírás",
    summary: "Az adóvisszatérítésből származó jóváírás.",
    detail: "A jóváírás időzítése és plafonja a választott termékszabály szerint alakul.",
  },
  withdrawal: {
    title: "Kivonás / Pénzkivonás",
    summary: "Az adott időszakban kivett összeg.",
  },
  netReturn: {
    title: "Nettó hozam",
    summary: "Befizetéshez viszonyított eredmény a költségek és jóváírások után.",
  },
  balance: {
    title: "Egyenleg",
    summary: "Az időszak végén elérhető számlaérték.",
  },
  surrenderValue: {
    title: "Visszavásárlási érték",
    summary: "A szerződés idő előtti megszüntetésekor kivehető érték.",
    detail: "A visszavásárlási költségek levonása után számolt összeg.",
  },
  strategy: {
    title: "Stratégia",
    summary: "A választott befektetési megközelítés rövid megnevezése.",
  },
  annualYield: {
    title: "Éves hozam",
    summary: "A modellben használt éves hozamfeltételezés.",
  },
  costTotalMonthly: {
    title: "Költség összesen",
    summary: "Havi nézetben az adott hónap teljes költséglevonása.",
  },
  compareBalanceChart: {
    title: "Egyenleg összehasonlítása",
    summary: "A termékek egyenlegének alakulása évenként összevetve.",
  },
  compareSurrenderChart: {
    title: "Visszavásárlási érték összehasonlítása",
    summary: "A termékek kivehető értékének összehasonlítása.",
  },
  compareCostChart: {
    title: "Költségek összehasonlítása",
    summary: "A termékeknél felhalmozott költségek összevetése.",
  },
  compareBonusChart: {
    title: "Bónuszok összehasonlítása",
    summary: "A termékeknél jóváírt bónuszok összehasonlítása.",
  },
  compareContributionVsBalanceChart: {
    title: "Kumulált befizetés vs egyenleg",
    summary: "A befizetések és az egyenleg görbéjének párhuzamos összevetése.",
  },
}

const PRODUCT_COLUMN_TYPE_EXPLANATIONS: Record<string, ProductColumnTypeExplanation> = {
  "alfa_fortis:adminFee": {
    costTypeLabel: "Díjarányos költség",
    rationale: "A rendszeres befizetésből százalékosan kerül levonásra.",
  },
  "allianz_bonusz_eletprogram:adminFee": {
    costTypeLabel: "Fix havi díj",
    rationale: "Havi fix összegben kerül terhelésre az adminisztráció.",
  },
  "allianz_eletprogram:adminFee": {
    costTypeLabel: "Fix havi díj",
    rationale: "Havi fix összegű adminisztrációs terhelés.",
  },
  "alfa_exclusive_plus_ny05:adminFee": {
    costTypeLabel: "Nincs külön admin díj",
    rationale: "A termékben ez külön soron nem terhelődik.",
  },
  "alfa_exclusive_plus_tr08:adminFee": {
    costTypeLabel: "Nincs külön admin díj",
    rationale: "A termékben ez külön soron nem terhelődik.",
  },
  "dm_pro:adminFee": {
    costTypeLabel: "Konfigurációfüggő",
    rationale: "A beállított konstrukciótól függően lehet fix vagy díjarányos.",
  },

  "alfa_fortis:accountMaintenance": {
    costTypeLabel: "Vagyonarányos havi költség",
    rationale: "A számlaértékre vetített havi százalékos levonás.",
  },
  "allianz_eletprogram:accountMaintenance": {
    costTypeLabel: "Nincs külön számlavezetési sor",
    rationale: "A termék a költségeket más költségsorokban kezeli.",
  },
  "allianz_bonusz_eletprogram:accountMaintenance": {
    costTypeLabel: "Nincs külön számlavezetési sor",
    rationale: "A termék a költségeket más költségsorokban kezeli.",
  },
  "alfa_exclusive_plus_ny05:accountMaintenance": {
    costTypeLabel: "Vagyonarányos költség",
    rationale: "A számlaértékhez kötött, százalékos levonás jellegű.",
  },
  "alfa_exclusive_plus_tr08:accountMaintenance": {
    costTypeLabel: "Vagyonarányos költség",
    rationale: "A számlaértékhez kötött, százalékos levonás jellegű.",
  },
  "dm_pro:accountMaintenance": {
    costTypeLabel: "Konfigurációfüggő",
    rationale: "A választott beállításoktól függően jelenhet meg.",
  },

  "alfa_fortis:acquisitionFee": {
    costTypeLabel: "Díjarányos kezdeti költség",
    rationale: "Az első években a befizetés meghatározott százaléka.",
  },
  "allianz_eletprogram:acquisitionFee": {
    costTypeLabel: "Díjarányos kezdeti költség",
    rationale: "Az első évi díjból százalékos levonás.",
  },
  "allianz_bonusz_eletprogram:acquisitionFee": {
    costTypeLabel: "Díjarányos kezdeti költség",
    rationale: "Az első évi díjból százalékos levonás.",
  },
  "alfa_exclusive_plus_ny05:acquisitionFee": {
    costTypeLabel: "Díjarányos kezdeti költség",
    rationale: "Tartamfüggő százalékkal kerül levonásra az első években.",
  },
  "alfa_exclusive_plus_tr08:acquisitionFee": {
    costTypeLabel: "Díjarányos kezdeti költség",
    rationale: "Tartamfüggő százalékkal kerül levonásra az első években.",
  },
  "dm_pro:acquisitionFee": {
    costTypeLabel: "Konfigurációfüggő",
    rationale: "A kalkulátor beállításai határozzák meg.",
  },

  "alfa_fortis:managementFee": {
    costTypeLabel: "Fix/periodikus kezelési díj",
    rationale: "A kezelési költség periodikus terhelésként jelenik meg.",
  },
  "allianz_eletprogram:managementFee": {
    costTypeLabel: "Fix összegű kezelési díj",
    rationale: "Évesített fix összeggel kerül levonásra.",
  },
  "allianz_bonusz_eletprogram:managementFee": {
    costTypeLabel: "Fix összegű kezelési díj",
    rationale: "Évesített fix összeggel kerül levonásra.",
  },
  "alfa_exclusive_plus_ny05:managementFee": {
    costTypeLabel: "Nincs külön kezelési díj",
    rationale: "A konstrukcióban külön soron ez nem terhelődik.",
  },
  "alfa_exclusive_plus_tr08:managementFee": {
    costTypeLabel: "Nincs külön kezelési díj",
    rationale: "A konstrukcióban külön soron ez nem terhelődik.",
  },
  "dm_pro:managementFee": {
    costTypeLabel: "Konfigurációfüggő",
    rationale: "Lehet százalékos vagy fix összegű a választott beállítástól függően.",
  },

  "alfa_fortis:assetFee": {
    costTypeLabel: "Nincs külön vagyonarányos sor",
    rationale: "Fortisnál ez jellemzően a számlavezetési költségben különül el.",
  },
  "allianz_eletprogram:assetFee": {
    costTypeLabel: "Vagyonarányos költség",
    rationale: "Éves százalékos levonás a kezelt vagyon alapján.",
  },
  "allianz_bonusz_eletprogram:assetFee": {
    costTypeLabel: "Vagyonarányos költség",
    rationale: "Éves százalékos levonás a kezelt vagyon alapján.",
  },
  "alfa_exclusive_plus_ny05:assetFee": {
    costTypeLabel: "Vagyonarányos költség",
    rationale: "Éves százalékos levonás a számlaértékre vetítve.",
  },
  "alfa_exclusive_plus_tr08:assetFee": {
    costTypeLabel: "Vagyonarányos költség",
    rationale: "Éves százalékos levonás a számlaértékre vetítve.",
  },
  "dm_pro:assetFee": {
    costTypeLabel: "Konfigurációfüggő",
    rationale: "A termékbeállításoktól függően jelenik meg.",
  },

  "allianz_bonusz_eletprogram:bonus": {
    costTypeLabel: "Növekvő visszaírás jellegű bónusz",
    rationale: "A kezdeti költség visszaírásából épülő, évfüggő jóváírás.",
  },
  "allianz_bonusz_eletprogram:bonusAmount": {
    costTypeLabel: "Növekvő visszaírás jellegű bónusz",
    rationale:
      "A kezdeti költség visszaírásából épülő, évfüggő jóváírás: a megtakarítás adott évszámának megfelelő százalék kerül jóváírásra a kezdeti költségből.",
  },
  "allianz_eletprogram:bonus": {
    costTypeLabel: "Nincs külön termékbónusz",
    rationale: "Alap konstrukcióban külön bónuszmechanika nincs bekapcsolva.",
  },
  "alfa_fortis:bonus": {
    costTypeLabel: "Díjbefizetés-arányos százalékos bónusz",
    rationale: "A megadott években az éves díj százalékában kerül jóváírásra.",
  },
  "alfa_exclusive_plus_ny05:bonus": {
    costTypeLabel: "Nincs külön bónusz",
    rationale: "A konstrukcióban bónusz sor alapból nem aktív.",
  },
  "alfa_exclusive_plus_tr08:bonus": {
    costTypeLabel: "Nincs külön bónusz",
    rationale: "A konstrukcióban bónusz sor alapból nem aktív.",
  },
  "dm_pro:bonus": {
    costTypeLabel: "Konfigurációfüggő",
    rationale: "A választott bónuszbeállítások szerint jelenik meg.",
  },
}

export function resolveProductContextKey(
  selectedProduct?: string | null,
  options?: {
    enableTaxCredit?: boolean
    selectedProductsForComparison?: string[]
  },
): ProductContextKey {
  if (!selectedProduct && Array.isArray(options?.selectedProductsForComparison)) {
    const arr = options.selectedProductsForComparison.filter((value): value is string => typeof value === "string")
    if (arr.length > 1) return "mixed"
    if (arr.length === 1) {
      const raw = typeof arr[0] === "string" ? (arr[0].split("-")[1] ?? null) : null
      selectedProduct = raw
    }
  }

  if (selectedProduct === "alfa_fortis") return "alfa_fortis"
  if (selectedProduct === "allianz_bonusz_eletprogram") return "allianz_bonusz_eletprogram"
  if (selectedProduct === "allianz_eletprogram") return "allianz_eletprogram"
  if (selectedProduct === "alfa_exclusive_plus") {
    return options?.enableTaxCredit ? "alfa_exclusive_plus_ny05" : "alfa_exclusive_plus_tr08"
  }
  return "dm_pro"
}

export function getProductColumnTypeExplanation(
  productKey: ProductContextKey | null | undefined,
  columnKey: string | null | undefined,
): ProductColumnTypeExplanation | null {
  if (!columnKey) return null
  if (productKey === "mixed") {
    return {
      costTypeLabel: "Termékfüggő",
      rationale: "Összehasonlításban ugyanaz az oszlopnév termékenként eltérő költségtípust jelenthet.",
    }
  }
  const safeProduct = productKey ?? "dm_pro"
  const direct = PRODUCT_COLUMN_TYPE_EXPLANATIONS[`${safeProduct}:${columnKey}`]
  if (direct) return direct
  return null
}

