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
  | "alfa_premium_selection_tr09"
  | "alfa_premium_selection_ny06"
  | "alfa_premium_selection_tr18"
  | "alfa_premium_selection_ny12"
  | "alfa_premium_selection_tr28"
  | "alfa_premium_selection_ny22"
  | "alfa_zen_ny13"
  | "alfa_zen_ny23"
  | "alfa_zen_pro_ny08"
  | "alfa_zen_pro_ny14"
  | "alfa_zen_pro_ny24"
  | "generali_kabala_u91_life"
  | "generali_kabala_u91_pension"
  | "generali_mylife_extra_plusz_u67p_life"
  | "generali_mylife_extra_plusz_u67p_pension"
  | "cig_esszenciae_huf"
  | "cig_esszenciae_eur"
  | "cig_nyugdijkotvenye"
  | "alfa_relax_plusz_ny01"
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
  adminMonthlyCost: {
    title: "Adminisztrációs költség",
    summary: "Kézzel megadott havi adminisztrációs költség.",
    detail: "Kabala terméknél a megadott havi érték éves levonásként (12x) kerül elszámolásra.",
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
    detail:
      "Az Egyenlegből számoljuk: abból vonjuk le a visszavásárlási költséget. Alfa Exclusive Plusnál ez az LTSZ-re: 1-120. hónapban TR-08: 100%, NY-05: 100%; 121. hónaptól TR-08: 20%, NY-05: 15%.",
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
  "alfa_relax_plusz_ny01:adminFee": {
    costTypeLabel: "Díjarányos adminisztráció",
    rationale: "A rendszeres díjból 4.8%, a rendkívüli díjakból 1% admin költség kerül levonásra.",
  },
  "alfa_zen_ny13:adminFee": {
    costTypeLabel: "Díjarányos adminisztráció",
    rationale: "A kockázati díjjal csökkentett rendszeres díjból 2% admin költség kerül levonásra.",
  },
  "alfa_zen_ny23:adminFee": {
    costTypeLabel: "Díjarányos adminisztráció",
    rationale: "A kockázati díjjal csökkentett rendszeres díjból 2% admin költség kerül levonásra (USD variáns).",
  },
  "alfa_zen_pro_ny08:adminFee": {
    costTypeLabel: "Díjarányos adminisztráció",
    rationale: "A rendszeres díjakból 4%, az eseti díjakból 2% admin költség kerül levonásra.",
  },
  "alfa_zen_pro_ny14:adminFee": {
    costTypeLabel: "Díjarányos adminisztráció",
    rationale: "A rendszeres díjakból 4%, az eseti díjakból 2% admin költség kerül levonásra (EUR variáns).",
  },
  "alfa_zen_pro_ny24:adminFee": {
    costTypeLabel: "Díjarányos adminisztráció",
    rationale: "A rendszeres díjakból 4%, az eseti díjakból 2% admin költség kerül levonásra (USD variáns).",
  },
  "generali_kabala_u91_life:adminFee": {
    costTypeLabel: "Fix adminisztrációs költség",
    rationale: "A 4. biztosítási évtől havi 500 Ft adminisztrációs költség érvényesül.",
  },
  "generali_kabala_u91_pension:adminFee": {
    costTypeLabel: "Fix adminisztrációs költség",
    rationale: "A 4. biztosítási évtől havi 500 Ft adminisztrációs költség érvényesül (nyugdíj variáns).",
  },
  "generali_mylife_extra_plusz_u67p_life:adminFee": {
    costTypeLabel: "Nincs külön admin díj sor",
    rationale: "Az adminisztrációs fix költség a Plusz költség soron jelenik meg évesítve.",
  },
  "generali_mylife_extra_plusz_u67p_pension:adminFee": {
    costTypeLabel: "Nincs külön admin díj sor",
    rationale: "Az adminisztrációs fix költség a Plusz költség soron jelenik meg évesítve (nyugdíj variáns).",
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
  "alfa_relax_plusz_ny01:accountMaintenance": {
    costTypeLabel: "Vagyonarányos havi költség",
    rationale: "A számlák értékére vetített 0.145% havi költség, az ügyfélérték számlán 37. hónaptól.",
  },
  "alfa_zen_ny13:accountMaintenance": {
    costTypeLabel: "Vagyonarányos havi költség",
    rationale: "Alapesetben 0.165%/hó, pénzpiaci alap esetén 0.08%/hó; az ügyfélérték számlán csak 37. hónaptól terheljük.",
  },
  "alfa_zen_ny23:accountMaintenance": {
    costTypeLabel: "Vagyonarányos havi költség",
    rationale: "Minden megtakarítási számlán egységesen 0.165%/hó, pénzpiaci alap kedvezmény nélkül.",
  },
  "alfa_zen_pro_ny08:accountMaintenance": {
    costTypeLabel: "Vagyonarányos havi költség",
    rationale: "A megtakarítási számlákon 0.165%/hó; a fő megtakarítási alapszámlán 37. hónaptól, a többi számlán az 1. hónaptól.",
  },
  "alfa_zen_pro_ny14:accountMaintenance": {
    costTypeLabel: "Vagyonarányos havi költség",
    rationale:
      "A megtakarítási számlákon 0.165%/hó; a fő megtakarítási alapszámlán 37. hónaptól, a többi számlán az 1. hónaptól (EUR variáns).",
  },
  "alfa_zen_pro_ny24:accountMaintenance": {
    costTypeLabel: "Vagyonarányos havi költség",
    rationale:
      "A megtakarítási számlákon 0.165%/hó; a fő megtakarítási alapszámlán 37. hónaptól, a többi számlán az 1. hónaptól (USD variáns).",
  },
  "generali_kabala_u91_life:accountMaintenance": {
    costTypeLabel: "Vagyonarányos havi költség",
    rationale:
      "Pénzpiaci 2016 alapnál 0.16%/hó, más alapnál 0.175%/hó; a rendszeres díjas egységeknél a 37. hónaptól.",
  },
  "generali_kabala_u91_pension:accountMaintenance": {
    costTypeLabel: "Vagyonarányos havi költség",
    rationale:
      "Pénzpiaci 2016 alapnál 0.16%/hó, más alapnál 0.175%/hó; a rendszeres díjas egységeknél a 37. hónaptól (nyugdíj variáns).",
  },
  "generali_mylife_extra_plusz_u67p_life:accountMaintenance": {
    costTypeLabel: "Vagyonarányos havi költség",
    rationale:
      "Pénzpiaci 2016 alapnál 0.12%/hó, más alapnál 0.15%/hó; a rendszeres díjas egységeknél a 37. hónaptól.",
  },
  "generali_mylife_extra_plusz_u67p_pension:accountMaintenance": {
    costTypeLabel: "Vagyonarányos havi költség",
    rationale:
      "Pénzpiaci 2016 alapnál 0.12%/hó, más alapnál 0.15%/hó; a rendszeres díjas egységeknél a 37. hónaptól (nyugdíj variáns).",
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
  "alfa_relax_plusz_ny01:acquisitionFee": {
    costTypeLabel: "Tartamfüggő kezdeti költség",
    rationale: "Az első 1-3 évben, a választott tartamtól függő százalékos szerződéskötési költség.",
  },
  "alfa_zen_ny13:acquisitionFee": {
    costTypeLabel: "Tartamfüggő kezdeti költség",
    rationale: "Az első évben 78%, a 2-3. évben tartamfüggő sávos százalék szerint terheljük a szerződéskötési költséget.",
  },
  "alfa_zen_ny23:acquisitionFee": {
    costTypeLabel: "Tartamfüggő kezdeti költség",
    rationale: "Az első évben 78%, a 2-3. évben tartamfüggő sávos százalék szerint terheljük a szerződéskötési költséget (USD).",
  },
  "alfa_zen_pro_ny08:acquisitionFee": {
    costTypeLabel: "Tartamfüggő kezdeti költség",
    rationale: "Az első 1-3 évben tartamtól függő táblázatos százalék szerint terheljük a szerződéskötési költséget.",
  },
  "alfa_zen_pro_ny14:acquisitionFee": {
    costTypeLabel: "Tartamfüggő kezdeti költség",
    rationale: "Az első 1-3 évben tartamtól függő táblázatos százalék szerint terheljük a szerződéskötési költséget (EUR variáns).",
  },
  "alfa_zen_pro_ny24:acquisitionFee": {
    costTypeLabel: "Tartamfüggő kezdeti költség",
    rationale: "Az első 1-3 évben tartamtól függő táblázatos százalék szerint terheljük a szerződéskötési költséget (USD variáns).",
  },
  "generali_mylife_extra_plusz_u67p_life:acquisitionFee": {
    costTypeLabel: "Díjarányos forgalmazási költség",
    rationale: "1. év 67%, 2. év 37%, 3-20. év 7%, 21. évtől 0%.",
  },
  "generali_mylife_extra_plusz_u67p_pension:acquisitionFee": {
    costTypeLabel: "Díjarányos forgalmazási költség",
    rationale: "1. év 67%, 2. év 37%, 3-20. év 7%, 21. évtől 0% (nyugdíj variáns).",
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
    rationale: "Havi százalékos levonás a számlaértékre vetítve.",
  },
  "alfa_exclusive_plus_tr08:assetFee": {
    costTypeLabel: "Vagyonarányos költség",
    rationale: "Havi százalékos levonás a számlaértékre vetítve.",
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
  "alfa_premium_selection_tr09:bonus": {
    costTypeLabel: "Tartam- és díjsávfüggő bónusz",
    rationale: "A bónusz a konstrukciós szabályok szerint, a minimális havi díj bázisán kerül jóváírásra.",
  },
  "alfa_premium_selection_ny06:bonus": {
    costTypeLabel: "Nyugdíj-specifikus sávos bónusz",
    rationale: "10. évfordulós alap + extra, illetve lejárat előtti hűségbónusz a nyugdíjvariáns szabályai szerint.",
  },
  "alfa_premium_selection_tr18:bonus": {
    costTypeLabel: "EUR variáns, tartam- és díjsávfüggő bónusz",
    rationale:
      "TR18 esetén 10-14 év tartamnál 20%, 15+ évnél díjsávos (70%/140%) bónusz jár a szabályok szerinti bázison.",
  },
  "alfa_premium_selection_tr28:bonus": {
    costTypeLabel: "USD variáns, tartam- és díjsávfüggő bónusz",
    rationale:
      "TR28 esetén 10-14 év tartamnál 20%, 15+ évnél díjsávos (70%/140%) bónusz jár a szabályok szerinti bázison.",
  },
  "alfa_premium_selection_ny12:bonus": {
    costTypeLabel: "EUR nyugdíj-specifikus sávos bónusz",
    rationale:
      "A nyugdíj (NY12) variánsban a lejárat előtti utolsó évfordulón díjsávos ügyfélbónusz jár, 15+ éves tartamnál 10. évfordulós extra bónusszal.",
  },
  "alfa_premium_selection_ny22:bonus": {
    costTypeLabel: "USD nyugdíj-specifikus sávos bónusz",
    rationale:
      "A nyugdíj (NY22) variánsban a lejárat előtti utolsó évfordulón díjsávos ügyfélbónusz jár a legalacsonyabb évesített díj alapján.",
  },
  "alfa_relax_plusz_ny01:bonus": {
    costTypeLabel: "Évfordulós nyugdíjbónusz",
    rationale: "A 10. évfordulón 40%, 15+ éves tartamnál a lejárat előtti évfordulón további 100% bónusz jár.",
  },
  "alfa_zen_ny13:bonus": {
    costTypeLabel: "Évfordulós ügyfélbónusz",
    rationale:
      "A legalacsonyabb évesített havi díj alapján jár: 10. évfordulón 50-100%, 15. évfordulón +100%, 20+ évnél a lejárat előtti évfordulón +100%.",
  },
  "alfa_zen_ny23:bonus": {
    costTypeLabel: "Évfordulós ügyfélbónusz",
    rationale:
      "A legalacsonyabb évesített havi díj alapján jár: 10. évfordulón 50-100%, 15. évfordulón +100%, 20+ évnél a lejárat előtti évfordulón +100% (USD-ben).",
  },
  "alfa_zen_pro_ny08:bonus": {
    costTypeLabel: "Tartamfüggő évfordulós ügyfélbónusz",
    rationale:
      "A legalacsonyabb havi teljes díj évesített (x12) bázisán, tartamfüggő 7/8/9/10. évfordulós és lejárat előtti utolsó évfordulós jóváírásokkal.",
  },
  "alfa_zen_pro_ny14:bonus": {
    costTypeLabel: "Tartamfüggő évfordulós ügyfélbónusz",
    rationale:
      "10-14 éves tartamnál egyösszegű 90% bónusz jár (7/8/9. évfordulón), 15-19 évnél 115% + 35%, 20+ évnél 70%+70%+70% (EUR).",
  },
  "alfa_zen_pro_ny24:bonus": {
    costTypeLabel: "Tartamfüggő évfordulós ügyfélbónusz",
    rationale:
      "10-14 éves tartamnál egyösszegű 90% bónusz jár (7/8/9. évfordulón), 15-19 évnél 115% + 35%, 20+ évnél 70%+70%+70% (USD).",
  },
  "generali_kabala_u91_life:bonus": {
    costTypeLabel: "Többszintű hűség- és díjarányos bónusz",
    rationale:
      "Díjarányos bónusz jár a rendszeres befizetésekre (1.5-5%), évfordulós hűségjóváírásokkal (10/15/20. év) és 16. évtől vagyonarányos bónusszal.",
  },
  "generali_kabala_u91_pension:bonus": {
    costTypeLabel: "Többszintű hűség- és díjarányos bónusz",
    rationale:
      "Díjarányos bónusz jár a rendszeres befizetésekre (1.5-5%), évfordulós hűségjóváírásokkal (10/15/20. év), továbbá 16-19 éves tartamnál speciális lejárati hűségjóváírás is érvényes (6.5-24.5%).",
  },
  "generali_mylife_extra_plusz_u67p_life:bonus": {
    costTypeLabel: "Díjarányos + hűség + vagyonarányos bónusz",
    rationale:
      "Díjarányos bónusz (0/2/4%) minden évben, hűségjóváírás az 5/10/15/20. évben, és 21. évtől éves 0.5% vagyonarányos bónusz.",
  },
  "generali_mylife_extra_plusz_u67p_pension:bonus": {
    costTypeLabel: "Díjarányos + hűség + vagyonarányos bónusz",
    rationale:
      "Díjarányos bónusz (0/2/4%) minden évben, hűségjóváírás az 5/10/15/20. évben, és 21. évtől éves 0.5% vagyonarányos bónusz (nyugdíj variáns).",
  },
  "cig_nyugdijkotvenye:adminFee": {
    costTypeLabel: "Nincs külön admin díj sor",
    rationale: "A termékben külön adminisztrációs díjsor nincs definiálva, a fő levonások más sorokon jelennek meg.",
  },
  "cig_nyugdijkotvenye:acquisitionFee": {
    costTypeLabel: "Tartamfüggő kezdeti költség",
    rationale: "A szerződéskötési és fenntartási díj az első 1-7. évben a választott tartam szerinti táblázat alapján kerül levonásra.",
  },
  "cig_nyugdijkotvenye:accountMaintenance": {
    costTypeLabel: "Nincs külön számlavezetési sor",
    rationale: "A rendszeres számlára nincs külön havi számlavezetési százalék beállítva.",
  },
  "cig_nyugdijkotvenye:assetFee": {
    costTypeLabel: "Eszközalap-függő éves vagyonarányos költség",
    rationale: "Az éves költség mértéke a kiválasztott eszközalaptól függ (pl. 1.22%-1.98%).",
  },
  "cig_nyugdijkotvenye:bonus": {
    costTypeLabel: "Hűségbónusz + éves vagyonarányos bónusz",
    rationale: "A 7. évfordulón egyszeri bónusz jár, majd a 8. évtől évente további 1% bónusz.",
  },
  "cig_nyugdijkotvenye:surrenderValue": {
    costTypeLabel: "Költségmentes teljes visszavásárlás",
    rationale: "A teljes visszavásárlás 100%-os, részleges visszavásárlásnál külön tranzakciós díj szabály érvényesül.",
  },
  "cig_esszenciae_huf:adminFee": {
    costTypeLabel: "Nincs külön admin díj sor",
    rationale: "A termék fő levonásai más költségsorokon jelennek meg; 30 napon belüli elállási költség külön eseményhez kötött.",
  },
  "cig_esszenciae_eur:adminFee": {
    costTypeLabel: "Nincs külön admin díj sor",
    rationale: "A termék fő levonásai más költségsorokon jelennek meg; 30 napon belüli elállási költség külön eseményhez kötött.",
  },
  "cig_esszenciae_huf:acquisitionFee": {
    costTypeLabel: "Tartamfüggő kezdeti költség",
    rationale: "A szerződéskötési és fenntartási díj az első években tartamfüggő ütemezéssel kerül levonásra (HUF variáns).",
  },
  "cig_esszenciae_eur:acquisitionFee": {
    costTypeLabel: "Tartamfüggő kezdeti költség",
    rationale: "A szerződéskötési és fenntartási díj az első években tartamfüggő ütemezéssel kerül levonásra (EUR variáns).",
  },
  "cig_esszenciae_huf:assetFee": {
    costTypeLabel: "Eszközalap-függő vagyonarányos költség",
    rationale: "A költség mértéke a választott eszközalaptól függ; a rendszeres díjas vagyonra az első 3 évben mentesség lehet.",
  },
  "cig_esszenciae_eur:assetFee": {
    costTypeLabel: "Eszközalap-függő vagyonarányos költség",
    rationale: "A költség mértéke a választott eszközalaptól függ; a rendszeres díjas vagyonra az első 3 évben mentesség lehet.",
  },
  "cig_esszenciae_huf:bonus": {
    costTypeLabel: "Kétlépcsős hűségbónusz",
    rationale: "A 7. évfordulón egyszeri hűségbónusz jár, majd a 8. évtől évente további 1% bónusz írható jóvá.",
  },
  "cig_esszenciae_eur:bonus": {
    costTypeLabel: "Kétlépcsős hűségbónusz",
    rationale: "A 7. évfordulón egyszeri hűségbónusz jár, majd a 8. évtől évente további 1% bónusz írható jóvá.",
  },
  "cig_esszenciae_huf:surrenderValue": {
    costTypeLabel: "100%-os teljes visszavásárlás",
    rationale: "A teljes visszavásárlás 100%-os, részleges visszavásárlásnál tranzakciós díj és minimum bent maradó érték szabály érvényes.",
  },
  "cig_esszenciae_eur:surrenderValue": {
    costTypeLabel: "100%-os teljes visszavásárlás",
    rationale: "A teljes visszavásárlás 100%-os, részleges visszavásárlásnál tranzakciós díj és minimum bent maradó érték szabály érvényes.",
  },
  "generali_kabala_u91_life:plusCost": {
    costTypeLabel: "Havi adminisztrációs költség",
    rationale:
      "A mező havi admin költséget vár (Ft/hó). A motor évesen számol, ezért a beírt havi értéket 12-vel szorozva vonja le az adott évben.",
  },
  "generali_kabala_u91_pension:plusCost": {
    costTypeLabel: "Havi adminisztrációs költség",
    rationale:
      "A mező havi admin költséget vár (Ft/hó). A motor évesen számol, ezért a beírt havi értéket 12-vel szorozva vonja le az adott évben (nyugdíj variáns).",
  },
  "generali_mylife_extra_plusz_u67p_life:plusCost": {
    costTypeLabel: "Éves adminisztrációs költség",
    rationale:
      "A díjsáv alapján képzett havi admin költség (200/300/400 Ft) évesítve (12x) kerül levonásra ezen a soron.",
  },
  "generali_mylife_extra_plusz_u67p_pension:plusCost": {
    costTypeLabel: "Éves adminisztrációs költség",
    rationale:
      "A díjsáv alapján képzett havi admin költség (200/300/400 Ft) évesítve (12x) kerül levonásra ezen a soron (nyugdíj variáns).",
  },
  "alfa_zen_ny13:surrenderValue": {
    costTypeLabel: "Lejárati többletdíj-alapú visszavásárlás",
    rationale: "A visszavásárlási levonás az első 120 hónapban 100%, majd 121. hónaptól 15% (10 év feletti tartamnál).",
  },
  "alfa_zen_ny23:surrenderValue": {
    costTypeLabel: "Lejárati többletdíj-alapú visszavásárlás",
    rationale: "A visszavásárlási levonás az első 120 hónapban 100%, majd 121. hónaptól 15% (10 év feletti tartamnál, USD variáns).",
  },
  "alfa_zen_pro_ny08:surrenderValue": {
    costTypeLabel: "Megtakarítási alapszámla-alapú visszavásárlás",
    rationale:
      "A visszavásárlási költség évsávos: 2. év 3.5%, 3-8. év 1.95%, 9-15. év 1.5%, 16. évtől 0%.",
  },
  "alfa_zen_pro_ny14:surrenderValue": {
    costTypeLabel: "Megtakarítási alapszámla-alapú visszavásárlás",
    rationale:
      "A visszavásárlási költség évsávos: 2. év 3.5%, 3-8. év 1.95%, 9-15. év 1.5%, 16. évtől 0% (EUR variáns).",
  },
  "alfa_zen_pro_ny24:surrenderValue": {
    costTypeLabel: "Megtakarítási alapszámla-alapú visszavásárlás",
    rationale:
      "A visszavásárlási költség évsávos: 2. év 3.5%, 3-8. év 1.95%, 9-15. év 1.5%, 16. évtől 0% (USD variáns).",
  },
  "generali_kabala_u91_life:surrenderValue": {
    costTypeLabel: "Költségmentes teljes visszavásárlás",
    rationale: "A teljes visszavásárlási költség 0 Ft, ugyanakkor korai megszüntetéskor a hűségjellegű jóváírások elveszhetnek.",
  },
  "generali_kabala_u91_pension:surrenderValue": {
    costTypeLabel: "Költségmentes teljes visszavásárlás",
    rationale:
      "A teljes visszavásárlási költség 0 Ft, ugyanakkor korai megszüntetéskor a hűségjellegű jóváírások elveszhetnek (nyugdíj variáns).",
  },
  "generali_mylife_extra_plusz_u67p_life:surrenderValue": {
    costTypeLabel: "Befizetés-alapú visszavásárlási levonás",
    rationale:
      "A kezdeti megtakarítási tartam végéig (max. 20. év) a befizetett díjrész 7%-a terhelődik, de legfeljebb az első éves díj 1.5x értéke.",
  },
  "generali_mylife_extra_plusz_u67p_pension:surrenderValue": {
    costTypeLabel: "Befizetés-alapú visszavásárlási levonás",
    rationale:
      "A kezdeti megtakarítási tartam végéig (max. 20. év) a befizetett díjrész 7%-a terhelődik, de legfeljebb az első éves díj 1.5x értéke (nyugdíj variáns).",
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
    currency?: "HUF" | "EUR" | "USD"
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
  if (selectedProduct === "alfa_premium_selection") {
    if (options?.enableTaxCredit && options?.currency === "USD") return "alfa_premium_selection_ny22"
    if (options?.currency === "USD") return "alfa_premium_selection_tr28"
    if (options?.enableTaxCredit && options?.currency === "EUR") return "alfa_premium_selection_ny12"
    if (options?.enableTaxCredit) return "alfa_premium_selection_ny06"
    if (options?.currency === "EUR") return "alfa_premium_selection_tr18"
    return "alfa_premium_selection_tr09"
  }
  if (selectedProduct === "alfa_zen" || selectedProduct === "alfa_zen_eur") {
    return options?.currency === "USD" ? "alfa_zen_ny23" : "alfa_zen_ny13"
  }
  if (selectedProduct === "alfa_zen_pro") {
    if (options?.currency === "USD") return "alfa_zen_pro_ny24"
    return options?.currency === "EUR" ? "alfa_zen_pro_ny14" : "alfa_zen_pro_ny08"
  }
  if (selectedProduct === "generali_kabala") {
    return options?.enableTaxCredit ? "generali_kabala_u91_pension" : "generali_kabala_u91_life"
  }
  if (selectedProduct === "generali_mylife_extra_plusz") {
    return options?.enableTaxCredit
      ? "generali_mylife_extra_plusz_u67p_pension"
      : "generali_mylife_extra_plusz_u67p_life"
  }
  if (selectedProduct === "cig_esszenciae") {
    return options?.currency === "EUR" ? "cig_esszenciae_eur" : "cig_esszenciae_huf"
  }
  if (selectedProduct === "cig_nyugdijkotvenye") return "cig_nyugdijkotvenye"
  if (selectedProduct === "alfa_relax_plusz") return "alfa_relax_plusz_ny01"
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

export function getColumnExplanationWithFallback(columnKey: string | null | undefined): ColumnExplanation | undefined {
  if (!columnKey) return undefined
  const direct = COLUMN_EXPLANATIONS[columnKey]
  if (direct) return direct

  if (columnKey.startsWith("custom-cost:")) {
    const label = columnKey.replace("custom-cost:", "").trim()
    return {
      title: label || "Egyedi költség",
      summary: "Felhasználó által definiált dinamikus költség oszlop.",
      detail: "A kiválasztott típus/frekvencia/számla alapján számolt éves levonás.",
    }
  }

  if (columnKey.startsWith("custom-bonus:")) {
    const label = columnKey.replace("custom-bonus:", "").trim()
    return {
      title: label || "Egyedi bónusz",
      summary: "Felhasználó által definiált dinamikus bónusz oszlop.",
      detail: "A kiválasztott típus/frekvencia/számla alapján számolt éves jóváírás.",
    }
  }

  return undefined
}

