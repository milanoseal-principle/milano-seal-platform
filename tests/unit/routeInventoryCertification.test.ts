import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  CERTIFICATION_LEVELS,
  HISTORICAL_ROUTE_BASELINE,
  REQUIRED_SECURITY_CASES,
  type RouteInventory,
} from "@/lib/routes/routeRegistry";
// Untyped .mjs helper shared with the CI validator (typed below).
import * as inventoryLib from "../../scripts/lib/route-inventory.mjs";

const lib = inventoryLib as {
  buildRouteInventory: (root: string, opts?: { previous?: unknown; baselinePaths?: string[] }) => Promise<RouteInventory>;
  serializeInventory: (inventory: RouteInventory) => string;
  evidenceProblems: (entry: Record<string, unknown>, ctx: Record<string, unknown>) => string[];
  certifyRecord: (record: Record<string, unknown>, evidence: unknown[], ctx: Record<string, unknown>) => { level: string; validEvidence: string[] };
  readProxyModel: (root: string) => unknown;
  evidenceRoots: (sourcePath: string, layouts: string[], proxyApplies: boolean) => string[];
  createGraph: (root: string) => {
    closure: (rels: string[]) => { modules: string[]; packages: string[] };
    fingerprint: (closure: { modules: string[]; packages: string[] }) => string;
  };
  SECURITY_CASES: string[];
  CERTIFICATION_LEVELS: string[];
};

const root = process.cwd();
let cached: Promise<RouteInventory> | null = null;
const inventory = () => (cached ??= lib.buildRouteInventory(root));
const byId = async (id: string) => {
  const record = (await inventory()).routes.find((r) => r.id === id);
  assert.ok(record, `missing ${id}`);
  return record;
};

test("committed inventory matches current source (drift detection)", async () => {
  const committed = readFileSync(join(root, "lib/routes/routeInventory.generated.json"), "utf8");
  assert.equal(lib.serializeInventory(await inventory()), committed);
});

test("every current route file has exactly one record and the historical baseline is preserved", async () => {
  const inv = await inventory();
  const atHead = inv.routes.filter((r) => r.historical.presentAtHead);
  assert.equal(new Set(atHead.map((r) => r.sourcePath)).size, atHead.length);
  assert.equal(new Set(atHead.map((r) => r.id)).size, atHead.length);
  assert.equal(inv.historicalBaseline.commit, HISTORICAL_ROUTE_BASELINE.commit);
  assert.equal(inv.routes.filter((r) => r.historical.inBaseline).length, HISTORICAL_ROUTE_BASELINE.routeFileCount);
  for (const r of inv.routes) {
    assert.ok(["L0", "L1", "UNKNOWN"].includes(r.certification.level) || r.certification.validEvidence.length > 0);
  }
});

test("a baseline route removed at HEAD is retained as removed_at_head, never dropped", async () => {
  const inv = await lib.buildRouteInventory(root, {
    previous: null,
    baselinePaths: ["app/api/retired-example/route.ts", "app/pricing/page.tsx"],
  });
  const retired = inv.routes.find((r) => r.sourcePath === "app/api/retired-example/route.ts");
  assert.ok(retired);
  assert.equal(retired.lifecycle, "removed_at_head");
  assert.deepEqual(retired.historical, { inBaseline: true, presentAtHead: false });
  assert.equal(retired.certification.level, "UNKNOWN");
  assert.equal(inv.routes.find((r) => r.url === "/pricing")?.historical.inBaseline, true);
  assert.equal(inv.routes.find((r) => r.url === "/")?.historical.inBaseline, false);
});

test("access classification follows the rules proxy.ts and in-route guards enforce", async () => {
  const pay = await byId("api:/api/deals/[id]/pay");
  assert.equal(pay.access, "in_route_guard");
  assert.equal(pay.accessSource, "static_heuristic");
  assert.equal(pay.recordScope, "matter_param");
  assert.ok(pay.integrations.includes("wise"));
  assert.ok(pay.testReferences.includes("tests/unit/paymentAuthorization.test.ts"));

  const ledger = await byId("page:/dashboard/ledger");
  assert.equal(ledger.access, "operator");
  assert.equal(ledger.accessSource, "proxy");
  assert.deepEqual(ledger.roles, ["admin", "operator", "owner"]);

  for (const id of ["api:/api/intelligence/generate", "api:/api/intel"]) {
    assert.equal((await byId(id)).access, "operator", id);
  }
  assert.equal((await byId("api:/api/portal/me")).access, "authenticated");
  assert.equal((await byId("api:/api/webhooks/wise")).access, "signed_webhook");
  assert.equal((await byId("page:/login")).access, "public_auth_flow");
  // Re-exported handlers are classified by the module that implements them.
  assert.equal((await byId("api:/api/deals/[id]/payment/confirm-final")).access, "in_route_guard");
  // A protected page no role may reach is reported, not hidden.
  assert.equal((await byId("page:/workspace/release")).access, "denied_all_roles");
  assert.equal((await byId("page:/alliance/apply")).access, "public");
});

