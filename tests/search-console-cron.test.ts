import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const cron = readFileSync("app/api/cron/seo-search-console/route.ts", "utf8");
const vercel = JSON.parse(readFileSync("vercel.json", "utf8"));

test("Search Console cron requires bearer authorization and finalized window", () => {
  assert.ok(cron.includes("CRON_SECRET"));
  assert.match(cron, /request\.headers\.get\(["']authorization["']\)/);
  assert.match(cron, /triggerType:\s*["']CRON["']/);
  assert.ok(cron.includes("3 * 86400000"));
});

test("Search Console cron refreshes activation downstream without making it authoritative", () => {
  assert.ok(cron.includes("syncSeoActivationActions"));
  assert.ok(cron.includes("activation refresh degraded"));
  assert.ok(cron.includes('status: "DEGRADED"'));
  assert.ok(cron.includes('success: true'));
});

test("Search Console cron runs once daily at 06:00 UTC", () => {
  const entry = vercel.crons.find((item: { path: string }) => item.path === "/api/cron/seo-search-console");
  assert.deepEqual(entry, { path: "/api/cron/seo-search-console", schedule: "0 6 * * *" });
});
