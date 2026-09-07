import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDispatchOperator } from "@/lib/dispatch/serverAuth";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const auth = await requireDispatchOperator();
  if (!auth.ok) return auth.response;

  let body: {
    matter_id?: string;
    requested_service?: string;
    priority?: "normal" | "high" | "urgent";
    requirements?: Record<string, unknown>;
    idempotency_key?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const matterRef = String(body.matter_id ?? "").trim();
  if (!matterRef) {
    return NextResponse.json({ error: "MATTER_ID_REQUIRED" }, { status: 422 });
  }

  const idempotencyKey = String(
    req.headers.get("idempotency-key") ?? body.idempotency_key ?? "",
  ).trim();
  if (!idempotencyKey || idempotencyKey.length > 180) {
    return NextResponse.json({ error: "VALID_IDEMPOTENCY_KEY_REQUIRED" }, { status: 422 });
  }

  const admin = createAdminClient();
  const base = admin.from("deals").select("id,deal_id");
  const { data: matter, error: matterError } = UUID_RE.test(matterRef)
    ? await base.or(`id.eq.${matterRef},deal_id.eq.${matterRef}`).maybeSingle()
    : await base.eq("deal_id", matterRef).maybeSingle();

  if (matterError || !matter) {
    return NextResponse.json({ error: "MATTER_NOT_FOUND" }, { status: 404 });
  }

  const priority = ["normal", "high", "urgent"].includes(String(body.priority))
    ? body.priority!
    : "normal";
  const requestedService = String(body.requested_service ?? "execution").trim().slice(0, 120) || "execution";
  const requirements = body.requirements && typeof body.requirements === "object" && !Array.isArray(body.requirements)
    ? body.requirements
    : {};

  const { data, error } = await admin.rpc("create_dispatch_request", {
    p_matter_id: matter.id,
    p_requested_by: auth.userId,
    p_requested_by_role: auth.role,
    p_requested_service: requestedService,
    p_priority: priority,
    p_requirements: requirements,
    p_idempotency_key: idempotencyKey,
  });

  if (error || !data) {
    return NextResponse.json(
      { error: "DISPATCH_REQUEST_FAILED", detail: error?.message ?? null },
      { status: 500 },
    );
  }

  return NextResponse.json({ dispatch: data }, { status: 201 });
}

export async function GET() {
  return NextResponse.json({ error: "METHOD_NOT_ALLOWED" }, { status: 405 });
}
