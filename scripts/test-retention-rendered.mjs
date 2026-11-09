// Isolated component transport proof. Never a hosted/storage deletion test.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import assert from 'node:assert/strict';
const path='app/retention-local-proof',base='http://127.0.0.1:3176',out='artifacts/retention/rendered';
if(existsSync(path)||existsSync('.next/lock')||existsSync('.next/dev/lock'))throw Error('Run the retention fixture in isolation');
const nextEnv=readFileSync('next-env.d.ts','utf8');mkdirSync(path,{recursive:true});mkdirSync(out,{recursive:true});
writeFileSync(path+'/page.tsx',`import {RONGovernancePanel} from '@/components/ron/RONGovernancePanel';export default function Proof(){return <main className="bg-black p-4"><RONGovernancePanel matterId="00000000-0000-4000-8000-000000000001" canAuthorizeRetention /></main>}`);
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3176'],{env:{...process.env,NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:9',NEXT_PUBLIC_SUPABASE_ANON_KEY:'local-render-only-not-a-credential'},stdio:['ignore','pipe','pipe']});
let log='',browser;server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
try{
 let ready=false;for(let i=0;i<90;i++){try{if((await fetch(base+'/retention-local-proof')).ok){ready=true;break}}catch{}if(server.exitCode!==null)throw Error('Fixture server exited');await new Promise(r=>setTimeout(r,500));}assert.ok(ready);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});const results=[];
 for(const width of [320,1440]){
  const page=await browser.newPage({viewport:{width,height:1100},reducedMotion:'reduce'}),errors=[],calls=[];
  page.on('pageerror',e=>errors.push(e.message));
  const record={id:'00000000-0000-4000-8000-000000000002',record_type:'SYNTHETIC_UPLOAD',retention_class:'CLIENT_UPLOAD',policy_status:'resolved',retention_rule:'OWNER_APPROVED',retention_until:'2020-01-01',deletion_status:'retained'};
  let authorize=0;
  await page.route('**/api/dashboard/retention**',async route=>{
   if(route.request().method()==='GET')return route.fulfill({json:{ok:true,records:[record],holds:[],hold_history:[]}});
   const body=route.request().postDataJSON();calls.push(body);
   if(body.action==='authorize'){
    if(++authorize===1)return route.fulfill({status:409,json:{ok:false,code:'HOLD_ACTIVE'}});
    record.deletion_status='authorized';return route.fulfill({json:{ok:true}});
   }
   if(body.action==='execute'){record.deletion_claim_outcome='unknown';record.deletion_claim='00000000-0000-4000-8000-000000000003';return route.fulfill({status:409,json:{ok:false,code:'RETENTION_RECONCILIATION_REQUIRED',retry_safe:false}});}
   if(body.action==='reconcile'){record.deletion_claim_outcome='not_deleted';record.deletion_status='failed';return route.fulfill({json:{ok:true}});}
   return route.fulfill({json:{ok:true}});
  });
  await page.goto(base+'/retention-local-proof',{waitUntil:'networkidle'});
  const reason=page.getByLabel('Reason (holds, decisions)');await reason.fill('Controlled local human review');
  await page.getByRole('button',{name:'Authorize expired retention deletion',exact:true}).click();
  await page.getByRole('status').filter({hasText:'HOLD_ACTIVE'}).waitFor();assert.equal(calls.length,1);
  await page.getByRole('button',{name:'Authorize expired retention deletion',exact:true}).click();await page.getByRole('status').filter({hasText:'Recorded.'}).waitFor();
  await page.getByRole('button',{name:'Delete authorized record',exact:true}).click();await page.getByRole('status').filter({hasText:'RETENTION_RECONCILIATION_REQUIRED'}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Delete authorized record',exact:true}).isDisabled(),true,'unknown deletion cannot retry');
  await page.getByLabel('Provider deletion or reconciliation evidence reference').fill('synthetic:independent-object-presence');
  await page.getByRole('button',{name:'Record verified preservation',exact:true}).click();await page.getByRole('status').filter({hasText:'Recorded.'}).waitFor();
  assert.equal(calls.at(-1).claim_id,'00000000-0000-4000-8000-000000000003');assert.equal(calls.at(-1).result.evidence_reference,'synthetic:independent-object-presence');
  assert.equal(await page.getByRole('button',{name:'Authorize expired retention deletion',exact:true}).isEnabled(),true);
  const layout=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(layout.scroll<=layout.viewport);assert.deepEqual(errors,[]);
  await page.screenshot({path:`${out}/retention-${width}.png`,fullPage:true});results.push({width,status:'PASS',layout,requests:calls.length,runtime_errors:errors});await page.close();
 }
 writeFileSync(out+'/summary.json',JSON.stringify({status:'PASS',transport:'INTERCEPTED_SYNTHETIC',hosted_or_storage_certification:false,results},null,2));console.log('PASS retention controls at 320 and 1440 pixels; rejected/unknown results never report success.');
}finally{
 await browser?.close();server.kill('SIGTERM');if(server.exitCode===null)await new Promise(resolve=>{const timer=setTimeout(()=>{server.kill('SIGKILL');resolve()},8000);server.once('exit',()=>{clearTimeout(timer);resolve()})});rmSync(path,{recursive:true,force:true});rmSync('.next/dev/types',{recursive:true,force:true});writeFileSync('next-env.d.ts',nextEnv);writeFileSync(out+'/server.log',log);
}
