import { createServerClient } from "@supabase/ssr";

// Service role client — for API routes only, never in browser
export function createAdminClient(options?: { timeoutMs: number }) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: { getAll: () => [], setAll: () => {} },
      ...(options ? { global: { fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, {
        ...init,
        signal: init?.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(options.timeoutMs)]) : AbortSignal.timeout(options.timeoutMs),
      }) } } : {}),
    }
  );
}
