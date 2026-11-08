import { NextRequest, NextResponse } from "next/server";
import {certificationActor,certificationInput,certificationResponse} from '@/lib/certification/server';
import { createAdminClient } from "@/lib/supabase/admin";
import { initialEvidenceRows } from "@/lib/certification/evidence";

export async function GET() { return certificationResponse(async()=>{ await certificationActor(); const admin = createAdminClient(); const { data, error } = await admin.from("production_certification_runs").select("*").order("created_at", { ascending: false }).limit(25); return error ? NextResponse.json({ code: "CERTIFICATION_READ_FAILED" }, { status: 500 }) : NextResponse.json({ runs: data ?? [] }); });}

export async function POST(request: NextRequest) {return certificationResponse(async()=>{
  const actor=await certificationActor(true);const body=await certificationInput(request) as {production_sha?:string;notes?:string;environment?:'production'|'preview'};
  if (!/^[a-f0-9]{40}$/i.test(body.production_sha ?? "")) return NextResponse.json({ code: "CERTIFICATION_SHA_REQUIRED" }, { status: 400 });
  const admin = createAdminClient(); const { data: run, error } = await admin.from("production_certification_runs").insert({ production_sha: body.production_sha, environment: body.environment==='preview'?'preview':'production', status: "OPEN", created_by: actor.id, notes: body.notes?.slice(0, 2000) ?? null }).select("*").single();
  if (error || !run) return NextResponse.json({ code: "CERTIFICATION_CREATE_FAILED" }, { status: 500 });
  const { error: evidenceError } = await admin.from("production_certification_evidence").insert(initialEvidenceRows().map((row) => ({ ...row, run_id: run.id })));
  if (evidenceError) return NextResponse.json({ code: "CERTIFICATION_EVIDENCE_CREATE_FAILED", run_id: run.id }, { status: 500 });
  return NextResponse.json({ run }, { status: 201 });
});}
