// Professional referral references and governed client-handoff links.
//
// A referral reference is an opaque, server-signed token that ties one Matter
// to one professional profile. The canonical Matter (public.deals) stores it;
// there is no separate referral/professional Matter table.
//
// Signature: HMAC-SHA256(secret, `${mode}:${profileId}:${nonce}`), so a browser
// can carry the reference but can never mint one for a profile, and a
// client-handoff reference can never be replayed as a professional-submitted
// one.

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export type ReferralMode = "submitted" | "handoff";

export type ReferralSourceType =
  | "professional_submitted"
  | "professional_client_handoff";

const MODE_CODE: Record<ReferralMode, "S" | "H"> = { submitted: "S", handoff: "H" };
const CODE_MODE: Record<string, ReferralMode> = { S: "submitted", H: "handoff" };

export const REFERRAL_REFERENCE_PATTERN = /^MSR-([SH])-([A-Z2-7]{16})-([A-Za-z0-9_-]{16})$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const HANDOFF_ALLOWED_PARAMS = [
  "lane",
  "pro",
  "destination",
  "document",
  "ref",
] as const;

function referralSecret(): string | null {
  const secret =
    process.env.PROFESSIONAL_HANDOFF_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "";
  return secret.length >= 16 ? secret : null;
}

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32Nonce(bytes = 10): string {
  const buf = randomBytes(bytes);
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  return out.slice(0, 16);
}

function sign(secret: string, mode: ReferralMode, profileId: string, nonce: string): string {
  return createHmac("sha256", secret)
    .update(`${MODE_CODE[mode]}:${profileId.toLowerCase()}:${nonce}`)
    .digest("base64url")
    .slice(0, 16);
}

export function isProfileId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function createReferralReference(
  profileId: string,
  mode: ReferralMode,
  secret: string | null = referralSecret(),
): string {
  if (!secret) throw new Error("Professional referral signing is not configured.");
  if (!isProfileId(profileId)) throw new Error("Invalid professional profile id.");
  const nonce = base32Nonce();
  return `MSR-${MODE_CODE[mode]}-${nonce}-${sign(secret, mode, profileId, nonce)}`;
}

export function verifyReferralReference(
  reference: unknown,
  profileId: unknown,
  secret: string | null = referralSecret(),
): { valid: true; mode: ReferralMode } | { valid: false } {
  if (!secret || typeof reference !== "string" || !isProfileId(profileId)) return { valid: false };
  const match = REFERRAL_REFERENCE_PATTERN.exec(reference.trim());
  if (!match) return { valid: false };
  const mode = CODE_MODE[match[1]];
  const expected = Buffer.from(sign(secret, mode, profileId, match[2]));
  const actual = Buffer.from(match[3]);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return { valid: false };
  }
  return { valid: true, mode };
}

export function referralSourceTypeFor(mode: ReferralMode): ReferralSourceType {
  return mode === "submitted" ? "professional_submitted" : "professional_client_handoff";
}

const slugParam = (value: unknown) =>
  typeof value === "string"
    ? value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64)
    : "";

/**
 * Governed client-handoff URL. It carries ONLY the professional profile id,
 * destination, document type and the signed referral reference — never client
 * names, emails, signer identity or any Matter-specific legal conclusion.
 */
export function buildClientHandoffUrl(input: {
  origin: string;
  profileId: string;
  destination?: unknown;
  documentType?: unknown;
  reference: string;
}): string {
  const url = new URL("/intake", input.origin);
  url.searchParams.set("lane", "professional");
  url.searchParams.set("pro", input.profileId);
  const destination = slugParam(input.destination);
  const document = slugParam(input.documentType);
  if (destination) url.searchParams.set("destination", destination);
  if (document) url.searchParams.set("document", document);
  url.searchParams.set("ref", input.reference);
  return url.toString();
}

export interface ProfessionalReferralFields {
  professional_profile_id: string;
  referral_source_type: ReferralSourceType;
  referral_source_id: string;
  referral_reference: string;
}

type ProfileLookup = (
  profileId: string,
) => Promise<{ id: string; status: string } | null>;

/**
 * Server-side resolution used by the canonical intake. Returns Matter
 * relationship fields only when the reference is correctly signed for an
 * existing, non-inactive profile. Anything else fails closed to "no
 * attribution" — the Matter is still created, just not linked.
 */
export async function resolveProfessionalReferral(
  raw: Record<string, unknown>,
  lookupProfile: ProfileLookup,
  secret: string | null = referralSecret(),
): Promise<ProfessionalReferralFields | null> {
  const profileId = raw.professional_profile_id;
  const reference = raw.referral_reference;
  if (!isProfileId(profileId) || typeof reference !== "string") return null;
  const verified = verifyReferralReference(reference, profileId, secret);
  if (!verified.valid) return null;
  const profile = await lookupProfile(profileId);
  if (!profile || !["prospect", "active"].includes(profile.status)) return null;
  return {
    professional_profile_id: profile.id,
    referral_source_type: referralSourceTypeFor(verified.mode),
    referral_source_id: profile.id,
    referral_reference: reference.trim(),
  };
}
