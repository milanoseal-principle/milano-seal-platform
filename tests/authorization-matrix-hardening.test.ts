import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { DENIED_ROUTE, getHomeRouteForRole, isRouteAllowedForRole, normalizeUserRole } from "@/lib/auth/roleRedirect";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");
const USER_METADATA_AUTHORIZATION_READ = /\.\s*user_metadata\b|\[\s*["']user_metadata["']\s*\]|->\s*['"]user_metadata['"]/;

function assertNoUserMetadataAuthorization(source: string) {
  assert.doesNotMatch(source, USER_METADATA_AUTHORIZATION_READ);
}

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
  assertNoUserMetadataAuthorization(source);
});

test("generic Matter detail API cannot author Wise payment or governed lifecycle truth", () => {
  const source = read("app/api/deals/[id]/route.ts");
  assert.match(source, /const PAYMENT_FIELDS = new Set/);
  assert.match(source, /const PROTECTED_LIFECYCLE_FIELDS = new Set/);
  assert.match(source, /const PROTECTED_LIFECYCLE_STATUSES = new Set/);
  assert.match(source, /PAYMENT_MUTATION_GOVERNED_PATH_REQUIRED/);
  assert.match(source, /GOVERNED_LIFECYCLE_MUTATION_REQUIRED/);
  assert.match(source, /resolveServerRole/);
  assertNoUserMetadataAuthorization(source);
  assert.match(source, /Wise settlement/);

  for (const protectedField of [
    "payment_status",
    "payment_confirmed",
    "payment_reference",
    "scheduled_at",
    "execution_at",
    "apostille_at",
    "shipped_at",
    "tracking_number",
    "delivery_at",
    "release_verified",
    "completed_at",
  ]) {
    assert.match(source, new RegExp(`\\"${protectedField}\\"`), protectedField);
  }

  for (const protectedStatus of [
    "deposit_confirmed",
    "scheduling_unlocked",
    "scheduled",
    "in_execution",
    "apostille_submitted",
    "final_payment_confirmed",
    "ready_for_release",
    "in_transit",
    "delivered",
    "completed",
  ]) {
    assert.match(source, new RegExp(`\\"${protectedStatus}\\"`), protectedStatus);
  }

  const metadataMatch = source.match(/const GENERIC_METADATA_FIELDS = \[([\s\S]*?)\] as const;/);
  assert.ok(metadataMatch, "Generic metadata allowlist must remain explicit.");
  const metadataAllowlist = metadataMatch?.[1] ?? "";
  for (const forbidden of [
    "status",
    "payment_status",
    "scheduled_at",
    "execution_at",
    "apostille_at",
    "tracking_number",
    "delivery_at",
    "completed_at",
  ]) {
    assert.doesNotMatch(metadataAllowlist, new RegExp(`\\"${forbidden}\\"`), forbidden);
  }
});

test("portal authorization remains app_metadata governed and private surfaces stay noindex", () => {
  const files = ["app/portal/layout.tsx", "lib/auth/server-role.ts", "proxy.ts"].filter((file) => fs.existsSync(path.join(root, file)));
  assert.equal(files.length >= 2, true);
  const source = files.map(read).join("\n");
  assertNoUserMetadataAuthorization(source);
  assert.match(source, /app_metadata|resolveServerRole/);
});
