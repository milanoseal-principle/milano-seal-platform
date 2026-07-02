// Discount engine authorization.
//
// Central rule set for who may create requests, approve requests, and approve a
// 100% comp. Never trusts a client-supplied actor identity — callers pass the
// authenticated role/email resolved server-side.

import { isOperatorCompAllowed, ownerEmails, operatorEmails } from "./env";

// Operators who may review/approve non-comp discount requests.
const OPERATOR_ROLES = new Set([
  "founder",
  "founder_admin",
  "admin",
  "admin_operator",
  "ops_manager",
  "finance",
  "finance_operator",
]);

// Owner-tier roles that may approve a 100% comp (in addition to owner emails).
const OWNER_ROLES = new Set(["founder", "founder_admin"]);

const ALLIANCE_ROLES = new Set(["alliance", "alliance_partner", "alliance_member"]);

export function isOperator(role: string | null | undefined): boolean {
  return !!role && OPERATOR_ROLES.has(role);
}

export function isAlliancePartner(role: string | null | undefined): boolean {
  return !!role && ALLIANCE_ROLES.has(role);
}

// May submit a discount request: operators (any) and alliance partners.
export function canCreateDiscountRequest(role: string | null | undefined): boolean {
  return isOperator(role) || isAlliancePartner(role);
}

// May approve/deny a non-comp discount request.
export function canReviewDiscountRequest(role: string | null | undefined): boolean {
  return isOperator(role);
}

// May approve a 100% comp. Requires the env flag AND (owner role OR an email on
// the owner/operator allow-list). This is the strictest gate in the engine.
export function canApproveComp(
  role: string | null | undefined,
  email: string | null | undefined,
): boolean {
  if (!isOperatorCompAllowed()) return false;
  if (role && OWNER_ROLES.has(role)) return true;
  const e = (email ?? "").toLowerCase();
  if (!e) return false;
  return ownerEmails().includes(e) || operatorEmails().includes(e);
}
