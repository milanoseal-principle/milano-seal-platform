// Real existing pages, intercepted synthetic transports; no hosted writes/providers.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,rmSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:3174',out='artifacts/progressive-intake';mkdirSync(out,{recursive:true});
if(existsSync('.next/lock')||existsSync('.next/dev/lock'))throw Error('Run rendered fixtures sequentially');
const original=readFileSync('next-env.d.ts','utf8');
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3174'],{env:{...process.env,NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:9',NEXT_PUBLIC_SUPABASE_ANON_KEY:'local-not-a-credential'},stdio:['ignore','pipe','pipe']});
let log='',browser;server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
try{
 let ready=false;for(let n=0;n<90;n++){try{if((await fetch(base+'/intake?intent=ron')).ok){ready=true;break}}catch{}if(server.exitCode!==null)throw Error('Fixture server exited');await new Promise(r=>setTimeout(r,1000));}assert.ok(ready);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});const results=[];
 for(const width of [320,390,430,768,1280,1440]){
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{sessionStorage.setItem('milano_ritual_home_seen','1');sessionStorage.setItem('milano_ritual_seen','1');});
  await page.route('**/api/intake/analytics',r=>r.fulfill({status:202,json:{ok:false}}));
  let creates=0,uploads=0,payload;
  await page.route('**/api/intake',async r=>{creates++;payload=r.request().postDataJSON();await r.fulfill({json:{success:true,deal_id:'00000000-0000-4000-8000-000000000001',quote_state:'review_required'}})});
  await page.route('**/api/intake/upload',r=>{uploads++;return uploads===1?r.fulfill({status:503,json:{error:'Synthetic upload outage'}}):r.fulfill({json:{files:[{id:'synthetic-upload'}]}})});
  await page.route('**/intake/confirmation?*',r=>r.fulfill({contentType:'text/html',body:'<main>Controlled confirmation fixture</main>'}));
  await page.goto(base,{waitUntil:'networkidle'});
  const ron=page.getByRole('link',{name:'Start Online Notary',exact:true});await ron.click();
  await page.locator('#service-intent').waitFor();assert.equal(await page.locator('#service-intent').inputValue(),'ron');
  await page.locator('#intake-description').fill('Please review this affidavit for online signing.');
  await page.locator('#intake-document-type').fill('Affidavit');
  await page.locator('input[type=file]').last().setInputFiles({name:'synthetic-affidavit.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\nSynthetic local fixture only\n%%EOF')});
  await page.locator('#service-intent').selectOption('witness');await page.locator('#service-intent').selectOption('ron');assert.equal(creates,0,'Intent switching must never create a Matter');
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  assert.equal(await page.locator('#intake-destination').count(),0);assert.equal(await page.locator('#review-apostille').count(),0);
  await page.locator('#intake-signers').fill('1');await page.locator('#intake-signer-location').fill('Tampa, Florida, United States');await page.locator('#intake-witness-context').fill('I am not sure; please review the document.');
  await page.getByRole('button',{name:'Back',exact:true}).click();await page.getByText('synthetic-affidavit.pdf',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Continue',exact:true}).click();assert.equal(await page.locator('#intake-signers').inputValue(),'1');
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByRole('button',{name:'Review request',exact:true}).click();await page.getByText('Your name is required.',{exact:true}).waitFor();assert.equal(await page.locator('#intake-name').evaluate(e=>document.activeElement===e),true);
  await page.locator('#intake-name').fill('Synthetic Person');await page.locator('#intake-email').fill('synthetic@example.invalid');await page.locator('#intake-timeline').selectOption('standard');
  await page.getByRole('button',{name:'Review request',exact:true}).click();
  assert.equal(await page.locator('[role=progressbar]').getAttribute('aria-valuenow'),'4');assert.equal(await page.locator('[role=progressbar]').getAttribute('aria-valuemax'),'4');
  assert.equal(await page.locator('#review-destination').count(),0);assert.equal(await page.locator('#review-origin').count(),0);assert.equal(await page.locator('#review-translation').count(),0);
  const fallback=page.getByRole('link',{name:'Not ready? Get pricing'});assert.match(await fallback.getAttribute('href'),/service_intent=ron/);
  await page.locator('#review-execution-method').selectOption('RON');await page.getByRole('button',{name:'Save execution method',exact:true}).click();await page.locator('#review-consent').check();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow');
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:`${out}/review-${width}.png`,fullPage:true});
  await page.getByRole('button',{name:'Submit for document review',exact:true}).click();await page.getByRole('button',{name:'Retry Upload',exact:true}).waitFor();assert.equal(creates,1);assert.equal(payload.service_intent,'ron');assert.equal(payload.witness_context,'I am not sure; please review the document.');assert.equal(payload.client_quoted_total,undefined);
  await page.getByRole('button',{name:'Retry Upload',exact:true}).click();await page.getByText('Controlled confirmation fixture').waitFor();assert.equal(creates,1,'Upload retry cannot create a second Matter');assert.equal(uploads,2);
  assert.deepEqual(errors,[]);results.push({width,status:'PASS',matter_creation_requests:creates,upload_retry_same_matter:true,scope:'INTERCEPTED_SYNTHETIC_TRANSPORT'});await page.close();
 }
 // All entry contexts and draft-over-query precedence on actual canonical page.
 const page=await browser.newPage({viewport:{width:390,height:1000},reducedMotion:'reduce'});await page.route('**/api/intake/analytics',r=>r.fulfill({status:202,json:{ok:false}}));
 for(const intent of ['witness','apostille','international_execution','domestic_execution','foreign_counsel','unsure']){
  await page.goto(base+'/intake?intent='+intent,{waitUntil:'networkidle'});await page.evaluate(()=>sessionStorage.removeItem('ms_intake_draft_v1'));await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('#service-intent').inputValue(),intent);
 }
 await page.locator('#service-intent').selectOption('witness');await page.locator('#intake-description').fill('Saved witness context');await page.waitForFunction(()=>JSON.parse(sessionStorage.getItem('ms_intake_draft_v1')||'{}').form?.serviceIntent==='witness');
 await page.goto(base+'/intake?intent=ron',{waitUntil:'networkidle'});assert.equal(await page.locator('#service-intent').inputValue(),'witness');assert.equal(await page.locator('#intake-description').inputValue(),'Saved witness context');

 // International expansion stays in the same form and keeps signer context.
 await page.evaluate(()=>sessionStorage.removeItem('ms_intake_draft_v1'));await page.goto(base+'/intake?intent=ron',{waitUntil:'networkidle'});
 await page.locator('#intake-description').fill('Review my document.');await page.getByRole('button',{name:'Continue',exact:true}).click();await page.locator('#intake-signers').fill('2');await page.locator('#intake-international-use').selectOption('true');await page.getByRole('button',{name:'Continue',exact:true}).click();await page.locator('#intake-destination').waitFor();assert.equal(await page.locator('#intake-origin').count(),1);assert.equal(await page.locator('#intake-receiving-authority').count(),1);await page.getByRole('button',{name:'Back',exact:true}).click();assert.equal(await page.locator('#intake-signers').inputValue(),'2');
 // Professional context keeps its shorter route and the counsel boundary.
 await page.evaluate(()=>sessionStorage.removeItem('ms_intake_draft_v1'));await page.goto(base+'/intake?intent=foreign_counsel&lane=professional',{waitUntil:'networkidle'});await page.locator('#intake-description').fill('Instructions for my client request.');await page.getByRole('button',{name:'Continue',exact:true}).click();await page.locator('#intake-destination').waitFor();assert.equal(await page.locator('#intake-signers').count(),0);await page.getByRole('button',{name:'Continue',exact:true}).click();await page.locator('#intake-firm').waitFor();await page.getByText('You remain counsel. Milano handles the U.S. execution workflow.',{exact:true}).waitFor();
 // Unknown persistence outcome never invites a second creation, even after reload.
 let unknownCreates=0;await page.route('**/api/intake',r=>{unknownCreates++;return r.fulfill({status:503,json:{error:'Synthetic unknown persistence outcome'}})});
 await page.evaluate(()=>sessionStorage.removeItem('ms_intake_draft_v1'));await page.goto(base+'/intake?intent=ron',{waitUntil:'networkidle'});await page.locator('#intake-description').fill('Review my affidavit.');await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:'Continue',exact:true}).click();await page.locator('#intake-name').fill('Synthetic Person');await page.locator('#intake-email').fill('synthetic@example.invalid');await page.locator('#intake-timeline').selectOption('standard');await page.getByRole('button',{name:'Review request',exact:true}).click();await page.locator('#review-consent').check();await page.getByRole('button',{name:'Submit for document review',exact:true}).click();await page.getByText('Your previous submission needs confirmation. Speak with Nicholas below before submitting again.',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Submit for document review',exact:true}).isDisabled(),true);await page.reload({waitUntil:'networkidle'});assert.equal(await page.getByRole('button',{name:'Submit for document review',exact:true}).isDisabled(),true);assert.equal(unknownCreates,1);
 await page.close();writeFileSync(out+'/summary.json',JSON.stringify({status:'PASS',hosted:false,results,other_entry_links:'PASS',international_expansion:'PASS',professional_short_route:'PASS',unknown_outcome_no_retry:'PASS',draft_over_stale_query:'PASS',real_submission:'NOT_RUN'},null,2));console.log('PASS progressive intake at six widths; actual pages, synthetic API and upload outage/retry, no hosted writes.');
}finally{await browser?.close();server.kill('SIGTERM');if(server.exitCode===null)await new Promise(resolve=>{const timer=setTimeout(()=>{server.kill('SIGKILL');resolve()},8000);server.once('exit',()=>{clearTimeout(timer);resolve()})});rmSync('.next/dev/types',{recursive:true,force:true});writeFileSync('next-env.d.ts',original);writeFileSync(out+'/server.log',log);}
