// UploadCenterPanel — PRESENTATIONAL ONLY.
// This intentionally does NOT wire real upload or storage. It is a UI shell.

import { Panel, GOLD, GOLD_FAINT, INK, INK_DIM } from "./_ui";

export function UploadCenterPanel() {
  return (
    <Panel title="Upload Center" eyebrow="Documents">
      <div
        style={{
          border: `1px dashed ${GOLD_FAINT}`,
          borderRadius: 8,
          padding: "28px 20px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 26, color: GOLD, marginBottom: 10 }}>⤒</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
          Securely upload documents for your matter
        </div>
        <div style={{ fontSize: 11.5, color: INK, lineHeight: 1.5, maxWidth: 380, margin: "0 auto" }}>
          Drag and drop, or select files. Your coordinator will confirm receipt.
        </div>
        <button
          disabled
          style={{
            marginTop: 16,
            fontSize: 11,
            fontFamily: "monospace",
            letterSpacing: "0.06em",
            padding: "8px 18px",
            borderRadius: 4,
            border: `1px solid ${GOLD_FAINT}`,
            background: "rgba(198,165,90,0.05)",
            color: "rgba(255,255,255,0.35)",
            cursor: "not-allowed",
          }}
        >
          Select Files
        </button>
        <div style={{ fontSize: 10, color: INK_DIM, marginTop: 12, fontFamily: "monospace", letterSpacing: "0.08em" }}>
          UI PREVIEW — UPLOAD NOT YET ENABLED
        </div>
      </div>
    </Panel>
  );
}
