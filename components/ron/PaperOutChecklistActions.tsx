"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type PendingItem = { key: string; label: string; optional: boolean };
type ItemValue = "" | "confirmed" | "not_applicable";

const buttonClass =
  "min-h-10 rounded-lg border border-[#C6A65B]/40 px-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[#C6A65B] transition hover:bg-[#C6A65B]/10 disabled:opacity-40";

// Operator actions for the paper-out checklist. Every step is recorded by the
// server with an evidence-ledger entry; nothing here asserts DOS acceptance.
export function PaperOutChecklistActions({
  matterId,
  status,
  pending,
}: {
  matterId: string;
  status: "NOT_GENERATED" | "IN_PROGRESS" | "READY_FOR_APPROVAL" | "APPROVED";
  pending: PendingItem[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, ItemValue>>({});
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(action: "generate" | "confirm" | "approve") {
    setSaving(true);
    try {
      const items = Object.fromEntries(Object.entries(values).filter(([, value]) => value));
      const response = await fetch(`/api/dashboard/matters/${matterId}/paper-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, items, evidence_note: note }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!response.ok) throw new Error(body.message ?? body.error ?? "Paper-out step was not recorded.");
      toast.success(action === "generate" ? "Paper-out checklist generated." : "Paper-out step recorded.");
      setValues({});
      setNote("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Paper-out step was not recorded.");
    } finally {
      setSaving(false);
    }
  }

  if (status === "APPROVED") return null;
  if (status === "NOT_GENERATED") {
    return (
      <div className="mt-4">
        <button type="button" className={buttonClass} disabled={saving} onClick={() => submit("generate")}>
          Generate paper-out checklist
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-white/[0.06] bg-black/20 p-3">
      {pending.map((item) => (
        <label key={item.key} className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/60">
          {item.label}
          <select
            className="min-h-10 rounded-lg border border-white/[0.09] bg-black/40 px-3 text-xs text-[#F6F1E6] focus:border-[#C6A65B]/45 focus:outline-none"
            value={values[item.key] ?? ""}
            onChange={(event) => setValues((current) => ({ ...current, [item.key]: event.target.value as ItemValue }))}
          >
            <option value="">Pending</option>
            <option value="confirmed">Confirmed</option>
            {item.optional && <option value="not_applicable">Not applicable</option>}
          </select>
        </label>
      ))}
      <label className="block space-y-1 text-[11px] text-white/45">
        Evidence basis
        <textarea
          className="min-h-16 w-full rounded-lg border border-white/[0.09] bg-black/40 p-3 text-xs text-[#F6F1E6] focus:border-[#C6A65B]/45 focus:outline-none"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {pending.length > 0 && (
          <button type="button" className={buttonClass} disabled={saving} onClick={() => submit("confirm")}>
            Record confirmations
          </button>
        )}
        {status === "READY_FOR_APPROVAL" && (
          <button type="button" className={buttonClass} disabled={saving} onClick={() => submit("approve")}>
            Record operator approval
          </button>
        )}
      </div>
    </div>
  );
}
