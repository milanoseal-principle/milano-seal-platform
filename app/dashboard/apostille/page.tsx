export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Apostille Tracker — Milano Seal",
};

interface ApostilleMatter {
  id: string;
  client_name: string | null;
  destination_country: string | null;
  matter_status: string | null;
  apostille_at: string | null;
  scheduled_at: string | null;
}

export default async function ApostillePage() {
  await requireDashboardAccess();

  const supabase = createAdminClient();

  let matters: ApostilleMatter[] = [];

  try {
    const { data } = await supabase
      .from("deals")
      .select("id, client_name, destination_country, matter_status, apostille_at, scheduled_at")
      .eq("apostille_required", true)
      .order("created_at", { ascending: false });
    matters = data ?? [];
  } catch {}

  const pending = matters.filter(
    (m) => !m.apostille_at && m.matter_status !== "completed" && m.matter_status !== "released"
  );
  const submitted = matters.filter((m) => m.apostille_at != null);
  const completed = matters.filter(
    (m) => m.matter_status === "completed" || m.matter_status === "released"
  );

  const statusColor = (m: ApostilleMatter) => {
    if (m.matter_status === "completed" || m.matter_status === "released")
      return { color: "#4a9e6b", bg: "rgba(74,158,107,0.08)", label: "Completed" };
    if (m.apostille_at)
      return { color: "#C6A55A", bg: "rgba(198,165,90,0.08)", label: "Submitted" };
    return { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", label: "Pending" };
  };

  return (
    <div style={{ padding: "32px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 4px" }}>
          MILANO SEAL / APOSTILLE TRACKER
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)", margin: "0 0 24px" }}>
          Apostille Submission Tracker
        </h1>

        {/* Stat chips */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
          {[
            { label: "Pending Apostille", count: pending.length, color: "#f59e0b" },
            { label: "Submitted", count: submitted.length, color: "#C6A55A" },
            { label: "Completed", count: completed.length, color: "#4a9e6b" },
          ].map((chip) => (
            <div
              key={chip.label}
              style={{
                background: "rgba(8,5,1,0.97)",
                border: `1px solid ${chip.color}22`,
                borderRadius: 6,
                padding: "12px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <span style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)" }}>
                {chip.label}
              </span>
              <span style={{ fontSize: 26, fontWeight: 700, color: chip.color, lineHeight: 1 }}>
                {chip.count}
              </span>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(212,175,55,0.08)" }}>
            <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: 0 }}>
              APOSTILLE-REQUIRED MATTERS
            </p>
          </div>
          {matters.length === 0 ? (
            <p style={{ padding: 32, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", fontSize: 12, margin: 0, textAlign: "center" }}>
              No apostille-required matters found.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Client", "Destination", "Matter Status", "Apostille Submitted", "Scheduled", "Apostille Status"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 16px",
                          textAlign: "left",
                          fontFamily: "monospace",
                          fontSize: 9,
                          letterSpacing: "0.28em",
                          textTransform: "uppercase",
                          color: "rgba(198,165,90,0.5)",
                          borderBottom: "1px solid rgba(212,175,55,0.06)",
                          fontWeight: 400,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matters.map((m) => {
                    const s = statusColor(m);
                    return (
                      <tr key={m.id} style={{ borderBottom: "1px solid rgba(212,175,55,0.04)" }}>
                        <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.85)", fontSize: 13 }}>{m.client_name ?? "—"}</td>
                        <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{m.destination_country ?? "—"}</td>
                        <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "monospace" }}>{m.matter_status ?? "—"}</td>
                        <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.35)", fontSize: 12, fontFamily: "monospace" }}>
                          {m.apostille_at ? new Date(m.apostille_at).toLocaleDateString() : "—"}
                        </td>
                        <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.35)", fontSize: 12, fontFamily: "monospace" }}>
                          {m.scheduled_at ? new Date(m.scheduled_at).toLocaleDateString() : "—"}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: 11, fontFamily: "monospace", color: s.color, background: s.bg, padding: "2px 8px", borderRadius: 4 }}>
                            {s.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
