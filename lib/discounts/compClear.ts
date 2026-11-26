import { canApproveComp } from "./permissions";

export function retiredCompClearResponse(
  user: { app_metadata?: Record<string, unknown>; email?: string | null } | null,
): Response {
  const headers = { "Cache-Control": "no-store" };
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers });

  const role = typeof user.app_metadata?.role === "string" ? user.app_metadata.role : null;
  if (!canApproveComp(role, user.email)) {
    return Response.json({ error: "A 100% comp requires owner/operator approval." }, { status: 403, headers });
  }

  return Response.json({
    error: "Open the Matter and use its governed complimentary authorization workflow.",
    code: "USE_GOVERNED_COMPLIMENTARY_AUTHORIZATION",
  }, { status: 410, headers });
}
