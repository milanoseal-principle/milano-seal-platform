import { NextRequest, NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PRODUCTION_CERTIFICATION_CHECKS } from "@/lib/certification/checks";
import { sanitizeObservedValue } from "@/lib/certification/evidence";

export async function POST(request: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  const actor = await requireDashboardAccess(); const { runId } = await params; const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const stepKey = typeof body.step_key === "string" ? body.step_key : ""; const check = PRODUCTION_CERTIFICATION_CHECKS.find((item) => item.key === stepKey); const result = typeof body.result === "string" ? body.result : "";
  if (!check || !["PASS", "FAIL", "PENDING"].includes(result)) return NextResponse.json({ code: "CERTIFICATION_EVIDENCE_INVALID" }, { status: 400 });
  if (result !== "PENDING" && (!body.evidence_reference || !body.authoritative_source)) return NextResponse.json({ code: "CERTIFICATION_HUMAN_EVIDENCE_REQUIRED" }, { status: 400 });
  const admin = createAdminClient(); const payload = { run_id: runId, phase: check.phase, step_key: stepKey, result, matter_id: typeof body.matter_id === "string" ? body.matter_id : null, evidence_reference: typeof body.evidence_reference === "string" ? body.evidence_reference.slice(0, 1000) : null, route: typeof body.route === "string" ? body.route.slice(0, 300) : null, authoritative_source: typeof body.authoritative_source === "string" ? body.authoritative_source.slice(0, 500) : null, operator_note: typeof body.operator_note === "string" ? body.operator_note.slice(0, 2000) : null, observed_value: sanitizeObservedValue(body.observed_value), observed_at: body.observed_value ? new Date().toISOString() : null, recorded_by: actor.userId, recorded_at: new Date().toISOString() };
  const { data, error } = await admin.from("production_certification_evidence").upsert(payload, { onConflict: "run_id,step_key" }).select("*").single(); return error ? NextResponse.json({ code: "CERTIFICATION_EVIDENCE_WRITE_FAILED" }, { status: 500 }) : NextResponse.json({ evidence: data });
}
