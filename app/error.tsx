"use client";

import { useEffect } from "react";
import Link from "next/link";
import { MilanoProductState, milanoStateActionClass } from "@/components/system/MilanoProductState";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[The Milano Seal] Route error:", error.message, error.digest ?? "");
  }, [error]);

  return (
    <main className="min-h-[100dvh] bg-[#060608] text-[#F4F1EA]">
      <MilanoProductState
        eyebrow="The Milano Seal™ · Recovery"
        title="This view could not be completed"
        description="Your current matter context has not been intentionally advanced. Retry this view first, or return to a secure entry point and continue from there."
        tone="danger"
        actions={
          <>
            <button
              type="button"
              onClick={reset}
              className={`${milanoStateActionClass} border-[#C6A65B]/40 bg-[#C6A65B]/[0.08] text-[#F4F1EA] hover:border-[#C6A65B]/65 hover:bg-[#C6A65B]/[0.12]`}
            >
              Retry view
            </button>
            <Link
              href="/secure-portal"
              className={`${milanoStateActionClass} border-white/10 bg-white/[0.025] text-white/62 hover:border-white/20 hover:bg-white/[0.045] hover:text-white/88`}
            >
              Open secure portal
            </Link>
          </>
        }
      >
        {error.digest ? (
          <div className="rounded-lg border border-white/[0.055] bg-black/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white/30">
            Recovery reference · {error.digest}
          </div>
        ) : null}
      </MilanoProductState>
    </main>
  );
}
