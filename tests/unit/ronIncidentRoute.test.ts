import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import * as incidentRules from '../../lib/bluenotary/securityIncidents';
const require = createRequire(import.meta.url);
const userId='00000000-0000-4000-8000-000000000001';
const body = {
 id:'00000000-0000-4000-8000-000000000002',session_id:'00000000-0000-4000-8000-000000000003',
 detected_at:'2026-01-01T12:00:00Z',summary:'Controlled incident route fixture',status:'OPEN',
 evidence:{category:'JOURNAL',containment:'OPEN',responsible_operator:userId,authority_basis_reference:'fixture:authority-review',required_authorities:['LAW_ENFORCEMENT'],notifications:{}},
};
function fixture(role='admin_operator',loggedIn=true,rpcError: unknown=null) {
 const calls: {name:string; args:unknown[]}[]=[];
 const admin = {
  rpc: async (...args:unknown[])=>{calls.push({name:'rpc',args});return {data:rpcError?null:body.id,error:rpcError};},
  from: (...args:unknown[])=>{calls.push({name:'from',args});return query;},
 };
 const query = Object.fromEntries(['select','not','order','limit'].map(name=>[name,(...args:unknown[])=>{
   calls.push({name,args});return name==='limit'?Promise.resolve({data:[],error:null}):query;
 }]));
 const imports: Record<string,unknown> = {
  '@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:loggedIn?{id:userId}:null}})}})},
  '@/lib/supabase/admin':{createAdminClient:()=>admin},
  '@/lib/auth/server-role':{resolveServerRole:async()=>role},
  '@/lib/bluenotary/securityIncidents':incidentRules,
 };
 const source=ts.transpileModule(readFileSync('app/api/dashboard/ron/security-incidents/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{} as {POST:(request:Request)=>Promise<Response>;GET:()=>Promise<Response>}};
 new Function('require','module','exports',source)((name:string)=>imports[name]??require(name),module,module.exports);
 return {route:module.exports,calls};
}
const request=(value:unknown)=>new Request('https://example.invalid/api/dashboard/ron/security-incidents',{method:'POST',body:JSON.stringify(value)});
test('unauthenticated, client and revoked roles cannot read or mutate incident evidence',async()=>{
 for(const [role,logged] of [['client',true],['',true],['admin_operator',false]] as const){
  const f=fixture(role,logged);assert.equal((await f.route.GET()).status,403);assert.equal((await f.route.POST(request(body))).status,403);assert.deepEqual(f.calls,[]);
 }
});
test('invalid fields and forged actor authority are rejected before privileged RPC',async()=>{
 for(const value of [{...body,actor_id:'forged'},{...body,detected_at:'2999-01-01T12:00:00Z'},{...body,evidence:{...body.evidence,notifications:{LAW_ENFORCEMENT:{sent:true}}}}]) {
  const f=fixture();assert.equal((await f.route.POST(request(value))).status,400);assert.deepEqual(f.calls,[]);
 }
 const f=fixture();assert.equal((await f.route.POST(new Request('https://example.invalid',{method:'POST',body:'bad json'}))).status,400);
});
test('API records authenticated actor, returns actual RPC outcome, and handles rejected writes without success',async()=>{
 const f=fixture();const response=await f.route.POST(request(body));assert.equal(response.status,200);
 const payload=f.calls[0].args[1] as Record<string,unknown>;
 assert.equal(payload.p_actor,userId);assert.equal(payload.p_incident,body.id);assert.deepEqual(payload.p_evidence,body.evidence);
 assert.equal((await response.json()).id,body.id);
 const denied=fixture('admin_operator',true,{code:'42501',message:'private database detail'});
 const rejected=await denied.route.POST(request(body));assert.equal(rejected.status,403);assert.doesNotMatch(await rejected.text(),/private database detail/);
});
test('active incident queue is bounded and orders oldest detection deadlines first',async()=>{
 const f=fixture();assert.equal((await f.route.GET()).status,200);
 assert.ok(f.calls.some(c=>c.name==='limit'&&c.args[0]===101));
 assert.ok(f.calls.some(c=>c.name==='not'&&c.args[0]==='status'&&c.args[2]==='(CLOSED,RESOLVED)'));
 assert.ok(f.calls.some(c=>c.name==='order'&&c.args[0]==='discovered_at'&&(c.args[1] as {ascending:boolean}).ascending));
});
