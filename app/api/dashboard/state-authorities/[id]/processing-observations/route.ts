import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { canPerformProtectedMatterTransition } from "@/lib/auth/protectedMatterTransitions";
import { isOfficialGovernmentSource } from "@/lib/intelligence/execution-brain/stateAuthorityProvenance";
import {
  evaluateProcessingAdvisory,
  type ObservationConfidence,
  type ProcessingObservation,
} from "@/lib/intelligence/execution-brain/processingAdvisory";

export const runtime = "nodejs";

const SERVICE_TYPES = new Set(["apostille", "notarial_certificate", "authentication", "other"]);
const METHODS = new Set(["official_source", "operator_confirmed", "observed_turnaround", "other"]);
const OBSERVATION_FIELDS =
  "id, authority_id, service_type, source_url, source_title, source_date, observed_processing_date, estimated_days, observation_method, confidence, observed_at, expires_at, operator_override, override_reason, verified_by";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireDashboardAccess();
  const { id } = await params;
  const supabase = createAdminClient();
  const [{ data: observations }, { count }] = await Promise.all([
    supabase.from("authority_processing_observations").select(OBSERVATION_FIELDS).eq("authority_id", id).order("observed_at", { ascending: false }).limit(50),
    supabase.from("authority_review_required").select("id", { count: "exact", head: true }).eq("authority_id", id).eq("review_status", "PENDING"),
  ]);
  const serviceType = req.nextUrl.searchParams.get("service_type") ?? undefined;
  return NextResponse.json({
    advisory: evaluateProcessingAdvisory((observations ?? []) as ProcessingObservation[], { serviceType, pendingSourceReviews: count ?? 0 }),
    observations: observations ?? [],
  });
}

// Operator records a processing observation. The server derives confidence
// from provenance; the request cannot claim VERIFIED_SOURCE. Every
// observation expires (max 120 days).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, role } = await requireDashboardAccess();
  if (!canPerformProtectedMatterTransition(role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const serviceType = String(body.service_type ?? "");
  const method = String(body.observation_method ?? "");
  if (!SERVICE_TYPES.has(serviceType)) return NextResponse.json({ error: "INVALID_SERVICE_TYPE" }, { status: 400 });
  if (!METHODS.has(method)) return NextResponse.json({ error: "INVALID_OBSERVATION_METHOD" }, { status: 400 });
  const days = body.estimated_days;
  if (typeof days !== "number" || !Number.isInteger(days) || days < 0 || days > 365) {
    return NextResponse.json({ error: "INVALID_ESTIMATED_DAYS" }, { status: 400 });
  }
  const expiresInDays = body.expires_in_days === undefined ? 30 : Number(body.expires_in_days);
  if (!Number.isInteger(expiresInDays) || expiresInDays < 1 || expiresInDays > 120) {
    return NextResponse.json({ error: "INVALID_EXPIRY" }, { status: 400 });
  }
  const evidence = String(body.evidence_note ?? "").trim();
  if (evidence.length < 10) return NextResponse.json({ error: "EVIDENCE_NOTE_REQUIRED" }, { status: 400 });
  const sourceUrl = typeof body.source_url === "string" && body.source_url.trim() ? body.source_url.trim() : null;
  const sourceDate = typeof body.source_date === "string" && DATE_RE.test(body.source_date) ? body.source_date : null;
  const observedDate = typeof body.observed_processing_date === "string" && DATE_RE.test(body.observed_processing_date) ? body.observed_processing_date : null;
  const override = body.operator_override === true;
  const overrideReason = typeof body.override_reason === "string" ? body.override_reason.trim() : "";
  if (override && overrideReason.length < 10) return NextResponse.json({ error: "OVERRIDE_REASON_REQUIRED" }, { status: 400 });

  const confidence: ObservationConfidence =
    method === "official_source" && isOfficialGovernmentSource(sourceUrl) && sourceDate
      ? "VERIFIED_SOURCE"
      : method === "operator_confirmed"
        ? "OPERATOR_CONFIRMED"
        : method === "observed_turnaround"
          ? "OBSERVED"
          : "LOW_CONFIDENCE";

  const now = new Date();
  const { data, error } = await createAdminClient()
    .from("authority_processing_observations")
    .insert({
      authority_id: id,
      service_type: serviceType,
      source_url: sourceUrl,
      source_title: typeof body.source_title === "string" ? body.source_title.trim().slice(0, 300) || null : null,
      source_date: sourceDate,
      observed_processing_date: observedDate,
      estimated_days: days,
      observation_method: method,
      confidence,
      observed_at: now.toISOString(),
      expires_at: new Date(now.getTime() + expiresInDays * 86_400_000).toISOString(),
      operator_override: override,
      override_reason: override ? overrideReason.slice(0, 1000) : null,
      verified_by: userId,
    })
    .select(OBSERVATION_FIELDS)
    .single();
  if (error || !data) return NextResponse.json({ error: "OBSERVATION_PERSIST_FAILED" }, { status: 500 });
  return NextResponse.json({ success: true, observation: data }, { status: 201 });
}
