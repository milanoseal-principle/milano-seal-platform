import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

function read(path) {
  assert.ok(existsSync(path), `Missing required hardening source: ${path}`);
  return readFileSync(path, "utf8");
}

const header = read("components/landing/header.tsx");
const footer = read("components/landing/footer.tsx");
const brand = read("app/theme/milanoBrand.ts");
const dashboardAuth = read("lib/dashboardAuth.ts");
const roleRedirect = read("lib/auth/roleRedirect.ts");
const portalLayout = read("app/portal/layout.tsx");
const vaAuth = read("lib/vaAuth.ts");
const allianceAuth = read("lib/allianceAuth.ts");
const operatorReadModel = read("lib/operator-intelligence/read-model.ts");
const authorityApi = read("app/api/dashboard/receiving-authorities/route.ts");
const authorityMigration = read("supabase/migrations/053_receiving_authority_provenance_reconciliation.sql");
const notificationMigration = read("supabase/migrations/054_notification_delivery_audit.sql");
const email = read("lib/email.ts");
const certification = read("docs/FINAL_PRODUCTION_CERTIFICATION.md");
const mergeGate = read("scripts/run-vercel-merge-gate.mjs");

// Brand token lock: active shared public chrome may not reintroduce pre-canonical
// gold/brown one-offs after the Milano brand source has been established.
for (const [label, source] of [["header", header], ["footer", footer]]) {
  assert.ok(source.includes("MILANO_BRAND"), `${label} lost canonical brand source`);
  assert.ok(source.includes("var(--ms-gold)"), `${label} lost canonical Milano gold token`);
  assert.ok(source.includes("var(--ms-black)"), `${label} lost canonical Archive Black token`);
  for (const legacy of ["#D3B35A", "#8B743C", "#D4B76A"]) {
    assert.ok(!source.toUpperCase().includes(legacy), `${label} reintroduced non-canonical visual token ${legacy}`);
  }
}
assert.ok(brand.includes('milanoGold: "#C6A65B"'), "Canonical Milano Gold changed");
assert.ok(brand.includes('matteBlack: "#0A0A0A"'), "Canonical Archive Black changed");

// Authorization matrix at source level. Dashboard must be operator/admin/owner only;
// VA and Alliance must remain in their role-specific guards; Client Portal is client-only.
assert.ok(dashboardAuth.includes('normalizeUserRole'), "Dashboard guard must normalize through canonical role map");
assert.ok(dashboardAuth.includes('new Set(["operator", "admin", "owner"])'), "Dashboard guard must be limited to operator/admin/owner canonical roles");
assert.ok(!dashboardAuth.includes('"virtual_assistant"'), "VA must never be granted dashboard access by dashboardAuth");
assert.ok(roleRedirect.includes('va: "/va/dashboard"'), "VA canonical home drifted");
assert.ok(roleRedirect.includes('alliance: "/alliance/dashboard"'), "Alliance canonical home drifted");
assert.ok(roleRedirect.includes('client: "/portal"'), "Client canonical home drifted");
assert.ok(portalLayout.includes('role !== "client"'), "Client Portal must remain client-only");
assert.ok(vaAuth.includes('requireVAAccess'), "VA role-specific guard missing");
assert.ok(allianceAuth.includes('requireAllianceAccess'), "Alliance role-specific guard missing");

// Universal operator exception spine must preserve all canonical action classes.
for (const actionClass of [
  "Payment Blocked",
  "Document Blocked",
  "Authority Review",
  "Scheduling Due",
  "Apostille Pending",
  "Courier Exception",
  "Release Ready",
  "Overdue Follow-Up",
]) {
  assert.ok(operatorReadModel.includes(`\"${actionClass}\"`), `Operator exception class missing: ${actionClass}`);
}

// Authority provenance contract. No active authority routing without source + freshness.
for (const field of [
  "source_url",
  "source_type",
  "confidence_level",
  "last_verified_at",
  "verified_by",
  "stale_after_days",
  "manual_review_required",
  "routing_status",
]) {
  assert.ok(authorityApi.includes(field), `Authority API missing provenance field ${field}`);
  assert.ok(authorityMigration.includes(field), `Authority provenance migration missing ${field}`);
}
assert.ok(authorityMigration.includes("No source URLs or verification facts are invented"), "Authority migration must explicitly prohibit fabricated provenance");
assert.ok(authorityMigration.includes("routing_status = 'REVIEW_REQUIRED'"), "Authority migration must fail closed to REVIEW_REQUIRED");
assert.ok(authorityMigration.includes("source_url is null"), "Missing source URL must force authority review");
assert.ok(authorityMigration.includes("last_verified_at is null"), "Missing verification time must force authority review");

// Notification evidence: application send success may only prove provider acceptance.
for (const field of [
  "delivery_status",
  "delivered_at",
  "failed_at",
  "last_provider_event_at",
  "delivery_attempts",
]) {
  assert.ok(notificationMigration.includes(field), `Notification evidence schema missing ${field}`);
}
assert.ok(notificationMigration.includes("provider_accepted is not equivalent to delivered"), "Notification schema must preserve provider-acceptance boundary");
assert.ok(email.includes('providerMessageId: result.data?.id ?? null'), "Transactional email must persist provider message ID");
assert.ok(email.includes('delivery_status: input.status === "sent" ? "provider_accepted" : "failed"'), "Email send success must record provider_accepted, never delivered");
assert.ok(email.includes('final_delivery_proven: false'), "Email evidence must explicitly remain non-final until provider/live evidence exists");
assert.ok(!email.includes('delivery_status: "delivered"'), "Application send path must never self-certify delivery");

// Human/live gates must remain human/live gates. Repository work must never stamp them PASS.
assert.ok(certification.includes("LIVE VERCEL CERTIFICATION   PENDING"), "Live Vercel certification must remain PENDING until executed live");
assert.ok(certification.includes("WISE PRODUCTION E2E         PENDING"), "Wise production E2E must remain PENDING until real settlement evidence exists");
assert.ok(certification.includes("DAMIANI DRY RUN             PENDING"), "Damiani dry run must remain PENDING until manually executed");
assert.ok(certification.includes("DAMIANI                     NO-GO"), "Damiani must remain NO-GO before live evidence");
assert.ok(certification.includes("blank evidence field = **NO-GO**"), "Certification must continue to fail closed on missing evidence");

assert.ok(
  mergeGate.includes("validate-nonhuman-production-hardening.mjs"),
  "Vercel merge gate must execute final nonhuman production hardening validator",
);

console.log(
  "PASS final nonhuman production hardening: brand tokens, role isolation, exception spine, authority provenance, notification evidence boundaries, and live-certification NO-GO controls are locked.",
);
