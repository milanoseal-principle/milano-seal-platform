import { findMatterDiscrepancies, type MatterDiscrepancy, type MatterTruthInput } from "@/lib/matter/matterTruthGovernance";

export type TruthAlertSeverity = "CRITICAL" | "BLOCKING" | "WARNING" | "INFO";
export interface TruthFailureAlert {
  matterId: string;
  severity: TruthAlertSeverity;
  source: string;
  exceptionClass: string;
  blocker: string;
  requiredAction: string;
  owner: string;
  ageMinutes: number;
  createdAt: string;
  dueAt?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  deepLink: string;
  dedupeKey: string;
}

export function buildTruthFailureAlerts(input: MatterTruthInput, now = new Date()): TruthFailureAlert[] {
  return findMatterDiscrepancies(input).map((item) => ({
    matterId: item.matterId,
    severity: item.severity,
    source: `${item.sourceA} ↔ ${item.sourceB}`,
    exceptionClass: item.class,
    blocker: item.blocker,
    requiredAction: item.requiredAction,
    owner: item.owner,
    ageMinutes: Math.max(0, Math.floor((now.getTime() - new Date(item.createdAt).getTime()) / 60_000)),
    createdAt: item.createdAt,
    deepLink: `/dashboard/matters/${encodeURIComponent(item.matterId)}/truth`,
    dedupeKey: `${item.matterId}:${item.class}`,
  }));
}

export interface ReconciliationGroup {
  key: "critical" | "payment" | "execution" | "authority" | "documents" | "translation" | "custody" | "courier" | "delivery" | "release" | "resolved";
  label: string;
  discrepancies: MatterDiscrepancy[];
}

export function groupReconciliation(discrepancies: readonly MatterDiscrepancy[]): ReconciliationGroup[] {
  const categories: ReconciliationGroup[] = [
    { key: "critical", label: "Critical Now", discrepancies: [] },
    { key: "payment", label: "Payment", discrepancies: [] },
    { key: "execution", label: "Execution", discrepancies: [] },
    { key: "authority", label: "Authority", discrepancies: [] },
    { key: "documents", label: "Documents", discrepancies: [] },
    { key: "translation", label: "Translation", discrepancies: [] },
    { key: "custody", label: "Custody", discrepancies: [] },
    { key: "courier", label: "Courier", discrepancies: [] },
    { key: "delivery", label: "Delivery", discrepancies: [] },
    { key: "release", label: "Release", discrepancies: [] },
    { key: "resolved", label: "Resolved", discrepancies: [] },
  ];
  const byKey = new Map(categories.map((group) => [group.key, group]));
  for (const discrepancy of discrepancies) {
    if (discrepancy.resolvedAt) { byKey.get("resolved")!.discrepancies.push(discrepancy); continue; }
    if (discrepancy.severity === "CRITICAL") byKey.get("critical")!.discrepancies.push(discrepancy);
    const haystack = `${discrepancy.class} ${discrepancy.sourceA} ${discrepancy.sourceB}`.toLowerCase();
    const key: ReconciliationGroup["key"] = haystack.includes("payment") || haystack.includes("wise") ? "payment" : haystack.includes("translation") ? "translation" : haystack.includes("authority") || haystack.includes("apostille") || haystack.includes("hague") ? "authority" : haystack.includes("custody") ? "custody" : haystack.includes("courier") || haystack.includes("tracking") ? "courier" : haystack.includes("delivery") ? "delivery" : haystack.includes("release") || haystack.includes("completion") ? "release" : haystack.includes("document") || haystack.includes("copy") ? "documents" : "execution";
    byKey.get(key)!.discrepancies.push(discrepancy);
  }
  return categories;
}

export type GraphConfidenceState = "VERIFIED" | "SUPPORTED" | "UNVERIFIED" | "STALE";
export interface ProvenanceGraphEdge {
  id: string;
  fromEntity: string;
  relationship: string;
  toEntity: string;
  source: string;
  sourceReference?: string;
  evidenceType: string;
  confidenceState: GraphConfidenceState;
  verifiedAt?: string;
  verifiedBy?: string;
  staleState: "current" | "stale" | "unknown";
}

export function buildProvenanceEdge(input: Omit<ProvenanceGraphEdge, "id">): ProvenanceGraphEdge | null {
  if (!input.fromEntity.trim() || !input.relationship.trim() || !input.toEntity.trim() || !input.source.trim() || !input.evidenceType.trim()) return null;
  if (input.confidenceState === "VERIFIED" && !input.verifiedAt) return null;
  return { ...input, id: `${input.fromEntity}:${input.relationship}:${input.toEntity}:${input.sourceReference ?? input.source}` };
}

export interface CompletedMatterHistory {
  matterId: string;
  completedAt?: string | null;
  destinationCountry?: string | null;
  documentCategory?: string | null;
  referralSource?: string | null;
  open?: boolean;
}

export interface ClientReturnProjection {
  clientId: string;
  completedMatterCount: number;
  lastCompletedAt?: string;
  previousDestinationCountries: string[];
  documentCategories: string[];
  priorReferralSources: string[];
  hasOpenMatter: boolean;
  eligibleReturnContext: boolean;
}

export function deriveClientReturnProjection(clientId: string, history: readonly CompletedMatterHistory[]): ClientReturnProjection {
  const completed = history.filter((item) => Boolean(item.completedAt));
  const lastCompletedAt = completed.map((item) => item.completedAt!).sort().at(-1);
  return {
    clientId,
    completedMatterCount: completed.length,
    lastCompletedAt,
    previousDestinationCountries: [...new Set(completed.map((item) => item.destinationCountry).filter((v): v is string => Boolean(v)))],
    documentCategories: [...new Set(completed.map((item) => item.documentCategory).filter((v): v is string => Boolean(v)))],
    priorReferralSources: [...new Set(completed.map((item) => item.referralSource).filter((v): v is string => Boolean(v)))],
    hasOpenMatter: history.some((item) => item.open === true),
    eligibleReturnContext: completed.length > 0,
  };
}
