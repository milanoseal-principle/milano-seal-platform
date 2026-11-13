// Read-only production build guard. Never executes RPCs, reads rows or applies DDL.
import {pathToFileURL} from 'node:url';
export const REQUIRED_SCHEMA = Object.freeze({
  deals: ['id','payment_attempt_id','payment_attempt_started_at','wise_provider_evidence','payment_observed_amount','payment_observed_currency','payment_observed_reference'],
  retention_records: ['id','deletion_claim','deletion_claimed_at','deletion_claim_outcome'],
  retention_holds: ['id'], policy_versions: ['id'], policy_acceptances: ['id'],
  governance_tasks: ['id'], governance_agents: ['agent_id'], governance_settings: ['id'],
  matter_financial_artifacts: ['id'], document_versions: ['id'], notifications: ['id','delivery_status'],
  // Upload write contract (app/api/upload, intake/upload, portal/me/upload).
  files: ['id','deal_id','name','storage_path','filename','file_path','file_url','mime_type','size_bytes'],
  // Portal email-code sign-in, Wise webhook audit and final-release identifier checks.
  portal_otps: ['id','deal_id','email','otp','expires_at','used'],
  wise_webhook_events: ['id','delivery_id','idempotency_hash'],
  identifier_locks: ['id','identifier_type','match_status'],
});
export const REQUIRED_RPCS = Object.freeze([
  'begin_wise_payment_attempt','record_wise_attempt_evidence','confirm_wise_payment_for_deal',
  'retention_command','wise_exception_scan_candidates','resolve_wise_exceptions_from_current_truth',
  'missing_required_policy_acceptances','issue_financial_artifact','append_custody_event','record_document_release',
  'governance_claim','governance_finish','governance_command','institutional_route_is_verified',
]);
export async function verifyProductionSchemaCapabilities(env=process.env,fetcher=fetch) {
  if(env.VERCEL_ENV!=='production')return {status:'NOT_RUN_NON_PRODUCTION_BUILD'};
  if(!env.NEXT_PUBLIC_SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY)throw Error('PRODUCTION_SCHEMA_PREFLIGHT_BINDINGS_REQUIRED');
  const base=new URL(env.NEXT_PUBLIC_SUPABASE_URL);
  if(base.protocol!=='https:'||!base.hostname.endsWith('.supabase.co')||base.username||base.password||base.search||base.hash||(base.pathname!=='/'&&base.pathname!==''))throw Error('PRODUCTION_SCHEMA_PREFLIGHT_TARGET_INVALID');
  let response;
  try{response=await fetcher(new URL('/rest/v1/',base),{method:'GET',redirect:'error',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,Accept:'application/openapi+json'},cache:'no-store',signal:AbortSignal.timeout(15000)});}
  catch{throw Error('PRODUCTION_SCHEMA_PREFLIGHT_UNAVAILABLE');}
  if(!response.ok)throw Error('PRODUCTION_SCHEMA_PREFLIGHT_UNAVAILABLE');
  let spec;try{spec=await response.json();}catch{throw Error('PRODUCTION_SCHEMA_PREFLIGHT_INVALID_METADATA');}
  const schemas=spec.definitions??spec.components?.schemas??{},paths=spec.paths??{},missing=[];
  for(const [table,columns] of Object.entries(REQUIRED_SCHEMA)){
    if(!paths['/'+table]||!schemas[table]){missing.push('table:'+table);continue;}
    for(const column of columns)if(!Object.hasOwn(schemas[table].properties??{},column))missing.push('column:'+table+'.'+column);
  }
  for(const rpc of REQUIRED_RPCS)if(!paths['/rpc/'+rpc])missing.push('rpc:'+rpc);
  if(missing.length)throw Error('PRODUCTION_SCHEMA_CAPABILITIES_MISSING: '+missing.join(', '));
  return {status:'CAPABILITIES_PRESENT_NOT_LIVE_CERTIFICATION',tables:Object.keys(REQUIRED_SCHEMA).length,rpcs:REQUIRED_RPCS.length};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{const result=await verifyProductionSchemaCapabilities();console.log('Production schema preflight: '+result.status);}
 catch(error){console.error(error.message);process.exitCode=1;}
}
