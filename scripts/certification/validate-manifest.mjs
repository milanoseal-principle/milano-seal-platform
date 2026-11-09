import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const manifest=JSON.parse(readFileSync('artifacts/certification/source-manifest.json'));
assert.equal(manifest.source_sha,execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim());
assert.equal(manifest.migration_head,readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort().at(-1));
assert.equal(manifest.live_certification_completed,false);assert.equal(manifest.live_certification,false);assert.equal(manifest.production_schema_aligned,false);
assert.equal(manifest.source_tree,execFileSync('git',['rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim());
assert.equal(manifest.repo_migration_count,readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).length);
assert.ok(manifest.hosted_migration_count>0);assert.ok(Number.isFinite(Date.parse(manifest.hosted_observed_at)));
assert.equal(manifest.status,'P19_P23_SOURCE_SIMULATION_PASS');assert.ok(manifest.blockers.length);assert.ok(Number.isFinite(Date.parse(manifest.generated_at)));assert.match(manifest.hosted_ci_status,/OBSERVED/);
for(let phase=7;phase<=23;phase++)assert.equal(typeof manifest['p'+phase+'_status'],'string');
for(const phase of ['p19','p20','p21','p22','p23']){assert.equal(manifest[phase+'_status'],'SIMULATION_PASS');const descriptor=manifest[phase+'_simulation'];const evidence=JSON.parse(readFileSync(descriptor.evidence_path));assert.equal(evidence.source_sha,manifest.source_sha);assert.equal(evidence.source_tree,manifest.source_tree);assert.equal(evidence.migration_head,manifest.migration_head);assert.equal(evidence.status,'PASS');assert.equal(evidence.live_certification,false);assert.equal(evidence.failures.length,0);assert.equal(descriptor.checks,evidence.checks.length);assert.ok(evidence.checks.every(c=>c.status==='PASS'));}
assert.equal(manifest.p12_status,'HOSTED_SCHEMA_RECONCILIATION_REQUIRED');
if(manifest.local_validation){assert.equal(manifest.local_validation.source_sha,manifest.source_sha);assert.equal(manifest.local_validation.all_steps_passed,true);}
console.log('PASS source certification manifest: exact SHA/migrations/evidence; all five isolated phases passed; hosted and live unverified.');
