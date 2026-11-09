// Source-only safety checks for the two forward recovery migrations.
// This does NOT establish hosted database readiness or execute SQL.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const hash=readFileSync('supabase/migrations/20261109140000_identifier_hash_extension_compatibility.sql','utf8');
assert.match(hash,/create or replace function public\.ms_sha256_text\(p_value text\)/i);
assert.match(hash,/pg_catalog\.sha256\(/);
assert.match(hash,/set search_path = pg_catalog, pg_temp/);
assert.match(hash,/coalesce\(p_value, ''\)/);
assert.match(hash,/IDENTIFIER_SHA256_COMPATIBILITY_FAILED/);
assert.doesNotMatch(hash,/update\s+public\.identifier_locks/i);

const privilege=readFileSync('supabase/migrations/20261109150000_private_evidence_table_privileges.sql','utf8');
for(const name of ['custody_ledger','identifier_locks','matter_evidence_ledger','messages','notifications','ron_audit_events','ron_documents','ron_sessions','ron_signers','ron_webhook_events'])
  assert.ok(privilege.includes("'"+name+"'"),'Missing protected table '+name);
assert.match(privilege,/revoke truncate, references, trigger/i);
assert.match(privilege,/has_table_privilege/);
assert.doesNotMatch(privilege,/drop\s+table|delete\s+from|truncate\s+table/i);
console.log('PASS recovery compatibility source invariants (no hosted writes or certification claims)');
