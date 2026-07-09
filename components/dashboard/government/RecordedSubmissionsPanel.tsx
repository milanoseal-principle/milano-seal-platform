import type { GovernmentSubmissionRecord } from "@/lib/government/submissions/pinellasItq250786";

// Renders REAL recorded government submissions — explicitly distinct from the
// illustrative sample data elsewhere on this page. Status is shown exactly as
// recorded (e.g. "Submitted"); no award/win is implied or fabricated.

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.18em] text-stone-500">
        {label}
      </p>
      <div className="text-xs text-stone-300">{children}</div>
    </div>
  );
}

export function RecordedSubmissionsPanel({
  submissions,
}: {
  submissions: GovernmentSubmissionRecord[];
}) {
  return (
    <section className="rounded-2xl border border-emerald-400/20 bg-black/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
          Recorded Submissions
        </h2>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/[0.08] px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-emerald-300">
          Real data
        </span>
      </div>

      {submissions.length === 0 ? (
        <p className="text-xs text-stone-500">No submissions recorded yet.</p>
      ) : (
        <div className="space-y-5">
          {submissions.map((s) => (
            <article
              key={s.solicitationNumber}
              className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm text-amber-100">
                    {s.solicitationTitle}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-500">
                    {s.issuingAgency} · ITQ #{s.solicitationNumber}
                  </p>
                </div>
                <span className="rounded-full border border-amber-300/40 bg-amber-300/[0.08] px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-amber-200">
                  {s.submissionStatus} · not awarded
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Submitted">{s.submissionDate}</Field>
                <Field label="Portal">
                  <a
                    href={s.submissionPortalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-300 underline decoration-amber-300/30 underline-offset-2 hover:decoration-amber-300 break-all"
                  >
                    {s.submissionPortalUrl}
                  </a>
                </Field>
                <Field label="Delivery (ARO)">
                  {s.deliveryAroDays} day{s.deliveryAroDays === 1 ? "" : "s"}
                  {s.deliveryNote ? ` — ${s.deliveryNote}` : ""}
                </Field>
                <Field label="SBE">{s.sbeStatus ? "Yes" : "No"}</Field>

                <Field label="Bid scope">
                  <ul className="list-disc space-y-0.5 pl-4">
                    {s.bidScope.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </Field>
                <Field label="No-bid scope (declined)">
                  <ul className="list-disc space-y-0.5 pl-4 text-stone-400">
                    {s.noBidScope.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </Field>

                <Field label="Rates bid">
                  <ul className="space-y-0.5">
                    {s.ratesBid.map((r) => (
                      <li key={r.label}>
                        <span className="text-stone-400">{r.label}:</span>{" "}
                        {r.rate}
                      </li>
                    ))}
                  </ul>
                </Field>
                <Field label="References (private / commercial)">
                  <ul className="list-disc space-y-0.5 pl-4">
                    {s.references.map((r) => (
                      <li key={r.name}>{r.name}</li>
                    ))}
                  </ul>
                </Field>

                <Field label="Insurance">
                  <ul className="space-y-0.5">
                    {s.insurance.map((i) => (
                      <li key={i.line}>
                        <span className="text-stone-400">{i.line}:</span>{" "}
                        {i.status}
                        {i.carrier ? ` (${i.carrier}` : ""}
                        {i.policyNumber ? ` ${i.policyNumber}` : ""}
                        {i.limit ? `, ${i.limit})` : i.carrier ? ")" : ""}
                      </li>
                    ))}
                  </ul>
                </Field>
                <Field label="Open items (post-submission)">
                  <ul className="list-disc space-y-0.5 pl-4">
                    {s.openItemsPostSubmission.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </Field>
              </div>

              <div className="mt-4 border-t border-white/[0.06] pt-3">
                <Field label="Positioning framework">
                  {s.positioningFramework}
                </Field>
                {s.notes ? (
                  <p className="mt-2 text-[11px] italic text-stone-500">
                    {s.notes}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
