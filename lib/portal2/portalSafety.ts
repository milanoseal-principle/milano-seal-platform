// Client Portal 2.0 — runtime safety guard.
//
// This module enforces that no operator-only field ever reaches a client view
// model. It is intentionally dependency-free and pure.

/**
 * Fields that must never appear (at any depth) in a client-facing portal object.
 */
export const BANNED_PORTAL_FIELDS = [
  "internalNotes",
  "internal_notes",
  "margin",
  "margins",
  "wisePayload",
  "wise_payload",
  "storagePath",
  "storage_path",
  "operatorNotes",
  "operator_notes",
] as const;

export type BannedPortalField = (typeof BANNED_PORTAL_FIELDS)[number];

const BANNED_SET = new Set<string>(BANNED_PORTAL_FIELDS);

export interface PortalSafetyViolation {
  path: string;
  field: string;
}

/**
 * Recursively scan an arbitrary object for banned operator-only fields.
 * Returns every violation found (empty array = safe).
 */
export function scanForBannedFields(obj: unknown, basePath = "$"): PortalSafetyViolation[] {
  const violations: PortalSafetyViolation[] = [];
  const seen = new WeakSet<object>();

  const walk = (value: unknown, path: string): void => {
    if (value === null || typeof value !== "object") return;
    if (seen.has(value as object)) return;
    seen.add(value as object);

    if (Array.isArray(value)) {
      value.forEach((item, i) => walk(item, `${path}[${i}]`));
      return;
    }

    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (BANNED_SET.has(key)) {
        violations.push({ path: `${path}.${key}`, field: key });
      }
      walk(child, `${path}.${key}`);
    }
  };

  walk(obj, basePath);
  return violations;
}

/**
 * Throws if the given object contains any banned operator-only field.
 * Use as a defensive guard right before rendering client-facing data.
 */
export function assertClientSafe<T>(obj: T): T {
  const violations = scanForBannedFields(obj);
  if (violations.length > 0) {
    const detail = violations.map((v) => v.path).join(", ");
    throw new Error(
      `[portalSafety] Refusing to render client view: banned operator-only field(s) present: ${detail}`,
    );
  }
  return obj;
}

/** Non-throwing predicate variant. */
export function isClientSafe(obj: unknown): boolean {
  return scanForBannedFields(obj).length === 0;
}
