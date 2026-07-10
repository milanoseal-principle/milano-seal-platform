import type { PortalMatter } from "@/lib/portal2/types";
import { Panel, EmptyState, GOLD, GOLD_FAINT, INK, INK_DIM, fmtDate } from "./_ui";

export function FinalReleaseVault({ matter }: { matter: PortalMatter | null }) {
  const items = matter?.finalRelease ?? [];

  return (
    <Panel title="Final Release Vault" eyebrow="Completed records">
      {items.length === 0 ? (
        <EmptyState message="Your final release records will appear here once your documents have been released and delivered." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 6,
                border: `1px solid ${GOLD_FAINT}`,
                background: "rgba(255,255,255,0.01)",
              }}
            >
              <div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{item.label}</div>
                <div style={{ fontSize: 10.5, color: INK_DIM, fontFamily: "monospace", marginTop: 2 }}>
                  {item.released ? `Released · ${fmtDate(item.releasedAt)}` : "Pending release"}
                </div>
              </div>
              <button
                disabled={!item.downloadable || !item.released}
                style={{
                  fontSize: 10.5,
                  fontFamily: "monospace",
                  letterSpacing: "0.05em",
                  padding: "5px 12px",
                  borderRadius: 3,
                  border: `1px solid ${GOLD_FAINT}`,
                  background: "rgba(198,165,90,0.05)",
                  color: item.downloadable && item.released ? GOLD : "rgba(255,255,255,0.25)",
                  cursor: item.downloadable && item.released ? "pointer" : "not-allowed",
                }}
              >
                {item.released ? "Download" : "Locked"}
              </button>
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize: 10.5, color: INK, marginTop: 12, lineHeight: 1.5 }}>
        Release records are made available only after payment is confirmed and documents are released by the platform.
      </div>
    </Panel>
  );
}
