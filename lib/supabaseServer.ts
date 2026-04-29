import { createServerClient } from '@supabase/ssr'
export function createSupabaseServer() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}
// Do not instantiate at module level — call createSupabaseServer() per request
// so the build doesn't fail when env vars are absent locally.
export const supabaseServer = createSupabaseServer
