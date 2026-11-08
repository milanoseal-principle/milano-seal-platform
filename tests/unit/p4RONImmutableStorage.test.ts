import test from 'node:test';
import assert from 'node:assert/strict';
import type { SupabaseClient } from '@supabase/supabase-js';
import { storeImmutableRONPDF, storeRONExecutedDocuments } from '@/lib/bluenotary/signedDocumentStorage';

const bytes=Buffer.from('%PDF-1.7\ncontrolled fixture');
function storage(uploadFails=false, existing:Buffer|null=null) {
  let uploads=0;
  const client={storage:{from:(bucket:string)=>{
    assert.equal(bucket,'documents');
    return {
      upload:async(_path:string,body:Buffer,options:{upsert:boolean;contentType:string})=>{
        uploads++;assert.equal(options.upsert,false);assert.equal(options.contentType,'application/pdf');assert.deepEqual(body,bytes);
        return {error:uploadFails?{message:'Storage response uncertain'}:null};
      },
      download:async()=>({error:existing?null:{message:'Unavailable'},data:existing?new Blob([new Uint8Array(existing)]):null}),
    };
  }}} as unknown as SupabaseClient;
  return {client,uploads:()=>uploads};
}
test('immutable PDF upload validates bytes before writing',async()=>{
  const fixture=storage();await assert.rejects(storeImmutableRONPDF(fixture.client,'fixture',Buffer.from('not PDF')));assert.equal(fixture.uploads(),0);
});
test('successful immutable upload returns the exact content hash',async()=>{
  const fixture=storage();const hash=await storeImmutableRONPDF(fixture.client,'fixture',bytes);assert.match(hash,/^[a-f0-9]{64}$/);assert.equal(fixture.uploads(),1);
});
test('uncertain storage upload reuses only byte-identical existing objects',async()=>{
  const matching=storage(true,bytes);await storeImmutableRONPDF(matching.client,'fixture',bytes);
  for(const existing of [null,Buffer.from('%PDF-1.7\ndifferent executed bytes')]) await assert.rejects(storeImmutableRONPDF(storage(true,existing).client,'fixture',bytes));
});
test('failed executed document ingestion clears transient provider bytes',async()=>{
  const document={document_name:'fixture.pdf',base64_content:Buffer.from('not PDF').toString('base64')};
  await assert.rejects(storeRONExecutedDocuments(storage().client,{id:'fixture-session',matter_id:'fixture-matter'},[document]));assert.equal(document.base64_content,'');
});
