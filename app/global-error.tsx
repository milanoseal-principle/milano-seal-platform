"use client";

import { useEffect } from "react";
import { MilanoProductState, milanoStateActionClass } from "@/components/system/MilanoProductState";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[The Milano Seal] Root error:", error.message, error.digest ?? "");
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-[100dvh] bg-[#060608] text-[#F4F1EA] antialiased">
        <MilanoProductState
          eyebrow="The Milano Seal™ · System recovery"
          title="The secure workspace needs to be reloaded"
          description="The application shell could not complete loading. No matter should be intentionally advanced from this screen. Reload the workspace to restore the current route."
          tone="danger"
          actions={
            <button
              type="button"
              onClick={reset}
              className={`${milanoStateActionClass} border-[#C6A65B]/40 bg-[#C6A65B]/[0.08] text-[#F4F1EA] hover:border-[#C6A65B]/65 hover:bg-[#C6A65B]/[0.12]`}
            >
              Reload workspace
            </button>
          }
        >
          {error.digest ? (
            <div className="rounded-lg border border-white/[0.055] bg-black/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white/30">
              Recovery reference · {error.digest}
            </div>
          ) : null}
        </MilanoProductState>
      </body>
    </html>
  );
}
