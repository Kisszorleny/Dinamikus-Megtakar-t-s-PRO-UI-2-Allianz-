import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSessionUser } from "@/lib/auth-session"
import { buildParsedTemplateCandidate } from "@/lib/email-templates/auto-detect"
import { parseTemplateContent } from "@/lib/email-templates/parser"
import { deleteEmailTemplate, getEmailTemplateById, updateEmailTemplate } from "@/lib/email-templates/repository"

type RouteContext = {
  params: Promise<{ id: string }>
}

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

const updateTemplateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  sourceType: sourceTypeSchema.optional(),
  originalFileName: z.string().trim().optional(),
  rawContent: z.string().min(1).optional(),
  subject: z.string().trim().optional(),
  mappings: z.array(mappingSchema).min(1).optional(),
})

export async function GET(request: NextRequest, context: RouteContext) {
  const session = getSessionUser(request)
  if (!session) {
    return NextResponse.json({ message: "Nincs jogosultság." }, { status: 401 })
  }

  const { id } = await context.params
  const template = await getEmailTemplateById(session, id)
  if (!template) {
    return NextResponse.json({ message: "A sablon nem található." }, { status: 404 })
  }
  return NextResponse.json({ template })
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = getSessionUser(request)
  if (!session) {
    return NextResponse.json({ message: "Nincs jogosultság." }, { status: 401 })
  }

  const { id } = await context.params
  const raw = await request.json().catch(() => null)
  const parsed = updateTemplateSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ message: "Hibás kérés.", issues: parsed.error.issues }, { status: 400 })
  }

  try {
    let htmlContent: string | undefined
    let textContent: string | undefined
    let subject: string | undefined = parsed.data.subject
    if (parsed.data.rawContent && parsed.data.sourceType) {
      const document = parseTemplateContent(parsed.data.sourceType, parsed.data.rawContent)
      const candidate = buildParsedTemplateCandidate(document)
      htmlContent = candidate.htmlContent
      textContent = candidate.textContent
      if (!subject) subject = candidate.subject
    }

    const template = await updateEmailTemplate(session, id, {
      ...parsed.data,
      subject,
      htmlContent,
      textContent,
    })
    return NextResponse.json({ template })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mentési hiba."
    return NextResponse.json({ message }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = getSessionUser(request)
  if (!session) {
    return NextResponse.json({ message: "Nincs jogosultság." }, { status: 401 })
  }
  const { id } = await context.params

  try {
    await deleteEmailTemplate(session, id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Törlési hiba."
    return NextResponse.json({ message }, { status: 400 })
  }
}
