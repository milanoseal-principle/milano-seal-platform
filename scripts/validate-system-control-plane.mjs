import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "lib/control-plane/systemRegistry.ts",
  "lib/control-plane/hardeningRegistry.ts",
  "lib/control-plane/placementGate.ts",
  "lib/control-plane/internationalDocumentExecutionProfile.ts",
  "lib/control-plane/__tests__/systemControlPlane.test.ts",
  "lib/control-plane/__tests__/internationalDocumentExecutionProfile.test.ts",
  "app/dashboard/control-plane/page.tsx",
  "components/control-plane/SystemControlPlaneModes.tsx",
  "components/control-plane/InternationalExecutionControlPanel.tsx",
  "docs/control-plane/01_EXECUTIVE_PLATFORM_OVERVIEW.md",
  "docs/control-plane/02_MASTER_ARCHITECTURE_BLUEPRINT.md",
  "docs/control-plane/03_SYSTEM_REGISTRY.md",
  "docs/control-plane/04_CANONICAL_MATTER_EXECUTION_CONTRACT.md",
  "docs/control-plane/05_WORKSPACE_UX_MAP.md",
  "docs/control-plane/06_PRODUCTION_READINESS_ROADMAP.md",
  "docs/control-plane/07_INTERNATIONAL_EXECUTION_DOMAIN_PROFILE.md",
  "docs/control-plane/09_MATTER_360_PROJECTION_GOVERNANCE.md",
];

