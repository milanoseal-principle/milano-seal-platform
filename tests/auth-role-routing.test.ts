import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import {
  normalizeUserRole,
  getHomeRouteForRole,
  isRouteAllowedForRole,
  DENIED_ROUTE,
} from "../lib/auth/roleRedirect";

// ── Canonical role source: no user_metadata role authorization anywhere ──────
test("no authorization code reads role/permissions from user_metadata", () => {
  const hits = execSync(
    "grep -rnE 'user_metadata\\??\\.(role|permissions)' app lib proxy.ts --include=*.ts --include=*.tsx || true",
  )
    .toString()
    .trim();
  assert.equal(hits, "", `user_metadata authorization reads remain:\n${hits}`);
});

test("proxy reads role from app_metadata only", () => {
  const proxy = readFileSync("proxy.ts", "utf8");
  assert.ok(/app_metadata\?\.role/.test(proxy));
  assert.ok(!/user_metadata\??\.\s*role/.test(proxy));
});

test("canonical guards route through resolveServerRole", () => {
  for (const f of ["lib/dashboardAuth.ts", "lib/vaAuth.ts", "lib/allianceAuth.ts"]) {
    assert.ok(/resolveServerRole/.test(readFileSync(f, "utf8")), `${f} must use resolveServerRole`);
  }
});

// ── Role normalization matrix (spec roles) ───────────────────────────────────
test("all spec roles normalize to a canonical family", () => {
  assert.equal(normalizeUserRole("founder"), "operator");
  assert.equal(normalizeUserRole("admin"), "admin");
  assert.equal(normalizeUserRole("operator"), "operator");
  assert.equal(normalizeUserRole("compliance_reviewer"), "operator");
  assert.equal(normalizeUserRole("virtual_assistant"), "va");
  assert.equal(normalizeUserRole("alliance_member"), "alliance");
  assert.equal(normalizeUserRole("client"), "client");
});

test("unknown / missing role normalizes to null (not defaulted)", () => {
  assert.equal(normalizeUserRole("wat"), null);
  assert.equal(normalizeUserRole(""), null);
  assert.equal(normalizeUserRole(null), null);
  assert.equal(normalizeUserRole(undefined), null);
});

// ── Home-route matrix ────────────────────────────────────────────────────────
test("home route per role", () => {
  assert.equal(getHomeRouteForRole("founder"), "/dashboard");
  assert.equal(getHomeRouteForRole("admin"), "/dashboard");
  assert.equal(getHomeRouteForRole("operator"), "/dashboard");
  assert.equal(getHomeRouteForRole("compliance_reviewer"), "/dashboard");
  assert.equal(getHomeRouteForRole("virtual_assistant"), "/va/dashboard");
  assert.equal(getHomeRouteForRole("alliance_member"), "/alliance/dashboard");
  assert.equal(getHomeRouteForRole("client"), "/portal");
});

test("missing / unknown role → safe denied route, never a protected default", () => {
  assert.equal(getHomeRouteForRole(null), DENIED_ROUTE);
  assert.equal(getHomeRouteForRole("bogus"), DENIED_ROUTE);
  assert.ok(!DENIED_ROUTE.startsWith("/portal"));
});

// ── Route-allow matrix ───────────────────────────────────────────────────────
test("operator/admin/founder reach dashboard + va + alliance oversight", () => {
  for (const r of ["operator", "admin", "founder", "compliance_reviewer"]) {
    assert.ok(isRouteAllowedForRole("/dashboard", r), `${r} → /dashboard`);
    assert.ok(isRouteAllowedForRole("/va/tasks", r), `${r} → /va`);
    assert.ok(isRouteAllowedForRole("/alliance/dashboard", r), `${r} → /alliance`);
  }
});

test("client is isolated to the portal", () => {
  assert.ok(isRouteAllowedForRole("/portal", "client"));
  assert.ok(!isRouteAllowedForRole("/dashboard", "client"));
  assert.ok(!isRouteAllowedForRole("/va/tasks", "client"));
  assert.ok(!isRouteAllowedForRole("/alliance/dashboard", "client"));
});

test("VA and alliance stay in their own areas", () => {
  assert.ok(isRouteAllowedForRole("/va/tasks", "virtual_assistant"));
  assert.ok(!isRouteAllowedForRole("/dashboard", "virtual_assistant"));
  assert.ok(isRouteAllowedForRole("/alliance/dashboard", "alliance_member"));
  assert.ok(!isRouteAllowedForRole("/dashboard", "alliance_member"));
});

test("missing / unknown role is blocked on every protected surface", () => {
  for (const path of ["/dashboard", "/portal", "/va/tasks", "/alliance/dashboard"]) {
    assert.ok(!isRouteAllowedForRole(path, null), `null role must not reach ${path}`);
    assert.ok(!isRouteAllowedForRole(path, "bogus"), `unknown role must not reach ${path}`);
  }
});
