#!/usr/bin/env node
import fs from "fs";
import path from "path";

function fail(msg) {
  console.error("VALIDATOR FAIL:", msg);
  process.exitCode = 2;
}

function ok(msg) {
  console.log("OK:", msg);
}

const root = path.resolve(new URL(import.meta.url).pathname, "..", "..", "workspaces", "milano-seal-platform").replace(/^\//, "/");
// fallback to repo-relative path
const repoRoot = process.cwd();

const doctrinePath = path.join(repoRoot, "lib/pricing/pricingDoctrine.ts");
const enginePath = path.join(repoRoot, "lib/pricing/smartIntakePricingEngine.ts");

if (!fs.existsSync(doctrinePath)) {
  fail(`Missing ${doctrinePath}`);
} else {
  ok(`Found ${doctrinePath}`);
}

if (!fs.existsSync(enginePath)) {
  fail(`Missing ${enginePath}`);
} else {
  ok(`Found ${enginePath}`);
}

const doctrine = fs.readFileSync(doctrinePath, "utf8");
if (!/signature:\s*750/.test(doctrine)) fail("Signature internal base must be 750 in pricingDoctrine.ts");
if (!/priority:\s*975/.test(doctrine)) fail("Priority internal base must be 975 in pricingDoctrine.ts");
if (!/executive:\s*1850/.test(doctrine)) fail("Executive internal base must be 1850 in pricingDoctrine.ts");
ok("Internal base values present and correct in pricingDoctrine.ts");

// engine existence check
const engine = fs.readFileSync(enginePath, "utf8");
if (!/buildSmartIntakePricingResult\(/.test(engine)) fail("smartIntakePricingEngine missing buildSmartIntakePricingResult function");
ok("smartIntakePricingEngine contains expected function");

console.log("VALIDATOR: smart-intake-pricing-engine passed basic checks.");
