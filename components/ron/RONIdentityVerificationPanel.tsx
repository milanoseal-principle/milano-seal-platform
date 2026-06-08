'use client';

interface SignerVerification {
  id: string;
  name: string;
  email: string;
  identity_status: string;
  kba_status: string;
  biometric_status: string;
  joined_at?: string | null;
  left_at?: string | null;
  completed_at?: string | null;
}

interface Props {
  signers: SignerVerification[];
  className?: string;
}

function StatusDot({ status }: { status: string }) {
  const isPass = status === 'PASSED';
  const isFail = status === 'FAILED';
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
        isPass
          ? 'bg-green-950 text-green-400 border border-green-700/40'
          : isFail
          ? 'bg-red-950 text-red-400 border border-red-700/40'
          : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isPass ? 'bg-green-400' : isFail ? 'bg-red-400' : 'bg-zinc-500'
        }`}
        aria-hidden="true"
      />
      {status}
    </span>
  );
}

export function RONIdentityVerificationPanel({ signers, className = '' }: Props) {
  if (signers.length === 0) {
    return (
      <div className={`bg-zinc-900 border border-zinc-800 rounded-lg p-4 ${className}`}>
        <p className="text-xs text-zinc-500">No signers recorded</p>
      </div>
    );
  }

  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-lg p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-zinc-300 mb-4">Identity Verification</h3>
      <div className="space-y-4">
        {signers.map((signer) => {
          const hasFailure =
            signer.identity_status === 'FAILED' ||
            signer.kba_status === 'FAILED' ||
            signer.biometric_status === 'FAILED';

          return (
            <div
              key={signer.id}
              className={`border rounded p-3 ${
                hasFailure ? 'border-red-800/60 bg-red-950/10' : 'border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-medium text-white">{signer.name}</p>
                  <p className="text-[10px] text-zinc-500">{signer.email}</p>
                </div>
                {hasFailure && (
                  <span className="text-xs text-red-400 font-semibold">Needs Attention</span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[10px] text-zinc-600 mb-1">Photo ID</p>
                  <StatusDot status={signer.identity_status} />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-600 mb-1">KBA</p>
                  <StatusDot status={signer.kba_status} />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-600 mb-1">Biometric</p>
                  <StatusDot status={signer.biometric_status} />
                </div>
              </div>

              {/* Session timeline */}
              <div className="flex gap-3 mt-2 text-[10px] text-zinc-600">
                {signer.joined_at && (
                  <span>Joined: {new Date(signer.joined_at).toLocaleTimeString()}</span>
                )}
                {signer.left_at && (
                  <span>Left: {new Date(signer.left_at).toLocaleTimeString()}</span>
                )}
                {signer.completed_at && (
                  <span className="text-green-600">
                    Completed: {new Date(signer.completed_at).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
