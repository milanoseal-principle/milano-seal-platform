import { AssistantRoleMode } from './assistantPrompts';

export function detectRoleMode(role?: string | null): AssistantRoleMode {
  if (!role) return 'PUBLIC';
  if (role === 'founder_admin' || role === 'admin_operator') return 'DASHBOARD';
  if (role === 'virtual_assistant') return 'VA';
  if (role === 'client') return 'PORTAL';
  if (role === 'alliance_partner') return 'ALLIANCE';
  return 'PUBLIC';
}