const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing required control-plane file: ${file}`);
}

if (!failures.length) {
  const registry = read("lib/control-plane/systemRegistry.ts");
  const hardeningRegistry = read("lib/control-plane/hardeningRegistry.ts");
  const placement = read("lib/control-plane/placementGate.ts");
  const domain = read("lib/control-plane/internationalDocumentExecutionProfile.ts");
  const page = read("app/dashboard/control-plane/page.tsx");
  const modes = read("components/control-plane/SystemControlPlaneModes.tsx");
  const internationalPanel = read("components/control-plane/InternationalExecutionControlPanel.tsx");
  const shell = read("components/dashboard/OperatorShell.tsx");
  const runGate = read("scripts/run-vercel-merge-gate.mjs");
  const routeMap = read("docs/ROUTE_MAP.md");
  const domainDoc = read("docs/control-plane/07_INTERNATIONAL_EXECUTION_DOMAIN_PROFILE.md");
  const matter360Doc = read("docs/control-plane/09_MATTER_360_PROJECTION_GOVERNANCE.md");
  const composedUi = [page, modes, internationalPanel].join("\n");

  for (const system of ["demand", "matter_control", "execution_network", "intelligence_control", "governance_platform"]) {
    if (!registry.includes(`\"${system}\"`)) failures.push(`Missing parent system: ${system}`);
  }

  for (const status of ["CONCEPT", "SPECIFIED", "BUILT", "WIRED", "GATED", "DEPLOYED", "LIVE_PROVEN", "CERTIFIED"]) {
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

  for (const compositionToken of [
    'from "@/components/control-plane/SystemControlPlaneModes"',
    'from "@/components/control-plane/InternationalExecutionControlPanel"',
    "<SystemControlPlaneModes",
    "<InternationalExecutionControlPanel",
    "assertSystemRegistryIntegrity",
    "validateArchitectureGovernance",
  ]) {
    if (!page.includes(compositionToken)) failures.push(`Control-plane page composition missing: ${compositionToken}`);
  }

  for (const surface of [
    "International Document Execution OS",
    "Five systems. One transaction truth.",
    "From intake to international release",
    "Registry Explorer",
    "Architecture decisions, external dependencies and webhooks",
    "What requires attention?",
    "Payment Authority",
    "Matter Engine",
    "Intelligence",
    "International Execution Governance",
    "Authority evidence, Hague coverage and document-origin routing",
    "Document-origin routing matrix",
    "Receiving Authority",
    "RON",
    "Witnesses",
    "Translation",
    "Original / Copy",
  ]) {
    if (!composedUi.includes(surface)) failures.push(`Composed Control Plane UI missing surface: ${surface}`);
  }

  if (!modes.includes("FULL_SYSTEM_REGISTRY")) failures.push("Control Plane registry explorer is not bound to the full registered capability set.");
  if (!modes.includes("coverage.contractingParties")) failures.push("Control Plane HCCH count is not sourced from governed runtime coverage.");

  for (const domainToken of [
    "contractingParties: 130",
    'authority: "HCCH"',
    'id: "ron_execution"',
    'id: "state_apostille"',
    'id: "federal_authentication"',
    'id: "non_hague_legalization"',
    "receivingAuthorityAlwaysControlsFinalAcceptance: true",
    "noAutomaticNotarialActSelection: true",
    "noAutomaticApostilleSelection: true",
    "noAutomaticRONSelection: true",
    "stateAndFederalAuthoritiesRemainDistinct: true",
  ]) {
    if (!domain.includes(domainToken)) failures.push(`International execution domain model missing: ${domainToken}`);
  }

  for (const fact of [
    "document_identity",
    "origin_country_or_state",
    "destination_country",
    "receiving_authority",
    "notarial_act",
    "execution_method",
    "translation_requirement",
    "apostille_or_authentication_requirement",
    "competent_authority",
  ]) {
    if (!domain.includes(`\"${fact}\"`)) failures.push(`International Matter contract missing fact: ${fact}`);
  }

  for (const phrase of [
    "130 Contracting Parties",
    "Remote Online Notarization",
    "State Apostille",
    "Federal Authentication",
    "Non-Hague Authentication / Consular Legalization",
    "Final Acceptance Boundary",
  ]) {
    if (!domainDoc.includes(phrase)) failures.push(`International execution documentation missing: ${phrase}`);
  }

  for (const capability of [
    "matter_truth_snapshot_archive",
    "matter_output_envelopes",
    "matter_evidence_reconciliation",
    "matter_provenance_matrix",
  ]) {
    if (!hardeningRegistry.includes(`id: \"${capability}\"`)) failures.push(`Matter 360 capability missing from hardening registry: ${capability}`);
  }
  if (!matter360Doc.includes("external architecture pattern → Milano-specific implementation")) failures.push("Matter 360 governance does not preserve the external-pattern / Milano-runtime boundary rule.");

  if (!shell.includes('href: "/dashboard/control-plane"')) failures.push("Operator navigation does not expose the System Control Plane.");
  if (!routeMap.includes("`/dashboard/control-plane`")) failures.push("Canonical route map does not register the System Control Plane.");
  if (!runGate.includes("scripts/validate-system-control-plane.mjs")) failures.push("Vercel production merge gate does not enforce System Control Plane governance.");
  if (!registry.includes("INTERNAL_MODULES.map")) failures.push("Legacy internal module registry is not adapted into the master System Registry.");
  if (!registry.includes("EXPANSION_MODULES.map")) failures.push("Institutional expansion modules are not adapted into the master System Registry.");
  if (registry.includes("Stripe") || domain.includes("Stripe") || hardeningRegistry.includes("Stripe")) failures.push("System Control Plane reintroduced prohibited Stripe language.");
  if (!registry.includes("oneMatterEngine")) failures.push("System Control Plane does not preserve one-Matter-engine governance.");
  if (/129 Contracting Parties|contractingParties:\s*129/.test([domain, domainDoc, hardeningRegistry, composedUi].join("\n"))) failures.push("Stale HCCH 129-party truth remains in active Control Plane sources.");
}

if (failures.length) {
  console.error("System Control Plane validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS System Control Plane: composed five-system UI plus international document execution, RON, 130-party Hague Apostille Convention governance, state/federal routing, Matter 360 projections, receiving-authority review and fail-closed release controls are locked.");
