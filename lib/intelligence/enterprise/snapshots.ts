// Read-only Enterprise Intelligence snapshot builders.
//
// Pure functions over canonical records/events. They NEVER mutate inputs, write
// to a database, add tables, or fabricate values. Sample records are excluded;
// unknown values remain null; zero evidence returns "insufficient_evidence".
//
// Reuses canonical sample governance from lib/platform/entities/entitySafety.

import { excludeSamples } from "@/lib/platform/entities/entitySafety";
import type {
  CanonicalAssignment,
  CanonicalIntegrationEvent,
  CanonicalMatterRecord,
  CapacitySnapshot,
  FounderExecutiveSnapshot,
  IntegrationReliabilitySnapshot,
  MatterPerformanceSnapshot,
  MatterStateRecord,
  MatterStateSnapshot,
  OrganizationInventorySnapshot,
  OrganizationRecord,
  OrganizationPerformanceSnapshot,
  RelationshipNetworkSnapshot,
  VerticalPerformanceSnapshot,
} from "./types";

// Canonical pipeline stages (lib/pipelineEngine VALID_STAGES). There is no
// "blocked" stage, so blockedMatters is reported as null (never fabricated).
const TERMINAL_STAGES = new Set(["completed", "lost"]);
const COMPLETED_STAGES = new Set(["completed"]);

// Read-only Matter-STATE snapshot: counts/durations from canonical Matter
// records. No revenue, organization, capacity, or relationship inference.
// Read-only Organization INVENTORY snapshot derived from canonical Matter
// (deals) evidence. No relationship strength, revenue, or account health.
// Unsupported org fields (active/target/vertical) stay null with a limitation.
export function buildOrganizationInventorySnapshot(
  records: readonly OrganizationRecord[],
  opts?: BuildOpts & { commercialAccounts?: number; rangeFromIso?: string | null },
): OrganizationInventorySnapshot {
  const clean = excludeSamples([...records]);
  const sampleExcluded = records.length - clean.length;

  // Distinct organizations by canonical key.
  const orgKeys = new Set(clean.map((r) => r.organizationKey).filter((k): k is string => !!k));
  const totalOrganizations = orgKeys.size;

  // Geography roll-up: distinct orgs per geography.
  const geoMap = new Map<string, Set<string>>();
  for (const r of clean) {
    if (!r.organizationKey || !r.geography) continue;
    if (!geoMap.has(r.geography)) geoMap.set(r.geography, new Set());
    geoMap.get(r.geography)!.add(r.organizationKey);
  }
  const byGeography = [...geoMap.entries()].map(([geography, set]) => ({ geography, organizations: set.size }));

  // Vertical roll-up only if any canonical vertical evidence exists.
  const hasVertical = clean.some((r) => !!r.vertical);
  let byVertical: OrganizationInventorySnapshot["byVertical"] = null;
  if (hasVertical) {
    const vMap = new Map<string, Set<string>>();
    for (const r of clean) {
      if (!r.organizationKey || !r.vertical) continue;
      if (!vMap.has(r.vertical)) vMap.set(r.vertical, new Set());
      vMap.get(r.vertical)!.add(r.organizationKey);
    }
    byVertical = [...vMap.entries()].map(([vertical, set]) => ({ vertical, organizations: set.size }));
  }

  // New-in-range: orgs whose earliest firstSeenAt falls at/after rangeFromIso.
  const rangeFrom = opts?.rangeFromIso ?? null;
  const firstSeen = new Map<string, string>();
  for (const r of clean) {
    if (!r.organizationKey || !r.firstSeenAt) continue;
    const cur = firstSeen.get(r.organizationKey);
    if (!cur || r.firstSeenAt < cur) firstSeen.set(r.organizationKey, r.firstSeenAt);
  }
  const newInRange = rangeFrom
    ? [...firstSeen.values()].filter((t) => t >= rangeFrom).length
    : 0;

  const times = clean.map((r) => r.firstSeenAt).filter((t): t is string => !!t).sort();
  const sourceDateRange = { from: times[0] ?? null, to: times[times.length - 1] ?? null };

  const limitations: string[] = [];
  if (totalOrganizations === 0) limitations.push("No canonical organization evidence in range.");
  limitations.push("Active/target organization status has no canonical field (reported null).");
  if (!hasVertical) limitations.push("Organization-level vertical has no canonical field (reported null).");

  const evidenceStatus = totalOrganizations === 0 ? "insufficient_evidence" : "verified";

  return {
    generatedAt: opts?.generatedAt ?? null,
    sourceRecordCount: clean.length,
    sourceEventCount: clean.length,
    sampleExcluded,
    evidenceStatus,
    limitations,
    sourceDateRange,
    confidence: totalOrganizations === 0 ? null : "medium",
    totalOrganizations,
    activeOrganizations: null, // no canonical active-status field
    targetOrganizations: null, // no canonical target-stage field
    commercialAccounts: Math.max(0, opts?.commercialAccounts ?? 0),
    byGeography,
    byVertical,
    newInRange,
  };
}

