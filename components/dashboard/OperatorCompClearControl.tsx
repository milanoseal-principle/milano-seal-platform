"use client";
import { useState } from 'react';


// Operator Comp-Clear Control — UI only. Resolves the entered discount code to
// its id using the EXISTING dashboard discounts list, then calls the EXISTING
// comp-clear endpoint. No new backend, no new payment logic, no hardcoded codes.

interface DiscountCodeRow {
  id: string;
  code: string;
}

const COMP_CLEAR_ENDPOINT = "/api/admin/discounts/comp-clear";
const DEFAULT_REASON = "Operator-approved internal adjustment";

export function OperatorCompClearControl() {
  const [matterId, setMatterId] = useState("");
  const [code, setCode] = useState("");
  const [reason, setReason] = useState(DEFAULT_REASON);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resolveCodeId(entered: string): Promise<string> {
    const res = await fetch("/api/dashboard/discounts");
    const json = (await res.json()) as { data?: DiscountCodeRow[]; error?: string };
    if (!res.ok) throw new Error(json.error ?? "Could not load discount codes.");
    const match = (json.data ?? []).find(
      (c) => c.code.toUpperCase() === entered.trim().toUpperCase(),
    );
    if (!match) throw new Error(`Discount code "${entered.trim()}" not found.`);
    return match.id;
  }

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    if (!matterId.trim() || !code.trim()) {
      setError("Adjustment failed: Matter ID and Discount Code are required.");
      return;
    }
    setSubmitting(true);
    try {
      const discountCodeId = await resolveCodeId(code);
      const res = await fetch(COMP_CLEAR_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matter_id: matterId.trim(),
          discount_code_id: discountCodeId,
          reason: reason.trim() || DEFAULT_REASON,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; finalAmount?: number };
      if (!res.ok || !json.ok) {
        setError(`Adjustment failed: ${json.error ?? `HTTP ${res.status}`}`);
        return;
      }
      setSuccess("Adjustment applied. Matter balance cleared through audited discount state.");
    } catch (err) {
      setError(`Adjustment failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSubmitting(false);
    }
  }

  const lbl = "block font-mono text-[9px] tracking-[0.18em] uppercase text-[#C6A55A]/60 mb-1";
  const inp =
    "w-full min-w-0 bg-[#0D0B08] border border-[#C6A55A]/15 px-3 py-2 text-white text-xs font-mono outline-none focus:border-[#C6A55A]/40 rounded-sm";

  return (
    <section className="mb-8 rounded border border-[#C6A55A]/15 bg-[#0D0B08] p-6">
      <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#C6A55A]/60 mb-2">
        Operator Comp-Clear Control
      </p>
      <p className="mb-5 max-w-xl text-xs leading-relaxed text-white/50">
        Apply an approved internal adjustment to a controlled matter. This action uses the existing
        audited discount engine and records payment-clear events.
      </p>
      <form onSubmit={(e) => void apply(e)}>
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <label className={lbl}>Matter ID</label>
            <input
              className={inp}
              value={matterId}
              onChange={(e) => setMatterId(e.target.value)}
              placeholder="deal uuid or matter id"
            />
          </div>
          <div className="min-w-0">
            <label className={lbl}>Discount Code</label>
            <input
              className={inp}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="operator enters the code"
            />
          </div>
          <div className="min-w-0 sm:col-span-2">
            <label className={lbl}>Reason</label>
            <input className={inp} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        {success && (
          <p className="mb-3 text-xs font-mono text-green-400/80">{success}</p>
        )}
        {error && <p className="mb-3 text-xs font-mono text-red-400/80">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="min-h-11 rounded bg-[#C6A55A] px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#0A0A0A] disabled:opacity-50"
        >
          {submitting ? "Applying…" : "Apply Approved Adjustment"}
        </button>
      </form>
    </section>
  );
}
