import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Fail loudly with an actionable message instead of constructing a client
  // against `undefined`, which surfaces to users as an opaque "Failed to fetch".
  if (!url) {
    throw new Error(
      "Supabase URL not configured (NEXT_PUBLIC_SUPABASE_URL is missing).",
    );
  }
  if (!anonKey) {
    throw new Error(
      "Supabase anon key not configured (NEXT_PUBLIC_SUPABASE_ANON_KEY is missing).",
    );
  }

  return createBrowserClient(url, anonKey);
}
