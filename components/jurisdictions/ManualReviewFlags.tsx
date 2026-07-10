"use client";

import type { ManualReviewFlag } from "@/lib/jurisdictions/types";
import { VERIFY_BEFORE_EXECUTION_CAPTION } from "@/lib/jurisdictions/jurisdictionSafety";

const SEVERITY_STYLE: Record<string, string> = {
  blocker: "border-red-400/30 bg-red-400/5 text-red-200",
  warning: "border-amber-400/30 bg-amber-400/5 text-amber-200",
  info: "border-stone-400/20 bg-stone-400/5 text-stone-300",
};

export function ManualReviewFlags({ flags }: { flags: ManualReviewFlag[] }) {
  return (
    <section className="rounded-2xl border border-amber-300/25 bg-black/50 p-5">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
        Manual Review Flags
      </h2>
      <p className="mb-4 text-[11px] text-stone-500">
        {VERIFY_BEFORE_EXECUTION_CAPTION}
      </p>
      {flags.length === 0 ? (
        <p className="text-xs text-stone-400">
          No flags on the current selection. Records still require verification before execution.
        </p>
      ) : (
        <ul className="space-y-2 text-xs">
          {flags.map((f, i) => (
            <li
              key={`${f.code}-${f.subject ?? ""}-${i}`}
              className={`rounded-lg border px-3 py-2 ${SEVERITY_STYLE[f.severity]}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wide">
                  {f.code}
                </span>
                {f.subject && (
                  <span className="text-[10px] opacity-70">{f.subject}</span>
                )}
              </div>
              <div className="mt-1">{f.message}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
