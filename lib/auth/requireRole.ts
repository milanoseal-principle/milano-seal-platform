import { redirect } from "next/navigation";
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
