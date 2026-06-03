export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Relationship Intelligence — Milano Seal",
};

interface Deal {
  client_name: string | null;
  client_email: string | null;
  total_price: number | null;
  payment_status: string | null;
  referral_source: string | null;
  created_at: string | null;
}

function inferRelationshipType(referralSource: string | null): string {
  if (!referralSource) return "Individual";
  const src = referralSource.toLowerCase();
  if (src.includes("attorney") || src.includes("lawyer") || src.includes("law firm") || src.includes("esq")) return "Attorney";
  if (src.includes("corp") || src.includes("llc") || src.includes("inc") || src.includes("company") || src.includes("business")) return "Corporate";
  if (src.includes("referral") || src.includes("partner") || src.includes("affiliate") || src.includes("agent")) return "Referral Partner";
  return "Individual";
}

const BADGE_COLORS: Record<string, string> = {
  Attorney: "#C6A55A",
  Corporate: "#4a9e6b",
  "Individual": "rgba(255,255,255,0.5)",
  "Referral Partner": "#f59e0b",
  Other: "rgba(255,255,255,0.3)",
};

export default async function ProspectsPage() {
  await requireDashboardAccess();

  const supabase = createAdminClient();

  interface ContactEntry {
    name: string;
    email: string;
    totalMatters: number;
    totalSpend: number;
    lastActivity: string | null;
    relationshipType: string;
  }

  let contacts: ContactEntry[] = [];
  let categoryCounts = { Attorney: 0, Corporate: 0, Individual: 0, "Referral Partner": 0 };

  try {
    const { data } = await supabase
      .from("deals")
      .select("client_name, client_email, total_price, payment_status, referral_source, created_at")
      .order("created_at", { ascending: false });

    const deals: Deal[] = data ?? [];

    const emailMap = new Map<string, ContactEntry>();
    for (const d of deals) {
      const email = d.client_email ?? "unknown";
      const existing = emailMap.get(email);
      const relType = inferRelationshipType(d.referral_source);
      const spend = d.payment_status === "paid" ? (d.total_price ?? 0) : 0;

      if (existing) {
        existing.totalMatters++;
        existing.totalSpend += spend;
        // keep most recent activity as last activity (already sorted desc so first is newest)
      } else {
        emailMap.set(email, {
          name: d.client_name ?? "—",
          email,
          totalMatters: 1,
          totalSpend: spend,
          lastActivity: d.created_at,
          relationshipType: relType,
        });
      }
    }

    contacts = Array.from(emailMap.values()).sort((a, b) => b.totalSpend - a.totalSpend);

    for (const c of contacts) {
      const t = c.relationshipType as keyof typeof categoryCounts;
      if (t in categoryCounts) categoryCounts[t]++;
    }
  } catch {}

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

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

  return (
    <div style={{ padding: "32px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 4px" }}>
          MILANO SEAL / RELATIONSHIP INTELLIGENCE
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)", margin: "0 0 32px" }}>
          Relationship Intelligence
        </h1>

        {/* Category breakdown */}
        <div style={{ display: "flex", gap: 16, marginBottom: 36, flexWrap: "wrap" }}>
          {Object.entries(categoryCounts).map(([type, count]) => (
            <div
              key={type}
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
                {type}
              </p>
              <p style={{ fontSize: 24, fontWeight: 700, color: BADGE_COLORS[type] ?? "#C6A55A", margin: 0, fontFamily: "monospace" }}>
                {count}
              </p>
            </div>
          ))}
        </div>

        {/* Contact registry table */}
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 10px" }}>
          CONTACT REGISTRY
        </p>
        <div style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)", borderRadius: 8, overflow: "hidden", marginBottom: 20 }}>
          {contacts.length === 0 ? (
            <p style={{ padding: 24, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", fontSize: 12, margin: 0, textAlign: "center" }}>
              No contact records found.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Name", "Email", "Matters", "Total Spend", "Last Activity", "Relationship"].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr key={c.email}>
                      <td style={{ ...tdBase, color: "rgba(255,255,255,0.85)" }}>{c.name}</td>
                      <td style={{ ...tdBase, color: "rgba(255,255,255,0.5)" }}>{c.email}</td>
                      <td style={{ ...tdBase, color: "rgba(255,255,255,0.35)" }}>{c.totalMatters}</td>
                      <td style={{ ...tdBase, color: "#C6A55A", fontWeight: 600 }}>{fmt(c.totalSpend)}</td>
                      <td style={{ ...tdBase, color: "rgba(255,255,255,0.35)" }}>
                        {c.lastActivity ? new Date(c.lastActivity).toLocaleDateString() : "—"}
                      </td>
                      <td style={{ ...tdBase }}>
                        <span style={{
                          fontSize: 10,
                          fontFamily: "monospace",
                          color: BADGE_COLORS[c.relationshipType] ?? "rgba(255,255,255,0.5)",
                          background: "rgba(255,255,255,0.04)",
                          border: `1px solid ${BADGE_COLORS[c.relationshipType] ?? "rgba(255,255,255,0.1)"}30`,
                          borderRadius: 4,
                          padding: "2px 8px",
                        }}>
                          {c.relationshipType}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>
          Relationship type is inferred from referral source field. Update individual records in the matter detail view.
        </p>
      </div>
    </div>
  );
}
