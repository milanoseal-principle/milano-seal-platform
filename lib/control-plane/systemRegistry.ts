import { INTERNAL_MODULES } from "@/lib/internal/moduleRegistry";
import { EXPANSION_MODULES } from "@/lib/expansion/institutionalExpansion";

export const PARENT_SYSTEMS = [
  "demand",
  "matter_control",
  "execution_network",
  "intelligence_control",
  "governance_platform",
] as const;

export type ParentSystem = (typeof PARENT_SYSTEMS)[number];

export const REGISTRY_CATEGORIES = [
  "core_engine",
  "workspace",
  "public_surface",
  "intelligence_surface",
  "integration",
  "data_authority",
  "sop",
  "validator_gate",
  "report_export",
  "future_dormant",
] as const;

export type RegistryCategory = (typeof REGISTRY_CATEGORIES)[number];

export const DELIVERY_STATUSES = [
  "CONCEPT",
  "SPECIFIED",
  "BUILT",
  "WIRED",
  "GATED",
  "DEPLOYED",
  "LIVE_PROVEN",
  "CERTIFIED",
] as const;

export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const AUDIENCES = [
  "public",
  "client",
  "operator",
  "va",
  "alliance",
  "system_only",
  "investor_partner",
] as const;

export type RegistryAudience = (typeof AUDIENCES)[number];
export type MutationPolicy = "read_only" | "governed_write" | "system_write" | "none";
export type AuthorityMode = "canonical" | "derived" | "external_verified" | "procedural";

export interface CanonicalAuthority {
  id: string;
  domain: string;
  authority: string;
  mode: AuthorityMode;
  sourcePath?: string;
}

export interface SystemRegistryEntry {
  id: string;
  name: string;
  parentSystem: ParentSystem;
  category: RegistryCategory;
  purpose: string;
  audiences: RegistryAudience[];
  authorityIds: string[];
  authorityMode: AuthorityMode;
  mutationPolicy: MutationPolicy;
  route?: string;
  sourcePaths: string[];
  dependencies: string[];
  validation: string[];
  status: DeliveryStatus;
  owner: "Founder" | "CTO" | "Operator" | "Platform";
  duplicateKey: string;
  notes?: string;
}

export const CANONICAL_AUTHORITIES: CanonicalAuthority[] = [
  { id: "matter", domain: "Matter", authority: "Supabase canonical Matter/deal record", mode: "canonical", sourcePath: "lib/matter/canonicalOperationalRead.ts" },
  { id: "state", domain: "State", authority: "Canonical Matter state machine", mode: "canonical", sourcePath: "data/matter-state-machine.ts" },
  { id: "pricing", domain: "Pricing", authority: "Canonical Milano pricing engine", mode: "canonical", sourcePath: "lib/pricing" },
  { id: "payment", domain: "Payment", authority: "Wise verified settlement", mode: "external_verified", sourcePath: "lib/wise" },
  { id: "scheduling", domain: "Scheduling", authority: "Canonical payment + execution scheduling gates", mode: "canonical", sourcePath: "lib/scheduling" },
  { id: "authority_routing", domain: "Authority routing", authority: "Verified authority/compliance registry", mode: "external_verified", sourcePath: "data/authorities" },
  { id: "execution", domain: "Execution", authority: "Canonical execution truth", mode: "canonical", sourcePath: "lib/matter/executionTruth.ts" },
  { id: "alliance", domain: "Partner eligibility", authority: "Canonical Alliance governance and eligibility", mode: "canonical", sourcePath: "lib/alliance" },
  { id: "custody_release", domain: "Custody / release", authority: "Governed custody and release evidence", mode: "canonical", sourcePath: "src/features/release" },
  { id: "delivery", domain: "Delivery", authority: "Carrier/provider delivery evidence", mode: "external_verified", sourcePath: "app/api/webhooks" },
  { id: "identity", domain: "Identity / access", authority: "Supabase Auth + governed role mapping + RLS", mode: "canonical", sourcePath: "lib/access" },
  { id: "intelligence", domain: "Intelligence", authority: "Derived projections over canonical evidence; never an independent source of truth", mode: "derived", sourcePath: "lib/operator-intelligence" },
  { id: "brand", domain: "Brand", authority: "Locked Milano Seal brand system", mode: "procedural", sourcePath: "docs/brand/MILANO_SEAL_BRAND_SYSTEM_LOCKED.md" },
  { id: "sop", domain: "SOP", authority: "Locked production SOP and deployment runbook", mode: "procedural", sourcePath: "docs" },
];

