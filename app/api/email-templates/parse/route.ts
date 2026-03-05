import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSessionUser } from "@/lib/auth-session"
import { buildParsedTemplateCandidate } from "@/lib/email-templates/auto-detect"
import { parseTemplateContent } from "@/lib/email-templates/parser"

const parseSchema = z.object({
  sourceType: z.enum(["html", "text", "eml"]),
  rawContent: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const session = getSessionUser(request)
  if (!session) {
    return NextResponse.json({ message: "Nincs jogosultság." }, { status: 401 })
  }

  const raw = await request.json().catch(() => null)
  const parsed = parseSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ message: "Hibás kérés.", issues: parsed.error.issues }, { status: 400 })
  }

  try {
    const document = parseTemplateContent(parsed.data.sourceType, parsed.data.rawContent)
    const candidate = buildParsedTemplateCandidate(document)
    return NextResponse.json({ candidate })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Feldolgozási hiba."
    return NextResponse.json({ message }, { status: 400 })
  }
}
