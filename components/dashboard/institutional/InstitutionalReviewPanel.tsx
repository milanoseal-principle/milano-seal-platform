"use client";

import { useCallback, useEffect, useState } from "react";
import type { InstitutionalEvidenceRecord, InstitutionalState } from "@/lib/institutional/evidenceLedger";
import { INSTITUTIONAL_PATHWAYS, type InstitutionalPathway } from "@/lib/institutional/institutionalDocument";

type DocumentVersion = { id: string; file_name: string | null; version_number: number | null; stage: string | null; file_hash: string | null };
type Payload = { state: InstitutionalState; documentVersions?: DocumentVersion[]; canDecide?: boolean };
type Problem = { message?: string; error?: string; details?: { outstanding?: { requirement: string; problem: string }[]; reasons?: string[] } | string[] | null };

const card = "rounded-2xl border border-white/[0.08] bg-[#0e0e0e] p-5";
const label = "block text-[10px] font-medium uppercase tracking-[0.16em] text-white/45";
const field = "mt-1.5 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[var(--ms-gold)]/50 focus:outline-none";
const button = "inline-flex min-h-[40px] items-center rounded-lg border border-[var(--ms-gold)]/40 bg-[var(--ms-gold)]/[0.06] px-4 text-xs font-medium text-[var(--ms-gold)] transition hover:bg-[var(--ms-gold)]/[0.12] disabled:cursor-not-allowed disabled:opacity-40";

const PATHWAY_LABEL: Record<InstitutionalPathway, string> = {
  DIRECT_COMPETENT_AUTHORITY: "Direct apostille by the host State's Competent Authority",
  HOST_STATE_NOTARIAL_AUTHENTICATION: "Host-State notarial authentication, then apostille",
  DESIGNATED_GOVERNMENT_INTERMEDIARY: "Designated government intermediary, then apostille",
};
const DECISION: Record<string, { text: string; tone: string }> = {
  VERIFIED_ROUTE: { text: "Verified route — approved for operator routing", tone: "border-emerald-400/30 text-emerald-200" },
  CONDITIONAL_REVIEW: { text: "Conditional review — not a route yet", tone: "border-[var(--ms-gold)]/30 text-[var(--ms-gold)]" },
  UNSUPPORTED: { text: "Unsupported — this pathway cannot be used", tone: "border-red-400/30 text-red-200" },
  UNKNOWN: { text: "Unknown — required facts are not identified", tone: "border-white/15 text-white/60" },
};
const PROBLEM: Record<string, string> = { missing: "Not yet evidenced", no_source: "No official source or verification date", stale: "Out of date — re-verify", rejected: "Declined by the authority or source" };
const versionLabel = (v: DocumentVersion) => `${v.file_name ?? "Document"} · v${v.version_number ?? "?"}${v.stage ? ` · ${v.stage}` : ""}`;
const day = (value: string | null) => (value ? value.slice(0, 10) : "—");

