// Controlled component rendering with intercepted transport, never live proof.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync,readFileSync,writeFileSync,rmSync,existsSync } from 'node:fs';
import assert from 'node:assert/strict';
const route='app/p4-local-proof',out='artifacts/proof/p4-controlled',base='http://127.0.0.1:3174';
if(existsSync('.next/lock')||existsSync('.next/dev/lock'))throw Error('A Next build/dev server is active; run this fixture in isolation');
if(existsSync(route))throw Error('Refusing to overwrite an existing route');
mkdirSync(route,{recursive:true});mkdirSync(out,{recursive:true});writeFileSync(`${route}/page.tsx`,readFileSync('tests/fixtures/P4RONEvidenceProof.tsx'));
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3174'],{env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe']});
let log='',browser;server.stdout.on('data',d=>{log+=d});server.stderr.on('data',d=>{log+=d});
try{
 let ready=false;for(let i=0;i<90;i++){try{if((await fetch(base+'/p4-local-proof')).ok){ready=true;break}}catch{}if(server.exitCode!==null)throw Error('Fixture server exited');await new Promise(r=>setTimeout(r,1000));}assert.ok(ready);
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const results=[];
 for(const width of [320,360,375,390,412,430,768,1024,1280,1440]){
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));let payload;
  await page.route('**/api/dashboard/ron/sessions/*/statutory-evidence',async route=>{payload=route.request().postDataJSON();await route.fulfill({json:{ok:true,evidence_id:'00000000-0000-4000-8000-000000000007',duplicate:false}})});
  await page.goto(base+'/p4-local-proof',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'Verify and append evidence',exact:true}).click();assert.equal(payload,undefined,'Empty references must not submit');
  const refs=page.locator('input:not([type="datetime-local"]):not([type="checkbox"]):not([type="number"])');for(let i=0;i<await refs.count();i++)await refs.nth(i).fill('fixture:proof');
  await page.locator('input[name="executed_at"]').fill('2026-01-01T10:00');await page.locator('input[name="recording_retained_until"]').fill('2036-01-01T10:00');
  await page.locator('input[name="commission_expires_at"]').fill('2027-01-01T10:00');await page.locator('input[name="act_count"]').fill('1');
  await page.locator('select[name="witness_applicability"]').selectOption('NOT_REQUIRED');
  await page.getByRole('checkbox').last().check();await page.getByRole('button',{name:'Verify and append evidence',exact:true}).click();await page.getByRole('status').filter({hasText:'Statutory evidence verified and appended'}).waitFor();
  assert.deepEqual(payload.evidence.signed_document_ids,['00000000-0000-4000-8000-000000000006']);assert.equal(payload.evidence.signers[0].kba.status,'VERIFIED');assert.equal(payload.expected_evidence_id,null);assert.equal('actor_id' in payload,false);
  const png=await page.screenshot({path:`${out}/ron-evidence-${width}.png`,fullPage:true});assert.equal(png.readUInt32BE(16),width,'No clipped horizontal content');assert.deepEqual(errors,[]);
  results.push({width,status:'PASS',runtime_errors:errors});await page.close();
 }
 writeFileSync(`${out}/rendered.json`,JSON.stringify({live_certification:false,transport:'mocked',results},null,2));console.log(JSON.stringify(results));
}finally{
 await browser?.close();server.kill('SIGTERM');if(server.exitCode===null)await new Promise(resolve=>{const timer=setTimeout(()=>{server.kill('SIGKILL');resolve()},8000);server.once('exit',()=>{clearTimeout(timer);resolve()})});rmSync(route,{recursive:true,force:true});rmSync('.next/dev/types',{recursive:true,force:true});writeFileSync(`${out}/server.log`,log);
}
