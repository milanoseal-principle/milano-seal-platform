// Real local HTTP authorization/liveness boundary. No database credentials or writes.
import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:3177',out='artifacts/operational-evidence/http';
if(existsSync('.next/lock')||existsSync('.next/dev/lock'))throw Error('Run HTTP boundary tests in isolation');
const nextEnv=readFileSync('next-env.d.ts','utf8');mkdirSync(out,{recursive:true});
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3177'],{env:{...process.env,NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:9',NEXT_PUBLIC_SUPABASE_ANON_KEY:'local-not-a-credential'},stdio:['ignore','pipe','pipe']});
let log='';server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
try{
 let ready=false;for(let i=0;i<90;i++){try{if((await fetch(base+'/api/health',{signal:AbortSignal.timeout(1000)})).ok){ready=true;break}}catch{}if(server.exitCode!==null)throw Error('HTTP fixture server exited');await new Promise(r=>setTimeout(r,500));}assert.ok(ready);
 const health=await fetch(base+'/api/health');const publicBody=await health.json();assert.equal(health.status,200);assert.deepEqual(Object.keys(publicBody).sort(),['service','status','timestamp']);
 const results=[];
 for(const path of ['/api/health/database','/api/health/storage','/api/health/payment','/api/health/dispatch','/api/health/assistant','/api/health/webhooks','/api/admin/db-health','/api/admin/wise/health']){
  const response=await fetch(base+path,{redirect:'manual',signal:AbortSignal.timeout(15000)});const body=await response.json();assert.equal(response.status,401,path);assert.deepEqual(body,{error:'Unauthorized'},path);results.push({path,status:response.status,result:'PASS'});
 }
 const dashboard=await fetch(base+'/dashboard/monitoring',{redirect:'manual'});assert.equal(dashboard.status,307);assert.equal(new URL(dashboard.headers.get('location'),base).pathname,'/login');
 writeFileSync(out+'/summary.json',JSON.stringify({status:'PASS',environment:'ISOLATED_LOCAL_HTTP_NO_SESSION',public_liveness:'PASS',private_diagnostics:results,monitoring_auth_redirect:'PASS',hosted:false,authenticated_positive:'NOT_RUN_NO_SECURE_SESSION'},null,2));console.log('PASS public liveness and 9 protected operational HTTP boundaries; no provider or data mutation.');
}finally{
 server.kill('SIGTERM');if(server.exitCode===null)await new Promise(resolve=>{const timer=setTimeout(()=>{server.kill('SIGKILL');resolve()},8000);server.once('exit',()=>{clearTimeout(timer);resolve()})});rmSync('.next/dev/types',{recursive:true,force:true});writeFileSync('next-env.d.ts',nextEnv);writeFileSync(out+'/server.log',log);
}