test("an unguarded public API is UNKNOWN (L0), never assumed public", async () => {
  const assistant = await byId("api:/api/assistant");
  assert.equal(assistant.access, "UNKNOWN");
  assert.equal(assistant.certification.level, "L0");
  assert.deepEqual(assistant.certification.nextLevelBlockers, ["ACCESS_UNCLASSIFIED"]);
});

test("registration is not certification: nothing is above L1 without evidence", async () => {
  const inv = await inventory();
  assert.deepEqual([...CERTIFICATION_LEVELS], lib.CERTIFICATION_LEVELS);
  assert.deepEqual([...REQUIRED_SECURITY_CASES], lib.SECURITY_CASES);
  const evidence = JSON.parse(readFileSync(join(root, "lib/routes/routeCertificationEvidence.json"), "utf8")).evidence;
  const certified = inv.routes.filter((r) => ["L2", "L3", "L4", "L5", "L6"].includes(r.certification.level));
  if (evidence.length === 0) assert.equal(certified.length, 0);
  for (const r of certified) {
    assert.ok((r.certification.validEvidence as string[]).includes(r.certification.level));
  }
});

const ctx = {
  sourceSha256: "a".repeat(64),
  dependencySha256: "b".repeat(64),
  fileExists: (p: string) => p === "tests/unit/paymentAuthorization.test.ts",
};
const base = {
  routeId: "api:/api/deals/[id]/pay",
  commit: "ffababc6",
  evidenceDate: "2026-11-25",
  approvedBy: "release-owner",
  sourceSha256: ctx.sourceSha256,
  dependencySha256: ctx.dependencySha256,
  testIds: ["tests/unit/paymentAuthorization.test.ts"],
};
const record = { id: base.routeId, access: "in_route_guard" };

test("evidence is bound to current source and dependency hashes; stale evidence never promotes", () => {
  assert.deepEqual(lib.evidenceProblems({ ...base, level: "L2" }, ctx), []);
  assert.equal(lib.certifyRecord(record, [{ ...base, level: "L2" }], ctx).level, "L2");

  const staleSource = { ...base, level: "L2", sourceSha256: "c".repeat(64) };
  assert.match(lib.evidenceProblems(staleSource, ctx).join(), /route source changed/);
  assert.equal(lib.certifyRecord(record, [staleSource], ctx).level, "L1");

  const staleDeps = { ...base, level: "L2", dependencySha256: "c".repeat(64) };
  assert.match(lib.evidenceProblems(staleDeps, ctx).join(), /dependency graph changed/);

  const missingTest = { ...base, level: "L2", testIds: ["tests/unit/nope.test.ts"] };
  assert.match(lib.evidenceProblems(missingTest, ctx).join(), /test not found/);

  const unapproved = { ...base, level: "L2", approvedBy: "" };
  assert.match(lib.evidenceProblems(unapproved, ctx).join(), /missing approvedBy/);

  for (const level of ["L0", "L1"]) {
    assert.match(lib.evidenceProblems({ ...base, level }, ctx).join(), /derived, never claimed/);
  }
});

test("levels are cumulative and L3 requires every security case", () => {
  const l3Partial = { ...base, level: "L3", cases: ["anonymous", "permitted_role"] };
  assert.match(lib.evidenceProblems(l3Partial, ctx).join(), /L3 requires case expired_session/);
  const l3 = { ...base, level: "L3", cases: [...REQUIRED_SECURITY_CASES] };
  assert.deepEqual(lib.evidenceProblems(l3, ctx), []);
  // L3 evidence without L2 evidence does not skip a level.
  assert.equal(lib.certifyRecord(record, [l3], ctx).level, "L1");
  assert.equal(lib.certifyRecord(record, [{ ...base, level: "L2" }, l3], ctx).level, "L3");
  // An UNKNOWN-access route cannot be promoted by evidence at all.
  assert.equal(lib.certifyRecord({ ...record, access: "UNKNOWN" }, [{ ...base, level: "L2" }, l3], ctx).level, "L0");
  const l5 = { ...base, level: "L5", cases: [...REQUIRED_SECURITY_CASES, "authenticated_workflow"] };
  assert.match(lib.evidenceProblems(l5, ctx).join(), /L5 requires deployment/);
  assert.match(lib.evidenceProblems(l5, ctx).join(), /L5 requires case recovery/);
});

