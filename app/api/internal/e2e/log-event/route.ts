import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (process.env.MILANO_E2E_DEMO_MODE !== "true") {
    return NextResponse.json({ error: "E2E demo mode is not enabled." }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { deal_ref: string; action: string; detail?: string; meta?: Record<string, unknown> };
  if (!body.deal_ref || !body.action) {
    return NextResponse.json({ error: "deal_ref and action are required" }, { status: 400 });
  }

  await logActivity({
    deal_id: body.deal_ref,
    actor: user.email ?? "operator",
    action: body.action,
    detail: body.detail ?? null,
    meta: { ...body.meta, source: "e2e-demo" },
  });

  return NextResponse.json({ success: true });
}
