// Canonical professional profile normalization.
//
// A profile stores firm-level identity and reusable defaults only. It must
// never carry client PII, signer identification, passport data or any
// Matter-specific legal conclusion across Matters.

export const PROFESSIONAL_STATUSES = ["prospect", "active", "paused", "inactive"] as const;
export type ProfessionalStatus = (typeof PROFESSIONAL_STATUSES)[number];

export const CLIENT_HANDOFF_MODES = ["professional_submits", "client_completes"] as const;
export type ClientHandoffMode = (typeof CLIENT_HANDOFF_MODES)[number];

export const NOTIFICATION_PREFERENCES = ["all_milestones", "key_milestones", "exceptions_only"] as const;
export type NotificationPreference = (typeof NOTIFICATION_PREFERENCES)[number];

export const EXECUTION_METHOD_PREFERENCES = ["ron_when_eligible", "in_person", "no_preference"] as const;

export interface ProfessionalProfileInput {
  firm_name: string;
  contact_name: string;
  title: string | null;
  email: string;
  phone: string | null;
  country: string | null;
  city: string | null;
  website: string | null;
  practice_focus: string | null;
  preferred_language: string | null;
  preferred_destination_countries: string[];
  typical_document_types: string[];
  preferred_execution_method: string | null;
  default_receiving_authority: string | null;
  default_client_handoff_mode: ClientHandoffMode;
  client_instruction_template: string | null;
  notification_preference: NotificationPreference;
}

export interface ProfessionalProfileRecord extends ProfessionalProfileInput {
  id: string;
  user_id: string | null;
  status: ProfessionalStatus;
  created_at?: string;
  updated_at?: string;
}

/** Fields a returning professional may reuse on a new Matter. */
export const REUSABLE_PROFESSIONAL_DEFAULT_FIELDS = [
  "firm_name",
  "city",
  "country",
  "preferred_destination_countries",
  "typical_document_types",
  "preferred_execution_method",
  "default_receiving_authority",
  "default_client_handoff_mode",
  "client_instruction_template",
  "notification_preference",
] as const;

/** Never reused across Matters, and never stored on the profile. */
export const NEVER_REUSED_FIELDS = [
  "client_name",
  "client_email",
  "client_phone",
  "signer_identification",
  "passport_number",
  "passport_data",
  "date_of_birth",
  "notarial_act",
  "legal_sufficiency",
  "execution_truth",
] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clean = (value: unknown, max = 200): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
  return trimmed || null;
};

const list = (value: unknown, maxItems = 12): string[] => {
  const items = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];
  return [
    ...new Set(
      items
        .map((item) => clean(item, 80))
        .filter((item): item is string => Boolean(item)),
    ),
  ].slice(0, maxItems);
};

const oneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;

export function normalizeProfessionalEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function normalizeProfessionalProfileInput(
  body: Record<string, unknown>,
): { ok: true; profile: ProfessionalProfileInput } | { ok: false; error: string } {
  const email = normalizeProfessionalEmail(body.email);
  const firmName = clean(body.firm_name);
  const contactName = clean(body.contact_name);
  if (!firmName) return { ok: false, error: "Firm name is required." };
  if (!contactName) return { ok: false, error: "Contact name is required." };
  if (!EMAIL_PATTERN.test(email)) return { ok: false, error: "A valid professional email is required." };

  const website = clean(body.website, 300);
  if (website && !/^https?:\/\//i.test(website)) {
    return { ok: false, error: "Website must start with http:// or https://." };
  }

  const preferredExecution = clean(body.preferred_execution_method, 40);
  return {
    ok: true,
    profile: {
      firm_name: firmName,
      contact_name: contactName,
      title: clean(body.title),
      email,
      phone: clean(body.phone, 40),
      country: clean(body.country, 80),
      city: clean(body.city, 80),
      website,
      practice_focus: clean(body.practice_focus, 300),
      preferred_language: clean(body.preferred_language, 40),
      preferred_destination_countries: list(body.preferred_destination_countries),
      typical_document_types: list(body.typical_document_types),
      preferred_execution_method:
        preferredExecution && (EXECUTION_METHOD_PREFERENCES as readonly string[]).includes(preferredExecution)
          ? preferredExecution
          : null,
      default_receiving_authority: clean(body.default_receiving_authority, 200),
      default_client_handoff_mode: oneOf(body.default_client_handoff_mode, CLIENT_HANDOFF_MODES, "professional_submits"),
      client_instruction_template: clean(body.client_instruction_template, 2000),
      notification_preference: oneOf(body.notification_preference, NOTIFICATION_PREFERENCES, "all_milestones"),
    },
  };
}

/** Defaults a returning professional's new Matter form may prefill. */
export function professionalMatterDefaults(profile: Partial<ProfessionalProfileRecord>) {
  const defaults: Record<string, unknown> = {};
  for (const field of REUSABLE_PROFESSIONAL_DEFAULT_FIELDS) {
    if (profile[field] !== undefined) defaults[field] = profile[field];
  }
  return defaults;
}

/** A professional may act on Matters only while their profile is active. */
export function professionalCanSubmit(profile: Pick<ProfessionalProfileRecord, "status" | "user_id"> | null) {
  return Boolean(profile && profile.status === "active" && profile.user_id);
}
