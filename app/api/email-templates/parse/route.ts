import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSessionUser } from "@/lib/auth-session"
import { buildParsedTemplateCandidate } from "@/lib/email-templates/auto-detect"
import { applyClosingSectionPolicyToDocument } from "@/lib/email-templates/closing-section"
import { parseTemplateContent } from "@/lib/email-templates/parser"
import { buildTegezoConversionSuggestion } from "@/lib/email-templates/tone-conversion"

const parseSchema = z.object({
  sourceType: z.enum(["html", "text", "eml"]),
  rawContent: z.string().min(1),
  removeClosingSection: z.boolean().optional(),
  conversionMode: z.enum(["ai_full", "builtin"]).optional(),
  aiContext: z
    .object({
      accountGoal: z.string().optional(),
      currency: z.enum(["HUF", "EUR", "USD"]).optional(),
      isAllianzEletprogram: z.boolean().optional(),
    })
    .optional(),
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
    const baseDocument = parseTemplateContent(parsed.data.sourceType, parsed.data.rawContent)
    const { document } = applyClosingSectionPolicyToDocument(baseDocument, {
      removeClosingSection: parsed.data.removeClosingSection,
    })
    const candidate = buildParsedTemplateCandidate(document)
    const conversionMode = parsed.data.conversionMode ?? "ai_full"
    // EML parsing + AI conversion can be slower because of multipart content and longer bodies.
    // Keep timeout below client-side abort, but avoid premature fallback.
    const timeoutMs = parsed.data.sourceType === "eml" ? 85_000 : 55_000
    let conversionSkippedReason: string | undefined
    const conversionSuggestion = await Promise.race([
      buildTegezoConversionSuggestion(document, {
        mode: conversionMode,
        aiContext: parsed.data.aiContext,
      }),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), timeoutMs)
      }),
    ])
    if (conversionSuggestion) {
      candidate.conversionSuggestion = conversionSuggestion
    } else if (conversionMode === "ai_full") {
      conversionSkippedReason =
        parsed.data.sourceType === "eml"
          ? "AI tegező konverzió időkorlátba futott ennél az EML-nél. A sablon betöltve, próbáld újra vagy válts Logika módra."
          : "AI tegező konverzió időkorlátba futott. Próbáld újra."
    }
    return NextResponse.json({ candidate, conversionSkippedReason })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Feldolgozási hiba."
    return NextResponse.json({ message }, { status: 400 })
  }
}
