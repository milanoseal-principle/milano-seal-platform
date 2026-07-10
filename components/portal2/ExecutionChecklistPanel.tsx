import type { PortalMatter } from "@/lib/portal2/types";
import { Panel, EmptyState, StateDot, GOLD, INK, INK_DIM } from "./_ui";

export function ExecutionChecklistPanel({ matter }: { matter: PortalMatter | null }) {
  const items = matter?.executionChecklist ?? [];

  return (
    <Panel title="Execution Checklist" eyebrow="Preparation">
      {items.length === 0 ? (
        <EmptyState message="Your execution checklist will appear here once your session is scheduled." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <StateDot state={item.state} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, color: item.state === "pending" ? INK : "rgba(255,255,255,0.8)" }}>
                  {item.label}
                  {item.clientAction && (
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 9,
                        fontFamily: "monospace",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: GOLD,
                      }}
                    >
                      Action needed
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11.5, color: INK_DIM, lineHeight: 1.5, marginTop: 2 }}>
                  {item.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
