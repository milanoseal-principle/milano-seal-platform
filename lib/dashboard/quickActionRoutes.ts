import { QuickAction, QuickActionStatus } from './quickActionTypes';
import { MOUNTED_ROUTES } from './mountedRoutes';
import { evaluateGuards, GuardContext } from './quickActionGuards';

export interface ResolvedAction extends QuickAction {
  resolvedHref: string;
  resolvedStatus: QuickActionStatus;
  resolvedReason?: string;
}

export function buildQuickActionHref(
  action: QuickAction,
  ctx: GuardContext & { role: string }
): { href: string; status: QuickActionStatus; disabledReason?: string } {
  // Role check
  if (!action.roles.includes(ctx.role as never)) {
    return { href: '', status: 'DISABLED', disabledReason: 'Not available for your role.' };
  }

  // Matter required but not selected
  if (action.requiresMatter && !ctx.activeMatterId) {
    return { href: '', status: 'NO_MATTER_SELECTED', disabledReason: 'Select a matter first.' };
  }

  // Guard preconditions
  const guardResult = evaluateGuards(action.preconditions, ctx);
  if (guardResult.status === 'LOCKED') {
    return { href: '', status: 'LOCKED', disabledReason: guardResult.disabledReason };
  }

  // Build href
  let href = action.href;
  if (action.appendMatterId && ctx.activeMatterId) {
    href = href.replace('[matter_id]', encodeURIComponent(ctx.activeMatterId));
    if (!href.includes('matter_id=') && !href.includes('[matter_id]')) {
      const sep = href.includes('?') ? '&' : '?';
      href = `${href}${sep}matter_id=${encodeURIComponent(ctx.activeMatterId)}`;
    }
  }

  // Route existence check — use base path only
  const basePath = href.split('?')[0];
  const isMounted = MOUNTED_ROUTES.some(r => basePath.startsWith(r));
  if (!isMounted) {
    return { href, status: 'NOT_MOUNTED', disabledReason: 'This route is not mounted yet.' };
  }

  return { href, status: 'READY' };
}

export function resolveActions(
  actions: QuickAction[],
  ctx: GuardContext & { role: string }
): ResolvedAction[] {
  return actions.map(action => {
    const { href, status, disabledReason } = buildQuickActionHref(action, ctx);
    return { ...action, resolvedHref: href, resolvedStatus: status, resolvedReason: disabledReason };
  });
}
