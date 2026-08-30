import { NextRequest, NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { initialEvidenceRows } from "@/lib/certification/evidence";

export async function GET() { await requireDashboardAccess(); const admin = createAdminClient(); const { data, error } = await admin.from("production_certification_runs").select("*").order("created_at", { ascending: false }).limit(25); return error ? NextResponse.json({ code: "CERTIFICATION_READ_FAILED" }, { status: 500 }) : NextResponse.json({ runs: data ?? [] }); }

export async function POST(request: NextRequest) {
  const actor = await requireDashboardAccess(); const body = await request.json().catch(() => ({})) as { production_sha?: string; notes?: string };
  if (!/^[a-f0-9]{7,40}$/i.test(body.production_sha ?? "")) return NextResponse.json({ code: "CERTIFICATION_SHA_REQUIRED" }, { status: 400 });
  const admin = createAdminClient(); const { data: run, error } = await admin.from("production_certification_runs").insert({ production_sha: body.production_sha, environment: "production", status: "OPEN", created_by: actor.userId, notes: body.notes?.slice(0, 2000) ?? null }).select("*").single();
  if (error || !run) return NextResponse.json({ code: "CERTIFICATION_CREATE_FAILED" }, { status: 500 });
  const { error: evidenceError } = await admin.from("production_certification_evidence").insert(initialEvidenceRows().map((row) => ({ ...row, run_id: run.id })));
  if (evidenceError) return NextResponse.json({ code: "CERTIFICATION_EVIDENCE_CREATE_FAILED", run_id: run.id }, { status: 500 });
  return NextResponse.json({ run }, { status: 201 });
}
