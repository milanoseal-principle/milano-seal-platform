import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildCertificationReport } from "@/lib/certification/report";
import type { CertificationEvidence } from "@/lib/certification/types";

export async function GET(_: Request, { params }: { params: Promise<{ runId: string }> }) { await requireDashboardAccess(); const { runId } = await params; const admin = createAdminClient(); const [{ data: run }, { data: evidence }] = await Promise.all([admin.from("production_certification_runs").select("*").eq("id", runId).maybeSingle(), admin.from("production_certification_evidence").select("*").eq("run_id", runId).order("step_key")]); if (!run) return NextResponse.json({ code: "CERTIFICATION_NOT_FOUND" }, { status: 404 }); return NextResponse.json({ run, evidence: evidence ?? [], report: buildCertificationReport((evidence ?? []) as CertificationEvidence[]) }); }
