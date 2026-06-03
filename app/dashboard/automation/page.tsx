export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Automation Engine — Milano Seal",
};

interface Deal {
  payment_status: string | null;
  matter_status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const AUTOMATION_RULES = [
  {
    name: "Follow-up Day 1",
    trigger: "payment_status changes to 'paid'",
    action: "Schedule follow-up",
    status: "Active",
  },
  {
    name: "Follow-up Day 3",
    trigger: "Matter created 3 days ago, no status update",
    action: "Flag for operator review",
    status: "Active",
  },
  {
    name: "Stale Matter Alert",
    trigger: "matter_status unchanged for 7 days",
    action: "Alert in execution control",
    status: "Active",
  },
  {
    name: "Completion Review Request",
    trigger: "matter_status = 'completed'",
    action: "Queue review request",
    status: "Planned",
  },
  {
    name: "Payment Overdue Alert",
    trigger: "payment_status = 'unpaid' for 14 days",
    action: "Flag for operator",
    status: "Active",
  },
];

export default async function AutomationPage() {
  await requireDashboardAccess();

  const supabase = createAdminClient();

  let paidCount = 0;
  let completedCount = 0;
  let unpaidCount = 0;
  let staleCount = 0;
  let newThisWeek = 0;
  let overdueCount = 0;

  try {
    const { data } = await supabase
      .from("deals")
      .select("payment_status, matter_status, created_at, updated_at");

    const deals: Deal[] = data ?? [];
    const now = new Date();
    const d3ago = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const d7ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const d14ago = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    for (const d of deals) {
      const created = d.created_at ? new Date(d.created_at) : null;
      const updated = d.updated_at ? new Date(d.updated_at) : null;

      if (d.payment_status === "paid") paidCount++;
      if (d.matter_status === "completed") completedCount++;
      if (d.payment_status === "unpaid") {
        unpaidCount++;
        if (created && created <= d14ago) overdueCount++;
      }
      if (updated && updated <= d7ago && d.matter_status !== "completed" && d.matter_status !== "cancelled") staleCount++;
      if (created && created >= d3ago) newThisWeek++;
    }
  } catch {}

  const activeCount = AUTOMATION_RULES.filter((r) => r.status === "Active").length;
  const plannedCount = AUTOMATION_RULES.filter((r) => r.status === "Planned").length;
  const disabledCount = AUTOMATION_RULES.filter((r) => r.status === "Disabled").length;

  const thStyle: React.CSSProperties = {
    padding: "10px 16px",
    textAlign: "left",
    fontFamily: "monospace",
    fontSize: 9,
    letterSpacing: "0.28em",
    textTransform: "uppercase",
    color: "rgba(198,165,90,0.5)",
    borderBottom: "1px solid rgba(212,175,55,0.06)",
    fontWeight: 400,
  };

  const tdBase: React.CSSProperties = {
    padding: "11px 16px",
    fontSize: 12,
    fontFamily: "monospace",
    borderBottom: "1px solid rgba(212,175,55,0.04)",
  };

  const STATUS_STYLE: Record<string, { color: string; bg: string; border: string }> = {
    Active: { color: "#4a9e6b", bg: "rgba(74,158,107,0.08)", border: "rgba(74,158,107,0.3)" },
    Planned: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)" },
    Disabled: { color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)" },
  };

  return (
    <div style={{ padding: "32px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 4px" }}>
          MILANO SEAL / AUTOMATION ENGINE
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)", margin: "0 0 32px" }}>
          Automation Engine
        </h1>

        {/* Rule count summary */}
        <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
          {[
            { label: "Active Automations", value: activeCount, color: "#4a9e6b" },
            { label: "Planned", value: plannedCount, color: "#f59e0b" },
            { label: "Disabled", value: disabledCount, color: "#ef4444" },
          ].map((c) => (
            <div
              key={c.label}
              style={{
                flex: 1,
                minWidth: 140,
                background: "rgba(8,5,1,0.97)",
                border: "1px solid rgba(212,175,55,0.08)",
                borderRadius: 8,
                padding: "16px 20px",
              }}
            >
              <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 8px" }}>
                {c.label}
              </p>
              <p style={{ fontSize: 24, fontWeight: 700, color: c.color, margin: 0, fontFamily: "monospace" }}>
                {c.value}
              </p>
            </div>
          ))}
        </div>

        {/* Rules table */}
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 10px" }}>
          AUTOMATION RULE REGISTRY
        </p>
        <div style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)", borderRadius: 8, overflow: "hidden", marginBottom: 32 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Rule", "Trigger Condition", "Action", "Status"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AUTOMATION_RULES.map((rule) => {
                  const ss = STATUS_STYLE[rule.status] ?? STATUS_STYLE["Planned"];
                  return (
                    <tr key={rule.name}>
                      <td style={{ ...tdBase, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>{rule.name}</td>
                      <td style={{ ...tdBase, color: "rgba(255,255,255,0.55)" }}>{rule.trigger}</td>
                      <td style={{ ...tdBase, color: "#C6A55A" }}>{rule.action}</td>
                      <td style={{ ...tdBase }}>
                        <span style={{
                          fontSize: 10,
                          color: ss.color,
                          background: ss.bg,
                          border: `1px solid ${ss.border}`,
                          borderRadius: 4,
                          padding: "2px 8px",
                        }}>
                          {rule.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trigger stats from DB */}
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 12px" }}>
          CURRENT TRIGGER-ELIGIBLE STATES
        </p>
        <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { label: "Paid Deals (Day 1 eligible)", value: paidCount },
            { label: "New This 3 Days", value: newThisWeek },
            { label: "Stale Matters (7d+)", value: staleCount },
            { label: "Completed Matters", value: completedCount },
            { label: "Overdue Unpaid (14d+)", value: overdueCount },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                minWidth: 140,
                background: "rgba(8,5,1,0.97)",
                border: "1px solid rgba(212,175,55,0.08)",
                borderRadius: 8,
                padding: "14px 18px",
              }}
            >
              <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 6px" }}>
                {s.label}
              </p>
              <p style={{ fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.75)", margin: 0, fontFamily: "monospace" }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <p style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>
          Automation rules are operator-defined. No action executes without operator confirmation. Trigger conditions are advisory only.
        </p>
      </div>
    </div>
  );
}
