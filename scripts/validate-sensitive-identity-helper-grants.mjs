import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  "supabase/migrations/071_revoke_sensitive_identity_helpers_from_public.sql",
  "utf8",
).toLowerCase();

for (const fn of ["is_admin()", "is_operator()"]) {
  assert.ok(
    migration.includes(`revoke execute on function public.${fn} from public, anon;`),
    `${fn} must revoke EXECUTE from PUBLIC and anon`,
  );
  assert.ok(
    migration.includes(`grant execute on function public.${fn} to authenticated, service_role;`),
    `${fn} must preserve authenticated and service_role execution`,
  );
}

assert.ok(
  !/grant\s+execute\s+on\s+function\s+public\.(is_admin|is_operator)\(\)\s+to\s+(public|anon)/i.test(migration),
  "Sensitive identity helpers must never regain PUBLIC or anon EXECUTE",
);

console.log("PASS sensitive identity helper execution grants");
