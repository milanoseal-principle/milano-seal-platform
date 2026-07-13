import {
  buildFounderExecutiveSnapshot,
  buildMatterPerformanceSnapshot,
  type CanonicalAssignment,
  type CanonicalIntegrationEvent,
  type CanonicalMatterRecord,
  type MatterPerformanceSnapshot,
  type MatterStateSnapshot,
  type OrganizationInventorySnapshot,
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
  matterState = null,
  revenue = null,
  organizations = null,
}: {
  matters?: CanonicalMatterRecord[];
  integrationEvents?: CanonicalIntegrationEvent[];
  assignments?: CanonicalAssignment[];
  generatedAt?: string | null;
  /** Precomputed, server-derived Matter-state snapshot (no raw records). */
  matterState?: MatterStateSnapshot | null;
  /** Precomputed, server-derived verified-revenue snapshot (no raw records). */
  revenue?: MatterPerformanceSnapshot | null;
  /** Precomputed, server-derived organization inventory snapshot (no raw records). */
  organizations?: OrganizationInventorySnapshot | null;
}) {
  const snapshot = buildFounderExecutiveSnapshot(
    { matters, integrationEvents, assignments },
    { generatedAt },
  );
  // Revenue tiles come from the server-computed revenue snapshot when wired;
  // otherwise honest empty evidence.
  const rev = revenue ?? buildMatterPerformanceSnapshot([], { generatedAt });
  const revInsufficient = rev.evidenceStatus === "insufficient_evidence";
  const insufficient = snapshot.evidenceStatus === "insufficient_evidence";
  const money = (n: number, ccy: string | null) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: ccy || "USD", maximumFractionDigits: 0 }).format(n);

  const tiles: Array<{ label: string; value: string; note?: string; empty?: boolean }> = [
    { label: "Verified Paid Matters", value: String(rev.verifiedMatterVolume), empty: revInsufficient },
    {
      label: "Verified Revenue",
      value: rev.verifiedRevenue == null ? "—" : money(rev.verifiedRevenue, rev.currency),
      note: "Confirmed payment evidence only",
      empty: revInsufficient,
    },
    { label: "Complimentary Matters", value: String(rev.complimentaryMatterVolume), note: "$0 verified revenue", empty: revInsufficient },
    { label: "Forecast", value: rev.forecastRevenue == null ? "—" : money(rev.forecastRevenue, rev.currency), note: "Separate from verified" },
    {
      label: "Organizations",
      value: organizations ? String(organizations.totalOrganizations) : "0",
      note: "Commercial accounts: " + String(organizations?.commercialAccounts ?? 0),
      empty: !organizations || organizations.evidenceStatus === "insufficient_evidence",
    },
    { label: "Relationship Edges", value: String(snapshot.relationshipEdgeCount), note: "Evidence-backed only", empty: insufficient },
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
            <p className="mt-2 text-2xl font-semibold text-white">{t.empty ? "—" : t.value}</p>
            {t.note && <p className="mt-1 text-xs text-white/45">{t.note}</p>}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[#c9a24a]">Matter Activity</p>
        {!matterState || matterState.evidenceStatus === "insufficient_evidence" ? (
          <p className="mt-2 text-sm text-white/50">Insufficient evidence — no canonical Matter records in range.</p>
        ) : (
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Total Matters", value: matterState.totalMatters },
              { label: "Active", value: matterState.activeMatters },
              { label: "Completed", value: matterState.completedMatters },
              { label: "Destinations", value: matterState.destinationsRepresented },
              { label: "Document Families", value: matterState.documentFamiliesRepresented },
              {
                label: "Avg Completion (days)",
                value:
                  matterState.averageCompletionMs == null
                    ? "—"
                    : Math.round(matterState.averageCompletionMs / 86_400_000),
              },
            ].map((t) => (
              <div key={t.label} className="min-w-0">
                <p className="text-xs text-white/45">{t.label}</p>
                <p className="text-lg font-semibold text-white">{String(t.value)}</p>
              </div>
            ))}
          </div>
        )}
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

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[#c9a24a]">Organizations by Geography</p>
        {!organizations || organizations.evidenceStatus === "insufficient_evidence" || organizations.byGeography.length === 0 ? (
          <p className="mt-2 text-sm text-white/50">Insufficient evidence — no canonical organization records in range.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm text-white/70">
            {organizations.byGeography.map((g) => (
              <li key={g.geography} className="flex justify-between gap-3">
                <span className="truncate">{g.geography}</span>
                <span className="text-white/50">{g.organizations}</span>
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
