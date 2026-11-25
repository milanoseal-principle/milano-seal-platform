import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import {
  INVENTORY_PATH,
  buildRouteInventory,
  handlerMethods as explicitHandlerMethods,
  serializeInventory,
} from "./lib/route-inventory.mjs";

const ROOT = process.cwd();
const APP_DIR = join(ROOT, "app");
const OUTPUT_FILE = join(ROOT, "docs", "ROUTE_MAP.md");
const CHECK_MODE = process.argv.includes("--check");
// `--fingerprint <routeId>` prints the current sourceSha256 / dependencySha256 an
// L2+ evidence entry in lib/routes/routeCertificationEvidence.json must carry.
const FINGERPRINT_ROUTE = process.argv.includes("--fingerprint") ? process.argv[process.argv.indexOf("--fingerprint") + 1] : null;

const CRITICAL_ROUTES = [
  "/",
  "/intake",
  "/professional/damiani",
  "/today",
  "/dashboard",
  "/dashboard/control-plane",
  "/dashboard/control-plane/board-room",
  "/api/dashboard/control-plane/governance",
  "/api/dashboard/control-plane/governance/run",
  "/api/dashboard/control-plane/governance/metrics",
  "/api/cron/governance",
  "/dashboard/reconciliation",
  "/dashboard/matters/[matterId]/truth",
  "/dashboard/pipeline",
  "/dashboard/needs-review",
  "/dashboard/follow-ups",
  "/dashboard/apostille",
  "/dashboard/courier",
  "/dashboard/ledger",
  "/dashboard/authorities/verify",
  "/workspace/release",
  "/portal",
  "/portal/payment",
  "/portal/documents",
  "/portal/invoice",
  "/portal/release",
  "/portal/tracking",
  "/api/health",
  "/api/intake",
  "/api/webhooks/wise",
  "/api/dashboard/operator-intelligence",
];

const PAGE_FILE_RE = /^page\.(?:js|jsx|ts|tsx)$/;
const ROUTE_FILE_RE = /^route\.(?:js|ts)$/;
const HTTP_METHODS = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];

function fail(message) {
  console.error(`FAIL route-map: ${message}`);
  process.exit(1);
}

function walk(dir, output = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, output);
      continue;
    }
    if (PAGE_FILE_RE.test(entry.name) || ROUTE_FILE_RE.test(entry.name)) output.push(fullPath);
  }
  return output;
}

function cleanSegment(segment) {
  if (!segment) return null;
  if (segment.startsWith("@")) return null;
  if (segment.startsWith("(") && segment.endsWith(")")) return null;
  return segment.replace(/^\(\.\.\.\)/, "").replace(/^\(\.\.\)/, "").replace(/^\(\.\)/, "");
}

function routeFromFile(fullPath) {
  const appRelative = relative(APP_DIR, fullPath).split(sep).join("/");
  const withoutLeaf = appRelative.replace(/\/?(?:page\.(?:js|jsx|ts|tsx)|route\.(?:js|ts))$/, "");
  const segments = withoutLeaf.split("/").map(cleanSegment).filter(Boolean);
  return segments.length ? `/${segments.join("/")}` : "/";
}

function escapeCell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function handlerMethods(fullPath) {
  const methods = explicitHandlerMethods(fullPath, readFileSync(fullPath, "utf8"));
  if (!methods.length) fail(`no explicit HTTP method exports in ${relative(ROOT, fullPath)}`);
  return methods.join(", ");
}

if (!existsSync(APP_DIR)) fail("app/ directory not found");

const discovered = new Map();
for (const fullPath of walk(APP_DIR)) {
  const route = routeFromFile(fullPath);
  const repoPath = relative(ROOT, fullPath).split(sep).join("/");
  const leaf = fullPath.split(sep).at(-1) ?? "";
  const kind = PAGE_FILE_RE.test(leaf) ? "PAGE" : "API";
  const routeShape = route.split("/").map((segment) => {
    if (segment.startsWith("[[...")) return "[[...]]";
    if (segment.startsWith("[...")) return "[...]";
    if (segment.startsWith("[")) return "[]";
    return segment;
  }).join("/");
  const previous = discovered.get(routeShape);
  if (previous) fail(`duplicate normalized route ${route}: ${previous.file} and ${repoPath}`);
  const methods = kind === "API" ? handlerMethods(fullPath) : "Page";
  discovered.set(routeShape, { route, file: repoPath, kind, methods });
}

const inventory = [...discovered.values()].sort((a, b) => a.file < b.file ? -1 : a.file > b.file ? 1 : 0);
const byRoute = new Map(inventory.map((row) => [row.route, row]));
const pageCount = inventory.filter((row) => row.kind === "PAGE").length;
const rows = CRITICAL_ROUTES.map((route) => {
  const record = byRoute.get(route);
  if (!record) fail(`required production route missing from code: ${route}`);
  return record;
});

