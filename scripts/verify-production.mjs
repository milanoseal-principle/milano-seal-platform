#!/usr/bin/env node
// Milano Seal — Live production endpoint smoke test.
// Usage: BASE=https://themilanoseal.com node scripts/verify-production.mjs
// Exits non-zero if any GREEN-ONLY check fails. Safe, read-mostly; the intake
// probe creates one test matter (clearly marked) only when --intake is passed.

const BASE = process.env.BASE || "https://themilanoseal.com";
const doIntake = process.argv.includes("--intake");
let failures = 0;

const ok = (m) => console.log(`  ✓ ${m}`);
const bad = (m) => { console.error(`  ✗ ${m}`); failures += 1; };

async function code(path, opts = {}) {
  try {
    const res = await fetch(BASE + path, opts);
    return { status: res.status, text: await res.text() };
  } catch (err) {
    return { status: 0, text: String(err) };
  }
}

console.log(`\nMilano Seal production smoke — ${BASE}\n`);

console.log("[public pages] expect 200");
for (const p of ["/", "/intake", "/countries", "/map"]) {
  const { status } = await code(p);
  status === 200 ? ok(`${p} -> 200`) : bad(`${p} -> ${status}`);
}

console.log("\n[wise webhook] GET health expect ok:true");
{
  const { status, text } = await code("/api/webhooks/wise");
  status === 200 && text.includes("\"ok\":true")
    ? ok("wise webhook healthy")
    : bad(`wise webhook -> ${status} ${text.slice(0, 80)}`);
}

console.log("\n[shippo webhook] canonical HMAC route without signature expect 401");
{
  const { status } = await code("/api/courier/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  status === 401
    ? ok("canonical Shippo HMAC guard active (401)")
    : bad(`canonical Shippo guard -> ${status} (expected 401)`);
}

console.log("\n[retired shippo route] expect 404");
{
  const { status } = await code("/api/webhooks/shippo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  status === 404
    ? ok("retired duplicate Shippo route absent (404)")
    : bad(`retired Shippo route -> ${status} (expected 404)`);
}

console.log("\n[retired alliance status stub] expect 404");
{
  const { status } = await code("/api/webhooks/alliance/status", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-alliance-signature": "not-a-real-signature" },
    body: "{}",
  });
  status === 404
    ? ok("fake-success Alliance webhook stub absent (404)")
    : bad(`retired Alliance webhook -> ${status} (expected 404)`);
}

console.log("\n[protected database diagnostics] expect authentication denial");
{
  const { status } = await code("/api/health/database");
  [401,403].includes(status) ? ok("database diagnostics require authentication") : bad(`database health -> ${status}`);
}

if (doIntake) {
  console.log("\n[intake] POST creates a test matter (expect deal_id)");
  const { status, text } = await code("/api/intake", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Production Verify (DELETE)",
      email: "verify@themilanoseal.com",
      country: "italy",
      documentType: "power_of_attorney",
    }),
  });
  /MS-\d{4}-/.test(text)
    ? ok(`intake created matter (${(text.match(/MS-\d{4}-\w+/) || [])[0]})`)
    : bad(`intake -> ${status} ${text.slice(0, 120)}`);
} else {
  console.log("\n[intake] skipped (pass --intake to create a test matter)");
}

console.log(`\n${"─".repeat(48)}`);
if (failures > 0) {
  console.error(`\n✗ ${failures} live check(s) FAILED.\n`);
  process.exit(1);
}
console.log("\n✓ All live smoke checks passed.\n");
process.exit(0);
