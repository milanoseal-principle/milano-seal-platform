import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import type { User } from '@supabase/supabase-js';
import { requireExecutionToolAccess } from '@/lib/auth/executionToolAccess';
import { resolveServerRole } from '@/lib/auth/server-role';

const session: User = {id:'fixture-user',email:'operator@example.invalid',app_metadata:{role:'founder_admin'},user_metadata:{},aud:'authenticated',created_at:'2026-01-01T00:00:00Z'};
const access = (role:string,signedIn=true) => requireExecutionToolAccess({getUser:async()=>signedIn?session:null,resolveRole:async()=>role});

test('execution tools preserve the two intended roles and deny every broader operator alias',async()=>{
 for(const role of ['founder_admin','admin_operator']) assert.equal((await access(role)).ok,true,role);
 for(const role of ['founder','admin','owner','operator','ops_manager','finance','client','alliance','alliance_partner','va','professional','','unknown']) {
  const result=await access(role);assert.equal(result.ok,false,role);if(!result.ok)assert.equal(result.response.status,403);
 }
 const missing=await access('founder_admin',false);assert.equal(missing.ok,false);if(!missing.ok)assert.equal(missing.response.status,401);
});

test('revoked, disabled, banned and unavailable authoritative identities cannot use stale tool claims',async()=>{
 const identities=[null,{...session,app_metadata:{role:'client'}},{...session,app_metadata:{role:'founder_admin',disabled:true}},{...session,banned_until:'2999-01-01T00:00:00Z'}];
 for(const fresh of identities){
  const result=await requireExecutionToolAccess({getUser:async()=>session,resolveRole:(user)=>resolveServerRole(user,async()=>({data:{user:fresh as User|null},error:null}))});assert.equal(result.ok,false);
 }
 const failed=await requireExecutionToolAccess({getUser:async()=>session,resolveRole:(user)=>resolveServerRole(user,async()=>{throw Error('fixture outage')})});assert.equal(failed.ok,false);
});

test('all seven tool handlers enter the shared narrow guard before doing tool work',()=>{
 for(const tool of ['courier','embassy','hague','legalization','ron','signer','translation']){
  const source=fs.readFileSync(`app/api/tools/${tool}/route.ts`,'utf8');assert.match(source,/requireExecutionToolAccess\(\)/);assert.match(source,/if \(!access.ok\) return access.response/);assert.doesNotMatch(source,/\.from\("profiles"\)|user\.app_metadata|createAdminClient/);
 }
});

test('certification and Matter Room retain identity-scoped reads after authoritative role checks',()=>{
 const certification=fs.readFileSync('app/alliance/certification/page.tsx','utf8');assert.match(certification,/resolveServerRole\(user\)/);assert.match(certification,/normalizeUserRole\(role\) !== "alliance"/);assert.match(certification,/\.eq\("partner_id", user.id\)/);assert.match(certification,/if \(certificationError\)/);
 const matter=fs.readFileSync('app/portal/matter-room/page.tsx','utf8');assert.match(matter,/resolveServerRole\(user\)/);assert.match(matter,/normalizeUserRole\(role\) !== "client"/);assert.match(matter,/user.email_confirmed_at/);assert.match(matter,/\.eq\("id", matter_id\)/);assert.match(matter,/\.eq\("email", email\)/);assert.match(matter,/emailsMatch\(candidate.email, email\)/);
 for(const source of [certification,matter])assert.doesNotMatch(source,/\.from\("profiles"\)/);
});
