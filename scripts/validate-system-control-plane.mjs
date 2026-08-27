import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "lib/control-plane/systemRegistry.ts",
  "lib/control-plane/placementGate.ts",
  "lib/control-plane/__tests__/systemControlPlane.test.ts",
  "app/dashboard/control-plane/page.tsx",
  "docs/control-plane/01_EXECUTIVE_PLATFORM_OVERVIEW.md",
  "docs/control-plane/02_MASTER_ARCHITECTURE_BLUEPRINT.md",
  "docs/control-plane/03_SYSTEM_REGISTRY.md",
  "docs/control-plane/04_CANONICAL_MATTER_EXECUTION_CONTRACT.md",
  "docs/control-plane/05_WORKSPACE_UX_MAP.md",
  "docs/control-plane/06_PRODUCTION_READINESS_ROADMAP.md",
];

const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing required control-plane file: ${file}`);
}

if (!failures.length) {
  const registry = read("lib/control-plane/systemRegistry.ts");
  const placement = read("lib/control-plane/placementGate.ts");
  const page = read("app/dashboard/control-plane/page.tsx");
  const shell = read("components/dashboard/OperatorShell.tsx");
  const runGate = read("scripts/run-vercel-merge-gate.mjs");
  const routeMap = read("docs/ROUTE_MAP.md");

  for (const system of [
    "demand",
    "matter_control",
    "execution_network",
    "intelligence_control",
    "governance_platform",
  ]) {
    if (!registry.includes(`\"${system}\"`)) failures.push(`Missing parent system: ${system}`);
  }

  for (const status of [
    "CONCEPT",
    "SPECIFIED",
    "BUILT",
    "WIRED",
    "GATED",
    "DEPLOYED",
    "LIVE_PROVEN",
    "CERTIFIED",
  ]) {
    if (!registry.includes(`\"${status}\"`)) failures.push(`Missing standardized delivery status: ${status}`);
  }

  for (const authority of [
    "Supabase canonical Matter/deal record",
    "Canonical Matter state machine",
    "Canonical Milano pricing engine",
    "Wise verified settlement",
    "Canonical payment + execution scheduling gates",
    "Verified authority/compliance registry",
    "Canonical execution truth",
    "Canonical Alliance governance and eligibility",
    "Governed custody and release evidence",
    "Carrier/provider delivery evidence",
  ]) {
    if (!registry.includes(authority)) failures.push(`Missing canonical authority declaration: ${authority}`);
  }

  for (const lock of [
    "oneMatterEngine: true",
    "intelligenceCannotOverwriteTruth: true",
    "wiseOnlyPaymentAuthority: true",
    "unregisteredProductionModuleMergeBlocked: true",
    "liveProofCannotBeInferredFromCode: true",
    "certificationCannotBeSelfAsserted: true",
  ]) {
    if (!registry.includes(lock)) failures.push(`Missing governance lock: ${lock}`);
  }

  for (const rule of [
    "Parent system is invalid",
    "At least one canonical/derived authority reference is required",
    "UX placement or system-only placement is required",
    "Equivalent registered capability already exists",
    "Intelligence surfaces must remain read-only",
    "Payment-mutating capability must bind to the canonical Wise authority path",
  ]) {
    if (!placement.includes(rule)) failures.push(`Placement gate missing rule: ${rule}`);
  }

  for (const surface of [
    "Canonical sources of truth",
    "System Placement Gate",
    "Standardized delivery states",
    "Present the software by workspace, not by module",
  ]) {
    if (!page.includes(surface)) failures.push(`Control-plane UI missing surface: ${surface}`);
  }

  if (!shell.includes('href: "/dashboard/control-plane"')) {
    failures.push("Operator navigation does not expose the System Control Plane.");
  }
  if (!routeMap.includes("`/dashboard/control-plane`")) {
    failures.push("Canonical route map does not register the System Control Plane.");
  }

  if (!runGate.includes("scripts/validate-system-control-plane.mjs")) {
    failures.push("Vercel production merge gate does not enforce System Control Plane governance.");
  }

  if (!registry.includes("INTERNAL_MODULES.map")) {
    failures.push("Legacy internal module registry is not adapted into the master System Registry.");
  }
  if (!registry.includes("EXPANSION_MODULES.map")) {
    failures.push("Institutional expansion modules are not adapted into the master System Registry.");
  }

  if (registry.includes("Stripe")) failures.push("System Control Plane reintroduced prohibited Stripe language.");
  if (!registry.includes("oneMatterEngine")) {
    failures.push("System Control Plane does not preserve one-Matter-engine governance.");
  }
}

if (failures.length) {
  console.error("System Control Plane validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS System Control Plane: five-system hierarchy, canonical authorities, standardized readiness, registry adapters, workspace map and placement gate are locked.");
