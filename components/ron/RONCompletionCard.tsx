'use client';

interface Props {
  sessionId: string;
  matterId: string;
  signerCount: number;
  documentCount: number;
  completedAt?: string | null;
  className?: string;
}

export function RONCompletionCard({
  sessionId,
  matterId,
  signerCount,
  documentCount,
  completedAt,
  className = '',
}: Props) {
  return (
    <div
      className={`bg-amber-950/20 border border-amber-600/40 rounded-lg p-5 ${className}`}
      role="status"
      aria-label="RON session completed"
    >
      {/* Gold seal icon */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-full bg-amber-900/60 border-2 border-amber-500 flex items-center justify-center"
          aria-hidden="true"
        >
          <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-amber-400">Notarization Complete</h3>
          {completedAt && (
            <p className="text-xs text-zinc-500">
              {new Date(completedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 text-xs mb-4">
        <div className="bg-zinc-900/60 rounded p-2">
          <p className="text-zinc-600 mb-0.5">Signers</p>
          <p className="text-white font-semibold">{signerCount}</p>
        </div>
        <div className="bg-zinc-900/60 rounded p-2">
          <p className="text-zinc-600 mb-0.5">Documents</p>
          <p className="text-white font-semibold">{documentCount}</p>
        </div>
      </div>

      {/* Next action — operator-only, NO auto-release */}
      <div className="border-t border-amber-700/30 pt-3">
        <p className="text-xs font-semibold text-zinc-300 mb-1">Next Step</p>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Apostille QA Review is required before this matter can advance.
          Signed documents are secured in the vault. The coordinator must
          review and approve before courier dispatch.
        </p>
        <p className="text-[10px] text-zinc-600 mt-2 font-mono">
          Session: {sessionId} &bull; Matter: {matterId}
        </p>
      </div>

      {/* Explicit: NO auto-advance button */}
    </div>
  );
}
