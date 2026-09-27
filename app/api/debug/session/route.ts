import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// SMOKE TEST ONLY — disable after launch by setting ENABLE_DEBUG_SESSION=false
export async function GET() {
  if (
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production" ||
    process.env.ENABLE_DEBUG_SESSION !== "true"
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (process.env.VERCEL_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  if (process.env.ENABLE_DEBUG_SESSION !== "true") {
    return NextResponse.json({ error: "Disabled" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ authenticated: false, email: null, role: null });
  }

  const role =
    (user.app_metadata?.role ?? user.app_metadata?.role ?? null) as string | null;

  // Never return: id, tokens, metadata payloads, keys, storage paths
  return NextResponse.json({
    authenticated: true,
    email: user.email ?? null,
    role,
  });
}
