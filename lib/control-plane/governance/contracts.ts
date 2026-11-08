import { z } from 'zod';
import { AGENTS, TOOLS, type ToolId } from './registry';
export const reference=z.string().min(3).max(200).regex(/^[A-Za-z0-9][A-Za-z0-9:_/.-]+$/);
export const sourceSchema=z.object({source_id:reference,sha256:z.string().regex(/^[a-f0-9]{64}$/),observed_at:z.string().datetime({offset:true}),expires_at:z.string().datetime({offset:true}),classification:z.enum(['CORPORATE','PUBLIC']),basis:z.enum(['VERIFIED_CANONICAL_METRIC','APPROVED_REFERENCE','AGENT_REPORT']),value:z.number().finite().optional(),unit:z.string().max(20).optional()}).strict();
export const reportSchema=z.object({schema_version:z.literal(1),summary:z.string().min(1).max(2000),source_ids:z.array(reference).max(50),claims:z.array(z.object({claim_id:reference,text:z.string().max(500),source_ids:z.array(reference).min(1),confidence:z.enum(['VERIFIED','UNVERIFIED','CONFLICTING']),metric_value:z.number().finite().optional(),unit:z.string().max(20).optional(),calculation_basis:z.string().max(500).nullable()}).strict()).max(30),dissent:z.array(z.string().max(500)).max(20),risks:z.array(z.string().max(500)).max(20),missing_evidence:z.array(z.string().max(200)).max(30),forecasts:z.array(z.object({forecast_id:reference,prediction:z.number().finite(),unit:z.string().max(20),due_at:z.string().datetime({offset:true}),basis_source_ids:z.array(reference).min(1)}).strict()).max(10)}).strict();
export type BoardReport=z.infer<typeof reportSchema>;
export const taskRequestSchema=z.object({agent_id:z.string(),tool_id:z.enum(['read_board_evidence','draft_report','draft_recommendation','publish_internal_brief']),title:z.string().trim().min(10).max(200),period:z.enum(['daily','weekly','monthly','quarterly']).default('daily'),source_ids:z.array(reference).max(50),parent_task_id:z.string().uuid().nullable().default(null),dependency_ids:z.array(z.string().uuid()).max(20).default([]),decision_id:z.string().uuid().nullable().default(null),idempotency_key:z.string().uuid(),cost_limit:z.number().int().min(1).max(100_000),visibility:z.enum(['FOUNDER','OPERATIONS']).default('FOUNDER')}).strict();
export type TaskRequest=z.infer<typeof taskRequestSchema>;
export const decisionSchema=z.object({title:z.string().min(10).max(200),category:z.enum(['finance','capital','technology','security','legal','governance','product','revenue','global','strategy']),responsible_director_id:z.string().regex(/^D(0[1-9]|1[0-2])$/),risk:z.enum(['LOW','MATERIAL','CRITICAL']),recommendation_for:z.string().max(2000),recommendation_against:z.string().max(2000),source_ids:z.array(reference).max(50),evidence_missing:z.array(z.string().max(200)).max(30),idempotency_key:z.string().uuid()}).strict();
export function validateTask(input:TaskRequest,parent?:{permission:number;depth:number;source_ids:string[]}) {
 const task=taskRequestSchema.parse(input);const agent=AGENTS.find(a=>a.agent_id===task.agent_id);const tool=TOOLS[task.tool_id];
 if(!agent || !agent.allowed_tool_ids.includes(task.tool_id as ToolId) || tool.level>agent.maximum_permission_level || agent.denied_tool_ids.includes(task.tool_id))throw Error('TOOL_NOT_AUTHORIZED');
 if(parent && (parent.depth>=2 || tool.level>parent.permission || task.source_ids.some(s=>!parent.source_ids.includes(s))))throw Error('DELEGATION_CEILING');
 if(agent.kind==='worker'&&!task.parent_task_id)throw Error('PARENT_REQUIRED');
 if(task.parent_task_id && !parent)throw Error('PARENT_REQUIRED');
 if(task.cost_limit>agent.cost_budget)throw Error('BUDGET_EXCEEDED');
 if(/(sk-[A-Za-z0-9_-]{12,}|Bearer\s+\S+|-----BEGIN|password\s*[:=]|api[_-]?key\s*[:=])/i.test(task.title))throw Error('SENSITIVE_INPUT_REJECTED');
 return {task,agent,permission:tool.level};
}
export function validateReport(report:unknown,sources:z.infer<typeof sourceSchema>[],now=Date.now()) {
 const value=reportSchema.parse(report);const allowed=new Map(sources.map(s=>[s.source_id,sourceSchema.parse(s)]));
 const refs=[...value.source_ids,...value.claims.flatMap(c=>c.source_ids),...value.forecasts.flatMap(f=>f.basis_source_ids)];
 if(refs.some(id=>!allowed.has(id)))throw Error('UNSCOPED_SOURCE');
 for(const claim of value.claims)if(claim.confidence==='VERIFIED'&&claim.source_ids.some(id=>allowed.get(id)!.basis!=='VERIFIED_CANONICAL_METRIC' || claim.metric_value!==allowed.get(id)!.value || claim.unit!==allowed.get(id)!.unit || Date.parse(allowed.get(id)!.expires_at)<=now || Date.parse(allowed.get(id)!.observed_at)>now))throw Error('STALE_OR_FUTURE_EVIDENCE');
 if(/(sk-[A-Za-z0-9_-]{12,}|Bearer\s+\S+|-----BEGIN|<script|javascript:)/i.test(JSON.stringify(value)))throw Error('UNSAFE_MODEL_OUTPUT');
 return value;
}
export function assertDAG(tasks:{id:string;dependencies:string[]}[]) {
 const map=new Map(tasks.map(t=>[t.id,t.dependencies]));const done=new Set<string>(),visiting=new Set<string>();
 const visit=(id:string)=>{if(visiting.has(id))throw Error('TASK_CYCLE');if(done.has(id))return;if(!map.has(id))throw Error('MISSING_DEPENDENCY');visiting.add(id);for(const dep of map.get(id)!)visit(dep);visiting.delete(id);done.add(id);};
 for(const task of tasks)visit(task.id);return true;
}
