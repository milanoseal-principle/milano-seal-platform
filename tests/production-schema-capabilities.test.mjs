import test from 'node:test';
import assert from 'node:assert/strict';
import {REQUIRED_SCHEMA,REQUIRED_RPCS,verifyProductionSchemaCapabilities} from '../scripts/verify-production-schema-capabilities.mjs';
const config={VERCEL_ENV:'production',NEXT_PUBLIC_SUPABASE_URL:'https://synthetic-project.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'isolated-not-a-credential'};
function spec(){return {definitions:Object.fromEntries(Object.entries(REQUIRED_SCHEMA).map(([table,columns])=>[table,{properties:Object.fromEntries(columns.map(name=>[name,{}]))}])),paths:Object.fromEntries([...Object.keys(REQUIRED_SCHEMA).map(table=>['/'+table,{}]),...REQUIRED_RPCS.map(name=>['/rpc/'+name,{}])])};}
test('nonproduction builds neither access credentials nor query a provider',async()=>{
 const result=await verifyProductionSchemaCapabilities({},()=>{throw Error('MUST_NOT_RUN')});assert.equal(result.status,'NOT_RUN_NON_PRODUCTION_BUILD');
});
test('production fails closed on missing bindings, metadata, tables, columns and RPCs',async()=>{
 await assert.rejects(()=>verifyProductionSchemaCapabilities({VERCEL_ENV:'production'}),/BINDINGS_REQUIRED/);
 await assert.rejects(()=>verifyProductionSchemaCapabilities(config,async()=>({ok:false})),/UNAVAILABLE/);
 for(const omit of [value=>delete value.definitions.deals.properties.payment_attempt_id,value=>delete value.paths['/retention_records'],value=>delete value.paths['/rpc/begin_wise_payment_attempt']]){
  const value=spec();omit(value);await assert.rejects(()=>verifyProductionSchemaCapabilities(config,async()=>({ok:true,json:async()=>value})),/CAPABILITIES_MISSING/);
 }
});
test('compatible metadata makes one bounded read-only request and never claims live certification',async()=>{
 const calls=[];const result=await verifyProductionSchemaCapabilities(config,async(url,options)=>{calls.push({url:String(url),options});return {ok:true,json:async()=>spec()};});
 assert.equal(calls.length,1);assert.equal(calls[0].url,'https://synthetic-project.supabase.co/rest/v1/');assert.equal(calls[0].options.method,'GET');assert.equal(calls[0].options.redirect,'error');assert.equal('body' in calls[0].options,false);assert.equal(result.status,'CAPABILITIES_PRESENT_NOT_LIVE_CERTIFICATION');
});
test('credentials are not sent to an unexpected scheme, host or embedded credential URL',async()=>{
 for(const url of ['http://project.supabase.co','https://example.invalid','https://user:password@project.supabase.co','https://project.supabase.co/other'])await assert.rejects(()=>verifyProductionSchemaCapabilities({...config,NEXT_PUBLIC_SUPABASE_URL:url},()=>{throw Error('MUST_NOT_RUN')}),/TARGET_INVALID/);
});
