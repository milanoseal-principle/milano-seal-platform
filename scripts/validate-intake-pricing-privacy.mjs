#!/usr/bin/env node
// Public Smart Intake pricing privacy.
//
// 1. SOURCE GRAPH: walks every static import reachable from the public intake
//    entry points and fails if any private pricing implementation is reachable.
//    The only pricing module the browser graph may touch is the logic-free
//    lib/pricing/intakeQuotePreviewTypes.ts.
// 2. SERVER BOUNDARY: the canonical chain runs in lib/pricing/intakeQuotePreview.ts
//    behind app/api/intake/quote-preview, and that module is imported by server
//    routes only.
// 3. BUNDLE (when a production build exists): no browser chunk contains the
//    private engine's distinctive strings or the TIFFTEST codes. DAMIANI50 is
//    allowed only in the governed dedicated Damiani professional route chunk.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, normalize } from "node:path";

const ENTRY_POINTS = [
  "components/intake/smart-intake-sop-wizard.tsx",
  "app/intake/page.tsx",
  "components/landing/service-router.tsx",
  "components/conversion/CommercialCtaRow.tsx",
];
const ALLOWED_PRICING = new Set(["lib/pricing/intakeQuotePreviewTypes.ts"]);
const PRIVATE = /^(lib\/pricing(\/|\.ts$)|lib\/pricing\.ts$)/;
const EXTENSIONS = ["", ".ts", ".tsx", ".js", ".mjs", "/index.ts", "/index.tsx"];
const failures = [];

function resolveImport(from, spec) {
  let base;
  if (spec.startsWith("@/")) base = spec.slice(2);
  else if (spec.startsWith(".")) base = normalize(join(dirname(from), spec)).replaceAll("\\", "/");
  else return null; // package import
  for (const ext of EXTENSIONS) {
    const candidate = base + ext;
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function importsOf(file) {
  const source = readFileSync(file, "utf8");
  const specs = [];
  // Static and type imports/exports; `import type` is erased at build time but
  // is still checked here so a private module can never become reachable later.
  for (const match of source.matchAll(/(?:import|export)\s[^"';]*?from\s*["']([^"']+)["']|import\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g)) {
    specs.push(match[1] ?? match[2] ?? match[3]);
  }
  return specs;
}

// Server-only modules end the walk: the public graph may reference a route
// module path as a URL string, but never import server code.
const seen = new Set();
const stack = ENTRY_POINTS.map((file) => [file, [file]]);
while (stack.length) {
  const [file, chain] = stack.pop();
  if (seen.has(file)) continue;
  seen.add(file);
  if (PRIVATE.test(file) && !ALLOWED_PRICING.has(file)) {
    failures.push(`public intake graph reaches private pricing: ${chain.join(" -> ")}`);
    continue;
  }
  for (const spec of importsOf(file)) {
    const target = resolveImport(file, spec);
    if (target && !seen.has(target)) stack.push([target, [...chain, target]]);
  }
}

const types = readFileSync("lib/pricing/intakeQuotePreviewTypes.ts", "utf8");
if (/^\s*import\s/m.test(types)) failures.push("intakeQuotePreviewTypes.ts must not import anything");
const boundary = readFileSync("lib/pricing/intakeQuotePreview.ts", "utf8");
for (const token of ["classifyIntake", "priceSmartIntake", "projectClientPricing", ".strict()"]) {
  if (!boundary.includes(token)) failures.push(`server boundary missing ${token}`);
}
const route = readFileSync("app/api/intake/quote-preview/route.ts", "utf8");
if (!/buildIntakeQuotePreview/.test(route)) failures.push("quote-preview route does not use the server boundary");
if (/\.from\(|insert\(|update\(/.test(route)) failures.push("quote-preview route must be stateless (no database writes)");

// Who imports the server boundary? Only server route files.
function walk(dir, out = [], pattern = /\.(tsx?|mjs)$/) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const path = join(dir, name).replaceAll("\\", "/");
    if (statSync(path).isDirectory()) walk(path, out, pattern);
    else if (pattern.test(name)) out.push(path);
  }
  return out;
}
for (const file of [...walk("app"), ...walk("components"), ...walk("lib")]) {
  const source = readFileSync(file, "utf8");
  if (!/["']@\/lib\/pricing\/intakeQuotePreview["']/.test(source)) continue;
  const server = /^app\/api\/.+\/route\.ts$/.test(file) && !/^\s*["']use client["']/m.test(source);
  if (!server) failures.push(`server pricing boundary imported outside a server route: ${file}`);
}

// Bundle scan (only meaningful after `next build`).
const ENGINE_STRINGS = [
  "Apostille coordination quote issued after review.",
  "Procurement quote issued after review.",
  "_state_unresolved",
];
let bundle = "NOT_RUN (no .next/static build present)";
if (existsSync(".next/static/chunks")) {
  const chunks = walk(".next/static/chunks", [], /\.js$/);
  if (chunks.length === 0) failures.push("build output exists but no browser chunks were found to scan");
  for (const chunk of chunks) {
    const source = readFileSync(chunk, "utf8");
    for (const s of ENGINE_STRINGS) if (source.includes(s)) failures.push(`browser chunk ${chunk} contains private pricing engine string: ${s}`);
    for (const code of ["TIFFTEST50", "TIFFTEST99"]) if (source.includes(code)) failures.push(`browser chunk ${chunk} contains ${code}`);
    if (source.includes("DAMIANI50") && !source.includes("Avv. Damiani")) failures.push(`browser chunk ${chunk} contains DAMIANI50 outside the governed Damiani route`);
  }
  bundle = `${chunks.length} browser chunks scanned`;
}

if (failures.length) {
  console.error("Intake pricing privacy FAILED:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log(`PASS intake pricing privacy: ${seen.size} modules in the public intake graph, no private pricing reachable; server boundary isolated; bundle: ${bundle}`);
