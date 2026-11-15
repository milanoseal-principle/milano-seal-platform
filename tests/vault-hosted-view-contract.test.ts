import test from 'node:test';
import assert from 'node:assert/strict';
import { getVaultDocumentsForMatter, generateVaultSignedUrl } from '@/lib/vault';

function fixture(options: { foreign?: boolean; pathError?: boolean } = {}) {
  const reads: {table: string; fields: string; filters: Record<string, unknown>}[] = [];
  const signs: string[] = [];
  const admin = {
    from(table: string) {
      const read = {table, fields: '', filters: {} as Record<string, unknown>}; reads.push(read);
      const q = {
        select(fields: string) {read.fields=fields; return q;},
        eq(key: string,value: unknown) {read.filters[key]=value; return q;},
        gt() {return q;}, in() {return q;}, order() {return q;}, limit() {return q;},
        result() {
          if(table==='deals')return {data:{id:'matter-a',email:options.foreign?'other@example.invalid':'owner@example.invalid'},error:null};
          if(table==='client_safe_documents_view') {
            if(read.fields.split(',').map(x=>x.trim()).includes('storage_path'))return {data:null,error:{code:'42703'}};
            if(read.filters.document_id)return {data:{document_id:'doc-a',matter_id:'matter-a',document_label:'Private document'},error:null};
            return {data:reads.filter(r=>r.table===table).length===1?[{document_id:'doc-a',matter_id:'matter-a',document_label:'Private document',uploaded_at:'2026-11-15',verification_status:'pending'}]:[],error:null};
          }
          if(table==='files')return {data:options.pathError?null:{storage_path:'private/secret.pdf'},error:options.pathError?{code:'unavailable'}:null};
          return {data:[],error:null};
        },
        maybeSingle() {return Promise.resolve(q.result());},
        then(resolve: (value: unknown)=>unknown) {return Promise.resolve(q.result()).then(resolve);},
      };return q;
    },
    storage:{from(bucket: string){assert.equal(bucket,'documents');return {async createSignedUrl(path: string){signs.push(path);return {data:{signedUrl:'https://signed.example.invalid/document'},error:null};}};}},
  };
  return {reads,signs,dependencies:{admin:()=>admin,audit:async()=>{}} as never};
}

test('hosted safe-view projection omits paths; owned paths resolve server-side with Matter scope',async()=>{
  const f=fixture();const rows=await getVaultDocumentsForMatter('matter-a','owner@example.invalid',f.dependencies);
  assert.equal(rows.length,1);assert.equal(rows[0].signed_url,'https://signed.example.invalid/document');
  assert.ok(!JSON.stringify(rows).includes('private/secret.pdf'));
  assert.deepEqual(f.reads.find(r=>r.table==='files')?.filters,{id:'doc-a',deal_id:'matter-a'});
  assert.deepEqual(f.signs,['private/secret.pdf']);
});
test('cross-client ownership fails before reading paths or generating signatures',async()=>{
  const f=fixture({foreign:true});await assert.rejects(getVaultDocumentsForMatter('matter-a','owner@example.invalid',f.dependencies),/VAULT_MATTER_NOT_AUTHORIZED/);
  assert.equal(f.reads.some(r=>r.table==='files'),false);assert.equal(f.signs.length,0);
});
test('path lookup failure is not misreported as an empty successful vault',async()=>{
  const f=fixture({pathError:true});await assert.rejects(getVaultDocumentsForMatter('matter-a','owner@example.invalid',f.dependencies),/VAULT_READ_UNAVAILABLE/);assert.equal(f.signs.length,0);
});
test('single-document signing uses the same hosted view and verified owner/Matter scope',async()=>{
  const f=fixture();const result=await generateVaultSignedUrl('doc-a','matter-a','owner@example.invalid',f.dependencies);
  assert.ok('url'in result);assert.deepEqual(f.reads.find(r=>r.table==='files')?.filters,{id:'doc-a',deal_id:'matter-a'});
  const foreign=fixture({foreign:true});assert.equal((await generateVaultSignedUrl('doc-a','matter-a','owner@example.invalid',foreign.dependencies) as {status:number}).status,403);assert.equal(foreign.signs.length,0);
});
