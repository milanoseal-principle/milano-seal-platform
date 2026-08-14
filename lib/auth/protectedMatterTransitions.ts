export const PROTECTED_MATTER_TRANSITION_ROLES = new Set([
  "founder",
  "founder_admin",
  "admin",
  "admin_operator",
  "ops_manager",
  "execution_coordinator",
  "apostille_coordinator",
]);

export function canPerformProtectedMatterTransition(role: string): boolean {
  return PROTECTED_MATTER_TRANSITION_ROLES.has(role);
}
