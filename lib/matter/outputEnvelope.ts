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

export type MatterOutputAudience = (typeof MATTER_OUTPUT_AUDIENCES)[number];
export type MatterOutputMutationPolicy = "READ_ONLY" | "GOVERNED_ACTION_LINKS_ONLY";

export interface MatterOutputEnvelope<T> {
  matterId: string;
  sourceEngine: "MATTER_CONTROL";
  projectionId: string;
  audience: MatterOutputAudience;
  buildVersion: string;
  generatedAt: string;
  authorityVersions: Record<string, string | null>;
  mutationPolicy: MatterOutputMutationPolicy;
  invariants: readonly [
    "NO_SECOND_MATTER_ENGINE",
    "NO_SECOND_PAYMENT_ENGINE",
    "NO_STATE_MUTATION_BY_PROJECTION",
    "UNKNOWN_IS_NOT_FALSE",
  ];
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

export function createMatterOutputEnvelope<T>(input: CreateMatterOutputEnvelopeInput<T>): MatterOutputEnvelope<T> {
  const matterId = input.matterId.trim();
  const projectionId = input.projectionId.trim();
  const buildVersion = input.buildVersion.trim();

  if (!matterId) throw new Error("Matter output requires matterId.");
  if (!projectionId) throw new Error("Matter output requires projectionId.");
  if (!buildVersion) throw new Error("Matter output requires buildVersion.");
  if (!MATTER_OUTPUT_AUDIENCES.includes(input.audience)) throw new Error("Matter output audience is not governed.");

  return {
    matterId,
    sourceEngine: "MATTER_CONTROL",
    projectionId,
    audience: input.audience,
    buildVersion,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    authorityVersions: { ...(input.authorityVersions ?? {}) },
    mutationPolicy: input.mutationPolicy ?? "READ_ONLY",
    invariants: [
      "NO_SECOND_MATTER_ENGINE",
      "NO_SECOND_PAYMENT_ENGINE",
      "NO_STATE_MUTATION_BY_PROJECTION",
      "UNKNOWN_IS_NOT_FALSE",
    ],
    payload: input.payload,
  };
}

export function validateMatterOutputEnvelope(envelope: MatterOutputEnvelope<unknown>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (envelope.sourceEngine !== "MATTER_CONTROL") errors.push("Projection source engine drifted from MATTER_CONTROL.");
  if (!envelope.matterId.trim()) errors.push("matterId is missing.");
  if (!envelope.projectionId.trim()) errors.push("projectionId is missing.");
  if (!MATTER_OUTPUT_AUDIENCES.includes(envelope.audience)) errors.push("audience is not governed.");
  if (!envelope.invariants.includes("NO_SECOND_MATTER_ENGINE")) errors.push("Matter authority invariant is missing.");
  if (!envelope.invariants.includes("NO_SECOND_PAYMENT_ENGINE")) errors.push("Payment authority invariant is missing.");
  if (!envelope.invariants.includes("NO_STATE_MUTATION_BY_PROJECTION")) errors.push("Projection mutation invariant is missing.");
  return { valid: errors.length === 0, errors };
}
