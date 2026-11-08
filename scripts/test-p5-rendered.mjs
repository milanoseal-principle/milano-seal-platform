// Controlled component rendering with intercepted transport, never live proof.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync,readFileSync,writeFileSync,rmSync,existsSync } from 'node:fs';
import assert from 'node:assert/strict';
const route='app/p5-local-proof',out='artifacts/proof/p5-controlled',base='http://127.0.0.1:3175';
if(existsSync('.next/lock')||existsSync('.next/dev/lock'))throw Error('A Next build/dev server is active; run this fixture in isolation');
if(existsSync(route))throw Error('Refusing to overwrite an existing route');
mkdirSync(route,{recursive:true});mkdirSync(out,{recursive:true});writeFileSync(`${route}/page.tsx`,'import { RONSecurityIncidentPanel } from "@/components/ron/RONSecurityIncidentPanel"; export default function Proof(){return <main className="mx-auto max-w-5xl bg-black p-4 text-white"><RONSecurityIncidentPanel /></main>;}' );
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3175'],{env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe']});
let log='',browser;server.stdout.on('data',d=>{log+=d});server.stderr.on('data',d=>{log+=d});
try{
 let ready=false;for(let i=0;i<90;i++){try{if((await fetch(base+'/p5-local-proof')).ok){ready=true;break}}catch{}if(server.exitCode!==null)throw Error('Fixture server exited');await new Promise(r=>setTimeout(r,1000));}assert.ok(ready);
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const results=[];
 for(const width of [320,360,375,390,412,430,768,1024,1280,1440]){
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));const payloads=[];
  await page.route('**/api/dashboard/ron/security-incidents',async route=>{
   if(route.request().method()==='GET')return route.fulfill({json:{data:[],has_more:false}});
   payloads.push(route.request().postDataJSON());
   return route.fulfill(payloads.length===1?{status:422,json:{error:'INCIDENT_NOT_RECORDED',next_action:'Review evidence before retrying.'}}:{json:{id:payloads.at(-1).id,deadline:{state:'PENDING'}}});
  });
  await page.goto(base+'/p5-local-proof',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'Record incident evidence',exact:true}).click();assert.equal(payloads.length,0,'Invalid form must not submit');
  await page.locator('input[name="session_id"]').fill('00000000-0000-4000-8000-000000000004');
  await page.locator('input[name="detected_at"]').fill('2026-01-01T10:00');
  await page.locator('input[name="responsible_operator"]').fill('00000000-0000-4000-8000-000000000001');
  await page.locator('input[name="authority_basis_reference"]').fill('fixture:authority-review');
  await page.locator('textarea[name="summary"]').fill('Controlled compromise description for fixture only');
  await page.getByRole('button',{name:'Record incident evidence',exact:true}).click();
  await page.getByRole('status').filter({hasText:'Review evidence before retrying.'}).waitFor();
  assert.equal(payloads.length,1);assert.deepEqual(payloads[0].evidence.notifications,{});assert.equal('actor_id' in payloads[0],false);
  await page.getByRole('button',{name:'Record incident evidence',exact:true}).click();
  await page.getByRole('status').filter({hasText:'Incident and audit evidence recorded.'}).waitFor();
  assert.equal(payloads.length,2);assert.equal(payloads[0].id,payloads[1].id,'Retry preserves incident identity');
  assert.equal(payloads[0].detected_at,payloads[1].detected_at,'Retry preserves detection time');
  assert.equal(payloads[1].evidence.authority_basis_reference,'fixture:authority-review');
  const png=await page.screenshot({path:`${out}/ron-incident-${width}.png`,fullPage:true});assert.equal(png.readUInt32BE(16),width,'No clipped horizontal content');assert.deepEqual(errors,[]);
  results.push({width,status:'PASS',runtime_errors:errors});await page.close();
 }
 writeFileSync(`${out}/rendered.json`,JSON.stringify({live_certification:false,transport:'mocked',results},null,2));console.log(JSON.stringify(results));
}finally{
 await browser?.close();server.kill('SIGTERM');if(server.exitCode===null)await new Promise(resolve=>{const timer=setTimeout(()=>{server.kill('SIGKILL');resolve()},8000);server.once('exit',()=>{clearTimeout(timer);resolve()})});rmSync(route,{recursive:true,force:true});rmSync('.next/dev/types',{recursive:true,force:true});writeFileSync(`${out}/server.log`,log);
}
