import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSessionUser } from "@/lib/auth-session"
import { buildParsedTemplateCandidate } from "@/lib/email-templates/auto-detect"
import { parseTemplateContent } from "@/lib/email-templates/parser"
import { createEmailTemplate, listEmailTemplates } from "@/lib/email-templates/repository"

const sourceTypeSchema = z.enum(["html", "text", "eml"])

const mappingSchema = z.object({
  key: z.enum([
    "name",
    "amount",
    "deadline",
    "currency",
    "tone",
    "calculator_table",
    "fixed_small_amount",
    "fixed_large_amount",
    "retirement_section",
    "bonus_section",
  ]),
  label: z.string().trim().min(1),
  token: z.string().trim().min(1),
  sourceSnippet: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
})

const createTemplateSchema = z.object({
  name: z.string().trim().min(1),
  sourceType: sourceTypeSchema,
  originalFileName: z.string().trim().optional(),
  rawContent: z.string().min(1),
  subject: z.string().trim().optional(),
  mappings: z.array(mappingSchema).min(1),
})

export async function GET(request: NextRequest) {
  const session = getSessionUser(request)
  if (!session) {
    return NextResponse.json({ message: "Nincs jogosultság." }, { status: 401 })
  }
  const templates = await listEmailTemplates(session)
  return NextResponse.json({ templates, isAdmin: session.isAdmin })
}

export async function POST(request: NextRequest) {
  const session = getSessionUser(request)
  if (!session) {
    return NextResponse.json({ message: "Nincs jogosultság." }, { status: 401 })
  }

  const raw = await request.json().catch(() => null)
  const parsed = createTemplateSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ message: "Hibás kérés.", issues: parsed.error.issues }, { status: 400 })
  }

  try {
    const document = parseTemplateContent(parsed.data.sourceType, parsed.data.rawContent)
    const candidate = buildParsedTemplateCandidate(document)
    const template = await createEmailTemplate(session, {
      name: parsed.data.name,
      sourceType: parsed.data.sourceType,
      originalFileName: parsed.data.originalFileName,
      rawContent: parsed.data.rawContent,
      subject: parsed.data.subject || candidate.subject,
      htmlContent: candidate.htmlContent,
      textContent: candidate.textContent,
      mappings: parsed.data.mappings,
    })
    return NextResponse.json({ template })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mentési hiba."
    return NextResponse.json({ message }, { status: 400 })
  }
}
