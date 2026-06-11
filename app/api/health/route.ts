import { NextResponse } from "next/server";
import packageJson from "@/package.json";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const hasAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Test Supabase reachability from the server side
  let supabaseReachable = false;
  let supabaseError: string | null = null;
  if (url) {
    try {
      const res = await fetch(`${url}/auth/v1/health`, {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "" },
        signal: AbortSignal.timeout(5000),
      });
      supabaseReachable = res.ok;
      if (!res.ok) supabaseError = `HTTP ${res.status}`;
    } catch (e) {
      supabaseError = e instanceof Error ? e.message : String(e);
    }
  }

  return NextResponse.json({
    status: "ok",
    service: "milano-seal-platform",
    environment: process.env.NODE_ENV ?? "unknown",
    version: packageJson.version ?? "0.0.0",
    timestamp: new Date().toISOString(),
    env: {
      supabase_url: url ? url.slice(0, 40) + "…" : "NOT SET",
      supabase_anon_key: hasAnon ? "SET" : "NOT SET",
      supabase_service_role_key: hasServiceRole ? "SET" : "NOT SET",
    },
    supabase: {
      reachable: supabaseReachable,
      error: supabaseError,
    },
  });
}
