#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const foreignBrand = ["Sur", "visure"].join("");
let failures = 0;

const fail = (message: string) => { console.error(`  ✗ FAIL: ${message}`); failures += 1; };
const pass = (message: string) => console.log(`  ✓ PASS: ${message}`);
const rel = (path: string) => relative(ROOT, path);
const readSafe = (path: string) => { try { return readFileSync(path, "utf8"); } catch { return ""; } };

function checkJson(path: string, required = true): void {
  const abs = join(ROOT, path);
  if (!existsSync(abs)) { if (required) fail(`${path} does not exist`); return; }
  try { JSON.parse(readSafe(abs)); pass(`${path} is valid JSON`); } catch { fail(`${path} is not valid JSON`); }
}

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (["node_modules", ".next", ".git", ".claude", "coverage"].includes(name)) continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else if (/\.(tsx?|jsx?|mjs|cjs|css|md|json)$/.test(name)) out.push(full);
  }
  return out;
}

console.log("\n[1] Config integrity");
checkJson("package.json");
checkJson("tsconfig.json");
checkJson("vercel.json", false);
checkJson("docs/architecture/LAYER_MANIFEST.json");

console.log("\n[2] Root Next.js integrity");
const nextConfig = readSafe(join(ROOT, "next.config.mjs"));
const nextDefs = [...nextConfig.matchAll(/const\s+nextConfig\s*=/g)].length;
if (nextDefs !== 1) fail(`next.config.mjs must have exactly one nextConfig definition; found ${nextDefs}`); else pass("next.config.mjs has one nextConfig definition");
const layoutPath = ["app/layout.tsx", "src/app/layout.tsx"].find((p) => existsSync(join(ROOT, p)));
if (!layoutPath || !/export\s+default\s+(async\s+)?function/.test(readSafe(join(ROOT, layoutPath)))) fail("Root layout default export missing"); else pass("Root layout valid");
const pagePath = ["app/page.tsx", "src/app/page.tsx"].find((p) => existsSync(join(ROOT, p)));
if (!pagePath || !/export\s+default/.test(readSafe(join(ROOT, pagePath)))) fail("Root page default export missing"); else pass("Root page valid");

const scanned = ["app", "components", "lib", "src", "scripts"].flatMap((d) => walk(join(ROOT, d)));
const sourceFiles = scanned.filter((f) => /\.(tsx?|jsx?|mjs|cjs)$/.test(f));
const productionFiles = scanned.filter((f) => !rel(f).startsWith("docs/"));

console.log("\n[3] Milano domain isolation");
const forbidden = [
  { pattern: new RegExp(foreignBrand, "i"), label: "unrelated product brand" },
  { pattern: /HVAC|appliance\s+claim|work.?order|service.?contract/i, label: "unrelated service-domain language" },
  { pattern: /product.?registration/i, label: "product-registration language" },
];
let domainHit = false;
for (const item of forbidden) {
  const hits = productionFiles.filter((f) => !rel(f).startsWith("scripts/validate-project") && item.pattern.test(readSafe(f)));
  if (hits.length) { fail(`${item.label}: ${hits.map(rel).join(", ")}`); domainHit = true; }
}
if (!domainHit) pass("No unrelated product/domain patterns found in production code");

console.log("\n[4] Stripe Checkout guard");
const stripePatterns = [/stripe\.checkout\.sessions\.create/, /allow_promotion_codes/, /checkout\.session\.completed/, /loadStripe\(/];
const paymentFiles = sourceFiles.filter((f) => /portal|api|payment|payments/.test(rel(f)));
const stripeHits = paymentFiles.filter((f) => stripePatterns.some((p) => p.test(readSafe(f))));
if (stripeHits.length) fail(`Stripe Checkout pattern found: ${stripeHits.map(rel).join(", ")}`); else pass("No Stripe Checkout patterns found");

console.log("\n[5] Public layout safety");
const publicPages = sourceFiles.filter((f) => rel(f).startsWith("app/") && rel(f).endsWith("page.tsx") && !/dashboard|portal|va|alliance|internal|admin|ops|workspace/.test(rel(f)));
const offsetHits = publicPages.filter((f) => { const c = readSafe(f); return !c.includes("ms-allow-hardcoded-offset") && /\bpt-(20|24|28|32)\b/.test(c) && !c.includes("header-total-height"); });
if (offsetHits.length) fail(`Hardcoded public top offsets: ${offsetHits.map(rel).join(", ")}`); else pass("Public top offsets safe");
const truncationHits = publicPages.filter((f) => { const c = readSafe(f); return !c.includes("ms-allow-country-truncate") && /className=["'`][^"'`]*(truncate|text-ellipsis|line-clamp|whitespace-nowrap)[^"'`]*["'`]/.test(c) && /country|destination|apostille/i.test(rel(f) + c.slice(0, 1000)); });
if (truncationHits.length) fail(`Possible public country/title truncation: ${truncationHits.map(rel).join(", ")}`); else pass("Public country/title truncation guard passed");

console.log("\n[6] Critical card clipping");
const clipping = sourceFiles.filter((f) => { const c = readSafe(f); return c.includes("data-critical-card") && !c.includes("ms-allow-critical-overflow-hidden") && /data-critical-card[\s\S]{0,240}overflow-hidden/.test(c); });
if (clipping.length) fail(`Critical card clipping: ${clipping.map(rel).join(", ")}`); else pass("Critical cards avoid overflow clipping");

console.log("\n[7] Secret/client boundary");
const clientSecretHits = sourceFiles.filter((f) => { const c = readSafe(f); return /^["']use client["']/m.test(c) && /SUPABASE_SERVICE_ROLE_KEY|service_role|service-role/i.test(c) && !rel(f).includes("/api/"); });
if (clientSecretHits.length) fail(`Service-role reference in client code: ${clientSecretHits.map(rel).join(", ")}`); else pass("No service-role references in client code");
const passwordHits = productionFiles.filter((f) => { const n = rel(f); if (/repair-operator-accounts|create-founder-user|provision-tiffany/.test(n)) return false; return /(password|temp_password)\s*[:=]\s*["'][^"']{6,}["']/i.test(readSafe(f)); });
if (passwordHits.length) fail(`Possible hardcoded password: ${passwordHits.map(rel).join(", ")}`); else pass("No hardcoded password literals found");

console.log("\n[8] Architecture control plane");
const architectureValidator = join(ROOT, "scripts", "validate-architecture-control-plane.mjs");
if (!existsSync(architectureValidator)) fail("Architecture control-plane validator missing"); else pass("Architecture control-plane validator present");

if (failures > 0) {
  console.error(`\n✗ Validation FAILED — ${failures} issue(s).\n`);
  process.exit(1);
}
console.log("\n✓ All Milano Seal validation checks passed.\n");
