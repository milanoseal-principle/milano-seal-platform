import { z } from 'zod';

export const TOOLS = {
  read_board_evidence: { level: 0, scope: 'corporate', reversible: false },
  draft_report: { level: 1, scope: 'corporate', reversible: true },
  draft_recommendation: { level: 1, scope: 'corporate', reversible: true },
  publish_internal_brief: { level: 2, scope: 'corporate', reversible: true },
} as const;
export type ToolId = keyof typeof TOOLS;
export const FORBIDDEN_TOOLS = ['confirm_payment','schedule_matter','verify_ron','release_documents','bank_transfer','send_email','deploy_production','legal_filing','sign_contract','issue_equity','delete_records'] as const;
export const charterSchema = z.object({
  agent_id:z.string().regex(/^(D|E|W)\d{2}$|^B13$/),role_key:z.string(),title:z.string(),mission:z.string(),
  kind:z.enum(['director','executive','intelligence','worker']),reports_to:z.string().nullable(),voting:z.boolean(),
  authoritative_source_ids:z.array(z.string()).min(1),data_scopes:z.array(z.literal('corporate')).length(1),
  allowed_tool_ids:z.array(z.enum(['read_board_evidence','draft_report','draft_recommendation','publish_internal_brief'])),denied_tool_ids:z.array(z.string()),
  maximum_permission_level:z.number().int().min(0).max(2),approval_triggers:z.array(z.string()),consultation_directors:z.array(z.string()),
  evidence_requirements:z.array(z.string()),output_schema_id:z.literal('board-report-v1'),reporting_cadence:z.enum(['daily','weekly','on_demand']),
  cost_budget:z.number().int().positive(),timeout:z.number().int().min(1).max(120),max_retries:z.number().int().min(0).max(2),
  failure_policy:z.literal('RETRY_BOUNDED_THEN_DEAD_LETTER'),escalation_target:z.literal('FOUNDER'),charter_version:z.literal(1),status:z.literal('NOT_ACTIVATED'),
}).strict();
export type Charter=z.infer<typeof charterSchema>;
const roles = [
 ['board_chair','Board Chair / Chief Strategy Governor','Strategy, priorities, expansion and capital-allocation recommendations.'],
 ['operating_governor','Vice Chair / Chief Operating Governor','Assignments, dependencies, delivery evidence and escalations.'],
 ['corporate_secretary','Corporate Secretary / Legal & Regulatory Director','Corporate records and regulatory research; escalate legal interpretation.'],
 ['treasurer','Treasurer / CFO','Wise-backed financial evidence, margin and clearly labeled forecasts.'],
 ['independent_audit','Lead Independent Director / Audit & Risk Chair','Independent challenge, evidence sufficiency, dissent and critical holds.'],
 ['technology','CTO / Technology & AI Strategy Director','Platform reliability, source, integrations, migrations and bounded AI architecture.'],
 ['security','CISO / Cybersecurity & Privacy Director','Access, privacy, secrets, incidents, backups and tool security.'],
 ['product','CPO / Product & Client Experience Director','Client experience, mobile accessibility and product quality.'],
 ['revenue','CRO / Revenue & Global Partnerships Director','Verified acquisition evidence, qualified partnerships and ethical outreach drafts.'],
 ['capital','Chief Capital & Investor Relations Director','Capital research and diligence; no autonomous securities commitments.'],
 ['execution','Chief Global Execution & Alliance Operations Director','Execution evidence, custody and partner readiness; no provider completion authority.'],
 ['global_intelligence','Chief Global Intelligence & Market Authority Director','Source-backed country, authority and market research; uncertainty remains explicit.'],
] as const;
const executiveTitles=['Chief Executive Strategy','Operations / Program Management','Corporate Legal Operations','Finance Operations & Reconciliation','Independent Assurance & Control Testing','Principal Engineering / Platform Agent','Security Operations','Product & Client Experience','Revenue / Partner Operations','Investor / Capital Operations','Global Execution / Dispatch','Global Research / Authority Growth'];
export const COMMITTEES = [
 {id:'A',title:'Audit, Finance & Capital',members:['D04','D05','D10'],categories:['finance','capital']},
 {id:'B',title:'Technology, AI & Cyber',members:['D06','D07','D08'],categories:['technology','security']},
 {id:'C',title:'Legal, Regulatory & Governance',members:['D03','D11','D05'],categories:['legal','governance']},
 {id:'D',title:'Product, Revenue & Global Markets',members:['D08','D09','D12','D11'],categories:['product','revenue','global']},
 {id:'E',title:'Strategy, Investment & Scale',members:['D01','D02','D04','D06','D09','D10'],categories:['strategy']},
] as const;
const base={authoritative_source_ids:['canonical-system-registry','canonical-matter-state-machine','verified-wise-evidence','approved-corporate-evidence'],data_scopes:['corporate'] as ['corporate'],allowed_tool_ids:['read_board_evidence','draft_report','draft_recommendation'] as ToolId[],denied_tool_ids:[...FORBIDDEN_TOOLS],maximum_permission_level:1,approval_triggers:['L2_ACTION','MATERIAL_PROPOSAL','PRODUCTION_CHANGE','EXTERNAL_COMMUNICATION'],consultation_directors:['D05','D07'],evidence_requirements:['TRACEABLE_SOURCE','FRESHNESS','DISSENT','NO_CLIENT_DOCUMENT_CONTENT'],output_schema_id:'board-report-v1' as const,reporting_cadence:'on_demand' as const,cost_budget:100_000,timeout:60,max_retries:1,failure_policy:'RETRY_BOUNDED_THEN_DEAD_LETTER' as const,escalation_target:'FOUNDER' as const,charter_version:1 as const,status:'NOT_ACTIVATED' as const};
const id=(prefix:string,n:number)=>`${prefix}${String(n+1).padStart(2,'0')}`;
export const DIRECTORS:Charter[]=roles.map(([role_key,title,mission],i)=>charterSchema.parse({...base,agent_id:id('D',i),role_key,title,mission,kind:'director',reports_to:null,voting:true,reporting_cadence:'daily'}));
export const EXECUTIVES:Charter[]=roles.map(([key,,mission],i)=>charterSchema.parse({...base,agent_id:id('E',i),role_key:`executive_${key}`,title:executiveTitles[i],mission,kind:'executive',reports_to:id('D',i),voting:false}));
export const INTELLIGENCE_OFFICER:Charter=charterSchema.parse({...base,agent_id:'B13',role_key:'board_intelligence_officer',title:'Non-voting Board Intelligence Officer / Corporate Secretariat',mission:'Validate traceable reports, preserve dissent, flag gaps and assemble source-backed packets. No approval privilege.',kind:'intelligence',reports_to:'D01',voting:false,allowed_tool_ids:['read_board_evidence','draft_report','publish_internal_brief'],maximum_permission_level:2,reporting_cadence:'daily'});
const specialties=['database','api','frontend','qa','devops','security_rls','corporate_research','finance_wise','investor_diligence','attorney_research','ron','apostille','courier','custody','country_intelligence','seo'];
export const WORKERS:Charter[]=specialties.map((specialty,i)=>charterSchema.parse({...base,agent_id:id('W',i),role_key:`worker_${specialty}`,title:`Bounded ${specialty.replaceAll('_',' ')} worker`,mission:'Perform one scoped corporate research or drafting task; never mutate client operational truth.',kind:'worker',reports_to:null,voting:false}));
export const AGENTS=[...DIRECTORS,INTELLIGENCE_OFFICER,...EXECUTIVES,...WORKERS];
export function assertRegistry() {
 if(DIRECTORS.length!==12 || EXECUTIVES.length!==12 || COMMITTEES.length!==5 || INTELLIGENCE_OFFICER.voting || new Set(AGENTS.map(a=>a.agent_id)).size!==AGENTS.length) throw Error('INVALID_GOVERNANCE_REGISTRY');
 for(const agent of AGENTS){charterSchema.parse(agent);for(const tool of agent.allowed_tool_ids)if(TOOLS[tool].level>agent.maximum_permission_level || agent.denied_tool_ids.includes(tool))throw Error('CHARTER_PERMISSION_MISMATCH');}
 return true;
}
assertRegistry();
