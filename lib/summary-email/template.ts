export type Currency = "HUF" | "EUR" | "USD"

type RowKey =
  | "accountName"
  | "accountGoal"
  | "monthlyPayment"
  | "yearlyPayment"
  | "years"
  | "totalContributions"
  | "strategy"
  | "annualYield"
  | "totalReturn"
  | "endBalance"
  | "totalTaxCredit"
  | "totalBonus"
  | "netEndBalance"
  | "netEndBalanceWithTax"
  | "endBalanceHufCurrent"
  | "endBalanceEUR500"
  | "endBalanceEUR600"
  | "finalEndBalance"
  | "netFinalEndBalance"

export type EmailTone = {
  youNom: string
  youDative: string
  youAcc: string
  yourBy: string
  yourByCap: string
  contactVerb: string
  canVerb: string
  canVerbSimple: string
}

export function getSummaryEmailTone(emailTegezo: boolean): EmailTone {
  if (emailTegezo) {
    return {
      youNom: "Te",
      youDative: "Neked",
      youAcc: "Téged",
      yourBy: "az általad",
      yourByCap: "Az általad",
      contactVerb: "keress",
      canVerb: "tudd",
      canVerbSimple: "tudod",
    }
  }

  return {
    youNom: "Ön",
    youDative: "Önnek",
    youAcc: "Önt",
    yourBy: "az Ön által",
    yourByCap: "Ön által",
    contactVerb: "keressen",
    canVerb: "tudja",
    canVerbSimple: "tudja",
  }
}

type EmailImageSlots = {
  penz?: string
  chart?: string
  chart2?: string
  penzkoteg?: string
}

