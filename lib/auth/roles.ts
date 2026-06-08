export const ROLES = {
  FOUNDER_ADMIN: "founder_admin",
  ADMIN_OPERATOR: "admin_operator",
  VIRTUAL_ASSISTANT: "virtual_assistant",
  CLIENT: "client",
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

export function hasDashboardAccess(role: string | undefined | null): boolean {
  return role === ROLES.FOUNDER_ADMIN || role === ROLES.ADMIN_OPERATOR;
}

export function isVirtualAssistant(role: string | undefined | null): boolean {
  return role === ROLES.VIRTUAL_ASSISTANT;
}

export function isClient(role: string | undefined | null): boolean {
  return role === ROLES.CLIENT;
}
