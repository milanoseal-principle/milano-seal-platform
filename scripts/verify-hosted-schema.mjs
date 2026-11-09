// Read-only management query; never applies migrations or emits credentials.
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const missing=['SUPABASE_ACCESS_TOKEN','SUPABASE_QA_PROJECT_REF'].filter(name=>!process.env[name]);mkdirSync('artifacts/gap-closure',{recursive:true});
let result={status:'BLOCKED',missing_environment_names:missing,hosted_migrations_applied:false};
if(!missing.length){const ref=process.env.SUPABASE_QA_PROJECT_REF;if(!/^[a-z0-9]{20}$/.test(ref))throw Error('Approved project reference is invalid');
 try{const response=await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`,{method:'POST',headers:{Authorization:`Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({query:readFileSync('supabase/verification/final_gap_provenance.sql','utf8'),read_only:true}),signal:AbortSignal.timeout(30000)});
 if(!response.ok)result={status:'BLOCKED',http_status:response.status,category:'HOSTED_SCHEMA_QUERY_UNAVAILABLE',hosted_migrations_applied:false};
 else {const evidence=await response.json();writeFileSync('artifacts/gap-closure/hosted-schema-private.json',JSON.stringify(evidence,null,2));result={status:'OBSERVED_PENDING_PROVENANCE_REVIEW',evidence_path:'artifacts/gap-closure/hosted-schema-private.json',hosted_migrations_applied:false,production_certified:false};}
 }catch(error){result={status:'BLOCKED',category:'HOSTED_ACCESS',code:error.cause?.code??error.name,hosted_migrations_applied:false};}}
writeFileSync('artifacts/gap-closure/hosted-schema-status.json',JSON.stringify(result,null,2));console.log(result.status+': hosted schema observation only; no migration or activation.');process.exitCode=result.status==='BLOCKED'?2:0;
