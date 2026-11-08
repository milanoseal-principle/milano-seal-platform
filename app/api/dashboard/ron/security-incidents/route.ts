import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveServerRole } from '@/lib/auth/server-role';
import { RON_INCIDENT_ROLES, ronIncidentSchema, ronIncidentDeadline } from '@/lib/bluenotary/securityIncidents';

export const runtime = 'nodejs';
async function authorize() {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  return user && RON_INCIDENT_ROLES.has(await resolveServerRole(user)) ? user : null;
}
export async function GET() {
  if (!await authorize()) return NextResponse.json({error:'FORBIDDEN'},{status:403});
  const { data,error } = await createAdminClient().from('compliance_incidents')
    .select('id,ron_session_id,deal_id,status,description,discovered_at,ron_security_evidence')
    .not('ron_security_evidence','is',null).not('status','in','(CLOSED,RESOLVED)')
    .order('discovered_at',{ascending:true}).order('id',{ascending:true}).limit(101);
  if (error) return NextResponse.json({error:'INCIDENT_READ_FAILED',next_action:'Retry incident retrieval; escalate if the failure persists.'},{status:503});
  return NextResponse.json({has_more:(data?.length??0)>100,data:(data??[]).slice(0,100).map(row=>({...row,deadline:ronIncidentDeadline(row.discovered_at,row.ron_security_evidence)}))});
}
export async function POST(request: Request) {
  const user = await authorize();
  if (!user) return NextResponse.json({error:'FORBIDDEN'},{status:403});
  const parsed = ronIncidentSchema.safeParse(await request.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({error:'INCIDENT_REVIEW_REQUIRED',fields:parsed.error.issues.map(i=>i.path.join('.'))},{status:400});
  const body = parsed.data;
  if (Date.parse(body.detected_at)>Date.now()) return NextResponse.json({error:'INVALID_DETECTION_TIME'},{status:400});
  const { data,error } = await createAdminClient().rpc('record_ron_security_incident',{
    p_actor:user.id,p_incident:body.id,p_session:body.session_id,p_detected:body.detected_at,
    p_summary:body.summary,p_status:body.status,p_evidence:body.evidence,
  });
  if (error || typeof data!=='string') return NextResponse.json({error:'INCIDENT_NOT_RECORDED',next_action:'Review evidence, immutable detection time and incident state before retrying.'},{status:error?.code==='42501'?403:422});
  return NextResponse.json({id:data,deadline:ronIncidentDeadline(body.detected_at,body.evidence)});
}
