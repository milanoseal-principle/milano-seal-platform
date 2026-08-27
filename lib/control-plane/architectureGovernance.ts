import {
  CANONICAL_AUTHORITIES,
  SYSTEM_REGISTRY,
  type ParentSystem,
  type SystemRegistryEntry,
} from "@/lib/control-plane/systemRegistry";

export type AccountabilityClass =
  | "Founder"
  | "CTO"
  | "Operator"
  | "Platform"
  | "VA"
  | "Alliance"
  | "External Provider";

export interface CapabilityOwnership {
  capabilityId: string;
  primaryOwner: AccountabilityClass;
  operationalOwner: AccountabilityClass;
  technicalOwner: AccountabilityClass;
  evidenceOwner: AccountabilityClass;
  escalationOwner: AccountabilityClass;
  externalProvider?: string;
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: "data" | "gate" | "execution" | "evidence" | "presentation";
  authorityId?: string;
  blocking: boolean;
  mode: "canonical" | "derived";
  validation: string[];
}

export type AdrStatus = "ACTIVE" | "SUPERSEDED" | "PROPOSED";
export interface ArchitectureDecision {
  id: string;
  title: string;
  status: AdrStatus;
  date: string;
  decisionOwner: AccountabilityClass;
  systemsAffected: ParentSystem[];
  decision: string;
  reason: string;
  canonicalAuthorities: string[];
  supersedes?: string[];
  supersededBy?: string;
  sourceFiles: string[];
  validation: string[];
  notes?: string;
}

export type DebtSeverity = "low" | "medium" | "high" | "critical";
export type DebtStatus = "open" | "planned" | "in_progress" | "blocked" | "resolved" | "accepted";
export interface TechnicalDebtRecord {
  id: string;
  title: string;
  description: string;
  parentSystem: ParentSystem;
  capabilityId: string;
  severity: DebtSeverity;
  owner: AccountabilityClass;
  createdAt: string;
  status: DebtStatus;
  dependencies: string[];
  risk: string;
  acceptanceTest: string;
  targetRelease?: string;
  sourcePaths: string[];
  resolutionEvidence?: string[];
  acceptanceRationale?: string;
}

export type DependencyHealth = "CONFIGURED" | "MISSING" | "DEGRADED" | "UNVERIFIED" | "HEALTHY";
export interface EnvironmentDependency {
  id: string;
  provider: string;
  purpose: string;
  parentSystem: ParentSystem;
  environmentVariables: string[];
  requiredInProduction: boolean;
  requiredInPreview: boolean;
  secretOwner: AccountabilityClass;
  healthCheckType: "configured_only" | "api_health" | "webhook_evidence" | "deployment_metadata";
  lastVerifiedAt?: string;
  status: DependencyHealth;
  failureImpact: string;
  relatedCapabilities: string[];
}

export interface WebhookGovernanceRecord {
  id: string;
  provider: string;
  route: string;
  eventTypes: string[];
  authMethod: string;
  signatureVerification: string;
  idempotencyKey: string;
  dedupeStrategy: string;
  retryPolicy: string;
  failureHandling: string;
  auditEvent: string;
  canonicalMutationAllowed: string[];
  owner: AccountabilityClass;
  status: "ACTIVE" | "UNVERIFIED" | "DISABLED";
  tests: string[];
}

export type OperationalAlertClass =
  | "payment_failure"
  | "payment_reconciliation_failure"
  | "authority_stale"
  | "authority_missing_source"
  | "webhook_failure"
  | "webhook_signature_failure"
  | "notification_failure"
  | "delivery_failure"
  | "release_gate_violation"
  | "courier_exception"
  | "role_auth_anomaly"
  | "database_failure"
  | "external_provider_failure";

export interface OperationalAlert {
  id: string;
  class: OperationalAlertClass;
  severity: "CRITICAL" | "BLOCKING" | "WARNING" | "INFO";
  matterId?: string;
  provider?: string;
  source: string;
  correlationId?: string;
  owner: AccountabilityClass;
  occurredAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  deepLink: string;
  safeMetadata: Record<string, string | number | boolean | null>;
}

