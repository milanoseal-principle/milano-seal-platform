import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const failures = [];
const mustExist = [
  "lib/payments/payment-disposition.ts",
  "lib/payments/complimentary-authorization.ts",
  "lib/payments/complimentary-policy.ts",
  "lib/payments/complimentary-safety.ts",
  "lib/payments/complimentary-server.ts",
  "lib/scheduling/complimentarySchedulingGate.ts",
  "lib/revenue/complimentaryReporting.ts",
  "components/payments/ComplimentaryMatterCard.tsx",
  "components/payments/ComplimentaryAuthorizationDialog.tsx",
  "components/payments/ComplimentarySummary.tsx",
  "components/payments/ComplimentaryReasonSelect.tsx",
  "components/payments/ComplimentaryAuditPanel.tsx",
  "components/payments/ComplimentaryStatusBadge.tsx",
  "components/payments/ComplimentaryRevokeDialog.tsx",
  "app/api/matters/[matterId]/complimentary/request/route.ts",
  "app/api/matters/[matterId]/complimentary/authorize/route.ts",
  "app/api/matters/[matterId]/complimentary/revoke/route.ts",
  "app/api/matters/[matterId]/complimentary/route.ts",
  "app/api/complimentary/report/route.ts",
  "supabase/migrations/043_complimentary_matter_authorizations.sql",
  "docs/architecture/COMPLIMENTARY_MATTER_EXISTING_SYSTEM_MAP.md",
  "docs/architecture/COMPLIMENTARY_MATTER_PROTECTED_BOUNDARY.md",
  "tests/complimentary-matter-flow.test.mjs",
];
for (const file of mustExist) if (!exists(file)) failures.push(`Missing ${file}`);

const disposition = read("lib/payments/payment-disposition.ts");
for (const token of ["standard_payment", "complimentary", "internal_test", "written_off", "refunded"]) if (!disposition.includes(token)) failures.push(`PaymentDisposition missing ${token}`);

const auth = read("lib/payments/complimentary-authorization.ts");
for (const token of ["originalTotal", "discountAmount", "finalAmountDue: 0", "verifiedRevenue: 0", "wisePaymentId: null", "wiseTransferId: null", "paymentConfirmedAt: null", "quoteVersion", "authorizationScope: \"single_matter\""]) if (!auth.includes(token)) failures.push(`Authorization model missing ${token}`);

const policy = read("lib/payments/complimentary-policy.ts");
for (const perm of ["matter.comp.view", "matter.comp.request", "matter.comp.authorize", "matter.comp.revoke", "matter.comp.audit"]) if (!policy.includes(perm)) failures.push(`Permission missing ${perm}`);
if (new RegExp(["tiff" + "any@", "NamedOperator.*email", "user\\.email.*NamedOperator", "hardcoded.*NamedOperator"].join("|"), "i").test(policy + auth)) failures.push("Named operator identity is hardcoded in payment policy/model.");

const server = read("lib/payments/complimentary-server.ts");
for (const token of ["createAdminClient", "canonicalQuoteFromDeal", "amount_due: 0", "amount_paid: 0", "verified_revenue: 0", "wise_payment_id: null", "wise_transfer_id: null", "COMPLIMENTARY_AUTHORIZATION_APPROVED"]) if (!server.includes(token)) failures.push(`Server flow missing ${token}`);
if (/payment_status\s*:\s*["']paid["']|payment_confirmed\s*:\s*true/.test(server)) failures.push("Server flow mutates paid/payment_confirmed for complimentary Matter.");

const gate = read("lib/scheduling/complimentarySchedulingGate.ts");
for (const token of ["verified_payment", "not_satisfied", "evaluatePaymentGate", "comp_authorized", "verified_revenue"]) if (!gate.includes(token)) failures.push(`Scheduling gate missing ${token}`);

if (/paymentRequirementMethod:\s*["']complimentary_authorization["']/.test(gate)) failures.push("Complimentary authority cannot satisfy settlement-only scheduling.");
const scheduleRoute = read("app/api/deals/[id]/schedule/route.ts");
if (!scheduleRoute.includes("evaluateSchedulingGate")) failures.push("Scheduling route does not use canonical complimentary scheduling gate.");
if (!scheduleRoute.includes("paymentRequirementMethod")) failures.push("Scheduling route does not return paymentRequirementMethod.");

const migration = read("supabase/migrations/043_complimentary_matter_authorizations.sql");
for (const token of ["complimentary_authorizations", "final_amount_due = 0", "discount_amount = original_total", "uniq_active_complimentary_authorization_per_matter", "enable row level security", "service_role_manages_complimentary_authorizations", "check_payment_gate()", "verified_revenue"]) if (!migration.includes(token)) failures.push(`Migration/RLS missing ${token}`);

const portal = read("app/portal/invoice/page.tsx");
for (const token of ["Complimentary Service Authorization", "No payment is due for this Matter", "Complimentary authorization remains separate from Wise paid-state authority"]) if (!portal.includes(token)) failures.push(`Client-safe portal state missing ${token}`);
if (/complimentaryAuthorized[\s\S]{0,2000}(paymentConfirmed\s*=\s*true|paymentStatus\s*=\s*["']paid["'])/.test(portal)) failures.push("Client-safe complimentary portal state must not fabricate paid status.");

const founderReport = read("lib/revenue/complimentaryReporting.ts") + read("app/api/complimentary/report/route.ts");
for (const token of ["non_revenue_complimentary", "verifiedRevenue: 0", "totalValueComped", "activeComplimentaryMatters"]) if (!founderReport.includes(token)) failures.push(`Founder report/revenue classification missing ${token}`);

const pkg = JSON.parse(read("package.json"));
if (pkg.scripts?.["validate:complimentary-matter-flow"] !== "node scripts/validate-complimentary-matter-flow.mjs") failures.push("package.json missing validate:complimentary-matter-flow script.");
if (!pkg.scripts?.test) failures.push("package.json missing test script.");

const protectedFiles = [
  "app/api/webhooks/wise/route.ts",
  "app/api/webhook/wise/route.ts",
  "lib/wise.ts",
  "lib/wise/payments.ts",
  "lib/custodyLedger.ts",
  "lib/release/performFinalRelease.ts",
];
for (const file of protectedFiles) if (exists(file) && /complimentary|compAuthorized/i.test(read(file))) failures.push(`Protected system changed for complimentary flow: ${file}`);

const identityScan = [
  "lib/payments/complimentary-policy.ts",
  "lib/payments/complimentary-server.ts",
  "app/api/matters/[matterId]/complimentary/authorize/route.ts",
  "app/api/matters/[matterId]/complimentary/request/route.ts",
  "app/api/matters/[matterId]/complimentary/revoke/route.ts",
  "components/payments/ComplimentaryMatterCard.tsx",
  "components/payments/ComplimentaryAuthorizationDialog.tsx",
];
for (const file of identityScan) {
  const text = read(file);
  if (new RegExp(["tiff" + "any@", "NamedOperator.*email", "user\\.email.*NamedOperator", "hardcoded.*NamedOperator"].join("|"), "i").test(text)) failures.push(`Hardcoded Named operator identity found in ${file}`);
}

if (failures.length) {
  console.error("Complimentary Matter validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Complimentary Matter validation passed.");
