import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDispatchOperator } from "@/lib/dispatch/serverAuth";

export async function POST(req: NextRequest) {
  const auth = await requireDispatchOperator();
  if (!auth.ok) return auth.response;

  let body: { dispatch_id?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const dispatchId = String(body.dispatch_id ?? "").trim();
  const reason = String(body.reason ?? "").trim().slice(0, 1000);
  if (!dispatchId || !reason) {
    return NextResponse.json({ error: "DISPATCH_ID_AND_REASON_REQUIRED" }, { status: 422 });
  }

  const { data, error } = await createAdminClient().rpc("escalate_dispatch_request", {
    p_dispatch_id: dispatchId,
    p_reason: reason,
    p_actor: auth.actor,
  });

  if (error || !data) {
    const conflict = String(error?.message ?? "").includes("STATE_CONFLICT");
    return NextResponse.json(
      { error: conflict ? "DISPATCH_STATE_CONFLICT" : "DISPATCH_ESCALATION_FAILED" },
      { status: conflict ? 409 : 500 },
    );
  }

  return NextResponse.json({ dispatch: data });
}

export async function GET() {
  return NextResponse.json({ error: "METHOD_NOT_ALLOWED" }, { status: 405 });
}