export const ARCHITECTURE_DECISIONS: readonly ArchitectureDecision[] = [
  { id: "ADR-001", title: "Wise is the canonical payment authority", status: "ACTIVE", date: "2026-08-27", decisionOwner: "CTO", systemsAffected: ["matter_control", "governance_platform"], decision: "Verified Wise settlement is the canonical external payment truth for Milano Seal.", reason: "Prevents competing settlement states and false scheduling/release unlocks.", canonicalAuthorities: ["payment", "matter"], sourceFiles: ["lib/wise", "lib/control-plane/systemRegistry.ts"], validation: ["scripts/validate-wise-only-active-ops-docs.mjs"] },
  { id: "ADR-002", title: "One canonical Matter engine", status: "ACTIVE", date: "2026-08-27", decisionOwner: "CTO", systemsAffected: ["matter_control", "intelligence_control"], decision: "All workflows project from one canonical Matter lifecycle.", reason: "Prevents logic drift between UI, intelligence and execution modules.", canonicalAuthorities: ["matter", "state"], sourceFiles: ["data/matter-state-machine.ts", "lib/matter"], validation: ["scripts/validate-canonical-foundation.mjs"] },
  { id: "ADR-003", title: "RON is never inferred", status: "ACTIVE", date: "2026-08-27", decisionOwner: "CTO", systemsAffected: ["matter_control", "execution_network"], decision: "RON eligibility requires explicit signer, notarial, platform, identity and receiving-authority evidence.", reason: "Remote execution cannot be safely selected from absent or generic mobile facts.", canonicalAuthorities: ["execution", "authority_routing"], sourceFiles: ["lib/control-plane/internationalDocumentExecutionProfile.ts"], validation: ["scripts/validate-system-control-plane.mjs"] },
  { id: "ADR-004", title: "Notarization and apostille are independent decisions", status: "ACTIVE", date: "2026-08-27", decisionOwner: "CTO", systemsAffected: ["matter_control"], decision: "Document category does not auto-select a notarial act or apostille path.", reason: "Execution and authentication are legally and operationally distinct decisions.", canonicalAuthorities: ["execution", "authority_routing"], sourceFiles: ["lib/apostille-rules", "lib/control-plane/internationalDocumentExecutionProfile.ts"], validation: ["scripts/validate-apostille-authentication-rules.mjs"] },
  { id: "ADR-005", title: "State and federal authority paths remain distinct", status: "ACTIVE", date: "2026-08-27", decisionOwner: "CTO", systemsAffected: ["matter_control"], decision: "Federal documents cannot inherit state apostille routing.", reason: "Competent authority depends on document origin and issuing jurisdiction.", canonicalAuthorities: ["authority_routing"], sourceFiles: ["lib/control-plane/internationalDocumentExecutionProfile.ts"], validation: ["scripts/validate-system-control-plane.mjs"] },
  { id: "ADR-006", title: "Receiving authority controls final acceptance", status: "ACTIVE", date: "2026-08-27", decisionOwner: "Operator", systemsAffected: ["matter_control", "execution_network"], decision: "Country-level routing never overrides verified receiving-authority requirements.", reason: "Final acceptance belongs to the actual court, registry, agency, bank, counsel or institution receiving the document.", canonicalAuthorities: ["authority_routing"], sourceFiles: ["data/global-compliance-atlas.ts"], validation: ["scripts/validate-system-control-plane.mjs"] },
  { id: "ADR-007", title: "Intelligence is derived", status: "ACTIVE", date: "2026-08-27", decisionOwner: "CTO", systemsAffected: ["intelligence_control"], decision: "Intelligence surfaces are read-only by default and cannot silently mutate canonical truth.", reason: "Keeps interpretation separate from transaction authority.", canonicalAuthorities: ["intelligence", "matter"], sourceFiles: ["lib/operator-intelligence", "lib/expansion/institutionalExpansion.ts"], validation: ["scripts/validate-milano-operator-intelligence.mjs"] },
  { id: "ADR-008", title: "Missing or stale authority evidence fails closed", status: "ACTIVE", date: "2026-08-27", decisionOwner: "CTO", systemsAffected: ["matter_control", "intelligence_control"], decision: "Critical authority facts require current provenance before READY routing.", reason: "Prevents stale international routing from becoming execution truth.", canonicalAuthorities: ["authority_routing"], sourceFiles: ["data/global-compliance-atlas.ts"], validation: ["scripts/validate-nonhuman-production-hardening.mjs"] },
  { id: "ADR-009", title: "Release requires governed evidence", status: "ACTIVE", date: "2026-08-27", decisionOwner: "Operator", systemsAffected: ["matter_control"], decision: "Release is gated by payment, execution, authority, custody and required delivery evidence.", reason: "Prevents premature or false-success release.", canonicalAuthorities: ["payment", "execution", "custody_release", "delivery"], sourceFiles: ["src/features/release"], validation: ["scripts/validate-production-governance.mjs"] },
  { id: "ADR-010", title: "Code cannot self-certify production truth", status: "ACTIVE", date: "2026-08-27", decisionOwner: "Founder", systemsAffected: ["governance_platform"], decision: "Build/deploy state cannot promote LIVE_PROVEN or CERTIFIED without required live/human evidence.", reason: "Separates code correctness from transaction and human acceptance evidence.", canonicalAuthorities: ["sop"], sourceFiles: ["docs/FINAL_PRODUCTION_CERTIFICATION.md"], validation: ["scripts/validate-tiff-15-step-production-certification.mjs"] },
] as const;

