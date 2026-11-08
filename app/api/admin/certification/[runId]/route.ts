import {readAllKeyset} from '@/lib/data/keyset';
import { NextResponse } from "next/server";
import {certificationActor,certificationInput,certificationResponse} from '@/lib/certification/server';
import {PRODUCTION_CERTIFICATION_CHECKS} from '@/lib/certification/checks';
import {z} from 'zod';
import { createAdminClient } from "@/lib/supabase/admin";
import { buildCertificationReport } from "@/lib/certification/report";
import type { CertificationEvidence } from "@/lib/certification/types";

export async function GET(_: Request, { params }: { params: Promise<{ runId: string }> }) {return certificationResponse(async()=>{ await certificationActor(); const { runId } = await params; const admin = createAdminClient(); const [{ data: run }, { data: evidence }] = await Promise.all([admin.from("production_certification_runs").select("*").eq("id", runId).maybeSingle(), readAllKeyset<CertificationEvidence>(async cursor=>{let query=admin.from('production_certification_evidence').select('*').eq('run_id',runId).order('step_key').limit(100);if(cursor)query=query.gt('step_key',cursor.step_key);const result=await query;if(result.error)throw Error('CERTIFICATION_EVIDENCE_READ_FAILED');return result.data as CertificationEvidence[]??[];},row=>row.step_key).then(data=>({data}))]); if (!run) return NextResponse.json({ code: "CERTIFICATION_NOT_FOUND" }, { status: 404 }); return NextResponse.json({ run, evidence: evidence ?? [], report: buildCertificationReport((evidence ?? []) as CertificationEvidence[]) }); });}

export async function POST(request:Request,{params}:{params:Promise<{runId:string}>}) {return certificationResponse(async()=>{
 const actor=await certificationActor(true);const {runId}=await params;const body=z.object({production_sha:z.string().regex(/^[a-f0-9]{40}$/),decision:z.enum(['GO','NO_GO']),reason:z.string().trim().min(10).max(1000)}).strict().parse(await certificationInput(request));
 const result=await createAdminClient().rpc('finalize_production_certification',{p_actor:actor.id,p_run:z.string().uuid().parse(runId),p_sha:body.production_sha,p_decision:body.decision,p_reason:body.reason,p_checks:PRODUCTION_CERTIFICATION_CHECKS.map(check=>({key:check.key,matter_continuity:check.matterContinuity===true}))});
 if(result.error)throw Error('CERTIFICATION_FINALIZATION_NOT_CONFIRMED');return {ok:true,result:result.data};
 });}
