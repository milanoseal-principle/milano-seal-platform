import type { PortalMatter } from "@/lib/portal2/types";
import { Panel, EmptyState, GOLD, GOLD_FAINT, INK, INK_DIM } from "./_ui";

export function CountryReadinessPanel({ matter }: { matter: PortalMatter | null }) {
  const readiness = matter?.countryReadiness ?? null;

  if (!readiness) {
    return (
      <Panel title="Destination Readiness" eyebrow="International use">
        <EmptyState message="Destination requirements will appear here once your destination country is confirmed." />
      </Panel>
    );
  }

  return (
    <Panel title="Destination Readiness" eyebrow="International use">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", fontFamily: "var(--font-serif, Georgia, serif)" }}>
          {readiness.destinationCountry}
        </span>
        <span style={{ fontSize: 11, color: readiness.hagueMember ? GOLD : INK }}>
          {readiness.hagueMember ? "Hague Apostille route" : "Consular legalization route"}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {readiness.requirements.map((r) => (
          <div
            key={r.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 0",
              borderBottom: `1px solid ${GOLD_FAINT}`,
            }}
          >
            <span style={{ color: r.met ? GOLD : "rgba(255,255,255,0.3)", fontSize: 13 }}>{r.met ? "✓" : "○"}</span>
            <span style={{ fontSize: 12.5, color: r.met ? "rgba(255,255,255,0.8)" : INK }}>{r.label}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 10.5, color: INK_DIM, marginTop: 12, lineHeight: 1.55 }}>
        {readiness.note} This information is a general guide and is not legal advice or a guarantee of acceptance by any authority.
      </div>
    </Panel>
  );
}
