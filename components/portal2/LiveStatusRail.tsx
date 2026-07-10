import type { PortalMatter } from "@/lib/portal2/types";
import { deriveStatusRail } from "@/lib/portal2/statusRail";
import { Panel, EmptyState, GOLD, GOLD_MID, INK, INK_DIM } from "./_ui";

export function LiveStatusRail({ matter }: { matter: PortalMatter | null }) {
  if (!matter) {
    return (
      <Panel title="Live Status" eyebrow="Where things stand">
        <EmptyState message="Your live status will appear here once your matter is active." />
      </Panel>
    );
  }

  const rail = deriveStatusRail(matter);
  const pct = Math.round(((rail.currentIndex + 1) / rail.totalSteps) * 100);

  return (
    <Panel title="Live Status" eyebrow="Where things stand">
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: GOLD }}>{rail.currentLabel}</span>
          <span style={{ fontSize: 11, fontFamily: "monospace", color: INK_DIM }}>
            Step {rail.currentIndex + 1} / {rail.totalSteps}
          </span>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: GOLD, borderRadius: 2, transition: "width 0.4s" }} />
        </div>
      </div>

      <div style={{ fontSize: 12, color: INK, lineHeight: 1.6 }}>
        {rail.nextStepLabel ? (
          <>
            <span style={{ color: INK_DIM }}>Next: </span>
            <span style={{ color: GOLD }}>{rail.nextStepLabel}</span> — {rail.nextStepDescription}
          </>
        ) : (
          rail.nextStepDescription
        )}
      </div>

      {rail.awaitingPayment && (
        <div
          style={{
            marginTop: 12,
            padding: "8px 12px",
            borderRadius: 4,
            background: "rgba(198,165,90,0.06)",
            border: `1px solid ${GOLD_MID}`,
            fontSize: 11.5,
            color: GOLD,
          }}
        >
          Scheduling unlocks only after payment is confirmed by the platform. This status is read-only.
        </div>
      )}
    </Panel>
  );
}