test("the access model fails closed when proxy.ts changes shape", () => {
  const dir = mkdtempSync(join(tmpdir(), "route-inventory-"));
  try {
    cpSync(join(root, "proxy.ts"), join(dir, "proxy.ts"));
    assert.doesNotThrow(() => lib.readProxyModel(dir));
    const source = readFileSync(join(dir, "proxy.ts"), "utf8");
    writeFileSync(join(dir, "proxy.ts"), source.replace('  "/api/admin",\n', ""));
    assert.throws(() => lib.readProxyModel(dir), /no longer contains \/api\/admin/);
    writeFileSync(join(dir, "proxy.ts"), source.replace(/const PROTECTED_PREFIXES[\s\S]*?\];/, ""));
    assert.throws(() => lib.readProxyModel(dir), /cannot read PROTECTED_PREFIXES/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  assert.equal(createHash("sha256").update("").digest("hex").length, 64);
});

test("dependency fingerprint changes when a dependency's implementation changes with identical imports", () => {
  const dir = mkdtempSync(join(tmpdir(), "route-fingerprint-"));
  const write = (rel: string, text: string) => {
    mkdirSync(join(dir, rel, ".."), { recursive: true });
    writeFileSync(join(dir, rel), text);
  };
  const fingerprintOf = () => {
    const graph = lib.createGraph(dir);
    const closure = graph.closure(["app/api/x/route.ts"]);
    return { closure, hash: graph.fingerprint(closure) };
  };
  try {
    write("app/api/x/route.ts", 'import { allow } from "@/lib/guard";\nexport function POST() { return allow(); }\n');
    write("lib/guard.ts", 'import { z } from "zod";\nexport const allow = () => z.string().safeParse("x").success;\n');
    write("package-lock.json", JSON.stringify({ packages: { "node_modules/zod": { version: "3.0.0" } } }));
    const before = fingerprintOf();
    assert.deepEqual(before.closure, { modules: ["app/api/x/route.ts", "lib/guard.ts"], packages: ["zod"] });

    // Same imports, different implementation (e.g. a weakened authorization check).
    write("lib/guard.ts", 'import { z } from "zod";\nexport const allow = () => true;\n');
    const edited = fingerprintOf();
    assert.deepEqual(edited.closure, before.closure);
    assert.notEqual(edited.hash, before.hash);

    // Same code, different resolved package version.
    write("package-lock.json", JSON.stringify({ packages: { "node_modules/zod": { version: "3.0.1" } } }));
    assert.notEqual(fingerprintOf().hash, edited.hash);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("proxy enforcement is part of the evidence fingerprint for proxy-covered routes", () => {
  assert.deepEqual(lib.evidenceRoots("app/api/intelligence/generate/route.ts", [], true), [
    "app/api/intelligence/generate/route.ts",
    "proxy.ts",
  ]);
  assert.deepEqual(lib.evidenceRoots("app/sitemap.xml/route.ts", [], false), ["app/sitemap.xml/route.ts"]);

  // The route imports none of the proxy's modules; editing the proxy's
  // disabled-account check must still change the fingerprint.
  const graph = lib.createGraph(root);
  const roots = lib.evidenceRoots("app/api/intelligence/generate/route.ts", [], true);
  const closure = graph.closure(roots);
  for (const m of ["proxy.ts", "lib/auth/roleRedirect.ts", "lib/auth/server-role.ts"]) {
    assert.ok(closure.modules.includes(m), m);
  }
  assert.ok(!graph.closure(["app/api/intelligence/generate/route.ts"]).modules.includes("proxy.ts"));

  const dir = mkdtempSync(join(tmpdir(), "route-proxy-fingerprint-"));
  try {
    mkdirSync(join(dir, "app/api/x"), { recursive: true });
    mkdirSync(join(dir, "lib/auth"), { recursive: true });
    writeFileSync(join(dir, "app/api/x/route.ts"), "export function GET() { return 1; }\n");
    writeFileSync(join(dir, "proxy.ts"), 'import { isAccountDisabled } from "@/lib/auth/server-role";\nexport const proxy = isAccountDisabled;\n');
    writeFileSync(join(dir, "lib/auth/server-role.ts"), "export const isAccountDisabled = (u: { disabled?: boolean }) => !!u.disabled;\n");
    const hash = () => {
      const g = lib.createGraph(dir);
      return g.fingerprint(g.closure(lib.evidenceRoots("app/api/x/route.ts", [], true)));
    };
    const before = hash();
    writeFileSync(join(dir, "lib/auth/server-role.ts"), "export const isAccountDisabled = (_u: { disabled?: boolean }) => false;\n");
    assert.notEqual(hash(), before);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("dependency graph honors exact tsconfig path aliases before the @/* fallback", () => {
  const graph = lib.createGraph(root);
  const pricing = graph.closure(["app/api/admin/pricing/quote/route.ts"]).modules;
  assert.ok(pricing.includes("lib/pricing/canonicalFacade.ts"));
  assert.ok(pricing.includes("lib/pricing/pricingComposer.ts"));

  const dir = mkdtempSync(join(tmpdir(), "route-alias-"));
  try {
    mkdirSync(join(dir, "app/api/q"), { recursive: true });
    mkdirSync(join(dir, "lib/price"), { recursive: true });
    writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({
      compilerOptions: { paths: { "@/lib/price": ["./lib/price/facade.ts"], "@/*": ["./*"] } },
    }));
    writeFileSync(join(dir, "app/api/q/route.ts"), 'import { calc } from "@/lib/price";\nexport function POST() { return calc(); }\n');
    writeFileSync(join(dir, "lib/price.ts"), "export const legacy = 1;\n");
    writeFileSync(join(dir, "lib/price/facade.ts"), "export const calc = () => 1;\n");
    const hash = () => {
      const g = lib.createGraph(dir);
      const closure = g.closure(["app/api/q/route.ts"]);
      return { modules: closure.modules, hash: g.fingerprint(closure) };
    };
    const before = hash();
    assert.deepEqual(before.modules, ["app/api/q/route.ts", "lib/price/facade.ts"]);
    writeFileSync(join(dir, "lib/price/facade.ts"), "export const calc = () => 0;\n");
    assert.notEqual(hash().hash, before.hash);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("imported JSON data is part of the dependency closure and fingerprint", () => {
  // Gitignored generated data is represented by its generator and committed
  // inputs, never by whichever build output happens to be on disk.
  const graph = lib.createGraph(root);
  const commandCenter = graph.closure(["app/dashboard/command-center/page.tsx"]).modules;
  assert.ok(commandCenter.includes("scripts/generate-command-center-workbook-intelligence.mjs"));
  assert.ok(commandCenter.includes("Milano_Seal_Command_Center_OS_v3_BRANDED_Damiani_3rd_DAMIANI50_Prefill.xlsx"));
  assert.ok(!commandCenter.includes("data/command-center/workbook-intelligence.generated.json"));

  const dir = mkdtempSync(join(tmpdir(), "route-json-"));
  try {
    mkdirSync(join(dir, "app/api/d"), { recursive: true });
    mkdirSync(join(dir, "data"), { recursive: true });
    writeFileSync(join(dir, "app/api/d/route.ts"), 'import limits from "@/data/limits.json";\nexport function GET() { return limits; }\n');
    // Data that merely contains import-like text must not be parsed as code.
    writeFileSync(join(dir, "data/limits.json"), JSON.stringify({ max: 5, note: 'import x from "@/lib/nope"' }));
    const hash = () => {
      const g = lib.createGraph(dir);
      const closure = g.closure(["app/api/d/route.ts"]);
      return { modules: closure.modules, hash: g.fingerprint(closure) };
    };
    const before = hash();
    assert.deepEqual(before.modules, ["app/api/d/route.ts", "data/limits.json"]);
    writeFileSync(join(dir, "data/limits.json"), JSON.stringify({ max: 500, note: "" }));
    assert.notEqual(hash().hash, before.hash);

    // An unresolvable data import fails closed instead of silently dropping.
    writeFileSync(join(dir, "app/api/d/route.ts"), 'import gone from "@/data/missing.generated.json";\nexport function GET() { return gone; }\n');
    assert.throws(() => lib.createGraph(dir).closure(["app/api/d/route.ts"]), /cannot resolve data import/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("every commercialInventory entry reconciles to its route record by declared file", async () => {
  const { REVENUE_BEARING_PUBLIC_ROUTES } = await import("@/lib/routes/commercialInventory");
  const inv = await inventory();
  for (const entry of REVENUE_BEARING_PUBLIC_ROUTES) {
    const record = inv.routes.find((r) => r.sourcePath === entry.file);
    assert.ok(record, `no route record for ${entry.file}`);
    assert.equal(record.revenueLane, entry.category, entry.route);
    assert.ok(record.registryReferences.includes(`commercialInventory:${entry.category}`), entry.route);
  }
  // Template routes reconcile through the file, not the literal URL.
  assert.equal((await byId("page:/countries/[country]")).revenueLane, "country");
  assert.equal((await byId("page:/sarasota/apostille-services")).revenueLane, "local");
});
