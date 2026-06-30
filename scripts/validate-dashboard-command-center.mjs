// validate:dashboard-command-center — guards the dashboard command-center UX system.
//
// Asserts the shared design system exists, the canonical StatusPill covers the
// locked statuses, the shell uses the "Execution Support" label (not "VA Tasks"),
// every target route exists, no forbidden marketing language is introduced into
// dashboard surfaces, and no service-role key literal leaks into a client component.

import { readFileSync, existsSync } from "fs";

const errors = [];
const read = (f) => (existsSync(f) ? readFileSync(f, "utf8") : null);

// 1. Shared system components exist.
const SYSTEM = [
  "index.ts",
  "dashboardTheme.ts",
  "DashboardMotion.tsx",
  "DashboardPageHeader.tsx",
  "StatusPill.tsx",
  "RiskBadge.tsx",
  "MetricCard.tsx",
  "CommandCard.tsx",
  "DataTable.tsx",
  "DashboardEmptyState.tsx",
  "DashboardSkeleton.tsx",
  "DashboardErrorState.tsx",
];
for (const f of SYSTEM) {
  if (!existsSync(`components/dashboard/system/${f}`)) {
    errors.push(`missing system component: components/dashboard/system/${f}`);
  }
}

// 2. StatusPill covers the locked statuses.
const pill = read("components/dashboard/system/StatusPill.tsx") ?? "";
for (const s of [
  "intake_received",
  "awaiting_payment",
  "payment_observed",
  "payment_cleared",
  "in_execution",
  "apostille_processing",
  "ready_for_release",
  "release_locked",
  "released",
  "mismatch_review",
  "completed",
]) {
  if (!pill.includes(s)) errors.push(`StatusPill missing locked status: ${s}`);
}

// 3. Shell uses "Execution Support" label and not "VA Tasks".
const shell = read("components/dashboard/milano-shell.tsx") ?? "";
if (!shell.includes("Execution Support")) {
  errors.push('shell nav missing "Execution Support" label');
}
if (/label:\s*"VA Tasks"/.test(shell)) {
  errors.push('shell nav still uses "VA Tasks" label');
}

// 4. Target routes exist.
const ROUTES = [
  "dashboard", "dashboard/admin", "dashboard/intake", "dashboard/deals",
  "dashboard/pipeline", "dashboard/compliance", "dashboard/invoices",
  "dashboard/admin/payments", "dashboard/admin/reconciliation", "dashboard/follow-ups",
  "dashboard/terminal", "dashboard/intelligence/acquisition", "dashboard/intelligence/revenue",
  "dashboard/intelligence/autopilot", "dashboard/intelligence/compliance",
  "dashboard/va", "dashboard/courier",
];
for (const r of ROUTES) {
  if (!existsSync(`app/${r}/page.tsx`)) errors.push(`missing target route: app/${r}/page.tsx`);
}

// 5. No forbidden marketing language introduced into the new system components.
const FORBIDDEN = [/cheap notary/i, /guaranteed accepted/i, /government approved/i, /instant approval/i];
for (const f of SYSTEM) {
  const src = read(`components/dashboard/system/${f}`);
  if (!src) continue;
  for (const re of FORBIDDEN) {
    if (re.test(src)) errors.push(`forbidden phrase ${re} in system/${f}`);
  }
}

// 6. No service-role key literal in the client-facing system components.
for (const f of SYSTEM) {
  const src = read(`components/dashboard/system/${f}`);
  if (src && /SUPABASE_SERVICE_ROLE_KEY|service_role/i.test(src)) {
    errors.push(`service-role reference must not appear in system/${f}`);
  }
}

if (errors.length) {
  console.error("validate:dashboard-command-center FAILED:");
  for (const e of errors) console.error("  - " + e);
  throw new Error(`${errors.length} dashboard-command-center error(s)`);
}
console.log(
  `validate:dashboard-command-center passed (${SYSTEM.length} system components, ${ROUTES.length} routes, StatusPill + Execution Support label verified)`,
);