const EXPLICIT_REGISTRY: SystemRegistryEntry[] = [
  {
    id: "platform_public_demand",
    name: "Public Demand Surface",
    parentSystem: "demand",
    category: "public_surface",
    purpose: "Public website, authority acquisition, professional entry points and governed conversion into Matter intake.",
    audiences: ["public", "investor_partner"],
    authorityIds: ["brand", "sop"],
    authorityMode: "procedural",
    mutationPolicy: "none",
    route: "/",
    sourcePaths: ["app/page.tsx", "components/home", "components/seo"],
    dependencies: ["brand", "matter_intake"],
    validation: ["scripts/validate-milano-brand-throughout.mjs", "scripts/validate-public-copy-safety.mjs"],
    status: "GATED",
    owner: "Platform",
    duplicateKey: "public-demand-surface",
  },
  {
    id: "matter_intake",
    name: "Secure Matter Intake",
    parentSystem: "matter_control",
    category: "core_engine",
    purpose: "Capture and persist canonical Matter facts without inventing execution truth or transaction authorization.",
    audiences: ["public", "client", "operator"],
    authorityIds: ["matter", "state", "execution"],
    authorityMode: "canonical",
    mutationPolicy: "governed_write",
    route: "/intake",
    sourcePaths: ["app/intake", "app/api/intake", "lib/matter"],
    dependencies: ["matter", "state", "execution"],
    validation: ["scripts/validate-smart-intake-sop.mjs", "scripts/validate-final-production-regression.mjs"],
    status: "GATED",
    owner: "Platform",
    duplicateKey: "canonical-matter-intake",
  },
  {
    id: "matter_state_machine",
    name: "Canonical Matter State Machine",
    parentSystem: "matter_control",
    category: "data_authority",
    purpose: "Control legal lifecycle progression for every Matter through one canonical state model.",
    audiences: ["system_only", "operator", "investor_partner"],
    authorityIds: ["state"],
    authorityMode: "canonical",
    mutationPolicy: "governed_write",
    sourcePaths: ["data/matter-state-machine.ts", "lib/matter"],
    dependencies: ["matter"],
    validation: ["scripts/validate-canonical-foundation.mjs", "scripts/validate-production-governance.mjs"],
    status: "GATED",
    owner: "CTO",
    duplicateKey: "matter-state-machine",
  },
  {
    id: "wise_payment_authority",
    name: "Wise Payment Authority",
    parentSystem: "matter_control",
    category: "integration",
    purpose: "Verify settlement truth and preserve Wise as the sole canonical Milano payment authority.",
    audiences: ["operator", "client", "system_only", "investor_partner"],
    authorityIds: ["payment", "matter"],
    authorityMode: "external_verified",
    mutationPolicy: "system_write",
    sourcePaths: ["lib/wise", "app/api/webhooks/wise"],
    dependencies: ["matter", "pricing"],
    validation: ["scripts/validate-wise-only-active-ops-docs.mjs", "scripts/validate-final-production-regression.mjs"],
    status: "GATED",
    owner: "Platform",
    duplicateKey: "wise-payment-authority",
    notes: "LIVE_PROVEN and CERTIFIED remain human/live acceptance states and are not asserted here.",
  },
  {
    id: "scheduling_gate",
    name: "Payment-Gated Scheduling",
    parentSystem: "matter_control",
    category: "core_engine",
    purpose: "Block scheduling until canonical payment and execution requirements are satisfied.",
    audiences: ["client", "operator", "system_only"],
    authorityIds: ["scheduling", "payment", "execution", "matter"],
    authorityMode: "canonical",
    mutationPolicy: "governed_write",
    sourcePaths: ["lib/scheduling", "app/api"],
    dependencies: ["wise_payment_authority", "matter_state_machine"],
    validation: ["scripts/validate-cross-system-gates.mjs", "scripts/validate-production-governance.mjs"],
    status: "GATED",
    owner: "Platform",
    duplicateKey: "payment-gated-scheduling",
  },
  {
    id: "authority_compliance",
    name: "Authority & Compliance Routing",
    parentSystem: "matter_control",
    category: "data_authority",
    purpose: "Provide source-backed apostille/authentication and receiving-authority routing with fail-closed review when evidence is stale or missing.",
    audiences: ["operator", "system_only", "investor_partner"],
    authorityIds: ["authority_routing", "execution"],
    authorityMode: "external_verified",
    mutationPolicy: "governed_write",
    route: "/dashboard/compliance-atlas",
    sourcePaths: ["data/authorities", "data/global-compliance-atlas.ts", "lib/apostille-rules"],
    dependencies: ["matter", "execution"],
    validation: ["scripts/validate-apostille-authentication-rules.mjs", "scripts/validate-nonhuman-production-hardening.mjs"],
    status: "GATED",
    owner: "CTO",
    duplicateKey: "authority-compliance-routing",
  },
  {
    id: "execution_release",
    name: "Execution, Custody & Release",
    parentSystem: "matter_control",
    category: "core_engine",
    purpose: "Govern execution evidence, physical/digital custody, courier handoff and release without bypassing payment or authority truth.",
    audiences: ["operator", "system_only"],
    authorityIds: ["execution", "custody_release", "payment", "delivery"],
    authorityMode: "canonical",
    mutationPolicy: "governed_write",
    route: "/workspace/release",
    sourcePaths: ["lib/matter/executionTruth.ts", "src/features/release", "app/workspace/release"],
    dependencies: ["matter_state_machine", "wise_payment_authority", "authority_compliance"],
    validation: ["scripts/validate-production-governance.mjs", "scripts/validate-source-database-wiring.mjs"],
    status: "GATED",
    owner: "Operator",
    duplicateKey: "execution-custody-release",
  },
  {
    id: "workspace_client",
    name: "Client Workspace",
    parentSystem: "matter_control",
    category: "workspace",
    purpose: "Expose only the client-owned Matter status, documents, invoice/payment state, timeline, tracking and governed next actions.",
    audiences: ["client"],
    authorityIds: ["matter", "state", "payment", "delivery", "identity"],
    authorityMode: "derived",
    mutationPolicy: "governed_write",
    route: "/portal",
    sourcePaths: ["app/portal", "components/portal"],
    dependencies: ["identity", "matter", "payment"],
    validation: ["scripts/validate-milano-os-surface-unification.mjs", "scripts/validate-client-touchpoint-wiring.mjs"],
    status: "GATED",
    owner: "Platform",
    duplicateKey: "client-workspace",
  },
  {
    id: "workspace_operator",
    name: "Operator Workspace",
    parentSystem: "intelligence_control",
    category: "workspace",
    purpose: "Primary internal operating system for Today, Matters, Execution, Intelligence, Finance, Network, Growth and System control.",
    audiences: ["operator", "investor_partner"],
    authorityIds: ["matter", "state", "intelligence", "identity"],
    authorityMode: "derived",
    mutationPolicy: "governed_write",
    route: "/dashboard",
    sourcePaths: ["app/dashboard", "components/dashboard/OperatorShell.tsx"],
    dependencies: ["identity", "matter_state_machine"],
    validation: ["scripts/validate-milano-os-surface-unification.mjs", "scripts/validate-milano-operator-intelligence.mjs"],
    status: "GATED",
    owner: "Operator",
    duplicateKey: "operator-workspace",
  },
  {
    id: "workspace_va",
    name: "VA Workspace",
    parentSystem: "execution_network",
    category: "workspace",
    purpose: "Provide assigned operational work without finance authority, release authority or uncontrolled Matter mutation.",
    audiences: ["va"],
    authorityIds: ["matter", "identity", "sop"],
    authorityMode: "derived",
    mutationPolicy: "governed_write",
    route: "/va/dashboard",
    sourcePaths: ["app/va", "components/va"],
    dependencies: ["identity", "matter"],
    validation: ["scripts/validate-va-operator-touchpoint-wiring.mjs", "scripts/validate-nonhuman-production-hardening.mjs"],
    status: "GATED",
    owner: "Operator",
    duplicateKey: "va-workspace",
  },
  {
    id: "workspace_alliance",
    name: "Alliance Workspace",
    parentSystem: "execution_network",
    category: "workspace",
    purpose: "Expose partner profile, certification, capacity, assigned work, proof submission and scoped execution status.",
    audiences: ["alliance"],
    authorityIds: ["alliance", "identity", "matter"],
    authorityMode: "derived",
    mutationPolicy: "governed_write",
    route: "/alliance/dashboard",
    sourcePaths: ["app/alliance", "lib/alliance", "components/alliance"],
    dependencies: ["identity", "alliance"],
    validation: ["scripts/validate-alliance-touchpoint-wiring.mjs", "scripts/validate-milano-trust-alliance-platform.mjs"],
    status: "GATED",
    owner: "Platform",
    duplicateKey: "alliance-workspace",
  },
  {
    id: "operator_intelligence",
    name: "Operator Intelligence & Exception Spine",
    parentSystem: "intelligence_control",
    category: "intelligence_surface",
    purpose: "Interpret canonical Matter evidence into governed operator actions without becoming a second Matter engine.",
    audiences: ["operator", "system_only"],
    authorityIds: ["intelligence", "matter", "state", "payment", "execution"],
    authorityMode: "derived",
    mutationPolicy: "read_only",
    route: "/dashboard/operator-spine",
    sourcePaths: ["lib/operator-intelligence", "lib/operator-spine", "app/dashboard/operator-spine"],
    dependencies: ["matter", "state", "payment", "execution"],
    validation: ["scripts/validate-milano-operator-intelligence.mjs", "scripts/validate-operator-intelligence-spine.mjs"],
    status: "GATED",
    owner: "Operator",
    duplicateKey: "operator-intelligence-spine",
  },
  {
    id: "institutional_expansion",
    name: "Institutional Expansion Intelligence",
    parentSystem: "intelligence_control",
    category: "intelligence_surface",
    purpose: "Govern reconciliation, truth alerts, evidence graph, return signals, Trust Engine 2.0 and Alliance intelligence as derived projections.",
    audiences: ["operator", "investor_partner"],
    authorityIds: ["intelligence", "matter", "payment", "authority_routing", "alliance"],
    authorityMode: "derived",
    mutationPolicy: "read_only",
    route: "/dashboard/expansion",
    sourcePaths: ["lib/expansion/institutionalExpansion.ts", "app/dashboard/expansion/page.tsx"],
    dependencies: ["operator_intelligence", "authority_compliance", "workspace_alliance"],
    validation: ["scripts/validate-institutional-expansion.mjs"],
    status: "GATED",
    owner: "CTO",
    duplicateKey: "institutional-expansion-intelligence",
  },
  {
    id: "supabase_platform",
    name: "Supabase Data/Auth Platform",
    parentSystem: "governance_platform",
    category: "integration",
    purpose: "Provide canonical database, authentication and storage infrastructure under role/RLS governance.",
    audiences: ["system_only", "investor_partner"],
    authorityIds: ["matter", "identity"],
    authorityMode: "canonical",
    mutationPolicy: "system_write",
    sourcePaths: ["lib/supabase", "supabase"],
    dependencies: [],
    validation: ["scripts/validate-production-governance.mjs", "scripts/validate-migration-chain.mjs"],
    status: "GATED",
    owner: "Platform",
    duplicateKey: "supabase-platform",
  },
  {
    id: "vercel_deployment",
    name: "Vercel Production Deployment",
    parentSystem: "governance_platform",
    category: "integration",
    purpose: "Build and deploy the production application only after the canonical merge-gate suite passes.",
    audiences: ["system_only", "investor_partner"],
    authorityIds: ["sop"],
    authorityMode: "procedural",
    mutationPolicy: "system_write",
    sourcePaths: ["vercel.json", "scripts/run-vercel-merge-gate.mjs"],
    dependencies: ["system_control_plane"],
    validation: ["scripts/run-vercel-merge-gate.mjs"],
    status: "GATED",
    owner: "Platform",
    duplicateKey: "vercel-production-deployment",
  },
  {
    id: "production_certification",
    name: "Production Readiness & Certification",
    parentSystem: "governance_platform",
    category: "sop",
    purpose: "Separate code/deployment readiness from real transaction proof, role-session proof, notification delivery evidence and Final Truth Review.",
    audiences: ["operator", "system_only", "investor_partner"],
    authorityIds: ["sop"],
    authorityMode: "procedural",
    mutationPolicy: "none",
    sourcePaths: ["docs/FINAL_PRODUCTION_CERTIFICATION.md", "scripts/validate-tiff-15-step-production-certification.mjs"],
    dependencies: ["vercel_deployment", "wise_payment_authority"],
    validation: ["scripts/validate-tiff-15-step-production-certification.mjs"],
    status: "GATED",
    owner: "Founder",
    duplicateKey: "production-certification",
    notes: "GATED does not mean LIVE_PROVEN or CERTIFIED.",
  },
  {
    id: "system_control_plane",
    name: "Milano Seal System Control Plane",
    parentSystem: "governance_platform",
    category: "workspace",
    purpose: "Describe and govern the entire platform: parent systems, modules, routes, authorities, workspaces, integrations, status, ownership, dependencies and placement rules.",
    audiences: ["operator", "system_only", "investor_partner"],
    authorityIds: ["sop", "brand", "intelligence"],
    authorityMode: "procedural",
    mutationPolicy: "read_only",
    route: "/dashboard/control-plane",
    sourcePaths: ["lib/control-plane/systemRegistry.ts", "app/dashboard/control-plane/page.tsx"],
    dependencies: [],
    validation: ["scripts/validate-system-control-plane.mjs"],
    status: "GATED",
    owner: "CTO",
    duplicateKey: "system-control-plane",
  },
];

