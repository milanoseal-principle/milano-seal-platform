export type ComplimentaryReasonCode =
  | "founder_authorized"
  | "family_and_friends"
  | "strategic_partner"
  | "pilot_matter"
  | "service_recovery"
  | "internal_quality_test"
  | "charitable"
  | "other";

export const COMPLIMENTARY_REASON_LABELS: Record<ComplimentaryReasonCode, string> = {
  founder_authorized: "Founder Authorized",
  family_and_friends: "Family and Friends",
  strategic_partner: "Strategic Partner",
  pilot_matter: "Pilot Matter",
  service_recovery: "Service Recovery",
  internal_quality_test: "Internal Quality Test",
  charitable: "Charitable",
  other: "Other",
};

export const COMPLIMENTARY_CONFIRMATION = "AUTHORIZE COMPLIMENTARY MATTER";

export const COMPLIMENTARY_PERMISSIONS = [
  "matter.comp.view",
  "matter.comp.request",
  "matter.comp.authorize",
  "matter.comp.revoke",
  "matter.comp.audit",
] as const;

export type ComplimentaryPermission = typeof COMPLIMENTARY_PERMISSIONS[number];

export const FOUNDER_COMP_PERMISSIONS: ComplimentaryPermission[] = [
  "matter.comp.view",
  "matter.comp.request",
  "matter.comp.authorize",
  "matter.comp.revoke",
  "matter.comp.audit",
];

export const AUTHORIZED_OPERATOR_COMP_PERMISSIONS: ComplimentaryPermission[] = [
  "matter.comp.view",
  "matter.comp.authorize",
  "matter.comp.audit",
];

const FOUNDER_ROLES = new Set(["founder", "founder_admin"]);
const REQUEST_ROLES = new Set(["founder", "founder_admin", "admin", "admin_operator", "ops_manager", "finance", "finance_operator"]);
const BLOCKED_ROLES = new Set(["client", "alliance", "alliance_partner", "alliance_member", "virtual_assistant", "va_manager"]);

export interface ComplimentaryActor {
  userId: string;
  role: string | null | undefined;
  permissions?: readonly string[] | null;
}

export function hasComplimentaryPermission(actor: ComplimentaryActor, permission: ComplimentaryPermission): boolean {
  const role = actor.role ?? "";
  if (BLOCKED_ROLES.has(role)) return false;
  if (FOUNDER_ROLES.has(role)) return true;
  return actor.permissions?.includes(permission) ?? false;
}

export function canRequestComplimentaryAuthorization(actor: ComplimentaryActor): boolean {
  const role = actor.role ?? "";
  if (BLOCKED_ROLES.has(role)) return false;
  return REQUEST_ROLES.has(role) || hasComplimentaryPermission(actor, "matter.comp.request");
}

export function canAuthorizeComplimentaryMatter(actor: ComplimentaryActor): boolean {
  return hasComplimentaryPermission(actor, "matter.comp.authorize");
}

export function canRevokeComplimentaryMatter(actor: ComplimentaryActor): boolean {
  return hasComplimentaryPermission(actor, "matter.comp.revoke");
}

export function canAuditComplimentaryMatter(actor: ComplimentaryActor): boolean {
  return hasComplimentaryPermission(actor, "matter.comp.audit");
}

export function isValidReasonDetail(detail: string): boolean {
  return detail.trim().length >= 12;
}
