import { createServerClient } from '@supabase/ssr'

function createSupabaseServer() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL=https://wahzxsokmoatttynenpt.supabase.co!,
    process.env.SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhaHp4c29rbW9hdHR0eW5lbnB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDgyNzc0NSwiZXhwIjoyMDkwNDAzNzQ1fQ.NQNdqVW2kMeBms8Uk7O_wAKC-2ok0n8NZ-_0hzmo4Is,
    {
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
    }
  )
}

export const supabaseServer = createSupabaseServer()
