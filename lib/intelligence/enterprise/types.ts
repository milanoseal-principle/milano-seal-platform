// Read-only Enterprise Intelligence snapshot types.
//
// These describe DERIVED read models only. They never persist, never mutate
// canonical state, and never fabricate values. Missing evidence yields
// `evidenceStatus: "insufficient_evidence"`; unknown fields stay null.

export type EvidenceStatus = "verified" | "insufficient_evidence";

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

export interface MatterPerformanceSnapshot extends SnapshotMeta {
  verifiedMatterVolume: number;
  complimentaryMatterVolume: number;
  /** Confirmed payment evidence only. Complimentary Matters contribute $0. */
  verifiedRevenue: number;
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
  verifiedRevenue: number;
  complimentaryMatterVolume: number;
  forecastRevenue: number | null;
  activeOrganizations: number;
  verticalActivity: Array<{ vertical: string; matterVolume: number }>;
  relationshipEdgeCount: number;
  capacitySignals: Array<{ role: string; activeAssignments: number }>;
  integrationReliability: Array<{ integration: string; verifiedEventCount: number }>;
  nextReviewAction: string;
}
