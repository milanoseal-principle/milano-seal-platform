export type UserRole =
  | "client"
  | "operator"
  | "admin"
  | "owner"
  | "va"
  | "alliance"
  | "professional";

export const roleHomeRoute: Record<UserRole, string> = {
  client: "/portal",
  operator: "/dashboard",
  admin: "/dashboard",
  owner: "/dashboard",
  va: "/va/dashboard",
  alliance: "/alliance/dashboard",
  professional: "/professional/matters",
};

// Authenticated counsel/professional workspace. The rest of /professional
// (landing + country pages) stays public.
export const PROFESSIONAL_WORKSPACE_PREFIXES = [
  "/professional/matters",
  "/professional/account",
] as const;

// Safe denied destination for authenticated users whose role is missing or
// unrecognized. Missing role is BLOCKED, never defaulted into a protected area.
export const DENIED_ROUTE = "/login?error=access_denied";

const operatorAliases = new Set([
  "operator",
  "founder",
  "founder_admin",
  "admin_operator",
  "ops_manager",
  "execution_coordinator",
  "apostille_coordinator",
  "finance",
  "finance_operator",
  "client_support",
  "compliance_reviewer",
]);

const adminAliases = new Set(["admin"]);
const ownerAliases = new Set(["owner"]);
const vaAliases = new Set([
  "va",
  "virtual_assistant",
  "va_manager",
  "intake_assistant",
  "scheduling_assistant",
  "document_coordinator",
  "translation_coordinator",
  "courier_assistant",
  "followup_coordinator",
  "alliance_support_assistant",
  "escalation_assistant",
]);
const allianceAliases = new Set([
  "alliance",
  "alliance_partner",
  "alliance_member",
]);

export function normalizeUserRole(role?: string | null): UserRole | null {
  if (!role) return null;
  const normalized = role.trim().toLowerCase();

  if (normalized === "client") return "client";
  if (operatorAliases.has(normalized)) return "operator";
  if (adminAliases.has(normalized)) return "admin";
  if (ownerAliases.has(normalized)) return "owner";
  if (vaAliases.has(normalized)) return "va";
  if (allianceAliases.has(normalized)) return "alliance";
  if (normalized === "professional") return "professional";

  return null;
}

export function getHomeRouteForRole(role?: string | null): string {
  const normalized = normalizeUserRole(role);
  // Missing / unrecognized role → safe denied route, never a protected default.
  if (!normalized) return DENIED_ROUTE;
  return roleHomeRoute[normalized];
}

export function isRouteAllowedForRole(
  pathname: string,
  role?: string | null,
): boolean {
  const normalized = normalizeUserRole(role);

  // Missing / unrecognized role is blocked everywhere (no portal default).
  if (!normalized) return false;
  if (normalized === "client") return pathname.startsWith("/portal");
  // Founder / admin / owner are the top oversight roles: they may reach the operator
  // dashboard (including /dashboard/alliance) AND oversee the Execution Support (/va)
  // and Alliance (/alliance) surfaces. Partner / VA / client roles stay isolated to
  // their own areas (handled below) — only these top roles are widened.
  if (
    normalized === "operator" ||
    normalized === "admin" ||
    normalized === "owner"
  ) {
    return (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/va") ||
      pathname.startsWith("/alliance")
    );
  }
  if (normalized === "va") return pathname.startsWith("/va");
  if (normalized === "alliance") return pathname.startsWith("/alliance");
  if (normalized === "professional") {
    return PROFESSIONAL_WORKSPACE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
    );
  }

  return false;
}
