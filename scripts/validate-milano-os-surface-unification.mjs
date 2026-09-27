import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "components/os/MilanoOSShell.tsx",
  "styles/components/milano-os-shell.css",
  "components/dashboard/OperatorShell.tsx",
  "components/portal/portal-shell.tsx",
  "components/va/VAWorkspaceShell.tsx",
  "components/alliance/AllianceShell.tsx",
  "app/styles/milano-theme.css",
];

for (const file of requiredFiles) {
  assert.ok(existsSync(file), `Missing Milano OS surface file: ${file}`);
}

const shared = readFileSync("components/os/MilanoOSShell.tsx", "utf8");
const css = readFileSync("styles/components/milano-os-shell.css", "utf8");
const theme = readFileSync("app/styles/milano-theme.css", "utf8");
const operator = readFileSync("components/dashboard/OperatorShell.tsx", "utf8");
const portal = readFileSync("components/portal/portal-shell.tsx", "utf8");
const va = readFileSync("components/va/VAWorkspaceShell.tsx", "utf8");
const alliance = readFileSync("components/alliance/AllianceShell.tsx", "utf8");

for (const [label, source] of [
  ["operator", operator],
  ["client", portal],
  ["va", va],
  ["alliance", alliance],
]) {
  assert.ok(
    source.includes("@/components/os/MilanoOSShell"),
    `${label} workspace must render through the shared Milano OS shell`,
  );
}

for (const mode of ["operator", "client", "va", "alliance"]) {
  assert.ok(shared.includes(`\"${mode}\"`), `Shared shell missing ${mode} mode`);
}

assert.ok(
  theme.startsWith('@import "../../styles/components/milano-os-shell.css";'),
  "Canonical Milano theme must load shared OS shell CSS",
);
assert.ok(
  shared.includes("@/components/motion/motionPresets") &&
    shared.includes("panelTransition") &&
    shared.includes("routeTransition"),
  "Shared shell must reuse the existing canonical Milano motion presets",
);
assert.ok(shared.includes("useReducedMotion"), "Shared shell must honor reduced motion");
assert.ok(
  css.includes("@media (prefers-reduced-motion: reduce)"),
  "CSS motion system must include reduced-motion fallback",
);
assert.ok(
  shared.includes("metaKey") &&
    shared.includes("ctrlKey") &&
    shared.includes('key.toLowerCase() === "k"'),
  "Workspace command palette must support Cmd/Ctrl+K",
);
assert.ok(
  shared.includes("ms-os-mobile-drawer") && shared.includes('aria-modal="true"'),
  "Shared shell must include an accessible mobile navigation drawer",
);
assert.ok(
  shared.includes("navigation only"),
  "Command palette must remain navigation-only",
);
assert.ok(
  shared.includes("tms_os_favorites_") &&
    shared.includes("tms_os_recent_") &&
    shared.includes("localStorage"),
  "Canonical command palette discovery may use device-local favorites/recent state only",
);
assert.ok(
  !shared.includes("createClient") &&
    !shared.includes("createAdminClient") &&
    !shared.includes("supabase"),
  "Shared visual shell must not create a second data/auth layer",
);
assert.ok(!shared.includes("fetch("), "Shared visual shell must not fetch or mutate Matter data");

for (const route of [
  "/dashboard",
  "/portal",
  "/va/dashboard",
  "/alliance/dashboard",
]) {
  assert.ok(
    `${operator}\n${portal}\n${va}\n${alliance}`.includes(route),
    `Canonical workspace route missing from unified shell configuration: ${route}`,
  );
}

assert.ok(
  portal.includes("usePortal()"),
  "Client shell must preserve the existing client-safe portal projection",
);
assert.ok(
  portal.includes("setActiveDealId"),
  "Client shell must preserve multi-Matter switching",
);
assert.ok(
  portal.includes("CredentialTicker"),
  "Client shell must preserve the existing trust/corridor ticker",
);
assert.ok(
  va.includes("RitualEntryLock"),
  "VA shell must preserve the controlled session entry ritual",
);
assert.ok(
  alliance.includes("routingEligible"),
  "Alliance shell must preserve routing readiness truth",
);
assert.ok(
  operator.includes("Wise settlement truth"),
  "Operator shell must preserve Wise-governed payment language",
);

for (const source of [shared, operator, portal, va, alliance]) {
  assert.ok(!/\bLiaison\s+OS\b/i.test(source), "Foreign workflow branding is prohibited from unified surfaces");
  assert.ok(!/\bEnsureProtect\b/i.test(source), "Reference-product branding is prohibited from unified surfaces");
  assert.ok(!/\bDemesmin\b|\bDover\b/i.test(source), "Outside-employer branding is prohibited from unified surfaces");
}

console.log(
  "PASS Milano OS surface unification: Dashboard, Client Portal, VA and Alliance share one cinematic responsive chrome with preserved role/data boundaries",
);
