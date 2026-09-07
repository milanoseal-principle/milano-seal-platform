#!/usr/bin/env node

import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const ARCH = join(ROOT, "docs", "architecture");
const requiredFiles = [
  "01_REQUIREMENTS.md",
  "02_DATA_MODEL.md",
  "03_BUSINESS_RULES.md",
  "04_API_CONTRACTS.md",
  "05_UI_CONTRACTS.md",
  "06_SECURITY.md",
  "07_TESTS.md",
  "08_ACCEPTANCE.md",
];
const expectedLayers = [
  "layer-01-matter",
  "layer-02-business-rules",
  "layer-03-pricing",
  "layer-04-intake",
  "layer-05-ron",
  "layer-06-apostille",
  "layer-07-operator",
  "layer-08-wise",
  "layer-09-economics",
  "layer-10-notifications",
  "layer-11-corridor",
  "layer-12-security",
  "layer-13-config",
  "layer-14-finance",
  "layer-15-validation",
];

assert.ok(existsSync(ARCH), "docs/architecture must exist");
const manifest = JSON.parse(readFileSync(join(ARCH, "LAYER_MANIFEST.json"), "utf8"));
assert.deepEqual(manifest.operating_spine, ["MATTER", "EXECUTION", "CORRIDOR"]);
assert.ok(manifest.hard_locks.includes("wise_only"), "Wise-only hard lock missing");
assert.ok(manifest.hard_locks.includes("supabase_system_of_record"), "Supabase system-of-record lock missing");

for (const layer of expectedLayers) {
  const dir = join(ARCH, layer);
  assert.ok(existsSync(dir), `Missing architecture layer: ${layer}`);
  const actual = readdirSync(dir).filter((name) => statSync(join(dir, name)).isFile()).sort();
  assert.deepEqual(actual, [...requiredFiles].sort(), `${layer} must contain exactly the eight canonical contract files`);
  const contract = manifest.layers?.[layer];
  assert.ok(contract, `Manifest entry missing for ${layer}`);
  for (const key of ["title", "owns_truth", "may_change", "evidence", "tests", "anchors"]) {
    assert.ok(contract[key], `${layer}.${key} missing`);
  }
}

assert.equal(Object.keys(manifest.layers ?? {}).length, 15, "Manifest must define exactly 15 layers");

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if ([".git", ".next", "node_modules", "coverage"].includes(name)) continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else if (/\.(md|txt|json|mjs|cjs|js|jsx|ts|tsx|css)$/i.test(name)) out.push(full);
  }
  return out;
}

const foreignBrand = ["Sur", "visure"].join("");
const isolationPatterns = [
  { value: foreignBrand, label: "unrelated product brand" },
  { value: "HVAC", label: "HVAC domain language" },
  { value: "appliance claim", label: "appliance-claim domain language" },
  { value: "service-contract", label: "service-contract domain language" },
];

const violations = [];
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file);
  const content = readFileSync(file, "utf8");
  for (const pattern of isolationPatterns) {
    if (content.toLowerCase().includes(pattern.value.toLowerCase())) {
      if (rel === "scripts/validate-architecture-control-plane.mjs" && pattern.value !== foreignBrand) continue;
      violations.push(`${rel}: ${pattern.label}`);
    }
  }
}

assert.equal(violations.length, 0, `Architecture isolation violations:\n${violations.join("\n")}`);

console.log("PASS Milano Seal 15-layer architecture control plane");
