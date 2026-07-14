// Read-only Enterprise Intelligence snapshot types.
//
// These describe DERIVED read models only. They never persist, never mutate
// canonical state, and never fabricate values. Missing evidence yields
// `evidenceStatus: "insufficient_evidence"`; unknown fields stay null.

// Evidence states:
//  verified                 — records read, no blocking issues
//  verified_with_limitations— records read, but populated legacy columns conflict
//  insufficient_evidence    — source read fine, but no records
//  unavailable              — canonical source could not be read (schema/query failure)
//  capability_unavailable   — a required capability's columns are absent (e.g. comp)
export type EvidenceStatus =
  | "verified"
  | "verified_with_limitations"
  | "insufficient_evidence"
  | "unavailable"
  | "capability_unavailable";

export interface SnapshotMeta {
  /** Caller-stamped timestamp. Null when not provided (never fabricated). */
  generatedAt: string | null;
  sourceRecordCount: number;
  sampleExcluded: number;
  evidenceStatus: EvidenceStatus;
  limitations: string[];
}

/** Minimal canonical Matter shape these read models derive from. */
export interface CanonicalMatterRecord {
  matterId: string;
  organizationId?: string | null;
  vertical?: string | null;
  deal_status?: string | null;
  payment_confirmed?: boolean | null;
  amount_paid?: number | null;
  verified_revenue?: number | null;
  /** "complimentary" | "standard_payment" | null */
  payment_disposition?: string | null;
  comp_authorized?: boolean | null;
  /** ISO currency of amount_paid; used to avoid guessing conversion. */
  currency?: string | null;
  isSample?: boolean;
}

export interface CanonicalIntegrationEvent {
  integration: string;
  /** True only for provider-originated, signature-verified events. */
  verified?: boolean | null;
  success?: boolean | null;
  isSample?: boolean;
}

export interface CanonicalAssignment {
  assigneeId: string;
  role: string;
  /** Open/active assignment; completed/closed assignments do not consume capacity. */
  active?: boolean | null;
  isSample?: boolean;
}

/** Minimal canonical Matter-state shape (no revenue/org/capacity/relationship). */
export interface MatterStateRecord {
  matterId: string;
  status?: string | null;
  createdAt?: string | null;
  completedAt?: string | null;
  destination?: string | null;
  documentFamily?: string | null;
  isSample?: boolean;
}

export interface MatterStateSnapshot extends SnapshotMeta {
  /** Alias of sourceRecordCount for the event-count contract. */
  sourceEventCount: number;
  sourceDateRange: { from: string | null; to: string | null };
  confidence: "high" | "medium" | null;
  totalMatters: number;
  activeMatters: number;
  completedMatters: number;
  /** Null when canonical state has no "blocked" stage (not fabricated). */
  blockedMatters: number | null;
  /** Null unless both timestamps exist on at least one Matter. */
  averageCompletionMs: number | null;
  destinationsRepresented: number;
  documentFamiliesRepresented: number;
}

/** Canonical Organization proxy derived from Matter (deals) evidence. */
export interface OrganizationRecord {
  organizationKey: string;
  geography?: string | null;
  vertical?: string | null;
  firstSeenAt?: string | null;
  isSample?: boolean;
}

export interface OrganizationInventorySnapshot extends SnapshotMeta {
  sourceEventCount: number;
  sourceDateRange: { from: string | null; to: string | null };
  confidence: "high" | "medium" | null;
  totalOrganizations: number;
  /** Null: no canonical org active-status field. */
  activeOrganizations: number | null;
  /** Null: no canonical org target-stage field. */
  targetOrganizations: number | null;
  /** Canonical commercial-account evidence (real, paid). */
  commercialAccounts: number;
  byGeography: Array<{ geography: string; organizations: number }>;
  /** Null: no canonical org-level vertical field on Matter evidence. */
  byVertical: Array<{ vertical: string; organizations: number }> | null;
  newInRange: number;
}

export interface MatterPerformanceSnapshot extends SnapshotMeta {
  verifiedMatterVolume: number;
  complimentaryMatterVolume: number;
  /**
   * Confirmed payment evidence only. Complimentary Matters contribute $0.
   * Null when confirmed payments span multiple currencies (no guessed conversion).
   */
  verifiedRevenue: number | null;
  /** Single currency of verifiedRevenue when known; null if none/mixed. */
  currency: string | null;
  /** Forecast is a SEPARATE, distinctly-labeled field; never folded into verifiedRevenue. */
  forecastRevenue: number | null;
}

export interface OrganizationPerformanceSnapshot extends SnapshotMeta {
  activeOrganizations: number;
  organizations: Array<{
    organizationId: string;
    verifiedMatterVolume: number;
    verifiedRevenue: number;
  }>;
}

export interface VerticalPerformanceSnapshot extends SnapshotMeta {
  verticals: Array<{ vertical: string; matterVolume: number; verifiedRevenue: number }>;
}

export interface RelationshipNetworkSnapshot extends SnapshotMeta {
  /** Only real org↔Matter edges backed by an organizationId on the record. */
  edges: Array<{ organizationId: string; matterId: string }>;
  nodeCount: number;
}

export interface IntegrationReliabilitySnapshot extends SnapshotMeta {
  integrations: Array<{
    integration: string;
    verifiedEventCount: number;
    successRate: number | null;
  }>;
}

export interface CapacitySnapshot extends SnapshotMeta {
  byRole: Array<{ role: string; activeAssignments: number }>;
}

export interface FounderExecutiveSnapshot extends SnapshotMeta {
  verifiedMatterVolume: number;
  verifiedRevenue: number | null;
  complimentaryMatterVolume: number;
  forecastRevenue: number | null;
  activeOrganizations: number;
  verticalActivity: Array<{ vertical: string; matterVolume: number }>;
  relationshipEdgeCount: number;
  capacitySignals: Array<{ role: string; activeAssignments: number }>;
  integrationReliability: Array<{ integration: string; verifiedEventCount: number }>;
  nextReviewAction: string;
}
