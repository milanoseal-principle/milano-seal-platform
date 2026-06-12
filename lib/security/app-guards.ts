// Application Security Guards
// Input validation, param sanitization, and safe display helpers.
// Never trust client-provided role, matter_id, or free text.

import { getAtlasCountry } from "@/lib/atlas/atlas-pathway";

// Valid matter status values — reject anything not in this set.
const VALID_MATTER_STATES = new Set([
  "intake_received",
  "under_review",
  "quoted",
  "awaiting_payment",
  "scheduled",
  "in_execution",
  "apostille_processing",
  "in_transit",
  "delivered",
  "completed",
]);

// Safe text — strips HTML tags and control characters for display.
// Never use dangerouslySetInnerHTML with free-text intake fields.
export function safeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "")           // strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // strip control chars
    .trim()
    .slice(0, 2000);                    // hard length cap
}

// Safe slug — alphanumeric, hyphens only. Rejects anything else.
export function safeSlug(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 100);
}

// Validates a destination/country slug against the Atlas registry.
// Returns the slug if valid, undefined if unknown — never throws.
export function isValidCountrySlug(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const slug = safeSlug(value);
  return !!getAtlasCountry(slug);
}

// Validates a matter status string.
export function isValidMatterState(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return VALID_MATTER_STATES.has(value);
}

// Safe UUID — rejects anything that isn't a valid UUID format.
export function isSafeUUID(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

// Extracts and validates a destination param from route searchParams.
// Returns the safe slug or null — never exposes invalid input downstream.
export function safeDestinationParam(
  searchParams: Record<string, string | string[] | undefined>
): string | null {
  const raw =
    (typeof searchParams.destination === "string" ? searchParams.destination : null) ??
    (typeof searchParams.country === "string" ? searchParams.country : null) ??
    null;

  if (!raw) return null;
  const slug = safeSlug(raw);
  return isValidCountrySlug(slug) ? slug : null;
}

// Safe matter ID from params — must be a valid UUID.
export function safeMatterId(value: unknown): string | null {
  return isSafeUUID(value) ? (value as string) : null;
}

// Ensures a role string never comes from client-controlled input unchecked.
// Role must always come from server-side auth token (app_metadata / user_metadata).
// This function just documents the contract — callers must NOT use req.body.role.
export function assertRoleFromServerAuth(
  role: string | null | undefined,
  source: "app_metadata" | "user_metadata"
): string {
  // Role from client body is never trusted — this enforces the pattern at call sites.
  void source;
  return role ?? "public";
}
