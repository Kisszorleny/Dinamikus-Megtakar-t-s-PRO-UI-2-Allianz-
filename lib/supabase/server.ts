import { createClient } from "@supabase/supabase-js"

export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error("Hiányzó NEXT_PUBLIC_SUPABASE_URL vagy SUPABASE_URL környezeti változó.")
  }
  if (!serviceRoleKey) {
    throw new Error("Hiányzó SUPABASE_SERVICE_ROLE_KEY környezeti változó.")
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