const ownerFromLegacy = (entry: SystemRegistryEntry): AccountabilityClass => entry.owner;
export const CAPABILITY_OWNERSHIP: readonly CapabilityOwnership[] = SYSTEM_REGISTRY.map((entry) => ({
  capabilityId: entry.id,
  primaryOwner: ownerFromLegacy(entry),
  operationalOwner: entry.parentSystem === "execution_network" ? "Operator" : ownerFromLegacy(entry),
  technicalOwner: "CTO",
  evidenceOwner: entry.authorityMode === "external_verified" ? "Operator" : ownerFromLegacy(entry),
  escalationOwner: "Founder",
  externalProvider: entry.authorityIds.includes("payment") ? "Wise" : undefined,
}));

export const DEPENDENCY_GRAPH: readonly DependencyEdge[] = [
  { from: "platform_public_demand", to: "matter_intake", type: "execution", blocking: false, mode: "canonical", validation: ["scripts/validate-smart-intake-sop.mjs"] },
  { from: "matter_intake", to: "matter_state_machine", type: "data", authorityId: "matter", blocking: true, mode: "canonical", validation: ["scripts/validate-canonical-foundation.mjs"] },
  { from: "matter_state_machine", to: "wise_payment_authority", type: "gate", authorityId: "payment", blocking: true, mode: "canonical", validation: ["scripts/validate-production-governance.mjs"] },
  { from: "wise_payment_authority", to: "scheduling_gate", type: "gate", authorityId: "payment", blocking: true, mode: "canonical", validation: ["scripts/validate-cross-system-gates.mjs"] },
  { from: "scheduling_gate", to: "execution_release", type: "execution", authorityId: "execution", blocking: true, mode: "canonical", validation: ["scripts/validate-production-governance.mjs"] },
  { from: "authority_compliance", to: "execution_release", type: "gate", authorityId: "authority_routing", blocking: true, mode: "canonical", validation: ["scripts/validate-apostille-authentication-rules.mjs"] },
  { from: "execution_release", to: "operator_intelligence", type: "evidence", authorityId: "intelligence", blocking: false, mode: "derived", validation: ["scripts/validate-milano-operator-intelligence.mjs"] },
  { from: "operator_intelligence", to: "workspace_operator", type: "presentation", authorityId: "intelligence", blocking: false, mode: "derived", validation: ["scripts/validate-milano-os-surface-unification.mjs"] },
] as const;

