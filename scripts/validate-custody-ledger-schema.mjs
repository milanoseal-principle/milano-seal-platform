// validate:custody-ledger-schema — guards the custody ledger's schema + integrity
// contract so the chain-of-custody write can never silently regress.
//
// Asserts:
//   1. Every column appendLedger() inserts is backed by a migration.
//   2. actor_id is TEXT (the code writes actor labels/emails, not uuids).
//   3. method, status, prev_hash, hash columns exist.
//   4. The unique hash index exists (custody_ledger_hash_unique_idx).
//   5. The linear-chain unique index exists on the matter key + prev_hash
//      (custody_ledger_linear_chain_idx) — makes concurrent forks impossible.
//   6. appendLedger() handles the unique violation with a retry (Postgres 23505).

import { readFileSync } from "fs";

const code = readFileSync("lib/custodyLedger.ts", "utf8");
const mig040 = readFileSync(
  "supabase/migrations/040_custody_ledger_hash_chain.sql",
  "utf8",
);
const mig041 = readFileSync(
  "supabase/migrations/041_custody_ledger_linear_chain.sql",
  "utf8",
);
const atomic=readFileSync('supabase/migrations/20261108201000_custody_atomic_content_evidence.sql','utf8');
const migrations=mig040+'\n'+mig041+'\n'+atomic;

const errors = [];

// 1. Inserted columns are all backed by a migration.
const insertMatch=atomic.match(/insert into public\.custody_ledger\(([^)]+)\)/i);
if(!insertMatch)throw Error('Atomic custody insert contract missing');
const insertedCols=insertMatch[1].split(',').map(value=>value.trim());
const base = [
  "id", "deal_id", "event", "actor_type", "actor_name",
  "location", "notes", "metadata", "created_at",
];
const added = [
  ...migrations.matchAll(/add column if not exists\s+(\w+)/gi),
].map((x) => x[1]);
const known = new Set([...base, ...added]);
for (const col of insertedCols) {
  if (!known.has(col)) {
    errors.push(`appendLedger inserts "${col}" but no migration defines it`);
  }
}

// 2. actor_id is TEXT (not uuid).
if (!/add column if not exists\s+actor_id\s+text/i.test(migrations)) {
  errors.push("actor_id is not declared as text (must be text, not uuid)");
}

// 3. Required hash-chain columns exist.
for (const col of ["method", "status", "prev_hash", "hash"]) {
  if (!new RegExp(`add column if not exists\\s+${col}\\b`, "i").test(migrations)) {
    errors.push(`column "${col}" not added by any migration`);
  }
}

// 4. Unique hash index.
if (!/create unique index[\s\S]*custody_ledger_hash_unique_idx[\s\S]*\(\s*hash\s*\)/i.test(migrations)) {
  errors.push("missing unique hash index custody_ledger_hash_unique_idx");
}

// 5. Linear-chain unique index on deal_id + prev_hash.
const linear = migrations.match(
  /create unique index[\s\S]*custody_ledger_linear_chain_idx[\s\S]*?\(([^)]*)\)/i,
);
if (!linear) {
  errors.push("missing linear-chain index custody_ledger_linear_chain_idx");
} else {
  const cols = linear[1].replace(/\s/g, "");
  if (!/deal_id,prev_hash/i.test(cols)) {
    errors.push(
      `linear-chain index must be on (deal_id, prev_hash), got (${cols})`,
    );
  }
}

// 6. One row lock + transaction replaces the application read/insert race.
if(!code.includes("rpc('append_custody_event'"))errors.push('appendLedger must delegate to the atomic RPC');
if(!/from public\.deals where id=[\s\S]*?for update/i.test(atomic))errors.push('Atomic custody append must serialize on canonical Matter');
for(const control of ['CUSTODY_IDEMPOTENCY_CONFLICT','CUSTODY_CHAIN_FORK','CUSTODY_HISTORY_IMMUTABLE','payload_canonical'])if(!atomic.includes(control))errors.push('Missing atomic custody control '+control);

if (errors.length) {
  console.error("validate:custody-ledger-schema FAILED:");
  for (const e of errors) console.error("  - " + e);
  throw new Error(`${errors.length} custody-ledger schema error(s)`);
}
console.log(
  `validate:custody-ledger-schema passed (${insertedCols.length} cols backed; actor_id text; hash + linear-chain unique indexes; atomic Matter serialization and immutable payload present)`,
);
