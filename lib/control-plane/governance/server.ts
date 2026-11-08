import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveServerRole } from '@/lib/auth/server-role';
import { taskRequestSchema,decisionSchema,sourceSchema,validateTask } from './contracts';
import { scoreForecast } from './reporting';
import { governanceAccess } from './access';
import { AGENTS } from './registry';
import { governanceRuntimeStatus } from './runtime';
export class GovernanceHTTPError extends Error {constructor(public code:string,public status=400){super(code);}}
export async function governanceActor(founderOnly=false) {
 const client=await createClient();const {data:{user}}=await client.auth.getUser();
 if(!user)throw new GovernanceHTTPError('UNAUTHENTICATED',401);
 const role=await resolveServerRole(user);const founder=governanceAccess(role,true);
 if(!governanceAccess(role,founderOnly))throw new GovernanceHTTPError('GOVERNANCE_FORBIDDEN',403);
 return {id:user.id,role,founder};
}
export function sameOrigin(request:Request) {
 if(request.headers.get('origin')!==new URL(request.url).origin || request.headers.get('sec-fetch-site')==='cross-site' || !request.headers.get('content-type')?.startsWith('application/json'))throw new GovernanceHTTPError('SAME_ORIGIN_JSON_REQUIRED',403);
}
export async function governanceResponse(action:()=>Promise<unknown>) {
 const correlation_id=randomUUID();try{return NextResponse.json(await action());}catch(error){
 const code=error instanceof GovernanceHTTPError?error.code:error instanceof z.ZodError?'INVALID_GOVERNANCE_INPUT':'GOVERNANCE_STORAGE_OR_RUNTIME_UNAVAILABLE';
 const status=error instanceof GovernanceHTTPError?error.status:error instanceof z.ZodError?400:503;
 console.error('[governance]',{code,correlation_id});return NextResponse.json({error:code,...(error instanceof z.ZodError?{fields:error.issues.map(issue=>issue.path.join('.'))}:{}),correlation_id,owner:'MILANO',persisted_state:'NOT_CONFIRMED',next_action:status===401?'Sign in again.':'Refresh persisted governance state. Review configuration, migration readiness or the indicated blocker before retrying.'},{status});
 }
}
const reason=z.string().trim().min(10).max(500),uuid=z.string().uuid(),hash=z.string().regex(/^[a-f0-9]{64}$/);
const operationSchema=z.discriminatedUnion('operation',[
 z.object({operation:z.literal('task'),body:taskRequestSchema}).strict(),z.object({operation:z.literal('decision'),body:decisionSchema}).strict(),
 z.object({operation:z.literal('source'),body:sourceSchema.omit({value:true,unit:true}).extend({basis:z.literal('APPROVED_REFERENCE'),visibility:z.enum(['FOUNDER','OPERATIONS'])})}).strict(),
 z.object({operation:z.literal('approve'),body:z.object({task_id:uuid,action_hash:hash,reason,ttl_seconds:z.number().int().min(30).max(3600)}).strict()}).strict(),
 z.object({operation:z.literal('pause'),body:z.object({paused:z.boolean(),mode:z.enum(['DISABLED','SHADOW','BOUNDED']),reason}).strict()}).strict(),
 z.object({operation:z.literal('schedule'),body:z.object({period:z.enum(['daily','weekly','monthly','quarterly']),enabled:z.boolean(),reason}).strict()}).strict(),
 z.object({operation:z.literal('agent'),body:z.object({agent_id:z.string(),enabled:z.boolean(),reason}).strict()}).strict(),
 z.object({operation:z.literal('hold'),body:z.object({decision_id:uuid.nullable(),reason}).strict()}).strict(),
 z.object({operation:z.literal('clear_hold'),body:z.object({hold_id:uuid,verification_task_id:uuid,reason}).strict()}).strict(),
 z.object({operation:z.literal('verify'),body:z.object({task_id:uuid,output_hash:hash,verification_task_id:uuid,reason}).strict()}).strict(),
 z.object({operation:z.literal('opinion'),body:z.object({task_id:uuid,stance:z.enum(['FOR','AGAINST','DISSENT'])}).strict()}).strict(),
 z.object({operation:z.enum(['retry','cancel','compensate']),body:z.object({task_id:uuid,reason}).strict()}).strict(),
 z.object({operation:z.literal('revoke'),body:z.object({approval_id:uuid,reason}).strict()}).strict(),
 z.object({operation:z.literal('outcome'),body:z.object({task_id:uuid,forecast_id:z.string().max(200),source_id:z.string().max(200)}).strict()}).strict(),
]);
const safeCodes=new Set(['TOOL_NOT_AUTHORIZED','IDEMPOTENCY_CONFLICT','SOURCE_MISSING_STALE_OR_FORBIDDEN','DELEGATION_CEILING','APPROVAL_TARGET_MISMATCH','APPROVAL_REASON_OR_TTL_REQUIRED','CRITICAL_HOLD','MISSING_DECISION_EVIDENCE','COMMITTEE_CONSULTATION_REQUIRED','INDEPENDENT_VERIFIER_REQUIRED','VERIFICATION_TARGET_MISMATCH','INDEPENDENT_AUDIT_REQUIRED','RETRY_NOT_SAFE','APPROVAL_ALREADY_CONSUMED_OR_REVOKED','CLOSED_ACTUAL_EVIDENCE_REQUIRED']);
export async function governanceMutation(request:Request) {
 sameOrigin(request);const actor=await governanceActor();const command=operationSchema.parse(await request.json());
 if(!actor.founder && !['task','pause','hold'].includes(command.operation))throw new GovernanceHTTPError('FOUNDER_REQUIRED',403);
 if(command.operation==='pause'&&!command.body.paused&&!governanceRuntimeStatus().execution_available)throw new GovernanceHTTPError('RUNTIME_UNCONFIGURED',409);
 const admin=createAdminClient();
 if(command.operation==='task'){
  const body=command.body;let parent;
  if(body.parent_task_id){const result=await admin.from('governance_tasks').select('permission,depth,source_ids,visibility').eq('id',body.parent_task_id).single();if(result.error||!result.data||(!actor.founder&&result.data.visibility!=='OPERATIONS'))throw new GovernanceHTTPError('PARENT_NOT_AUTHORIZED',403);parent=result.data;}
  validateTask(body,parent);
 }
 const result=await admin.rpc('governance_command',{p_actor:actor.id,p_operation:command.operation,p_body:command.body});
 if(result.error){const code=result.error.message?.split(':')[0];throw new GovernanceHTTPError(result.error.code==='42501'?'GOVERNANCE_FORBIDDEN':safeCodes.has(code)?code:'GOVERNANCE_ACTION_NOT_CONFIRMED',result.error.code==='42501'?403:409);}
 return {ok:true,result:result.data};
}
export const cursorSchema=z.object({created_at:z.string().datetime({offset:true}),id:uuid}).strict();
export async function governanceSnapshot(request:Request) {
 const actor=await governanceActor();const url=new URL(request.url);
 if(url.searchParams.has('collection'))return governanceCollection(request,actor);const raw=url.searchParams.get('cursor');
 const cursor=raw?cursorSchema.parse(JSON.parse(Buffer.from(raw,'base64url').toString())):null;
 const admin=createAdminClient();let tasks=admin.from('governance_tasks').select('id,agent_id,charter_version,payload,action_hash,permission,parent_task_id,depth,dependency_ids,decision_id,source_ids,visibility,status,attempt_count,max_attempts,cost_limit,cost_reserved,cost_actual,output,output_hash,error_code,created_at,completed_at,verified_by').order('created_at',{ascending:false}).order('id',{ascending:false}).limit(26);
 if(!actor.founder)tasks=tasks.eq('visibility','OPERATIONS');
 if(cursor)tasks=tasks.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
 const agentQuery=readGovernanceAgents(admin);
 let sources=admin.from('governance_sources').select('source_id,sha256,observed_at,expires_at,basis,value,unit,visibility').order('observed_at',{ascending:false}).order('source_id',{ascending:false}).limit(50);
 if(!actor.founder)sources=sources.eq('visibility','OPERATIONS');
 const result=await Promise.all([tasks,agentQuery,sources]);if(result.some(r=>r.error))throw new GovernanceHTTPError('GOVERNANCE_SCHEMA_NOT_READY',503);
 if(result[1].data?.length!==AGENTS.length)throw new GovernanceHTTPError('GOVERNANCE_REGISTRY_NOT_CONVERGED',503);
 const rows=result[0].data??[];const page=rows.slice(0,25);const last=page.at(-1);let privateData:Record<string,unknown>={};
 if(actor.founder){const names=['governance_settings','governance_schedules','governance_decisions','governance_approvals','governance_holds','governance_opinions','governance_packets','governance_outcomes'] as const;
 const responses=await Promise.all(names.map(name=>{const query=admin.from(name).select(name==='governance_outcomes'?'*,governance_tasks(output)':'*');return name==='governance_settings'||name==='governance_schedules'?query.limit(4):query.order('created_at',{ascending:false}).order('id',{ascending:false}).limit(25);}));
 if(responses.some(r=>r.error))throw new GovernanceHTTPError('GOVERNANCE_SCHEMA_NOT_READY',503);
 privateData=Object.fromEntries(names.map((name,i)=>[name,name==='governance_outcomes'?z.array(z.record(z.string(),z.unknown())).parse(responses[i].data??[]).map(outcomeWithScore):responses[i].data]));}
 return {actor:{founder:actor.founder},runtime:governanceRuntimeStatus(),agents:result[1].data,sources:result[2].data,tasks:page,next_cursor:last?Buffer.from(JSON.stringify({created_at:last.created_at,id:last.id})).toString('base64url'):null,limits:{tasks:25,sources:50,private_lists:25},...privateData};
}