export type SummaryEmailTemplateInput = {
  safeName: string
  safeUntil: string
  emailTegezo: boolean
  displayCurrency: Currency
  tone: EmailTone
  subject: string
  values: {
    accountName: string
    accountGoal: string
    monthlyPayment: string
    yearlyPayment: string
    years: string
    totalContributions: string
    strategy: string
    annualYield: string
    totalReturn: string
    endBalance: string
    totalBonus?: string
    finalNet: string
  }
  images?: EmailImageSlots
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function buildSummaryEmailTemplate(input: SummaryEmailTemplateInput) {
  const { safeName, safeUntil, emailTegezo, displayCurrency, tone, subject, values } = input
  const images = input.images ?? {}
  const FONT = "Calibri, Arial, Helvetica, sans-serif"
  const BLUE = "#2F5597"
  const ORANGE = "#ED7D31"
  const ORANGE_DARK = "#C55A11"
  const ORANGE_DARKER = "#8a4b12"
  const BORDER = "#c9c9c9"

  const spanOrange = (text: string) =>
    `<span style="display:inline-block; background:${ORANGE}; color:#ffffff; font-weight:700; padding:2px 8px;">${esc(text)}</span>`

  const heading = (text: string) =>
    `<div style="margin: 34px 0 12px 0;"><span style="display:inline-block; background:${ORANGE}; color:#ffffff; font-weight:700; padding:6px 12px; font-family:${FONT}; font-size:22px;">${esc(text)}</span></div>`

  const p = (text: string, bold = false) =>
    `<div style="color:${BLUE}; font-family:${FONT}; font-size:18px; line-height:1.35; ${bold ? "font-weight:700;" : "font-weight:600;"} margin: 0 0 6px 0;">${text}</div>`

  const pSpacer = (h = 14) => `<div style="height:${h}px; line-height:${h}px;">&nbsp;</div>`

  const cellBase = `border:1px solid ${BORDER}; padding:7px 10px; font-family:${FONT}; font-size:16px; line-height:1.2;`
  const cellLabel = `${cellBase} color:#000000; font-weight:600;`
  const cellValue = `${cellBase} color:${BLUE}; font-weight:700; text-align:left; white-space:nowrap;`

  const tableRow = (label: string, valueText: string) => `
    <tr>
      <td style="${cellLabel}">${esc(label)}</td>
      <td style="${cellValue}">${esc(valueText)}</td>
    </tr>
  `

  const spacerRow = () => `
    <tr>
      <td style="${cellBase} background:#ffffff; height:16px;">&nbsp;</td>
      <td style="${cellBase} background:#ffffff; height:16px;">&nbsp;</td>
    </tr>
  `

  const highlightRow = (label: string, valueText: string) => `
    <tr>
      <td style="${cellBase} background:${ORANGE_DARK}; color:#ffffff; font-weight:700; font-size:18px;">${esc(label)}</td>
      <td style="${cellBase} background:${ORANGE_DARKER}; color:#ffffff; font-weight:700; font-size:18px; text-align:left; white-space:nowrap;">${esc(
        valueText,
      )}</td>
    </tr>
  `

  const summaryTableHtml = `
    <table cellspacing="0" cellpadding="0" style="border-collapse:collapse; width:760px; margin: 18px 0;">
      <tbody>
        ${tableRow("Megtakarítási számla megnevezése", values.accountName)}
        ${tableRow("Megtakarítási számla célja:", values.accountGoal)}
        ${tableRow("Megtakarítási havi összeg:", values.monthlyPayment)}
        ${tableRow("Megtakarítási éves összeg:", values.yearlyPayment)}
        ${tableRow("Tervezett időtartam:", values.years)}
        ${spacerRow()}
        ${tableRow("Teljes befizetés:", values.totalContributions)}
        ${tableRow("Hozam stratégia:", values.strategy)}
        ${tableRow("Éves nettó hozam:", values.annualYield)}
        ${tableRow("Várható hozam:", values.totalReturn)}
        ${tableRow("Megtakarítás számlán várható összeg:", values.endBalance)}
        ${values.totalBonus ? tableRow("Bónuszjóváírás tartam alatt összesen:", values.totalBonus) : ""}
        ${highlightRow("Teljes megtakarítás nettó értéke:", values.finalNet)}
      </tbody>
    </table>
  `

  const penzImage = images.penz
    ? `<div style="margin: 12px 0 12px 0;"><img src="${esc(images.penz)}" alt="" style="display:block; width:84px; height:84px; border:0;" /></div>`
    : ""
  const chartImage = images.chart
    ? `<div style="margin: 12px 0 12px 0;"><img src="${esc(images.chart)}" alt="" style="display:block; width:84px; height:84px; border:0;" /></div>`
    : ""
  const chart2Image = images.chart2
    ? `<div style="margin: 12px 0 12px 0;"><img src="${esc(images.chart2)}" alt="" style="display:block; width:84px; height:84px; border:0;" /></div>`
    : ""
  const penzkotegImage = images.penzkoteg
    ? `<div style="margin: 12px 0 12px 0;"><img src="${esc(images.penzkoteg)}" alt="" style="display:block; width:84px; height:84px; border:0;" /></div>`
    : ""

  const yearlyReviewLines = emailTegezo
    ? [
        "Évente egyszer a megtakarítási évforduló",
        "alkalmával kötelezően felkereslek és Velem,",
        "mint megtakarítási szakértőddel közösen,",
        "felülvizsgáljuk a megtakarítás számlád értékét.",
        "Valamint segítek eligazodni a hozamok,",
        "befektetési alapok között.",
      ]
    : [
        "Évente egyszer a megtakarítási évforduló",
        "alkalmával kötelezően felkeresem és Velem,",
        "mint megtakarítási szakértője támogatásával,",
        "felülvizsgáljuk a megtakarítás számla értékét.",
        "Valamint segítek eligazodni a hozamok,",
        "befektetési alapok között.",
      ]

  const rugalmasLines = emailTegezo
    ? [
        "amennyiben a megtakarítási időszak alatt szeretnél a",
        "Bónusz számládról pénzt kivenni, erre is van lehetőséged",
        "akár már harmadik év után.",
      ]
    : [
        "amennyiben a megtakarítási időszak alatt szeretne a",
        "Bónusz számlájáról pénzt kivenni, erre van lehetősége",
        "akár már harmadik év után.",
      ]

  const kamatadoLine = emailTegezo ? "Kamatadó mentes a megtakarítás 10 év után." : "Kamatadó mentes a megtakarítása 10 év után."

  const tegezoHtml = `
    <div style="background:#ffffff; padding:0; margin:0;">
      <div style="padding-left: 40px;">
        <div style="font-family:${FONT}; color:${BLUE}; font-size:36px; font-style:italic; font-weight:700; margin: 0 0 18px 0;">
          ${esc(`Kedves ${safeName}!`)}
        </div>

        ${p("Telefonos megbeszélésünkre hivatkozva küldöm, Neked a")}
        ${p(`<span style="font-weight:700;">${esc(subject)}</span>`)}
        ${p("terméktájékoztatóját, valamint a megtakarítási tervezetet.")}

        ${pSpacer(18)}

        ${p("Az alábbi ajánlat, Allianz prémium ügyfeleknek szóló konstrukció,", true)}
        ${p(
          `mely &nbsp; ${safeUntil ? `${spanOrange(safeUntil)}.-` : spanOrange("...")} ig érhető el.`,
          true,
        )}

        ${summaryTableHtml}

        ${pSpacer(24)}

        ${penzImage}
        ${heading("Teljes költségmutató (TKM)")}
        ${p("A biztosítók más és más költséggel dolgoznak,")}
        ${p("ezt a mutatót az MNB hozta létre melynek célja,")}
        ${p("hogy a megtakarító tudjon mérlegelni, hogy")}
        ${p("melyik biztosítónál helyezi el a megtakarítását.")}
        ${pSpacer(16)}
        ${p("Látszólag mindegy, hogy hol takarítunk meg ugyanis,")}
        ${p("1-3 % különbség van a biztosítók TKM értékében,")}
        ${p("azonban ez a százalékos különbség hosszútávon")}
        ${p("Milliós különbséget tud jelenteni.", true)}

        ${heading("Díjmentes számlavezetés")}
        ${p(displayCurrency === "HUF" ? "990 Ft a havi számlavezetési költség," : "3.3 Euro a havi számlavezetési költség,")}
        ${p("melyet most az első évben elengedünk.", true)}

        ${heading("Díjmentes eszközalap váltás")}
        ${p("A piacon egyedülálló módon tudod a befektetésed")}
        ${p("kezelni, ugyanis az Allianznál limit nélkül tudsz a befektetési")}
        ${p("alapok között váltani.", true)}
        ${pSpacer(16)}
        ${p("Évente egyszer a megtakarítási évforduló")}
        ${p("alkalmával kötelezően felkereslek és Velem,")}
        ${p("mint megtakarítási szakértőddel közösen,")}
        ${p("felülvizsgáljuk a megtakarítás számlád értékét.")}
        ${p("Valamint segítek eligazodni a hozamok,")}
        ${p("befektetési alapok között.")}

        ${penzkotegImage}
        ${heading("+ Extra Bónusz")}
        ${chart2Image}
        ${heading("FIX Bónusz jóváírás a hozamokon felül")}
        ${p("Minden évben kapsz bónusz jóváírást is,")}
        ${p("pontosan annyi százalékot,")}
        ${p("ahányadik évben jár a megtakarítási")}
        ${p("számlálád a következőképpen:", true)}
        ${p(`1. évben ${spanOrange("+1 % bónusz")}`)}
        ${p(`2. évben ${spanOrange("+2 % bónusz")}`)}
        ${p(`3. évben ${spanOrange("+3 % bónusz")}`)}
        ${p(`4. évben ${spanOrange("+4 % bónusz")}`)}
        ${p("..és így tovább egészen az utolsó megtakarítási évig bezárólag.")}
        ${p("Megéri tovább tervezni")}
        ${p(`ugyanis például a 10. évben már ${spanOrange("+10% jóváírást")} kapsz az éves megtakarításaid után.`, true)}

        ${pSpacer(24)}
        ${chartImage}
        ${heading("Kiemelkedő hozamú részvényekben kamatoztatjuk pénzét")}
        ${p("<span style=\"font-weight:700;\">Világgazdasági Részvény</span>")}
        ${p(`2024 01. - 2025 01. hozam: ${spanOrange("33,6 % / év")}`)}
        ${p(`2020 01. - 2025 01. hozam: ${spanOrange("106,80 % / 5év")}`)}
        ${pSpacer(10)}
        ${p("<span style=\"font-weight:700;\">Ipari Nyersanyag Eszközalap</span>")}
        ${p(`2024 01. - 2025 01. hozam: ${spanOrange("27,53 % / év")}`)}
        ${p(`2020 01. - 2025 01. hozam: ${spanOrange("144,91 % / 5év")}`)}
        ${pSpacer(10)}
        ${p("<span style=\"font-weight:700;\">Környezettudatos Részvény</span>")}
        ${p(`2024 01. - 2025 01. hozam: ${spanOrange("27,01 % / év")}`)}
        ${p(`2020 01. - 2025 01. hozam: ${spanOrange("89,02 % / 5év")}`)}
        ${pSpacer(10)}
        <div style="font-family:${FONT}; font-size:12px; color:#000000; font-weight:700; margin-top: 6px;">
          forrás: profitline.hu - Ön is tudja ellenőrizni jelen megtakarítási hozamokat.
        </div>

        ${pSpacer(24)}
        ${p("amennyiben a fent meghatározott promóciós időszakban")}
        ${p(`indítod el megtakarítási számládat, &nbsp; <span style="font-weight:700;">3 000 000 Ft</span> összegre`)}
        ${p("biztosítjuk Téged közlekedési baleseti halál esetén,")}
        ${p("melyet az általad megjelölt kedvezményezett fog kapni", true)}

        ${heading("Biztonságos megtakarítási forma")}
        ${p("jogilag meghatározott formája nem teszi lehetővé,")}
        ${p("hogy az állam vagy a NAV inkasszálja az")}
        ${p("általad félretett összeget.", true)}
        ${p("Szociális hozzájárulási adó, valamint")}
        ${p("Kamatadó mentes a megtakarítás 10 év után.", true)}

        ${heading("Rugalmas")}
        ${p("amennyiben a megtakarítási időszak alatt szeretnél a")}
        ${p("Bónusz számládról pénzt kivenni, erre is van lehetőséged", true)}
        ${p("akár már harmadik év után.")}

        ${heading("Örökölhető")}
        ${p("halál esetén az általad megjelölt kedvezményezett kapja")}
        ${p("a megtakarítási számla összegét hagyatéki eljárás alá nem vonható,")}
        ${p("8 napon belül a kedvezményezett számlájára a teljes összeg kiutalásra kerül", true)}

        ${pSpacer(24)}
        ${p(
          "A közös munkánk során én folyamatosan figyelemmel fogom kísérni befektetésed és segíteni fogok Neked,",
        )}
        ${p(
          "hogy mindig a legkedvezőbb és az éppen aktuális élethelyzetéhez leginkább igazodó döntéseket tudd meghozni a pénzügyeidet illetően.",
          true,
        )}
        ${p("Hiszem, hogy a folyamatos és rendszeres kommunikáció a siker alapja.", true)}
      </div>
    </div>
  `.trim()

  const magazosHtml = `
    <div style="background:#ffffff; padding:0; margin:0;">
      <div style="padding-left: 40px;">
        <div style="font-family:${FONT}; color:${BLUE}; font-size:36px; font-style:italic; font-weight:700; margin: 0 0 18px 0;">
          ${esc(`Kedves ${safeName}!`)}
        </div>

        ${p(`Telefonos megbeszélésünkre hivatkozva küldöm, <span style="font-weight:700;">${tone.youDative}</span> a`)}
        ${p(`<span style="font-weight:700;">${esc(subject)}</span>`)}
        ${p("terméktájékoztatóját, valamint a megtakarítási tervezetet.")}

        ${pSpacer(18)}

        ${p("Az alábbi ajánlat, Allianz prémium ügyfeleknek szóló konstrukció,", true)}
        ${p(`mely ${safeUntil ? spanOrange(safeUntil) : spanOrange("...")} <span style="font-weight:700;">- ig</span> érhető el.`, true)}

        ${summaryTableHtml}

        ${penzImage}
        ${heading("Teljes költségmutató (TKM)")}
        ${p("A biztosítók más és más költséggel dolgoznak,")}
        ${p("ezt a mutatót az MNB hozta létre melynek célja,")}
        ${p("hogy a megtakarító tudjon mérlegelni, hogy")}
        ${p(emailTegezo ? "melyik biztosítónál helyezed el a megtakarításod." : "melyik biztosítónál helyezi el a megtakarítását.")}
        ${pSpacer(16)}
        ${p(emailTegezo ? "Látszólag mindegy, hogy hol takarítunk meg ugyanis," : "Látszólag mindegy, hogy hol takarít meg ugyanis,")}
        ${p("1-3 % különbség van a biztosítók TKM értékében,")}
        ${p("azonban ez a százalékos különbség hosszútávon")}
        ${p(emailTegezo ? "Milliós különbséget tud jelenteni." : `${tone.youDative} milliós különbséget jelent.`, true)}

        ${heading("Díjmentes számlavezetés")}
        ${p(displayCurrency === "HUF" ? "990 Ft a havi számlavezetési költség," : "3.3 Euro a havi számlavezetési költség,")}
        ${p("melyet most az első évben elengedünk.", true)}

        ${heading("Díjmentes eszközalap váltás")}
        ${p(emailTegezo ? "A piacon egyedülálló módon tudod a befektetésed" : "Piacon egyedülálló módon tudja a befektetését")}
        ${p(emailTegezo ? "kezelni, ugyanis az Allianznál limit nélkül tudsz a befektetési" : "kezelni, ugyanis limit nélkül tud a befektetési")}
        ${p("alapok között váltani.", true)}
        ${pSpacer(16)}
        ${yearlyReviewLines.map((line) => p(line)).join("")}

        ${pSpacer(22)}
        ${p("<span style=\"font-weight:700;\">Világgazdasági Részvény</span>")}
        ${p(`2024 01. - 2025 01. hozam: ${spanOrange("33,6 % / év")}`)}
        ${p(`2020 01. - 2025 01. hozam: ${spanOrange("106,80 % / 5év")}`)}
        ${pSpacer(12)}
        ${p("<span style=\"font-weight:700;\">Ipari Nyersanyag Eszközalap</span>")}
        ${p(`2024 01. - 2025 01. hozam: ${spanOrange("27,53 % / év")}`)}
        ${p(`2020 01. - 2025 01. hozam: ${spanOrange("144,91 % / 5év")}`)}
        ${pSpacer(12)}
        ${p("<span style=\"font-weight:700;\">Környezettudatos Részvény</span>")}
        ${p(`2024 01. - 2025 01. hozam: ${spanOrange("27,01 % / év")}`)}
        ${p(`2020 01. - 2025 01. hozam: ${spanOrange("89,02 % / 5év")}`)}
        ${pSpacer(10)}
        <div style="font-family:${FONT}; font-size:12px; color:#000000; font-weight:700; margin-top: 6px;">
          forrás: profilline.hu - ${tone.youNom} is ${tone.canVerbSimple} ellenőrizni jelen megtakarítási hozamokat.
        </div>

        ${penzkotegImage}
        ${heading("+ Extra Bónusz")}
        ${chart2Image}
        ${heading("FIX Bónusz jóváírás a hozamokon felül")}
        ${p(emailTegezo ? "Minden évben kapsz bónusz jóváírást is," : "Minden évben kap bónusz jóváírást,")}
        ${p("pontosan annyi százalékot,")}
        ${p("ahányadik évben jár a megtakarítási")}
        ${p(emailTegezo ? "számlád a következőképpen:" : "számlája a következőképpen:", true)}
        ${p(`1. évben ${spanOrange("+1 % bónusz")}`)}
        ${p(`2. évben ${spanOrange("+2 % bónusz")}`)}
        ${p(`3. évben ${spanOrange("+3 % bónusz")}`)}
        ${p(`4. évben ${spanOrange("+4 % bónusz")}`)}
        ${p("..és így tovább egészen az utolsó megtakarítási évig bezárólag.")}
        ${p("Megéri tovább tervezni", true)}
        ${p(
          emailTegezo
            ? `ugyanis például a 10. évben már ${spanOrange("+10% jóváírást")} kapsz az éves megtakarításaid után.`
            : `ugyanis például a 10. évben már ${spanOrange("+10% jóváírást")} kap az éves megtakarításai után.`,
          true,
        )}

        ${pSpacer(26)}
        ${chartImage}
        ${heading("Kiemelkedő hozamú részvényekben kamatoztatjuk pénzét")}
        ${p("amennyiben a fent meghatározott promóciós időszakban")}
        ${p(
          displayCurrency === "HUF"
            ? emailTegezo
              ? `indítod el megtakarítási számládat, <span style="font-weight:700;">3 000 000 Ft</span> összegre`
              : `indítja el megtakarítási számláját, <span style="font-weight:700;">3 000 000 Ft</span> összegre`
            : emailTegezo
              ? `indítod el megtakarítási számládat, <span style="font-weight:700;">12 000 Euro</span> összegre`
              : `indítja el megtakarítási számláját, <span style="font-weight:700;">12 000 Euro</span> összegre`,
        )}
        ${p(`biztosítjuk ${tone.youAcc} közlekedési baleseti halál esetén,`)}
        ${p(`melyet ${tone.yourBy} megjelölt kedvezményezett fog kapni`, true)}

        ${heading("Biztonságos megtakarítási forma")}
        ${p("jogilag meghatározott formája nem teszi lehetővé,")}
        ${p("hogy az állam vagy a NAV inkasszálja az")}
        ${p(emailTegezo ? "általad félretett összeget." : `${tone.yourByCap} félretett összeget.`, true)}
        ${p("Szociális hozzájárulási adó, valamint")}
        ${p(kamatadoLine, true)}

        ${heading("Rugalmas")}
        ${rugalmasLines.map((line, idx) => p(line, idx === 1)).join("")}

        ${heading("Örökölhető")}
        ${p(`halál esetén ${tone.yourBy} megjelölt kedvezményezett kapja`)}
        ${p("a megtakarítási számla összegét hagyatéki eljárás alá nem vonható,")}
        ${p("8 napon belül a kedvezményezett számlájára a teljes összeg kiutalásra kerül", true)}

        ${pSpacer(26)}
        ${p(
          emailTegezo
            ? `A közös munkánk során én folyamatosan figyelemmel fogom kísérni befektetésed és segíteni fogok ${tone.youDative},`
            : `A közös munkánk során én folyamatosan figyelemmel fogom kísérni befektetését és segíteni fogok ${tone.youDative},`,
        )}
        ${p(
          emailTegezo
            ? `hogy mindig a legkedvezőbb és az éppen aktuális élethelyzetéhez leginkább igazodó döntéseket ${tone.canVerb} meghozni a pénzügyeidet illetően.`
            : `hogy mindig a legkedvezőbb és az éppen aktuális élethelyzetéhez leginkább igazodó döntéseket ${tone.canVerb} meghozni a pénzügyeit illetően.`,
          true,
        )}
        ${p("Hiszem, hogy a folyamatos és rendszeres kommunikáció a siker alapja.", true)}
        ${pSpacer(22)}
        ${p(`További információért vagy bármilyen kérdés esetén ${tone.contactVerb} bizalommal:`, true)}
      </div>
    </div>
  `.trim()

  const html = emailTegezo ? tegezoHtml : magazosHtml

  const plain = [
    `Kedves ${safeName}!`,
    "",
    `${subject}`,
    "",
    `Megtakarítási számla: ${values.accountName}`,
    `Megtakarítás célja: ${values.accountGoal}`,
    `Megtakarítási havi összeg: ${values.monthlyPayment}`,
    `Teljes megtakarítás nettó értéke: ${values.finalNet}`,
  ].join("\n")

  return { html, plain }
}
