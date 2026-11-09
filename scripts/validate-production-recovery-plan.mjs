import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const plan=JSON.parse(readFileSync('supabase/migration-replay-plan.json')).hosted_recovery;
assert.equal(plan.project_ref,'ehqdzfopsrbwewtddiwq');assert.equal(plan.observed_migration_count,47);assert.equal(plan.observed_last_migration,'20261108002559');
assert.equal(plan.requires_explicit_user_write_authorization,true);assert.match(plan.baseline_metadata_sha256,/^[a-f0-9]{64}$/);
assert.ok(['BACKUP_UNVERIFIED','VERIFIED_EXTERNALLY'].includes(plan.backup_status));
assert.equal(new Set(plan.dependency_order).size,plan.dependency_order.length);
assert.ok(plan.dependency_order.length<readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).length,'Never blindly replay the whole repository against hosted production');
for(const file of plan.dependency_order){assert.match(file,/^[a-z0-9_]+\.sql$/);assert.equal(createHash('sha256').update(readFileSync('supabase/migrations/'+file)).digest('hex'),plan.file_sha256[file],file+' requires a new release-plan review');}
assert.ok(plan.dependency_order.indexOf('054_notification_delivery_audit.sql')<plan.dependency_order.indexOf('20261108130000_p16_notification_truth.sql'));
assert.ok(plan.dependency_order.indexOf('20261109150000_private_evidence_table_privileges.sql')>plan.dependency_order.indexOf('20261108140000_p11_ron_column_isolation.sql'));
assert.ok(!plan.dependency_order.includes('20261108180000_operator_authority_prerequisite.sql'));
assert.deepEqual(plan.preserve_hosted_authority_helpers,['is_admin()','is_operator()']);
console.log('PASS reviewed recovery plan fingerprints and dependency order; backup/release approval are separate production gates.');
