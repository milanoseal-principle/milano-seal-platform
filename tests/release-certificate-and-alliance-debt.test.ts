import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const certificates = readFileSync("app/dashboard/releases/certificates/page.tsx", "utf8");
const alliance = readFileSync("app/dashboard/alliance/page.tsx", "utf8");

test("release certificate route cannot fabricate certificate truth from free-form demo input", () => {
  assert.doesNotMatch(certificates, /DEMO-MATTER-ID|DEMO-VERIFICATION-ID|Demo Client/);
  assert.doesNotMatch(certificates, /generateHash\(/);
  assert.doesNotMatch(certificates, /Generate Certificate/);
  assert.match(certificates, /Manual certificate authorship is disabled/);
  assert.match(certificates, /canonical release gate has passed/);
});

test("release certificate route remains an evidence projection rather than release authority", () => {
  assert.match(certificates, /requireDashboardAccess/);
  assert.match(certificates, /Open the Release Workspace/);
  assert.match(certificates, /settlement-dependent release authority/);
  assert.doesNotMatch(certificates, /method:\s*["'](?:POST|PUT|PATCH|DELETE)["']/);
});

test("legacy dashboard Alliance route is only a redirect and carries no placeholder intelligence", () => {
  assert.match(alliance, /redirect\("\/alliance\/dashboard"\)/);
  assert.doesNotMatch(alliance, /Placeholder observation rows/);
  assert.doesNotMatch(alliance, /example\.com\/source/);
  assert.doesNotMatch(alliance, /Attribution Placeholder/);
  assert.doesNotMatch(alliance, /MIL-2026-0041/);
});
