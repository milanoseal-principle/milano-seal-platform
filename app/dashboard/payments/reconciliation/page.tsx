"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type ExceptionRow = {
  id: string;
  deal_id: string;
  matter_reference: string;
  status: "open" | "resolved";
  reason: string;
  severity: "watch" | "action_required";
  scheduling_authorized: boolean;
  payment_observed_at: string;
  provider_resource_id: string | null;
  amount_due: number;
  currency: string;
  attempt_count: number;
  first_detected_at: string;
  last_detected_at: string;
  next_action: string;
  resolution: string | null;
  resolved_at: string | null;
  updated_at: string;
};

type RecoveryDraft = {
  providerResourceId: string;
  grossAmount: string;
  netAmount: string;
  feeAmount: string;
  currency: string;
  settledAt: string;
  evidenceLocator: string;
};

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(value || 0));
}

function when(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function reasonLabel(reason: string) {
  if (reason === "provider_correlation_missing") return "Provider correlation missing";
  if (reason === "settlement_pending_with_provider_evidence") return "Provider evidence found · settlement pending";
  if (reason === "payment_mismatch_review") return "Payment mismatch review";
  return reason.replaceAll("_", " ");
}

export default function WiseReconciliationCommandPage() {
  const [rows, setRows] = useState<ExceptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, RecoveryDraft>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/wise/reconciliation-exceptions", { cache: "no-store" });
      const payload = await response.json() as { exceptions?: ExceptionRow[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to load Wise reconciliation exceptions");
      setRows(payload.exceptions ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load Wise reconciliation exceptions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const open = rows.filter((row) => row.status === "open");
  const actionRequired = open.filter((row) => row.severity === "action_required").length;
  const watch = open.filter((row) => row.severity === "watch").length;

  const summary = useMemo(() => [
    ["Open exceptions", String(open.length)],
    ["Action required", String(actionRequired)],
    ["Wise processing", String(watch)],
  ], [open.length, actionRequired, watch]);

  function draftFor(row: ExceptionRow): RecoveryDraft {
    return drafts[row.id] ?? {
      providerResourceId: row.provider_resource_id ?? "",
      grossAmount: String(row.amount_due ?? ""),
      netAmount: "",
      feeAmount: "",
      currency: row.currency || "USD",
      settledAt: "",
      evidenceLocator: "",
    };
  }

  function patchDraft(row: ExceptionRow, patch: Partial<RecoveryDraft>) {
    setDrafts((current) => ({ ...current, [row.id]: { ...draftFor(row), ...patch } }));
  }

  async function recover(event: FormEvent, row: ExceptionRow) {
    event.preventDefault();
    const draft = draftFor(row);
    setSubmitting(row.id);
    setNotice(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/wise/reconciliation-exceptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matterId: row.deal_id,
          paymentReference: row.matter_reference,
          providerResourceId: draft.providerResourceId,
          grossAmount: Number(draft.grossAmount),
          netAmount: Number(draft.netAmount),
          feeAmount: Number(draft.feeAmount),
          currency: draft.currency,
          settledAt: draft.settledAt,
          evidenceLocator: draft.evidenceLocator,
        }),
      });
      const payload = await response.json() as { ok?: boolean; error?: string; detail?: string };
      if (!response.ok) throw new Error(payload.detail || payload.error || "Wise recovery rejected");
      setNotice(`${row.matter_reference}: exact Wise provider settlement evidence accepted by the canonical recovery authority.`);
      setActiveId(null);
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Wise recovery rejected");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-[var(--ms-gold)]/20 bg-[#08080A] p-5 shadow-[0_30px_100px_rgba(0,0,0,.28)] sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--ms-gold)]/70">Finance · Wise Control</p>
            <h1 className="mt-2 font-serif text-3xl text-white sm:text-4xl">Settlement Recovery Command</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/52">
              Automatic exception detection for governed Wise submissions. A submission never authorizes scheduling; scheduling unlocks only after verified settlement. Paid state is never inferred from amount, timing, or client assertion.
            </p>
          </div>
          <button onClick={() => void load()} className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/65 hover:border-[var(--ms-gold)]/35 hover:text-white">
            Refresh truth
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {summary.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 text-sm leading-6 text-white/58">
          <strong className="text-emerald-200">Scheduling rule:</strong> a Wise submission is shown as processing and never authorizes scheduling, BlueNotary sessions or execution. Scheduling unlocks only after exact verified Wise settlement; final settlement-dependent release also remains locked until verified paid truth exists.
        </div>

        {notice && <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-3 text-sm text-emerald-100">{notice}</div>}
        {error && <div className="mt-4 rounded-xl border border-[#E0876E]/30 bg-[#C0563E]/[0.07] p-3 text-sm text-[#F0B3A4]">{error}</div>}

        <div className="mt-7 space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-white/[0.06] p-6 text-sm text-white/42">Loading canonical Wise exception truth…</div>
          ) : open.length === 0 ? (
            <div className="rounded-2xl border border-emerald-500/18 bg-emerald-500/[0.035] p-6">
              <p className="text-base font-medium text-emerald-200">No open Wise settlement exceptions</p>
              <p className="mt-2 text-sm text-white/45">The automatic reconciliation lane has no unresolved provider-correlation or mismatch exceptions.</p>
            </div>
          ) : open.map((row) => {
            const draft = draftFor(row);
            const expanded = activeId === row.id;
            return (
              <section key={row.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-xs tracking-[0.08em] text-[var(--ms-gold)]">{row.matter_reference}</p>
                      <span className={`rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] ${row.severity === "action_required" ? "border-[#E0876E]/30 text-[#E0876E]" : "border-[var(--ms-gold)]/25 text-[#E7D19A]"}`}>
                        {row.severity === "action_required" ? "Action required" : "Wise processing"}
                      </span>
                      {row.scheduling_authorized && <span className="rounded-full border border-emerald-500/25 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-emerald-300">Scheduling authorized</span>}
                    </div>
                    <h2 className="mt-2 text-lg font-medium text-white">{reasonLabel(row.reason)}</h2>
                    <p className="mt-2 max-w-4xl text-sm leading-6 text-white/50">{row.next_action}</p>
                  </div>
                  <div className="grid min-w-[260px] grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl border border-white/[0.05] p-3"><span className="block text-white/30">Amount</span><span className="mt-1 block text-white/75">{money(row.amount_due, row.currency)}</span></div>
                    <div className="rounded-xl border border-white/[0.05] p-3"><span className="block text-white/30">Checks</span><span className="mt-1 block text-white/75">{row.attempt_count}</span></div>
                    <div className="col-span-2 rounded-xl border border-white/[0.05] p-3"><span className="block text-white/30">Last checked</span><span className="mt-1 block text-white/75">{when(row.last_detected_at)}</span></div>
                  </div>
                </div>

                {row.severity === "action_required" && (
                  <div className="mt-4 border-t border-white/[0.06] pt-4">
                    <button onClick={() => setActiveId(expanded ? null : row.id)} className="rounded-xl border border-[var(--ms-gold)]/25 bg-[var(--ms-gold)]/[0.05] px-4 py-2 text-xs font-medium text-[#F2D990] hover:border-[var(--ms-gold)]/45">
                      {expanded ? "Close recovery" : "Recover with verified Wise evidence"}
                    </button>

                    {expanded && (
                      <form onSubmit={(event) => void recover(event, row)} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <label className="text-xs text-white/45">Wise resource ID<input required value={draft.providerResourceId} onChange={(e) => patchDraft(row, { providerResourceId: e.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-[var(--ms-gold)]/50" /></label>
                        <label className="text-xs text-white/45">Gross amount<input required inputMode="decimal" value={draft.grossAmount} onChange={(e) => patchDraft(row, { grossAmount: e.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-[var(--ms-gold)]/50" /></label>
                        <label className="text-xs text-white/45">Currency<input required maxLength={3} value={draft.currency} onChange={(e) => patchDraft(row, { currency: e.target.value.toUpperCase() })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-[var(--ms-gold)]/50" /></label>
                        <label className="text-xs text-white/45">Net amount<input required inputMode="decimal" value={draft.netAmount} onChange={(e) => patchDraft(row, { netAmount: e.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-[var(--ms-gold)]/50" /></label>
                        <label className="text-xs text-white/45">Wise fee<input required inputMode="decimal" value={draft.feeAmount} onChange={(e) => patchDraft(row, { feeAmount: e.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-[var(--ms-gold)]/50" /></label>
                        <label className="text-xs text-white/45">Settled at<input required type="datetime-local" value={draft.settledAt} onChange={(e) => patchDraft(row, { settledAt: e.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-[var(--ms-gold)]/50" /></label>
                        <label className="text-xs text-white/45 sm:col-span-2 lg:col-span-3">Evidence locator<input required placeholder="Official Wise notification / provider evidence locator" value={draft.evidenceLocator} onChange={(e) => patchDraft(row, { evidenceLocator: e.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-[var(--ms-gold)]/50" /></label>
                        <div className="sm:col-span-2 lg:col-span-3 flex flex-col gap-3 rounded-xl border border-[#E0876E]/20 bg-[#C0563E]/[0.045] p-3 text-xs leading-5 text-white/50 sm:flex-row sm:items-center sm:justify-between">
                          <span>Submit only exact official Wise evidence. This action delegates to the canonical Wise recovery RPC; it cannot directly mark a Matter paid.</span>
                          <button disabled={submitting === row.id} className="shrink-0 rounded-xl bg-[var(--ms-gold)] px-4 py-2 font-semibold text-black disabled:opacity-50">{submitting === row.id ? "Validating…" : "Validate + recover"}</button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
