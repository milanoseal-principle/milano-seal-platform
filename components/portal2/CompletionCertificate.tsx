import type { PortalMatter } from "@/lib/portal2/types";
import { Panel, EmptyState, GOLD, GOLD_FAINT, INK, INK_DIM, fmtDate } from "./_ui";

export function CompletionCertificate({ matter }: { matter: PortalMatter | null }) {
  const cert = matter?.completionCertificate ?? null;

  if (!cert || !cert.available) {
    return (
      <Panel title="Certificate of Completion" eyebrow="Custody record">
        <EmptyState message="Your Certificate of Completion will be available here once your matter is completed." />
      </Panel>
    );
  }

  const rows: Array<[string, string]> = [
    ["Matter", cert.matterDisplayId],
    ["Client", cert.clientName ?? "—"],
    ["Document", cert.documentType ?? "—"],
    ["Destination", cert.destinationCountry ?? "—"],
    ["Completed", fmtDate(cert.completedAt)],
    ["Certificate ID", cert.certificateId ?? "—"],
  ];

  return (
    <Panel title="Certificate of Completion" eyebrow="Custody record">
      <div
        style={{
          border: `1px solid ${GOLD_FAINT}`,
          borderRadius: 8,
          padding: "20px 22px",
          background: "linear-gradient(135deg, rgba(198,165,90,0.05) 0%, rgba(255,255,255,0.01) 100%)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 22, color: GOLD }}>✦</div>
          <div
            style={{
              fontSize: 13,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: GOLD,
              fontFamily: "var(--font-serif, Georgia, serif)",
              marginTop: 6,
            }}
          >
            The Milano Seal™
          </div>
          <div style={{ fontSize: 10.5, color: INK_DIM, fontFamily: "monospace", marginTop: 2 }}>
            Certificate of Completion
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {rows.map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${GOLD_FAINT}` }}>
              <span style={{ fontSize: 11.5, color: INK_DIM }}>{k}</span>
              <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.8)", fontFamily: "monospace" }}>{v}</span>
            </div>
          ))}
        </div>

        {cert.verificationUrl && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <a
              href={cert.verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 11,
                fontFamily: "monospace",
                letterSpacing: "0.06em",
                color: GOLD,
                border: `1px solid ${GOLD_FAINT}`,
                borderRadius: 3,
                padding: "7px 16px",
                textDecoration: "none",
                background: "rgba(198,165,90,0.06)",
              }}
            >
              Verify Certificate
            </a>
          </div>
        )}
      </div>
      <div style={{ fontSize: 10, color: INK, marginTop: 10, lineHeight: 1.5, textAlign: "center" }}>
        This certificate records custody and completion. It is not legal advice and does not guarantee acceptance by any authority.
      </div>
    </Panel>
  );
}
