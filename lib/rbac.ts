export type Role = "admin" | "operator" | "client" | "anonymous";

export interface RbacUser {
  email?: string | null;
  role?: Role | null;
}

export interface RbacResource {
  email?: string | null;
}

export function canAccess(user: RbacUser, resource: RbacResource): boolean {
  const role = (user.role ?? "anonymous").toLowerCase() as Role;
  if (role === "admin" || role === "operator") return true;
  if (!user.email || !resource.email) return false;
  return user.email.toLowerCase() === resource.email.toLowerCase();
}

export function roleFromEmail(email: string | null | undefined): Role {
  if (!email) return "anonymous";
  const lower = email.toLowerCase();
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (admins.includes(lower)) return "admin";
  const ops = (process.env.OPERATOR_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (ops.includes(lower)) return "operator";
  return "client";
}
