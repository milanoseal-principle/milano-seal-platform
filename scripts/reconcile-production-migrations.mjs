#!/usr/bin/env node
// B01 — read-only production migration reconciliation.
//
// Answers, for each target migration, whether its ACTUAL EFFECTS are present in the hosted
// database: never inferred from the filename or the migration-history table alone.
//
// Input is the metadata-only export produced by supabase/verification/p12_hosted_snapshot.sql
// (object names and definition hashes; no customer rows, credentials or function bodies). This
// script opens no database connection and cannot modify anything.
//
// Method: replay the repository migrations into an isolated in-memory database, capture the
// certification catalog before and after each target migration, and treat the difference as that
// migration's postconditions. Each postcondition is then looked up in the hosted catalog.
//
//   P12_HOSTED_METADATA=/path/to/export.json node scripts/reconcile-production-migrations.mjs [--strict]
//
// Exit codes: 0 report written; 1 --strict and something is not APPLIED; 2 the snapshot is missing
// or invalid (fail closed: an unreadable production state is never reported as PASS).
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { isolatedCanonicalDatabase } from './certification/shared.mjs';

export const DEFAULT_TARGETS = [
  '20261112090000_revoke_unrestricted_public_rls_policies.sql',
  '20261112100000_files_upload_compatibility_columns.sql',
  '20261112110000_restore_application_column_contract.sql',
  '20261112120000_va_task_ledger.sql',
  '20261112130000_alliance_operator_identity.sql',
  '20261112140000_operator_profile_binding.sql',
  '20261113090000_receiving_authority_requirements.sql',
  '20261113120000_institutional_transition_integrity.sql',
  '20261113150000_rejected_referral_not_convertible.sql',
];

// Definition hashes are produced by PostgreSQL's deparser and can differ between server versions
// for identical objects, so a hash-only difference is reported for review, never as "missing".
const HASH_FIELDS = new Set(['definition_hash', 'using_hash', 'check_hash', 'default_hash']);
const CATALOG_SQL = () => readFileSync('supabase/verification/certification_catalog.sql', 'utf8');
const index = (catalog) => new Map(Object.entries(catalog).flatMap(([category, entries]) => entries.map((entry) => [`${category}:${entry.key}`, entry])));

function compare(expected, actual) {
  const structural = [], hashes = [];
  for (const [field, value] of Object.entries(expected)) {
    if (field === 'key' || JSON.stringify(value) === JSON.stringify(actual[field])) continue;
    (HASH_FIELDS.has(field) ? hashes : structural).push(field);
  }
  return structural.length ? { state: 'DRIFTED', fields: structural.concat(hashes) } : hashes.length ? { state: 'PRESENT_DEFINITION_DIFFERS', fields: hashes } : { state: 'INSTALLED', fields: [] };
}

export function unwrapSnapshot(raw) {
  const hosted = raw?.p12_hosted_metadata ?? (Array.isArray(raw) ? raw[0]?.p12_hosted_metadata : null) ?? raw;
  if (!hosted || typeof hosted.catalog !== 'object' || !Array.isArray(hosted.migrations) || !hosted.observed_at
    || !['READ_ONLY_METADATA_HASHES_ONLY', 'READ_ONLY_LIVE_P12_CATALOG'].includes(hosted.inspection)) throw Error('HOSTED_SNAPSHOT_FORMAT_INVALID');
  return hosted;
}

// Statements whose effect is invisible on a clean replay because they repair objects that only
// the hosted database has (a column the repository schema already defines, a policy that exists
// only in production). They are read from the migration text itself: presence/absence only.
const TABLE_PRIVILEGES = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'];

