"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RECEIVING_REQUIREMENTS, RECEIVING_REQUIREMENT_LABELS,
  type ReceivingRequirement, type ReceivingRequirementRule, type ReceivingRequirementsEvaluation, type RequirementState,
} from "@/lib/receiving-authority/requirements";

type Payload = {
  authority: { id: string; name: string | null; country: string | null; routing_status?: string | null };
  rules: ReceivingRequirementRule[];
  evaluation: ReceivingRequirementsEvaluation;
  canWrite?: boolean;
};

const card = "rounded-2xl border border-white/[0.08] bg-[#0e0e0e] p-5";
const label = "block text-[10px] font-medium uppercase tracking-[0.16em] text-white/45";
const field = "mt-1.5 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[var(--ms-gold)]/50 focus:outline-none";
const button = "inline-flex min-h-[40px] items-center rounded-lg border border-[var(--ms-gold)]/40 bg-[var(--ms-gold)]/[0.06] px-4 text-xs font-medium text-[var(--ms-gold)] transition hover:bg-[var(--ms-gold)]/[0.12] disabled:cursor-not-allowed disabled:opacity-40";

const STATE: Record<RequirementState, { text: string; tone: string }> = {
  REQUIRED: { text: "Required", tone: "border-emerald-400/30 text-emerald-200" },
  NOT_REQUIRED: { text: "Not required", tone: "border-emerald-400/30 text-emerald-200" },
  CONDITIONAL: { text: "Conditional", tone: "border-[var(--ms-gold)]/30 text-[var(--ms-gold)]" },
  UNKNOWN: { text: "Unknown", tone: "border-white/15 text-white/60" },
  CONFLICT: { text: "Conflicting", tone: "border-red-400/30 text-red-200" },
};
const day = (value: string | null) => (value ? value.slice(0, 10) : "—");
const emptyEntry = { requirement: RECEIVING_REQUIREMENTS[0] as ReceivingRequirement, status: "REQUIRED", documentCategory: "", detail: "", sourceUrl: "", sourceType: "RECEIVING_AUTHORITY", sourceTitle: "", reviewDueAt: "" };

