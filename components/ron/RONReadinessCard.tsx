'use client';

interface ReadinessItem {
  label: string;
  complete: boolean;
  detail?: string;
}

interface Props {
  checks: ReadinessItem[];
  className?: string;
}

export function RONReadinessCard({ checks, className = '' }: Props) {
  const allComplete = checks.every((c) => c.complete);

  return (
    <div
      className={`bg-zinc-900 border rounded-lg p-4 ${
        allComplete ? 'border-amber-600/40' : 'border-zinc-700'
      } ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-zinc-300">RON Readiness</h3>
        {allComplete && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-600/40">
            Ready
          </span>
        )}
      </div>

      <ul className="space-y-2">
        {checks.map((item) => (
          <li key={item.label} className="flex items-start gap-2 text-xs">
            <span
              className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                item.complete
                  ? 'bg-amber-900/60 text-amber-400'
                  : 'bg-zinc-800 text-zinc-600'
              }`}
              aria-hidden="true"
            >
              {item.complete ? (
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 block" />
              )}
            </span>
            <div>
              <span className={item.complete ? 'text-zinc-300' : 'text-zinc-500'}>
                {item.label}
              </span>
              {item.detail && (
                <p className="text-zinc-600 text-[10px] mt-0.5">{item.detail}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
