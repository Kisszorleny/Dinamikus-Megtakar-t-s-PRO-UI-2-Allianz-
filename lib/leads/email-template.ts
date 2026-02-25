import type { LeadPayload } from "@/lib/leads/schema"
import type { LeadChartSeries, LeadEmailInsights } from "@/lib/leads/top-offers"

function esc(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function pretty(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-"
  if (typeof value === "number") return new Intl.NumberFormat("hu-HU").format(value)
  if (typeof value === "boolean") return value ? "Igen" : "Nem"
  return String(value)
}

function formatRequestType(requestType: LeadPayload["requestType"]) {
  if (requestType === "A") return "A - Új megtakarítást szeretne"
  if (requestType === "B") return "B - Meglévő megtakarítás összehasonlítása"
  return "C - Portfólióelemzés"
}

function renderCalcSummaryRows(payload: LeadPayload): string {
  const summary = payload.calcSummary ?? {}
  const rows: Array<[string, unknown]> = [
    ["Biztosító", summary.insurer],
    ["Termék", summary.product],
    ["Futamidő", summary.durationValue ? `${summary.durationValue} ${summary.durationUnit ?? "év"}` : undefined],
    ["Fizetési gyakoriság", summary.frequency],
    ["Rendszeres befizetés", summary.regularPayment],
    ["Összes befizetés", summary.totalContributions],
    ["Becsült egyenleg", summary.estimatedEndBalance],
    ["Adójóváírás", summary.totalTaxCredit],
    ["Pénznem", summary.currency],
  ]

  return rows
    .map(
      ([key, value]) =>
        `<tr><td style="padding:6px 10px;border:1px solid #ddd;font-weight:600;">${esc(key)}</td><td style="padding:6px 10px;border:1px solid #ddd;">${esc(pretty(value))}</td></tr>`,
    )
    .join("")
}

function renderFormPayloadRows(payload: LeadPayload): string {
  const rows = Object.entries(payload.formPayload ?? {})
  if (rows.length === 0) {
    return `<tr><td style="padding:6px 10px;border:1px solid #ddd;">Nincs megadott űrlap adat.</td></tr>`
  }

  return rows
    .map(
      ([key, value]) =>
        `<tr><td style="padding:6px 10px;border:1px solid #ddd;font-weight:600;">${esc(key)}</td><td style="padding:6px 10px;border:1px solid #ddd;">${esc(pretty(value))}</td></tr>`,
    )
    .join("")
}

function formatCurrency(value: number, currency: "HUF" | "EUR" | "USD"): string {
  return new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

function renderRankedRows(insights: LeadEmailInsights): string {
  return insights.offers
    .map((offer, index) => {
      return `
        <tr>
          <td style="padding:8px 0 6px;font-size:13px;line-height:1.4;color:#1c3352;">
            <strong>${index + 1}. ${esc(offer.insurer)} - ${esc(offer.label)}</strong><br />
            <span style="color:#506581;">Visszavásárlási érték: ${esc(formatCurrency(offer.surrenderValue, insights.currency))}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:0 0 10px;">
            <div style="width:100%;height:10px;background:#e7edf7;border-radius:999px;overflow:hidden;">
              <div style="width:${offer.ratioPercent}%;height:10px;background:#2355a8;border-radius:999px;"></div>
            </div>
          </td>
        </tr>
      `
    })
    .join("")
}

function renderSeriesRows(series: LeadChartSeries, currency: "HUF" | "EUR" | "USD"): string {
  return series.items
    .map((item, index) => {
      return `
        <tr>
          <td style="padding:7px 0 5px;font-size:12px;line-height:1.4;color:#203a5c;">
            ${index + 1}. ${esc(item.insurer)} - ${esc(item.label)}<br />
            <span style="color:#506581;">${esc(formatCurrency(item.value, currency))}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:0 0 8px;">
            <div style="width:100%;height:8px;background:#e8eef8;border-radius:999px;overflow:hidden;">
              <div style="width:${item.ratioPercent}%;height:8px;background:#2f63ba;border-radius:999px;"></div>
            </div>
          </td>
        </tr>
      `
    })
    .join("")
}

function renderTopOffersSection(insights: LeadEmailInsights | null | undefined): string {
  if (!insights || insights.offers.length === 0) return ""

  const moreOptions =
    insights.additionalOptionsCount > 0
      ? `<p style="margin:8px 0 0;font-size:12px;line-height:1.5;color:#5a6f89;">+ Még legalább ${insights.additionalOptionsCount} további lehetőség is elérhető, amelyeket személyre szabottan bemutatunk.</p>`
      : ""

  return `
    <div style="margin:18px 0;padding:14px 16px;background:#f7f9fe;border:1px solid #dce5f5;border-radius:10px;">
      <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#18396b;">Top 3 lehetőség az Ön időtávjára (${insights.horizonYears} év)</p>
      <p style="margin:0 0 10px;font-size:12px;line-height:1.5;color:#5a6f89;">Az alábbi rangsort a becsült visszavásárlási érték alapján készítettük.</p>
      <table style="width:100%;border-collapse:collapse;">${renderRankedRows(insights)}</table>
      ${moreOptions}
    </div>
  `
}

function renderDetailedInsightsSection(insights: LeadEmailInsights | null | undefined): string {
  if (!insights || insights.offers.length === 0) return ""

  const charts = insights.chartSeries
    .map(
      (series) => `
      <div style="margin:10px 0;padding:10px 12px;border:1px solid #dce5f5;border-radius:8px;background:#ffffff;">
        <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#18396b;">${esc(series.label)}</p>
        <table style="width:100%;border-collapse:collapse;">${renderSeriesRows(series, insights.currency)}</table>
      </div>
    `,
    )
    .join("")

  const moreOptions =
    insights.additionalOptionsCount > 0
      ? `<p style="margin:8px 0 0;font-size:12px;line-height:1.5;color:#5a6f89;">+ Még legalább ${insights.additionalOptionsCount} további lehetőség is elérhető, személyre szabott részletekkel.</p>`
      : ""

  return `
    <div style="margin:18px 0;padding:14px 16px;background:#f7f9fe;border:1px solid #dce5f5;border-radius:10px;">
      <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#18396b;">Részletes kiértékelés (${insights.horizonYears} év)</p>
      <p style="margin:0 0 10px;font-size:12px;line-height:1.5;color:#5a6f89;">Top 3 termék összevetése több nézőpontból.</p>
      ${charts}
      ${moreOptions}
    </div>
  `
}

function renderInsightsForRequest(payload: LeadPayload, insights: LeadEmailInsights | null | undefined): string {
  if (!insights) return ""
  return payload.requestType === "B" || payload.requestType === "C"
    ? renderDetailedInsightsSection(insights)
    : renderTopOffersSection(insights)
}

function renderInsightsText(payload: LeadPayload, insights: LeadEmailInsights | null | undefined): string[] {
  if (!insights || insights.offers.length === 0) return []

  const lines: string[] = [
    "",
    `Top 3 lehetoseg (${insights.horizonYears} ev):`,
    ...insights.offers.map(
      (offer, index) => `${index + 1}. ${offer.insurer} - ${offer.label}: ${formatCurrency(offer.surrenderValue, insights.currency)}`,
    ),
  ]

  if (payload.requestType === "B" || payload.requestType === "C") {
    lines.push("")
    lines.push("Reszletes metrikak:")
    for (const series of insights.chartSeries) {
      lines.push(`- ${series.label}:`)
      for (const item of series.items) {
        lines.push(`  - ${item.insurer} - ${item.label}: ${formatCurrency(item.value, insights.currency)}`)
      }
    }
  }

  if (insights.additionalOptionsCount > 0) {
    lines.push(`+ Meg legalabb ${insights.additionalOptionsCount} tovabbi lehetoseg is elerheto.`)
  }

  return lines
}

export function buildLeadAdminEmail(payload: LeadPayload, options?: { insights?: LeadEmailInsights | null }) {
  const subject = `Új lead (${payload.requestType}) - ${payload.contact.name} - ${new Date().toLocaleString("hu-HU")}`
  const html = `
    <div style="margin:0;background:#f3f6fb;padding:28px 14px;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:#132238;">
      <table role="presentation" style="width:100%;max-width:760px;margin:0 auto;border-collapse:collapse;">
        <tr>
          <td style="padding:0;">
            <div style="background:#16376b;color:#ffffff;border-radius:12px 12px 0 0;padding:18px 22px;">
              <p style="margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.85;">Dinamikus Megtakarítás</p>
              <h1 style="margin:8px 0 0;font-size:23px;line-height:1.2;">Új lead érkezett</h1>
              <p style="margin:10px 0 0;font-size:14px;opacity:.9;">${esc(formatRequestType(payload.requestType))}</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:0;">
            <div style="background:#ffffff;border:1px solid #d8e1ef;border-top:none;border-radius:0 0 12px 12px;padding:22px;">
              <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#2f4159;">
                Beérkezés ideje: <strong>${esc(new Date().toLocaleString("hu-HU"))}</strong>
              </p>

              <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#18396b;">Kapcsolattartási adatok</p>
              <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 16px;">
                <tr>
                  <td style="padding:8px 10px;border:1px solid #d8e1ef;background:#f9fbff;font-weight:600;width:35%;">Név</td>
                  <td style="padding:8px 10px;border:1px solid #d8e1ef;">${esc(payload.contact.name)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 10px;border:1px solid #d8e1ef;background:#f9fbff;font-weight:600;">Email</td>
                  <td style="padding:8px 10px;border:1px solid #d8e1ef;">${esc(payload.contact.email)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 10px;border:1px solid #d8e1ef;background:#f9fbff;font-weight:600;">Telefonszám</td>
                  <td style="padding:8px 10px;border:1px solid #d8e1ef;">${esc(payload.contact.phone)}</td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#18396b;">Űrlap adatok</p>
              <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 16px;">${renderFormPayloadRows(payload)}</table>

              <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#18396b;">Kalkulációs összefoglaló</p>
              <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 16px;">${renderCalcSummaryRows(payload)}</table>
              ${renderInsightsForRequest(payload, options?.insights)}

              <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#18396b;">Kalkulációs snapshot (rövidített)</p>
              <pre style="margin:0;white-space:pre-wrap;background:#f7f9fe;border:1px solid #dce5f5;padding:12px;border-radius:8px;font-size:12px;line-height:1.5;color:#1f334d;">${esc(
                JSON.stringify(payload.calcSnapshot ?? {}, null, 2).slice(0, 4000),
              )}</pre>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `

  const text = [
    "Uj lead erkezett a landing oldalrol",
    `Tipus: ${formatRequestType(payload.requestType)}`,
    "",
    "Kapcsolattartasi adatok:",
    `- Nev: ${payload.contact.name}`,
    `- Email: ${payload.contact.email}`,
    `- Telefon: ${payload.contact.phone}`,
    "",
    "Form adatok:",
    JSON.stringify(payload.formPayload ?? {}, null, 2),
    "",
    "Kalkulacios osszefoglalo:",
    JSON.stringify(payload.calcSummary ?? {}, null, 2),
    ...renderInsightsText(payload, options?.insights),
  ].join("\n")

  return { subject, html, text }
}

export function buildLeadCustomerConfirmationEmail(
  payload: LeadPayload,
  options?: { insights?: LeadEmailInsights | null },
) {
  const subject = "Köszönjük az érdeklődést - Dinamikus Megtakarítás"
  const html = `
    <div style="margin:0;background:#f3f6fb;padding:28px 14px;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:#132238;">
      <table role="presentation" style="width:100%;max-width:620px;margin:0 auto;border-collapse:collapse;">
        <tr>
          <td style="padding:0;">
            <div style="background:#1e3a6e;color:#ffffff;border-radius:12px 12px 0 0;padding:18px 22px;">
              <p style="margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.85;">Dinamikus Megtakarítás</p>
              <h1 style="margin:8px 0 0;font-size:24px;line-height:1.2;">Köszönjük az érdeklődést!</h1>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:0;">
            <div style="background:#ffffff;border:1px solid #d8e1ef;border-top:none;border-radius:0 0 12px 12px;padding:22px;">
              <p style="margin:0 0 12px;font-size:16px;line-height:1.5;">Kedves ${esc(payload.contact.name)}!</p>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#2f4159;">
                Sikeresen megkaptuk az igényedet. Kollégánk rövid időn belül felveszi veled a kapcsolatot a megadott elérhetőségeken.
              </p>

              <div style="margin:18px 0;padding:14px 16px;background:#f7f9fe;border:1px solid #dce5f5;border-radius:10px;">
                <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#18396b;">Mi történik ezután?</p>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#304760;">
                  1) Átnézzük az igényedet<br />
                  2) Előkészítjük a releváns lehetőségeket<br />
                  3) Visszahívunk a részletekkel
                </p>
              </div>
              ${renderInsightsForRequest(payload, options?.insights)}

              <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#18396b;">Beküldött adatok</p>
              <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <tr>
                  <td style="padding:8px 10px;border:1px solid #d8e1ef;background:#f9fbff;font-weight:600;width:35%;">Igény típusa</td>
                  <td style="padding:8px 10px;border:1px solid #d8e1ef;">${esc(formatRequestType(payload.requestType))}</td>
                </tr>
                <tr>
                  <td style="padding:8px 10px;border:1px solid #d8e1ef;background:#f9fbff;font-weight:600;">Név</td>
                  <td style="padding:8px 10px;border:1px solid #d8e1ef;">${esc(payload.contact.name)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 10px;border:1px solid #d8e1ef;background:#f9fbff;font-weight:600;">Email</td>
                  <td style="padding:8px 10px;border:1px solid #d8e1ef;">${esc(payload.contact.email)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 10px;border:1px solid #d8e1ef;background:#f9fbff;font-weight:600;">Telefonszám</td>
                  <td style="padding:8px 10px;border:1px solid #d8e1ef;">${esc(payload.contact.phone)}</td>
                </tr>
              </table>

              <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#2f4159;">
                Üdvözlettel,<br />
                <strong>Dinamikus Megtakarítás</strong>
              </p>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `

  const text = [
    "Koszonjuk az erdeklodest!",
    "",
    `Kedves ${payload.contact.name}!`,
    "",
    "Sikeresen megkaptuk az igenyedet.",
    "Kollégánk hamarosan felveszi veled a kapcsolatot.",
    ...renderInsightsText(payload, options?.insights),
    "",
    `Igeny tipusa: ${formatRequestType(payload.requestType)}`,
    `Nev: ${payload.contact.name}`,
    `Email: ${payload.contact.email}`,
    `Telefon: ${payload.contact.phone}`,
    "",
    "Udvozlettel,",
    "Dinamikus Megtakaritas",
  ].join("\n")

  return { subject, html, text }
}
