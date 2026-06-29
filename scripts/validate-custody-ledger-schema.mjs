// validate:custody-ledger-schema — prevents regression of the exact bug migration
// 040 repaired: appendLedger() inserts hash-chain columns into custody_ledger, so
// those columns must exist in the schema. Asserts every column inserted by
// appendLedger() is either a base custody_ledger column (migration 001) or added by
// a later migration. If someone adds a new inserted column without a migration, the
// chain-of-custody write would silently fail again — this catches it at CI time.

import { readFileSync } from "fs";

const code = readFileSync("lib/custodyLedger.ts", "utf8");

// Extract the columns inserted by appendLedger().
const insertMatch = code.match(
  /\.from\("custody_ledger"\)\s*\.insert\(\{([\s\S]*?)\}\)/,
);
if (!insertMatch) throw new Error("could not find custody_ledger insert block");
const insertedCols = [...insertMatch[1].matchAll(/^\s*(\w+):/gm)].map((x) => x[1]);

// Columns known to exist: base table (001) + additive migration 040.
const base = [
  "id",
  "deal_id",
  "event",
  "actor_type",
  "actor_name",
  "location",
  "notes",
  "metadata",
  "created_at",
];
const migration040 = readFileSync(
  "supabase/migrations/040_custody_ledger_hash_chain.sql",
  "utf8",
);
const added = [...migration040.matchAll(/add column if not exists\s+(\w+)/gi)].map(
  (x) => x[1],
);
const known = new Set([...base, ...added]);

const errors = [];
for (const col of insertedCols) {
  if (!known.has(col)) {
    errors.push(
      `appendLedger inserts "${col}" but no migration defines it on custody_ledger`,
    );
  }
}

if (errors.length) {
  console.error("validate:custody-ledger-schema FAILED:");
  for (const e of errors) console.error("  - " + e);
  throw new Error(`${errors.length} custody-ledger schema error(s)`);
}
console.log(
  `validate:custody-ledger-schema passed (${insertedCols.length} inserted columns all backed by schema)`,
);
