import { describe, expect, it, vi } from "vitest"
import { parseTemplateContent } from "@/lib/email-templates/parser"
import { suggestTemplateMappings } from "@/lib/email-templates/auto-detect"
import { renderEmailTemplate } from "@/lib/email-templates/render"
import * as toneConversion from "@/lib/email-templates/tone-conversion"
import { buildTegezoConversionSuggestion } from "@/lib/email-templates/tone-conversion"
import {
  buildCalculatorTableHtml,
  buildCalculatorTableHtmlFromTemplate,
  buildCalculatorTablePlain,
} from "@/lib/email-templates/calculator-table"
import { buildEmlMessage, slugifyVariantFileName } from "@/lib/email-templates/eml"
import { buildStandaloneHtmlEmail } from "@/lib/email-templates/html-export"
import { buildPdfFromEmail } from "@/lib/email-templates/pdf"

describe("email-template tools", () => {
  it("parses LLM JSON wrapped in markdown fences", async () => {
    const prevApiKey = process.env.OPENAI_API_KEY
    const prevModel = process.env.OPENAI_TONE_CONVERSION_MODEL
    process.env.OPENAI_API_KEY = "sk-test"
    process.env.OPENAI_TONE_CONVERSION_MODEL = "gpt-4o-mini"

    const fetchSpy = vi.spyOn(globalThis, "fetch" as never).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content:
                '```json\n{"subject":"Kedves {{name}}!","htmlContent":{"[[DM_HTML_TEXT_0]]":"Kedves {{name}}!"},"textContent":"Kedves {{name}}!"}\n```',
            },
          },
        ],
      }),
    } as never)
    try {
      const doc = {
        subject: "Tisztelt {{name}}!",
        htmlContent: "<p>Tisztelt {{name}}!</p>",
        textContent: "Tisztelt {{name}}!",
      }
      const suggestion = await toneConversion.buildTegezoConversionSuggestion(doc)
      expect(suggestion).toBeTruthy()
      expect(suggestion?.convertedTextContent).toContain("{{name}}")
      expect(suggestion?.llmStatus).toBe("llm_full")
      expect(suggestion?.modelUsed).toBe("gpt-4o-mini")
      expect(suggestion?.convertedHtmlContent).toContain("<p>Kedves {{name}}!</p>")
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      const fetchCall = fetchSpy.mock.calls[0]
      const payload = JSON.parse(String((fetchCall?.[1] as { body?: string } | undefined)?.body || "{}")) as {
        messages?: Array<{ content?: string }>
      }
      const prompt = payload.messages?.[1]?.content || ""
      expect(prompt).toContain("htmlContent:")
      expect(prompt).toContain('{"[[DM_HTML_TEXT_0]]":"Tisztelt __DM_TOKEN_0__!"}')
      expect(prompt).not.toContain("<p>Tisztelt")
    } finally {
      fetchSpy.mockRestore()
      if (prevApiKey === undefined) {
        delete process.env.OPENAI_API_KEY
      } else {
        process.env.OPENAI_API_KEY = prevApiKey
      }
      if (prevModel === undefined) {
        delete process.env.OPENAI_TONE_CONVERSION_MODEL
      } else {
        process.env.OPENAI_TONE_CONVERSION_MODEL = prevModel
      }
    }
  })

  it("builds tegezo conversion suggestion for formal text", async () => {
    const doc = parseTemplateContent(
      "text",
      "Tisztelt Ügyfelünk!\nKérjük, hogy az Ön befizetését 2026.03.10-ig rendezze.\nKöszönjük megtisztelő bizalmát.",
    )
    const suggestion = await buildTegezoConversionSuggestion(doc, { mode: "builtin" })
    expect(suggestion).toBeTruthy()
    expect(suggestion?.status).toBe("pending_review")
    expect(suggestion?.convertedTextContent).toContain("Kedves")
    expect(suggestion?.convertedTextContent || "").toMatch(/kérlek/i)
    expect(suggestion?.targetTone).toBe("tegezo")
  })

  it("falls back when OpenAI model is not configured", async () => {
    const prevApiKey = process.env.OPENAI_API_KEY
    const prevModel = process.env.OPENAI_TONE_CONVERSION_MODEL
    process.env.OPENAI_API_KEY = "sk-test"
    delete process.env.OPENAI_TONE_CONVERSION_MODEL
    try {
      const doc = parseTemplateContent("text", "Tisztelt Ügyfelünk! Kérjük, hogy erősítse meg az adatokat.")
      const suggestion = await buildTegezoConversionSuggestion(doc)
      expect(suggestion).toBeTruthy()
      expect(suggestion?.llmStatus).toBe("llm_unavailable_fallback")
      expect(suggestion?.modelUsed).toBeUndefined()
      expect(suggestion?.convertedTextContent).toBeUndefined()
      expect(suggestion?.convertedHtmlContent).toBeUndefined()
      expect((suggestion?.notes || []).join(" ")).toContain("OPENAI_TONE_CONVERSION_MODEL")
    } finally {
      if (prevApiKey === undefined) {
        delete process.env.OPENAI_API_KEY
      } else {
        process.env.OPENAI_API_KEY = prevApiKey
      }
      if (prevModel === undefined) {
        delete process.env.OPENAI_TONE_CONVERSION_MODEL
      } else {
        process.env.OPENAI_TONE_CONVERSION_MODEL = prevModel
      }
    }
  })

  it("marks partial fallback when LLM call fails", async () => {
    const prevApiKey = process.env.OPENAI_API_KEY
    const prevModel = process.env.OPENAI_TONE_CONVERSION_MODEL
    process.env.OPENAI_API_KEY = "sk-test"
    process.env.OPENAI_TONE_CONVERSION_MODEL = "gpt-5.2"
    const fetchSpy = vi.spyOn(globalThis, "fetch" as never).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: "temporary failure", code: "server_error" } }),
    } as never)
    try {
      const doc = parseTemplateContent("text", "Tisztelt Ügyfelünk! Kérjük, hogy jelezze vissza a részleteket.")
      const suggestion = await buildTegezoConversionSuggestion(doc)
      expect(suggestion).toBeTruthy()
      expect(suggestion?.llmStatus).toBe("llm_partial_fallback")
      expect(suggestion?.modelUsed).toBe("gpt-5.2")
      expect(suggestion?.convertedTextContent).toBeUndefined()
      expect(suggestion?.convertedHtmlContent).toBeUndefined()
      expect((suggestion?.notes || []).join(" ")).toContain("fallback")
    } finally {
      fetchSpy.mockRestore()
      if (prevApiKey === undefined) {
        delete process.env.OPENAI_API_KEY
      } else {
        process.env.OPENAI_API_KEY = prevApiKey
      }
      if (prevModel === undefined) {
        delete process.env.OPENAI_TONE_CONVERSION_MODEL
      } else {
        process.env.OPENAI_TONE_CONVERSION_MODEL = prevModel
      }
    }
  })

  it("keeps ai text but drops html when marker-map coverage is too low", async () => {
    const prevApiKey = process.env.OPENAI_API_KEY
    const prevModel = process.env.OPENAI_TONE_CONVERSION_MODEL
    process.env.OPENAI_API_KEY = "sk-test"
    process.env.OPENAI_TONE_CONVERSION_MODEL = "gpt-5.2"
    const fetchSpy = vi.spyOn(globalThis, "fetch" as never).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content:
                '```json\n{"subject":"Kedves {{name}}!","htmlContent":{"[[DM_HTML_TEXT_0]]":"Kedves {{name}}!"},"textContent":"Kedves {{name}}!\\nKérlek jelezd vissza."}\n```',
            },
          },
        ],
      }),
    } as never)
    try {
      const doc = parseTemplateContent("html", "<p>Tisztelt {{name}}!</p><p>Kérjük, hogy jelezzen vissza.</p>")
      const suggestion = await buildTegezoConversionSuggestion(doc)
      expect(suggestion).toBeTruthy()
      expect(suggestion?.convertedTextContent).toContain("Kedves {{name}}!")
      expect(suggestion?.convertedHtmlContent).toBeUndefined()
      expect(suggestion?.llmStatus).toBe("llm_partial_fallback")
      expect((suggestion?.notes || []).join(" ")).toContain("coverage")
    } finally {
      fetchSpy.mockRestore()
      if (prevApiKey === undefined) {
        delete process.env.OPENAI_API_KEY
      } else {
        process.env.OPENAI_API_KEY = prevApiKey
      }
      if (prevModel === undefined) {
        delete process.env.OPENAI_TONE_CONVERSION_MODEL
      } else {
        process.env.OPENAI_TONE_CONVERSION_MODEL = prevModel
      }
    }
  })

  it("keeps template tokens unchanged during tegezo conversion", async () => {
    const doc = parseTemplateContent("html", "<p>Tisztelt {{name}}!</p><p>Kérjük, hogy az Ön összege: {{amount}}</p>")
    const suggestion = await buildTegezoConversionSuggestion(doc, { mode: "builtin" })
    expect(suggestion).toBeTruthy()
    expect(suggestion?.convertedHtmlContent).toContain("{{name}}")
    expect(suggestion?.convertedHtmlContent).toContain("{{amount}}")
  })

  it("does not return conversion suggestion when formal signals are missing", async () => {
    const doc = parseTemplateContent("text", "Szia! Küldöm az összefoglalót, ha kérdésed van, írj nyugodtan.")
    const suggestion = await buildTegezoConversionSuggestion(doc, { mode: "builtin" })
    expect(suggestion).toBeNull()
  })

  it("converts Önnek phrasing in formal template body", async () => {
    const doc = parseTemplateContent(
      "text",
      "Telefonos megbeszélésünkre hivatkozva küldöm, Önnek a nyugdíj célú megtakarítás terméktájékoztatóját.",
    )
    const suggestion = await buildTegezoConversionSuggestion(doc, { mode: "builtin" })
    expect(suggestion).toBeTruthy()
    expect(suggestion?.convertedTextContent).toContain("neked")
    expect(suggestion?.convertedTextContent).not.toContain("Önnek")
  })

  it("parses html into html and text", () => {
    const parsed = parseTemplateContent("html", "<p>Kedves Béla!</p><p>Összeg: 12 300 Ft</p>")
    expect(parsed.htmlContent).toContain("Kedves Béla")
    expect(parsed.textContent).toContain("Összeg: 12 300 Ft")
  })

  it("builds multipart eml with utf8 encoded subject", () => {
    const eml = buildEmlMessage({
      from: "DM PRO <noreply@example.com>",
      to: "ugyfel@example.com",
      subject: "Árfolyam ajánlat",
      html: "<p>Kedves Ügyfél!</p>",
      plain: "Kedves Ügyfél!",
      date: new Date("2026-03-08T12:00:00Z"),
    })
    expect(eml).toContain("MIME-Version: 1.0")
    expect(eml).toContain("Content-Type: multipart/alternative; boundary=")
    expect(eml).toContain("Content-Type: text/plain; charset=\"UTF-8\"")
    expect(eml).toContain("Content-Type: text/html; charset=\"UTF-8\"")
    expect(eml).toContain("=?UTF-8?B?")
    expect(eml).toContain("\r\n")
    expect(eml).toContain("<p>Kedves Ügyfél!</p>")
  })

  it("slugifies variant file names", () => {
    expect(slugifyVariantFileName("Tegező - Allianz Életprogram Nyugdíj Forintos")).toBe(
      "tegezo-allianz-eletprogram-nyugdij-forintos",
    )
    expect(slugifyVariantFileName("___")).toBe("email-variant")
  })

  it("builds standalone html document for export", () => {
    const html = buildStandaloneHtmlEmail({
      subject: "Teszt ajánlat",
      htmlBody: "<table><tr><td>Kedves Ügyfél!</td></tr></table>",
    })
    expect(html.toLowerCase()).toContain("<!doctype html>")
    expect(html).toContain('<meta charset="utf-8">')
    expect(html).toContain("<title>Teszt ajánlat</title>")
    expect(html).toContain("<table><tr><td>Kedves Ügyfél!</td></tr></table>")
  })

  it("keeps full html export body unchanged", () => {
    const fullDoc = '<html><head><meta charset="utf-8"></head><body><div>Hi</div></body></html>'
    const html = buildStandaloneHtmlEmail({
      subject: "Teszt",
      htmlBody: fullDoc,
    })
    expect(html).toBe(fullDoc)
  })

  it("builds pdf bytes for email content", async () => {
    const pdf = await buildPdfFromEmail({
      subject: "Teszt ajánlat",
      plain: "Kedves Ügyfél!\nEz egy teszt tartalom.",
    })
    expect(pdf).toBeInstanceOf(Uint8Array)
    expect(pdf.length).toBeGreaterThan(100)
    const header = Buffer.from(pdf.slice(0, 4)).toString("utf8")
    expect(header).toBe("%PDF")
  })

  it("builds pdf for hungarian long accents without crashing", async () => {
    const pdf = await buildPdfFromEmail({
      subject: "Tőkenövelés ő és ű",
      plain: "Nyugdíj cél: tőkenövelés, ő, ű.",
    })
    expect(pdf).toBeInstanceOf(Uint8Array)
    expect(pdf.length).toBeGreaterThan(100)
  })

  it("builds pdf when text contains math symbols", async () => {
    const pdf = await buildPdfFromEmail({
      subject: "Összehasonlítás",
      plain: "A ≠ B, C ≤ D, E ≥ F",
    })
    expect(pdf).toBeInstanceOf(Uint8Array)
    expect(pdf.length).toBeGreaterThan(100)
  })

  it("parses eml and extracts subject", () => {
    const eml = [
      "Subject: Teszt sablon",
      "Content-Type: text/plain; charset=utf-8",
      "",
      "Név: Minta Ügyfél",
      "Határidő: 2026.03.10",
    ].join("\n")
    const parsed = parseTemplateContent("eml", eml)
    expect(parsed.subject).toBe("Teszt sablon")
    expect(parsed.textContent).toContain("Határidő: 2026.03.10")
  })

  it("parses multipart eml with base64 plain part", () => {
    const plainText = "Név: Minta Ügyfél\nÖsszeg: 99 000 Ft\nHatáridő: 2026.03.11"
    const base64Body = Buffer.from(plainText, "utf8").toString("base64")
    const eml = [
      "Subject: Multipart teszt",
      'Content-Type: multipart/alternative; boundary="BOUNDARY123"',
      "",
      "--BOUNDARY123",
      "Content-Type: text/plain; charset=utf-8",
      "Content-Transfer-Encoding: base64",
      "",
      base64Body,
      "--BOUNDARY123--",
      "",
    ].join("\n")
    const parsed = parseTemplateContent("eml", eml)
    expect(parsed.subject).toBe("Multipart teszt")
    expect(parsed.textContent).toContain("Összeg: 99 000 Ft")
    expect(parsed.textContent).toContain("Határidő: 2026.03.11")
  })

  it("replaces cid inline image src with data url", () => {
    const png1x1Base64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/w8AAgMBgJ7xT1kAAAAASUVORK5CYII="
    const eml = [
      "Subject: Inline image",
      'Content-Type: multipart/related; boundary="REL1"',
      "",
      "--REL1",
      "Content-Type: text/html; charset=utf-8",
      "Content-Transfer-Encoding: quoted-printable",
      "",
      '<html><body><img src="cid:image001.png@01D"/></body></html>',
      "--REL1",
      "Content-Type: image/png",
      "Content-Transfer-Encoding: base64",
      "Content-ID: <image001.png@01D>",
      "",
      png1x1Base64,
      "--REL1--",
      "",
    ].join("\n")

    const parsed = parseTemplateContent("eml", eml)
    expect(parsed.htmlContent).toContain('src="data:image/png;base64,')
    expect(parsed.htmlContent).not.toContain("cid:image001.png@01D")
  })

  it("suggests name, amount and deadline mappings", () => {
    const doc = parseTemplateContent(
      "text",
      "Kedves Minta Ügyfél!\nA fizetendő összeg: 120 000 Ft\nFizetési határidő: 2026.03.08\nPénznem: EUR\nHangnem: tegező",
    )
    const mappings = suggestTemplateMappings(doc)
    expect(mappings.find((m) => m.key === "name")?.sourceSnippet).toBeTruthy()
    expect(mappings.find((m) => m.key === "amount")?.sourceSnippet).toContain("Ft")
    expect(mappings.find((m) => m.key === "deadline")?.sourceSnippet).toContain("2026")
    expect(mappings.find((m) => m.key === "currency")?.sourceSnippet).toMatch(/EUR|Ft|HUF|USD/)
    expect(mappings.find((m) => m.key === "tone")?.sourceSnippet).toBeTruthy()
  })

  it("strips trailing punctuation from detected name snippet", () => {
    const doc = parseTemplateContent("text", "Kedves Zoltán!\nAz ajánlat érvényes 2026.03.08-ig.")
    const mappings = suggestTemplateMappings(doc)
    expect(mappings.find((m) => m.key === "name")?.sourceSnippet).toBe("Zoltán")
  })

  it("detects fixed amount variants in text", () => {
    const doc = parseTemplateContent(
      "text",
      "Allianz Bónusz Életprogram forintosra állítva: 990Ft és 3 millió Forint.\nEurósnál: 3,3 Euró és 12 000 Euro.",
    )
    const mappings = suggestTemplateMappings(doc)
    const small = mappings.find((m) => m.key === "fixed_small_amount")?.sourceSnippet ?? ""
    const large = mappings.find((m) => m.key === "fixed_large_amount")?.sourceSnippet ?? ""
    expect(small).toBeTruthy()
    expect(large).toBeTruthy()
  })

  it("detects retirement section snippet in text", () => {
    const doc = parseTemplateContent(
      "text",
      "6, Gondoskodjon a jövőjéről ma – nyugdíjcélú megtakarítás az Allianz-nál\n✅ Állami támogatás:\nAz állam évente fix 20% adójóváírást biztosít, alanyi jogon.",
    )
    const mappings = suggestTemplateMappings(doc)
    const section = mappings.find((m) => m.key === "retirement_section")
    expect(section?.sourceSnippet).toContain("nyugdíjcélú")
    expect((section?.confidence ?? 0) > 0).toBe(true)
  })

  it("detects bonus section snippet from typical bonus block text", () => {
    const doc = parseTemplateContent(
      "text",
      "FIX Bónusz jóváírás a hozamokon felül\nMinden évben kap bónusz jóváírást, pontosan annyi százalékot, ahányadik évben jár a megtakarítási számlája.\nPl.: 1. évben 1 % bónusz, 2. évben 2 % bónusz, 3. évben 3 % bónusz, 4. évben 4 % bónusz és így tovább",
    )
    const mappings = suggestTemplateMappings(doc)
    const section = mappings.find((m) => m.key === "bonus_section")
    expect(section?.sourceSnippet).toContain("FIX Bónusz jóváírás a hozamokon felül")
    expect((section?.confidence ?? 0) > 0).toBe(true)
  })

  it("does not over-detect bonus section for weak standalone bonus mention", () => {
    const doc = parseTemplateContent(
      "text",
      "Az éves bónusz mértéke eltérhet, további részletekért érdeklődjön tanácsadójánál.",
    )
    const mappings = suggestTemplateMappings(doc)
    const section = mappings.find((m) => m.key === "bonus_section")
    expect(section?.sourceSnippet).toBeUndefined()
    expect(section?.confidence ?? 0).toBe(0)
  })

  it("detects calculator table snippet from known labels", () => {
    const doc = parseTemplateContent(
      "html",
      `
      <div>Bevezető</div>
      <table><tr><td>Másik blokk</td><td>123</td></tr></table>
      <table>
        <tr><td>Megtakarítási havi összeg:</td><td>20 000 Ft</td></tr>
        <tr><td>Teljes befizetés:</td><td>2 778 190 Ft</td></tr>
        <tr><td>Hozam stratégia:</td><td>Vegyes</td></tr>
      </table>
      `,
    )
    const mappings = suggestTemplateMappings(doc)
    const tableSnippet = mappings.find((m) => m.key === "calculator_table")?.sourceSnippet ?? ""
    expect(tableSnippet).toContain("Megtakarítási havi összeg")
    expect(tableSnippet).toContain("Hozam stratégia")
  })

  it("chooses highest score table when multiple tables exist", () => {
    const doc = parseTemplateContent(
      "html",
      `
      <table>
        <tr><td>Megtakarítási havi összeg:</td><td>20 000 Ft</td></tr>
      </table>
      <table>
        <tr><td>Megtakarítási havi összeg:</td><td>20 000 Ft</td></tr>
        <tr><td>Teljes befizetés:</td><td>2 778 190 Ft</td></tr>
        <tr><td>Hozam stratégia:</td><td>Vegyes</td></tr>
        <tr><td>Éves nettó hozam:</td><td>15%</td></tr>
      </table>
      `,
    )
    const mappings = suggestTemplateMappings(doc)
    const tableSnippet = mappings.find((m) => m.key === "calculator_table")?.sourceSnippet ?? ""
    expect(tableSnippet).toContain("Éves nettó hozam")
  })

  it("does not suggest calculator table snippet when labels are missing", () => {
    const doc = parseTemplateContent(
      "html",
      `
      <table><tr><td>Termék</td><td>Tőkenövelés</td></tr></table>
      <table><tr><td>Ügyfél</td><td>Viktor</td></tr></table>
      `,
    )
    const mappings = suggestTemplateMappings(doc)
    const tableMapping = mappings.find((m) => m.key === "calculator_table")
    expect(tableMapping?.sourceSnippet).toBeUndefined()
    expect(tableMapping?.confidence).toBe(0)
  })

  it("detects calculator table with accentless labels", () => {
    const doc = parseTemplateContent(
      "html",
      `
      <table>
        <tr><td>Megtakaritasi havi osszeg:</td><td>20 000 Ft</td></tr>
      </table>
      `,
    )
    const mappings = suggestTemplateMappings(doc)
    const tableSnippet = mappings.find((m) => m.key === "calculator_table")?.sourceSnippet ?? ""
    expect(tableSnippet).toContain("Megtakaritasi havi osszeg")
  })

  it("falls back to single table when no known labels exist", () => {
    const doc = parseTemplateContent(
      "html",
      `
      <table><tr><td>Valami egyedi sor</td><td>123</td></tr></table>
      `,
    )
    const mappings = suggestTemplateMappings(doc)
    const tableMapping = mappings.find((m) => m.key === "calculator_table")
    expect(tableMapping?.sourceSnippet).toContain("Valami egyedi sor")
    expect((tableMapping?.confidence ?? 0) > 0).toBe(true)
  })

  it("renders template tokens with escaped html", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent: "<p>Kedves {{name}}!</p><div>{{amount}}</div><div>{{deadline}}</div>",
        textContent: "Kedves {{name}}! {{amount}} - {{deadline}}",
        mappings: [
          { key: "name", label: "Név", token: "{{name}}" },
          { key: "amount", label: "Összeg", token: "{{amount}}" },
          { key: "deadline", label: "Határidő", token: "{{deadline}}" },
        ],
      },
      values: {
        name: "<script>alert(1)</script>",
        amount: "120 000 Ft",
        deadline: "2026.03.09",
      },
    })
    expect(rendered.html).not.toContain("<script>")
    expect(rendered.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;")
    expect(rendered.plain).toContain("120 000 Ft")
  })

  it("replaces calculator table token with generated html", () => {
    const tableHtml = buildCalculatorTableHtml({
      accountName: "Nyugdíj számla",
      accountGoal: "Nyugdíj",
      monthlyPayment: "20 000 Ft",
      yearlyPayment: "240 000 Ft",
      years: "20 év",
      totalContributions: "4 800 000 Ft",
      strategy: "Kiegyensúlyozott",
      annualYield: "5.0%",
      totalReturn: "2 100 000 Ft",
      endBalance: "6 900 000 Ft",
      finalNet: "6 900 000 Ft",
    })
    const tablePlain = buildCalculatorTablePlain({
      accountName: "Nyugdíj számla",
      accountGoal: "Nyugdíj",
      monthlyPayment: "20 000 Ft",
      yearlyPayment: "240 000 Ft",
      years: "20 év",
      totalContributions: "4 800 000 Ft",
      strategy: "Kiegyensúlyozott",
      annualYield: "5.0%",
      totalReturn: "2 100 000 Ft",
      endBalance: "6 900 000 Ft",
      finalNet: "6 900 000 Ft",
    })
    const rendered = renderEmailTemplate({
      template: {
        htmlContent: "<div>Bevezető</div>{{calculator_table}}<div>Lezárás</div>",
        textContent: "Bevezető\n{{calculator_table}}\nLezárás",
        mappings: [{ key: "calculator_table", label: "Kalkulátor táblázat", token: "{{calculator_table}}" }],
      },
      values: {},
      calculatorTableHtml: tableHtml,
      calculatorTablePlain: tablePlain,
    })
    expect(rendered.html).toContain("<table")
    expect(rendered.html).toContain("Nyugdíj számla")
    expect(rendered.plain).toContain("Megtakarítási havi összeg: 20 000 Ft")
  })

  it("replaces selected snippet with calculator table when token is absent", () => {
    const tableHtml = "<table><tr><td>Új tábla</td></tr></table>"
    const rendered = renderEmailTemplate({
      template: {
        htmlContent: "<div>előtte</div><div>régi táblázat blokk</div><div>utána</div>",
        textContent: "előtte\nrégi táblázat blokk\nutána",
        mappings: [
          {
            key: "calculator_table",
            label: "Kalkulátor táblázat",
            token: "{{calculator_table}}",
            sourceSnippet: "régi táblázat blokk",
          },
        ],
      },
      values: {},
      calculatorTableHtml: tableHtml,
      calculatorTablePlain: "Új tábla plain",
    })
    expect(rendered.html).toContain("Új tábla")
    expect(rendered.html).not.toContain("régi táblázat blokk")
    expect(rendered.plain).toContain("Új tábla plain")
  })

  it("does not replace table when snippet does not match", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent: "<div>előtte</div><table><tr><td>régi 1</td></tr></table><div>utána</div>",
        textContent: "előtte\n[Kalkulátor táblázat]\nutána",
        mappings: [
          {
            key: "calculator_table",
            label: "Kalkulátor táblázat",
            token: "{{calculator_table}}",
            sourceSnippet: "<table><tr><td>nem pontos match</td></tr></table>",
          },
        ],
      },
      values: {},
      calculatorTableHtml: "<table><tr><td>ÚJ TÁBLA</td></tr></table>",
      calculatorTablePlain: "ÚJ TÁBLA PLAIN",
    })
    expect(rendered.html).toContain("régi 1")
    expect(rendered.html).not.toContain("ÚJ TÁBLA")
    expect(rendered.plain).toContain("[Kalkulátor táblázat]")
  })

  it("keeps header image untouched when table snippet is mismatched", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent:
          '<img src="data:image/png;base64,abc123" alt="header"><table><tr><td>régi tábla</td></tr></table>',
        textContent: "plain",
        mappings: [
          {
            key: "calculator_table",
            label: "Kalkulátor táblázat",
            token: "{{calculator_table}}",
            sourceSnippet: "<table><tr><td>másik tábla</td></tr></table>",
          },
        ],
      },
      values: {},
      calculatorTableHtml: "<table><tr><td>ÚJ TÁBLA</td></tr></table>",
      calculatorTablePlain: "ÚJ TÁBLA PLAIN",
    })
    expect(rendered.html).toContain('src="data:image/png;base64,abc123"')
    expect(rendered.html).toContain("régi tábla")
    expect(rendered.html).not.toContain("ÚJ TÁBLA")
  })

  it("replaces table by id when snippet formatting differs", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent: '<div>Előtte</div><table id="x_table_0"><tr><td>régi tábla</td></tr></table><div>Utána</div>',
        textContent: "plain",
        mappings: [
          {
            key: "calculator_table",
            label: "Kalkulátor táblázat",
            token: "{{calculator_table}}",
            sourceSnippet: '<table id="x_table_0" cellspacing="0"><tr><td>más formátum</td></tr></table>',
          },
        ],
      },
      values: {},
      calculatorTableHtml: "<table><tr><td>ÚJ TÁBLA</td></tr></table>",
      calculatorTablePlain: "ÚJ TÁBLA PLAIN",
    })
    expect(rendered.html).toContain("ÚJ TÁBLA")
    expect(rendered.html).not.toContain("régi tábla")
  })

  it("replaces best matching table when id is missing", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent:
          "<div>Előtte</div><table><tr><td>Egyéb sor</td><td>x</td></tr></table><table><tr><td>Megtakarítási havi összeg:</td><td>20 000 Ft</td></tr><tr><td>Teljes befizetés:</td><td>2 751 384 Ft</td></tr><tr><td>Hozam stratégia:</td><td>Vegyes</td></tr></table><div>Utána</div>",
        textContent: "plain",
        mappings: [
          {
            key: "calculator_table",
            label: "Kalkulátor táblázat",
            token: "{{calculator_table}}",
            sourceSnippet:
              "<table><tr><td>Megtakarítási havi összeg:</td><td>20 000 Ft</td></tr><tr><td>Teljes befizetés:</td><td>2 751 384 Ft</td></tr></table>",
          },
        ],
      },
      values: {},
      calculatorTableHtml: "<table><tr><td>ÚJ TÁBLA</td></tr></table>",
      calculatorTablePlain: "ÚJ TÁBLA PLAIN",
    })
    expect(rendered.html).toContain("ÚJ TÁBLA")
    expect(rendered.html).toContain("Egyéb sor")
    expect(rendered.html).not.toContain("Megtakarítási havi összeg:")
  })

  it("keeps only one calculator-like table and prefers the one matching current values", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent:
          "<table><tr><td>Megtakarítási havi összeg:</td><td>20 000 Ft</td></tr><tr><td>Teljes befizetés:</td><td>2 751 384 Ft</td></tr><tr><td>Hozam stratégia:</td><td>Vegyes</td></tr><tr><td>Várható hozam:</td><td>1 000 000 Ft</td></tr></table><div>Köztes szöveg</div><table><tr><td>Megtakarítási havi összeg:</td><td>80 Eur</td></tr><tr><td>Teljes befizetés:</td><td>19 200 Eur</td></tr><tr><td>Hozam stratégia:</td><td>Biztonságos</td></tr><tr><td>Várható hozam:</td><td>7 950 Eur</td></tr></table>",
        textContent: "plain",
        mappings: [
          {
            key: "calculator_table",
            label: "Kalkulátor táblázat",
            token: "{{calculator_table}}",
            sourceSnippet:
              "<table><tr><td>Megtakarítási havi összeg:</td><td>20 000 Ft</td></tr><tr><td>Teljes befizetés:</td><td>2 751 384 Ft</td></tr><tr><td>Hozam stratégia:</td><td>Vegyes</td></tr></table>",
          },
        ],
      },
      values: {},
      calculatorTableHtml:
        "<table><tr><td>Megtakarítási havi összeg:</td><td>80 Eur</td></tr><tr><td>Teljes befizetés:</td><td>19 200 Eur</td></tr><tr><td>Hozam stratégia:</td><td>Biztonságos</td></tr><tr><td>Várható hozam:</td><td>7 950 Eur</td></tr></table>",
      calculatorTablePlain:
        "Megtakarítási havi összeg: 80 Eur\nTeljes befizetés: 19 200 Eur\nHozam stratégia: Biztonságos\nVárható hozam: 7 950 Eur",
    })

    expect(rendered.html).toContain("80 Eur")
    expect(rendered.html).toContain("7 950 Eur")
    expect(rendered.html).not.toContain("20 000 Ft")
    expect((rendered.html.match(/<table/gi) || []).length).toBe(1)
  })

  it("keeps calculator table that contains current-rate row when expected", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent:
          "<table><tr><td>Megtakarítási havi összeg:</td><td>80 Eur</td></tr><tr><td>Várható hozam:</td><td>7 950 Eur</td></tr><tr><td>Megtakarítás számlán várható összeg:</td><td>19 063 Eur</td></tr><tr><td>Teljes megtakarítás nettó értéke:</td><td>19 063 Eur</td></tr><tr><td>500 Ft-os Euróval számolva:</td><td>9 531 259 Ft</td></tr></table><div>Köztes</div><table><tr><td>Megtakarítási havi összeg:</td><td>80 Eur</td></tr><tr><td>Várható hozam:</td><td>7 950 Eur</td></tr><tr><td>Megtakarítás számlán várható összeg:</td><td>19 063 Eur</td></tr><tr><td>Teljes megtakarítás nettó értéke:</td><td>19 063 Eur</td></tr><tr><td>Jelen árfolyamon számolva:</td><td>7 326 298 Ft</td></tr><tr><td>500 Ft-os Euróval számolva:</td><td>9 531 259 Ft</td></tr></table>",
        textContent: "plain",
        mappings: [
          {
            key: "calculator_table",
            label: "Kalkulátor táblázat",
            token: "{{calculator_table}}",
            sourceSnippet:
              "<table><tr><td>Megtakarítási havi összeg:</td><td>0 Eur</td></tr><tr><td>Várható hozam:</td><td>0 Eur</td></tr><tr><td>Megtakarítás számlán várható összeg:</td><td>0 Eur</td></tr><tr><td>Teljes megtakarítás nettó értéke:</td><td>0 Eur</td></tr><tr><td>Jelen árfolyamon számolva:</td><td>0 Ft</td></tr><tr><td>500 Ft-os Euróval számolva:</td><td>0 Ft</td></tr></table>",
          },
        ],
      },
      values: {},
      calculatorTableHtml:
        "<table><tr><td>Teljes megtakarítás nettó értéke:</td><td>19 063 Eur</td></tr><tr><td>Jelen árfolyamon számolva:</td><td>7 326 298 Ft</td></tr><tr><td>500 Ft-os Euróval számolva:</td><td>9 531 259 Ft</td></tr></table>",
      calculatorTablePlain:
        "Teljes megtakarítás nettó értéke: 19 063 Eur\nJelen árfolyamon számolva: 7 326 298 Ft\n500 Ft-os Euróval számolva: 9 531 259 Ft",
    })

    expect((rendered.html.match(/<table/gi) || []).length).toBe(1)
    expect(rendered.html).toContain("Jelen árfolyamon számolva")
  })

  it("renders full dynamic preview fields together", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent:
          "<div>Név: {{name}}</div><div>Dátum: {{deadline}}</div><div>Pénznem: {{currency}}</div><div>Hangnem: {{tone}}</div>{{calculator_table}}",
        textContent: "Név: {{name}}\nDátum: {{deadline}}\nPénznem: {{currency}}\nHangnem: {{tone}}\n{{calculator_table}}",
        mappings: [
          { key: "name", label: "Név", token: "{{name}}" },
          { key: "deadline", label: "Határidő", token: "{{deadline}}" },
          { key: "currency", label: "Pénznem", token: "{{currency}}" },
          { key: "tone", label: "Hangnem", token: "{{tone}}" },
          { key: "calculator_table", label: "Kalkulátor táblázat", token: "{{calculator_table}}" },
        ],
      },
      values: {
        name: "Judit",
        deadline: "2026.02.27",
        currency: "HUF",
        tone: "tegező",
      },
      calculatorTableHtml: "<table><tr><td>KALK TABLE</td></tr></table>",
      calculatorTablePlain: "KALK TABLE PLAIN",
    })

    expect(rendered.html).toContain("Név: Judit")
    expect(rendered.html).toContain("Dátum: 2026.02.27")
    expect(rendered.html).toContain("Pénznem: HUF")
    expect(rendered.html).toContain("Hangnem: tegező")
    expect(rendered.html).toContain("KALK TABLE")
    expect(rendered.plain).toContain("KALK TABLE PLAIN")
  })

  it("replaces non-table snippet mappings for preview values", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent: "<div>Kedves Judit!</div><div>Érvényes: 2026.02.27</div>",
        textContent: "Kedves Judit!\nÉrvényes: 2026.02.27",
        mappings: [
          { key: "name", label: "Név", token: "{{name}}", sourceSnippet: "Judit" },
          { key: "deadline", label: "Határidő", token: "{{deadline}}", sourceSnippet: "2026.02.27" },
        ],
      },
      values: {
        name: "Viktor",
        deadline: "2026.03.03",
      },
    })
    expect(rendered.html).toContain("Kedves Viktor!")
    expect(rendered.html).toContain("Érvényes: 2026.03.03")
    expect(rendered.plain).toContain("Kedves Viktor!")
  })

  it("uses monthly amount semantics for amount value", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent: "<div>Összeg: {{amount}}</div>",
        textContent: "Összeg: {{amount}}",
        mappings: [{ key: "amount", label: "Összeg", token: "{{amount}}" }],
      },
      values: {
        amount: "20 000 Ft",
      },
    })
    expect(rendered.html).toContain("Összeg: 20 000 Ft")
  })

  it("replaces mapped fixed amount variants while keeping other amounts", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent: "<div>A konstrukció 990 Ft fix díj.</div><div>Másik helyen 999 Ft maradjon.</div>",
        textContent: "A konstrukció 990 Ft fix díj.\nMásik helyen 999 Ft maradjon.",
        mappings: [
          {
            key: "fixed_small_amount",
            label: "Fix kis összeg",
            token: "{{fixed_small_amount}}",
            sourceSnippet: "990 Ft fix díj",
          },
        ],
      },
      values: {
        fixed_small_amount: "3.3 Euro",
      },
    })
    expect(rendered.html).toContain("3.3 Euro")
    expect(rendered.html).toContain("Másik helyen 999 Ft")
  })

  it("does not mutate inline image src while replacing fixed amounts in html text", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent:
          '<img src="data:image/png;base64,abc990def" alt="header"><div>A konstrukció 990 Ft fix díj.</div>',
        textContent: "A konstrukció 990 Ft fix díj.",
        mappings: [
          {
            key: "fixed_small_amount",
            label: "Fix kis összeg",
            token: "{{fixed_small_amount}}",
            sourceSnippet: "990 Ft fix díj",
          },
        ],
      },
      values: {
        fixed_small_amount: "3.3 Euro",
      },
    })
    expect(rendered.html).toContain('src="data:image/png;base64,abc990def"')
    expect(rendered.html).toContain("A konstrukció 3.3 Euro fix díj.")
  })

  it("keeps multiple inline image sources intact during fixed amount replacement", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent:
          '<img src="data:image/png;base64,HEADER990AAA" alt="header"><div>Ajánlat: 990 Ft.</div><img src="data:image/png;base64,FOOTER123BBB" alt="footer">',
        textContent: "Ajánlat: 990 Ft.",
        mappings: [
          {
            key: "fixed_small_amount",
            label: "Fix kis összeg",
            token: "{{fixed_small_amount}}",
            sourceSnippet: "990 Ft",
          },
        ],
      },
      values: {
        fixed_small_amount: "3.3 Euro",
      },
    })
    expect(rendered.html).toContain('src="data:image/png;base64,HEADER990AAA"')
    expect(rendered.html).toContain('src="data:image/png;base64,FOOTER123BBB"')
    expect(rendered.html).toContain("Ajánlat: 3.3 Euro.")
  })

  it("does not corrupt image data uri when short currency snippet is replaced", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent:
          '<img src="data:image/png;base64,HEADERFtAAA" alt="header"><div>Pénznem: Ft</div><div>Díj: 25 000 Ft</div>',
        textContent: "Pénznem: Ft\nDíj: 25 000 Ft",
        mappings: [{ key: "currency", label: "Pénznem", token: "{{currency}}", sourceSnippet: "Ft" }],
      },
      values: {
        currency: "EUR",
      },
    })
    expect(rendered.html).toContain('src="data:image/png;base64,HEADERFtAAA"')
    expect(rendered.html).toContain("Pénznem: EUR")
  })

  it("replaces fixed large amount variants in body text outside table", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent:
          "<div>Védelem: 3 millió Ft extra.</div><div>Részlet: 3.000.000 Ft-os közlekedési védelem.</div><table><tr><td>Teljes befizetés</td><td>3 000 000 Ft</td></tr></table>",
        textContent: "Védelem: 3 millió Ft extra.\nRészlet: 3.000.000 Ft-os közlekedési védelem.",
        mappings: [
          {
            key: "fixed_large_amount",
            label: "Fix nagy összeg",
            token: "{{fixed_large_amount}}",
            sourceSnippet: "3 millió Ft",
          },
        ],
      },
      values: {
        fixed_large_amount: "12 000 Euro",
      },
    })
    expect(rendered.html).toContain("Védelem: 12 000 Euro extra.")
    expect(rendered.html).toContain("Részlet: 12 000 Euro közlekedési védelem.")
    expect(rendered.html).toContain("<td>3 000 000 Ft</td>")
  })

  it("keeps both currency sides in small fixed dual-currency line", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent: "<div>Számlavezetési díj: havi 990 Ft/3,3€.</div>",
        textContent: "Számlavezetési díj: havi 990 Ft/3,3€.",
        mappings: [
          {
            key: "fixed_small_amount",
            label: "Fix kis összeg",
            token: "{{fixed_small_amount}}",
            sourceSnippet: "990 Ft/3,3€",
          },
        ],
      },
      values: {
        fixed_small_amount: "3.3 Euro",
      },
    })
    expect(rendered.html).toContain("990 Ft/3.3 Euro")
    expect(rendered.html).not.toContain("3.3 Euro/3.3")
  })

  it("keeps both currency sides in large fixed dual-currency line", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent: "<div>Védelem: 3 000 000 Ft (12 000 Euro) extra.</div>",
        textContent: "Védelem: 3 000 000 Ft (12 000 Euro) extra.",
        mappings: [
          {
            key: "fixed_large_amount",
            label: "Fix nagy összeg",
            token: "{{fixed_large_amount}}",
            sourceSnippet: "3 000 000 Ft (12 000 Euro)",
          },
        ],
      },
      values: {
        fixed_large_amount: "12 000 Euro",
      },
    })
    expect(rendered.html).toContain("3 000 000 Ft (12 000 Euro)")
    expect(rendered.html).not.toContain("12 000 Euro (12 000 Euro)")
  })

  it("updates greeting name even when name snippet mapping is off", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent: "<div>Kedves Judit!</div><div>Megtakarítási cél: Tőkenövelés</div>",
        textContent: "Kedves Judit!\nMegtakarítási cél: Tőkenövelés",
        mappings: [{ key: "name", label: "Név", token: "{{name}}", sourceSnippet: "Megtakarítás" }],
      },
      values: {
        name: "Viktor",
      },
    })
    expect(rendered.html).toContain("Kedves Viktor!")
    expect(rendered.plain).toContain("Kedves Viktor!")
  })

  it("does not rewrite greeting salutation from tone snippet mapping", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent: "<div>Kedves Judit!</div><div>Szöveg törzs</div>",
        textContent: "Kedves Judit!\nSzöveg törzs",
        mappings: [
          { key: "name", label: "Név", token: "{{name}}", sourceSnippet: "Judit" },
          { key: "tone", label: "Hangnem", token: "{{tone}}", sourceSnippet: "Kedves" },
        ],
      },
      values: {
        name: "Viktor",
        tone: "Tisztelt",
      },
    })
    expect(rendered.html).toContain("Kedves Viktor!")
    expect(rendered.html).not.toContain("Tisztelt Viktor!")
  })

  it("replaces only szabad felhasználású with account goal phrase", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent: "<div>Önnek a szabad felhasználású megtakarítás terméktájékoztatóját küldöm.</div>",
        textContent: "Önnek a szabad felhasználású megtakarítás terméktájékoztatóját küldöm.",
        mappings: [],
      },
      values: {},
      accountGoalPhrase: "Nyugdíj és tőkenövelés",
    })
    expect(rendered.html).toContain("nyugdíj és tőkenövelés célú megtakarítás")
    expect(rendered.plain).toContain("nyugdíj és tőkenövelés célú megtakarítás")
  })

  it("removes mapped retirement section for non-retirement goal", () => {
    const sectionText =
      "6, Gondoskodjon a jövőjéről ma – nyugdíjcélú megtakarítás az Allianz-nál ✅ Állami támogatás: Az állam évente fix 20% adójóváírást biztosít."
    const rendered = renderEmailTemplate({
      template: {
        htmlContent: `<div>Bevezető</div><div>${sectionText}</div><div>Lezárás</div>`,
        textContent: `Bevezető\n${sectionText}\nLezárás`,
        mappings: [
          {
            key: "retirement_section",
            label: "Nyugdíj szekció",
            token: "{{retirement_section}}",
            sourceSnippet: sectionText,
          },
        ],
      },
      values: {},
      accountGoalPhrase: "Tőkenövelés",
    })
    expect(rendered.html).toContain("Bevezető")
    expect(rendered.html).toContain("Lezárás")
    expect(rendered.html).not.toContain("nyugdíjcélú megtakarítás")
    expect(rendered.plain).not.toContain("nyugdíjcélú megtakarítás")
  })

  it("also removes standalone retirement tax-credit paragraph for non-retirement goal", () => {
    const taxCreditParagraph =
      "Az állam évente fix 20% adójóváírást biztosít az Ön befizetéseire – ez minimum 48.000 Ft, de akár 130.000 Ft-ot is jelenthet évente, amit a saját személyi jövedelemadójából kap vissza, alanyi jogon."
    const rendered = renderEmailTemplate({
      template: {
        htmlContent: `<div>Bevezető</div><div>6, Gondoskodjon a jövőjéről ma – nyugdíjcélú megtakarítás az Allianz-nál</div><p>${taxCreditParagraph}</p><div>Lezárás</div>`,
        textContent: `Bevezető\n6, Gondoskodjon a jövőjéről ma – nyugdíjcélú megtakarítás az Allianz-nál\n${taxCreditParagraph}\nLezárás`,
        mappings: [
          {
            key: "retirement_section",
            label: "Nyugdíj szekció",
            token: "{{retirement_section}}",
            sourceSnippet: "6, Gondoskodjon a jövőjéről ma – nyugdíjcélú megtakarítás az Allianz-nál",
          },
        ],
      },
      values: {},
      accountGoalPhrase: "Tőkenövelés",
    })
    expect(rendered.html).toContain("Bevezető")
    expect(rendered.html).toContain("Lezárás")
    expect(rendered.html).not.toContain("adójóváírást biztosít")
    expect(rendered.plain).not.toContain("adójóváírást biztosít")
  })

  it("removes all tax-credit lines globally in non-retirement mode", () => {
    const line1 =
      "Az állam évente fix 20% adójóváírást biztosít az Ön befizetéseire, alanyi jogon."
    const line2 =
      "További adójóváírás járhat, amit a saját személyi jövedelemadójából kap vissza."
    const rendered = renderEmailTemplate({
      template: {
        htmlContent: `<div>Bevezető</div><p>${line1}</p><div>Köztes rész</div><p>${line2}</p><div>Lezárás</div>`,
        textContent: `Bevezető\n${line1}\nKöztes rész\n${line2}\nLezárás`,
        mappings: [
          {
            key: "retirement_section",
            label: "Nyugdíj szekció",
            token: "{{retirement_section}}",
            sourceSnippet: "Gondoskodjon a jövőjéről ma",
          },
        ],
      },
      values: {},
      accountGoalPhrase: "Tőkenövelés",
    })
    expect(rendered.html).toContain("Bevezető")
    expect(rendered.html).toContain("Köztes rész")
    expect(rendered.html).toContain("Lezárás")
    expect(rendered.html).not.toContain("adójóváírás")
    expect(rendered.html).not.toContain("alanyi jogon")
    expect(rendered.plain).not.toContain("adójóváírás")
    expect(rendered.plain).not.toContain("alanyi jogon")
  })

  it("keeps retirement and tax-credit lines in retirement mode", () => {
    const line =
      "Az állam évente fix 20% adójóváírást biztosít az Ön befizetéseire – alanyi jogon."
    const rendered = renderEmailTemplate({
      template: {
        htmlContent: `<div>6, Gondoskodjon a jövőjéről ma – nyugdíjcélú megtakarítás</div><p>${line}</p>`,
        textContent: `6, Gondoskodjon a jövőjéről ma – nyugdíjcélú megtakarítás\n${line}`,
        mappings: [
          {
            key: "retirement_section",
            label: "Nyugdíj szekció",
            token: "{{retirement_section}}",
            sourceSnippet: "6, Gondoskodjon a jövőjéről ma – nyugdíjcélú megtakarítás",
          },
        ],
      },
      values: {},
      accountGoalPhrase: "Nyugdíj és tőkenövelés",
    })
    expect(rendered.html).toContain("nyugdíj és tőkenövelés célú megtakarítás")
    expect(rendered.html).toContain("adójóváírást")
    expect(rendered.plain).toContain("adójóváírást")
  })

  it("does not remove unrelated sections in non-retirement mode", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent: "<div>✅ Jogszabályvédelem a jövőre nézve:</div><p>Ez a rész maradjon.</p>",
        textContent: "✅ Jogszabályvédelem a jövőre nézve:\nEz a rész maradjon.",
        mappings: [
          {
            key: "retirement_section",
            label: "Nyugdíj szekció",
            token: "{{retirement_section}}",
            sourceSnippet: "6, Gondoskodjon a jövőjéről ma",
          },
        ],
      },
      values: {},
      accountGoalPhrase: "Tőkenövelés",
    })
    expect(rendered.html).toContain("Jogszabályvédelem")
    expect(rendered.html).toContain("maradjon")
    expect(rendered.plain).toContain("Jogszabályvédelem")
  })

  it("removes mapped bonus section snippet only for Allianz Életprogram", () => {
    const bonusSection = "🎁 Bónusz szekció: Allianz Bónusz Életprogram extra jóváírások."
    const rendered = renderEmailTemplate({
      template: {
        htmlContent: `<div>Bevezető</div><div>${bonusSection}</div><div>Lezárás</div>`,
        textContent: `Bevezető\n${bonusSection}\nLezárás`,
        mappings: [
          {
            key: "bonus_section",
            label: "Bónusz szekció",
            token: "{{bonus_section}}",
            sourceSnippet: bonusSection,
          },
        ],
      },
      values: {},
      isAllianzEletprogram: true,
    })
    expect(rendered.html).toContain("Bevezető")
    expect(rendered.html).toContain("Lezárás")
    expect(rendered.html).not.toContain("Bónusz szekció")
    expect(rendered.plain).not.toContain("Bónusz szekció")
  })

  it("keeps mapped bonus section snippet for Allianz Bónusz Életprogram", () => {
    const bonusSection = "🎁 Bónusz szekció: Allianz Bónusz Életprogram extra jóváírások."
    const rendered = renderEmailTemplate({
      template: {
        htmlContent: `<div>Bevezető</div><div>${bonusSection}</div><div>Lezárás</div>`,
        textContent: `Bevezető\n${bonusSection}\nLezárás`,
        mappings: [
          {
            key: "bonus_section",
            label: "Bónusz szekció",
            token: "{{bonus_section}}",
            sourceSnippet: bonusSection,
          },
        ],
      },
      values: {},
      isAllianzEletprogram: false,
    })
    expect(rendered.html).toContain("Bónusz szekció")
    expect(rendered.plain).toContain("Bónusz szekció")
  })

  it("handles bonus section token replacement/removal by product type", () => {
    const template = {
      htmlContent: "<div>Bevezető</div>{{bonus_section}}<div>Lezárás</div>",
      textContent: "Bevezető\n{{bonus_section}}\nLezárás",
      mappings: [
        {
          key: "bonus_section" as const,
          label: "Bónusz szekció",
          token: "{{bonus_section}}",
          sourceSnippet: "<div>BÓNUSZ BLOKK</div>",
        },
      ],
    }
    const removed = renderEmailTemplate({
      template,
      values: { bonus_section: "<div>CSERE BLOKK</div>" },
      isAllianzEletprogram: true,
    })
    const kept = renderEmailTemplate({
      template,
      values: { bonus_section: "<div>CSERE BLOKK</div>" },
      isAllianzEletprogram: false,
    })

    expect(removed.html).not.toContain("BÓNUSZ BLOKK")
    expect(removed.html).not.toContain("CSERE BLOKK")
    expect(removed.plain).not.toContain("BÓNUSZ BLOKK")
    expect(kept.html).toContain("BÓNUSZ BLOKK")
    expect(kept.plain).toContain("BÓNUSZ BLOKK")
  })

  it("removes auto-detected bonus section for Allianz Életprogram without manual mapping", () => {
    const doc = parseTemplateContent(
      "text",
      "Bevezető\nFIX Bónusz jóváírás a hozamokon felül\nMinden évben kap bónusz jóváírást, pontosan annyi százalékot, ahányadik évben jár a megtakarítási számlája.\nPl.: 1. évben 1 % bónusz, 2. évben 2 % bónusz, 3. évben 3 % bónusz, 4. évben 4 % bónusz és így tovább\nLezárás",
    )
    const mappings = suggestTemplateMappings(doc)
    const rendered = renderEmailTemplate({
      template: {
        htmlContent: "<div>Bevezető</div><div>FIX Bónusz jóváírás a hozamokon felül</div><p>Minden évben kap bónusz jóváírást...</p><div>Lezárás</div>",
        textContent: doc.textContent,
        mappings,
      },
      values: {},
      isAllianzEletprogram: true,
    })
    expect(rendered.html).not.toContain("FIX Bónusz jóváírás a hozamokon felül")
    expect(rendered.plain).not.toContain("Minden évben kap bónusz jóváírást")
    expect(rendered.html).toContain("Lezárás")
  })

  it("removes bonus section heuristically for Allianz Életprogram when snippet shape differs", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent:
          "<div>FIX Bónusz jóváírás a hozamokon felül</div><p>Minden évben kap bónusz jóváírást, pontosan annyi százalékot, ahányadik évben jár a megtakarítási számlája.</p><div>Pl.: 1. évben 1 % bónusz, 2. évben 2 % bónusz, 3. évben 3 % bónusz, 4. évben 4 % bónusz és így tovább</div><div>Maradó rész</div>",
        textContent:
          "FIX Bónusz jóváírás a hozamokon felül\nMinden évben kap bónusz jóváírást, pontosan annyi százalékot, ahányadik évben jár a megtakarítási számlája.\nPl.: 1. évben 1 % bónusz, 2. évben 2 % bónusz, 3. évben 3 % bónusz, 4. évben 4 % bónusz és így tovább\nMaradó rész",
        mappings: [
          {
            key: "bonus_section",
            label: "Bónusz szekció",
            token: "{{bonus_section}}",
            sourceSnippet: "FIX Bónusz jóváírás  a hozamokon felül", // intentionally different spacing
          },
        ],
      },
      values: {},
      isAllianzEletprogram: true,
    })

    expect(rendered.html).not.toContain("FIX Bónusz jóváírás a hozamokon felül")
    expect(rendered.html).not.toContain("Minden évben kap bónusz jóváírást")
    expect(rendered.html).toContain("Maradó rész")
    expect(rendered.plain).not.toContain("Minden évben kap bónusz jóváírást")
  })

  it("removes annual bonus description block for Allianz Életprogram without bonus mapping", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent:
          "<div>3, Éves bónusz jóváírás - akár +20%:</div><div>Minden évben az adott évszámnak megfelelő bónuszt írunk jóvá, azaz:</div><div>- 1. évben +1%</div><div>- 2. évben +2%</div><div>- 20. évben már +20% bónusz az éves megtakarításokra</div><div>Ez a bónusz a hozamokon felül kerül jóváírásra!</div><div>Maradó rész</div>",
        textContent:
          "3, Éves bónusz jóváírás - akár +20%:\nMinden évben az adott évszámnak megfelelő bónuszt írunk jóvá, azaz:\n- 1. évben +1%\n- 2. évben +2%\n- 20. évben már +20% bónusz az éves megtakarításokra\nEz a bónusz a hozamokon felül kerül jóváírásra!\nMaradó rész",
        mappings: [],
      },
      values: {},
      isAllianzEletprogram: true,
    })

    expect(rendered.html).not.toContain("Éves bónusz jóváírás")
    expect(rendered.html).not.toContain("hozamokon felül")
    expect(rendered.plain).not.toContain("Éves bónusz jóváírás")
    expect(rendered.plain).not.toContain("hozamokon felül")
    expect(rendered.html).toContain("Maradó rész")
  })

  it("removes orphaned annual bonus continuation lines for Allianz Életprogram", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent:
          "<div>Számlavezetési díj: havi 3.3 Euro</div><div>- 1. évben +1%</div><div>- 2. évben +2%</div><div>...</div><div>- 20. évben már +20% bónusz az éves megtakarításokra</div><div>4, Örökölhető, gyors kifizetéssel:</div>",
        textContent:
          "Számlavezetési díj: havi 3.3 Euro\n- 1. évben +1%\n- 2. évben +2%\n...\n- 20. évben már +20% bónusz az éves megtakarításokra\n4, Örökölhető, gyors kifizetéssel:",
        mappings: [],
      },
      values: {},
      isAllianzEletprogram: true,
    })
    expect(rendered.html).not.toContain("1. évben +1%")
    expect(rendered.html).not.toContain("2. évben +2%")
    expect(rendered.html).not.toContain("20. évben")
    expect(rendered.html).not.toContain("<div>...</div>")
    expect(rendered.plain).not.toContain("1. évben +1%")
    expect(rendered.plain).toContain("4, Örökölhető")
  })

  it("renumbers section headings after bonus section removal in Allianz Életprogram", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent:
          "<div>2, Díjmentes lehetőségek:</div><div>3, Éves bónusz jóváírás – akár +20%:</div><div>Minden évben az adott évszámnak megfelelő bónuszt írunk jóvá.</div><div>Ez a bónusz a hozamokon felül kerül jóváírásra!</div><div>4, Örökölhető, gyors kifizetéssel:</div><div>5, Baleseti halál esetén 12 000 Euro extra védelem:</div>",
        textContent:
          "2, Díjmentes lehetőségek:\n3, Éves bónusz jóváírás – akár +20%:\nMinden évben az adott évszámnak megfelelő bónuszt írunk jóvá.\nEz a bónusz a hozamokon felül kerül jóváírásra!\n4, Örökölhető, gyors kifizetéssel:\n5, Baleseti halál esetén 12 000 Euro extra védelem:",
        mappings: [],
      },
      values: {},
      isAllianzEletprogram: true,
    })
    expect(rendered.html).toContain("2, Díjmentes lehetőségek:")
    expect(rendered.html).not.toContain("3, Éves bónusz jóváírás")
    expect(rendered.html).toContain("3, Örökölhető, gyors kifizetéssel:")
    expect(rendered.html).toContain("4, Baleseti halál esetén 12 000 Euro extra védelem:")
    expect(rendered.plain).toContain("3, Örökölhető, gyors kifizetéssel:")
    expect(rendered.plain).toContain("4, Baleseti halál esetén 12 000 Euro extra védelem:")
  })

  it("removes one-word bonusjóváírás section variant for Allianz Életprogram", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent:
          "<div>3. Éves bónuszjóváírás – akár +20%</div><div>Minden évben az adott évszámnak megfelelő extra jóváírást kap:</div><div>év: +1%</div><div>év: +2%</div><div>…</div><div>év: +20%</div><div>Ez a bónusz a hozamokon felül kerül jóváírásra.</div><div>4. Adómentesség és állami inkasszó elleni védelem</div>",
        textContent:
          "3. Éves bónuszjóváírás – akár +20%\nMinden évben az adott évszámnak megfelelő extra jóváírást kap:\név: +1%\név: +2%\n…\név: +20%\nEz a bónusz a hozamokon felül kerül jóváírásra.\n4. Adómentesség és állami inkasszó elleni védelem",
        mappings: [],
      },
      values: {},
      isAllianzEletprogram: true,
    })
    expect(rendered.html).not.toContain("Éves bónuszjóváírás")
    expect(rendered.html).not.toContain("év: +1%")
    expect(rendered.html).not.toContain("év: +20%")
    expect(rendered.html).toContain("4. Adómentesség és állami inkasszó elleni védelem")
    expect(rendered.plain).not.toContain("Éves bónuszjóváírás")
  })

  it("removes EUR-only forint volatility section for HUF currency", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent:
          "<div>6. Előző rész</div><div>7. A forint ingadozik. Az infláció nem kérdez:</div><div>✅ Értékállóbb deviza: Az euró nem gyengülhet el úgy, mint a forint.</div><div>✅ Külföldi célokra ideális.</div><div>✅ Véd az árfolyamkockázattól.</div><div>8. Következő rész</div>",
        textContent:
          "6. Előző rész\n7. A forint ingadozik. Az infláció nem kérdez:\n✅ Értékállóbb deviza: Az euró nem gyengülhet el úgy, mint a forint.\n✅ Külföldi célokra ideális.\n✅ Véd az árfolyamkockázattól.\n8. Következő rész",
        mappings: [],
      },
      values: { currency: "Ft" },
    })
    expect(rendered.html).not.toContain("A forint ingadozik")
    expect(rendered.html).not.toContain("Értékállóbb deviza")
    expect(rendered.html).toContain("7. Következő rész")
    expect(rendered.plain).not.toContain("A forint ingadozik")
    expect(rendered.plain).toContain("7. Következő rész")
  })

  it("keeps EUR-only forint volatility section for EUR currency", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent:
          "<div>7. A forint ingadozik. Az infláció nem kérdez:</div><div>✅ Értékállóbb deviza: Az euró nem gyengülhet el úgy, mint a forint.</div><div>8. Következő rész</div>",
        textContent:
          "7. A forint ingadozik. Az infláció nem kérdez:\n✅ Értékállóbb deviza: Az euró nem gyengülhet el úgy, mint a forint.\n8. Következő rész",
        mappings: [],
      },
      values: { currency: "EUR" },
    })
    expect(rendered.html).toContain("A forint ingadozik")
    expect(rendered.plain).toContain("A forint ingadozik")
  })

  it("replaces szabadfelhasználású when written as one word", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent: "<div>Önnek a szabadfelhasználású megtakarítás terméktájékoztatóját küldöm.</div>",
        textContent: "Önnek a szabadfelhasználású megtakarítás terméktájékoztatóját küldöm.",
        mappings: [],
      },
      values: {},
      accountGoalPhrase: "Nyugdíj",
    })
    expect(rendered.html).toContain("nyugdíj célú megtakarítás")
    expect(rendered.plain).toContain("nyugdíj célú megtakarítás")
  })

  it("replaces nyugdíj célú megtakarítás phrase with selected account goal phrase", () => {
    const rendered = renderEmailTemplate({
      template: {
        htmlContent: "<div>Telefonos megbeszélésünkre hivatkozva küldöm, Önnek a nyugdíj célú megtakarítás részleteit.</div>",
        textContent: "Telefonos megbeszélésünkre hivatkozva küldöm, Önnek a nyugdíj célú megtakarítás részleteit.",
        mappings: [],
      },
      values: {},
      accountGoalPhrase: "Tőkenövelés",
    })
    expect(rendered.html).toContain("tőkenövelés célú megtakarítás")
    expect(rendered.plain).toContain("tőkenövelés célú megtakarítás")
  })

  it("keeps selected table styles when building from template", () => {
    const templateTable =
      '<table style="font-family:Calibri; width:760px; border-collapse:collapse;"><tr><td style="background:#ED7D31;color:#fff;">Megtakarítási havi összeg:</td><td style="background:#2F5597;color:#fff;">0 Ft</td></tr><tr><td style="background:#ED7D31;color:#fff;">Teljes megtakarítás nettó értéke:</td><td style="background:#C55A11;color:#fff;">0 Ft</td></tr></table>'
    const html = buildCalculatorTableHtmlFromTemplate(
      {
        accountName: "A",
        accountGoal: "B",
        monthlyPayment: "20 000 Ft",
        yearlyPayment: "240 000 Ft",
        years: "10 év",
        totalContributions: "1 000 000 Ft",
        strategy: "Vegyes",
        annualYield: "12%",
        totalReturn: "100 000 Ft",
        endBalance: "1 100 000 Ft",
        totalBonus: "85 320 Ft",
        finalNet: "1 185 320 Ft",
      },
      templateTable,
    )
    expect(html).toContain('font-family:Calibri')
    expect(html).toContain('background:#ED7D31')
    expect(html).toContain("20 000 Ft")
    expect(html).toContain("1 185 320 Ft")
  })

  it("preserves nested markup in value cell while replacing number", () => {
    const templateTable =
      '<table><tr><td style="font-family:Calibri">Megtakarítási havi összeg:</td><td style="font-family:Calibri"><p><b><span style="font-family:Calibri;color:#2F5597">0 Ft</span></b></p></td></tr></table>'
    const html = buildCalculatorTableHtmlFromTemplate(
      {
        accountName: "A",
        accountGoal: "B",
        monthlyPayment: "20 000 Ft",
        yearlyPayment: "240 000 Ft",
        years: "10 év",
        totalContributions: "1 000 000 Ft",
        strategy: "Vegyes",
        annualYield: "12%",
        totalReturn: "100 000 Ft",
        endBalance: "1 100 000 Ft",
        totalBonus: "85 320 Ft",
        finalNet: "1 185 320 Ft",
      },
      templateTable,
    )
    expect(html).toContain("<p><b><span")
    expect(html).toContain("font-family:Calibri;color:#2F5597")
    expect(html).toContain(">20 000 Ft<")
  })

  it("preserves rich duration cell markup for years row", () => {
    const templateTable =
      '<table><tr><td>Tervezett időtartam:</td><td><p><span style="font-family:Cambria;color:#2F5597"><span style="font-size:17pt">0 év</span></span></p></td></tr></table>'
    const html = buildCalculatorTableHtmlFromTemplate(
      {
        accountName: "A",
        accountGoal: "B",
        monthlyPayment: "20 000 Ft",
        yearlyPayment: "240 000 Ft",
        years: "10 év",
        totalContributions: "1 000 000 Ft",
        strategy: "Vegyes",
        annualYield: "12%",
        totalReturn: "100 000 Ft",
        endBalance: "1 100 000 Ft",
        totalBonus: "85 320 Ft",
        finalNet: "1 185 320 Ft",
      },
      templateTable,
    )
    expect(html).toContain("font-family:Cambria")
    expect(html).toContain("font-size:17pt")
    expect(html).toContain(">10 év<")
  })

  it("does not touch cell markup when value is already equal", () => {
    const templateTable =
      '<table><tr><td>Tervezett időtartam:</td><td><p><span style="font-family:Cambria;color:#2F5597"><span style="font-size:17pt">10 év</span></span></p></td></tr></table>'
    const html = buildCalculatorTableHtmlFromTemplate(
      {
        accountName: "A",
        accountGoal: "B",
        monthlyPayment: "20 000 Ft",
        yearlyPayment: "240 000 Ft",
        years: "10 év",
        totalContributions: "1 000 000 Ft",
        strategy: "Vegyes",
        annualYield: "12%",
        totalReturn: "100 000 Ft",
        endBalance: "1 100 000 Ft",
        totalBonus: "85 320 Ft",
        finalNet: "1 185 320 Ft",
      },
      templateTable,
    )
    expect(html).toContain('<span style="font-size:17pt">10 év</span>')
  })

  it("matches and replaces rows when labels contain html entities", () => {
    const templateTable =
      '<table><tr><td>Teljes befizet&#233;s:</td><td><span style="font-family:Calibri">2 751 384 Ft</span></td></tr><tr><td>&#201;ves nett&#243; hozam:</td><td><span style="font-family:Calibri">12%</span></td></tr></table>'
    const html = buildCalculatorTableHtmlFromTemplate(
      {
        accountName: "A",
        accountGoal: "B",
        monthlyPayment: "20 000 Ft",
        yearlyPayment: "240 000 Ft",
        years: "10 év",
        totalContributions: "2 778 190 Ft",
        strategy: "Vegyes",
        annualYield: "15%",
        totalReturn: "100 000 Ft",
        endBalance: "1 100 000 Ft",
        totalBonus: "85 320 Ft",
        finalNet: "1 185 320 Ft",
      },
      templateTable,
    )
    expect(html).toContain("2 778 190 Ft")
    expect(html).toContain("15%")
  })

  it("removes bonus row from template table when total bonus is missing", () => {
    const templateTable =
      '<table><tr><td>Bónuszjóváírás tartam alatt összesen:</td><td><span>85 320 Ft</span></td></tr><tr><td>Teljes megtakarítás nettó értéke:</td><td><span>5 194 945 Ft</span></td></tr></table>'
    const html = buildCalculatorTableHtmlFromTemplate(
      {
        accountName: "A",
        accountGoal: "B",
        monthlyPayment: "20 000 Ft",
        yearlyPayment: "240 000 Ft",
        years: "10 év",
        totalContributions: "2 751 384 Ft",
        strategy: "Vegyes",
        annualYield: "12%",
        totalReturn: "2 187 383 Ft",
        endBalance: "5 194 945 Ft",
        totalBonus: "",
        finalNet: "5 194 945 Ft",
      },
      templateTable,
    )
    expect(html).not.toContain("Bónuszjóváírás tartam alatt összesen")
    expect(html).toContain("Teljes megtakarítás nettó értéke")
  })

  it("inserts tax credit row below expected return for retirement products", () => {
    const templateTable =
      '<table><tr><td>Várható hozam:</td><td><span>2 187 383 Ft</span></td></tr><tr><td>Megtakarítás számlán várható összeg:</td><td><span>5 194 945 Ft</span></td></tr></table>'
    const html = buildCalculatorTableHtmlFromTemplate(
      {
        accountName: "Allianz Bónusz Életprogram",
        accountGoal: "Nyugdíjmegtakarítás",
        monthlyPayment: "80 €",
        yearlyPayment: "960 €",
        years: "10 év",
        totalContributions: "11 113 €",
        strategy: "Vegyes",
        annualYield: "15%",
        totalReturn: "10 257 €",
        totalTaxCredit: "2 223 €",
        endBalance: "21 369 €",
        totalBonus: "341 €",
        finalNet: "21 369 €",
      },
      templateTable,
    )
    expect(html).toContain("Adójóváírás a tartam alatt összesen")
    expect(html.indexOf("Várható hozam")).toBeLessThan(html.indexOf("Adójóváírás a tartam alatt összesen"))
    expect(html.indexOf("Adójóváírás a tartam alatt összesen")).toBeLessThan(html.indexOf("Megtakarítás számlán várható összeg"))
  })

  it("preserves row markup styles when inserting tax credit row", () => {
    const templateTable =
      '<table><tr><td style="font-family:Cambria"><p><span style="font-family:Cambria;color:#2F5597">Várható hozam:</span></p></td><td style="font-family:Cambria"><p><span style="font-family:Cambria;color:#2F5597">2 187 383 Ft</span></p></td></tr><tr><td style="font-family:Cambria"><p><span style="font-family:Cambria;color:#2F5597">Megtakarítás számlán várható összeg:</span></p></td><td style="font-family:Cambria"><p><span style="font-family:Cambria;color:#2F5597">5 194 945 Ft</span></p></td></tr></table>'
    const html = buildCalculatorTableHtmlFromTemplate(
      {
        accountName: "A",
        accountGoal: "Nyugdíj",
        monthlyPayment: "80 €",
        yearlyPayment: "960 €",
        years: "10 év",
        totalContributions: "11 113 €",
        strategy: "Vegyes",
        annualYield: "15%",
        totalReturn: "10 257 €",
        totalTaxCredit: "2 223 €",
        endBalance: "21 369 €",
        totalBonus: "341 €",
        finalNet: "21 369 €",
      },
      templateTable,
    )
    expect(html).toContain("Adójóváírás a tartam alatt összesen")
    expect(html).toContain("font-family:Cambria;color:#2F5597")
    expect(html).toContain(">2 223 €<")
  })

  it("replaces FX conversion rows in template table", () => {
    const templateTable =
      '<table><tr><td>Jelen árfolyamon számolva:</td><td><span>7 326 298 Ft</span></td></tr><tr><td>500 Ft-os Euróval számolva:</td><td><span>9 531 259 Ft</span></td></tr><tr><td>600 Ft-os Euróval számolva:</td><td><span>11 437 511 Ft</span></td></tr></table>'
    const html = buildCalculatorTableHtmlFromTemplate(
      {
        accountName: "Allianz Bónusz Életprogram",
        accountGoal: "Tőkenövelés",
        monthlyPayment: "80 Eur",
        yearlyPayment: "960 Eur",
        years: "10 év",
        totalContributions: "11 113 Eur",
        strategy: "Vegyes",
        annualYield: "15%",
        totalReturn: "7 950 Eur",
        endBalance: "19 063 Eur",
        totalBonus: "341 Eur",
        finalNet: "19 063 Eur",
        endBalanceHufCurrent: "7 326 298 Ft",
        endBalanceEUR500: "9 531 259 Ft",
        endBalanceEUR600: "11 437 511 Ft",
      },
      templateTable,
    )
    expect(html).toContain(">7 326 298 Ft<")
    expect(html).toContain(">9 531 259 Ft<")
    expect(html).toContain(">11 437 511 Ft<")
  })

  it("keeps non-final rows from becoming bold", () => {
    const templateTable =
      '<table><tr><td style="font-weight:400">Megtakarítás számlán várható összeg:</td><td style="font-weight:400"><span>5 194 945 Ft</span></td></tr><tr><td style="font-weight:400">Bónuszjóváírás tartam alatt összesen:</td><td style="font-weight:400"><span>85 320 Ft</span></td></tr><tr><td style="font-weight:700">Teljes megtakarítás nettó értéke:</td><td style="font-weight:700"><span>5 194 945 Ft</span></td></tr></table>'
    const html = buildCalculatorTableHtmlFromTemplate(
      {
        accountName: "Allianz Bónusz Életprogram",
        accountGoal: "Tőkenövelés",
        monthlyPayment: "80 Eur",
        yearlyPayment: "960 Eur",
        years: "10 év",
        totalContributions: "11 113 Eur",
        strategy: "Vegyes",
        annualYield: "15%",
        totalReturn: "7 950 Eur",
        endBalance: "19 063 Eur",
        totalBonus: "341 Eur",
        finalNet: "19 063 Eur",
      },
      templateTable,
    )
    expect(html).toContain('Megtakarítás számlán várható összeg:</td><td style="font-weight:400"')
    expect(html).toContain('Bónuszjóváírás tartam alatt összesen:</td><td style="font-weight:400"')
  })

  it("darkens FX rows compared to template color", () => {
    const templateTable =
      '<table><tr><td style="background:#C55A11;color:#fff">500 Ft-os Euróval számolva:</td><td style="background:#C55A11;color:#fff"><span>9 531 259 Ft</span></td></tr></table>'
    const html = buildCalculatorTableHtmlFromTemplate(
      {
        accountName: "Allianz Bónusz Életprogram",
        accountGoal: "Tőkenövelés",
        monthlyPayment: "80 Eur",
        yearlyPayment: "960 Eur",
        years: "10 év",
        totalContributions: "11 113 Eur",
        strategy: "Vegyes",
        annualYield: "15%",
        totalReturn: "7 950 Eur",
        endBalance: "19 063 Eur",
        totalBonus: "341 Eur",
        finalNet: "19 063 Eur",
        endBalanceHufCurrent: "7 326 298 Ft",
        endBalanceEUR500: "9 531 259 Ft",
        endBalanceEUR600: "11 437 511 Ft",
      },
      templateTable,
    )
    expect(html).toContain("#ad4f0f")
  })

  it("darkens FX rows when template uses rgb background", () => {
    const templateTable =
      '<table><tr><td style="background-color: rgb(112, 173, 71); color:#fff">500 Ft-os Euróval számolva:</td><td style="background-color: rgb(112, 173, 71); color:#fff"><span>9 531 259 Ft</span></td></tr></table>'
    const html = buildCalculatorTableHtmlFromTemplate(
      {
        accountName: "Allianz Bónusz Életprogram",
        accountGoal: "Tőkenövelés",
        monthlyPayment: "80 Eur",
        yearlyPayment: "960 Eur",
        years: "10 év",
        totalContributions: "11 113 Eur",
        strategy: "Vegyes",
        annualYield: "15%",
        totalReturn: "7 950 Eur",
        endBalance: "19 063 Eur",
        totalBonus: "341 Eur",
        finalNet: "19 063 Eur",
        endBalanceHufCurrent: "7 326 298 Ft",
        endBalanceEUR500: "9 531 259 Ft",
        endBalanceEUR600: "11 437 511 Ft",
      },
      templateTable,
    )
    expect(html).toContain("rgb(99, 152, 62)")
  })

  it("applies explicit FX base color palette with stable shades", () => {
    const templateTable =
      '<table><tr><td style="background:#70ad47;color:#fff">Jelen árfolyamon számolva:</td><td style="background:#70ad47;color:#fff"><span>7 326 298 Ft</span></td></tr><tr><td style="background:#70ad47;color:#fff">500 Ft-os Euróval számolva:</td><td style="background:#70ad47;color:#fff"><span>9 531 259 Ft</span></td></tr><tr><td style="background:#70ad47;color:#fff">600 Ft-os Euróval számolva:</td><td style="background:#70ad47;color:#fff"><span>11 437 511 Ft</span></td></tr></table>'
    const html = buildCalculatorTableHtmlFromTemplate(
      {
        accountName: "Allianz Bónusz Életprogram",
        accountGoal: "Tőkenövelés",
        monthlyPayment: "80 Eur",
        yearlyPayment: "960 Eur",
        years: "10 év",
        totalContributions: "11 113 Eur",
        strategy: "Vegyes",
        annualYield: "15%",
        totalReturn: "7 950 Eur",
        endBalance: "19 063 Eur",
        totalBonus: "341 Eur",
        finalNet: "19 063 Eur",
        endBalanceHufCurrent: "7 326 298 Ft",
        endBalanceEUR500: "9 531 259 Ft",
        endBalanceEUR600: "11 437 511 Ft",
      },
      templateTable,
      { fxBaseColor: "#c55a11" },
    )
    expect(html).toContain("#c55a11")
    expect(html).toContain("#ad4f0f")
    expect(html).toContain("#96440d")
  })

  it("inserts current-rate row between final net and 500 row when missing", () => {
    const templateTable =
      '<table><tr><td>Teljes megtakarítás nettó értéke:</td><td><span>19 063 Eur</span></td></tr><tr><td>Telljes megtak.+adójóv.500Ft-osEur árfolyamon:</td><td><span>9 531 259 Ft</span></td></tr><tr><td>Telljes megtak.+adójóv.600Ft-osEur árfolyamon:</td><td><span>11 437 511 Ft</span></td></tr></table>'
    const html = buildCalculatorTableHtmlFromTemplate(
      {
        accountName: "Allianz Bónusz Életprogram",
        accountGoal: "Tőkenövelés",
        monthlyPayment: "80 Eur",
        yearlyPayment: "960 Eur",
        years: "10 év",
        totalContributions: "11 113 Eur",
        strategy: "Vegyes",
        annualYield: "15%",
        totalReturn: "7 950 Eur",
        endBalance: "19 063 Eur",
        totalBonus: "341 Eur",
        finalNet: "19 063 Eur",
        endBalanceHufCurrent: "7 326 298 Ft",
        endBalanceEUR500: "9 531 259 Ft",
        endBalanceEUR600: "11 437 511 Ft",
      },
      templateTable,
    )
    expect(html).toContain("Jelen árfolyamon számolva")
    expect(html.indexOf("Teljes megtakarítás nettó értéke")).toBeLessThan(html.indexOf("Jelen árfolyamon számolva"))
    expect(html.indexOf("Jelen árfolyamon számolva")).toBeLessThan(html.indexOf("500 Ft-os Euróval számolva"))
  })
})