export function buildMatterStateSnapshot(
  records: readonly MatterStateRecord[],
  opts?: BuildOpts,
): MatterStateSnapshot {
  const clean = excludeSamples([...records]);
  const sampleExcluded = records.length - clean.length;
  const total = clean.length;

  const completedMatters = clean.filter((m) => m.status != null && COMPLETED_STAGES.has(m.status)).length;
  const activeMatters = clean.filter((m) => m.status != null && !TERMINAL_STAGES.has(m.status)).length;

  const durations = clean
    .filter((m) => m.createdAt && m.completedAt)
    .map((m) => new Date(m.completedAt as string).getTime() - new Date(m.createdAt as string).getTime())
    .filter((d) => Number.isFinite(d) && d >= 0);
  const averageCompletionMs =
    durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null;

  const destinations = new Set(clean.map((m) => m.destination).filter((d): d is string => !!d));
  const docFamilies = new Set(clean.map((m) => m.documentFamily).filter((d): d is string => !!d));

  const createdTimes = clean.map((m) => m.createdAt).filter((c): c is string => !!c).sort();
  const sourceDateRange = {
    from: createdTimes[0] ?? null,
    to: createdTimes[createdTimes.length - 1] ?? null,
  };

  const evidenceStatus = total === 0 ? "insufficient_evidence" : "verified";
  const limitations: string[] = [];
  if (total === 0) limitations.push("No canonical Matter records in range.");
  if (durations.length < total) limitations.push("Completion duration unavailable for Matters missing timestamps.");
  const confidence = total === 0 ? null : durations.length === total ? "high" : "medium";

  return {
    generatedAt: opts?.generatedAt ?? null,
    sourceRecordCount: total,
    sourceEventCount: total,
    sampleExcluded,
    evidenceStatus,
    limitations,
    sourceDateRange,
    confidence,
    totalMatters: total,
    activeMatters,
    completedMatters,
    blockedMatters: null, // no canonical "blocked" stage
    averageCompletionMs,
    destinationsRepresented: destinations.size,
    documentFamiliesRepresented: docFamilies.size,
  };
}

interface BuildOpts {
  /** Caller-supplied timestamp; not fabricated inside the pure builders. */
  generatedAt?: string | null;
}

function isComplimentary(m: CanonicalMatterRecord): boolean {
  return m.payment_disposition === "complimentary" || m.comp_authorized === true;
}

// Verified revenue = confirmed payment evidence only, and complimentary Matters
// always contribute $0 (never counted as revenue).
function verifiedRevenueOf(m: CanonicalMatterRecord): number {
  if (isComplimentary(m)) return 0;
  if (m.payment_confirmed !== true) return 0;
  const paid = typeof m.amount_paid === "number" ? m.amount_paid : 0;
  return Math.max(0, paid);
}

function isVerifiedPaidMatter(m: CanonicalMatterRecord): boolean {
  return m.payment_confirmed === true && !isComplimentary(m);
}

function base(count: number, sampleExcluded: number, opts?: BuildOpts) {
  return {
    generatedAt: opts?.generatedAt ?? null,
    sourceRecordCount: count,
    sampleExcluded,
    limitations: [] as string[],
  };
}

