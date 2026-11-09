// Run with NODE_USE_ENV_PROXY=1 where the managed environment supplies a proxy.
// Non-destructive unauthenticated probes. No cookie, payment or order mutation.
import {mkdirSync,writeFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const origin=process.env.RELEASE_QA_ORIGIN??'https://www.themilanoseal.com';const target=new URL(origin);
if(target.protocol!=='https:'||target.origin!==origin||!(target.hostname==='www.themilanoseal.com'||/^[a-z0-9-]+\.vercel\.app$/.test(target.hostname)))throw Error('Approved HTTPS release origin required');
const results=[];
for(const [path,expected] of [['/api/health',[200]],['/professional/damiani',[200]],['/api/dashboard/control-plane/governance',[401,403]],['/api/portal/me/invoice',[401,403]],['/api/export/00000000-0000-4000-8000-000000000000',[401,403,307]],['/api/evidence/00000000-0000-4000-8000-000000000000',[401,403,307]],['/api/deals/00000000-0000-4000-8000-000000000000/custody',[401,403,307]]]){
 try{const response=await fetch(origin+path,{redirect:'manual',signal:AbortSignal.timeout(15000)});const bytes=Buffer.from(await response.arrayBuffer());
  const bodySha=createHash('sha256').update(bytes).digest('hex');let observedSha=null;
  if(path==='/api/health'){try{const health=JSON.parse(bytes.toString());observedSha=health.commit_sha??health.sha??health.version?.commit??null;}catch{}}
  results.push({path,status:response.status,expected_statuses:expected,verdict:expected.includes(response.status)?'PASS':'FAIL',body_sha256:bodySha,observed_sha:observedSha,expected_sha:process.env.RELEASE_QA_SHA??null,sha_match:observedSha&&process.env.RELEASE_QA_SHA?observedSha===process.env.RELEASE_QA_SHA:'NOT_VERIFIABLE',cache_control:response.headers.get('cache-control')});
 }catch(error){results.push({path,verdict:'BLOCKED',reason:error.cause?.code??error.name});}
}
mkdirSync('artifacts/gap-closure',{recursive:true});writeFileSync('artifacts/gap-closure/hosted-release.json',JSON.stringify({observed_at:new Date().toISOString(),origin,method:'UNAUTHENTICATED_GET_ONLY',results,vercel_ready_alias_and_sha:'NOT_VERIFIED',hosted_migration:'NOT_VERIFIED',authenticated_browser:'NOT_RUN',live_certification:'NOT_CERTIFIED'},null,2));
for(const result of results)console.log(`${result.verdict} ${result.path}: ${result.status??result.reason}`);
process.exitCode=results.some(r=>r.verdict==='FAIL')?1:results.some(r=>r.verdict==='BLOCKED')?2:0;
