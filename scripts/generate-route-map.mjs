import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, sep } from "node:path";

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

    if (PAGE_FILE_RE.test(entry.name) || ROUTE_FILE_RE.test(entry.name)) {
      output.push(fullPath);
    }
  }

  return output;
}

function cleanSegment(segment) {
  if (!segment) return null;
  if (segment.startsWith("@")) return null;
  if (segment.startsWith("(") && segment.endsWith(")")) return null;

  return segment
    .replace(/^\(\.\.\.\)/, "")
    .replace(/^\(\.\.\)/, "")
    .replace(/^\(\.\)/, "");
}

function routeFromFile(fullPath) {
  const appRelative = relative(APP_DIR, fullPath)
    .split(sep)
    .join("/");

  const withoutLeaf = appRelative.replace(
    /\/?(?:page\.(?:js|jsx|ts|tsx)|route\.(?:js|ts))$/,
    "",
  );

  const segments = withoutLeaf
    .split("/")
    .map(cleanSegment)
    .filter(Boolean);

  return segments.length ? `/${segments.join("/")}` : "/";
}

function escapeCell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

if (!existsSync(APP_DIR)) {
  fail("app/ directory not found");
}

const discovered = new Map();

for (const fullPath of walk(APP_DIR)) {
  const route = routeFromFile(fullPath);
  const repoPath = relative(ROOT, fullPath).split(sep).join("/");
  const leaf = fullPath.split(sep).at(-1) ?? "";
  const kind = PAGE_FILE_RE.test(leaf) ? "PAGE" : "API";

  if (!discovered.has(route)) {
    discovered.set(route, { route, file: repoPath, kind });
  }
}

const rows = CRITICAL_ROUTES.map((route) => {
  const record = discovered.get(route);
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
It protects the production-critical Milano Seal client, operator, payment, intake, release and Wise surfaces from documentation drift.

The complete application route tree remains the source of truth for every non-critical route.
This document does not replace role authorization, the canonical Matter state machine, execution truth, Wise reconciliation, RLS, or live transaction certification.

## Production-Critical Routes

| Route | Kind | Source File |
|---|---|---|
${rows
  .map(
    (row) =>
      `| \`${escapeCell(row.route)}\` | ${escapeCell(row.kind)} | \`${escapeCell(row.file)}\` |`,
  )
  .join("\n")}

## Governance

- Never manually label a production-critical route as missing.
- Add/remove the underlying source route, then regenerate this file.
- Vercel production validation fails when this file drifts from source.
- \`/today\` is a read-only Milano Operator Intelligence surface.
- \`/dashboard/control-plane\` is the canonical platform meta-governance and system-registry surface.
- \`/portal/payment\` remains canonical-Matter and Wise-reconciliation driven.
- \`/api/webhooks/wise\` is the canonical production Wise webhook.
- Live TIFF and Damiani acceptance remain mandatory after code/deployment validation.
`;

if (CHECK_MODE) {
  if (!existsSync(OUTPUT_FILE)) {
    fail("docs/ROUTE_MAP.md does not exist; regenerate it");
  }

  const existing = readFileSync(OUTPUT_FILE, "utf8");

  if (existing !== generated) {
    console.error(
      "FAIL route-map: docs/ROUTE_MAP.md does not match current production-critical routes.",
    );
    console.error("Run: node scripts/generate-route-map.mjs");
    process.exit(1);
  }

  console.log(`PASS route-map: ${rows.length} production-critical routes match source`);
  process.exit(0);
}

mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
writeFileSync(OUTPUT_FILE, generated, "utf8");
console.log(`GENERATED docs/ROUTE_MAP.md from ${rows.length} production-critical routes`);
