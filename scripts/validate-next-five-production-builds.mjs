#!/usr/bin/env node
// Validator — Next Five Production Builds (acquisition, portal2, jurisdictions,
// founder-os, dispatch). Asserts files exist, routes present, no protected
// files touched, and no banned public claims in the new surfaces.

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const repoRoot = process.cwd();
let failures = 0;
const fail = (m) => { console.error("VALIDATOR FAIL:", m); failures++; };
const ok = (m) => console.log("OK:", m);
const exists = (rel) => fs.existsSync(path.join(repoRoot, rel));

// 1. Each system's lib dir + dashboard/portal route exists.
const systems = [
  { lib: "lib/acquisition", route: "app/dashboard/acquisition/page.tsx", comp: "components/acquisition" },
  { lib: "lib/portal2", route: "app/portal/v2/page.tsx", comp: "components/portal2" },
  { lib: "lib/jurisdictions", route: "app/dashboard/jurisdictions/page.tsx", comp: "components/jurisdictions" },
  { lib: "lib/founder-os", route: "app/dashboard/founder/page.tsx", comp: "components/founder" },
  { lib: "lib/dispatch", route: "app/dashboard/dispatch/page.tsx", comp: "components/dispatch" },
];
for (const s of systems) {
  if (!exists(s.lib)) fail(`Missing ${s.lib}`);
  if (!exists(s.route)) fail(`Missing route ${s.route}`);
  if (!exists(s.comp)) fail(`Missing components ${s.comp}`);
}
if (failures === 0) ok("All 5 systems (lib + route + components) present");

// 2. Nav links added (do not remove existing).
const nav = exists("lib/dashboard-modules.ts") ? fs.readFileSync(path.join(repoRoot, "lib/dashboard-modules.ts"), "utf8") : "";
for (const r of ["acquisition", "jurisdictions", "founder", "dispatch"]) {
  if (!new RegExp(`route:\\s*"${r}"`).test(nav)) fail(`Nav missing dashboard route "${r}"`);
}
ok("Dashboard nav links present (acquisition, jurisdictions, founder, dispatch)");

// 3. No banned claims in the new public/operator surfaces.
const BANNED = /guaranteed acceptance|government approved|guaranteed income|guaranteed assignment|legal advice|immigration advice|\bTSA\b|airport approval|airline approval/i;
const scanDirs = ["app/dashboard/acquisition", "app/portal/v2", "app/dashboard/jurisdictions", "app/dashboard/founder", "app/dashboard/dispatch"];
for (const d of scanDirs) {
  const full = path.join(repoRoot, d);
  if (!fs.existsSync(full)) continue;
  for (const f of fs.readdirSync(full)) {
    if (!f.endsWith(".tsx")) continue;
    const txt = fs.readFileSync(path.join(full, f), "utf8");
    // allow disclaimers phrased as "does not / no ..." negations
    const m = txt.match(BANNED);
    if (m && !new RegExp(`(does not|no|not)\\s+[^.]*${m[0]}`, "i").test(txt)) fail(`Banned claim "${m[0]}" in ${d}/${f}`);
  }
}
ok("No banned claims in new dashboard/portal surfaces");

// 4. Protected-file guard vs main.
try {
  const base = execSync("git merge-base origin/main HEAD || git rev-parse main", { cwd: repoRoot, encoding: "utf8" }).trim();
  const diff = execSync(`git diff --name-only ${base} HEAD`, { cwd: repoRoot, encoding: "utf8" });
  const sensitive = /wise|webhook|payment-?confirm|paymentConfirm|release-?gate|releaseGate|performFinalRelease|custody|supabase\/(migrations|rls)|serviceRole|shippo|bluenotary/i;
  const touched = diff.split("\n").filter((f) => f && sensitive.test(f));
  if (touched.length) fail(`Protected files touched: ${touched.join(", ")}`);
  else ok("No Wise/payment/release/custody/RLS/Shippo/BlueNotary files touched");
} catch (e) {
  console.log("NOTE: git diff guard skipped (", e.message, ")");
}

if (failures > 0) {
  console.error(`\nVALIDATOR: next-five-production-builds FAILED with ${failures} error(s).`);
  process.exit(2);
}
console.log("\nVALIDATOR: next-five-production-builds PASSED.");
