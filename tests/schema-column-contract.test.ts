import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { isolatedCanonicalDatabase } from "../scripts/certification/shared.mjs";
import { columnUsage } from "../scripts/lib/column-contract.mjs";

// Code must only name columns that exist in the replayed repository schema. Supabase calls do
// not throw on an unknown column: they return data=null, which dashboards rendered as "no rows".
// Files are added here as each one is verified against the schema.
const VERIFIED_FILES = [
  "lib/dashboard/exceptionQueue.ts",
  "app/api/dashboard/release-certificates/route.ts",
  "app/api/verify/[verificationId]/route.ts",
  "app/api/portal/confirm/route.ts",
  "app/api/portal/verify/route.ts",
  "app/api/upload/route.ts",
  "app/api/intake/upload/route.ts",
  "app/api/portal/me/upload/route.ts",
  "lib/execution-qa/events.ts",
  "lib/va/vaAudit.ts",
  "app/api/admin/override/route.ts",
  "app/dashboard/security/page.tsx",
  "app/api/intake/core.ts",
  "app/api/va/matters/route.ts",
  "app/api/va/matters/[id]/route.ts",
  "app/api/dashboard/readiness/[matterId]/route.ts",
  "lib/release/certificateEligibility.ts",
  "app/api/dashboard/certificates/generate/route.ts",
  "app/api/va/tasks/route.ts",
  "app/api/va/checklists/route.ts",
  "app/api/va/ron/tasks/route.ts",
  "app/api/va/tasks/[id]/route.ts",
];
// Tables that exist in no schema; queries against them are reported as unavailable by design.
const ABSENT_BY_DESIGN = new Set(["deal_documents"]);

test("verified files reference only columns that exist in the replayed schema", async () => {
  const db = await isolatedCanonicalDatabase(fs.readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort());
  try {
    const columns = new Map<string, Set<string>>();
    for (const r of (await db.query<{ t: string; c: string }>("select table_name t, column_name c from information_schema.columns where table_schema='public'")).rows) {
      if (!columns.has(r.t)) columns.set(r.t, new Set());
      columns.get(r.t)!.add(r.c);
    }
    const problems: string[] = [];
    for (const file of VERIFIED_FILES) {
      for (const use of columnUsage(fs.readFileSync(file, "utf8"))) {
        if (ABSENT_BY_DESIGN.has(use.table)) continue;
        const known = columns.get(use.table);
        if (!known) problems.push(`${file}: unknown table ${use.table}`);
        else if (!known.has(use.column)) problems.push(`${file}: ${use.kind} ${use.table}.${use.column}`);
      }
    }
    assert.deepEqual(problems, []);
  } finally {
    await db.close();
  }
});

test("scanner reads aliases, write keys and filters", () => {
  const uses = columnUsage(`supabase.from("deals").select("id, display_id:deal_id").eq("status", "x").update({ a: 1, nested: { b: 2 }, ...rest })`);
  assert.deepEqual(uses.map((u) => `${u.kind}:${u.column}`), ["select:id", "select:deal_id", "update:a", "update:nested", "filter:status"]);
});
