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
    default: 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-600',
    primary: 'bg-amber-900/40 hover:bg-amber-900/60 text-amber-400 border-amber-600/40',
    danger: 'bg-red-950/40 hover:bg-red-950/60 text-red-400 border-red-600/40',
  };
  return (
    <div className="relative group">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`text-xs px-3 py-1.5 rounded border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${variantStyles[variant]}`}
        title={disabled && disabledReason ? disabledReason : undefined}
        aria-disabled={disabled}
      >
        {label}
      </button>
      {disabled && disabledReason && (
        <div className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-[10px] text-zinc-400 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
          {disabledReason}
        </div>
      )}
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
        alert(`Error: ${data.error ?? 'Unknown error'}`);
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
  const createReason = !gates.schedulingAuthorized.met
    ? gates.schedulingAuthorized.reason ?? 'Scheduling authority required'
    : !gates.ronTruthComplete.met
      ? gates.ronTruthComplete.reason ?? 'RON execution truth incomplete'
      : !gates.signerComplete.met
        ? gates.signerComplete.reason ?? 'Signer info incomplete'
        : !gates.documentReady.met
          ? gates.documentReady.reason ?? 'Matter document required'
          : gates.sessionExists.met
            ? 'An active RON session already exists'
            : undefined;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-zinc-300 mb-1">BlueNotary Operator Actions</h3>
      <p className="mb-3 text-[11px] text-zinc-500">Same Matter · canonical scheduling gate · verified settlement still controls signer release.</p>
      <div className="flex flex-wrap gap-2">
        {!gates.sessionExists.met && (
          <ActionButton
            label={loading === 'create' ? 'Creating...' : 'Create BlueNotary RON Session'}
            disabled={!canCreateSession || loading !== null}
            disabledReason={createReason}
            variant="primary"
            onClick={() => handleAction('create', '/api/dashboard/ron/sessions', 'POST', { matter_id: matterId })}
          />
        )}
        {gates.sessionExists.met && (
          <ActionButton
            label={loading === 'upload-package' ? 'Uploading...' : 'Upload Matter Package'}
            disabled={!canUploadPackage || loading !== null}
            disabledReason={!gates.schedulingAuthorized.met ? gates.schedulingAuthorized.reason ?? 'Scheduling authority required' : documentIds.length === 0 ? 'No pending Matter documents' : undefined}
            variant="primary"
            onClick={uploadPackage}
          />
        )}
        {base && (
          <ActionButton
            label={loading === 'retrieve-docs' ? 'Retrieving...' : 'Retrieve Signed Docs'}
            disabled={!canRetrieveDocs || loading !== null}
            disabledReason={!canRetrieveDocs ? 'Session must be completed' : undefined}
            variant="primary"
            onClick={() => handleAction('retrieve-docs', `${base}/signed-documents`)}
          />
        )}
        {base && (
          <ActionButton
            label={loading === 'reschedule' ? 'Processing...' : 'Reschedule'}
            disabled={!canReschedule || loading !== null}
            disabledReason={!gates.sessionExists.met ? 'No active session' : !gates.sessionNotExpired.met ? 'Session has expired' : undefined}
            onClick={() => {
              const timing = prompt('Enter new session timing (ISO 8601):');
              const reason = prompt('Enter reason for rescheduling:');
              if (timing && reason) handleAction('reschedule', `${base}/reschedule`, 'PUT', { session_timing: timing, reason });
            }}
          />
        )}
        {base && (
          <ActionButton
            label={loading === 'expire' ? 'Expiring...' : 'Expire Session'}
            disabled={!canExpire || loading !== null}
            disabledReason={!canExpire ? 'Cannot expire this session' : undefined}
            variant="danger"
            onClick={() => {
              const reason = prompt('Enter reason for expiring this session:');
              if (reason) handleAction('expire', `${base}/expire`, 'PUT', { reason });
            }}
          />
        )}
      </div>
    </div>
  );
}