const INTERNAL_STATUS_MAP: Record<string, DeliveryStatus> = {
  live: "BUILT",
  staged: "SPECIFIED",
  planned: "CONCEPT",
  blocked: "SPECIFIED",
  staged_only: "SPECIFIED",
};

function mapInternalParent(section: string): ParentSystem {
  if (["Revenue", "Growth"].includes(section)) return "demand";
  if (["Execution", "Documents"].includes(section)) return "matter_control";
  if (["Intelligence", "Operations"].includes(section)) return "intelligence_control";
  return "governance_platform";
}

const INTERNAL_REGISTRY_ADAPTERS: SystemRegistryEntry[] = INTERNAL_MODULES.map((module) => ({
  id: `internal:${module.id}`,
  name: module.label,
  parentSystem: mapInternalParent(module.section),
  category: module.status === "staged_only" ? "future_dormant" : "intelligence_surface",
  purpose: module.description,
  audiences: module.visibility === "founder" ? ["operator"] : module.visibility === "staged_only" ? ["system_only"] : ["operator"],
  authorityIds: ["intelligence", "sop"],
  authorityMode: "derived",
  mutationPolicy: module.riskLevel === "payment_sensitive" ? "governed_write" : "read_only",
  route: module.href,
  sourcePaths: ["lib/internal/moduleRegistry.ts"],
  dependencies: [],
  validation: ["scripts/validate-internal-module-registry.mjs"],
  status: INTERNAL_STATUS_MAP[module.status] ?? "SPECIFIED",
  owner: "Operator",
  duplicateKey: `legacy-internal-${module.id}`,
  notes: "Legacy internal-module registry adapter. Control Plane status does not silently upgrade legacy module readiness.",
}));