const collections={tasks:'governance_tasks',sources:'governance_sources',decisions:'governance_decisions',approvals:'governance_approvals',holds:'governance_holds',opinions:'governance_opinions',packets:'governance_packets',outcomes:'governance_outcomes',history:'audit_events'} as const;
async function governanceCollection(request:Request,actor:{founder:boolean}){
 const url=new URL(request.url);const name=z.enum(['tasks','sources','decisions','approvals','holds','opinions','packets','outcomes','history']).parse(url.searchParams.get('collection'));
 if(!actor.founder&&!['tasks','sources'].includes(name))throw new GovernanceHTTPError('FOUNDER_REQUIRED',403);
 const raw=url.searchParams.get('cursor');const cursor=raw?z.object({time:z.string().datetime({offset:true}),id:z.string().regex(/^[A-Za-z0-9:_/.-]{1,200}$/)}).strict().parse(JSON.parse(Buffer.from(raw,'base64url').toString())):null;
 const time=name==='sources'?'observed_at':'created_at',id=name==='sources'?'source_id':'id';
 let query=createAdminClient().from(collections[name]).select(name==='outcomes'?'*,governance_tasks(output)':'*').order(time,{ascending:false}).order(id,{ascending:false}).limit(26);
 if(!actor.founder)query=query.eq('visibility','OPERATIONS');if(name==='history')query=query.like('event_type','AI_GOV_%');
 if(cursor)query=query.or(`${time}.lt.${cursor.time},and(${time}.eq.${cursor.time},${id}.lt.${cursor.id})`);
 const result=await query;if(result.error)throw new GovernanceHTTPError('GOVERNANCE_PAGE_UNAVAILABLE',503);
 const rows=z.array(z.record(z.string(),z.unknown())).parse(result.data??[]).slice(0,25),last=rows.at(-1);
 return {collection:name,rows:name==='outcomes'?rows.map(outcomeWithScore):rows,next_cursor:last?Buffer.from(JSON.stringify({time:last[time],id:last[id]})).toString('base64url'):null};
}

