import assert from "node:assert/strict"; import fs from "node:fs";
const client = fs.readFileSync("lib/seo/search-console/client.ts", "utf8"); const ui = fs.readFileSync("components/dashboard/SearchConsoleSyncControl.tsx", "utf8"); const health = fs.readFileSync("app/api/admin/seo/search-console/health/route.ts", "utf8"); const cron = fs.readFileSync("app/api/cron/seo-search-console/route.ts", "utf8");
assert.ok(client.includes("webmasters.readonly") && client.includes('dataState: "final"') && client.includes('["date", "query", "page", "country"]'));
assert.ok(health.includes("requireDashboardAccess")); assert.ok(cron.includes("Bearer ${secret}")); assert.ok(ui.includes("SEARCH CONSOLE NOT CONFIGURED"));
for (const secret of ["private_key", "access_token", "credentialJson", "serviceAccountEmailMasked"]) assert.ok(!ui.includes(secret));
assert.ok(!/payment_confirmed|\.from\(["']deals["']\)\.update|stripe/i.test([client, ui, health, cron].join("\n")));
console.log("Search Console production activation validation passed.");
