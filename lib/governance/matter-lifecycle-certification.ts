import { evaluatePaymentGate } from '@/lib/payments/paymentGate';
export const CANONICAL_LIFECYCLE_CHECKPOINTS = [
  'MATTER_CREATED',
  'VALIDATED',
  'QUOTED',
  'WISE_PAYMENT_VERIFIED',
  'EXECUTION_UNLOCKED',
  'EXECUTED',
  'APOSTILLE_OR_AUTHENTICATION',
  'CUSTODY_RECORDED',
  'COURIER_RELEASED',
  'DELIVERED',
  'MATTER_CLOSED',
] as const;

export type LifecycleCheckpoint = (typeof CANONICAL_LIFECYCLE_CHECKPOINTS)[number];
export type CertificationState = 'PASS' | 'FAIL' | 'NOT_APPLICABLE' | 'UNVERIFIED';

export interface MatterLifecycleEvidence {
  matterId: string;
  canonicalStatus?: string | null;
  paymentConfirmed?: boolean | null;
  paymentStatus?: string | null;
  amountDue?: number | null;
  amountPaid?: number | null;
  paymentSettlementStatus?: string | null;
  executionTruth?: Record<string, unknown> | null;
  executedAt?: string | null;
  apostilleEvidence?: boolean;
  authenticationEvidence?: boolean;
  custodyEvents?: number;
  courierReleasedAt?: string | null;
  deliveredAt?: string | null;
  closedAt?: string | null;
  apiMatterId?: string | null;
  portalMatterId?: string | null;
  operatorMatterId?: string | null;
  wiseMatterReference?: string | null;
  eventMatterIds?: string[];
  releaseMatterId?: string | null;
  trackingMatterId?: string | null;
}

export interface LifecycleCertificationResult {
  matterId: string;
  certified: boolean;
  identityContinuity: boolean;
  checkpoints: Array<{ checkpoint: LifecycleCheckpoint; state: CertificationState; reason: string }>;
  conflicts: string[];
}

function sameMatter(expected: string, candidate?: string | null) {
  return candidate == null || candidate === expected;
}

export function certifyMatterLifecycle(evidence: MatterLifecycleEvidence): LifecycleCertificationResult {
  const conflicts: string[] = [];
  const identityCandidates = [
    evidence.apiMatterId,
    evidence.portalMatterId,
    evidence.operatorMatterId,
    evidence.wiseMatterReference,
    evidence.releaseMatterId,
    evidence.trackingMatterId,
    ...(evidence.eventMatterIds ?? []),
  ];
  identityCandidates.forEach((candidate) => {
    if (!sameMatter(evidence.matterId, candidate)) conflicts.push(`Matter identity conflict: ${candidate}`);
  });

  const truth = evidence.executionTruth ?? {};
  const status = String(evidence.canonicalStatus ?? '').toLowerCase();
  const paymentVerified = evaluatePaymentGate({id:evidence.matterId,payment_confirmed:evidence.paymentConfirmed,payment_status:evidence.paymentStatus,payment_settlement_status:evidence.paymentSettlementStatus,amount_due:evidence.amountDue,amount_paid:evidence.amountPaid}) === 'PAYMENT_CONFIRMED';
  const executionUnlocked = paymentVerified;
  const checkpoints: LifecycleCertificationResult['checkpoints'] = [
    { checkpoint: 'MATTER_CREATED', state: evidence.matterId ? 'PASS' : 'FAIL', reason: evidence.matterId ? 'Canonical Matter ID present' : 'Matter ID missing' },
    { checkpoint: 'VALIDATED', state: truth.validation_complete === true || !['', 'intake_received'].includes(status) ? 'PASS' : 'UNVERIFIED', reason: 'Derived from canonical validation/status truth' },
    { checkpoint: 'QUOTED', state: truth.quote_approved === true || ['quoted','awaiting_payment','payment_confirmed','scheduled','in_execution','apostille_processing','courier_ready','shipped','delivered','completed'].includes(status) ? 'PASS' : 'UNVERIFIED', reason: 'Derived from canonical quote/lifecycle truth' },
    { checkpoint: 'WISE_PAYMENT_VERIFIED', state: paymentVerified ? 'PASS' : 'UNVERIFIED', reason: paymentVerified ? 'Wise settlement verified' : 'Verified Wise settlement not proven' },
    { checkpoint: 'EXECUTION_UNLOCKED', state: executionUnlocked ? 'PASS' : 'UNVERIFIED', reason: executionUnlocked ? 'Canonical payment/execution gate satisfied' : 'Execution authority not proven' },
    { checkpoint: 'EXECUTED', state: evidence.executedAt || truth.executed_at ? 'PASS' : 'UNVERIFIED', reason: 'Execution evidence must be persisted' },
    { checkpoint: 'APOSTILLE_OR_AUTHENTICATION', state: evidence.apostilleEvidence || evidence.authenticationEvidence ? 'PASS' : 'UNVERIFIED', reason: 'Requires persisted apostille/authentication evidence when applicable' },
    { checkpoint: 'CUSTODY_RECORDED', state: Number(evidence.custodyEvents ?? 0) > 0 ? 'PASS' : 'UNVERIFIED', reason: 'Requires custody ledger evidence' },
    { checkpoint: 'COURIER_RELEASED', state: evidence.courierReleasedAt ? 'PASS' : 'UNVERIFIED', reason: 'Requires governed release evidence' },
    { checkpoint: 'DELIVERED', state: evidence.deliveredAt ? 'PASS' : 'UNVERIFIED', reason: 'Requires delivery evidence' },
    { checkpoint: 'MATTER_CLOSED', state: evidence.closedAt || status === 'completed' ? 'PASS' : 'UNVERIFIED', reason: 'Requires canonical closed/completed truth' },
  ];

  if(identityCandidates.slice(0,6).some(id=>!id)||!evidence.trackingMatterId||!evidence.eventMatterIds?.length)conflicts.push('Required cross-system Matter identity evidence missing');
  const identityContinuity = conflicts.length === 0;
  const certified = identityContinuity && checkpoints.every((item) => item.state === 'PASS' || item.state === 'NOT_APPLICABLE');
  return { matterId: evidence.matterId, certified, identityContinuity, checkpoints, conflicts };
}
