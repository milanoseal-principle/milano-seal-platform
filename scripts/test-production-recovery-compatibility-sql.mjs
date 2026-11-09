// Actual isolated PostgreSQL execution test for the two reviewed forward
// recovery migrations. No hosted connection, credentials, or customer data.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {migrationFixture} from './lib/migration-fixture.mjs';

const db=await migrationFixture();
const privateTables=[
  'custody_ledger','identifier_locks','matter_evidence_ledger',
  'messages','notifications','ron_audit_events','ron_documents',
  'ron_sessions','ron_signers','ron_webhook_events'
];
let checks=0;
try {
  await db.exec(`create or replace function public.ms_sha256_text(p_value text)
    returns text language sql immutable as $$ select repeat('0',64)::text $$;
    revoke execute on function public.ms_sha256_text(text)
      from public,anon,authenticated;
    grant execute on function public.ms_sha256_text(text) to service_role;`);
  for(const table of privateTables) {
    await db.exec(`create table public."${table}"(id uuid primary key default gen_random_uuid());
      grant all on table public."${table}" to service_role;
      grant truncate,references,trigger on table public."${table}"
        to public,anon,authenticated;`);
  }
  for(const table of privateTables) {
    const pre=await db.query(
      'select has_table_privilege($1,$2,$3) as allowed',
      ['authenticated','public.'+table,'TRUNCATE']
    );
    assert.equal(pre.rows[0].allowed,true,'Precondition missing on '+table);
    checks++;
  }
  await db.exec(readFileSync(
    'supabase/migrations/20261109140000_identifier_hash_extension_compatibility.sql',
    'utf8'
  ));
  for(const value of ['', 'abc', 'Àlfa Ω', 'emoji 🦭', 'line one\nline two']) {
    const {rows}=await db.query('select public.ms_sha256_text($1) as hash',[value]);
    assert.equal(rows[0].hash,createHash('sha256').update(value,'utf8').digest('hex'));
    checks++;
  }
  const nil=await db.query('select public.ms_sha256_text(null) as hash');
  assert.equal(nil.rows[0].hash,createHash('sha256').update('').digest('hex'));
  checks++;
  for(const role of ['anon','authenticated']) {
    const q=await db.query(
      "select has_function_privilege($1,'public.ms_sha256_text(text)','EXECUTE') as allowed",
      [role]
    );
    assert.equal(q.rows[0].allowed,false,'Hash function privilege expanded for '+role);
    checks++;
  }
  await db.exec(readFileSync(
    'supabase/migrations/20261109150000_private_evidence_table_privileges.sql',
    'utf8'
  ));
  for(const table of privateTables) {
    for(const role of ['anon','authenticated']) {
      for(const privilege of ['TRUNCATE','REFERENCES','TRIGGER']) {
        const {rows}=await db.query(
          'select has_table_privilege($1,$2,$3) as allowed',
          [role,'public.'+table,privilege]
        );
        assert.equal(rows[0].allowed,false,role+' '+table+' '+privilege);
        checks++;
      }
    }
    const {rows}=await db.query(
      'select has_table_privilege($1,$2,$3) as allowed',
      ['service_role','public.'+table,'TRUNCATE']
    );
    assert.equal(rows[0].allowed,true,'Service-role privileges changed: '+table);
    checks++;
  }
  console.log('PASS isolated recovery SQL compatibility: '+checks+' assertions; no hosted writes');
} finally {
  await db.close();
}
