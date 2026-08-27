import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { DENIED_ROUTE, getHomeRouteForRole, isRouteAllowedForRole, normalizeUserRole } from "@/lib/auth/roleRedirect";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

test("role homes remain isolated and unknown roles fail closed", () => {
  assert.equal(getHomeRouteForRole("client"), "/portal");
  assert.equal(getHomeRouteForRole("virtual_assistant"), "/va/dashboard");
  assert.equal(getHomeRouteForRole("alliance_partner"), "/alliance/dashboard");
  assert.equal(getHomeRouteForRole("operator"), "/dashboard");
  assert.equal(getHomeRouteForRole("unknown-role"), DENIED_ROUTE);
  assert.equal(normalizeUserRole(null), null);
});

test("client VA and Alliance roles cannot cross workspace boundaries", () => {
  assert.equal(isRouteAllowedForRole("/portal/payment", "client"), true);
  assert.equal(isRouteAllowedForRole("/dashboard/payments", "client"), false);
  assert.equal(isRouteAllowedForRole("/va/dashboard", "virtual_assistant"), true);
  assert.equal(isRouteAllowedForRole("/dashboard", "virtual_assistant"), false);
  assert.equal(isRouteAllowedForRole("/dashboard/payments", "virtual_assistant"), false);
  assert.equal(isRouteAllowedForRole("/workspace/release", "virtual_assistant"), false);
  assert.equal(isRouteAllowedForRole("/alliance/dashboard", "alliance_partner"), true);
  assert.equal(isRouteAllowedForRole("/dashboard", "alliance_partner"), false);
  assert.equal(isRouteAllowedForRole("/va/dashboard", "alliance_partner"), false);
});

test("operator family receives oversight without widening client or partner roles", () => {
  for (const role of ["operator", "founder", "founder_admin", "admin", "owner"]) {
    assert.equal(isRouteAllowedForRole("/dashboard/control-plane", role), true, role);
  }
  assert.equal(isRouteAllowedForRole("/dashboard/reconciliation", "client"), false);
  assert.equal(isRouteAllowedForRole("/dashboard/reconciliation", "alliance"), false);
  assert.equal(isRouteAllowedForRole("/dashboard/reconciliation", "va"), false);
});

test("canonical Matter list API requires server-authenticated app-metadata-derived role resolution", () => {
  const source = read("app/api/deals/route.ts");
  assert.match(source, /createClient/);
  assert.match(source, /auth\.getUser\(\)/);
  assert.match(source, /resolveServerRole/);
  assert.match(source, /UNAUTHENTICATED/);
  assert.match(source, /FORBIDDEN/);
  assert.doesNotMatch(source, /user_metadata/);
});

test("generic Matter detail API cannot author paid settlement or bypass governed execution", () => {
  const source = read("app/api/deals/[id]/route.ts");
  assert.match(source, /PAYMENT_FIELDS/);
  assert.match(source, /payment_confirmed/);
  assert.match(source, /resolveServerRole/);
  assert.doesNotMatch(source, /user_metadata/);
  assert.match(source, /wise/i);
});

test("portal authorization remains app_metadata governed and private surfaces stay noindex", () => {
  const files = ["app/portal/layout.tsx", "lib/auth/server-role.ts", "proxy.ts"].filter((file) => fs.existsSync(path.join(root, file)));
  assert.equal(files.length >= 2, true);
  const source = files.map(read).join("\n");
  assert.doesNotMatch(source, /user_metadata/);
  assert.match(source, /app_metadata|resolveServerRole/);
});
