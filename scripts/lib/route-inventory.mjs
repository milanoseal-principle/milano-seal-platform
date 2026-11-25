// Full route inventory + L0–L6 certification for lib/routes/routeRegistry.ts.
//
// Invoked by the canonical route walker (scripts/generate-route-map.mjs) and by
// scripts/validate-route-registry.mjs. It is NOT a second registry: it derives
// one record per current app/**/page.* and app/**/route.* file and reconciles
// it with the existing registries (routeRegistry lists, moduleRegistry,
// touchpointRegistry, systemRegistry, commercialInventory) and with the access
// rules proxy.ts actually enforces.
//
// Honesty rules (Master Engineering Directive §02):
//  - Unknown stays "UNKNOWN". Nothing is guessed to fill a field.
//  - Fields derived by static source reading are labelled static_heuristic.
//  - Registration is not certification: L0 discovered and L1 registered
//    (access classified) are derived; L2–L6 come ONLY from explicit evidence
//    in lib/routes/routeCertificationEvidence.json, bound to the route's
//    current source hash and dependency-graph hash. Evidence for an older
//    source is stale and is ignored (never promotes).
//  - Historical baseline records are preserved; a route removed at HEAD stays
//    in the inventory as removed_at_head instead of disappearing.

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

export const INVENTORY_PATH = "lib/routes/routeInventory.generated.json";
export const EVIDENCE_PATH = "lib/routes/routeCertificationEvidence.json";
export const HISTORICAL_BASELINE_COMMIT = "93ce11c18c8bab4a2ac515dcbcc4a68aa4df0263";
export const VENTURE = "milano-seal";

export const CERTIFICATION_LEVELS = ["L0", "L1", "L2", "L3", "L4", "L5", "L6"];
export const SECURITY_CASES = [
  "anonymous",
  "expired_session",
  "permitted_role",
  "forbidden_role",
  "cross_tenant",
  "mutation",
];

const PAGE_RE = /^page\.(?:js|jsx|ts|tsx)$/;
const ROUTE_RE = /^route\.(?:js|jsx|ts|tsx)$/;
const LAYOUT_RE = /^layout\.(?:js|jsx|ts|tsx)$/;
const HTTP_METHODS = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const SOURCE_EXTS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
// Imported runtime data: part of a route's behavior and its evidence fingerprint,
// but never parsed for imports.
const DATA_EXTS = [".json"];

