"use client";
import { useState } from 'react';

import type { MilanoRONStatus } from '@/lib/bluenotary/types';

interface GateCondition {
  met: boolean;
  reason?: string;
}

interface Props {
  sessionId: string;
  matterId: string;
  currentStatus: MilanoRONStatus;
  gates: {
    paymentConfirmed: GateCondition;
    sessionExists: GateCondition;
    sessionNotExpired: GateCondition;
    signerComplete: GateCondition;
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

export function RONSessionControlPanel({
  sessionId,
  gates,
  currentStatus,
  onAction,
}: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  const canCreateSession =
    gates.paymentConfirmed.met && gates.signerComplete.met;

  const canReleaseLink =
    gates.paymentConfirmed.met &&
    gates.sessionExists.met &&
    gates.sessionNotExpired.met;

  const canReschedule =
    gates.sessionExists.met && gates.sessionNotExpired.met;

  const canExpire =
    gates.sessionExists.met && currentStatus !== 'RON_EXPIRED';

  const canRetrieveDocs =
    gates.sessionCompleted.met && gates.sessionExists.met;

  async function handleAction(action: string, endpoint: string, method = 'POST') {
    setLoading(action);
    try {
      const res = await fetch(endpoint, { method });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Error: ${data.error ?? 'Unknown error'}`);
        return;
      }
      onAction?.(action);
    } catch {
      alert('Request failed');
    } finally {
      setLoading(null);
    }
  }

  const base = `/api/dashboard/ron/sessions/${sessionId}`;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-zinc-300 mb-3">Operator Actions</h3>
      <div className="flex flex-wrap gap-2">
        <ActionButton
          label={loading === 'retrieve-docs' ? 'Retrieving...' : 'Retrieve Signed Docs'}
          disabled={!canRetrieveDocs || loading !== null}
          disabledReason={!canRetrieveDocs ? 'Session must be completed' : undefined}
          variant="primary"
          onClick={() => handleAction('retrieve-docs', `${base}/signed-documents`)}
        />
        <ActionButton
          label={loading === 'reschedule' ? 'Processing...' : 'Reschedule'}
          disabled={!canReschedule || loading !== null}
          disabledReason={
            !gates.sessionExists.met
              ? 'No active session'
              : !gates.sessionNotExpired.met
              ? 'Session has expired'
              : undefined
          }
          onClick={() => {
            const timing = prompt('Enter new session timing (ISO 8601):');
            const reason = prompt('Enter reason for rescheduling:');
            if (timing && reason) {
              handleAction('reschedule', `${base}/reschedule`, 'PUT');
            }
          }}
        />
        <ActionButton
          label={loading === 'expire' ? 'Expiring...' : 'Expire Session'}
          disabled={!canExpire || loading !== null}
          disabledReason={!canExpire ? 'Cannot expire this session' : undefined}
          variant="danger"
          onClick={() => {
            const reason = prompt('Enter reason for expiring this session:');
            if (reason) {
              handleAction('expire', `${base}/expire`, 'PUT');
            }
          }}
        />
        <ActionButton
          label={loading === 'create' ? 'Creating...' : 'Create RON Session'}
          disabled={!canCreateSession || loading !== null}
          disabledReason={
            !gates.paymentConfirmed.met
              ? 'Payment not confirmed'
              : !gates.signerComplete.met
              ? 'Signer info incomplete'
              : undefined
          }
          variant="primary"
          onClick={() => handleAction('create', '/api/dashboard/ron/sessions')}
        />
      </div>
    </div>
  );
}
