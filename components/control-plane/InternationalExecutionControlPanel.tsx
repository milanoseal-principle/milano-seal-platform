import {
  AUTHORITY_EVIDENCE_REGISTRY,
  DOCUMENT_ORIGIN_ROUTING_MATRIX,
  evaluateAuthorityFreshness,
  summarizeHagueCoverage,
} from "@/lib/international-execution/operationalGovernance";

export function InternationalExecutionControlPanel() {
  const coverage = summarizeHagueCoverage();
  const review = AUTHORITY_EVIDENCE_REGISTRY.filter((record) => evaluateAuthorityFreshness(record) !== "CURRENT");

  return (
    <section className="space-y-5 rounded-3xl border border-white/10 bg-[#0b0b0b] p-5 md:p-7">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-[var(--ms-gold)]">International Execution Governance</div>
        <h2 className="mt-2 text-2xl font-semibold text-white">Authority evidence, Hague coverage and document-origin routing</h2>
        <p className="mt-3 max-w-5xl text-sm leading-7 text-white/55">This layer extends the canonical Compliance Atlas. It does not create a second country database. {coverage.contractingParties} Contracting Parties is a Convention coverage fact; every Matter still requires operative relationship, document origin, competent authority, territorial scope and receiving-authority review.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
        <Metric label="HCCH Parties" value={coverage.contractingParties} />
        <Metric label="Mapped" value={coverage.mappedDestinations} />
        <Metric label="Verified" value={coverage.verified} />
        <Metric label="Review" value={coverage.reviewRequired} />
        <Metric label="Incomplete" value={coverage.incompleteEvidence} />
        <Metric label="Stale" value={coverage.stale} />
        <Metric label="Non-Hague" value={coverage.nonHague} />
        <Metric label="Origin Classes" value={DOCUMENT_ORIGIN_ROUTING_MATRIX.length} />
      </div>

      <details className="rounded-2xl border border-white/8 bg-black/25 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-white">Authority freshness / review queue · {review.length}</summary>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="text-white/35"><tr><th className="px-3 py-2">Destination</th><th className="px-3 py-2">Hague</th><th className="px-3 py-2">Routing</th><th className="px-3 py-2">Freshness</th><th className="px-3 py-2">Last verified</th><th className="px-3 py-2">Next review</th></tr></thead>
            <tbody className="divide-y divide-white/5">{review.slice(0, 250).map((record) => <tr key={record.destinationSlug}><td className="px-3 py-2 font-medium text-white/75">{record.country}</td><td className="px-3 py-2 text-white/50">{record.hagueConventionStatus.replaceAll("_", " ")}</td><td className="px-3 py-2 text-[var(--ms-gold)]">{record.routingStatus.replaceAll("_", " ")}</td><td className="px-3 py-2 text-white/50">{evaluateAuthorityFreshness(record).replaceAll("_", " ")}</td><td className="px-3 py-2 text-white/40">{record.lastVerifiedAt ?? "—"}</td><td className="px-3 py-2 text-white/40">{record.nextReviewAt ?? "—"}</td></tr>)}</tbody>
          </table>
        </div>
      </details>

      <details className="rounded-2xl border border-white/8 bg-black/25 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-white">Document-origin routing matrix · {DOCUMENT_ORIGIN_ROUTING_MATRIX.length}</summary>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{DOCUMENT_ORIGIN_ROUTING_MATRIX.map((rule) => <article key={rule.category} className="rounded-xl border border-white/8 bg-[#111] p-4"><div className="text-sm font-semibold text-white">{rule.category.replaceAll("_", " ")}</div><div className="mt-2 text-xs leading-5 text-white/45">Authority: {rule.authorityClass} · Route: {rule.possibleAuthenticationRoute}</div><div className="mt-2 text-xs leading-5 text-white/40">Required facts: {rule.requiredOriginFacts.join(", ")}</div><div className="mt-2 text-xs leading-5 text-white/40">Review when: {rule.manualReviewConditions.join(", ")}</div></article>)}</div>
      </details>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["RON", "Signer location, document type, notarial act, platform eligibility, identity/KBA/credential evidence, witness state, wet-ink and receiving-authority acceptance are explicit gates."],
          ["Witnesses", "Unknown witness requirements remain REVIEW_REQUIRED; eligibility and disqualification evidence are independent from payment and signer identity."],
          ["Translation", "Required/certified translation requires translated-file and certification evidence; receiving-authority acceptance remains separate."],
          ["Original / Copy", "Scans never imply scan acceptance; notarized copies never imply government-certified copies; wet-ink/original requirements block release when unmet."],
        ].map(([title, body]) => <article key={title} className="rounded-xl border border-white/8 bg-[#111] p-4"><div className="font-medium text-white">{title}</div><p className="mt-2 text-xs leading-5 text-white/45">{body}</p></article>)}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-white/8 bg-black/25 p-3"><div className="text-[9px] uppercase tracking-[0.13em] text-white/35">{label}</div><div className="mt-1 text-xl font-semibold text-white">{value}</div></div>;
}
