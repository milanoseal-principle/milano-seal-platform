import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const generator = fs.readFileSync(path.join(root, "scripts/generate-route-map.mjs"), "utf8");
const registry = [
  fs.readFileSync(path.join(root, "lib/control-plane/systemRegistry.ts"), "utf8"),
  fs.readFileSync(path.join(root, "lib/control-plane/hardeningRegistry.ts"), "utf8"),
].join("\n");
const shell = fs.readFileSync(path.join(root, "components/dashboard/OperatorShell.tsx"), "utf8");
const failures = [];

const criticalBlock = generator.match(/const CRITICAL_ROUTES = \[([\s\S]*?)\];/);
if (!criticalBlock) failures.push("Cannot resolve CRITICAL_ROUTES from canonical route generator.");
const routes = criticalBlock ? [...criticalBlock[1].matchAll(/"([^\"]+)"/g)].map((match) => match[1]) : [];

const productionSurfaceRules = [
  { prefix: "/api/dashboard/control-plane/governance", authority: "corporate_governance_board_room" },
  { prefix: "/api/cron/governance", authority: "corporate_governance_board_room" },
  { prefix: "/portal", authority: "workspace_client" },
  { prefix: "/dashboard", authority: "workspace_operator" },
  { prefix: "/workspace/release", authority: "execution_release" },
  { prefix: "/intake", authority: "matter_intake" },
  { prefix: "/professional", authority: "platform_public_demand" },
  { prefix: "/today", authority: "operator_intelligence" },
  { prefix: "/api/webhooks/wise", authority: "wise_payment_authority" },
  { prefix: "/api/intake", authority: "matter_intake" },
  { prefix: "/api/dashboard/operator-intelligence", authority: "operator_intelligence" },
  { prefix: "/api/health", authority: "system_control_plane" },
  { prefix: "/", authority: "platform_public_demand", exact: true },
];

for (const route of routes) {
  const matches = productionSurfaceRules.filter((rule) => rule.exact ? route === rule.prefix : route === rule.prefix || route.startsWith(`${rule.prefix}/`));
  if (matches.length !== 1) failures.push(`Production-critical route must resolve to exactly one workspace/capability boundary: ${route} (${matches.length})`);
  for (const match of matches) if (!registry.includes(`id: \"${match.authority}\"`)) failures.push(`Route ${route} resolves to unregistered capability ${match.authority}`);
}

for (const route of ["/dashboard/control-plane", "/dashboard/reconciliation", "/dashboard/matters/[matterId]/truth"]) {
  if (!routes.includes(route)) failures.push(`New governance route is not production-critical: ${route}`);
}

if (!registry.includes('route: "/dashboard/reconciliation"')) failures.push("Reconciliation route is not explicitly registered in hardening registry.");
if (!registry.includes('route: "/dashboard/matters/[matterId]/truth"')) failures.push("Matter Truth route is not explicitly registered in hardening registry.");
if (!shell.includes('href: "/dashboard/reconciliation"')) failures.push("Operator navigation does not expose canonical reconciliation surface.");

if (failures.length) {
  console.error("Control Plane route coverage validation failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`PASS Control Plane route coverage: ${routes.length} production-critical routes map to governed workspace/capability boundaries; Matter Truth and Reconciliation are registered.`);
