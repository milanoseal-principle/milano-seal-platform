import { redirect } from "next/navigation";
import { normalizeUserRole, getHomeRouteForRole, isRouteAllowedForRole, type UserRole } from "./roleRedirect";

export function requireRole(role: string | null | undefined, pathname: string): UserRole {
  const normalized = normalizeUserRole(role);
  if (!isRouteAllowedForRole(pathname, normalized)) {
    redirect(getHomeRouteForRole(normalized));
  }
  return normalized;
import { getHomeRouteForRole, isRouteAllowedForRole } from "./roleRedirect";

export function requireRoleForPath(
  role: string | null | undefined,
  pathname: string,
) {
  const allowed = isRouteAllowedForRole(pathname, role);

  if (!allowed) {
    redirect(getHomeRouteForRole(role));
  }
}
