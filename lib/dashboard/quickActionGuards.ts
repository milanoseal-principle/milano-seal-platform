import { QuickActionStatus } from './quickActionTypes';

export interface GuardContext {
  activeMatterId?: string;
  matterState?: string;
  paymentStatus?: string;
  executionStatus?: string;
  releaseStatus?: string;
}

const EXECUTION_COMPLETE_STATES = [
  'ron_completed', 'in_execution_complete', 'apostille_required',
  'apostille_processing', 'apostille_completed', 'courier_released',
  'shipped', 'delivered', 'completed',
];

export function checkPrecondition(
  precondition: string,
  ctx: GuardContext
): { pass: boolean; reason?: string } {
  switch (precondition) {
    case 'matter_exists':
      return ctx.activeMatterId
        ? { pass: true }
        : { pass: false, reason: 'Select a matter first.' };
    case 'payment_confirmed':
      return (ctx.paymentStatus === 'payment_confirmed' || ctx.paymentStatus === 'paid')
        ? { pass: true }
        : { pass: false, reason: 'Payment must be confirmed before this action.' };
    case 'execution_completed':
      return ctx.matterState && EXECUTION_COMPLETE_STATES.includes(ctx.matterState)
        ? { pass: true }
        : { pass: false, reason: 'Execution must be complete before this action.' };
    case 'release_ready':
      return (ctx.releaseStatus === 'ready_for_review' || ctx.releaseStatus === 'ready_for_release')
        ? { pass: true }
        : { pass: false, reason: 'Matter must be release-ready.' };
    case 'final_document_ready':
      return { pass: true }; // checked in release workflow
    case 'delivery_confirmed_or_digital_release_ready':
      return (ctx.matterState === 'delivered' || ctx.matterState === 'digital_release_ready')
        ? { pass: true }
        : { pass: false, reason: 'Delivery or digital release must be confirmed.' };
    case 'release_review_complete':
      return (ctx.releaseStatus === 'reviewed' || ctx.releaseStatus === 'approved')
        ? { pass: true }
        : { pass: false, reason: 'Release review is required before Paid & Released.' };
    case 'invoice_created':
      return { pass: true }; // checked in invoice workflow
    default:
      return { pass: true };
  }
}

export function evaluateGuards(
  preconditions: string[] | undefined,
  ctx: GuardContext
): { status: QuickActionStatus; disabledReason?: string } {
  if (!preconditions || preconditions.length === 0) return { status: 'READY' };
  for (const pc of preconditions) {
    const result = checkPrecondition(pc, ctx);
    if (!result.pass) return { status: 'LOCKED', disabledReason: result.reason };
  }
  return { status: 'READY' };
}