async function readGovernanceAgents(admin:ReturnType<typeof createAdminClient>){
 const all:{agent_id:string;charter_hash:string;enabled:boolean}[]=[];let cursor='';
 for(let page=0;page<=AGENTS.length;page++){
  let query=admin.from('governance_agents').select('agent_id,charter_hash,enabled').order('agent_id').limit(AGENTS.length+1);if(cursor)query=query.gt('agent_id',cursor);
  const result=await query;if(result.error)return {data:null,error:result.error};if(!result.data?.length)return {data:all,error:null};
  all.push(...result.data);if(all.length>AGENTS.length)throw new GovernanceHTTPError('GOVERNANCE_REGISTRY_NOT_CONVERGED',503);cursor=result.data.at(-1)!.agent_id;
 }
 throw new GovernanceHTTPError('GOVERNANCE_REGISTRY_NOT_CONVERGED',503);
}

function outcomeWithScore(row:Record<string,unknown>){
 const task=row.governance_tasks as {output?:{forecasts?:{forecast_id:string;prediction:number}[]}}|null;
 const prediction=task?.output?.forecasts?.find(f=>f.forecast_id===row.forecast_id)?.prediction;
 const score=scoreForecast(prediction??Number.NaN,Number(row.actual),prediction!==undefined);
 const {governance_tasks:_,...safe}=row;return {...safe,prediction:prediction??null,calibration:score};
}
