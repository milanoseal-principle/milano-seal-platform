export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";

export const metadata = {
  title: "Operator Runbook — Milano Seal",
};

const DAILY_CHECKLIST = [
  "Check follow-ups due today",
  "Review execution-control queue",
  "Process any pending releases",
  "Check payment reconciliation",
  "Update matter statuses",
];

const WEEKLY_CHECKLIST = [
  "Review authority confidence levels",
  "Update country intelligence",
  "Audit alliance scoreboard",
  "Review rejection patterns",
  "Generate weekly revenue report",
];

const SOPS = [
  {
    title: "New Matter Intake SOP",
    id: "intake",
  },
  {
    title: "Payment Confirmation SOP",
    id: "payment",
  },
  {
    title: "Apostille Submission SOP",
    id: "apostille",
  },
  {
    title: "Document Release SOP",
    id: "release",
  },
  {
    title: "Client Communication SOP",
    id: "comms",
  },
];

export default async function RunbookPage() {
  await requireDashboardAccess();

  return (
    <div style={{ padding: "32px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 4px" }}>
          MILANO SEAL / OPERATOR RUNBOOK
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)", margin: "0 0 8px" }}>
          Daily &amp; Weekly Operator Playbook
        </h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, fontFamily: "monospace", margin: "0 0 36px" }}>
          &gt; Execution protocols for The Milano Seal™ operator console.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 36 }}>
          {/* Daily */}
          <div style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)", borderRadius: 8, padding: 24 }}>
            <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 16px" }}>
              DAILY CHECKLIST
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {DAILY_CHECKLIST.map((item, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: "#C6A55A", flexShrink: 0, marginTop: 1 }}>[ ]</span>
                  <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weekly */}
          <div style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)", borderRadius: 8, padding: 24 }}>
            <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 16px" }}>
              WEEKLY CHECKLIST
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {WEEKLY_CHECKLIST.map((item, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: "#f59e0b", flexShrink: 0, marginTop: 1 }}>[ ]</span>
                  <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* SOPs */}
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 16px" }}>
          STANDARD OPERATING PROCEDURES
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {SOPS.map((sop) => (
            <div
              key={sop.id}
              style={{
                background: "rgba(8,5,1,0.97)",
                border: "1px solid rgba(212,175,55,0.08)",
                borderRadius: 6,
                padding: "16px 20px",
              }}
            >
              <p style={{ fontFamily: "monospace", fontSize: 11, color: "#C6A55A", fontWeight: 600, margin: "0 0 6px" }}>
                {sop.title}
              </p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, fontFamily: "monospace", margin: 0 }}>
                &gt; See operator vault for full procedure.
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
