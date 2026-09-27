import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Temporary safe diagnostics — confirms Supabase public env vars are visible in Vercel runtime.
// Never exposes full keys, service role key, or private values.
// Disable by removing this file or setting ENABLE_DEBUG_ENV=false after diagnosis is complete.
export async function GET() {
  if (process.env.VERCEL_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  if (process.env.ENABLE_DEBUG_ENV !== "true") {
    return NextResponse.json({ error: "Disabled" }, { status: 403 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null;

  let url_host: string | null = null;
  if (url) {
    try {
      url_host = new URL(url).hostname;
    } catch {
      url_host = null;
    }
  }

  return NextResponse.json({
    has_url: url !== null,
    url_host,
    has_anon_key: anonKey !== null,
    anon_key_prefix: anonKey ? anonKey.slice(0, 8) : null,
    node_env: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV,
  });
}
