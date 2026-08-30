import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { finalizedSearchConsoleWindow } from "@/lib/seo/search-console/sync";

const route = fs.readFileSync("app/api/cron/seo-search-console/route.ts", "utf8");
const ledger = fs.readFileSync("supabase/migrations/067_search_console_sync_runs.sql", "utf8");
const vercel = JSON.parse(fs.readFileSync("vercel.json", "utf8")) as { crons: Array<{ path: string; schedule: string }> };

test("cron requires bearer authorization and is scheduled daily at 06:00 UTC", () => {
  assert.ok(route.includes('authorization !== `Bearer ${secret}`'));
  assert.deepEqual(vercel.crons.find((item) => item.path === "/api/cron/seo-search-console"), { path: "/api/cron/seo-search-console", schedule: "0 6 * * *" });
});

test("finalized window excludes the latest three days and spans 28 days", () => {
  assert.deepEqual(finalizedSearchConsoleWindow(new Date("2026-08-30T12:00:00Z")), { startDate: "2026-07-31", endDate: "2026-08-27" });
});

test("sync run ledger records trigger, counts, outcome, and sanitized failure", () => {
  for (const invariant of ["seo_search_console_sync_runs", "fetched", "persisted", "error_code", "error_message", "MANUAL", "CRON", "enable row level security"]) assert.ok(ledger.includes(invariant));
});
