import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  "supabase/migrations/071_revoke_sensitive_identity_helpers_from_public.sql",
  "utf8",
).toLowerCase();

assert.match(
  migration,
  /array\['is_admin',\s*'is_operator'\]/,
  "Migration must harden both sensitive identity helpers",
);

assert.match(
  migration,
  /to_regprocedure\(format\('public\.%i\(\)'\s*,\s*fn\)\)\s+is not null/,
  "Privilege hardening must be guarded by helper existence for replay/shadow safety",
);

assert.ok(
  migration.includes("'revoke execute on function public.%i() from public, anon'"),
  "Sensitive identity helpers must revoke EXECUTE from PUBLIC and anon",
);

assert.ok(
  migration.includes("'grant execute on function public.%i() to authenticated, service_role'"),
  "Sensitive identity helpers must preserve authenticated and service_role execution",
);

assert.ok(
  !/grant\s+execute\s+on\s+function\s+public\.(is_admin|is_operator)\(\)\s+to\s+(public|anon)/i.test(migration),
  "Sensitive identity helpers must never regain PUBLIC or anon EXECUTE",
);

console.log("PASS sensitive identity helper execution grants");
