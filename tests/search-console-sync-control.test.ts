import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const component = fs.readFileSync("components/dashboard/SearchConsoleSyncControl.tsx", "utf8");
const route = fs.readFileSync("app/api/admin/seo/search-console/sync/route.ts", "utf8");
const sync = fs.readFileSync("lib/seo/search-console/sync.ts", "utf8");

test("dashboard sync control exposes governed configuration and run states", () => {
  for (const state of ["UNCONFIGURED", "READY", "SYNCING", "SYNCED", "FAILED"]) assert.ok(component.includes(state));
  assert.ok(component.includes("Sync Search Console"));
});

test("manual sync is authenticated, fails unconfigured, and uses idempotent upsert", () => {
  assert.ok(route.includes("authorizedUser"));
  assert.ok(route.includes("SEARCH_CONSOLE_UNCONFIGURED"));
  assert.ok(sync.includes(".upsert(observations"));
  assert.ok(sync.includes('onConflict: "start_date,end_date,query,page,country,device"'));
  assert.equal(sync.includes("fabricat"), false);
});
