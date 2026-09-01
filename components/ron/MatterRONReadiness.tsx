import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { RONSessionControlPanel } from '@/components/ron/RONSessionControlPanel';
import { NotarialActResolution } from '@/components/ron/NotarialActResolution';
import type { MilanoRONStatus } from '@/lib/bluenotary/types';
import { evaluateSchedulingGate } from '@/lib/scheduling/complimentarySchedulingGate';

function badge(ok: boolean) {
  return ok
    ? 'border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-300'
    : 'border-[#E0876E]/35 bg-[#C0563E]/[0.08] text-[#E0876E]';
}

function schedulingAuthorityLabel(method: ReturnType<typeof evaluateSchedulingGate>['paymentRequirementMethod']) {
  if (method === 'verified_payment') return 'Wise verified · scheduling authorized';
  if (method === 'wise_submission_observed') return 'Wise submitted · scheduling authorized';
  if (method === 'complimentary_authorization') return 'Complimentary authorization · scheduling authorized';
  return 'Scheduling payment authority not satisfied';
}

function schedulingAuthorityDetail(method: ReturnType<typeof evaluateSchedulingGate>['paymentRequirementMethod']) {
  if (method === 'verified_payment') return 'Payment is verified. BlueNotary readiness now depends only on the remaining execution facts.';
  if (method === 'wise_submission_observed') return 'The governed Wise submission satisfies scheduling while settlement continues separately in the background.';
  if (method === 'complimentary_authorization') return 'A governed Complimentary Authorization satisfies scheduling without fabricating paid revenue.';
  return 'Resolve the canonical scheduling payment requirement before creating the provider session.';
}