export const ENVIRONMENT_DEPENDENCIES: readonly EnvironmentDependency[] = [
  { id: "supabase", provider: "Supabase", purpose: "Canonical database, auth and storage", parentSystem: "governance_platform", environmentVariables: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"], requiredInProduction: true, requiredInPreview: true, secretOwner: "Platform", healthCheckType: "api_health", status: "UNVERIFIED", failureImpact: "Canonical Matter/auth/storage operations unavailable", relatedCapabilities: ["matter_intake", "workspace_client", "workspace_operator"] },
  { id: "wise", provider: "Wise", purpose: "Canonical payment settlement evidence", parentSystem: "matter_control", environmentVariables: ["WISE_API_TOKEN"], requiredInProduction: true, requiredInPreview: false, secretOwner: "Platform", healthCheckType: "webhook_evidence", status: "UNVERIFIED", failureImpact: "Payment verification and payment-gated progression blocked", relatedCapabilities: ["wise_payment_authority", "scheduling_gate"] },
  { id: "vercel", provider: "Vercel", purpose: "Production deployment and runtime", parentSystem: "governance_platform", environmentVariables: ["VERCEL", "VERCEL_ENV", "VERCEL_GIT_COMMIT_SHA"], requiredInProduction: true, requiredInPreview: false, secretOwner: "Platform", healthCheckType: "deployment_metadata", status: "UNVERIFIED", failureImpact: "Production deployment/readiness evidence unavailable", relatedCapabilities: ["system_control_plane"] },
  { id: "notification_provider", provider: "Notification Provider", purpose: "Transactional client/operator messaging", parentSystem: "governance_platform", environmentVariables: ["RESEND_API_KEY"], requiredInProduction: false, requiredInPreview: false, secretOwner: "Platform", healthCheckType: "webhook_evidence", status: "UNVERIFIED", failureImpact: "Notification delivery evidence may be unavailable", relatedCapabilities: ["workspace_client"] },
] as const;

export const WEBHOOK_REGISTRY: readonly WebhookGovernanceRecord[] = [
  { id: "wise-settlement", provider: "Wise", route: "/api/webhooks/wise", eventTypes: ["transfer/state-change", "payment/settlement"], authMethod: "provider-authenticated request", signatureVerification: "Route implementation must verify provider authenticity before canonical mutation", idempotencyKey: "provider transaction identity + Matter binding", dedupeStrategy: "Reject previously reconciled provider transaction identity", retryPolicy: "Provider retry safe; duplicate must be no-op", failureHandling: "Record safe reconciliation failure and retain Matter unpaid/blocked truth", auditEvent: "wise_reconciliation", canonicalMutationAllowed: ["payment settlement evidence for the same Matter"], owner: "Platform", status: "UNVERIFIED", tests: ["tests/wise-reconciliation.test.ts", "tests/production-governance.test.ts"] },
] as const;

export const TECHNICAL_DEBT: readonly TechnicalDebtRecord[] = [] as const;

export function detectDependencyCycles(edges: readonly DependencyEdge[] = DEPENDENCY_GRAPH): string[][] {
  const next = new Map<string, string[]>();
  for (const edge of edges) next.set(edge.from, [...(next.get(edge.from) ?? []), edge.to]);
  const cycles: string[][] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];
  const walk = (node: string) => {
    if (visiting.has(node)) {
      const index = stack.indexOf(node);
      if (index >= 0) cycles.push([...stack.slice(index), node]);
      return;
    }
    if (visited.has(node)) return;
    visiting.add(node); stack.push(node);
    for (const child of next.get(node) ?? []) walk(child);
    stack.pop(); visiting.delete(node); visited.add(node);
  };
  for (const node of next.keys()) walk(node);
  return cycles;
}

export function validateArchitectureGovernance() {
  const errors: string[] = [];
  const registryIds = new Set(SYSTEM_REGISTRY.map((entry) => entry.id));
  const authorityIds = new Set(CANONICAL_AUTHORITIES.map((authority) => authority.id));
  for (const ownership of CAPABILITY_OWNERSHIP) if (!registryIds.has(ownership.capabilityId)) errors.push(`Owner references unknown capability: ${ownership.capabilityId}`);
  for (const edge of DEPENDENCY_GRAPH) {
    if (!registryIds.has(edge.from)) errors.push(`Dependency source missing: ${edge.from}`);
    if (!registryIds.has(edge.to)) errors.push(`Dependency target missing: ${edge.to}`);
    if (edge.authorityId && !authorityIds.has(edge.authorityId)) errors.push(`Dependency authority missing: ${edge.authorityId}`);
  }
  if (detectDependencyCycles().length) errors.push("System dependency graph contains a cycle.");
  for (const adr of ARCHITECTURE_DECISIONS) if (adr.id <= "ADR-010" && adr.status !== "ACTIVE") errors.push(`${adr.id} permanent architecture decision is not ACTIVE.`);
  for (const debt of TECHNICAL_DEBT) {
    if (debt.severity === "critical" && !debt.acceptanceTest.trim()) errors.push(`${debt.id} critical debt is missing an acceptance test.`);
    if (debt.status === "resolved" && !debt.resolutionEvidence?.length) errors.push(`${debt.id} resolved debt lacks evidence.`);
    if (debt.status === "accepted" && !debt.acceptanceRationale) errors.push(`${debt.id} accepted debt lacks rationale.`);
  }
  return { valid: errors.length === 0, errors };
}
