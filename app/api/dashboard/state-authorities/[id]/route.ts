import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import {
  STATE_AUTHORITY_FIELDS,
  evaluateStateAuthority,
  type StateAuthorityRecord,
} from "@/lib/intelligence/execution-brain/stateAuthorityProvenance";

export const runtime = "nodejs";

const WRITE_ROLES = new Set(["founder_admin", "admin_operator"]);
const CONFIDENCE = new Set(["OFFICIAL_SOURCE", "OPERATOR_CONFIRMED", "THIRD_PARTY", "UNVERIFIED"]);
const ENUMS: Record<string, Set<string>> = {
  ron_supported_by_state_notary: new Set(["supported", "not_supported", "unknown"]),
  electronic_document_submission_status: new Set(["accepted", "not_accepted", "unknown"]),
  papering_out_rule: new Set(["permitted", "not_permitted", "unknown"]),
  county_clerk_pre_authentication: new Set(["required", "not_required", "unknown"]),
  apostille_submission_method: new Set(["mail", "in_person", "mail_or_in_person", "electronic", "unknown"]),
};
const MAX_REVIEW_WINDOW_MS = 366 * 86_400_000;

// Operator records a provenance review. The server — never the request —
// decides the stored status: VERIFIED only when the source is an official
// government source and the review is complete (also enforced by constraint).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, role } = await requireDashboardAccess();
  if (!WRITE_ROLES.has(role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const reviewNotes = String(body.review_notes ?? "").trim();
  if (reviewNotes.length < 10) {
    return NextResponse.json(
      { error: "EVIDENCE_NOTE_REQUIRED", message: "Record the official source reviewed and what it confirms." },
      { status: 400 },
    );
  }
  const confidence = String(body.confidence ?? "UNVERIFIED").trim().toUpperCase();
  if (!CONFIDENCE.has(confidence)) return NextResponse.json({ error: "INVALID_CONFIDENCE" }, { status: 400 });

  const now = new Date();
  const nextReview = new Date(String(body.next_review_at ?? ""));
  if (
    Number.isNaN(nextReview.getTime()) ||
    nextReview.getTime() <= now.getTime() ||
    nextReview.getTime() - now.getTime() > MAX_REVIEW_WINDOW_MS
  ) {
    return NextResponse.json({ error: "INVALID_NEXT_REVIEW_AT" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {
    official_source_url: typeof body.official_source_url === "string" ? body.official_source_url.trim() || null : null,
    official_source_title:
      typeof body.official_source_title === "string" ? body.official_source_title.trim().slice(0, 300) || null : null,
    confidence,
    review_notes: reviewNotes.slice(0, 2000),
    source_verified_at: now.toISOString(),
    next_review_at: nextReview.toISOString(),
    verified_by: userId,
    updated_at: now.toISOString(),
  };
  for (const [field, allowed] of Object.entries(ENUMS)) {
    if (body[field] === undefined) continue;
    const value = String(body[field]).trim().toLowerCase();
    if (!allowed.has(value)) return NextResponse.json({ error: "INVALID_FIELD", field }, { status: 400 });
    patch[field] = value;
  }
  if (typeof body.competent_authority === "string") patch.competent_authority = body.competent_authority.trim().slice(0, 300);
  if (body.state_fee !== undefined) {
    if (body.state_fee === null || body.state_fee === "") patch.state_fee = null;
    else {
      const fee = Number(body.state_fee);
      if (!Number.isFinite(fee) || fee < 0) return NextResponse.json({ error: "INVALID_STATE_FEE" }, { status: 400 });
      patch.state_fee = Math.round(fee * 100) / 100;
    }
  }

  const supabase = createAdminClient();
  const { data: current } = await supabase.from("state_authorities").select(STATE_AUTHORITY_FIELDS).eq("id", id).maybeSingle();
  if (!current) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const candidate = { ...(current as unknown as StateAuthorityRecord), ...patch, status: "VERIFIED" } as StateAuthorityRecord;
  const evaluation = evaluateStateAuthority(candidate, now);
  patch.status = evaluation.status;

  const { data, error } = await supabase
    .from("state_authorities")
    .update(patch)
    .eq("id", id)
    .select(STATE_AUTHORITY_FIELDS)
    .single();
  if (error || !data) return NextResponse.json({ error: "STATE_AUTHORITY_UPDATE_FAILED" }, { status: 500 });
  return NextResponse.json({ authority: data, evaluation });
}
