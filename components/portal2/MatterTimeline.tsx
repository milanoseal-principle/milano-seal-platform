import type { PortalMatter } from "@/lib/portal2/types";
import { buildMatterTimeline } from "@/lib/portal2/matterTimeline";
import { Panel, EmptyState, StateDot, GOLD, GOLD_FAINT, INK, INK_DIM, fmtDate } from "./_ui";

export function MatterTimeline({ matter }: { matter: PortalMatter | null }) {
  if (!matter) {
    return (
      <Panel title="Matter Timeline" eyebrow="Journey">
        <EmptyState message="Your matter timeline will appear here once your matter is active." />
      </Panel>
    );
  }

  const events = buildMatterTimeline(matter);

  return (
    <Panel title="Matter Timeline" eyebrow="Journey">
      <div style={{ position: "relative" }}>
        {events.map((ev, i) => (
          <div key={ev.id} style={{ display: "flex", gap: 14, position: "relative" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <StateDot state={ev.state} />
              {i < events.length - 1 && (
                <div
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 24,
                    background: ev.state === "complete" ? GOLD : GOLD_FAINT,
                    margin: "2px 0",
                  }}
                />
              )}
            </div>
            <div style={{ paddingBottom: 16, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: ev.state === "current" ? 600 : 500,
                  color: ev.state === "upcoming" ? "rgba(255,255,255,0.3)" : GOLD,
                  fontFamily: "var(--font-serif, Georgia, serif)",
                }}
              >
                {ev.label}
              </div>
              <div style={{ fontSize: 11.5, color: INK, lineHeight: 1.5, marginTop: 3 }}>
                {ev.description}
              </div>
              <div style={{ fontSize: 10.5, color: INK_DIM, fontFamily: "monospace", marginTop: 4 }}>
                {ev.timestamp ? fmtDate(ev.timestamp) : ev.state === "upcoming" ? "Upcoming" : "In progress"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