const SESSION_GUARD_RE =
  /\brequire\w*(?:Access|Operator|Admin|Role|Professional|Read|User|Client|Session)\s*\(|\bauthorize[A-Z]\w*\s*\(|\b(?:getCurrentClientDeal|getAllClientDeals|getAuthUser|isRouteAllowedForRole)\s*\(|\.auth\.getUser\s*\(|\bverify\w*Capability\s*\(/;
const SIGNATURE_GUARD_RE = /\bverify\w*(?:Signature|Hmac|WebhookAuth)\s*\(/;
const CRON_GUARD_RE = /\bCRON_SECRET\b/;
const ENV_GATE_RE =
  /\brequireDemoMode\s*\(|NODE_ENV\s*===\s*["']production["'][\s\S]{0,240}status:\s*40[34]|VERCEL_ENV\s*===\s*["']production["'][\s\S]{0,240}status:\s*40[34]/;

const INTEGRATION_RULES = [
  { id: "wise", local: /(^|\/)wise/i },
  { id: "shippo", local: /shippo/i },
  { id: "bluenotary", local: /bluenotary/i },
  { id: "resend", pkg: /^resend$/, local: /(^|\/)resend/i },
  { id: "anthropic", pkg: /^@anthropic-ai\// },
  { id: "search_console", local: /search-?console/i },
  { id: "supabase_service_role", local: /^lib\/supabase\/admin\./ },
  { id: "supabase", pkg: /^@supabase\// },
];

// ---------------------------------------------------------------- utilities

const sha256 = (text) => createHash("sha256").update(text).digest("hex");
const posix = (p) => p.split(sep).join("/");
const uniqSorted = (items) => [...new Set(items)].sort();

function readText(root, rel) {
  const abs = join(root, rel);
  return existsSync(abs) ? readFileSync(abs, "utf8") : "";
}

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/[^\n]*/g, "$1");
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function cleanSegment(segment) {
  if (!segment || segment.startsWith("@")) return null;
  if (segment.startsWith("(") && segment.endsWith(")")) return null;
  return segment.replace(/^\(\.\.\.\)/, "").replace(/^\(\.\.\)/, "").replace(/^\(\.\)/, "");
}

/** Same URL rule as scripts/generate-route-map.mjs routeFromFile. */
export function urlFromAppPath(appRelative) {
  const withoutLeaf = appRelative.replace(/\/?(?:page|route)\.(?:js|jsx|ts|tsx)$/, "");
  const segments = withoutLeaf.split("/").map(cleanSegment).filter(Boolean);
  return segments.length ? `/${segments.join("/")}` : "/";
}

export function isRouteFile(path) {
  return /^app\/(?:.*\/)?(?:page|route)\.(?:js|jsx|ts|tsx)$/.test(path);
}

function stringLiterals(block) {
  return [...block.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

function constArray(source, name) {
  const match = source.match(new RegExp(`const ${name}\\s*=\\s*(?:new Set\\()?\\[([\\s\\S]*?)\\]`));
  if (!match) throw Error(`route-inventory: cannot read ${name} from proxy.ts`);
  return stringLiterals(stripComments(match[1]));
}

// ------------------------------------------------------- proxy access model

/**
 * The access rules proxy.ts enforces, read from its source (proxy.ts exports
 * only `proxy` and `config`). Fails loudly if the shape changes so the
 * inventory can never silently fall back to "public".
 */
export function readProxyModel(root) {
  const source = readText(root, "proxy.ts");
  if (!source) throw Error("route-inventory: proxy.ts not found");
  const model = {
    protectedPrefixes: constArray(source, "PROTECTED_PREFIXES"),
    publicAuthPaths: constArray(source, "PUBLIC_AUTH_PATHS"),
    publicAuthPrefixes: constArray(source, "PUBLIC_AUTH_PREFIXES"),
    publicFunnelPaths: constArray(source, "PUBLIC_FUNNEL_PATHS"),
    apiRoleRules: [],
  };
  // Each `if ((pathname.startsWith("X") || pathname === "Y") && !isRouteAllowedForRole("HOME", role))`.
  const body = stripComments(source);
  for (const match of body.matchAll(/!isRouteAllowedForRole\(\s*"([^"]+)"\s*,\s*role\s*\)/g)) {
    const start = body.lastIndexOf("if (", match.index);
    const condition = body.slice(start, match.index);
    const exact = [...condition.matchAll(/pathname\s*===\s*"([^"]+)"/g)].map((m) => m[1]);
    const prefixes = [...condition.matchAll(/pathname\.startsWith\(\s*"([^"]+)"\s*\)/g)].map((m) => m[1]);
    if (!exact.length && !prefixes.length) continue;
    model.apiRoleRules.push({ roleHome: match[1], exact, prefixes });
  }
  for (const required of ["/dashboard", "/portal", "/api/admin"]) {
    if (!model.protectedPrefixes.includes(required)) {
      throw Error(`route-inventory: proxy.ts PROTECTED_PREFIXES no longer contains ${required}; update the access model`);
    }
  }
  if (!model.apiRoleRules.some((rule) => rule.roleHome === "/dashboard")) {
    throw Error("route-inventory: cannot read the operator API rule from proxy.ts");
  }
  const matcher = body.match(/matcher:\s*\[\s*"([^"]+)"/);
  if (!matcher) throw Error("route-inventory: cannot read proxy config.matcher");
  model.matcher = new RegExp(`^${matcher[1].replace(/\\\\/g, "\\")}$`);
  return model;
}

function proxyCovers(model, url) {
  return model.matcher.test(url);
}

function proxyProtects(model, url) {
  if (!proxyCovers(model, url)) return false;
  if (model.publicAuthPaths.includes(url)) return false;
  if (model.publicAuthPrefixes.some((p) => url.startsWith(p))) return false;
  if (model.publicFunnelPaths.includes(url)) return false;
  return model.protectedPrefixes.some((p) => url === p || url.startsWith(`${p}/`));
}

/**
 * Modules whose behavior certification evidence is bound to: the route, its
 * ancestor layouts and, whenever proxy.ts runs for the URL, the proxy and its
 * own dependency graph (role rules, disabled-account checks, session client).
 * A change to any of them must invalidate L2+ evidence.
 */
export function evidenceRoots(sourcePath, ancestorLayouts, proxyApplies) {
  return [sourcePath, ...ancestorLayouts, ...(proxyApplies ? ["proxy.ts"] : [])];
}

// ----------------------------------------------------- dependency graph

const aliasCache = new Map();

/**
 * tsconfig.json compilerOptions.paths, resolved as TypeScript does: an exact
 * (non-wildcard) pattern wins, otherwise the wildcard pattern with the longest
 * prefix. E.g. "@/lib/pricing" -> lib/pricing/canonicalFacade.ts, not lib/pricing.ts.
 */
export function readPathAliases(root) {
  if (aliasCache.has(root)) return aliasCache.get(root);
  let paths = { "@/*": ["./*"] };
  let baseUrl = ".";
  const configPath = join(root, "tsconfig.json");
  if (existsSync(configPath)) {
    const { config, error } = ts.readConfigFile(configPath, ts.sys.readFile);
    if (error) throw Error(`route-inventory: cannot read tsconfig.json paths (${ts.flattenDiagnosticMessageText(error.messageText, " ")})`);
    if (config?.compilerOptions?.paths) paths = config.compilerOptions.paths;
    if (config?.compilerOptions?.baseUrl) baseUrl = config.compilerOptions.baseUrl;
  }
  const aliases = Object.entries(paths).map(([pattern, targets]) => {
    const star = pattern.indexOf("*");
    return {
      exact: star === -1,
      prefix: star === -1 ? pattern : pattern.slice(0, star),
      suffix: star === -1 ? "" : pattern.slice(star + 1),
      targets: targets.map((t) => posix(join(baseUrl, t))),
    };
  });
  aliasCache.set(root, aliases);
  return aliases;
}

function aliasBases(root, spec) {
  const aliases = readPathAliases(root);
  const exact = aliases.find((a) => a.exact && a.prefix === spec);
  if (exact) return exact.targets;
  const wildcard = aliases
    .filter((a) => !a.exact && spec.startsWith(a.prefix) && spec.endsWith(a.suffix) && spec.length >= a.prefix.length + a.suffix.length)
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];
  if (!wildcard) return null;
  const captured = spec.slice(wildcard.prefix.length, spec.length - wildcard.suffix.length);
  return wildcard.targets.map((t) => t.replace("*", captured));
}

/**
 * Gitignored data generated before dev/test/typecheck/build. Its presence on disk
 * depends on whether a local build ran, so the graph never reads it: an import
 * of it resolves to the generator and its committed inputs instead, which fully
 * determine its content (deterministic in CI, Vercel and locally).
 */
export const GENERATED_DATA_PROVENANCE = {
  "data/command-center/workbook-intelligence.generated.json": [
    "scripts/generate-command-center-workbook-intelligence.mjs",
    "Milano_Seal_Command_Center_OS_v3_BRANDED_Damiani_3rd_DAMIANI50_Prefill.xlsx",
  ],
};

/** Local files an import stands for ([] when it is not a local import). */
function resolveTargets(root, fromRel, spec) {
  const bases = spec.startsWith(".") ? [posix(join(dirname(fromRel), spec))] : aliasBases(root, spec);
  if (!bases) return [];
  for (const base of bases) {
    const candidates = [base, ...SOURCE_EXTS.map((e) => base + e), ...SOURCE_EXTS.map((e) => `${base}/index${e}`)];
    for (const candidate of candidates) {
      const provenance = GENERATED_DATA_PROVENANCE[candidate];
      if (provenance) {
        for (const input of provenance) {
          if (!existsSync(join(root, input))) throw Error(`route-inventory: generated-data input missing: ${input}`);
        }
        return provenance;
      }
      const abs = join(root, candidate);
      if (existsSync(abs) && statSync(abs).isFile() && [...SOURCE_EXTS, ...DATA_EXTS].some((e) => candidate.endsWith(e))) return [candidate];
    }
  }
  if (DATA_EXTS.some((e) => spec.endsWith(e))) {
    // Fail closed: an unresolvable data import would otherwise drop silently.
    throw Error(`route-inventory: cannot resolve data import "${spec}" from ${fromRel}; declare it in GENERATED_DATA_PROVENANCE if it is generated`);
  }
  return [];
}

function resolveLocal(root, fromRel, spec) {
  return resolveTargets(root, fromRel, spec)[0] ?? null;
}

function importSpecifiers(source) {
  const code = stripComments(source);
  const specs = [];
  const patterns = [
    /\bimport\s+(?!type\b)(?:[\s\S]*?\sfrom\s*)?["']([^"']+)["']/g,
    /\bexport\s+(?!type\b)[\s\S]*?\sfrom\s*["']([^"']+)["']/g,
    /\bimport\(\s*["']([^"']+)["']\s*\)/g,
    /\brequire\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const re of patterns) for (const m of code.matchAll(re)) specs.push(m[1]);
  return specs;
}

function packageName(spec) {
  if (spec.startsWith("node:")) return null;
  const parts = spec.split("/");
  return spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

export function createGraph(root) {
  const cache = new Map();
  const direct = (rel) => {
    if (cache.has(rel)) return cache.get(rel);
    const entry = { local: [], packages: [] };
    cache.set(rel, entry);
    // Only source modules are parsed for imports; data and binary inputs are hashed only.
    const specs = SOURCE_EXTS.some((e) => rel.endsWith(e)) ? importSpecifiers(readText(root, rel)) : [];
    for (const spec of specs) {
      const targets = resolveTargets(root, rel, spec);
      if (targets.length) entry.local.push(...targets);
      else if (!spec.startsWith(".") && !aliasBases(root, spec)) {
        const pkg = packageName(spec);
        if (pkg) entry.packages.push(pkg);
      }
    }
    entry.local = uniqSorted(entry.local);
    entry.packages = uniqSorted(entry.packages);
    return entry;
  };
  const closure = (rels) => {
    const seen = new Set();
    const packages = new Set();
    const stack = [...rels];
    while (stack.length) {
      const rel = stack.pop();
      if (seen.has(rel)) continue;
      seen.add(rel);
      const d = direct(rel);
      d.packages.forEach((p) => packages.add(p));
      d.local.forEach((l) => stack.push(l));
    }
    return { modules: [...seen].sort(), packages: [...packages].sort() };
  };
  // Evidence fingerprint: every transitive module's CONTENT and every package's
  // resolved (lockfile) version, so an implementation change in a dependency
  // invalidates evidence even when the import graph is unchanged.
  const contentHashes = new Map();
  const lock = (() => {
    try {
      return JSON.parse(readText(root, "package-lock.json")).packages ?? {};
    } catch {
      return {};
    }
  })();
  const fingerprint = ({ modules, packages }) =>
    sha256(
      JSON.stringify({
        modules: modules.map((m) => {
          if (!contentHashes.has(m)) contentHashes.set(m, createHash("sha256").update(readFileSync(join(root, m))).digest("hex"));
          return [m, contentHashes.get(m)];
        }),
        packages: packages.map((p) => [p, lock[`node_modules/${p}`]?.version ?? "UNRESOLVED"]),
      }),
    );
  return { direct, closure, fingerprint };
}

// ------------------------------------------------- existing registries

function idBoundRoutes(source, keyPattern) {
  // Assign each href/route literal to the nearest preceding key in its object.
  const out = [];
  const keys = [...source.matchAll(new RegExp(`\\b${keyPattern}:\\s*"([^"]+)"`, "g"))];
  const routes = [...source.matchAll(/\b(?:href|route):\s*"(\/[^"]*)"/g)];
  for (const r of routes) {
    const key = keys.filter((k) => k.index < r.index).at(-1);
    if (key) out.push({ key: key[1], route: r[1] });
  }
  return out;
}

function readRegistries(root) {
  const routeRegistry = readText(root, "lib/routes/routeRegistry.ts");
  const listOf = (name) => {
    const m = routeRegistry.match(new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\] as const`));
    return m ? stringLiterals(m[1]) : [];
  };
  const moduleSource = readText(root, "lib/internal/moduleRegistry.ts");
  const modules = [];
  for (const block of moduleSource.match(/\{[^{}]*\bhref:\s*"[^"]+"[^{}]*\}/g) ?? []) {
    const id = block.match(/\bid:\s*"([^"]+)"/)?.[1];
    const href = block.match(/\bhref:\s*"([^"]+)"/)?.[1];
    const status = block.match(/\bstatus:\s*"([^"]+)"/)?.[1];
    if (id && href) modules.push({ id, href, status: status ?? "UNKNOWN" });
  }
  const systemSource = readText(root, "lib/control-plane/systemRegistry.ts");
  const authorities = idBoundRoutes(systemSource, "id");
  const authoritySources = [];
  for (const m of systemSource.matchAll(/\bid:\s*"([^"]+)"[^{}]*?sourcePaths:\s*\[([^\]]*)\]/g)) {
    for (const p of stringLiterals(m[2])) authoritySources.push({ key: m[1], path: p });
  }
  const touchpoints = idBoundRoutes(readText(root, "lib/access/touchpointRegistry.ts"), "role");
  const commercial = [...readText(root, "lib/routes/commercialInventory.ts").matchAll(
    /route:\s*"([^"]+)",\s*file:\s*"([^"]+)",\s*category:\s*"(\w+)"/g,
  )].map((m) => ({ route: m[1], file: m[2], category: m[3] }));
  const criticalBlock = readText(root, "scripts/generate-route-map.mjs").match(/const CRITICAL_ROUTES = \[([\s\S]*?)\];/);
  return {
    publicLive: listOf("PUBLIC_LIVE_ROUTES"),
    internalDashboard: listOf("INTERNAL_DASHBOARD_ROUTES"),
    stagedAuthority: listOf("STAGED_AUTHORITY_ROUTES"),
    modules,
    authorities,
    authoritySources,
    touchpoints,
    commercial,
    critical: criticalBlock ? stringLiterals(criticalBlock[1]) : [],
  };
}

// ------------------------------------------------------------ evidence

export function loadEvidence(root) {
  const text = readText(root, EVIDENCE_PATH);
  if (!text) throw Error(`route-inventory: ${EVIDENCE_PATH} is missing`);
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed.evidence)) throw Error(`route-inventory: ${EVIDENCE_PATH} must contain an "evidence" array`);
  return parsed.evidence;
}

/** Why an evidence entry does not hold for the route as it exists now ([] = valid). */
export function evidenceProblems(entry, context) {
  const problems = [];
  const levelIndex = CERTIFICATION_LEVELS.indexOf(entry.level);
  if (levelIndex < 2) problems.push("level must be L2–L6 (L0/L1 are derived, never claimed)");
  for (const field of ["commit", "evidenceDate", "approvedBy", "sourceSha256", "dependencySha256"]) {
    if (typeof entry[field] !== "string" || !entry[field].trim()) problems.push(`missing ${field}`);
  }
  if (entry.sourceSha256 && entry.sourceSha256 !== context.sourceSha256) problems.push("stale: route source changed since evidence");
  if (entry.dependencySha256 && entry.dependencySha256 !== context.dependencySha256) problems.push("stale: dependency graph changed since evidence");
  const tests = Array.isArray(entry.testIds) ? entry.testIds : [];
  if (!tests.length) problems.push("missing testIds");
  for (const test of tests) if (!context.fileExists(test)) problems.push(`test not found: ${test}`);
  const cases = new Set(Array.isArray(entry.cases) ? entry.cases : []);
  if (levelIndex >= 3) for (const c of SECURITY_CASES) if (!cases.has(c)) problems.push(`L3 requires case ${c}`);
  if (levelIndex >= 4 && !cases.has("authenticated_workflow")) problems.push("L4 requires case authenticated_workflow");
  if (levelIndex >= 5) {
    if (typeof entry.deployment !== "string" || !entry.deployment.trim()) problems.push("L5 requires deployment");
    if (!cases.has("recovery")) problems.push("L5 requires case recovery");
  }
  if (levelIndex >= 6 && (typeof entry.commercialEvidence !== "string" || !entry.commercialEvidence.trim())) {
    problems.push("L6 requires commercialEvidence");
  }
  return problems;
}

export function certifyRecord(record, evidence, context) {
  const entries = evidence.filter((e) => e.routeId === record.id);
  const valid = new Set();
  const stale = [];
  for (const entry of entries) {
    const problems = evidenceProblems(entry, context);
    if (problems.length) stale.push({ level: entry.level, problems });
    else valid.add(entry.level);
  }
  let level = record.access === "UNKNOWN" ? "L0" : "L1";
  if (level === "L1") {
    for (const next of CERTIFICATION_LEVELS.slice(2)) {
      if (!valid.has(next)) break;
      level = next;
    }
  }
  const nextLevel = CERTIFICATION_LEVELS[CERTIFICATION_LEVELS.indexOf(level) + 1] ?? null;
  const nextLevelBlockers =
    level === "L0"
      ? ["ACCESS_UNCLASSIFIED"]
      : nextLevel
        ? [`NO_VALID_${nextLevel}_EVIDENCE`]
        : [];
  return {
    level,
    validEvidence: CERTIFICATION_LEVELS.filter((l) => valid.has(l)),
    invalidEvidence: stale,
    nextLevelBlockers,
  };
}

// ------------------------------------------------------------- builder

function historicalBaselinePaths(root, previous) {
  try {
    const out = execFileSync("git", ["ls-tree", "-r", "--name-only", HISTORICAL_BASELINE_COMMIT, "--", "app"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 64 * 1024 * 1024,
    });
    return { source: "git", paths: new Set(out.split("\n").filter(isRouteFile)) };
  } catch {
    // Shallow CI checkouts do not contain the historical commit: the committed
    // inventory carries the baseline membership forward.
    if (!previous) throw Error("route-inventory: historical baseline unavailable (no git history and no committed inventory)");
    return {
      source: "committed_inventory",
      paths: new Set(previous.routes.filter((r) => r.historical?.inBaseline).map((r) => r.sourcePath)),
    };
  }
}

function accessFor(url, kind, scanText, proxyModel, roles, isAllowed) {
  const guards = [];
  if (SIGNATURE_GUARD_RE.test(scanText)) guards.push("signature");
  if (CRON_GUARD_RE.test(scanText)) guards.push("cron_secret");
  if (SESSION_GUARD_RE.test(scanText)) guards.push("session_or_capability");
  if (ENV_GATE_RE.test(scanText)) guards.push("environment_gate");

  if (proxyModel.publicAuthPaths.includes(url) || proxyModel.publicAuthPrefixes.some((p) => url.startsWith(p))) {
    return { access: "public_auth_flow", accessSource: "proxy", roles: [], guards };
  }
  if (proxyProtects(proxyModel, url)) {
    if (kind === "api") {
      // Mirrors proxy.ts exactly (`pathname === X` / `pathname.startsWith(X)`).
      const rule = proxyModel.apiRoleRules.find(
        (r) => r.exact.includes(url) || r.prefixes.some((p) => url.startsWith(p)),
      );
      if (rule) {
        const allowed = roles.filter((role) => isAllowed(rule.roleHome, role));
        const operatorOnly = rule.roleHome === "/dashboard";
        return { access: operatorOnly ? "operator" : "role_scoped", accessSource: "proxy", roles: allowed, guards };
      }
      return { access: "authenticated", accessSource: "proxy", roles: ["any_authenticated"], guards };
    }
    const allowed = roles.filter((role) => isAllowed(url, role));
    if (!allowed.length) return { access: "denied_all_roles", accessSource: "proxy", roles: [], guards };
    const operatorFamily = allowed.every((r) => ["operator", "admin", "owner"].includes(r));
    return { access: operatorFamily ? "operator" : "role_scoped", accessSource: "proxy", roles: allowed, guards };
  }
  if (guards.includes("signature")) return { access: "signed_webhook", accessSource: "static_heuristic", roles: [], guards };
  if (guards.includes("cron_secret")) return { access: "cron_secret", accessSource: "static_heuristic", roles: [], guards };
  if (guards.includes("session_or_capability")) return { access: "in_route_guard", accessSource: "static_heuristic", roles: ["UNKNOWN"], guards };
  if (guards.includes("environment_gate")) return { access: "environment_gated", accessSource: "static_heuristic", roles: [], guards };
  if (kind === "page") return { access: "public", accessSource: "static_heuristic", roles: [], guards };
  // A public API handler with no recognized guard is not assumed to be public by design.
  return { access: "UNKNOWN", accessSource: "none", roles: ["UNKNOWN"], guards };
}

function exposureFor(access) {
  if (access === "UNKNOWN") return "UNKNOWN";
  if (["public", "public_auth_flow"].includes(access)) return "public";
  if (["signed_webhook", "cron_secret", "environment_gated"].includes(access)) return "machine";
  if (access === "operator" || access === "denied_all_roles") return "internal";
  return "authenticated";
}

/**
 * Explicit HTTP method exports of a route handler, read from the TypeScript AST
 * (named functions, variables and named re-exports; type-only exports and
 * default exports excluded). Shared with scripts/generate-route-map.mjs so the
 * route map and the registry can never disagree. Pages list no explicit methods.
 */
export function handlerMethods(fileName, source) {
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest);
  const exported = new Set();
  for (const statement of file.statements) {
    if (ts.isExportDeclaration(statement)) {
      const clause = statement.exportClause;
      if (clause && ts.isNamedExports(clause) && !statement.isTypeOnly) {
        for (const specifier of clause.elements) if (!specifier.isTypeOnly) exported.add(specifier.name.text);
      }
      continue;
    }
    if (!statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue;
    if (statement.modifiers.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) continue;
    if (ts.isFunctionDeclaration(statement) && statement.name) exported.add(statement.name.text);
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) exported.add(declaration.name.text);
      }
    }
  }
  return HTTP_METHODS.filter((method) => exported.has(method));
}

function lifecycleFor(url, registries, moduleMatch) {
  if (registries.publicLive.includes(url)) return "public_live";
  if (registries.internalDashboard.includes(url)) return "internal_noindex";
  if (registries.stagedAuthority.includes(url)) return "staged_noindex";
  if (moduleMatch) return `module_${moduleMatch.status}`;
  return "UNKNOWN";
}

export async function buildRouteInventory(root = process.cwd(), { previous, baselinePaths } = {}) {
  const appDir = join(root, "app");
  if (!existsSync(appDir)) throw Error("route-inventory: app/ not found");
  const prior = previous === undefined ? readPreviousInventory(root) : previous;
  const proxyModel = readProxyModel(root);
  const registries = readRegistries(root);
  const evidence = loadEvidence(root);
  const graph = createGraph(root);
  const { tsImport } = await import("tsx/esm/api");
  const roleModule = await tsImport(pathToFileURL(join(root, "lib/auth/roleRedirect.ts")).href, import.meta.url);
  const roles = Object.keys(roleModule.roleHomeRoute).sort();
  const isAllowed = roleModule.isRouteAllowedForRole;

  const allFiles = walk(appDir).map((f) => posix(relative(root, f)));
  const routeFiles = allFiles.filter(isRouteFile).sort();
  const layouts = new Set(allFiles.filter((f) => LAYOUT_RE.test(f.split("/").at(-1))));
  const tests = ["tests", "lib", "components"]
    .filter((dir) => existsSync(join(root, dir)))
    .flatMap((dir) => walk(join(root, dir)))
    .map((f) => posix(relative(root, f)))
    .filter((f) => /\.(?:test|spec)\.(?:ts|tsx|mjs|js)$/.test(f))
    .sort()
    .map((path) => ({ path, text: readText(root, path) }));
  const baseline = baselinePaths
    ? { source: "provided", paths: new Set(baselinePaths) }
    : historicalBaselinePaths(root, prior);

  const urls = new Set(routeFiles.map((f) => urlFromAppPath(f.slice("app/".length))));
  const routes = [];
  for (const sourcePath of routeFiles) {
    const leaf = sourcePath.split("/").at(-1);
    const kind = PAGE_RE.test(leaf) ? "page" : ROUTE_RE.test(leaf) ? "api" : "UNKNOWN";
    const url = urlFromAppPath(sourcePath.slice("app/".length));
    const source = readText(root, sourcePath);
    const code = stripComments(source);

    // Ancestor layouts guard every page beneath them.
    const ancestorLayouts = [];
    if (kind === "page") {
      let dir = dirname(sourcePath);
      while (dir.startsWith("app")) {
        for (const ext of ["tsx", "ts", "jsx", "js"]) if (layouts.has(`${dir}/layout.${ext}`)) ancestorLayouts.push(`${dir}/layout.${ext}`);
        dir = dirname(dir);
      }
    }
    // A handler re-exported from another module (`export { POST } from "../x/route"`)
    // is guarded by that module's source, so scan it too.
    const reExported = [...code.matchAll(/\bexport\s*(?:\{[^}]*\}|\*)\s*from\s*["']([^"']+)["']/g)]
      .map((m) => resolveLocal(root, sourcePath, m[1]))
      .filter(Boolean)
      .map((rel) => stripComments(readText(root, rel)));
    const scanText = [code, ...reExported, ...ancestorLayouts.filter((l) => l !== "app/layout.tsx").map((l) => stripComments(readText(root, l)))].join("\n");
    const access = accessFor(url, kind, scanText, proxyModel, roles, isAllowed);

    const direct = graph.direct(sourcePath);
    const closure = graph.closure([sourcePath, ...ancestorLayouts]);
    const integrations = INTEGRATION_RULES.filter(
      (rule) =>
        (rule.local && closure.modules.some((m) => rule.local.test(m))) ||
        (rule.pkg && closure.packages.some((p) => rule.pkg.test(p))),
    ).map((rule) => rule.id);
    const dependencySha256 = graph.fingerprint(
      graph.closure(evidenceRoots(sourcePath, ancestorLayouts, proxyCovers(proxyModel, url))),
    );

    const tables = uniqSorted([...code.matchAll(/\.from\(\s*["'`]([\w.-]+)["'`]\s*\)/g)].map((m) => m[1]));
    const rpcs = uniqSorted([...code.matchAll(/\.rpc\(\s*["'`](\w+)["'`]/g)].map((m) => m[1]));
    const writes = /\.(?:insert|update|upsert|delete)\(/.test(code) || rpcs.length > 0;
    const rls = closure.modules.some((m) => /^lib\/supabase\/admin\./.test(m))
      ? "service_role_bypass"
      : closure.modules.some((m) => /^lib\/supabase\/(?:server|client)\./.test(m))
        ? "user_session_rls"
        : "none_detected";
    const params = [...url.matchAll(/\[\[?(?:\.\.\.)?([^\]]+)\]\]?/g)].map((m) => m[1]);
    const recordScope = params.some((p) => /^(?:id|dealId|deal_id|matterId|matter_id|matterRef|caseId|ref)$/i.test(p))
      ? "matter_param"
      : tables.some((t) => /^(?:deals|matters?|matter_\w+)$/.test(t))
        ? "matter_data"
        : "UNKNOWN";

    let parent = null;
    for (let p = url; p !== "/"; ) {
      p = p.slice(0, p.lastIndexOf("/")) || "/";
      if (urls.has(p)) {
        parent = p;
        break;
      }
    }
    const redirect = source.split("\n").length <= 30
      ? code.match(/\b(?:permanentRedirect|redirect)\(\s*["'`]([^"'`$]+)["'`]/)?.[1] ?? null
      : null;

    const exactModule = registries.modules.find((m) => m.href === url);
    const prefixModule = registries.modules
      .filter((m) => m.href !== "/" && url.startsWith(`${m.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0];
    // A systemRegistry sourcePaths entry owns a route only when it names the file or a
    // specific route directory (app/x/y); umbrella claims such as "app/api" are not ownership.
    const ownsSource = (a) =>
      a.path === sourcePath || (a.path.split("/").length >= 3 && sourcePath.startsWith(`${a.path}/`));
    const authorityBySource = registries.authoritySources.find(ownsSource)?.key;
    const authorityByRoute = registries.authorities
      .filter((a) => (a.route === "/" ? url === "/" : url === a.route || url.startsWith(`${a.route}/`)))
      .sort((a, b) => b.route.length - a.route.length)[0]?.key;
    const canonicalModule = authorityBySource ?? authorityByRoute ?? exactModule?.id ?? prefixModule?.id ?? "UNKNOWN";

    // commercialInventory names each entry's governing page file; template routes
    // (/countries/:country, /:city/apostille-services) only match by that file.
    const commercialEntries = registries.commercial.filter((c) => c.file === sourcePath || c.route === url);
    const registryReferences = uniqSorted([
      ...(registries.publicLive.includes(url) ? ["routeRegistry:PUBLIC_LIVE_ROUTES"] : []),
      ...(registries.internalDashboard.includes(url) ? ["routeRegistry:INTERNAL_DASHBOARD_ROUTES"] : []),
      ...(registries.stagedAuthority.includes(url) ? ["routeRegistry:STAGED_AUTHORITY_ROUTES"] : []),
      ...registries.modules.filter((m) => m.href === url).map((m) => `moduleRegistry:${m.id}`),
      ...registries.authorities.filter((a) => a.route === url).map((a) => `systemRegistry:${a.key}`),
      ...registries.authoritySources.filter(ownsSource).map((a) => `systemRegistry:${a.key}`),
      ...registries.touchpoints.filter((t) => t.route === url).map((t) => `touchpointRegistry:${t.key}`),
      ...commercialEntries.map((c) => `commercialInventory:${c.category}`),
      ...(registries.critical.includes(url) ? ["routeMap:CRITICAL_ROUTES"] : []),
    ]);
    const revenueLane = commercialEntries[0]?.category ?? "UNKNOWN";

    const sourceNoExt = sourcePath.replace(/\.(?:js|jsx|ts|tsx)$/, "");
    const staticUrl = params.length === 0 && url !== "/";
    const testReferences = tests
      .filter((t) => t.text.includes(sourceNoExt) || (staticUrl && new RegExp(`["'\`]${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'\`?]`).test(t.text)))
      .map((t) => t.path);

    const record = {
      id: `${kind}:${url}`,
      venture: VENTURE,
      kind,
      url,
      sourcePath,
      methods: kind === "api" ? handlerMethods(sourcePath, source) : [],
      dynamicParams: params,
      parent,
      canonicalModule,
      registryReferences,
      redirectTo: redirect,
      lifecycle: lifecycleFor(url, registries, exactModule),
      exposure: exposureFor(access.access),
      access: access.access,
      accessSource: access.accessSource,
      guards: access.guards,
      roles: access.roles,
      workspaceGrants: "UNKNOWN",
      entitlement: "UNKNOWN",
      recordScope,
      dataOperations: { tables, rpcs, writes, source: "static_heuristic" },
      rls,
      dependencies: {
        directLocal: direct.local,
        directPackages: direct.packages,
        transitiveModuleCount: closure.modules.length,
      },
      integrations,
      testReferences,
      deployment: "UNKNOWN",
      evidenceDate: null,
      customer: "UNKNOWN",
      revenueLane,
      owner: "UNKNOWN",
      historical: { inBaseline: baseline.paths.has(sourcePath), presentAtHead: true },
    };
    record.certification = certifyRecord(record, evidence, {
      sourceSha256: sha256(source),
      dependencySha256,
      fileExists: (p) => existsSync(join(root, p)),
    });
    routes.push(record);
  }

  // Preserve historical records whose source no longer exists at HEAD.
  const present = new Set(routes.map((r) => r.sourcePath));
  const retained = [];
  const priorBySource = new Map((prior?.routes ?? []).map((r) => [r.sourcePath, r]));
  for (const path of [...baseline.paths].sort()) {
    if (present.has(path)) continue;
    const old = priorBySource.get(path);
    const leaf = path.split("/").at(-1);
    const kind = PAGE_RE.test(leaf) ? "page" : "api";
    const url = urlFromAppPath(path.slice("app/".length));
    retained.push({
      ...(old ?? { id: `${kind}:${url}`, venture: VENTURE, kind, url, sourcePath: path }),
      lifecycle: "removed_at_head",
      historical: { inBaseline: true, presentAtHead: false },
      certification: { level: "UNKNOWN", validEvidence: [], invalidEvidence: [], nextLevelBlockers: ["NOT_PRESENT_AT_HEAD"] },
    });
  }

  const all = [...routes, ...retained].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : a.sourcePath < b.sourcePath ? -1 : 1));
  const count = (pred) => all.filter(pred).length;
  const byLevel = Object.fromEntries(["UNKNOWN", ...CERTIFICATION_LEVELS].map((l) => [l, count((r) => r.certification.level === l)]));
  const byAccess = {};
  for (const r of all) byAccess[r.access ?? "UNKNOWN"] = (byAccess[r.access ?? "UNKNOWN"] ?? 0) + 1;
  return {
    schemaVersion: 1,
    generatedBy: "scripts/generate-route-map.mjs",
    venture: VENTURE,
    historicalBaseline: {
      commit: HISTORICAL_BASELINE_COMMIT,
      routeFileCount: baseline.paths.size,
      source: "Master Engineering Directive §03 (historical tree)",
    },
    summary: {
      routeFilesAtHead: routes.length,
      pages: count((r) => r.historical.presentAtHead && r.kind === "page"),
      apiHandlers: count((r) => r.historical.presentAtHead && r.kind === "api"),
      historicalPresentAtHead: count((r) => r.historical.inBaseline && r.historical.presentAtHead),
      historicalRemovedAtHead: retained.length,
      addedSinceBaseline: count((r) => !r.historical.inBaseline),
      byAccess: Object.fromEntries(Object.entries(byAccess).sort()),
      byLevel,
    },
    routes: all,
  };
}

export function readPreviousInventory(root) {
  const text = readText(root, INVENTORY_PATH);
  return text ? JSON.parse(text) : null;
}

/** Deterministic serialization: one route record per line for reviewable diffs. */
export function serializeInventory(inventory) {
  const { routes, ...head } = inventory;
  const headJson = JSON.stringify(head, null, 2);
  const body = routes.map((r) => `    ${JSON.stringify(r)}`).join(",\n");
  return `${headJson.slice(0, -2)},\n  "routes": [\n${body}\n  ]\n}\n`;
}
