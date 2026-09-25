"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const buttonClass =
  "min-h-10 rounded-lg border border-[#C6A65B]/40 px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#C6A65B] transition hover:bg-[#C6A65B]/10 disabled:opacity-40";

export function AuthorityReviewDecision({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function decide(decision: "APPROVED" | "REJECTED") {
    setSaving(true);
    try {
      const response = await fetch(`/api/dashboard/authority-reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, review_notes: notes }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Decision was not recorded.");
      toast.success("Review decision recorded.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Decision was not recorded.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-2 space-y-2">
      <textarea
        className="min-h-12 w-full rounded-lg border border-white/[0.09] bg-black/40 p-2 text-xs text-[#F6F1E6] focus:border-[#C6A65B]/45 focus:outline-none"
        placeholder="What was verified against the official source"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" className={buttonClass} disabled={saving} onClick={() => decide("APPROVED")}>Approve change</button>
        <button type="button" className={buttonClass} disabled={saving} onClick={() => decide("REJECTED")}>Reject change</button>
      </div>
    </div>
  );
}
