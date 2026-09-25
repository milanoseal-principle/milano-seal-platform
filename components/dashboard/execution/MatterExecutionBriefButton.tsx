"use client";

import { useState } from "react";
import { toast } from "sonner";

// GENERATE MATTER EXECUTION BRIEF — built server-side from canonical facts only.
export function MatterExecutionBriefButton({ matterId }: { matterId: string }) {
  const [brief, setBrief] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard/matters/${matterId}/execution-intelligence?brief=1`, { cache: "no-store" });
      const body = (await response.json().catch(() => ({}))) as { brief?: string; error?: string };
      if (!response.ok || !body.brief) throw new Error(body.error ?? "Brief was not generated.");
      setBrief(body.brief);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Brief was not generated.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className="min-h-10 rounded-lg border border-[#C6A65B]/40 px-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[#C6A65B] transition hover:bg-[#C6A65B]/10 disabled:opacity-40"
      >
        Generate Matter execution brief
      </button>
      {brief && (
        <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-white/[0.06] bg-black/40 p-3 font-mono text-[11px] leading-5 text-[#F6F1E6]/85">{brief}</pre>
      )}
    </div>
  );
}
