import type { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import type { MilanoRONStatus } from '@/lib/bluenotary/types';
import { getClientStatusLabel } from '@/lib/bluenotary/status';
import { evaluateSchedulingGate } from '@/lib/scheduling/complimentarySchedulingGate';

export const metadata: Metadata = {
  title: 'Signing Room — The Milano Seal™',
  robots: { index: false, follow: false },
};

const QUEUE_DEFINITIONS: { label: string; statuses: MilanoRONStatus[]; color: string }[] = [
  { label: 'Ready for RON', statuses: ['READY_FOR_RON'], color: 'border-amber-500' },
  { label: 'Sessions Created', statuses: ['RON_SESSION_CREATED', 'SIGNER_INVITED', 'SIGNING_LINK_RELEASED'], color: 'border-yellow-400' },
  { label: 'Identity Verification', statuses: ['IDENTITY_STARTED', 'PHOTO_ID_PASSED', 'PHOTO_ID_FAILED', 'BIOMETRICS_PASSED', 'KBA_STARTED', 'KBA_PASSED', 'KBA_FAILED'], color: 'border-blue-400' },
  { label: 'In Session', statuses: ['NOTARY_ACCEPTED', 'SESSION_JOINED', 'SESSION_STARTED'], color: 'border-green-400' },
  { label: 'Processing Signed Documents', statuses: ['SESSION_PROCESSING', 'RON_COMPLETED'], color: 'border-purple-400' },
  { label: 'Completed / Awaiting Apostille Review', statuses: ['SIGNED_DOCS_RETRIEVED', 'READY_FOR_APOSTILLE'], color: 'border-amber-400' },
  { label: 'Failed / Review Required', statuses: ['RON_REVIEW_REQUIRED'], color: 'border-red-500' },
  { label: 'Expired / Reschedule Required', statuses: ['RON_EXPIRED'], color: 'border-zinc-500' },
];

interface SessionRow {
  id: string;
  matter_id: string;
  notarization_id: string;
  milano_ron_status: MilanoRONStatus;
  identity_status: string;
  kba_status: string;
  payment_gate_status: string;
  session_timing: string | null;
  created_at: string;
  deals: {
    deal_id: string | null;
    client_name: string | null;
    email: string | null;
    document_type: string | null;
    destination_country: string | null;
    payment_status: string | null;
    payment_confirmed: boolean | null;
    payment_settlement_status: string | null;
  } | null;
}

interface PreSessionMatter {
  id: string;
  deal_id: string | null;
  client_name: string | null;
  email: string | null;
  phone: string | null;
  document_type: string | null;
  destination_country: string | null;
  payment_status: string | null;
  payment_confirmed: boolean | null;
  payment_settlement_status: string | null;
  payment_observed_at: string | null;
  amount_due: number | null;
  amount_paid: number | null;
  is_platform_fee_only: boolean | null;
  payment_disposition: string | null;
  comp_authorized: boolean | null;
  comp_authorization_id: string | null;
  comp_authorized_at: string | null;
  comp_revoked_at: string | null;
  verified_revenue: number | null;
  execution_truth: Record<string, unknown> | null;
}

async function getRONData() {
  const supabase = createAdminClient();
  const [{ data: sessions, error }, { data: matters }] = await Promise.all([
    supabase
      .from('ron_sessions')
      .select(`
        id, matter_id, notarization_id, milano_ron_status, identity_status, kba_status,
        payment_gate_status, session_timing, created_at,
        deals:matter_id (deal_id, client_name, email, document_type, destination_country, payment_status, payment_confirmed, payment_settlement_status)
      `)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('deals')
      .select('id, deal_id, client_name, email, phone, document_type, destination_country, payment_status, payment_confirmed, payment_settlement_status, payment_observed_at, amount_due, amount_paid, is_platform_fee_only, payment_disposition, comp_authorized, comp_authorization_id, comp_authorized_at, comp_revoked_at, verified_revenue, execution_truth')
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  const safeSessions = error ? [] : ((sessions ?? []) as unknown as SessionRow[]);
  const sessionMatterIds = new Set(safeSessions.map((session) => session.matter_id));
  const preSessionMatters = ((matters ?? []) as unknown as PreSessionMatter[]).filter((matter) => {
    const truth = matter.execution_truth ?? {};
    return (
      !sessionMatterIds.has(matter.id) &&
      (truth.execution_method === 'ron' || truth.notarization_requirement === 'required')
    );
  });

  return { sessions: safeSessions, preSessionMatters };
}

function paymentLabel(matter: PreSessionMatter) {
  const gate = evaluateSchedulingGate({ matter });
  if (matter.payment_confirmed) return 'Verified · scheduling authorized';
  if (matter.payment_settlement_status === 'observed_pending' || matter.payment_observed_at) {
    return gate.schedulingEligible
      ? 'Retainer submitted · Wise processing · scheduling authorized'
      : 'Retainer submitted · Wise processing';
  }
  return gate.schedulingEligible ? 'Scheduling authorized' : 'Payment requirement not satisfied';
}

function getRONBlockers(matter: PreSessionMatter) {
  const truth = matter.execution_truth ?? {};
  const schedulingGate = evaluateSchedulingGate({ matter });
  const notarialAct = String(truth.notarial_act ?? '').trim().toLowerCase();
  const blockers: string[] = [];

  if (!schedulingGate.schedulingEligible) blockers.push(schedulingGate.reason);
  if (!String(truth.signer_location ?? '').trim()) blockers.push('Signer location is required.');
  if (!String(truth.notary_jurisdiction ?? '').trim()) blockers.push('Notary jurisdiction is required.');
  if (!notarialAct || notarialAct === 'review_required' || notarialAct === 'unknown') blockers.push('Notarial act requires operator review.');
  if (!matter.document_type) blockers.push('Matter document type is unresolved.');

  return Array.from(new Set(blockers));
}

function PreSessionMatterCard({ matter }: { matter: PreSessionMatter }) {
  const truth = matter.execution_truth ?? {};
  const notarialAct = String(truth.notarial_act ?? 'review_required');
  const schedulingGate = evaluateSchedulingGate({ matter });
  const blockers = getRONBlockers(matter);
  const ready = blockers.length === 0;

  return (
    <article className={`overflow-hidden rounded-2xl border bg-gradient-to-b from-zinc-900 to-zinc-950 shadow-[0_20px_60px_rgba(0,0,0,0.3)] ${ready ? 'border-emerald-700/40' : 'border-amber-700/30'}`}>
      <div className="border-b border-white/5 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">{matter.deal_id ?? matter.id}</p>
            <p className="mt-1 truncate text-base font-semibold text-white">{matter.client_name ?? 'Unknown client'}</p>
            <p className="mt-1 truncate text-xs text-zinc-500">{matter.email || 'email missing'} · {matter.phone || 'phone missing'}</p>
          </div>
          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide ${ready ? 'border-emerald-600/50 bg-emerald-950/50 text-emerald-300' : 'border-amber-600/40 bg-amber-950/40 text-amber-300'}`}>
            {ready ? 'READY TO CREATE' : `${blockers.length} BLOCKER${blockers.length === 1 ? '' : 'S'}`}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/5 bg-black/20 p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">Document</p>
            <p className="mt-1 text-sm text-zinc-200">{matter.document_type ?? 'Review required'}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-black/20 p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">Destination</p>
            <p className="mt-1 text-sm text-zinc-200">{matter.destination_country ?? 'Review required'}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-black/20 p-3 sm:col-span-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">Payment / scheduling</p>
            <p className={`mt-1 text-sm ${schedulingGate.schedulingEligible ? 'text-emerald-300' : 'text-amber-300'}`}>{paymentLabel(matter)}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-black/20 p-3 sm:col-span-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">Notarial act</p>
            <p className="mt-1 text-sm text-zinc-200">{notarialAct === 'review_required' ? 'Operator review required' : notarialAct.replace(/_/g, ' ')}</p>
          </div>
        </div>

        {ready ? (
          <div className="rounded-xl border border-emerald-700/30 bg-emerald-950/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">Ready for BlueNotary</p>
            <p className="mt-1 text-xs leading-5 text-emerald-100/70">Scheduling authority and required RON execution facts are present. Open readiness to review the package and create the session.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-700/30 bg-amber-950/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-300">Resolve before session creation</p>
            <ul className="mt-2 space-y-1.5">
              {blockers.map((blocker) => (
                <li key={blocker} className="flex gap-2 text-xs leading-5 text-zinc-300">
                  <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  <span>{blocker}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Link
          href={`/dashboard/matters/${matter.id}/execution`}
          className="flex min-h-11 w-full items-center justify-center rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/70 to-yellow-950/40 px-4 py-2.5 text-sm font-semibold text-amber-200 transition hover:border-amber-400/60 hover:from-amber-900/70 hover:to-yellow-900/40 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
        >
          {ready ? 'Open RON Readiness → Create BlueNotary Session' : 'Open RON Readiness → Resolve Blockers'}
        </Link>
      </div>
    </article>
  );
}

function MatterCard({ session }: { session: SessionRow }) {
  const deal = session.deals;
  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 transition hover:border-amber-500/40">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">{session.notarization_id}</p>
          <p className="mt-1 truncate text-sm font-semibold text-white">{deal?.client_name ?? 'Unknown Client'}</p>
          <p className="truncate text-xs text-zinc-500">{deal?.email}</p>
        </div>
        <span className="shrink-0 whitespace-nowrap rounded-full border border-amber-500/30 bg-amber-950/20 px-2 py-1 text-[10px] text-amber-300">
          {getClientStatusLabel(session.milano_ron_status)}
        </span>
      </div>
      <div className="mb-4 grid grid-cols-1 gap-2 text-xs text-zinc-400 sm:grid-cols-2">
        <p><span className="text-zinc-600">Doc </span>{deal?.document_type ?? '—'}</p>
        <p><span className="text-zinc-600">Destination </span>{deal?.destination_country ?? '—'}</p>
        <p className="sm:col-span-2"><span className="text-zinc-600">Payment </span>{deal?.payment_confirmed ? 'Verified' : deal?.payment_settlement_status === 'observed_pending' ? 'Wise processing · not yet settled' : 'Not verified'}</p>
        <p><span className="text-zinc-600">Identity </span>{session.identity_status}</p>
        <p><span className="text-zinc-600">KBA </span>{session.kba_status}</p>
      </div>
      <Link href={`/dashboard/ron/${session.id}`} className="flex min-h-11 w-full items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition hover:border-amber-500/40 hover:bg-zinc-800">Open Session</Link>
    </article>
  );
}

export default async function RONSigningRoomPage() {
  await requireDashboardAccess();
  const { sessions, preSessionMatters } = await getRONData();
  const grouped = QUEUE_DEFINITIONS.map((queue) => ({ ...queue, sessions: sessions.filter((s) => queue.statuses.includes(s.milano_ron_status)) }));
  const totalActive = sessions.filter((s) => !['RON_EXPIRED', 'RON_COMPLETED', 'SIGNED_DOCS_RETRIEVED', 'READY_FOR_APOSTILLE'].includes(s.milano_ron_status)).length;
  const readyCount = preSessionMatters.filter((matter) => getRONBlockers(matter).length === 0).length;
  const blockedCount = preSessionMatters.length - readyCount;

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-5 sm:p-6 lg:p-8">
      <header className="mb-8 overflow-hidden rounded-2xl border border-amber-900/30 bg-gradient-to-br from-zinc-950 via-zinc-950 to-amber-950/20 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-amber-500/30 bg-amber-950/30 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-300">RON-01</span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Operator execution surface</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">BlueNotary Signing Room</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Review RON readiness, resolve blockers, create the BlueNotary session, manage identity/session progress, retrieve signed documents, then hand the same Matter into apostille review.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
            <div className="rounded-xl border border-white/5 bg-black/20 p-3 text-center">
              <p className="text-xl font-semibold text-emerald-300">{readyCount}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-zinc-600">Ready</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/20 p-3 text-center">
              <p className="text-xl font-semibold text-amber-300">{blockedCount}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-zinc-600">Blocked</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/20 p-3 text-center">
              <p className="text-xl font-semibold text-white">{totalActive}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-zinc-600">Active</p>
            </div>
          </div>
        </div>
      </header>

      <section className="mb-10">
        <div className="mb-4 flex flex-col gap-1 border-b border-amber-500/30 pb-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white">Before BlueNotary Session</h2>
            <p className="mt-1 text-xs text-zinc-500">Every unresolved requirement is shown directly on the Matter card. No hover required.</p>
          </div>
          <span className="text-xs text-zinc-600">{preSessionMatters.length} Matter{preSessionMatters.length === 1 ? '' : 's'}</span>
        </div>
        {preSessionMatters.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center text-sm text-zinc-500">No pre-session RON Matters.</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{preSessionMatters.map((matter) => <PreSessionMatterCard key={matter.id} matter={matter} />)}</div>
        )}
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white">Active BlueNotary Sessions</h2>
          <p className="mt-1 text-xs text-zinc-500">Session status is grouped by operational stage so the next action stays obvious.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {grouped.map((queue) => (
            <div key={queue.label}>
              <div className={`mb-3 flex items-center gap-2 border-b pb-2 ${queue.color}`}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">{queue.label}</h3>
                <span className="ml-auto text-xs text-zinc-500">{queue.sessions.length}</span>
              </div>
              {queue.sessions.length === 0 ? <p className="rounded-xl border border-dashed border-zinc-800 p-4 text-xs italic text-zinc-600">No sessions in this stage.</p> : <div className="space-y-3">{queue.sessions.map((session) => <MatterCard key={session.id} session={session} />)}</div>}
            </div>
          ))}
        </div>
      </section>

      <aside className="mt-8 rounded-2xl border border-amber-900/30 bg-amber-950/10 p-4 text-xs leading-5 text-zinc-500">
        <span className="font-semibold text-amber-400">Scheduling authority: </span>
        RON session creation uses the canonical Matter scheduling gate. An observed Wise submission may authorize scheduling while settlement remains processing, but it never marks the Matter paid. Signing-link release remains governed by verified settlement truth.
      </aside>
    </div>
  );
}
