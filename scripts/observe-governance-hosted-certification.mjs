// Read-only observer of the EXISTING certification API. It never creates a Matter,
// redeems a code, submits payment, schedules a session or declares live PASS.
import {request} from 'playwright';import {mkdirSync,writeFileSync} from 'node:fs';
const names=['GOVERNANCE_QA_APPROVED_URL','GOVERNANCE_QA_APPROVED_RUN_ID','GOVERNANCE_QA_APPROVED_MATTER_ID','GOVERNANCE_QA_APPROVED_SHA','GOVERNANCE_QA_STORAGE_STATE_PATH'];
const missing=names.filter(name=>!process.env[name]);mkdirSync('artifacts/governance',{recursive:true});
let result={status:'BLOCKED',category:'AUTHORIZATION_CONFIG',missing_environment_names:missing,live_provider_certification:'NOT_CERTIFIED'};
if(!missing.length){
 const url=new URL(process.env.GOVERNANCE_QA_APPROVED_URL);const runId=process.env.GOVERNANCE_QA_APPROVED_RUN_ID,matterId=process.env.GOVERNANCE_QA_APPROVED_MATTER_ID,sha=process.env.GOVERNANCE_QA_APPROVED_SHA;
 if(url.protocol!=='https:'||!(url.hostname==='www.themilanoseal.com'||/^[a-z0-9-]+\.vercel\.app$/.test(url.hostname))||!/^[a-f0-9-]{36}$/.test(runId)||!/^[a-f0-9-]{36}$/.test(matterId)||!/^[a-f0-9]{40}$/.test(sha))throw Error('Invalid approved hosted target');
 const context=await request.newContext({storageState:process.env.GOVERNANCE_QA_STORAGE_STATE_PATH});
 try{
  const response=await context.get(`${url.origin}/api/admin/certification/${runId}`,{maxRedirects:0,timeout:20000});
  if(!response.ok())result={status:'BLOCKED',category:'HOSTED_AUTH_OR_API',http_status:response.status(),live_provider_certification:'NOT_CERTIFIED'};
  else{const body=await response.json();const evidence=Array.isArray(body.evidence)?body.evidence:[];
   if(body.run?.production_sha!==sha||evidence.some(item=>item.matter_id&&item.matter_id!==matterId))throw Error('Approved SHA or Matter continuity mismatch');
   result={status:'EVIDENCE_OBSERVED_PENDING_INDEPENDENT_REVIEW',environment:'HOSTED_READ_ONLY',approved_sha:sha,run_id:runId,matter_id:matterId,evidence:evidence.map(item=>({step_key:item.step_key,result_reported_by_server:item.result,reference_present:!!item.evidence_reference,observed_at:item.observed_at})),live_provider_certification:'NOT_CERTIFIED'};
  }
 }finally{await context.dispose();}
}
writeFileSync('artifacts/governance/hosted-observation.json',JSON.stringify(result,null,2));console.log(`${result.status}: read-only hosted certification observation. No provider actions or commercial redemption executed.`);if(result.status==='BLOCKED')process.exitCode=2;
