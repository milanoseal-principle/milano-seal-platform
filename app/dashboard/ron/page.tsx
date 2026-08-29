import type { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import type { MilanoRONStatus } from '@/lib/bluenotary/types';
import { getClientStatusLabel } from '@/lib/bluenotary/status';

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
      .select('id, deal_id, client_name, email, phone, document_type, destination_country, payment_status, payment_confirmed, payment_settlement_status, payment_observed_at, execution_truth')
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

function paymentLabel(matter: Pick<PreSessionMatter, 'payment_confirmed' | 'payment_settlement_status' | 'payment_observed_at'>) {
  if (matter.payment_confirmed) return 'Verified · scheduling unlocked';
  if (matter.payment_settlement_status === 'observed_pending' || matter.payment_observed_at) return 'Retainer submitted · Wise processing';
  return 'Awaiting verified payment';
}

function PreSessionMatterCard({ matter }: { matter: PreSessionMatter }) {
  const truth = matter.execution_truth ?? {};
  const notarialAct = String(truth.notarial_act ?? 'review_required');
  const paymentReady = matter.payment_confirmed === true;
  const executionReady = Boolean(truth.signer_location && truth.notary_jurisdiction && notarialAct !== 'review_required' && notarialAct !== 'unknown');

  return (
    <div className="rounded-lg border border-amber-700/30 bg-zinc-900 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] text-zinc-500">{matter.deal_id ?? matter.id}</p>
          <p className="mt-1 text-sm font-semibold text-white">{matter.client_name ?? 'Unknown client'}</p>
          <p className="text-xs text-zinc-500">{matter.email} · {matter.phone || 'phone missing'}</p>
        </div>
        <span className={`rounded-full border px-2 py-1 text-[10px] ${paymentReady && executionReady ? 'border-emerald-700/40 text-emerald-400' : 'border-amber-700/40 text-amber-400'}`}>
          {paymentReady && executionReady ? 'READY' : 'PREFLIGHT'}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-400">
        <p><span className="text-zinc-600">Document </span>{matter.document_type ?? '—'}</p>
        <p><span className="text-zinc-600">Destination </span>{matter.destination_country ?? '—'}</p>
        <p className="col-span-2"><span className="text-zinc-600">Payment </span>{paymentLabel(matter)}</p>
        <p className="col-span-2"><span className="text-zinc-600">Notarial act </span>{notarialAct === 'review_required' ? 'Operator review required' : notarialAct.replace(/_/g, ' ')}</p>
      </div>
      <Link
        href={`/dashboard/matters/${matter.id}/execution`}
        className="mt-3 inline-block rounded border border-amber-600/40 bg-amber-900/30 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-900/50"
      >
        Open RON Readiness
      </Link>
    </div>
  );
}

function MatterCard({ session }: { session: SessionRow }) {
  const deal = session.deals;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 transition-colors hover:border-amber-500/50">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs text-zinc-500">{session.notarization_id}</p>
          <p className="mt-0.5 text-sm font-semibold text-white">{deal?.client_name ?? 'Unknown Client'}</p>
          <p className="text-xs text-zinc-400">{deal?.email}</p>
        </div>
        <span className="whitespace-nowrap rounded-full border border-amber-500/30 bg-zinc-800 px-2 py-0.5 text-xs text-amber-400">
          {getClientStatusLabel(session.milano_ron_status)}
        </span>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-1 text-xs text-zinc-400">
        <p><span className="text-zinc-600">Doc </span>{deal?.document_type ?? '—'}</p>
        <p><span className="text-zinc-600">Destination </span>{deal?.destination_country ?? '—'}</p>
        <p className="col-span-2"><span className="text-zinc-600">Payment </span>{deal?.payment_confirmed ? 'Verified' : deal?.payment_settlement_status === 'observed_pending' ? 'Wise processing' : 'Not verified'}</p>
        <p><span className="text-zinc-600">Identity </span>{session.identity_status}</p>
        <p><span className="text-zinc-600">KBA </span>{session.kba_status}</p>
      </div>
      <Link href={`/dashboard/ron/${session.id}`} className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-xs text-white hover:bg-zinc-700">View Session</Link>
    </div>
  );
}

export default async function RONSigningRoomPage() {
  await requireDashboardAccess();
  const { sessions, preSessionMatters } = await getRONData();
  const grouped = QUEUE_DEFINITIONS.map((queue) => ({ ...queue, sessions: sessions.filter((s) => queue.statuses.includes(s.milano_ron_status)) }));
  const totalActive = sessions.filter((s) => !['RON_EXPIRED', 'RON_COMPLETED', 'SIGNED_DOCS_RETRIEVED', 'READY_FOR_APOSTILLE'].includes(s.milano_ron_status)).length;

  return (
    <div className="mx-auto max-w-screen-2xl p-6">
      <div className="mb-8">
        <div className="mb-1 flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-white">Signing Room</h1>
          <span className="rounded-full border border-amber-600/40 bg-amber-950 px-2 py-0.5 font-mono text-xs text-amber-400">RON-01</span>
        </div>
        <p className="text-sm text-zinc-400">Remote Online Notarization — existing BlueNotary integration</p>
        <p className="mt-1 text-xs text-zinc-600">{preSessionMatters.length} pre-session Matter{preSessionMatters.length !== 1 ? 's' : ''} · {totalActive} active session{totalActive !== 1 ? 's' : ''}</p>
      </div>

      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2 border-b border-amber-500 pb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">RON Matters · Before BlueNotary Session</h2>
          <span className="ml-auto text-xs text-zinc-500">{preSessionMatters.length}</span>
        </div>
        {preSessionMatters.length === 0 ? <p className="text-xs italic text-zinc-600">No pre-session RON Matters</p> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{preSessionMatters.map((matter) => <PreSessionMatterCard key={matter.id} matter={matter} />)}</div>}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4">
        {grouped.map((queue) => (
          <div key={queue.label}>
            <div className={`mb-3 flex items-center gap-2 border-b pb-2 ${queue.color}`}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">{queue.label}</h2>
              <span className="ml-auto text-xs text-zinc-500">{queue.sessions.length}</span>
            </div>
            {queue.sessions.length === 0 ? <p className="text-xs italic text-zinc-600">No sessions in this queue</p> : <div className="space-y-3">{queue.sessions.map((session) => <MatterCard key={session.id} session={session} />)}</div>}
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-amber-900/40 bg-zinc-900 p-3 text-xs text-zinc-500">
        <span className="font-semibold text-amber-600">Payment Gate: </span>
        RON session creation and provider document transfer require canonical <code>payment_confirmed=true</code>. Wise processing is displayed as submitted/processing and never unlocks scheduling.
      </div>
    </div>
  );
}