export function ReceivingRequirementsPanel({ authorityId }: { authorityId: string }) {
  const [category, setCategory] = useState("");
  const [data, setData] = useState<Payload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [entry, setEntry] = useState(emptyEntry);
  const [retire, setRetire] = useState<{ id: string; reason: string } | null>(null);
  const endpoint = `/api/dashboard/receiving-authorities/${authorityId}/requirements`;

  const load = useCallback(async (forCategory: string) => {
    try {
      const res = await fetch(`${endpoint}${forCategory ? `?document_category=${encodeURIComponent(forCategory)}` : ""}`, { cache: "no-store" });
      const body = (await res.json().catch(() => ({}))) as Payload & { message?: string };
      if (!res.ok) throw new Error(body.message ?? (res.status === 401 || res.status === 403 ? "You are not authorized to view receiving-authority requirements." : "Receiving-authority requirements are unavailable right now."));
      setData(body);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Receiving-authority requirements are unavailable right now.");
    }
  }, [endpoint]);
  useEffect(() => { void load(""); }, [load]);

  async function post(payload: Record<string, unknown>, done: string) {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, evaluateCategory: category || null }) });
      const body = (await res.json().catch(() => ({}))) as Payload & { message?: string };
      if (!res.ok) throw new Error(body.message ?? "The change was not saved.");
      setData(body);
      setNotice({ kind: "ok", text: done });
      return true;
    } catch (err) {
      setNotice({ kind: "error", text: err instanceof Error ? err.message : "The change was not saved." });
      return false;
    } finally {
      setBusy(false);
    }
  }

  if (loadError) return <p role="alert" className="rounded-2xl border border-red-400/30 bg-red-400/[0.04] p-5 text-sm text-red-200">{loadError}</p>;
  if (!data) return <p className="text-sm text-white/45" role="status">Loading requirements…</p>;

  const { evaluation, rules, authority } = data;
  const sourced = entry.status !== "UNKNOWN";

  return (
    <div className="space-y-5">
      <section className={card}>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="text-lg font-semibold text-white">{authority.name ?? "Receiving authority"}</h2>
            <p className="mt-1 text-xs text-white/45">{authority.country ?? "Country not recorded"}</p>
          </div>
          <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); void load(category.trim()); }}>
            <label className={label}>Document category
              <input className={field} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="All documents" />
            </label>
            <button type="submit" className={button}>Evaluate</button>
          </form>
        </div>
        <p role="status" className={`mt-4 rounded-lg border px-3 py-2 text-sm ${evaluation.finalRouteAllowed ? "border-emerald-400/30 text-emerald-200" : "border-[var(--ms-gold)]/30 text-[var(--ms-gold)]"}`}>
          {evaluation.finalRouteAllowed ? "Every requirement is verified from an official source. The final route may be confirmed." : "Review required. The final route cannot be confirmed for this authority yet."}
        </p>
        {evaluation.blockers.length ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-5 text-white/55">
            {evaluation.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
          </ul>
        ) : null}
      </section>

      <section className={card}>
        <h3 className="text-sm font-semibold text-white">Requirements</h3>
        <ul className="mt-3 divide-y divide-white/[0.06]">
          {evaluation.findings.map((finding) => (
            <li key={finding.requirement} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm text-white/80">{finding.label}</p>
                {finding.detail ? <p className="mt-1 text-xs leading-5 text-white/55">{finding.detail}</p> : null}
                {finding.reason ? <p className="mt-1 text-xs text-white/40">{finding.reason}</p> : null}
                {finding.sources.map((source) => (
                  <a key={source} href={source} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-xs text-[var(--ms-gold)] hover:underline">{source}</a>
                ))}
                {finding.reviewDueAt ? <p className="mt-1 text-[11px] text-white/35">Review due {day(finding.reviewDueAt)}</p> : null}
              </div>
              <span className={`shrink-0 self-start rounded border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${STATE[finding.state].tone}`}>{STATE[finding.state].text}</span>
            </li>
          ))}
        </ul>
      </section>

      {rules.length ? (
        <section className={card}>
          <h3 className="text-sm font-semibold text-white">Current statements</h3>
          <ul className="mt-3 space-y-3">
            {rules.map((rule) => (
              <li key={rule.id} className="rounded-lg border border-white/[0.06] p-3 text-xs text-white/60">
                <p className="text-white/80">{RECEIVING_REQUIREMENT_LABELS[rule.requirement as ReceivingRequirement] ?? rule.requirement} · {rule.status.replace("_", " ").toLowerCase()} · {rule.document_category === "*" ? "all documents" : rule.document_category}</p>
                {rule.detail ? <p className="mt-1 leading-5">{rule.detail}</p> : null}
                <p className="mt-1 text-white/40">{rule.source_url ?? "No source"} · verified {day(rule.verified_at)} · review due {day(rule.review_due_at)}</p>
                {data.canWrite ? (
                  retire?.id === rule.id ? (
                    <form className="mt-2 flex flex-col gap-2 sm:flex-row" onSubmit={async (e) => { e.preventDefault(); if (await post({ action: "supersede", ruleId: rule.id, reason: retire.reason }, "Statement superseded.")) setRetire(null); }}>
                      <input aria-label="Reason for superseding" className={field} value={retire.reason} onChange={(e) => setRetire({ id: rule.id, reason: e.target.value })} placeholder="Reason" required />
                      <button type="submit" className={button} disabled={busy || !retire.reason.trim()}>Confirm</button>
                      <button type="button" className={button} onClick={() => setRetire(null)}>Cancel</button>
                    </form>
                  ) : (
                    <button type="button" className="mt-2 text-xs font-medium text-[var(--ms-gold)] hover:underline" onClick={() => setRetire({ id: rule.id, reason: "" })}>Supersede</button>
                  )
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.canWrite ? (
        <section className={card}>
          <h3 className="text-sm font-semibold text-white">Record a requirement</h3>
          <p className="mt-1 text-xs leading-5 text-white/45">Cite the receiving authority or official guidance. If the source does not answer the question, record it as unknown.</p>
          <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={async (e) => { e.preventDefault(); if (await post({ action: "record", ...entry, documentCategory: entry.documentCategory.trim() || null, reviewDueAt: entry.reviewDueAt ? new Date(`${entry.reviewDueAt}T00:00:00Z`).toISOString() : null }, "Requirement recorded.")) setEntry(emptyEntry); }}>
            <label className={label}>Requirement
              <select className={field} value={entry.requirement} onChange={(e) => setEntry({ ...entry, requirement: e.target.value as ReceivingRequirement })}>
                {RECEIVING_REQUIREMENTS.map((r) => <option key={r} value={r}>{RECEIVING_REQUIREMENT_LABELS[r]}</option>)}
              </select>
            </label>
            <label className={label}>Finding
              <select className={field} value={entry.status} onChange={(e) => setEntry({ ...entry, status: e.target.value })}>
                <option value="REQUIRED">Required</option>
                <option value="NOT_REQUIRED">Not required</option>
                <option value="CONDITIONAL">Conditional</option>
                <option value="UNKNOWN">Unknown</option>
              </select>
            </label>
            <label className={label}>Document category
              <input className={field} value={entry.documentCategory} onChange={(e) => setEntry({ ...entry, documentCategory: e.target.value })} placeholder="All documents" />
            </label>
            <label className={label}>Source type
              <select className={field} value={entry.sourceType} onChange={(e) => setEntry({ ...entry, sourceType: e.target.value })} disabled={!sourced}>
                <option value="RECEIVING_AUTHORITY">Receiving authority</option>
                <option value="OFFICIAL_GUIDANCE">Official guidance</option>
              </select>
            </label>
            <label className={`${label} md:col-span-2`}>Source URL
              <input type="url" className={field} value={entry.sourceUrl} onChange={(e) => setEntry({ ...entry, sourceUrl: e.target.value })} placeholder="https://" required={sourced} />
            </label>
            <label className={label}>Source title
              <input className={field} value={entry.sourceTitle} onChange={(e) => setEntry({ ...entry, sourceTitle: e.target.value })} />
            </label>
            <label className={label}>Review due
              <input type="date" className={field} value={entry.reviewDueAt} onChange={(e) => setEntry({ ...entry, reviewDueAt: e.target.value })} required={sourced} disabled={!sourced} />
            </label>
            <label className={`${label} md:col-span-2`}>Detail
              <textarea className={field} rows={3} value={entry.detail} onChange={(e) => setEntry({ ...entry, detail: e.target.value })} required={entry.status === "CONDITIONAL"} />
            </label>
            <div className="md:col-span-2">
              <button type="submit" className={button} disabled={busy}>{busy ? "Saving…" : "Record requirement"}</button>
            </div>
          </form>
        </section>
      ) : null}

      {notice ? <p role={notice.kind === "error" ? "alert" : "status"} className={`rounded-lg border px-3 py-2 text-sm ${notice.kind === "error" ? "border-red-400/30 text-red-200" : "border-emerald-400/30 text-emerald-200"}`}>{notice.text}</p> : null}
    </div>
  );
}
