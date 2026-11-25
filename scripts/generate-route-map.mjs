import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const APP_DIR = join(ROOT, "app");
const OUTPUT_FILE = join(ROOT, "docs", "ROUTE_MAP.md");
const CHECK_MODE = process.argv.includes("--check");

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
  const source = ts.createSourceFile(fullPath, readFileSync(fullPath, "utf8"), ts.ScriptTarget.Latest);
  const exports = new Set();
  for (const statement of source.statements) {
    if (ts.isExportDeclaration(statement)) {
      const clause = statement.exportClause;
      if (clause && ts.isNamedExports(clause) && !statement.isTypeOnly) {
        for (const specifier of clause.elements) {
          if (!specifier.isTypeOnly) exports.add(specifier.name.text);
        }
      }
      continue;
    }
    if (!statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue;
    if (statement.modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword)) continue;
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      exports.add(statement.name.text);
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) exports.add(declaration.name.text);
      }
    }
  }
  const methods = HTTP_METHODS.filter((method) => exports.has(method));
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
Every row carries L0 discovery evidence. Higher levels require reviewed ownership, dependency, access, workflow, recovery, or commercial evidence.

| Route | Kind | Explicit handler methods | Source file | Evidence level |
|---|---|---|---|---|
${inventory.map((row) => `| \`${escapeCell(row.route)}\` | ${row.kind} | ${row.methods} | \`${escapeCell(row.file)}\` | L0 |`).join("\n")}

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
  console.log(`PASS route-map: ${inventory.length} source files and ${rows.length} critical routes match source`);
  process.exit(0);
}

mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
writeFileSync(OUTPUT_FILE, generated, "utf8");
console.log(`GENERATED docs/ROUTE_MAP.md from ${inventory.length} source files`);
