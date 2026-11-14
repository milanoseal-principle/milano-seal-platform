import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, openSync, closeSync, existsSync } from 'node:fs';

const base = new URL(process.env.CLEANUP_BASE_URL ?? 'http://127.0.0.1:3100');
assert.ok(['localhost','127.0.0.1'].includes(base.hostname), 'Use an isolated local server, never a live submission endpoint');
let ownedServer;
const available = async () => { try { return (await fetch(new URL('/api/health',base),{signal:AbortSignal.timeout(1000)})).ok; } catch { return false; } };
if (!await available()) {
 mkdirSync('artifacts/proof/operational-cleanup',{recursive:true});
 const output=openSync('artifacts/proof/operational-cleanup/server.log','w');
 ownedServer=spawn(process.execPath,['node_modules/next/dist/bin/next',existsSync('.next/BUILD_ID')?'start':'dev','--hostname','127.0.0.1','--port',base.port||'3100'],{stdio:['ignore',output,output],detached:process.platform!=='win32',env:{...process.env,NODE_OPTIONS:`${process.env.NODE_OPTIONS??''} --max-old-space-size=6144`}});
 closeSync(output);
 const deadline=Date.now()+90000;
 while(!await available()) {
  if(ownedServer.exitCode!==null||Date.now()>deadline) {ownedServer.kill();throw Error('Local browser fixture server failed readiness; see artifacts/proof/operational-cleanup/server.log');}
  await new Promise(resolve=>setTimeout(resolve,500));
 }
}
const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']} : {})});
let checks=0;
try {
 for(const width of [1440,390]) {
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.addInitScript(()=>{
   window.__cleanupNavigationReady=false;
   const add=window.addEventListener;
   window.addEventListener=function(type,...args){if(type==='milano:navigation-intent')window.__cleanupNavigationReady=true;return add.call(this,type,...args);};
  });
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  // Hold destination responses, including production prefetch, until feedback is observed.
  // This makes a genuine slow Link transition deterministic without arbitrary sleeps.
  let releasePricing;
  const pricingGate=new Promise(resolve=>{releasePricing=resolve;});
  await page.route('**/pricing?source=homepage*',async route=>{await pricingGate;return route.continue();});
  // Keep this browser verification read-only, including automatic analytics.
  await page.route('**/api/**',async route=>{
   if(route.request().method()!=='GET')return route.fulfill({status:200,contentType:'application/json',body:'{}'});
   return route.continue();
  });
  await page.goto(new URL('/',base).href,{waitUntil:'domcontentloaded'});
  await page.getByRole('link',{name:'Start Your Request',exact:true}).first().waitFor({state:'visible'});
  await page.waitForFunction(()=>window.__cleanupNavigationReady===true);
  assert.equal(await page.locator('.ritual-entry-lock-root').count(),0);checks++;
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);checks++;
  console.log(`PASS ${width}px homepage: immediate entry, no overflow, height=${await page.evaluate(()=>document.documentElement.scrollHeight)}`);
  // Exercise a genuine Next Link/RSC transition, not just the custom event.
  await page.getByRole('link',{name:'Get Pricing',exact:true}).first().click({noWaitAfter:true});
  await page.locator('[role="status"].pointer-events-none').waitFor({state:'visible'});
  assert.equal(await page.locator('[role="status"].pointer-events-none').evaluate(el=>getComputedStyle(el).pointerEvents),'none');
  releasePricing();
  await page.getByRole('heading',{name:'Know exactly what your Matter includes.',exact:true}).waitFor({state:'visible'});
  await page.locator('[role="status"].pointer-events-none').waitFor({state:'hidden'});checks++;
  console.log(`PASS ${width}px actual Next Link: delayed destination shows feedback and releases it`);
  if(width===390) {
   const toggle=page.getByRole('button',{name:'Open menu',exact:true});await toggle.click();
   const menu=page.getByRole('dialog',{name:'Navigation menu'});await menu.waitFor({state:'visible'});
   const close=menu.getByRole('button',{name:'Close menu',exact:true});await close.focus();await page.keyboard.press('Shift+Tab');
   assert.equal(await page.evaluate(()=>!!document.activeElement?.closest('#milano-mobile-navigation')),true);checks++;
   await page.keyboard.press('Tab');assert.equal(await close.evaluate(el=>el===document.activeElement),true);checks++;
   await menu.getByRole('button',{name:'Choose language'}).click();
   await menu.getByRole('option').last().focus();
   for(let i=0;i<20;i++) {await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>!!document.activeElement?.closest('#milano-mobile-navigation')),true);}
   checks++;await page.keyboard.press('Escape');await menu.waitFor({state:'hidden'});
   assert.equal(await toggle.evaluate(el=>el===document.activeElement),true);checks++;
   await toggle.click();await menu.waitFor({state:'visible'});await page.setViewportSize({width:1440,height:900});await menu.waitFor({state:'hidden'});assert.notEqual(await page.evaluate(()=>document.body.style.overflow),'hidden');checks++;
   await page.setViewportSize({width,height:900});console.log('PASS mobile menu: forward/backward focus, language list, Escape, desktop resize');
  }
  for(const anchor of ['compliance-review','payment-gate','execution','custody','release']) {
   await page.goto(new URL(`/process#${anchor}`,base).href,{waitUntil:'domcontentloaded'});
   const target=page.locator(`#${anchor}`);await target.waitFor({state:'visible'});await page.waitForFunction(id=>document.getElementById(id)?.getBoundingClientRect().top>=0&&document.getElementById(id)?.getBoundingClientRect().top<innerHeight,anchor);
   const headerBottom=await page.locator('header').first().evaluate(el=>el.getBoundingClientRect().bottom);
   assert.ok((await target.boundingBox()).y>=headerBottom-2,`${anchor} below fixed header`);checks++;
  }
  await page.goto(new URL('/partners/ron-notary-alliance/apply',base).href,{waitUntil:'domcontentloaded'});
  await page.getByLabel('Full legal name',{exact:false}).fill('Disposable browser fixture');checks++;
  const unlabeled=await page.locator('input:not([type="checkbox"]),textarea,select').evaluateAll(els=>els.filter(el=>!el.labels?.length&&!el.getAttribute('aria-label')).length);
  assert.equal(unlabeled,0);checks++;
  await page.route('**/api/notary/apply',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Controlled fixture outage'})}));
  await page.getByLabel('Email *',{exact:true}).fill('fixture@example.invalid');await page.getByLabel('Phone *',{exact:true}).fill('5555550100');await page.getByLabel('State commissioned *',{exact:true}).fill('Florida');await page.getByLabel('Commission number *',{exact:true}).fill('FIXTURE');await page.getByLabel('I understand that applying does not guarantee',{exact:false}).check();await page.getByRole('button',{name:'Submit for Credential Review'}).click();await page.getByRole('alert').filter({hasText:'Controlled fixture outage'}).waitFor();assert.equal(await page.getByLabel('Full legal name',{exact:false}).inputValue(),'Disposable browser fixture');checks++;
  await page.goto(new URL('/intake',base).href,{waitUntil:'domcontentloaded'});await page.getByRole('heading',{name:'Tell Us About Your Document',exact:true}).waitFor();assert.equal(await page.getByText('50% Deposit Unlocks Scheduling',{exact:true}).count(),0);checks++;
  for(const route of ['/privacy','/terms']) {await page.goto(new URL(route,base).href,{waitUntil:'domcontentloaded'});assert.equal(await page.getByText('Last updated:',{exact:false}).count(),0);checks++;}
  // Exercise the real navigation listeners without creating any server records.
  await page.evaluate(()=>{const a=document.createElement('a');a.href=location.href;a.id='cleanup-same-link';a.textContent='Same page';document.body.append(a);});await page.locator('#cleanup-same-link').click();await page.waitForTimeout(200);assert.equal(await page.getByRole('status').filter({has:page.locator('.sr-only')}).count(),0);checks++;
  await page.waitForFunction(()=>window.__cleanupNavigationReady===true);
  await page.evaluate(()=>window.dispatchEvent(new Event('milano:navigation-intent')));await page.waitForFunction(()=>!!document.querySelector('[role="status"].pointer-events-none'));assert.equal(await page.locator('[role="status"].pointer-events-none').evaluate(el=>getComputedStyle(el).pointerEvents),'none');checks++;
  await page.evaluate(()=>{history.pushState(null,'',location.pathname+'?cleanup=1');});await page.waitForFunction(()=>!document.querySelector('[role="status"].pointer-events-none'));checks++;
  assert.deepEqual(errors,[]);checks++;await context.close();console.log(`PASS ${width}px anchors, labels, controlled error, copy, legal dates, nonblocking navigation`);
 }
 console.log(`PASS ${checks} cleanup browser checks; isolated API failure fixture, no live submissions.`);
} finally {
 await browser.close();
 if(ownedServer){if(process.platform==='win32')ownedServer.kill();else try{process.kill(-ownedServer.pid,'SIGTERM');}catch{}}
}
