'use client';

import type { MilanoRONStatus } from '@/lib/bluenotary/types';

const RAIL_STEPS: { status: MilanoRONStatus; label: string }[] = [
  { status: 'READY_FOR_RON',          label: 'Ready' },
  { status: 'RON_SESSION_CREATED',    label: 'Session Created' },
  { status: 'SIGNING_LINK_RELEASED',  label: 'Link Released' },
  { status: 'KBA_PASSED',             label: 'KBA Passed' },
  { status: 'SESSION_STARTED',        label: 'In Session' },
  { status: 'RON_COMPLETED',          label: 'Completed' },
  { status: 'SIGNED_DOCS_RETRIEVED',  label: 'Docs Secured' },
  { status: 'READY_FOR_APOSTILLE',    label: 'Apostille Ready' },
];

const STATUS_ORDER: MilanoRONStatus[] = [
  'RON_DRAFT',
  'READY_FOR_RON',
  'RON_SESSION_CREATED',
  'SIGNER_INVITED',
  'SIGNING_LINK_RELEASED',
  'IDENTITY_STARTED',
  'PHOTO_ID_PASSED',
  'BIOMETRICS_PASSED',
  'KBA_STARTED',
  'KBA_PASSED',
  'NOTARY_ACCEPTED',
  'SESSION_JOINED',
  'SESSION_STARTED',
  'SESSION_PROCESSING',
  'RON_COMPLETED',
  'SIGNED_DOCS_RETRIEVED',
  'READY_FOR_APOSTILLE',
];

function getStatusIndex(status: MilanoRONStatus): number {
  return STATUS_ORDER.indexOf(status);
}

interface Props {
  currentStatus: MilanoRONStatus;
  className?: string;
}

export function RONStatusRail({ currentStatus, className = '' }: Props) {
  const currentIndex = getStatusIndex(currentStatus);
  const isExpired = currentStatus === 'RON_EXPIRED';
  const isFailure =
    currentStatus === 'KBA_FAILED' ||
    currentStatus === 'PHOTO_ID_FAILED' ||
    currentStatus === 'RON_REVIEW_REQUIRED';

  return (
    <div
      className={`w-full ${className}`}
      aria-label="RON session progress"
      role="progressbar"
      aria-valuetext={currentStatus}
    >
      <ol className="flex items-center w-full overflow-x-auto gap-0">
        {RAIL_STEPS.map((step, i) => {
          const stepIndex = getStatusIndex(step.status);
          const isCompleted = !isExpired && !isFailure && stepIndex <= currentIndex;
          const isActive = step.status === currentStatus;
          const isFailed = isFailure && isActive;

          return (
            <li key={step.status} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center flex-1">
                {/* Node */}
                <div
                  className={[
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] transition-all duration-300',
                    // Reduced-motion: no animation classes that require motion
                    isExpired
                      ? 'border-zinc-600 bg-zinc-800 text-zinc-600'
                      : isFailed
                      ? 'border-red-500 bg-red-950 text-red-400 ring-2 ring-red-500/30'
                      : isActive
                      ? 'border-amber-400 bg-amber-950 text-amber-400 ring-2 ring-amber-400/30 motion-safe:animate-pulse'
                      : isCompleted
                      ? 'border-amber-500 bg-amber-950/60 text-amber-400'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-600',
                  ].join(' ')}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isCompleted && !isActive ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : isFailed ? (
                    <span aria-hidden="true">!</span>
                  ) : (
                    <span aria-hidden="true">{i + 1}</span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-[9px] mt-1 text-center leading-tight max-w-[56px] ${
                    isActive
                      ? isFailed
                        ? 'text-red-400 font-semibold'
                        : 'text-amber-400 font-semibold'
                      : isCompleted
                      ? 'text-zinc-400'
                      : 'text-zinc-600'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector */}
              {i < RAIL_STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-1 transition-colors duration-300 ${
                    isExpired
                      ? 'bg-zinc-800'
                      : stepIndex < currentIndex
                      ? 'bg-amber-700'
                      : 'bg-zinc-800'
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>

      {isExpired && (
        <p className="text-xs text-zinc-500 text-center mt-2">Session expired</p>
      )}
      {isFailure && (
        <p className="text-xs text-red-400 text-center mt-2">Verification issue — coordinator review required</p>
      )}
    </div>
  );
}
