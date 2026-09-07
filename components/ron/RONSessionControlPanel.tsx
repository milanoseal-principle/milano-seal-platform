"use client";

import { useState } from 'react';
import type { MilanoRONStatus } from '@/lib/bluenotary/types';

interface GateCondition { met: boolean; reason?: string }

interface Props {
  sessionId?: string | null;
  matterId: string;
  currentStatus?: MilanoRONStatus | null;
  documentIds?: string[];
  gates: {
    schedulingAuthorized: GateCondition;
    sessionExists: GateCondition;
    sessionNotExpired: GateCondition;
    signerComplete: GateCondition;
    ronTruthComplete: GateCondition;
    documentReady: GateCondition;
    sessionCompleted: GateCondition;
  };
  onAction?: (action: string) => void;
}

interface ActionButtonProps {
  label: string;
  disabled: boolean;
  disabledReason?: string;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'primary';
}

function ActionButton({ label, disabled, disabledReason, onClick, variant = 'default' }: ActionButtonProps) {
  const variantStyles = {
    default: 'border-zinc-700 bg-zinc-900 text-white hover:border-zinc-600 hover:bg-zinc-800',
    primary: 'border-amber-500/40 bg-gradient-to-r from-amber-950/70 to-yellow-950/40 text-amber-200 hover:border-amber-400/60 hover:from-amber-900/70 hover:to-yellow-900/40',
    danger: 'border-red-700/40 bg-red-950/30 text-red-300 hover:border-red-600/60 hover:bg-red-950/50',
  };

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`min-h-11 w-full rounded-xl border px-4 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto ${variantStyles[variant]}`}
        title={disabled && disabledReason ? disabledReason : undefined}
        aria-disabled={disabled}
      >
        {label}
      </button>
      {disabled && disabledReason && (
        <p className="mt-1.5 max-w-xs text-[10px] leading-4 text-amber-300/70 sm:hidden">{disabledReason}</p>
      )}
    </div>
  );
}

function GateRow({ label, condition }: { label: string; condition: GateCondition }) {
  return (
    <div className={`rounded-xl border p-3 ${condition.met ? 'border-emerald-800/30 bg-emerald-950/10' : 'border-amber-800/30 bg-amber-950/10'}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-zinc-300">{label}</span>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${condition.met ? 'border-emerald-700/40 text-emerald-300' : 'border-amber-700/40 text-amber-300'}`}>
          {condition.met ? 'READY' : 'BLOCKED'}
        </span>
      </div>
      {!condition.met && condition.reason && <p className="mt-1.5 text-[11px] leading-4 text-zinc-500">{condition.reason}</p>}
    </div>
  );
}

