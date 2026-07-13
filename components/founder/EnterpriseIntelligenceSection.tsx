import {
  buildFounderExecutiveSnapshot,
  type CanonicalAssignment,
  type CanonicalIntegrationEvent,
  type CanonicalMatterRecord,
} from "@/lib/intelligence/enterprise";

// Additive, read-only Enterprise Intelligence section for Founder Command.
// It derives a FounderExecutiveSnapshot from canonical evidence passed in. When
// no evidence is wired (default), it renders honest empty states — it never
// fabricates revenue, organizations, relationships, or integration health.
export function EnterpriseIntelligenceSection({
  matters = [],
  integrationEvents = [],
  assignments = [],
  generatedAt = null,
}: {
  matters?: CanonicalMatterRecord[];
  integrationEvents?: CanonicalIntegrationEvent[];
  assignments?: CanonicalAssignment[];
  generatedAt?: string | null;
}) {
  const snapshot = buildFounderExecutiveSnapshot(
    { matters, integrationEvents, assignments },
    { generatedAt },
  );
  const insufficient = snapshot.evidenceStatus === "insufficient_evidence";
  const money = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const tiles: Array<{ label: string; value: string; note?: string }> = [
    { label: "Verified Matter Volume", value: String(snapshot.verifiedMatterVolume) },
    { label: "Verified Revenue", value: money(snapshot.verifiedRevenue), note: "Confirmed payment evidence only" },
    { label: "Complimentary Matters", value: String(snapshot.complimentaryMatterVolume), note: "$0 verified revenue" },
    { label: "Forecast", value: snapshot.forecastRevenue == null ? "—" : money(snapshot.forecastRevenue), note: "Separate from verified" },
    { label: "Active Organizations", value: String(snapshot.activeOrganizations) },
    { label: "Relationship Edges", value: String(snapshot.relationshipEdgeCount), note: "Evidence-backed only" },
  ];

  return (
    <section className="space-y-4" aria-label="Enterprise Intelligence">
      <div className="rounded-2xl border border-[#c9a24a]/25 bg-[#0b1118] p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-[#c9a24a]">Enterprise Intelligence</p>
        <p className="mt-2 text-sm text-white/60">
          Read-only, evidence-based signals derived from canonical Matter, integration, and assignment records.
          {" "}
          <span className={insufficient ? "text-amber-300/80" : "text-emerald-300/80"}>
            {insufficient ? "Insufficient evidence" : "Verified"}
          </span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <div key={t.label} className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#c9a24a]">{t.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{insufficient ? "—" : t.value}</p>
            {t.note && <p className="mt-1 text-xs text-white/45">{t.note}</p>}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[#c9a24a]">Vertical Activity</p>
        {snapshot.verticalActivity.length === 0 ? (
          <p className="mt-2 text-sm text-white/50">No vertical-tagged Matter evidence yet.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm text-white/70">
            {snapshot.verticalActivity.map((v) => (
              <li key={v.vertical} className="flex justify-between gap-3">
                <span className="truncate">{v.vertical}</span>
                <span className="text-white/50">{v.matterVolume}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {snapshot.limitations.length > 0 && (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80">Evidence Limitations</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/60">
            {snapshot.limitations.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-[#c9a24a]/25 bg-[#0b1118] p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[#c9a24a]">Next Review Action</p>
        <p className="mt-2 text-sm text-white/70">{snapshot.nextReviewAction}</p>
      </div>
    </section>
  );
}
