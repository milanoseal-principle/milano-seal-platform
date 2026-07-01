// validate:sales-intelligence-lab — guards the protected internal Sales Lab.
// Asserts structure, safe AI wiring (no client-side Anthropic), no Billing/Stripe/
// SaaS plans, demo-isolated data, Offer Library, and no key exposure.

import { readFileSync, existsSync, readdirSync } from "fs";

const errors = [];
const LAB = "components/dashboard/intelligence/sales-lab";
const ROUTE = "app/api/intelligence/generate/route.ts";
const PAGE = "app/dashboard/intelligence/sales-lab/page.tsx";
const DOC = "docs/audits/MILANO_SALES_INTELLIGENCE_LAB_EXTRACTION.md";

// 1. Required files.
for (const f of [PAGE, ROUTE, `${LAB}/SalesLabShell.tsx`, `${LAB}/OfferLibrary.tsx`, `${LAB}/constants.ts`, DOC]) {
  if (!existsSync(f)) errors.push(`missing required file: ${f}`);
}
if (!existsSync(LAB)) {
  console.error("validate:sales-intelligence-lab FAILED: lab dir missing");
  throw new Error("lab dir missing");
}

const labFiles = readdirSync(LAB).filter((f) => /\.(ts|tsx)$/.test(f));
const clientText = labFiles.map((f) => readFileSync(`${LAB}/${f}`, "utf8")).join("\n");
const routeSrc = existsSync(ROUTE) ? readFileSync(ROUTE, "utf8") : "";
const all = clientText + "\n" + routeSrc + "\n" + (existsSync(PAGE) ? readFileSync(PAGE, "utf8") : "");

// 2. No client-side Anthropic call anywhere in the lab UI.
if (/api\.anthropic\.com/.test(clientText)) {
  errors.push("client component references api.anthropic.com (must be server-side only)");
}

// 3. No Billing / Stripe / SaaS-plan copy.
// Note: negated internal guardrail reminders ("no legal advice", "no guaranteed
// acceptance") are intentionally NOT banned here — those are operator guidance, not
// public claims. This list targets the real Sales-Lab risks.
const BANNED = [
  /Stripe/i,
  /Billing Portal/i,
  /Starter Plan/i,
  /\bPro Plan\b/i,
  /Agency Plan/i,
  /government approved/i,
  /Virtual Assistant/i,
  /VA Support Role/i,
];
for (const re of BANNED) {
  if (re.test(all)) errors.push(`banned Sales-Lab phrase present: ${re}`);
}

// 4. No Billing tab in the shell.
const shell = readFileSync(`${LAB}/SalesLabShell.tsx`, "utf8");
if (/id:\s*["']billing["']|label:\s*["']Billing["']/i.test(shell)) {
  errors.push("Billing tab still present in shell");
}

// 5. Demo disclaimer present in UI.
if (!/Demo workspace data only/.test(all)) {
  errors.push('"Demo workspace data only" not found in Sales Lab UI');
}

// 6. Demo isolation — every SEED_ACCOUNTS / SEED_LEADS entry carries demo:true.
const constants = readFileSync(`${LAB}/constants.ts`, "utf8");
for (const seed of ["SEED_ACCOUNTS", "SEED_LEADS"]) {
  const m = constants.match(new RegExp(`${seed}[^=]*=\\s*\\[([\\s\\S]*?)\\];`));
  if (!m) { errors.push(`could not find ${seed}`); continue; }
  const items = (m[1].match(/\{/g) || []).length;
  const demos = (m[1].match(/demo:\s*true/g) || []).length;
  if (items !== demos) errors.push(`${seed}: ${items} items but only ${demos} marked demo:true`);
}

// 7. Offer Library lanes.
for (const lane of ["Signature", "Priority", "Executive"]) {
  if (!constants.includes(lane)) errors.push(`Offer Library missing lane: ${lane}`);
}

// 8. Server route does not expose the API key or import backend money modules.
if (/NextResponse\.json\([^)]*ANTHROPIC_API_KEY/.test(routeSrc)) {
  errors.push("server route returns ANTHROPIC_API_KEY (exposed)");
}
if (/from\s+["']@?\/?(lib\/release|lib\/payments|lib\/wise|lib\/custodyLedger|supabase\/migrations)/.test(routeSrc)) {
  errors.push("server route imports a payment/Wise/release/custody/DB module");
}

// 9. No spreadsheet references.
if (/\.xlsx/i.test(all)) errors.push("spreadsheet (.xlsx) referenced in lab code");

// 10. Package script.
const pkg = readFileSync("package.json", "utf8");
if (!/"validate:sales-intelligence-lab"/.test(pkg)) {
  errors.push("package.json missing validate:sales-intelligence-lab script");
}

if (errors.length) {
  console.error("validate:sales-intelligence-lab FAILED:");
  for (const e of errors) console.error("  - " + e);
  throw new Error(`${errors.length} sales-lab error(s)`);
}
console.log(
  `validate:sales-intelligence-lab passed (${labFiles.length} lab files, demo-isolated, no Billing/Stripe/SaaS, Offer Library present, server-side AI, no key exposure)`,
);
