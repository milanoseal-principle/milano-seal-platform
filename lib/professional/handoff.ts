// Professional "START A CLIENT MATTER" submission → canonical intake payload.
//
// Counsel provides facts; counsel never chooses a legal conclusion here. The
// execution posture maps only to what is factually known, and every
// professional Matter enters the canonical intake review path, where the
// operator resolves notarial act, route and quote before any Wise request.

export const EXECUTION_POSTURES = [
  "already_issued",
  "already_notarized",
  "signature_needed",
  "unknown",
] as const;
export type ExecutionPosture = (typeof EXECUTION_POSTURES)[number];

export interface ProfessionalMatterSubmission {
  client_name: string;
  client_email: string;
  client_phone: string | null;
  document_type: string;
  document_origin: string;
  destination_country: string;
  signer_location: string | null;
  execution_posture: ExecutionPosture;
  receiving_authority: string | null;
  document_count: number;
  deadline: string | null;
  professional_instructions: string | null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const clean = (value: unknown, max = 200): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
  return trimmed || null;
};

export function normalizeProfessionalMatterSubmission(
  body: Record<string, unknown>,
): { ok: true; submission: ProfessionalMatterSubmission } | { ok: false; error: string } {
  const clientName = clean(body.client_name);
  const clientEmail = String(body.client_email ?? "").trim().toLowerCase();
  const documentType = clean(body.document_type);
  const documentOrigin = clean(body.document_origin, 80);
  const destination = clean(body.destination_country, 80);
  if (!clientName) return { ok: false, error: "Client name is required." };
  if (!EMAIL_PATTERN.test(clientEmail)) return { ok: false, error: "A valid client email is required." };
  if (!documentType) return { ok: false, error: "Document type is required." };
  if (!documentOrigin) return { ok: false, error: "Document origin is required." };
  if (!destination) return { ok: false, error: "Destination country is required." };

  const posture = (EXECUTION_POSTURES as readonly string[]).includes(String(body.execution_posture))
    ? (body.execution_posture as ExecutionPosture)
    : "unknown";
  const count = Math.floor(Number(body.document_count ?? 1));
  const deadline = clean(body.deadline, 10);

  return {
    ok: true,
    submission: {
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clean(body.client_phone, 40),
      document_type: documentType,
      document_origin: documentOrigin,
      destination_country: destination,
      signer_location: clean(body.signer_location, 80),
      execution_posture: posture,
      receiving_authority: clean(body.receiving_authority, 200),
      document_count: Number.isFinite(count) && count >= 1 ? Math.min(count, 50) : 1,
      deadline: deadline && DATE_PATTERN.test(deadline) ? deadline : null,
      professional_instructions: clean(body.professional_instructions, 4000),
    },
  };
}

/**
 * Posture → canonical execution truth. Only facts are recorded; every
 * unresolved decision stays review_required so the operator resolves it.
 */
export function executionTruthForPosture(posture: ExecutionPosture) {
  switch (posture) {
    case "already_issued":
      return {
        notarization_requirement: "not_required",
        execution_method: "review_required",
        notarial_act: "review_required",
        authentication_requirement: "review_required",
      } as const;
    case "already_notarized":
      return {
        notarization_requirement: "not_required",
        execution_method: "already_notarized",
        notarial_act: "review_required",
        authentication_requirement: "review_required",
      } as const;
    case "signature_needed":
      return {
        notarization_requirement: "review_required",
        execution_method: "review_required",
        notarial_act: "review_required",
        authentication_requirement: "review_required",
      } as const;
    default:
      return {
        notarization_requirement: "review_required",
        execution_method: "review_required",
        notarial_act: "review_required",
        authentication_requirement: "review_required",
      } as const;
  }
}

export function buildProfessionalIntakePayload(input: {
  submission: ProfessionalMatterSubmission;
  profile: { id: string; firm_name: string; contact_name: string };
  referralReference: string;
}) {
  const { submission: s, profile } = input;
  const notes = [
    `[professional_referral] ${profile.firm_name} (${profile.contact_name})`,
    `Execution posture (counsel-reported): ${s.execution_posture.replaceAll("_", " ")}`,
    s.receiving_authority ? `Receiving authority (counsel-reported): ${s.receiving_authority}` : "",
    s.deadline ? `Deadline: ${s.deadline}` : "",
    s.professional_instructions ? `Counsel instructions: ${s.professional_instructions}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    // Routes into the canonical intake review path (no Wise request until an
    // operator-approved quote exists).
    source_channel: "professional",
    client_type: "professional_referral",
    name: s.client_name,
    client_name: s.client_name,
    email: s.client_email,
    phone: s.client_phone ?? "",
    document_type: s.document_type,
    origin_state: s.document_origin,
    state: s.document_origin,
    country: s.destination_country,
    destination_country: s.destination_country,
    signer_location: s.signer_location ?? undefined,
    docs: s.document_count,
    deadline_date: s.deadline ?? undefined,
    receiving_authority: s.receiving_authority ?? undefined,
    notes,
    execution_truth: executionTruthForPosture(s.execution_posture),
    professional_profile_id: profile.id,
    referral_reference: input.referralReference,
  };
}
