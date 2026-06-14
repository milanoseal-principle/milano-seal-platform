import { NextResponse } from "next/server";

export const runtime = "nodejs";

function safeHost(value: string | undefined) {
  if (!value) return null;
  try {
    return new URL(value).host;
  } catch {
    return "INVALID_URL";
  }
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
      },
      { status: 500 },
    );
  }
}
