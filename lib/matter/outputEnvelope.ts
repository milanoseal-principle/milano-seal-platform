export const MATTER_OUTPUT_AUDIENCES = [
  "client",
  "operator",
  "va",
  "alliance",
  "finance",
  "authority_review",
  "delivery",
  "control_plane",
] as const;

export const MATTER_OUTPUT_MUTATION_POLICIES = ["READ_ONLY", "GOVERNED_ACTION_LINKS_ONLY"] as const;
export const MATTER_OUTPUT_INVARIANTS = [
  "NO_SECOND_MATTER_ENGINE",
  "NO_SECOND_PAYMENT_ENGINE",
  "NO_STATE_MUTATION_BY_PROJECTION",
  "UNKNOWN_IS_NOT_FALSE",
] as const;

export type MatterOutputAudience = (typeof MATTER_OUTPUT_AUDIENCES)[number];
export type MatterOutputMutationPolicy = (typeof MATTER_OUTPUT_MUTATION_POLICIES)[number];

export interface MatterOutputEnvelope<T> {
  matterId: string;
  sourceEngine: "MATTER_CONTROL";
  projectionId: string;
  audience: MatterOutputAudience;
  buildVersion: string;
  generatedAt: string;
  authorityVersions: Record<string, string | null>;
  mutationPolicy: MatterOutputMutationPolicy;
  invariants: typeof MATTER_OUTPUT_INVARIANTS;
  payload: T;
}

export interface CreateMatterOutputEnvelopeInput<T> {
  matterId: string;
  projectionId: string;
  audience: MatterOutputAudience;
  buildVersion: string;
  authorityVersions?: Record<string, string | null>;
  mutationPolicy?: MatterOutputMutationPolicy;
  payload: T;
  generatedAt?: string;
}

function normalizeAuthorityVersions(authorityVersions: Record<string, string | null> | undefined) {
  const normalized: Record<string, string | null> = {};
  for (const [rawKey, rawValue] of Object.entries(authorityVersions ?? {})) {
    const key = rawKey.trim();
    if (!key) throw new Error("Matter output authority version key cannot be blank.");
    normalized[key] = typeof rawValue === "string" ? rawValue.trim() || null : null;
  }
  return normalized;
}

function hasValidTimestamp(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

export function createMatterOutputEnvelope<T>(input: CreateMatterOutputEnvelopeInput<T>): MatterOutputEnvelope<T> {
  const matterId = input.matterId.trim();
  const projectionId = input.projectionId.trim();
  const buildVersion = input.buildVersion.trim();
  const generatedAt = input.generatedAt ?? new Date().toISOString();

  if (!matterId) throw new Error("Matter output requires matterId.");
  if (!projectionId) throw new Error("Matter output requires projectionId.");
  if (!buildVersion) throw new Error("Matter output requires buildVersion.");
  if (!MATTER_OUTPUT_AUDIENCES.includes(input.audience)) throw new Error("Matter output audience is not governed.");
  if (input.mutationPolicy && !MATTER_OUTPUT_MUTATION_POLICIES.includes(input.mutationPolicy)) throw new Error("Matter output mutation policy is not governed.");
  if (!hasValidTimestamp(generatedAt)) throw new Error("Matter output generatedAt must be a valid timestamp.");

  return {
    matterId,
    sourceEngine: "MATTER_CONTROL",
    projectionId,
    audience: input.audience,
    buildVersion,
    generatedAt,
    authorityVersions: normalizeAuthorityVersions(input.authorityVersions),
    mutationPolicy: input.mutationPolicy ?? "READ_ONLY",
    invariants: MATTER_OUTPUT_INVARIANTS,
    payload: input.payload,
  };
}

export function validateMatterOutputEnvelope(envelope: MatterOutputEnvelope<unknown>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (envelope.sourceEngine !== "MATTER_CONTROL") errors.push("Projection source engine drifted from MATTER_CONTROL.");
  if (!envelope.matterId.trim()) errors.push("matterId is missing.");
  if (!envelope.projectionId.trim()) errors.push("projectionId is missing.");
  if (!envelope.buildVersion.trim()) errors.push("buildVersion is missing.");
  if (!hasValidTimestamp(envelope.generatedAt)) errors.push("generatedAt is invalid.");
  if (!MATTER_OUTPUT_AUDIENCES.includes(envelope.audience)) errors.push("audience is not governed.");
  if (!MATTER_OUTPUT_MUTATION_POLICIES.includes(envelope.mutationPolicy)) errors.push("mutationPolicy is not governed.");

  for (const invariant of MATTER_OUTPUT_INVARIANTS) {
    if (!envelope.invariants.includes(invariant)) errors.push(`Required projection invariant is missing: ${invariant}.`);
  }

  for (const key of Object.keys(envelope.authorityVersions)) {
    if (!key.trim()) errors.push("authorityVersions contains a blank authority key.");
  }

  return { valid: errors.length === 0, errors };
}
