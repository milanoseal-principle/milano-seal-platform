// Final source-level continuity gate for Tiffany's live production regression tranche.
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const checks = [];
const check = (label, ok) => checks.push({ label, ok: Boolean(ok) });
const hasAll = (text, values) => values.every((value) => text.includes(value));

const invoice = read("app/portal/invoice/page.tsx");
const observation = read("app/api/portal/me/payment-observation/route.ts");
const scheduling = read("lib/scheduling/complimentarySchedulingGate.ts");
const scheduleRoute = read("app/api/deals/[id]/schedule/route.ts");
const ronDashboard = read("app/dashboard/ron/page.tsx");
const ronCreate = read("app/api/dashboard/ron/sessions/route.ts");
const ronGuards = read("lib/bluenotary/guards.ts");
const ronDetail = read("app/dashboard/ron/[session_id]/page.tsx");
const operatorShell = read("components/dashboard/OperatorShell.tsx");
const dashboardAuth = read("lib/dashboardAuth.ts");
const alerts = read("lib/notifications/transactionalEmailAlerts.ts");
const cron = read("app/api/cron/notification-reconcile/route.ts");
const signerRoute = ronCreate;

check("Wise processing remains distinct from verified paid truth", hasAll(invoice, [
  "Wise payment processing",
  "paymentConfirmed",
  "paymentProcessing",
  "Wise payment is still processing",
]));
check("Check Wise Settlement Now is a real interactive button", hasAll(invoice, [
  "checkWiseSettlement",
  "onClick={() => void checkWiseSettlement()}",
  "settlementCheckBusy",
  "Refreshing Wise payment status",
]));
check("automatic Wise observation polls every 10 seconds with cleanup", hasAll(invoice, [
  "window.setInterval(() => void loadPaymentFlow(), 10_000)",
  "window.clearInterval(timer)",
  "window.removeEventListener(\"focus\", onFocus)",
]));
check("client observation cannot author paid state", !/payment_confirmed\s*:\s*true/.test(observation) && !/payment_status\s*:\s*["']paid["']/.test(observation));
check("canonical scheduling gate separates observed Wise submission from verified settlement", hasAll(scheduling, [
  "verified_payment",
  "wise_submission_observed",
  "Observed Wise submission authorizes scheduling while settlement remains pending",
  "evaluatePaymentGate",
]));
check("schedule API consumes the canonical scheduling gate", hasAll(scheduleRoute, [
  "evaluateSchedulingGate",
  "PAYMENT_REQUIRED",
  "STALE_MATTER_STATE",
]));
check("operator navigation exposes RON / BlueNotary", operatorShell.includes('href: "/dashboard/ron"') && /BlueNotary|RON/.test(operatorShell));
check("dashboard roles permit governed operator/admin/owner access", hasAll(dashboardAuth, ["operator", "admin", "owner", "requireDashboardAccess"]));
check("RON dashboard consumes canonical scheduling gate and shows pre-session Matters", hasAll(ronDashboard, [
  "evaluateSchedulingGate",
  "RON Matters · Before BlueNotary Session",
  "Open RON Readiness",
  "Wise processing",
]));
check("RON creation is Matter-scoped and delegates to canonical scheduling guard", hasAll(ronCreate, [
  "assertCanCreateRONSession",
  "matter_id",
  "ron_sessions",
]) && hasAll(ronGuards, [
  "evaluateSchedulingGate",
  "verifySchedulingAuthorized",
  "schedulingEligible",
  "PAYMENT_REQUIRED",
]));
check("RON session detail exposes Matter, signer, document and scheduling truth", hasAll(ronDetail, [
  "Matter + Session Truth",
  "Payment + Scheduling Authority",
  "Signer Readiness",
  "Document Package",
  "schedulingAuthorized",
]));
check("signer fallback retains canonical optional middle_name field", signerRoute.includes("middle_name") && signerRoute.includes("SignerInput"));
check("operator payment notifications retain canonical production recipients", hasAll(alerts, [
  "nicholas@themilanoseal.com",
  "themilanoseal@gmail.com",
  "operator_payment_observed",
  "operator_payment_confirmed",
]));
check("notification reconciler remains bearer-secret protected", cron.includes("Bearer ${expected}"));
check("no Tiffany-specific duplicate Matter/payment engine is introduced", ![invoice, observation, scheduling, ronDashboard, ronCreate, ronGuards, ronDetail].join("\n").includes("MS-2026-4887"));

const failed = checks.filter((item) => !item.ok);
for (const item of checks) console.log(`${item.ok ? "PASS" : "FAIL"} ${item.label}`);
console.log(`Tiffany post-test final audit: ${checks.length - failed.length}/${checks.length} passed`);
if (failed.length) process.exit(1);