const EXPANSION_REGISTRY_ADAPTERS: SystemRegistryEntry[] = EXPANSION_MODULES.map((module) => ({
  id: `expansion:${module}`,
  name: module.replaceAll("_", " "),
  parentSystem: module === "alliance_intelligence" ? "execution_network" : "intelligence_control",
  category: "intelligence_surface",
  purpose: "Governed institutional expansion capability derived from canonical evidence.",
  audiences: ["operator", "system_only"],
  authorityIds: ["intelligence", "matter"],
  authorityMode: "derived",
  mutationPolicy: "read_only",
  route: "/dashboard/expansion",
  sourcePaths: ["lib/expansion/institutionalExpansion.ts"],
  dependencies: ["institutional_expansion"],
  validation: ["scripts/validate-institutional-expansion.mjs"],
  status: "GATED",
  owner: "CTO",
  duplicateKey: `institutional-${module}`,
}));

export const SYSTEM_REGISTRY: SystemRegistryEntry[] = [
  ...EXPLICIT_REGISTRY,
  ...INTERNAL_REGISTRY_ADAPTERS,
  ...EXPANSION_REGISTRY_ADAPTERS,
];

export const SYSTEM_LABELS: Record<ParentSystem, string> = {
  demand: "1. Demand",
  matter_control: "2. Matter Control",
  execution_network: "3. Execution Network",
  intelligence_control: "4. Intelligence & Control",
  governance_platform: "5. Governance & Platform",
};

export function getRegistryBySystem(system: ParentSystem) {
  return SYSTEM_REGISTRY.filter((entry) => entry.parentSystem === system);
}

export function getRegistryByAudience(audience: RegistryAudience) {
  return SYSTEM_REGISTRY.filter((entry) => entry.audiences.includes(audience));
}

export function getRegistryEntry(id: string) {
  return SYSTEM_REGISTRY.find((entry) => entry.id === id) ?? null;
}

export function getAuthority(id: string) {
  return CANONICAL_AUTHORITIES.find((authority) => authority.id === id) ?? null;
}

export function isLiveStatus(status: DeliveryStatus) {
  return ["DEPLOYED", "LIVE_PROVEN", "CERTIFIED"].includes(status);
}

export const CONTROL_PLANE_GOVERNANCE = {
  oneMatterEngine: true,
  intelligenceCannotOverwriteTruth: true,
  wiseOnlyPaymentAuthority: true,
  unregisteredProductionModuleMergeBlocked: true,
  liveProofCannotBeInferredFromCode: true,
  certificationCannotBeSelfAsserted: true,
} as const;
