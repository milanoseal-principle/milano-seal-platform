import type { PortalMatter, DocumentVaultItem } from "@/lib/portal2/types";
import { buildClientVault } from "@/lib/portal2/documentVault";
import { Panel, EmptyState, GOLD, GOLD_FAINT, INK, INK_DIM, fmtDate } from "./_ui";

const CATEGORY_LABELS: Record<DocumentVaultItem["category"], string> = {
  client_upload: "Your Upload",
  executed_document: "Executed Document",
  apostille: "Apostille",
  release_packet: "Release Packet",
  certificate: "Certificate",
};

const STATUS_LABELS: Record<DocumentVaultItem["status"], string> = {
  available: "Available",
  processing: "Processing",
  pending: "Pending",
};

export function DocumentVaultPanel({ matter }: { matter: PortalMatter | null }) {
  const items = matter ? buildClientVault(matter) : [];

  return (
    <Panel title="Document Vault" eyebrow="Your records">
      {items.length === 0 ? (
        <EmptyState message="No documents in your vault yet. Executed documents, apostilles, and release packets will appear here as your matter progresses." />
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
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{item.name}</div>
                <div style={{ fontSize: 10.5, color: INK_DIM, fontFamily: "monospace", marginTop: 2 }}>
                  {CATEGORY_LABELS[item.category]} · {fmtDate(item.availableAt)}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: item.status === "available" ? GOLD : INK }}>
                  {STATUS_LABELS[item.status]}
                </span>
                <button
                  disabled={!item.downloadable || item.status !== "available"}
                  style={{
                    fontSize: 10.5,
                    fontFamily: "monospace",
                    letterSpacing: "0.05em",
                    padding: "5px 12px",
                    borderRadius: 3,
                    border: `1px solid ${GOLD_FAINT}`,
                    background: "rgba(198,165,90,0.05)",
                    color: item.downloadable && item.status === "available" ? GOLD : "rgba(255,255,255,0.25)",
                    cursor: item.downloadable && item.status === "available" ? "pointer" : "not-allowed",
                  }}
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
