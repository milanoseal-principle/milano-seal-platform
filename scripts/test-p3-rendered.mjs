// Local controlled UI fixtures only. Never sends a real notification, requests
// provider execution, touches production data or certifies a hosted transaction.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
const route='app/p3-local-proof';
const out='artifacts/proof/p3-controlled';
const base='http://127.0.0.1:3173';
if(existsSync(route)) throw Error('Refusing to overwrite an existing proof route');
mkdirSync(route,{recursive:true});mkdirSync(out,{recursive:true});
writeFileSync(`${route}/page.tsx`,readFileSync('tests/fixtures/P3DomesticProof.tsx'));
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3173'],{env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe']});
let log='';server.stdout.on('data',d=>{log+=d});server.stderr.on('data',d=>{log+=d});
let browser;
try {
  let ready=false;
  for(let i=0;i<90;i++) {
    try { const r=await fetch(base+'/p3-local-proof');if(r.ok){ready=true;break;} } catch { /* server starting */ }
    if(server.exitCode!==null) throw Error('Proof server exited');
    await new Promise(r=>setTimeout(r,1000));
  }
  assert.ok(ready,'Proof server did not become ready');
  browser=await chromium.launch({headless:true});
  const results=[];
  for(const width of [320,390,768,1440]) {
    const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    let reviewPayload;
    await page.route('**/api/pricing/quote',r=>r.fulfill({json:{review_required:false,review_reasons:[],total:750,subtotal:750,deposit_amount:375,balance_due:375,eligible_subtotal:750,non_discountable_total:0,breakdown:[],route_intelligence:{reviewRequired:false,routeType:'domestic_execution',routeLabel:'Reviewed Domestic Execution',authorityStatus:'NOT_APPLICABLE',documentCategory:'private_notarized',reviewReasons:[],advisories:[],safetyNotice:'Controlled fixture.'}}}));
    await page.route('**/api/dashboard/matters/*/execution-review',async r=>{reviewPayload=r.request().postDataJSON();await r.fulfill({json:{ok:true,evidence_id:'fixture-evidence'}})});
    await page.goto(base+'/p3-local-proof',{waitUntil:'networkidle'});
    await page.getByRole('button',{name:'Confirm execution review',exact:true}).waitFor();
    assert.ok((await page.getByText('Apostille / authentication: Not required following Milano review.',{exact:true}).count())>=1);
    await page.getByLabel('I have reviewed these facts and resolved the execution blockers.').check();
    await page.getByLabel('Review evidence / instruction reference').fill('Controlled fixture document and eligibility review');
    await page.getByRole('button',{name:'Confirm execution review',exact:true}).click();
    await page.getByText('Execution review saved. Private quote approval remains a separate step.',{exact:true}).waitFor();
    assert.equal(reviewPayload.review.document_reviewed,true);
    assert.equal(reviewPayload.review.signer_count,1);
    assert.equal(reviewPayload.execution_method,'in_person');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow');
    assert.deepEqual(errors,[],'Browser runtime errors');
    await page.screenshot({path:`${out}/domestic-${width}.png`,fullPage:true});
    results.push({width,status:'PASS',scope:'Controlled UI; mocked quote and review transport. Database RPCs tested separately.'});
    await page.close();
  }
  writeFileSync(`${out}/rendered.json`,JSON.stringify({live_certification:false,results},null,2));
  console.log(JSON.stringify(results));
} finally {
  await browser?.close();server.kill('SIGTERM');rmSync(route,{recursive:true,force:true});
  writeFileSync(`${out}/render-server.log`,log);
}
