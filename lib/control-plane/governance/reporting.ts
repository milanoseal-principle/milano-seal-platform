import { createHash } from 'node:crypto';
import { DIRECTORS } from './registry';
import { reportSchema, type BoardReport } from './contracts';
export interface ReportRecord {id:string;agent_id:string;status:string;output:unknown;created_at:string;output_hash:string|null}
export function buildPacket(records:ReportRecord[],sourceIds:string[],now=Date.now()):BoardReport {
 const verified=records.filter(r=>r.status==='VERIFIED');const claims=new Map<string,{claim:BoardReport['claims'][number];reports:Set<string>}>();const dissent=new Set<string>();const risks=new Set<string>();const missing=new Set<string>();const metrics=new Map<string,Set<number>>();
 for(const record of verified){const report=reportSchema.parse(record.output);for(const item of report.claims){if(item.metric_value!==undefined){const metricKey=[...item.source_ids].sort().join(',')+':'+item.unit;const observed=metrics.get(metricKey)??new Set<number>();observed.add(item.metric_value);metrics.set(metricKey,observed);if(observed.size>1){risks.add('Conflicting numeric claims for '+metricKey);missing.add('Independent conflict review: '+metricKey);}}const key=createHash('sha256').update(JSON.stringify({text:item.text,metric_value:item.metric_value,unit:item.unit})).digest('hex');const existing=claims.get(key);if(existing)existing.reports.add(`report:${record.id}`);else claims.set(key,{claim:{...item,claim_id:`claim:${key.slice(0,24)}`},reports:new Set([`report:${record.id}`])});}for(const value of report.dissent)dissent.add(value);for(const value of report.risks)risks.add(value);for(const value of report.missing_evidence)missing.add(value);if(Date.parse(record.created_at)<now-86400000)missing.add(`Stale report: ${record.agent_id}`);}
 for(const director of DIRECTORS)if(!verified.some(r=>r.agent_id===director.agent_id && Date.parse(r.created_at)>=now-86400000))missing.add(`Missing fresh report: ${director.agent_id}`);
 return reportSchema.parse({schema_version:1,summary:`Internal packet from ${verified.length} verified report snapshots. ${missing.size} evidence gaps remain. Internal publication does not imply email delivery.`,source_ids:sourceIds,claims:[...claims.values()].slice(0,30).map(({claim,reports})=>({...claim,confidence:'UNVERIFIED',source_ids:[...reports]})),dissent:[...dissent].slice(0,20),risks:[...risks].slice(0,20),missing_evidence:[...missing].slice(0,30),forecasts:[]});
}
export function scoreForecast(prediction:number,actual:number|undefined,closed:boolean) {
 if(!closed || actual===undefined || !Number.isFinite(actual) || !Number.isFinite(prediction))return {status:'NOT_SCORED' as const,absolute_error:null};
 return {status:'CLOSED_ACTUAL' as const,absolute_error:Math.abs(prediction-actual)};
}
