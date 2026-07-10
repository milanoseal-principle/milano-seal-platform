import type { PortalMatter } from "@/lib/portal2/types";
import { Panel, EmptyState, StateDot, GOLD, GOLD_FAINT, INK, INK_DIM, fmtDate } from "./_ui";

export function ApostilleTimelinePanel({ matter }: { matter: PortalMatter | null }) {
  const milestones = matter?.apostilleMilestones ?? [];

  return (
    <Panel title="Apostille Timeline" eyebrow="Authentication">
      {milestones.length === 0 ? (
        <EmptyState message="Apostille progress will appear here once your document enters apostille processing." />
      ) : (
        <div>
          {milestones.map((m, i) => (
            <div key={m.id} style={{ display: "flex", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <StateDot state={m.state} />
                {i < milestones.length - 1 && (
                  <div style={{ width: 2, flex: 1, minHeight: 20, background: m.state === "complete" ? GOLD : GOLD_FAINT, margin: "2px 0" }} />
                )}
              </div>
              <div style={{ paddingBottom: 14 }}>
                <div style={{ fontSize: 13, color: m.state === "upcoming" ? INK : "rgba(255,255,255,0.8)" }}>{m.label}</div>
                <div style={{ fontSize: 10.5, color: INK_DIM, fontFamily: "monospace", marginTop: 2 }}>
                  {(m.authority ?? "—")} · {m.timestamp ? fmtDate(m.timestamp) : m.state === "upcoming" ? "Upcoming" : "In progress"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
