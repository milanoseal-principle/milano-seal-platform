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

function parseTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
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
    evidenceRefs: [...new Set(domain.evidenceRefs)].sort(),
    value: domain.value ?? null,
  });
}

function unknownDeltas(previous: MatterTruthSnapshot | null, current: MatterTruthSnapshot, reason: string): MatterTruthDelta[] {
  return MATTER_TRUTH_DOMAINS.map((domain) => ({
    domain,
    state: "UNKNOWN" as const,
    previousState: previous?.domains[domain]?.state ?? null,
    currentState: current.domains[domain]?.state ?? null,
    previousAuthorityVersion: previous?.domains[domain]?.authorityVersion ?? null,
    currentAuthorityVersion: current.domains[domain]?.authorityVersion ?? null,
    reason,
  }));
}

export function isAcceptedMatterTruthSnapshot(snapshot: MatterTruthSnapshot): boolean {
  const capturedAt = parseTimestamp(snapshot.capturedAt);
  const acceptedAt = parseTimestamp(snapshot.acceptedAt);
  return snapshot.status === "ACCEPTED"
    && Boolean(snapshot.snapshotId.trim())
    && Boolean(snapshot.matterId.trim())
    && Boolean(snapshot.buildVersion.trim())
    && Boolean(snapshot.acceptedBy?.trim())
    && capturedAt !== null
    && acceptedAt !== null
    && acceptedAt >= capturedAt;
}

export function selectAcceptedMatterTruthBaseline(
  snapshots: readonly MatterTruthSnapshot[],
  currentSnapshot: MatterTruthSnapshot,
): MatterTruthSnapshot | null {
  const currentTime = parseTimestamp(currentSnapshot.capturedAt);
  const matterId = currentSnapshot.matterId.trim();
  if (currentTime === null || !matterId) return null;

  return snapshots
    .filter((snapshot) => snapshot.snapshotId !== currentSnapshot.snapshotId)
    .filter(isAcceptedMatterTruthSnapshot)
    .filter((snapshot) => snapshot.matterId.trim() === matterId)
    .map((snapshot) => ({ snapshot, capturedAt: parseTimestamp(snapshot.capturedAt) }))
    .filter((entry): entry is { snapshot: MatterTruthSnapshot; capturedAt: number } => entry.capturedAt !== null && entry.capturedAt < currentTime)
    .sort((a, b) => b.capturedAt - a.capturedAt)[0]?.snapshot ?? null;
}

export function compareAcceptedMatterTruth(
  previous: MatterTruthSnapshot | null,
  current: MatterTruthSnapshot,
): MatterTruthDelta[] {
  if (!isAcceptedMatterTruthSnapshot(current)) {
    return unknownDeltas(previous, current, "Current Matter Truth snapshot is not accepted with valid acceptance evidence; deterministic change truth is unavailable.");
  }

  if (previous && previous.matterId.trim() !== current.matterId.trim()) {
    return unknownDeltas(previous, current, "Snapshots belong to different Matters; cross-Matter comparison is prohibited.");
  }

  if (!previous || !isAcceptedMatterTruthSnapshot(previous)) {
    return unknownDeltas(previous, current, "A prior accepted Matter Truth baseline is unavailable; no difference is inferred.");
  }

  return MATTER_TRUTH_DOMAINS.map((domain) => {
    const before = previous.domains[domain];
    const after = current.domains[domain];

    if (!before || !after) {
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