export function buildMatterPerformanceSnapshot(
  records: readonly CanonicalMatterRecord[],
  opts?: BuildOpts,
): MatterPerformanceSnapshot {
  const clean = excludeSamples([...records]);
  const sampleExcluded = records.length - clean.length;
  const verifiedMatterVolume = clean.filter(isVerifiedPaidMatter).length;
  const complimentaryMatterVolume = clean.filter(isComplimentary).length;
  const evidenceStatus = clean.length === 0 ? "insufficient_evidence" : "verified";
  const limitations = clean.length === 0 ? ["No canonical Matter evidence available."] : [];

  // Verified revenue: confirmed non-complimentary paid amounts only. Never guess
  // currency conversion — if confirmed payments span multiple currencies, leave
  // verifiedRevenue null and report the limitation.
  const confirmedPaid = clean.filter(isVerifiedPaidMatter);
  const currencies = new Set(
    confirmedPaid.map((m) => m.currency).filter((c): c is string => !!c),
  );
  let verifiedRevenue: number | null;
  let currency: string | null;
  if (currencies.size > 1) {
    verifiedRevenue = null;
    currency = null;
    limitations.push("Verified revenue not summed: confirmed payments span multiple currencies (no conversion).");
  } else {
    verifiedRevenue = clean.reduce((sum, m) => sum + verifiedRevenueOf(m), 0);
    currency = currencies.size === 1 ? [...currencies][0] : null;
  }

  return {
    ...base(clean.length, sampleExcluded, opts),
    evidenceStatus,
    limitations,
    verifiedMatterVolume,
    complimentaryMatterVolume,
    verifiedRevenue,
    currency,
    // Forecast is intentionally not derived here (no invented forecast).
    forecastRevenue: null,
  };
}

export function buildOrganizationPerformanceSnapshot(
  records: readonly CanonicalMatterRecord[],
  opts?: BuildOpts,
): OrganizationPerformanceSnapshot {
  const clean = excludeSamples([...records]);
  const sampleExcluded = records.length - clean.length;
  const byOrg = new Map<string, { verifiedMatterVolume: number; verifiedRevenue: number }>();
  for (const m of clean) {
    if (!m.organizationId) continue; // unknown org → not fabricated
    const cur = byOrg.get(m.organizationId) ?? { verifiedMatterVolume: 0, verifiedRevenue: 0 };
    if (isVerifiedPaidMatter(m)) cur.verifiedMatterVolume += 1;
    cur.verifiedRevenue += verifiedRevenueOf(m);
    byOrg.set(m.organizationId, cur);
  }
  const organizations = [...byOrg.entries()].map(([organizationId, v]) => ({ organizationId, ...v }));
  return {
    ...base(clean.length, sampleExcluded, opts),
    evidenceStatus: organizations.length === 0 ? "insufficient_evidence" : "verified",
    limitations: organizations.length === 0 ? ["No organization-linked Matter evidence."] : [],
    activeOrganizations: organizations.length,
    organizations,
  };
}

export function buildVerticalPerformanceSnapshot(
  records: readonly CanonicalMatterRecord[],
  opts?: BuildOpts,
): VerticalPerformanceSnapshot {
  const clean = excludeSamples([...records]);
  const sampleExcluded = records.length - clean.length;
  const byVertical = new Map<string, { matterVolume: number; verifiedRevenue: number }>();
  for (const m of clean) {
    if (!m.vertical) continue;
    const cur = byVertical.get(m.vertical) ?? { matterVolume: 0, verifiedRevenue: 0 };
    cur.matterVolume += 1;
    cur.verifiedRevenue += verifiedRevenueOf(m);
    byVertical.set(m.vertical, cur);
  }
  const verticals = [...byVertical.entries()].map(([vertical, v]) => ({ vertical, ...v }));
  return {
    ...base(clean.length, sampleExcluded, opts),
    evidenceStatus: verticals.length === 0 ? "insufficient_evidence" : "verified",
    limitations: verticals.length === 0 ? ["No vertical-tagged Matter evidence."] : [],
    verticals,
  };
}

export function buildRelationshipNetworkSnapshot(
  records: readonly CanonicalMatterRecord[],
  opts?: BuildOpts,
): RelationshipNetworkSnapshot {
  const clean = excludeSamples([...records]);
  const sampleExcluded = records.length - clean.length;
  // Only real edges: a Matter with an organizationId is a genuine org↔Matter edge.
  const edges = clean
    .filter((m) => !!m.organizationId)
    .map((m) => ({ organizationId: m.organizationId as string, matterId: m.matterId }));
  const nodes = new Set<string>();
  for (const e of edges) {
    nodes.add(`org:${e.organizationId}`);
    nodes.add(`matter:${e.matterId}`);
  }
  return {
    ...base(clean.length, sampleExcluded, opts),
    evidenceStatus: edges.length === 0 ? "insufficient_evidence" : "verified",
    limitations: edges.length === 0 ? ["No evidence-backed relationship edges."] : [],
    edges,
    nodeCount: nodes.size,
  };
}

