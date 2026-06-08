export type Role = "founder_admin" | "admin_operator" | "virtual_assistant" | "client" | "anonymous";

export interface RbacUser {
  email?: string | null;
  role?: Role | null;
}

export interface RbacResource {
  email?: string | null;
}

export function canAccess(user: RbacUser, resource: RbacResource): boolean {
  const role = (user.role ?? "anonymous").toLowerCase() as Role;
  if (role === "founder_admin" || role === "admin_operator") return true;
  if (!user.email || !resource.email) return false;
  return user.email.toLowerCase() === resource.email.toLowerCase();
}

// Normalize legacy role strings to canonical names (backwards compat)
function normalizeRole(raw: string): Role {
  switch (raw) {
    case "admin":
    case "superadmin":
      return "founder_admin";
    case "operator":
    case "ops_manager":
    case "finance":
      return "admin_operator";
    case "va":
      return "virtual_assistant";
    default:
      return raw as Role;
  }
}

export function roleFromEmail(email: string | null | undefined): Role {
  if (!email) return "anonymous";
  const lower = email.toLowerCase();
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (admins.includes(lower)) return "founder_admin";
  const ops = (process.env.OPERATOR_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (ops.includes(lower)) return "admin_operator";
  return "client";
}
