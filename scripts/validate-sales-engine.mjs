#!/usr/bin/env node
// Verify the public sales/conversion funnel exists and is wired.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
let failures = 0;
const fail = (m) => { console.error(`  ✗ FAIL: ${m}`); failures++; };
const pass = (m) => console.log(`  ✓ PASS: ${m}`);
const read = (p) => { try { return readFileSync(join(ROOT, p), "utf8"); } catch { return ""; } };
const has = (p) => existsSync(join(ROOT, p));

// A public page's effective copy includes the conversion module + revenue data
// it renders, so string checks see what actually ships to the visitor.
const MODULE = read("components/conversion/MilanoPublicCtaModule.tsx");
const REVENUE = read("data/milano-revenue-copy-system.ts");
function effective(p) {
  let t = read(p);
  if (t.includes("MilanoPublicCtaModule")) t += "\n" + MODULE + "\n" + REVENUE;
  if (/milano-revenue-copy-system/.test(t)) t += "\n" + REVENUE;
  return t;
}

// Required funnel files
for (const p of [
  "app/access/page.tsx",
  "app/lawyer-access/page.tsx",
  "app/alliance/apply/page.tsx",
  "app/(public)/va/apply/page.tsx",
  "app/api/sales/capture/route.ts",
  "data/access-products.ts",
  "data/milano-revenue-copy-system.ts",
]) {
  if (has(p)) pass(`exists: ${p}`); else fail(`missing: ${p}`);
}

// /countries and /map must drive controlled intake + show what Milano Seal does + compliance
for (const p of ["app/countries/page.tsx", "app/map/page.tsx"]) {
  const c = effective(p);
  if (!c.includes("Start Controlled Intake")) fail(`${p} lacks "Start Controlled Intake"`);
  if (!c.includes("The Milano Seal helps")) fail(`${p} lacks "The Milano Seal helps"`);
  if (!c.includes("receiving-authority review")) fail(`${p} lacks "receiving-authority review"`);
}

// Sales capture API must not invent paid state and must parse email
const api = read("app/api/sales/capture/route.ts");
if (api) {
  if (!/email/.test(api)) fail("sales capture API does not reference email");
  if (/mark.?paid|payment_status\s*=\s*["']paid/.test(api)) fail("sales capture API touches paid state");
}

// Access invoice route (if present) must use a Wise reference format
const inv = read("app/api/access/invoice/route.ts");
if (inv && !/MS-ACCESS-|MS-INTEL-/.test(inv)) {
  fail("access invoice route does not use a Wise MS-ACCESS-/MS-INTEL- reference");
}

console.log(`\n${"─".repeat(48)}`);
if (failures > 0) { console.error(`\n✗ Sales engine validation FAILED — ${failures} issue(s).\n`); process.exit(1); }
console.log("\n✓ Sales engine validation passed.\n");
process.exit(0);
