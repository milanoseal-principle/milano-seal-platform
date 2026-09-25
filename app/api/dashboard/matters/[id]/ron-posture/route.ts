import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveServerRole } from "@/lib/auth/server-role";
import { canPerformProtectedMatterTransition } from "@/lib/auth/protectedMatterTransitions";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ALLOWED = {
  receiving_authority_ron_acceptance: new Set(["accepted", "not_accepted", "unknown"]),
  wet_ink_requirement: new Set(["required", "not_required", "unknown"]),
  original_requirement: new Set(["required", "not_required", "unknown"]),
} as const;

// Operator-recorded receiving-authority RON posture. Merged atomically into
// canonical execution truth with an evidence-ledger entry. The operator must
// state the evidence basis; acceptance is never inferred.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ssr = await createClient();
  const {
    data: { user },
  } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const role = await resolveServerRole(user);
  if (!canPerformProtectedMatterTransition(role)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const posture: Record<string, string> = {};
  for (const [key, allowed] of Object.entries(ALLOWED)) {
    if (body[key] === undefined) continue;
    const value = String(body[key]).trim().toLowerCase();
    if (!allowed.has(value)) {
      return NextResponse.json({ error: "INVALID_RON_POSTURE", field: key }, { status: 400 });
    }
    posture[key] = value;
  }
  if (typeof body.receiving_authority === "string") {
    posture.receiving_authority = body.receiving_authority.trim().slice(0, 200);
  }
  const evidenceNote = String(body.evidence_note ?? "").trim();
  if (Object.keys(posture).length === 0) {
    return NextResponse.json({ error: "EMPTY_RON_POSTURE" }, { status: 400 });
  }
  if (evidenceNote.length < 10) {
    return NextResponse.json(
      {
        error: "EVIDENCE_NOTE_REQUIRED",
        message: "Record the evidence basis (counsel instruction, authority source, or written confirmation).",
      },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const baseQuery = supabase.from("deals").select("id, deal_id, updated_at");
  const { data: matter, error: fetchError } = UUID_RE.test(id)
    ? await baseQuery.or(`id.eq.${id},deal_id.eq.${id}`).maybeSingle()
    : await baseQuery.eq("deal_id", id).maybeSingle();
  if (fetchError || !matter) return NextResponse.json({ error: "MATTER_NOT_FOUND" }, { status: 404 });

  const { data, error } = await supabase.rpc("record_matter_ron_posture", {
    p_matter_id: matter.id,
    p_expected_updated_at: matter.updated_at,
    p_posture: posture,
    p_actor_id: user.id,
    p_occurred_at: new Date().toISOString(),
    p_source: "operator_ron_readiness",
    p_reason: evidenceNote.slice(0, 1000),
  });
  if (error?.code === "40001") {
    return NextResponse.json(
      { error: "STALE_MATTER_STATE", message: "The Matter changed. Refresh and record the posture again." },
      { status: 409 },
    );
  }
  const result = Array.isArray(data) ? data[0] : data;
  if (error || !result?.matter) {
    return NextResponse.json({ error: "RON_POSTURE_PERSISTENCE_FAILED" }, { status: 500 });
  }
  return NextResponse.json({ success: true, posture });
}