// Certification level per source file comes from the route registry inventory
// (lib/routes/routeRegistry.ts; scripts/lib/route-inventory.mjs): L0 discovered,
// L1 registered with an access classification, L2+ only from approved evidence.
const routeInventory = await buildRouteInventory(ROOT);
if (FINGERPRINT_ROUTE) {
  const fingerprint = routeInventory.fingerprints.get(FINGERPRINT_ROUTE);
  if (!fingerprint) fail(`unknown route id ${FINGERPRINT_ROUTE}`);
  console.log(JSON.stringify({ routeId: FINGERPRINT_ROUTE, ...fingerprint }, null, 2));
  process.exit(0);
}
const levelBySource = new Map(routeInventory.routes.map((record) => [record.sourcePath, record.certification.level]));
const inventoryFile = join(ROOT, INVENTORY_PATH);
const inventoryText = serializeInventory(routeInventory);

const generated = `# The Milano Seal™ — Generated Canonical Route Map

> **AUTO-GENERATED — DO NOT HAND EDIT**
>
> Generate: \`node scripts/generate-route-map.mjs\`  
> Validate: \`node scripts/generate-route-map.mjs --check\`

## Purpose

This registry is generated from current \`app/**/page.*\` and \`app/**/route.*\` source files.
It protects the production-critical Milano Seal client, operator, payment, intake, Matter Truth, reconciliation, release and Wise surfaces from documentation drift.

## Production-Critical Routes

| Route | Kind | Source File |
|---|---|---|
${rows.map((row) => `| \`${escapeCell(row.route)}\` | ${escapeCell(row.kind)} | \`${escapeCell(row.file)}\` |`).join("\n")}

## Application Route Inventory

${inventory.length} source files (${pageCount} pages and ${inventory.length - pageCount} handlers).
The source path identifies each record. Handler methods list explicit exports, including named re-exports. Next.js may supply implicit methods.
Evidence levels come from the route registry (\`lib/routes/routeRegistry.ts\`, full records in \`lib/routes/routeInventory.generated.json\`): L0 discovered; L1 registered with an access classification, which is not certification; L2–L6 only from approved, source-bound evidence in \`lib/routes/routeCertificationEvidence.json\`.

| Route | Kind | Explicit handler methods | Source file | Evidence level |
|---|---|---|---|---|
${inventory.map((row) => `| \`${escapeCell(row.route)}\` | ${row.kind} | ${row.methods} | \`${escapeCell(row.file)}\` | ${levelBySource.get(row.file) ?? "UNKNOWN"} |`).join("\n")}

## Governance

- Never manually label a production-critical route as missing.
- Add/remove the underlying source route, then regenerate this file.
- Vercel production validation fails when this file drifts from source.
- \`/today\` is a read-only Milano Operator Intelligence surface.
- \`/dashboard/control-plane\` is the canonical platform meta-governance and system-registry surface.
- \`/dashboard/reconciliation\` is the canonical read-only cross-domain discrepancy surface.
- \`/dashboard/matters/[matterId]/truth\` is the operator Matter Truth inspection surface and does not own canonical state.
- \`/portal/payment\` remains canonical-Matter and Wise-reconciliation driven.
- \`/api/webhooks/wise\` is the canonical production Wise webhook.
- Live TIFF and Damiani acceptance remain mandatory after code/deployment validation.
`;

if (CHECK_MODE) {
  if (!existsSync(OUTPUT_FILE)) fail("docs/ROUTE_MAP.md does not exist; regenerate it");
  const existing = readFileSync(OUTPUT_FILE, "utf8");
  if (existing !== generated) {
    console.error("FAIL route-map: docs/ROUTE_MAP.md does not match the current application route inventory.");
    console.error("Run: node scripts/generate-route-map.mjs");
    process.exit(1);
  }
  if (!existsSync(inventoryFile) || readFileSync(inventoryFile, "utf8") !== inventoryText) {
    console.error(`FAIL route-map: ${INVENTORY_PATH} does not match current app routes, access rules or certification evidence.`);
    console.error("Run: node scripts/generate-route-map.mjs  (then review the diff: new/removed routes, access, level changes)");
    process.exit(1);
  }
  console.log(`PASS route-map: ${inventory.length} source files and ${rows.length} critical routes match source; route inventory matches source`);
  process.exit(0);
}

mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
writeFileSync(OUTPUT_FILE, generated, "utf8");
writeFileSync(inventoryFile, inventoryText, "utf8");
console.log(`GENERATED docs/ROUTE_MAP.md from ${inventory.length} source files and ${INVENTORY_PATH}`);
