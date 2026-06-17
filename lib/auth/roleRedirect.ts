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
}
