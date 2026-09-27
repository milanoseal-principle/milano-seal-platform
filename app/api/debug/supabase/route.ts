import { NextResponse } from "next/server";
import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

export const runtime = "nodejs";

function safeHost(value: string | undefined) {
  if (!value) return null;
  try {
    return new URL(value.trim()).host;
  } catch {
    return "INVALID_URL";
  }
}

function safeCause(error: unknown) {
  if (error instanceof Error && "cause" in error) {
    const cause = (error as Error & { cause?: unknown }).cause;
    if (cause instanceof Error) return cause.message;
    if (cause) return String(cause);
  }
  return null;
}

export async function GET() {
  if (process.env.VERCEL_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const result: Record<string, unknown> = {
    supabaseUrlSet: Boolean(supabaseUrl),
    supabaseUrlHost: safeHost(supabaseUrl),
    anonKeySet: Boolean(anonKey),
    anonKeyLooksJwt: Boolean(anonKey?.startsWith("eyJ")),
  };

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ ok: false, ...result }, { status: 500 });
  }

  try {
    const authHealth = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/health`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      cache: "no-store",
    });

    result.authHealthStatus = authHealth.status;
    result.authHealthOk = authHealth.ok;

    const text = await authHealth.text();
    result.authHealthBodyPreview = text.slice(0, 160);

    return NextResponse.json({ ok: authHealth.ok, ...result }, { status: authHealth.ok ? 200 : 500 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        ...result,
        fetchError: error instanceof Error ? error.message : "Unknown fetch error",
        fetchCause: safeCause(error),
      },
      { status: 500 },
    );
  }
}
