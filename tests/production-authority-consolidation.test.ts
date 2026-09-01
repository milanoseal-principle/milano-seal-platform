import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path: string) => fs.readFileSync(path, "utf8");

test("Shippo has one executable webhook authority", () => {
  assert.equal(
    fs.existsSync("app/api/webhooks/shippo/route.ts"),
    false,
    "retired parallel Shippo webhook must not return",
  );

  const route = read("app/api/courier/webhook/route.ts");
  assert.match(route, /verifyShippoHmac/);
  assert.match(route, /record_courier_delivery_transition/);
  assert.doesNotMatch(route, /updates\.deal_status/);
});

test("unverified Alliance status webhook cannot fake success", () => {
  assert.equal(
    fs.existsSync("app/api/webhooks/alliance/status/route.ts"),
    false,
    "Alliance status webhook must remain absent until real signature verification and persistence exist",
  );
});

test("reconciliation surface is live-data only", () => {
  const page = read("app/dashboard/matter-intelligence/reconciliation/page.tsx");
  assert.match(page, /createAdminClient/);
  assert.match(page, /\.from\("deals"\)/);
  assert.match(page, /No placeholder records are substituted/);
  assert.doesNotMatch(page, /const RECORDS/);
  assert.doesNotMatch(page, /MS-2024-0041|A\. Carvalho|R\. Okonkwo|T\. Nakamura/);
  assert.match(page, /Final settlement-dependent release remains independently gated/);
});

test("release certificate actions never advertise a dead PDF generator", () => {
  const actions = read("components/releases/CertificateActions.tsx");
  assert.match(actions, /Save as PDF/);
  assert.match(actions, /window\.print/);
  assert.doesNotMatch(actions, /PDF generation pending server implementation/);
  assert.doesNotMatch(actions, /console\.log\(/);
});

test("orphan placeholder data modules stay removed", () => {
  assert.equal(fs.existsSync("lib/portal2/documentVault.ts"), false);
  assert.equal(fs.existsSync("lib/dispatch/partnerApplication.ts"), false);
});