export function RONSessionControlPanel({ sessionId, matterId, gates, currentStatus, documentIds = [], onAction }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  const canCreateSession =
    !gates.sessionExists.met &&
    gates.schedulingAuthorized.met &&
    gates.signerComplete.met &&
    gates.ronTruthComplete.met &&
    gates.documentReady.met;
  const canReschedule = gates.sessionExists.met && gates.sessionNotExpired.met;
  const canExpire = gates.sessionExists.met && currentStatus !== 'RON_EXPIRED';
  const canRetrieveDocs = gates.sessionCompleted.met && gates.sessionExists.met;
  const canUploadPackage = gates.sessionExists.met && gates.schedulingAuthorized.met && documentIds.length > 0;
  const canAdvanceToApostille = gates.sessionExists.met && currentStatus === 'SIGNED_DOCS_RETRIEVED';

  async function handleAction(action: string, endpoint: string, method = 'POST', body?: Record<string, unknown>) {
    setLoading(action);
    try {
      const res = await fetch(endpoint, {
        method,
        headers: body ? { 'content-type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Error: ${data.error ?? data.message ?? data.code ?? 'Unknown error'}`);
        return;
      }
      onAction?.(action);
      if (!onAction) window.location.reload();
    } catch {
      alert('Request failed');
    } finally {
      setLoading(null);
    }
  }

  async function uploadPackage() {
    if (!sessionId) return;
    setLoading('upload-package');
    try {
      for (const documentId of documentIds) {
        const res = await fetch(`/api/dashboard/ron/sessions/${sessionId}/documents`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ document_id: documentId }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          alert(`Error: ${data.error ?? 'Document upload failed'}`);
          return;
        }
      }
      onAction?.('upload-package');
      if (!onAction) window.location.reload();
    } catch {
      alert('Request failed');
    } finally {
      setLoading(null);
    }
  }

  const base = sessionId ? `/api/dashboard/ron/sessions/${sessionId}` : null;
  const blockers = [
    ['Scheduling authority', gates.schedulingAuthorized] as const,
    ['Signer information', gates.signerComplete] as const,
    ['RON execution facts', gates.ronTruthComplete] as const,
    ['Matter document package', gates.documentReady] as const,
  ].filter(([, condition]) => !condition.met);

  const createReason = blockers.length > 0
    ? blockers.map(([label, condition]) => `${label}: ${condition.reason ?? 'required'}`).join(' · ')
    : gates.sessionExists.met
      ? 'An active RON session already exists'
      : undefined;

  return (
    <section className="overflow-hidden rounded-2xl border border-amber-900/30 bg-gradient-to-br from-zinc-950 via-zinc-950 to-amber-950/10 shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
      <div className="border-b border-white/5 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-amber-500/80">BlueNotary · Operator Control</p>
            <h3 className="mt-1 text-base font-semibold text-white">RON Session Readiness</h3>
            <p className="mt-1 text-xs leading-5 text-zinc-500">Same Matter · Wise submission may reserve scheduling · provider evidence governs signing-link release · final release remains separately settlement-gated.</p>
          </div>
          <span className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide ${canCreateSession ? 'border-emerald-600/50 bg-emerald-950/40 text-emerald-300' : 'border-amber-600/40 bg-amber-950/30 text-amber-300'}`}>
            {gates.sessionExists.met ? 'SESSION EXISTS' : canCreateSession ? 'READY TO CREATE' : `${blockers.length} BLOCKER${blockers.length === 1 ? '' : 'S'}`}
          </span>
        </div>
      </div>

      {!gates.sessionExists.met && (
        <div className="grid gap-2 border-b border-white/5 p-4 sm:grid-cols-2 sm:p-5">
          <GateRow label="Scheduling authority" condition={gates.schedulingAuthorized} />
          <GateRow label="Signer information" condition={gates.signerComplete} />
          <GateRow label="RON execution facts" condition={gates.ronTruthComplete} />
          <GateRow label="Matter document package" condition={gates.documentReady} />
        </div>
      )}

      {!gates.sessionExists.met && blockers.length > 0 && (
        <div className="border-b border-amber-900/20 bg-amber-950/10 px-4 py-3 sm:px-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-amber-300">Resolve these before creating the session</p>
          <ul className="mt-2 space-y-1.5">
            {blockers.map(([label, condition]) => (
              <li key={label} className="flex gap-2 text-xs leading-5 text-zinc-300">
                <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                <span><strong className="font-medium text-zinc-200">{label}:</strong> {condition.reason ?? 'Required before BlueNotary session creation.'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {!gates.sessionExists.met && (
            <ActionButton
              label={loading === 'create' ? 'Creating BlueNotary Session…' : 'Create BlueNotary RON Session'}
              disabled={!canCreateSession || loading !== null}
              disabledReason={createReason}
              variant="primary"
              onClick={() => handleAction('create', '/api/dashboard/ron/sessions', 'POST', { matter_id: matterId })}
            />
          )}
          {gates.sessionExists.met && (
            <ActionButton
              label={loading === 'upload-package' ? 'Uploading Matter Package…' : 'Upload Matter Package'}
              disabled={!canUploadPackage || loading !== null}
              disabledReason={!gates.schedulingAuthorized.met ? gates.schedulingAuthorized.reason ?? 'Scheduling authority required' : documentIds.length === 0 ? 'No pending Matter documents' : undefined}
              variant="primary"
              onClick={uploadPackage}
            />
          )}
          {base && (
            <ActionButton
              label={loading === 'retrieve-docs' ? 'Retrieving Signed Docs…' : 'Retrieve Signed Docs'}
              disabled={!canRetrieveDocs || loading !== null}
              disabledReason={!canRetrieveDocs ? 'Session must be completed before signed documents can be retrieved.' : undefined}
              variant="primary"
              onClick={() => handleAction('retrieve-docs', `${base}/signed-documents`)}
            />
          )}
          {base && currentStatus === 'SIGNED_DOCS_RETRIEVED' && (
            <ActionButton
              label={loading === 'advance-apostille' ? 'Advancing Matter…' : 'Approve Apostille QA & Advance Matter'}
              disabled={!canAdvanceToApostille || loading !== null}
              disabledReason={!canAdvanceToApostille ? 'Signed documents must be secured before Apostille QA approval.' : undefined}
              variant="primary"
              onClick={() => handleAction('advance-apostille', `${base}/advance-to-apostille`)}
            />
          )}
          {base && (
            <ActionButton
              label={loading === 'reschedule' ? 'Processing…' : 'Reschedule Session'}
              disabled={!canReschedule || loading !== null}
              disabledReason={!gates.sessionExists.met ? 'No active session.' : !gates.sessionNotExpired.met ? 'Session has expired.' : undefined}
              onClick={() => {
                const timing = prompt('Enter new session timing (ISO 8601):');
                const reason = prompt('Enter reason for rescheduling:');
                if (timing && reason) handleAction('reschedule', `${base}/reschedule`, 'PUT', { session_timing: timing, reason });
              }}
            />
          )}
          {base && (
            <ActionButton
              label={loading === 'expire' ? 'Expiring…' : 'Expire Session'}
              disabled={!canExpire || loading !== null}
              disabledReason={!canExpire ? 'This session cannot be expired from its current state.' : undefined}
              variant="danger"
              onClick={() => {
                const reason = prompt('Enter reason for expiring this session:');
                if (reason) handleAction('expire', `${base}/expire`, 'PUT', { reason });
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}