export function InstitutionalReviewPanel({ matterId }: { matterId: string }) {
  const endpoint = `/api/dashboard/matters/${matterId}/institutional`;
  const [data, setData] = useState<Payload | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [canDecide, setCanDecide] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string; list?: string[] } | null>(null);
  const [review, setReview] = useState({ issuingOrganisation: "", issuingOfficial: "", officialCapacity: "", hostState: "", destination: "", documentCategory: "", documentForm: "original", pathway: "DIRECT_COMPETENT_AUTHORITY", documentVersionId: "" });
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [entry, setEntry] = useState({ state: "verified", source: "", verifiedAt: "", expiresAt: "", note: "", documentVersionId: "" });
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      const body = (await res.json().catch(() => ({}))) as Payload & Problem;
      if (!res.ok) throw new Error(body.message ?? (res.status === 403 || res.status === 401 ? "You are not authorized to review institutional evidence." : "Institutional evidence is unavailable right now."));
      setData(body);
      setVersions(body.documentVersions ?? []);
      setCanDecide(body.canDecide === true);
      setLoadError(null);
      const r = body.state.review;
      if (r) setReview({ issuingOrganisation: r.issuingOrganisation, issuingOfficial: r.issuingOfficial, officialCapacity: r.officialCapacity, hostState: r.hostState, destination: r.destination, documentCategory: r.documentCategory, documentForm: r.documentForm, pathway: r.pathway, documentVersionId: r.documentVersionId ?? "" });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Institutional evidence is unavailable right now.");
    }
  }, [endpoint]);
  useEffect(() => { void load(); }, [load]);

  async function send(body: Record<string, unknown>, done: string) {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const out = (await res.json().catch(() => ({}))) as Payload & Problem;
      if (!res.ok) {
        const details = out.details && !Array.isArray(out.details) ? out.details : null;
        setNotice({ kind: "error", text: out.message ?? "The change was not saved.", list: [...(details?.reasons ?? []), ...(details?.outstanding ?? []).map((o) => `${o.requirement} (${PROBLEM[o.problem] ?? o.problem})`)] });
        return false;
      }
      setData((prev) => ({ ...(prev ?? {}), state: out.state }));
      setNotice({ kind: "ok", text: done });
      return true;
    } catch {
      setNotice({ kind: "error", text: "The change was not saved. Check your connection and try again." });
      return false;
    } finally {
      setBusy(false);
    }
  }

  if (loadError) return <p role="alert" className="rounded-2xl border border-red-400/30 bg-red-400/[0.04] p-5 text-sm text-red-200">{loadError} This is not an empty review: the evidence could not be read.</p>;
  if (!data) return <p className="text-sm text-white/45" role="status">Loading institutional review…</p>;

  const state = data.state;
  const evaluation = state.evaluation;
  const decision = evaluation ? DECISION[evaluation.decision] : null;
  const showForm = !state.review || editing;
  const complete = Boolean(state.review?.documentVersionId && state.review.documentSha256 && evaluation && evaluation.outstanding.every((o) => o.key === "operatorApproval"));

  return (
    <div className="space-y-5">
      {notice && (
        <div role={notice.kind === "error" ? "alert" : "status"} className={`rounded-2xl border p-4 text-sm ${notice.kind === "error" ? "border-red-400/30 bg-red-400/[0.04] text-red-200" : "border-emerald-400/30 bg-emerald-400/[0.04] text-emerald-200"}`}>
          {notice.text}
          {notice.list?.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">{notice.list.map((l) => <li key={l}>{l}</li>)}</ul> : null}
        </div>
      )}

      {evaluation && decision && (
        <section className={`${card} ${decision.tone}`} aria-label="Route decision">
          <div className="text-[10px] uppercase tracking-[0.18em] opacity-70">Route decision for this Matter</div>
          <p className="mt-1.5 text-lg font-semibold">{decision.text}</p>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-white/60">{evaluation.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
          {state.approvalVoided && <p className="mt-2 text-xs text-[var(--ms-gold)]">{state.approvalVoided}</p>}
          <p className="mt-3 text-[11px] leading-5 text-white/35">{evaluation.notice}</p>
        </section>
      )}

      <section className={card} aria-label="Document under review">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white/90">1 · Document under review{state.review ? ` (version ${state.review.version})` : ""}</h2>
          {state.review && !editing && <button type="button" className={button} onClick={() => setEditing(true)}>Record a new version</button>}
        </div>
        {!showForm && state.review ? (
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            {([["Issuing organisation", state.review.issuingOrganisation], ["Issuing official", [state.review.issuingOfficial, state.review.officialCapacity].filter(Boolean).join(" · ") || "Not recorded"], ["Host State", state.review.hostState], ["Destination", state.review.destination], ["Document", `${state.review.documentCategory} · ${state.review.documentForm === "original" ? "original" : "certified copy"}`], ["Candidate pathway", PATHWAY_LABEL[state.review.pathway]], ["Document SHA-256", state.review.documentSha256 ?? "No document version attached"]] as [string, string][]).map(([k, v]) => (
              <div key={k}><dt className={label}>{k}</dt><dd className="mt-1 break-all text-white/80">{v}</dd></div>
            ))}
          </dl>
        ) : (
          <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={async (e) => { e.preventDefault(); if (await send({ action: "review", ...review, documentVersionId: review.documentVersionId || null }, state.review ? "New review version recorded. Earlier evidence and approval no longer apply." : "Review recorded. Add the required evidence below.")) { setEditing(false); await load(); } }}>
            {state.review && <p className="sm:col-span-2 text-xs text-[var(--ms-gold)]">Recording a new version starts the evidence again: evidence and any approval recorded for the current version stop applying. The earlier records stay in the Matter's history.</p>}
            {([["issuingOrganisation", "Issuing organisation", "As it appears on the document"], ["issuingOfficial", "Issuing official", "Name of the signing official"], ["officialCapacity", "Official capacity", "Role within the organisation"], ["hostState", "Host State", "Country where the document was issued"], ["destination", "Destination", "Country where it will be used"], ["documentCategory", "Document category", "e.g. certificate of employment"]] as [keyof typeof review, string, string][]).map(([key, text, hint]) => (
              <label key={key} className={label}>{text}
                <input className={field} value={review[key]} placeholder={hint} maxLength={300} onChange={(e) => setReview({ ...review, [key]: e.target.value })} required={!["issuingOfficial", "officialCapacity"].includes(key)} />
              </label>
            ))}
            <label className={label}>Document form
              <select className={field} value={review.documentForm} onChange={(e) => setReview({ ...review, documentForm: e.target.value })}>
                <option value="original">Original</option><option value="certified_copy">Certified copy</option>
              </select>
            </label>
            <label className={label}>Document version (required before approval)
              <select className={field} value={review.documentVersionId} onChange={(e) => setReview({ ...review, documentVersionId: e.target.value })}>
                <option value="">None attached</option>{versions.map((v) => <option key={v.id} value={v.id}>{versionLabel(v)}</option>)}
              </select>
            </label>
            <fieldset className="sm:col-span-2">
              <legend className={label}>Candidate pathway (HCCH Working Group, 1 December 2017)</legend>
              <div className="mt-2 space-y-2">
                {(Object.keys(INSTITUTIONAL_PATHWAYS) as InstitutionalPathway[]).map((p) => (
                  <label key={p} className="flex cursor-pointer gap-3 rounded-lg border border-white/10 p-3 text-sm text-white/75">
                    <input type="radio" name="pathway" className="mt-1" checked={review.pathway === p} onChange={() => setReview({ ...review, pathway: p })} />
                    <span><span className="font-medium text-white/90">{PATHWAY_LABEL[p]}</span><span className="mt-1 block text-xs leading-5 text-white/45">{INSTITUTIONAL_PATHWAYS[p]}</span></span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="sm:col-span-2 flex flex-wrap gap-2">
              <button type="submit" className={button} disabled={busy}>{state.review ? "Record new version" : "Record review"}</button>
              {editing && <button type="button" className={button} onClick={() => setEditing(false)}>Cancel</button>}
            </div>
          </form>
        )}
      </section>

      {state.review && (
        <section className={card} aria-label="Required evidence">
          <h2 className="text-sm font-semibold text-white/90">2 · Required evidence for this pathway</h2>
          <p className="mt-1 text-xs leading-5 text-white/45">Each item needs its official source (a URL or document reference) and the date it was verified. An organisation or authority name alone is not evidence.</p>
          <ul className="mt-4 space-y-3">
            {state.required.map(({ key, requirement }) => {
              const record = state.evidence[key];
              const issue = evaluation?.outstanding.find((o) => o.key === key);
              const status = !record ? "Not yet evidenced" : record.expired ? "Expired — re-verify" : issue ? PROBLEM[issue.problem] ?? issue.problem : record.state === "verified" ? "Verified" : "Declined";
              const good = Boolean(record && !issue && !record.expired && record.state === "verified");
              return (
                <li key={key} className="rounded-xl border border-white/[0.07] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="max-w-2xl text-sm text-white/80">{requirement}</p>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] ${good ? "border-emerald-400/30 text-emerald-200" : "border-[var(--ms-gold)]/30 text-[var(--ms-gold)]"}`}>{status}</span>
                  </div>
                  {record && (
                    <p className="mt-2 break-all text-xs leading-5 text-white/45">Version {record.version} · source: {record.source ?? "none"} · verified {day(record.verifiedAt)}{record.expiresAt ? ` · expires ${day(record.expiresAt)}` : ""}{record.sha256 ? ` · SHA-256 ${record.sha256}` : ""}{record.note ? ` · ${record.note}` : ""}</p>
                  )}
                  {open === key ? (
                    <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={async (e) => { e.preventDefault(); if (await send({ action: "evidence", key, ...entry, expiresAt: entry.expiresAt || null, documentVersionId: entry.documentVersionId || null }, record ? "Corrected evidence recorded as a new version. Any earlier approval must be given again." : "Evidence recorded.")) { setOpen(null); setEntry({ state: "verified", source: "", verifiedAt: "", expiresAt: "", note: "", documentVersionId: "" }); } }}>
                      <label className={label}>Outcome
                        <select className={field} value={entry.state} onChange={(e) => setEntry({ ...entry, state: e.target.value })}><option value="verified">Verified from an official source</option><option value="rejected">Declined by the authority or source</option></select>
                      </label>
                      <label className={label}>Official source (URL or document reference)
                        <input className={field} value={entry.source} maxLength={1000} required={entry.state === "verified"} onChange={(e) => setEntry({ ...entry, source: e.target.value })} />
                      </label>
                      <label className={label}>Date verified
                        <input type="date" className={field} value={entry.verifiedAt} required={entry.state === "verified"} onChange={(e) => setEntry({ ...entry, verifiedAt: e.target.value })} />
                      </label>
                      <label className={label}>Expires (optional)
                        <input type="date" className={field} value={entry.expiresAt} onChange={(e) => setEntry({ ...entry, expiresAt: e.target.value })} />
                      </label>
                      <label className={label}>Attached evidence (private Matter file)
                        <select className={field} value={entry.documentVersionId} onChange={(e) => setEntry({ ...entry, documentVersionId: e.target.value })}><option value="">None attached</option>{versions.map((v) => <option key={v.id} value={v.id}>{versionLabel(v)}</option>)}</select>
                      </label>
                      <label className={label}>{entry.state === "rejected" ? "What was declined (required)" : "Note (optional)"}
                        <input className={field} value={entry.note} maxLength={2000} required={entry.state === "rejected"} onChange={(e) => setEntry({ ...entry, note: e.target.value })} />
                      </label>
                      <div className="sm:col-span-2 flex flex-wrap gap-2"><button type="submit" className={button} disabled={busy}>Save evidence</button><button type="button" className={button} onClick={() => setOpen(null)}>Cancel</button></div>
                    </form>
                  ) : (
                    <button type="button" className={`${button} mt-3`} disabled={busy || Boolean(state.rejection)} onClick={() => { setOpen(key); setNotice(null); }}>{record ? "Record a correction" : "Add evidence"}</button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {state.review && (
        <section className={card} aria-label="Approval">
          <h2 className="text-sm font-semibold text-white/90">3 · Approval</h2>
          {state.rejection ? (
            <p className="mt-2 text-sm text-red-200">This pathway was rejected on {day(state.rejection.at)}: {state.rejection.reason}. Record a new version above to review another pathway.</p>
          ) : state.approval ? (
            <p className="mt-2 text-sm text-emerald-200">Approved on {day(state.approval.at)}. The approval lapses if any evidence is corrected or expires.</p>
          ) : !canDecide ? (
            <p className="mt-2 text-sm text-white/55">Your role can record evidence. Approving or rejecting a pathway needs an authorized execution role.</p>
          ) : (
            <>
              <p className="mt-2 text-xs leading-5 text-white/45">{complete ? "All evidence is in place. Approval confirms you have reviewed it; it is refused if anything is missing, unsourced or out of date." : "Approval requires a saved document version and every item above evidenced from a current official source. Select a document when recording the review."}</p>
              <label className={`${label} mt-3`}>Reason (required to reject)
                <input className={field} value={reason} maxLength={2000} onChange={(e) => setReason(e.target.value)} />
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={button} disabled={busy || !complete} onClick={async () => { if (await send({ action: "approve", reason }, "Pathway approved for this Matter.")) setReason(""); }}>Approve pathway</button>
                <button type="button" className={button} disabled={busy || !reason.trim()} onClick={async () => { if (await send({ action: "reject", reason }, "Pathway rejected.")) setReason(""); }}>Reject pathway</button>
              </div>
            </>
          )}
        </section>
      )}

      {state.review && (state.history.length > 0 || state.decisions.length > 0) && (
        <section className={card} aria-label="History">
          <h2 className="text-sm font-semibold text-white/90">4 · History for this version (append-only)</h2>
          <ol className="mt-3 space-y-2 text-xs leading-5 text-white/55">
            {[...state.history.map((h: InstitutionalEvidenceRecord) => ({ at: h.recordedAt, text: `${h.key} v${h.version}: ${h.state}${h.current ? "" : " (superseded)"}${h.source ? ` — ${h.source}` : ""}` })), ...state.decisions.map((d) => ({ at: d.at, text: `Pathway ${d.decision}${d.reason ? ` — ${d.reason}` : ""}` }))]
              .sort((a, b) => a.at.localeCompare(b.at))
              .map((row, i) => <li key={`${row.at}-${i}`} className="break-all"><span className="text-white/35">{row.at.replace("T", " ").slice(0, 16)} UTC</span> · {row.text}</li>)}
          </ol>
        </section>
      )}
    </div>
  );
}
