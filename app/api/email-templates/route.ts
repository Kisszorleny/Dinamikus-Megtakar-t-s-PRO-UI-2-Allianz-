import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSessionUser } from "@/lib/auth-session"
import { buildParsedTemplateCandidate } from "@/lib/email-templates/auto-detect"
import { applyClosingSectionPolicyToDocument } from "@/lib/email-templates/closing-section"
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
  removeClosingSection: z.boolean().optional(),
  subject: z.string().trim().optional(),
  mappings: z.array(mappingSchema).min(1),
  conversion: z
    .object({
      status: z.enum(["none", "pending_review", "approved", "rejected"]),
      targetTone: z.enum(["tegezo"]).optional(),
      convertedSubject: z.string().trim().optional(),
      convertedHtmlContent: z.string().optional(),
      convertedTextContent: z.string().optional(),
      notes: z.string().trim().optional(),
    })
    .optional(),
})

export async function GET(request: NextRequest) {
  const session = getSessionUser(request)
  if (!session) {
    return NextResponse.json({ message: "Nincs jogosultság." }, { status: 401 })
  }
  const templates = await listEmailTemplates(session)
  return NextResponse.json({ templates, isAdmin: session.isAdmin, userId: session.userId })
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
    const baseDocument = parseTemplateContent(parsed.data.sourceType, parsed.data.rawContent)
    const { document } = applyClosingSectionPolicyToDocument(baseDocument, {
      removeClosingSection: parsed.data.removeClosingSection,
      markHtml: parsed.data.sourceType === "eml",
    })
    const candidate = buildParsedTemplateCandidate(document)
    const subject = parsed.data.subject || candidate.subject
    const htmlContent = candidate.htmlContent
    const textContent = candidate.textContent
    const template = await createEmailTemplate(session, {
      name: parsed.data.name,
      sourceType: parsed.data.sourceType,
      originalFileName: parsed.data.originalFileName,
      rawContent: document.rawContent,
      subject,
      htmlContent,
      textContent,
      mappings: parsed.data.mappings,
      conversion: parsed.data.conversion,
    })
    return NextResponse.json({ template })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mentési hiba."
    return NextResponse.json({ message }, { status: 400 })
  }
}
