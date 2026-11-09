/** Current-attempt Wise evidence. Missing projections fail closed. */
export interface WiseAttemptMatter {
  id: string;
  payment_attempt_id?: string | null;
  payment_attempt_started_at?: string | null;
  wise_provider_evidence?: unknown;
  wise_transaction_reference?: string | null;
  payment_funding_method?: string | null;
  wise_reference?: string | null;
  deal_id?: string | null;
  amount_due?: number | string | null;
  currency?: string | null;
}

export function hasCurrentWiseProviderEvidence(matter: WiseAttemptMatter): boolean {
  const evidence = matter.wise_provider_evidence;
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) return false;
  const e = evidence as Record<string, unknown>;
  const started = Date.parse(matter.payment_attempt_started_at ?? '');
  const occurred = Date.parse(String(e.occurred_at ?? ''));
  const due = Number(matter.amount_due);
  return Boolean(matter.payment_attempt_id && matter.wise_transaction_reference?.trim()) &&
    e.attempt_id === matter.payment_attempt_id && e.matter_id === matter.id &&
    e.resource_id === matter.wise_transaction_reference &&
    matter.payment_funding_method === 'wise_acquiring_payment' &&
    ['IN_PROGRESS', 'UPCOMING', 'COMPLETED', 'SETTLED'].includes(String(e.status)) &&
    Number.isFinite(started) && Number.isFinite(occurred) && occurred >= started &&
    Number.isFinite(due) && due > 0 && Number(e.amount) === due &&
    Boolean(matter.currency?.trim()) && String(e.currency ?? '').trim().toUpperCase() === matter.currency!.trim().toUpperCase() &&
    Boolean(String(e.reference ?? '').trim()) &&
    e.reference === String(matter.wise_reference ?? matter.deal_id ?? '').trim();
}

export function isInvalidWiseStatus(status: unknown): boolean {
  return ['CANCELLED', 'CANCELED', 'FAILED', 'VOIDED', 'EXPIRED', 'REVERSED', 'REFUNDED', 'REJECTED', 'REVOKED', 'SUPERSEDED'].includes(String(status ?? '').toUpperCase());
}

/** Activity alone is enrichment; incomplete/malformed provider data grants no authority. */
export function activityMatchesAttempt(activity: Record<string, unknown>, matter: WiseAttemptMatter): boolean {
  if (!matter.payment_attempt_id || !matter.payment_attempt_started_at) return false;
  const started = Date.parse(matter.payment_attempt_started_at);
  const created = Date.parse(String(activity.createdOn ?? ''));
  if (!Number.isFinite(created) || created < started) return false;
  const resource = activity.resource && typeof activity.resource === 'object' ? activity.resource as Record<string, unknown> : {};
  const raw = resource.amount ?? activity.amount ?? activity.primaryAmount;
  const amount = raw && typeof raw === 'object' ? raw as Record<string, unknown> : null;
  const value = Number(amount?.value ?? raw);
  const currency = String(amount?.currency ?? resource.currency ?? activity.currency ?? '').trim().toUpperCase();
  const due = Number(matter.amount_due);
  return Number.isFinite(value) && value > 0 && value === due && currency !== '' && currency === String(matter.currency ?? '').trim().toUpperCase();
}

/** Presentation only; canonical execution/settlement gates remain server-side. */
export function paymentObservationPresentation(payment: { paymentConfirmed: boolean; settlementStatus: string; paymentObservedAt: unknown; submissionCurrent?: boolean } | null): 'unverified' | 'settled' | 'pending' | 'review' | 'invalidated' | 'not_submitted' {
  if (!payment) return 'unverified';
  if (isInvalidWiseStatus(payment.settlementStatus)) return 'invalidated';
  if (payment.paymentConfirmed && payment.settlementStatus === 'cleared') return 'settled';
  if (payment.settlementStatus === 'mismatch_review') return 'review';
  if (payment.paymentObservedAt && payment.settlementStatus === 'observed_available') return 'pending';
  if (payment.paymentObservedAt && payment.submissionCurrent !== false && ['observed_pending','observed_available'].includes(payment.settlementStatus)) return 'pending';
  return 'not_submitted';
}
