'use client';

import type { PortalRONView } from '@/lib/bluenotary/types';

interface Props {
  projection: PortalRONView;
  className?: string;
}

export function PortalRONStatusCard({ projection, className = '' }: Props) {
  const {
    client_label,
    payment_confirmed,
    session_active,
    signing_url,
    coordinator_message,
    identity_status,
    kba_status,
  } = projection;

  const showSigningLink =
    signing_url &&
    payment_confirmed &&
    session_active;

  return (
    <div
      className={`bg-zinc-900 border border-zinc-800 rounded-xl p-6 ${className}`}
      role="region"
      aria-label="Notarization session status"
    >
      {/* Status header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Session Status</p>
          <p className="text-lg font-semibold text-white">{client_label}</p>
        </div>
        <div
          className={`w-3 h-3 rounded-full mt-1 ${
            session_active
              ? 'bg-amber-400 motion-safe:animate-pulse'
              : 'bg-zinc-600'
          }`}
          aria-hidden="true"
        />
      </div>

      {/* Payment confirmed indicator */}
      <div className="flex items-center gap-2 mb-4 text-xs">
        <span
          className={`w-4 h-4 rounded-full flex items-center justify-center ${
            payment_confirmed ? 'bg-green-900 text-green-400' : 'bg-zinc-800 text-zinc-600'
          }`}
          aria-hidden="true"
        >
          {payment_confirmed ? (
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 block" />
          )}
        </span>
        <span className={payment_confirmed ? 'text-zinc-400' : 'text-zinc-600'}>
          Payment confirmed
        </span>
      </div>

      {/* Verification status — client-safe labels only */}
      {(identity_status || kba_status) && (
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          {identity_status && (
            <div className="bg-zinc-800 rounded p-2">
              <p className="text-zinc-600 mb-0.5">Identity Check</p>
              <p className={
                identity_status === 'PASSED' ? 'text-green-400' :
                identity_status === 'FAILED' ? 'text-red-400' :
                'text-zinc-400'
              }>
                {identity_status === 'PASSED' ? 'Verified' :
                 identity_status === 'FAILED' ? 'Needs Attention' :
                 'In Progress'}
              </p>
            </div>
          )}
          {kba_status && (
            <div className="bg-zinc-800 rounded p-2">
              <p className="text-zinc-600 mb-0.5">Security Questions</p>
              <p className={
                kba_status === 'PASSED' ? 'text-green-400' :
                kba_status === 'FAILED' ? 'text-red-400' :
                'text-zinc-400'
              }>
                {kba_status === 'PASSED' ? 'Passed' :
                 kba_status === 'FAILED' ? 'Needs Attention' :
                 'In Progress'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Signing link — only when all gate conditions met */}
      {showSigningLink ? (
        <a
          href={signing_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-semibold text-sm transition-colors mb-4"
        >
          Join Notarization Session
        </a>
      ) : (
        <div className="w-full py-2.5 px-4 rounded-lg bg-zinc-800 text-zinc-500 font-medium text-sm text-center mb-4 cursor-not-allowed select-none">
          Session link not yet available
        </div>
      )}

      {/* Coordinator message */}
      {coordinator_message && (
        <p className="text-xs text-zinc-500 leading-relaxed border-t border-zinc-800 pt-3">
          {coordinator_message}
        </p>
      )}

      {/* NEVER shows: raw BN status, base64, credentials, internal notes */}
    </div>
  );
}