export function declaredPostconditions(sql) {
  const text = sql.replace(/--.*$/gm, '');
  const name = (raw) => raw.trim().replace(/^public\./, '').replace(/"/g, '');
  const list = (raw) => raw.split(',').map(name).filter(Boolean);
  const role = (raw) => (name(raw).toLowerCase() === 'public' ? 'PUBLIC' : name(raw));
  const required = [
    ...[...text.matchAll(/alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?([\w."]+)\s+add\s+column\s+(?:if\s+not\s+exists\s+)?("?[\w]+"?)/gi)].map((m) => `columns:public.${name(m[1])}.${name(m[2])}`),
    ...[...text.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?([\w."]+)/gi)].map((m) => `tables:public.${name(m[1])}`),
    // Row level security is carried on the table entry (rls: true).
    ...[...text.matchAll(/alter\s+table\s+([\w."]+)\s+enable\s+row\s+level\s+security/gi)].map((m) => `tables:public.${name(m[1])}`),
    ...[...text.matchAll(/create\s+policy\s+("[^"]+"|[\w]+)\s+on\s+([\w."]+)/gi)].map((m) => `policies:public.${name(m[2])}.${name(m[1])}`),
  ];
  const removed = [...text.matchAll(/drop\s+policy\s+(?:if\s+exists\s+)?("[^"]+"|[\w]+)\s+on\s+([\w."]+)/gi)].map((m) => `policies:public.${name(m[2])}.${name(m[1])}`);
  // Privileges a migration revokes must be absent afterwards, unless it grants them back (the
  // caller drops any that exist after the replay).
  const revokedFunctions = [];
  for (const m of text.matchAll(/revoke\s+([\w\s,]+?)\s+on\s+(function\s+)?([^;]+?)\s+from\s+([^;]+);/gi)) {
    const privileges = /\ball\b/i.test(m[1]) ? null : m[1].split(',').map((x) => x.trim().toUpperCase());
    const roles = m[4].split(',').map(role);
    if (m[2]) {
      for (const fn of m[3].split(/\)\s*,/)) for (const r of roles) revokedFunctions.push({ function: name(fn.split('(')[0]), role: r });
    } else {
      for (const table of list(m[3].replace(/^table\s+/i, ''))) for (const r of roles) for (const privilege of privileges ?? TABLE_PRIVILEGES) removed.push(`table_grants:public.${table}.${r}.${privilege}`);
    }
  }
  return { required: [...new Set(required)], removed: [...new Set(removed)], revokedFunctions };
}

// What must match for an object the replay left unchanged: enough to catch a wrong type, disabled
// row level security or a different policy, without flagging nullability or defaults that the
// hosted schema may legitimately carry.
function declaredExpectation(id, entry) {
  if (id.startsWith('columns:')) return { key: entry.key, type: entry.type };
  return entry;
}

// Postconditions of each target: what the migration adds/changes (must be present) and what it
// removes (must be absent), measured on a clean replay of the repository migrations.
export async function migrationPostconditions(targets = DEFAULT_TARGETS) {
  const files = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort();
  for (const target of targets) if (!files.includes(target)) throw Error(`TARGET_MIGRATION_NOT_IN_REPOSITORY: ${target}`);
  const ordered = files.filter((f) => targets.includes(f));
  const db = await isolatedCanonicalDatabase(files.filter((f) => f < ordered[0]));
  try {
    const snapshot = async () => index((await db.query(CATALOG_SQL())).rows[0].catalog);
    const result = [];
    let before = await snapshot();
    for (const file of ordered) {
      for (const skipped of files.filter((f) => f > (result.at(-1)?.file ?? '') && f < file && !targets.includes(f) && f >= ordered[0])) {
        await db.exec(readFileSync(`supabase/migrations/${skipped}`, 'utf8'));
        before = await snapshot();
      }
      await db.exec(readFileSync(`supabase/migrations/${file}`, 'utf8'));
      const after = await snapshot();
      const sql = readFileSync(`supabase/migrations/${file}`, 'utf8');
      const declared = declaredPostconditions(sql);
      const required = [...after].filter(([id, entry]) => JSON.stringify(before.get(id)) !== JSON.stringify(entry)).map(([id, entry]) => ({ id, entry }));
      // A declared object that the replay did not change is checked for presence only; one the
      // migration later drops again (absent after replay) is not a postcondition.
      for (const id of declared.required) if (after.has(id) && !required.some((r) => r.id === id)) required.push({ id, entry: declaredExpectation(id, after.get(id)) });
      const functionRevokes = declared.revokedFunctions.flatMap(({ function: fn, role }) =>
        [...after.keys()].filter((id) => id.startsWith(`functions:public.${fn}(`)).map((id) => `function_grants:${id.slice('functions:'.length)}.${role}.EXECUTE`));
      const removed = [...new Set([...[...before.keys()].filter((id) => !after.has(id)), ...[...declared.removed, ...functionRevokes].filter((id) => !after.has(id))])];
      result.push({ file, required, removed });
      before = after;
    }
    return result;
  } finally {
    await db.close();
  }
}

export function reconcile(hostedSnapshot, postconditions) {
  const hosted = unwrapSnapshot(hostedSnapshot);
  const live = index(hosted.catalog);
  const migrations = postconditions.map(({ file, required, removed }) => {
    const version = file.split('_')[0], name = file.replace(/^\d+_/, '').replace(/\.sql$/, '');
    const checks = [
      ...required.map(({ id, entry }) => {
        const actual = live.get(id);
        return actual ? { object: id, expectation: 'present', ...compare(entry, actual) } : { object: id, expectation: 'present', state: 'MISSING', fields: [] };
      }),
      ...removed.map((id) => ({ object: id, expectation: 'absent', state: live.has(id) ? 'STILL_PRESENT' : 'INSTALLED', fields: [] })),
    ];
    const count = (state) => checks.filter((c) => c.state === state).length;
    const pending = count('MISSING') + count('STILL_PRESENT');
    // A privilege that is absent only because its table does not exist yet is not progress: when a
    // migration creates objects, only created objects decide between MISSING and PARTIAL.
    const creates = checks.filter((c) => c.expectation === 'present');
    const done = (creates.length ? creates : checks).filter((c) => c.state === 'INSTALLED' || c.state === 'PRESENT_DEFINITION_DIFFERS').length;
    // Fail closed: a replaced function or default whose hash differs may be the old definition, so
    // it needs a human look before the migration counts as applied.
    const status = checks.length === 0 ? 'NO_OBSERVABLE_POSTCONDITIONS' : count('DRIFTED') ? 'DRIFTED' : pending > 0 ? (done === 0 ? 'MISSING' : 'PARTIAL') : count('PRESENT_DEFINITION_DIFFERS') ? 'REVIEW' : 'APPLIED';
    return {
      file, status,
      recorded_in_migration_history: hosted.migrations.some((m) => m.version === version || String(m.name ?? '').includes(name)),
      postconditions: checks.length, installed: count('INSTALLED'), definition_differs: count('PRESENT_DEFINITION_DIFFERS'),
      missing: count('MISSING'), still_present: count('STILL_PRESENT'), drifted: count('DRIFTED'),
      outstanding: checks.filter((c) => c.state !== 'INSTALLED'),
    };
  });
  return {
    report: 'B01_PRODUCTION_MIGRATION_RECONCILIATION', mode: 'READ_ONLY_SNAPSHOT_COMPARISON',
    project_ref: hosted.project_ref ?? null, snapshot_observed_at: hosted.observed_at,
    status: migrations.every((m) => m.status === 'APPLIED') ? 'PASS' : 'FAIL',
    migrations,
    not_covered: ['Row-level facts (e.g. duplicate operators.user_id / profile_id bindings): run supabase/verification/b01_operator_binding_audit.sql', 'Backup and restore readiness (B02)'],
  };
}

async function main() {
  const strict = process.argv.includes('--strict');
  let hosted;
  try {
    if (!process.env.P12_HOSTED_METADATA) throw Error('P12_HOSTED_METADATA is required: export supabase/verification/p12_hosted_snapshot.sql from the production database (read-only) and pass the file path.');
    hosted = JSON.parse(readFileSync(process.env.P12_HOSTED_METADATA, 'utf8'));
    unwrapSnapshot(hosted);
  } catch (error) {
    console.error(`FAIL (production state not readable): ${error.message}`);
    process.exit(2);
  }
  const report = reconcile(hosted, await migrationPostconditions());
  mkdirSync('artifacts/certification', { recursive: true });
  writeFileSync('artifacts/certification/b01-migration-reconciliation.json', JSON.stringify(report, null, 2) + '\n');
  console.log(`B01 production migration reconciliation — snapshot observed ${report.snapshot_observed_at} (project ${report.project_ref})`);
  for (const m of report.migrations) {
    console.log(`  ${m.status.padEnd(8)} ${m.file}\n           effects ${m.installed + m.definition_differs}/${m.postconditions} present, ${m.missing} missing, ${m.still_present} not yet removed, ${m.drifted} drifted, ${m.definition_differs} definition hash differs; history row: ${m.recorded_in_migration_history ? 'yes' : 'no'}`);
  }
  console.log(`RESULT: ${report.status} — details: artifacts/certification/b01-migration-reconciliation.json`);
  if (strict && report.status !== 'PASS') process.exit(1);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(`FAIL: ${error.message}`);
    process.exit(2);
  });
}