export function buildIntegrationReliabilitySnapshot(
  events: readonly CanonicalIntegrationEvent[],
  opts?: BuildOpts,
): IntegrationReliabilitySnapshot {
  const clean = excludeSamples([...events]);
  const sampleExcluded = events.length - clean.length;
  // Only provider-originated, verified events count toward reliability.
  const verified = clean.filter((e) => e.verified === true);
  const byIntegration = new Map<string, { verifiedEventCount: number; success: number }>();
  for (const e of verified) {
    const cur = byIntegration.get(e.integration) ?? { verifiedEventCount: 0, success: 0 };
    cur.verifiedEventCount += 1;
    if (e.success === true) cur.success += 1;
    byIntegration.set(e.integration, cur);
  }
  const integrations = [...byIntegration.entries()].map(([integration, v]) => ({
    integration,
    verifiedEventCount: v.verifiedEventCount,
    successRate: v.verifiedEventCount > 0 ? v.success / v.verifiedEventCount : null,
  }));
  return {
    ...base(clean.length, sampleExcluded, opts),
    evidenceStatus: verified.length === 0 ? "insufficient_evidence" : "verified",
    limitations: verified.length === 0 ? ["No verified integration events (configured ≠ active)."] : [],
    integrations,
  };
}

export function buildCapacitySnapshot(
  assignments: readonly CanonicalAssignment[],
  opts?: BuildOpts,
): CapacitySnapshot {
  const clean = excludeSamples([...assignments]);
  const sampleExcluded = assignments.length - clean.length;
  const active = clean.filter((a) => a.active === true);
  const byRole = new Map<string, number>();
  for (const a of active) byRole.set(a.role, (byRole.get(a.role) ?? 0) + 1);
  const rows = [...byRole.entries()].map(([role, activeAssignments]) => ({ role, activeAssignments }));
  return {
    ...base(clean.length, sampleExcluded, opts),
    evidenceStatus: active.length === 0 ? "insufficient_evidence" : "verified",
    limitations: active.length === 0 ? ["No active assignment evidence."] : [],
    byRole: rows,
  };
}

export function buildFounderExecutiveSnapshot(
  input: {
    matters?: readonly CanonicalMatterRecord[];
    integrationEvents?: readonly CanonicalIntegrationEvent[];
    assignments?: readonly CanonicalAssignment[];
  },
  opts?: BuildOpts,
): FounderExecutiveSnapshot {
  const matters = input.matters ?? [];
  const matter = buildMatterPerformanceSnapshot(matters, opts);
  const org = buildOrganizationPerformanceSnapshot(matters, opts);
  const vertical = buildVerticalPerformanceSnapshot(matters, opts);
  const relationship = buildRelationshipNetworkSnapshot(matters, opts);
  const integration = buildIntegrationReliabilitySnapshot(input.integrationEvents ?? [], opts);
  const capacity = buildCapacitySnapshot(input.assignments ?? [], opts);

  const anyEvidence =
    matter.evidenceStatus === "verified" ||
    integration.evidenceStatus === "verified" ||
    capacity.evidenceStatus === "verified";

  const limitations = [
    ...(matter.evidenceStatus === "insufficient_evidence" ? ["Matter evidence insufficient."] : []),
    ...(integration.evidenceStatus === "insufficient_evidence"
      ? ["Integration reliability unverified (configured ≠ active)."]
      : []),
    ...(capacity.evidenceStatus === "insufficient_evidence" ? ["Capacity evidence insufficient."] : []),
  ];

  const nextReviewAction = anyEvidence
    ? "Review verified Matter and revenue evidence, then confirm capacity and integration signals."
    : "Connect canonical Matter, integration, and assignment evidence to populate this snapshot.";

  const sampleExcluded =
    matter.sampleExcluded + integration.sampleExcluded + capacity.sampleExcluded;

  return {
    generatedAt: opts?.generatedAt ?? null,
    sourceRecordCount: matter.sourceRecordCount,
    sampleExcluded,
    evidenceStatus: anyEvidence ? "verified" : "insufficient_evidence",
    limitations,
    verifiedMatterVolume: matter.verifiedMatterVolume,
    verifiedRevenue: matter.verifiedRevenue,
    complimentaryMatterVolume: matter.complimentaryMatterVolume,
    forecastRevenue: matter.forecastRevenue,
    activeOrganizations: org.activeOrganizations,
    verticalActivity: vertical.verticals.map((v) => ({ vertical: v.vertical, matterVolume: v.matterVolume })),
    relationshipEdgeCount: relationship.edges.length,
    capacitySignals: capacity.byRole,
    integrationReliability: integration.integrations.map((i) => ({
      integration: i.integration,
      verifiedEventCount: i.verifiedEventCount,
    })),
    nextReviewAction,
  };
}
