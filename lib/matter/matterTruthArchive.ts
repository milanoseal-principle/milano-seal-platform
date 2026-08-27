export const MATTER_TRUTH_DOMAINS = [
  "matter",
  "payment",
  "execution",
  "authority",
  "translation",
  "custody",
  "courier",
  "delivery",
  "release",
] as const;

export type MatterTruthDomain = (typeof MATTER_TRUTH_DOMAINS)[number];
export type MatterTruthSnapshotStatus = "ACCEPTED" | "PENDING_REVIEW" | "REJECTED";
export type MatterTruthDomainState = "VERIFIED" | "BLOCKED" | "REVIEW_REQUIRED" | "UNKNOWN" | "STALE";
export type MatterTruthDeltaState = "CHANGED" | "UNCHANGED" | "UNKNOWN";

export interface MatterTruthDomainSnapshot {
  state: MatterTruthDomainState;
  sourceAuthority: string;
  authorityVersion?: string | null;
  evidenceRefs: string[];
  value?: unknown;
  verifiedAt?: string | null;
}

export interface MatterTruthSnapshot {
  snapshotId: string;
  matterId: string;
  status: MatterTruthSnapshotStatus;
  capturedAt: string;
  buildVersion: string;
  acceptedAt?: string | null;
  acceptedBy?: string | null;
  domains: Partial<Record<MatterTruthDomain, MatterTruthDomainSnapshot>>;
}

export interface MatterTruthDelta {
  domain: MatterTruthDomain;
  state: MatterTruthDeltaState;
  previousState: MatterTruthDomainState | null;
  currentState: MatterTruthDomainState | null;
  previousAuthorityVersion: string | null;
  currentAuthorityVersion: string | null;
  reason: string;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
}

function comparableDomain(domain: MatterTruthDomainSnapshot) {
  return canonicalize({
    state: domain.state,
    sourceAuthority: domain.sourceAuthority,
    authorityVersion: domain.authorityVersion ?? null,
    evidenceRefs: [...domain.evidenceRefs].sort(),
    value: domain.value ?? null,
  });
}

export function isAcceptedMatterTruthSnapshot(snapshot: MatterTruthSnapshot): boolean {
  return snapshot.status === "ACCEPTED" && Boolean(snapshot.acceptedAt) && Boolean(snapshot.acceptedBy);
}

export function selectAcceptedMatterTruthBaseline(
  snapshots: readonly MatterTruthSnapshot[],
  currentSnapshot: MatterTruthSnapshot,
): MatterTruthSnapshot | null {
  const currentTime = Date.parse(currentSnapshot.capturedAt);
  return snapshots
    .filter((snapshot) => snapshot.snapshotId !== currentSnapshot.snapshotId)
    .filter(isAcceptedMatterTruthSnapshot)
    .filter((snapshot) => snapshot.matterId === currentSnapshot.matterId)
    .filter((snapshot) => {
      const time = Date.parse(snapshot.capturedAt);
      return Number.isFinite(time) && (!Number.isFinite(currentTime) || time < currentTime);
    })
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))[0] ?? null;
}

export function compareAcceptedMatterTruth(
  previous: MatterTruthSnapshot | null,
  current: MatterTruthSnapshot,
): MatterTruthDelta[] {
  if (!isAcceptedMatterTruthSnapshot(current)) {
    return MATTER_TRUTH_DOMAINS.map((domain) => ({
      domain,
      state: "UNKNOWN" as const,
      previousState: previous?.domains[domain]?.state ?? null,
      currentState: current.domains[domain]?.state ?? null,
      previousAuthorityVersion: previous?.domains[domain]?.authorityVersion ?? null,
      currentAuthorityVersion: current.domains[domain]?.authorityVersion ?? null,
      reason: "Current Matter Truth snapshot is not accepted; deterministic change truth is unavailable.",
    }));
  }

  return MATTER_TRUTH_DOMAINS.map((domain) => {
    const before = previous?.domains[domain];
    const after = current.domains[domain];

    if (!previous || !isAcceptedMatterTruthSnapshot(previous) || !before || !after) {
      return {
        domain,
        state: "UNKNOWN" as const,
        previousState: before?.state ?? null,
        currentState: after?.state ?? null,
        previousAuthorityVersion: before?.authorityVersion ?? null,
        currentAuthorityVersion: after?.authorityVersion ?? null,
        reason: "Accepted evidence is missing on one side of the comparison; no difference is inferred.",
      };
    }

    const changed = JSON.stringify(comparableDomain(before)) !== JSON.stringify(comparableDomain(after));
    return {
      domain,
      state: changed ? "CHANGED" as const : "UNCHANGED" as const,
      previousState: before.state,
      currentState: after.state,
      previousAuthorityVersion: before.authorityVersion ?? null,
      currentAuthorityVersion: after.authorityVersion ?? null,
      reason: changed
        ? "Accepted Matter Truth evidence changed between baselines."
        : "Accepted Matter Truth evidence is deterministically unchanged.",
    };
  });
}

export function buildMatterTruthChangeSummary(deltas: readonly MatterTruthDelta[]) {
  return {
    changed: deltas.filter((delta) => delta.state === "CHANGED"),
    unchanged: deltas.filter((delta) => delta.state === "UNCHANGED"),
    unknown: deltas.filter((delta) => delta.state === "UNKNOWN"),
  };
}
