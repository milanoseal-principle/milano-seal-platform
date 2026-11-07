import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveServerRole } from "@/lib/auth/server-role";
import { canPerformProtectedMatterTransition } from "@/lib/auth/protectedMatterTransitions";
import { normalizeExecutionTruth, validateExecutionTruth } from "@/lib/matter/executionTruth";

const reviewSchema = z.object({
  document_type: z.string().trim().min(1).max(200),
  destination_country: z.string().trim().min(1).max(100),
  origin_state: z.string().trim().max(200).default(""),
  document_count: z.number().int().min(1).max(100),
  requested_deadline: z.string().trim().max(120).default("Not specified"),
  document_reviewed: z.literal(true), signer_reviewed: z.literal(true),
  witness_reviewed: z.literal(true), eligibility_reviewed: z.literal(true),
  signer_count: z.number().int().min(1).max(100), witness_count: z.number().int().min(0).max(100),
  reason: z.string().trim().min(10).max(2000),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (!canPerformProtectedMatterTransition(await resolveServerRole(user))) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "INVALID_MATTER_ID" }, { status: 400 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "INVALID_REVIEW" }, { status: 400 });
  const review = reviewSchema.safeParse(body.review);
  const truth = normalizeExecutionTruth(body);
  const validation = validateExecutionTruth(truth);
  if (!review.success || !validation.valid || validation.reviewRequired || !truth.signer_location ||
    (truth.execution_method === "ron" && (truth.ron_kba_status !== "required" || truth.ron_credential_analysis_status !== "required"))) {
    return NextResponse.json({ error: "EXECUTION_REVIEW_INCOMPLETE", remaining: validation.errors }, { status: 409 });
  }
  const admin = createAdminClient();
  const { data: matter, error: readError } = await admin.from("deals").select("id,updated_at").eq("id", id).maybeSingle();
  if (readError) return NextResponse.json({ error: "MATTER_READ_FAILED" }, { status: 503 });
  if (!matter) return NextResponse.json({ error: "MATTER_NOT_FOUND" }, { status: 404 });
  const { data, error } = await admin.rpc("confirm_matter_execution_review", {
    p_matter_id: id, p_expected_updated_at: matter.updated_at, p_truth: truth,
    p_review: review.data, p_actor_id: user.id,
  });
  const result = Array.isArray(data) ? data[0] : data;
  if (error || !result?.matter) return NextResponse.json({ error: error?.code === "40001" ? "STALE_MATTER_STATE" : "EXECUTION_REVIEW_NOT_SAVED" }, { status: error?.code === "42501" ? 403 : error?.code === "40001" || error?.code === "22023" ? 409 : 503 });
  return NextResponse.json({ ok: true, evidence_id: result.evidence_id });
}
