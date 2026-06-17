import { redirect } from "next/navigation";
import { normalizeUserRole, getHomeRouteForRole, isRouteAllowedForRole, type UserRole } from "./roleRedirect";

export function requireRole(role: string | null | undefined, pathname: string): UserRole {
  const normalized = normalizeUserRole(role);
  if (!isRouteAllowedForRole(pathname, normalized)) {
    redirect(getHomeRouteForRole(normalized));
  }
  return normalized;
}
