#!/usr/bin/env node
// Verify public funnel/conversion copy is on-brand and contains no forbidden claims.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
let failures = 0;
const fail = (m) => { console.error(`  ✗ FAIL: ${m}`); failures++; };
const pass = (m) => console.log(`  ✓ PASS: ${m}`);
const read = (p) => { try { return readFileSync(join(ROOT, p), "utf8"); } catch { return ""; } };

const MODULE = read("components/conversion/MilanoPublicCtaModule.tsx");
const REVENUE = read("data/milano-revenue-copy-system.ts");
function effective(p) {
  let t = read(p);
  if (t.includes("MilanoPublicCtaModule")) t += "\n" + MODULE + "\n" + REVENUE;
  if (/milano-revenue-copy-system/.test(t)) t += "\n" + REVENUE;
  return t;
}

const PUBLIC_PAGES = [
  "app/access/page.tsx",
  "app/lawyer-access/page.tsx",
  "app/countries/page.tsx",
  "app/map/page.tsx",
];

const REQUIRED = [
  "The Milano Seal helps",
  "Start Controlled Intake",
  "receiving-authority review",
];

const CTA_ANYWHERE = ["Request Lawyer Access", "Apply for Alliance Access"];

// Reject affirmative claims. Safety boundaries such as
// "does not provide legal advice" must remain allowed and visible.
const FORBIDDEN = [
  /guaranteed acceptance/i,
  /instant approval/i,
  /(?:the\s+milano\s+seal|milano|we)\s+(?:provides?|offers?|gives?)\s+legal advice/i,
  /(?:the\s+milano\s+seal|milano|we)\s+(?:provides?|offers?|gives?)\s+legal clearance/i,
  /government approved/i,
  /court approved/i,
];

const allText = PUBLIC_PAGES.map(effective).join("\n");

for (const p of PUBLIC_PAGES) {
  if (!existsSync(join(ROOT, p))) { fail(`missing public page: ${p}`); continue; }
  const c = effective(p);
  for (const r of REQUIRED) {
    if (!c.includes(r)) fail(`${p} missing required copy "${r}"`);
  }
}
if (failures === 0) pass("public pages carry promise + intake + boundary copy");

for (const cta of CTA_ANYWHERE) {
  if (!allText.includes(cta)) fail(`no public page includes CTA "${cta}"`);
}

if (!/themilanoseal\.com|href=["'`]\/(intake|access|lawyer-access|alliance|va)/.test(allText)) {
  fail("public pages lack domain or internal route links");
}

for (const p of PUBLIC_PAGES) {
  const c = read(p);
  for (const re of FORBIDDEN) {
    if (re.test(c)) fail(`${p} contains forbidden claim ${re}`);
  }
}
if (failures === 0) pass("no forbidden claims in public funnel copy");

console.log(`\n${"─".repeat(48)}`);
if (failures > 0) {
  console.error(`\n✗ Revenue copy validation FAILED — ${failures} issue(s).\n`);
  process.exit(1);
}
console.log("\n✓ Revenue copy validation passed.\n");
process.exit(0);
