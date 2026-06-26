export type UserRole = "client" | "operator" | "admin" | "owner" | "va" | "alliance";

export function normalizeUserRole(role: string | null | undefined): UserRole {
  if (!role) return "client";
  const r = role.toLowerCase().trim();
  if (r === "operator" || r === "admin" || r === "owner") return r as UserRole;
  if (r === "va") return "va";
  if (r === "alliance") return "alliance";
  return "client";
}

export function getHomeRouteForRole(role: UserRole): string {
  switch (role) {
    case "operator":
    case "admin":
    case "owner":
      return "/dashboard";
    case "va":
      return "/va/dashboard";
    case "alliance":
      return "/alliance/dashboard";
    case "client":
    default:
      return "/portal";
  }
}

export function isRouteAllowedForRole(pathname: string, role: UserRole): boolean {
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/va/dashboard") || pathname.startsWith("/alliance/dashboard") || pathname.startsWith("/portal")) {
    if (pathname.startsWith("/dashboard")) return role === "operator" || role === "admin" || role === "owner";
    if (pathname.startsWith("/va/dashboard")) return role === "va";
    if (pathname.startsWith("/alliance/dashboard")) return role === "alliance";
    if (pathname.startsWith("/portal")) return role === "client";
  }
  return true;
export type UserRole =
  | "client"
  | "operator"
  | "admin"
  | "owner"
  | "va"
  | "alliance";

export const roleHomeRoute: Record<UserRole, string> = {
  client: "/portal",
  operator: "/dashboard",
  admin: "/dashboard",
  owner: "/dashboard",
  va: "/va/dashboard",
  alliance: "/alliance/dashboard",
};

const operatorAliases = new Set([
  "operator",
  "founder",
  "founder_admin",
  "admin_operator",
  "ops_manager",
  "execution_coordinator",
  "apostille_coordinator",
  "finance_operator",
  "client_support",
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

  return null;
}

export function getHomeRouteForRole(role?: string | null): string {
  const normalized = normalizeUserRole(role);
  if (!normalized) return "/portal";
  return roleHomeRoute[normalized];
}

export function isRouteAllowedForRole(
  pathname: string,
  role?: string | null,
): boolean {
  const normalized = normalizeUserRole(role);

  if (!normalized) return pathname.startsWith("/portal");
  if (normalized === "client") return pathname.startsWith("/portal");
  if (normalized === "operator") {
    return pathname.startsWith("/dashboard") && !pathname.startsWith("/dashboard/alliance");
  }
  if (normalized === "admin") {
    return pathname.startsWith("/dashboard") && !pathname.startsWith("/dashboard/alliance");
  }
  if (normalized === "owner") {
    return pathname.startsWith("/dashboard") && !pathname.startsWith("/dashboard/alliance");
  }
  if (normalized === "va") return pathname.startsWith("/va");
  if (normalized === "alliance") return pathname.startsWith("/alliance");

  return false;
}
