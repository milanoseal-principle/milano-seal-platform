// validate:banned-phrases — Phase 0 public-trust guard (from the Persona QA
// checklist + Master Runbook). Fails the build if banned phrases appear on
// client-facing public surfaces, and if the real crest / founder assets go missing.
//
// Scope: public client-facing files only (landing, portal, payment, public pages).
// Internal operator dashboard is intentionally excluded — it legitimately documents
// the retired Stripe rail and internal role labels.

import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

const errors = [];

// 1. Asset guards — these are the REAL referenced crest/founder assets.
const REQUIRED_ASSETS = [
  "public/milano-seal-orb-v2.png",
  "public/milano-seal-core-brain-feather.png",
  "public/milano-seal-gold-transparent-512.png",
  "public/nicholas-milano.jpeg",
];
for (const a of REQUIRED_ASSETS) {
  if (!existsSync(a)) errors.push(`required asset missing (do not remove): ${a}`);
}

// 2. Banned-phrase scan over public client-facing surfaces.
const SCAN_DIRS = [
  "components/landing",
  "components/portal",
  "components/payment",
  "components/conversion",
];
const SCAN_FILES = [
  "app/page.tsx",
  "app/about/page.tsx",
  "app/founder/page.tsx",
  "app/process/page.tsx",
  "app/services/page.tsx",
  "app/power-of-attorney-international/page.tsx",
  "components/landing/header.tsx",
  "components/landing/footer.tsx",
];

const BANNED = [
  /Hague Convention Compliant/i,
  /Compliance Map/i,
  /Mission Control/i,
  /Sovereign Command/i,
  /AES-?256/i,
  /guaranteed accept/i,
  /embassy approved/i,
  /government approved/i,
  /cheap notary/i,
  /instant approval/i,
  /Notarize From Anywhere/i,
  /Start Controlled Intake/i,
  /Virtual Assistant/i,
  /VA Support Role/i,
  /\bStripe\b/,
];

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(tsx|ts)$/.test(name)) out.push(p);
  }
  return out;
}

const files = [
  ...SCAN_DIRS.flatMap(walk),
  ...SCAN_FILES.filter((f) => existsSync(f)),
];

for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const re of BANNED) {
    if (re.test(src)) errors.push(`banned phrase ${re} in public surface: ${f}`);
  }
}

if (errors.length) {
  console.error("validate:banned-phrases FAILED:");
  for (const e of errors) console.error("  - " + e);
  throw new Error(`${errors.length} banned-phrase / asset error(s)`);
}
console.log(
  `validate:banned-phrases passed (${files.length} public files scanned, ${REQUIRED_ASSETS.length} assets present)`,
);
