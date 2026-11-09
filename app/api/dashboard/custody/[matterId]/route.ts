import {evaluatePaymentGate} from '@/lib/payments/paymentGate';
import {createHash} from 'node:crypto';
import {z} from 'zod';
import {createAdminClient} from '@/lib/supabase/admin';
import {governanceActor,governanceResponse,GovernanceHTTPError} from '@/lib/control-plane/governance/server';
import {documentVersions,persistUploadedVersion,versionBytes} from '@/lib/documents/versions';
import {inspectDocumentPreflight} from '@/lib/intelligence/execution-brain/documentPreflight';
import { getLedger } from '@/lib/custodyLedger';
import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ matterId: string }> }
) {
  await requireDashboardAccess();
  const { matterId } = await params;
  const requestedVersion=new URL(request.url).searchParams.get('version_id');
  if(requestedVersion){try{z.string().uuid().parse(requestedVersion);const {version,bytes}=await versionBytes(createAdminClient(),matterId,requestedVersion);return new NextResponse(bytes,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename="milano-version-${requestedVersion}.bin"; filename*=UTF-8''${encodeURIComponent(String(version.file_name??'document.bin'))}`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}catch{return NextResponse.json({error:'VERSION_ACCESS_OR_INTEGRITY_REVIEW_REQUIRED',next_action:'Confirm operator access and ask the founder to review the exact stored version. Hash mismatches block approval and require incident review.'},{status:409});}}
  if(new URL(request.url).searchParams.get('versions')==='1')return NextResponse.json({versions:await documentVersions(createAdminClient(),matterId)},{headers:{'Cache-Control':'private, no-store'}});
  let rows;try{rows=await getLedger(matterId);}catch{return NextResponse.json({error:'CUSTODY_READ_UNAVAILABLE',owner:'MILANO'},{status:503});}

  // Never expose: actor_id, label_url, storage_path
  const events = (rows ?? []).map((e) => ({
    id: e.id,
    deal_id: e.deal_id,
    event: e.event,
    actor_type: e.actor_type ?? "system",
    notes: e.notes ? String(e.notes).slice(0, 80) : null,
    created_at: e.created_at,
    stage_from: e.metadata?.stage_from ?? null,
    stage_to: e.metadata?.stage_to ?? null,
  }));

  return NextResponse.json({ events });
}

export async function POST(request:Request,{params}:{params:Promise<{matterId:string}>}) {
 return governanceResponse(async()=>{
  const actor=await governanceActor();const {matterId}=await params;z.string().uuid().parse(matterId);
  if(request.headers.get('origin')!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site')throw new GovernanceHTTPError('SAME_ORIGIN_REQUIRED',403);
  const admin=createAdminClient();const matter=await admin.from('deals').select('id,execution_truth,payment_status,payment_confirmed,payment_settlement_status,amount_due,amount_paid').eq('id',matterId).maybeSingle();if(matter.error||!matter.data)throw new GovernanceHTTPError('MATTER_NOT_FOUND',404);
  if(request.headers.get('content-type')?.startsWith('application/json')){
   const input=z.object({action:z.literal('approve'),version_id:z.string().uuid(),expected_sha256:z.string().regex(/^[a-f0-9]{64}$/),reason:z.string().trim().min(20).max(1000)}).strict().parse(await request.json());
   if(!actor.founder)throw new GovernanceHTTPError('FOUNDER_REVIEW_REQUIRED',403);
   const {version}=await versionBytes(admin,matterId,input.version_id);if(version.file_hash!==input.expected_sha256)throw new GovernanceHTTPError('VERSION_CHANGED',409);
   const result=await admin.rpc('approve_document_version',{p_actor:actor.id,p_version:version.id,p_expected_hash:input.expected_sha256,p_reason:input.reason});if(result.error)throw Error('VERSION_REVIEW_NOT_CONFIRMED');return {ok:true};
  }
  const form=await request.formData();const file=form.get('file');const stage=z.enum(['intake_upload','executed','apostille_packet','apostilled','final_packet']).parse(form.get('stage'));const id=z.string().uuid().parse(form.get('request_id'));const parent=z.string().uuid().nullable().parse(form.get('parent_id')||null);
  if(!(file instanceof File)||file.size===0||file.size>20*1024*1024)throw new GovernanceHTTPError('SUPPORTED_FILE_UNDER_20MB_REQUIRED',400);
  if(stage==='executed'&&(!['in_person','mobile'].includes(String(matter.data.execution_truth?.execution_method))||!matter.data.execution_truth?.review_confirmed_by||evaluatePaymentGate(matter.data)!=='PAYMENT_CONFIRMED'))throw new GovernanceHTTPError('IN_PERSON_EXECUTION_REVIEW_REQUIRED',409);
  if(stage!=='intake_upload'&&!parent)throw new GovernanceHTTPError('PARENT_VERSION_REQUIRED',400);if(parent)await versionBytes(admin,matterId,parent);
  const bytes=Buffer.from(await file.arrayBuffer());const preflight=await inspectDocumentPreflight({bytes,mimeType:file.type,fileName:file.name});if(preflight.status==='BLOCKED')throw new GovernanceHTTPError('DOCUMENT_PREFLIGHT_BLOCKED',409);
  const path=`${matterId}/versioned/${id}/${preflight.sha256}`;const saved=await admin.storage.from('documents').upload(path,bytes,{contentType:file.type,upsert:false});if(saved.error){const existing=await admin.storage.from('documents').download(path);if(existing.error||!existing.data||createHash('sha256').update(Buffer.from(await existing.data.arrayBuffer())).digest('hex')!==preflight.sha256)throw Error('VERSION_UPLOAD_NOT_CONFIRMED');}
  const version_id=await persistUploadedVersion(admin,{matterId,path,bucket:'documents',bytes,mime:file.type,name:file.name,actor:actor.id,stage,parentId:parent,id,submissionReference:z.string().trim().max(200).parse(form.get('submission_reference')??'')});return {ok:true,version_id};
 });
}
