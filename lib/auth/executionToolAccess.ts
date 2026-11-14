import { NextResponse } from "next/server";
import { requireOperatorApiAccess, type OperatorApiAccess } from "@/lib/auth/operatorApiAccess";

// Execution tools historically admit only these two roles, not the whole operator family.
const EXECUTION_TOOL_ROLES = new Set(["founder_admin", "admin_operator"]);

export async function requireExecutionToolAccess(
  dependencies?: Parameters<typeof requireOperatorApiAccess>[0],
): Promise<OperatorApiAccess> {
  const access = await requireOperatorApiAccess(dependencies);
  if (!access.ok) return access;
  if (!EXECUTION_TOOL_ROLES.has(access.role)) {
    return { ok: false, response: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }) };
  }
  return access;
}