export async function MatterRONReadiness({ matterId }: { matterId: string }) {
  const supabase = createAdminClient();
  const { data: matter } = await supabase
    .from('deals')
    .select('id, deal_id, client_name, email, phone, document_type, destination_country, origin_state, execution_truth, payment_status, payment_confirmed, payment_settlement_status, payment_observed_at, payment_observed_amount, payment_observed_currency, payment_observed_reference, currency, wise_reference, amount_due, amount_paid, is_platform_fee_only, payment_disposition, comp_authorized, comp_authorization_id, comp_authorized_at, comp_revoked_at, verified_revenue')
    .eq('id', matterId)
    .single();

  if (!matter) return null;

  const truth = (matter.execution_truth ?? {}) as Record<string, unknown>;
  if (truth.execution_method !== 'ron' && truth.notarization_requirement !== 'required') return null;

  const [{ data: files }, { data: sessions }] = await Promise.all([
    supabase
      .from('files')
      .select('id, name, storage_path, mime_type, category')
      .eq('deal_id', matter.id)
      .eq('is_internal', false)
      .order('created_at', { ascending: true }),
    supabase
      .from('ron_sessions')
      .select('id, notarization_id, bn_session_id, milano_ron_status, payment_gate_status, session_timing, expired_at, completed_at, created_at')
      .eq('matter_id', matter.id)
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  const activeSession = sessions?.[0] ?? null;
  let ronDocuments: Array<{ id: string; document_name: string | null; uploaded_to_bluenotary: boolean | null }> = [];
  if (activeSession) {
    const { data } = await supabase
      .from('ron_documents')
      .select('id, document_name, uploaded_to_bluenotary')
      .eq('ron_session_id', activeSession.id);
    ronDocuments = data ?? [];
  }

  const signerState = String(truth.signer_location ?? matter.origin_state ?? '').trim();
  const notaryJurisdiction = String(truth.notary_jurisdiction ?? '').trim();
  const notarialAct = String(truth.notarial_act ?? 'review_required');
  const notarialActNeedsReview = notarialAct === 'review_required' || notarialAct === 'unknown';
  const schedulingGate = evaluateSchedulingGate({ matter });
  const schedulingAuthorized = schedulingGate.schedulingEligible;
  const paymentRequirementMethod = schedulingGate.paymentRequirementMethod;
  const paymentLabel = schedulingAuthorityLabel(paymentRequirementMethod);
  const signerComplete = Boolean(matter.client_name && matter.email && matter.phone && signerState);
  const ronTruthComplete =
    truth.notarization_requirement === 'required' &&
    truth.execution_method === 'ron' &&
    Boolean(signerState) &&
    Boolean(notaryJurisdiction) &&
    Boolean(notarialAct) &&
    !notarialActNeedsReview;
  const documentReady = Boolean(files?.length);
  const sessionExists = Boolean(activeSession && !['RON_EXPIRED', 'RON_COMPLETED'].includes(activeSession.milano_ron_status));
  const sessionNotExpired = Boolean(activeSession && activeSession.milano_ron_status !== 'RON_EXPIRED' && (!activeSession.expired_at || new Date(activeSession.expired_at) > new Date()));
  const sessionCompleted = Boolean(activeSession && ['RON_COMPLETED', 'SESSION_PROCESSING', 'SIGNED_DOCS_RETRIEVED', 'READY_FOR_APOSTILLE'].includes(activeSession.milano_ron_status));
  const pendingRONDocumentIds = ronDocuments.filter((doc) => !doc.uploaded_to_bluenotary).map((doc) => doc.id);

  const blockers = [
    !schedulingAuthorized ? schedulingGate.reason : null,
    !signerComplete ? 'Signer name, email, phone, and signer location must be present.' : null,
    !documentReady ? 'At least one Matter document is required.' : null,
    notarialActNeedsReview ? 'Operator must confirm the notarial act before BlueNotary session creation.' : null,
    !notaryJurisdiction ? 'Notary jurisdiction must be confirmed.' : null,
  ].filter(Boolean) as string[];

  const readyToCreate = schedulingAuthorized && ronTruthComplete && signerComplete && documentReady;

  return (
    <section className="rounded-2xl border border-[var(--ms-gold)]/20 bg-[#08080A]/90 p-4 shadow-[0_24px_80px_rgba(0,0,0,.22)] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--ms-gold)]/70">BlueNotary · Existing RON Module</p>
          <h3 className="mt-1 font-serif text-xl text-white">BlueNotary Operator Actions</h3>
          <p className="mt-1 text-xs text-white/45">Matter {matter.deal_id ?? matter.id} · same-Matter provider handoff</p>
        </div>
        <span className={`w-fit rounded-full border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.12em] ${badge(readyToCreate)}`}>
          {readyToCreate ? 'Ready to create session' : 'Preflight required'}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className={`rounded-2xl border p-4 ${schedulingAuthorized ? 'border-emerald-500/25 bg-emerald-500/[0.055]' : 'border-[#E0876E]/25 bg-[#C0563E]/[0.055]'}`}>
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/38">Scheduling authority</p>
          <p className={`mt-1 text-base font-medium ${schedulingAuthorized ? 'text-emerald-200' : 'text-[#E0876E]'}`}>
            {schedulingAuthorized ? 'Payment is not the blocker' : 'Scheduling payment authority blocked'}
          </p>
          <p className="mt-1 text-xs leading-5 text-white/45">{paymentLabel}</p>
        </div>
        <div className={`rounded-2xl border p-4 ${notarialActNeedsReview ? 'border-[var(--ms-gold)]/30 bg-[var(--ms-gold)]/[0.055]' : 'border-emerald-500/20 bg-emerald-500/[0.04]'}`}>
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/38">Current execution decision</p>
          <p className={`mt-1 text-base font-medium ${notarialActNeedsReview ? 'text-[#F6E8B8]' : 'text-emerald-200'}`}>
            {notarialActNeedsReview ? 'Confirm notarial act' : 'Notarial act confirmed'}
          </p>
          <p className="mt-1 text-xs leading-5 text-white/45">
            {notarialActNeedsReview
              ? 'This is an unresolved execution fact. Never infer acknowledgment or jurat from document type.'
              : `Confirmed as ${notarialAct.replace(/_/g, ' ')}.`}
          </p>
        </div>
      </div>

      {schedulingAuthorized && notarialActNeedsReview && !activeSession && (
        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.045] px-4 py-3 text-xs leading-5 text-white/58">
          <strong className="text-emerald-200">Scheduling authority is already satisfied.</strong>{' '}
          {schedulingAuthorityDetail(paymentRequirementMethod)} BlueNotary is waiting on execution truth—not another payment.
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ['Signer', matter.client_name || 'Missing'],
          ['Signer Email', matter.email || 'Missing'],
          ['Signer Phone', matter.phone || 'Missing'],
          ['Signer Location', signerState || 'Missing'],
          ['Document / Package', files?.map((file) => file.name).join(', ') || 'Missing'],
          ['Notarization Type', notarialActNeedsReview ? 'Operator review required' : notarialAct.replace(/_/g, ' ')],
          ['Destination Jurisdiction', matter.destination_country || 'Missing'],
          ['Notary Jurisdiction', notaryJurisdiction || 'Missing'],
          ['Payment / Scheduling', paymentLabel],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/[0.055] bg-white/[0.015] p-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/35">{label}</p>
            <p className="mt-1 break-words text-sm text-white/75">{value}</p>
          </div>
        ))}
      </div>

      {notarialActNeedsReview && !activeSession && (
        <NotarialActResolution
          matterId={matter.id}
          schedulingAuthorized={schedulingAuthorized}
          paymentRequirementMethod={paymentRequirementMethod}
        />
      )}

      {activeSession && (
        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4 text-xs text-white/65">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-emerald-300/80">BlueNotary Session</p>
              <p className="mt-1">{activeSession.notarization_id} · {activeSession.milano_ron_status}</p>
            </div>
            <Link href={`/dashboard/ron/${activeSession.id}`} className="text-[var(--ms-gold)] underline-offset-4 hover:underline">Open RON session →</Link>
          </div>
        </div>
      )}

      {blockers.length > 0 && !activeSession && (
        <div className="mt-4 rounded-xl border border-[#E0876E]/25 bg-[#C0563E]/[0.07] p-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#E0876E]">Resolve Before BlueNotary Handoff</p>
          <ul className="mt-2 space-y-1.5 text-xs text-white/65">
            {blockers.map((blocker) => <li key={blocker}>• {blocker}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-4">
        <RONSessionControlPanel
          matterId={matter.id}
          sessionId={activeSession?.id ?? null}
          currentStatus={(activeSession?.milano_ron_status as MilanoRONStatus | undefined) ?? null}
          documentIds={pendingRONDocumentIds}
          gates={{
            schedulingAuthorized: { met: schedulingAuthorized, reason: schedulingGate.reason },
            sessionExists: { met: sessionExists },
            sessionNotExpired: { met: sessionNotExpired },
            signerComplete: { met: signerComplete, reason: 'Signer name, email, phone, and location are required.' },
            ronTruthComplete: { met: ronTruthComplete, reason: notarialActNeedsReview ? 'Confirm acknowledgment vs jurat before creating the provider session.' : 'RON execution truth is incomplete.' },
            documentReady: { met: documentReady, reason: 'Matter package is missing.' },
            sessionCompleted: { met: sessionCompleted },
          }}
        />
      </div>

      <p className="mt-4 text-[11px] leading-5 text-white/28">
        The canonical scheduling gate decides whether the session may be reserved. A submitted Wise payment can satisfy scheduling without becoming paid truth; a Complimentary Authorization can satisfy the same gate under its own governance. Signing-link release and final international release remain independently protected by stronger evidence requirements.
      </p>
    </section>
  );
}
