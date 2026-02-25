import { createSupabaseAdminClient } from "@/lib/supabase/server"
import type { LeadPayload } from "@/lib/leads/schema"

type LeadInsert = {
  source: string
  request_type: "A" | "B" | "C"
  contact_name: string
  contact_email: string
  contact_phone: string
  form_payload: Record<string, unknown>
  calc_snapshot: Record<string, unknown>
  calc_summary: Record<string, unknown>
  email_status: "queued" | "sent" | "failed"
}

export async function createLeadSubmission(payload: LeadPayload): Promise<{ id: string }> {
  const supabase = createSupabaseAdminClient()

  const leadInsert: LeadInsert = {
    source: payload.source,
    request_type: payload.requestType,
    contact_name: payload.contact.name,
    contact_email: payload.contact.email,
    contact_phone: payload.contact.phone,
    form_payload: payload.formPayload ?? {},
    calc_snapshot: payload.calcSnapshot ?? {},
    calc_summary: payload.calcSummary ?? {},
    email_status: "queued",
  }

  const { data, error } = await supabase.from("lead_submissions").insert(leadInsert).select("id").single()
  if (error || !data?.id) {
    throw new Error(error?.message ?? "Nem sikerült menteni a lead adatot.")
  }
  return { id: data.id }
}

export async function markLeadEmailStatus(
  id: string,
  status: "sent" | "failed",
  emailError?: string,
): Promise<void> {
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from("lead_submissions")
    .update({
      email_status: status,
      email_error: emailError ?? null,
    })
    .eq("id", id)
  if (error) {
    throw new Error(error.message)
  }
}
