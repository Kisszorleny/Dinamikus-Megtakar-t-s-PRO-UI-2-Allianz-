import { google } from "googleapis"
import { LEAD_SHEET_HEADERS } from "@/lib/leads/manual-sheet-mapper"

function getSheetsConfig() {
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n")
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL
  const sheetId = process.env.GOOGLE_SHEETS_ID
  const sheetName = process.env.GOOGLE_SHEETS_TAB_NAME ?? "Leads"

  if (!privateKey || !clientEmail || !sheetId) {
    throw new Error(
      "Hiányzó Google Sheets konfiguráció. Adj meg GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL, GOOGLE_SHEETS_ID értékeket.",
    )
  }

  return { privateKey, clientEmail, sheetId, sheetName }
}

function createSheetsClient() {
  const { privateKey, clientEmail } = getSheetsConfig()
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  })
  return google.sheets({ version: "v4", auth })
}

export async function ensureLeadSheetHeader() {
  const sheets = createSheetsClient()
  const { sheetId, sheetName } = getSheetsConfig()
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "RAW",
    requestBody: {
      values: [Array.from(LEAD_SHEET_HEADERS)],
    },
  })
}

export async function fetchLeadSheetRows() {
  const sheets = createSheetsClient()
  const { sheetId, sheetName } = getSheetsConfig()
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1:ZZ`,
  })
  const values = response.data.values ?? []
  if (values.length <= 1) return []
  const headers = values[0]
  return values.slice(1).map((cells, idx) => {
    const row: Record<string, unknown> = {}
    headers.forEach((header, hIndex) => {
      row[header] = cells[hIndex] ?? ""
    })
    // Keep raw vectors too, so mapper can resolve duplicated/ambiguous headers safely.
    row._sheetHeaders = headers
    row._sheetCells = cells
    row._sheetRowId = String(idx + 2)
    return row
  })
}

export async function appendLeadSheetRows(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return
  const sheets = createSheetsClient()
  const { sheetId, sheetName } = getSheetsConfig()
  const values = rows.map((row) => LEAD_SHEET_HEADERS.map((header) => row[header] ?? ""))

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [Array.from(LEAD_SHEET_HEADERS), ...values] },
  })
}
