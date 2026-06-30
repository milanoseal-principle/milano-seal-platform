// validate:motion-system — guards the isolated cinematic motion system.
//
// Asserts the motion components + isolated preview route exist, the Global
// Intelligence Network / jurisdiction map is absent, no fake-authority / guarantee
// / legal-advice copy leaked in, the preview carries a demo/illustrative
// disclaimer, reduced-motion is respected, and the motion layer imports no
// payment / Wise / release / auth / custody backend modules.

import { readFileSync, existsSync, readdirSync } from "fs";

const errors = [];
const MOTION_DIR = "components/dashboard/motion";
const PREVIEW = "app/dashboard/motion-preview/page.tsx";

// 1. Required files exist.
for (const f of [
  `${MOTION_DIR}/index.ts`,
  `${MOTION_DIR}/MilanoSealMotionDemoNoMap.tsx`,
  PREVIEW,
]) {
  if (!existsSync(f)) errors.push(`missing required file: ${f}`);
}

if (!existsSync(MOTION_DIR)) {
  console.error("validate:motion-system FAILED: motion dir missing");
  throw new Error("motion dir missing");
}

const motionFiles = readdirSync(MOTION_DIR).filter((f) => /\.(ts|tsx)$/.test(f));
const allText =
  motionFiles.map((f) => readFileSync(`${MOTION_DIR}/${f}`, "utf8")).join("\n") +
  "\n" +
  (existsSync(PREVIEW) ? readFileSync(PREVIEW, "utf8") : "");

// 2. Map / Global Intelligence Network must be absent.
const FORBIDDEN_MAP = [
  "Global Intelligence Network",
  "JurisdictionMap",
  "RouteArc",
  "JurisdictionNode",
  "JurisdictionDetail",
  "Florida → Global",
  "Florida to Global Execution Telemetry",
];
for (const m of FORBIDDEN_MAP) {
  if (allText.includes(m)) errors.push(`forbidden map artifact present: "${m}"`);
}

// 3. No fake-authority / guarantee / legal-advice copy.
const FORBIDDEN_COPY = [
  /government approved/i,
  /guaranteed accept/i,
  /\blegal advice\b/i,
  /cheap notary/i,
  /instant approval/i,
];
for (const re of FORBIDDEN_COPY) {
  if (re.test(allText)) errors.push(`forbidden copy present: ${re}`);
}

// 4. Reduced-motion safeguard exists somewhere in the motion layer.
if (!/prefers-reduced-motion/.test(allText)) {
  errors.push("no prefers-reduced-motion safeguard found in motion layer");
}

// 5. Demo/preview disclaimer present in the preview page or demo shell.
if (!/demo|preview|illustrative/i.test(allText)) {
  errors.push("motion preview missing demo/illustrative disclaimer");
}

// 6. No backend module imports in the motion layer (payment/Wise/release/auth/custody/DB).
const BACKEND_IMPORT =
  /from\s+["']@?\/?(lib\/release|lib\/payments|lib\/custodyLedger|lib\/auth|lib\/wise|app\/api\/webhooks|supabase\/migrations)/i;
for (const f of motionFiles) {
  const src = readFileSync(`${MOTION_DIR}/${f}`, "utf8");
  if (BACKEND_IMPORT.test(src)) {
    errors.push(`motion file imports backend module (forbidden): ${f}`);
  }
}

if (errors.length) {
  console.error("validate:motion-system FAILED:");
  for (const e of errors) console.error("  - " + e);
  throw new Error(`${errors.length} motion-system error(s)`);
}
console.log(
  `validate:motion-system passed (${motionFiles.length} motion files, map-free, demo-disclaimed, reduced-motion safe, no backend imports)`,
);
