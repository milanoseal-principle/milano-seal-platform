export const MATTER_PROVENANCE_DOMAINS = [
  "matter",
  "pricing",
  "payment",
  "execution",
  "ron",
  "authority",
  "translation",
  "custody",
  "courier",
  "delivery",
  "release",
] as const;

export type MatterProvenanceDomain = (typeof MATTER_PROVENANCE_DOMAINS)[number];
export type MatterProvenanceState = "CURRENT" | "DUE_SOON" | "STALE" | "UNKNOWN";
export type MatterAuthorityMode = "CANONICAL" | "EXTERNAL_VERIFIED" | "DERIVED";

export interface MatterProvenanceEntry {
  domain: MatterProvenanceDomain;
  sourceAuthority: string;
  authorityMode: MatterAuthorityMode;
  sourceReference?: string | null;
  authorityVersion?: string | null;
  evidenceRefs: string[];
  verifiedAt?: string | null;
  reviewCadenceDays?: number | null;
}

export interface MatterProvenanceRow extends MatterProvenanceEntry {
  state: MatterProvenanceState;
  ageDays: number | null;
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function deriveMatterProvenanceState(entry: MatterProvenanceEntry, now = new Date()): MatterProvenanceRow {
  const verifiedAt = parseDate(entry.verifiedAt);
  if (!verifiedAt) return { ...entry, state: "UNKNOWN", ageDays: null };

  const ageDays = Math.max(0, Math.floor((now.getTime() - verifiedAt.getTime()) / 86_400_000));
  const cadence = entry.reviewCadenceDays ?? null;

  if (!cadence || cadence <= 0) return { ...entry, state: "CURRENT", ageDays };
  if (ageDays > cadence) return { ...entry, state: "STALE", ageDays };
  if (ageDays >= Math.max(0, cadence - 14)) return { ...entry, state: "DUE_SOON", ageDays };
  return { ...entry, state: "CURRENT", ageDays };
}

export function buildMatterProvenanceMatrix(entries: readonly MatterProvenanceEntry[], now = new Date()): MatterProvenanceRow[] {
  const byDomain = new Map<MatterProvenanceDomain, MatterProvenanceEntry>();
  for (const entry of entries) {
    if (byDomain.has(entry.domain)) throw new Error(`Duplicate Matter provenance authority for domain ${entry.domain}.`);
    byDomain.set(entry.domain, entry);
  }

  return MATTER_PROVENANCE_DOMAINS.map((domain) => {
    const entry = byDomain.get(domain);
    if (!entry) {
      return {
        domain,
        sourceAuthority: "UNRESOLVED",
        authorityMode: "DERIVED" as const,
        sourceReference: null,
        authorityVersion: null,
        evidenceRefs: [],
        verifiedAt: null,
        reviewCadenceDays: null,
        state: "UNKNOWN" as const,
        ageDays: null,
      };
    }
    return deriveMatterProvenanceState(entry, now);
  });
}

export function summarizeMatterProvenance(matrix: readonly MatterProvenanceRow[]) {
  return {
    current: matrix.filter((row) => row.state === "CURRENT").length,
    dueSoon: matrix.filter((row) => row.state === "DUE_SOON").length,
    stale: matrix.filter((row) => row.state === "STALE").length,
    unknown: matrix.filter((row) => row.state === "UNKNOWN").length,
  };
}
