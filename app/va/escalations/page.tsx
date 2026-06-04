export const dynamic = "force-dynamic";

import { requireVAAccess } from "@/lib/vaAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Escalations | Operations Desk",
  robots: { index: false, follow: false },
};

async function getEscalations(userId: string) {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("va_tasks")
      .select("id, title, status, due_at, urgency, priority, task_type, matter_id, notes_public, escalation_reason")
      .eq("assigned_to", userId)
      .eq("status", "escalated")
      .order("due_at", { ascending: true, nullsFirst: false });
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function VAEscalationsPage() {
  const { userId, role } = await requireVAAccess();
  const escalations = await getEscalations(userId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <p className="text-[9px] font-mono tracking-[0.3em]" style={{ color: "rgba(212,175,55,0.4)" }}>
          {role.replace(/_/g, " ").toUpperCase()} · ESCALATIONS
        </p>
        <h1 className="text-xl font-light mt-1" style={{ color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-playfair),Georgia,serif" }}>
          Escalation Queue
        </h1>
        <p className="text-[10px] font-mono mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
          Items flagged for operator review.
        </p>
      </div>

      {escalations.length === 0 ? (
        <div style={{
          padding: 32,
          border: "1px solid rgba(198,165,90,0.14)",
          borderRadius: 12,
          background: "rgba(11,11,11,0.8)",
          textAlign: "center",
        }}>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, margin: 0 }}>
            No escalations. Flagged tasks will appear here when escalated to operator.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {escalations.map((item) => (
            <div key={item.id} style={{
              padding: "14px 18px",
              border: "1px solid rgba(184,92,92,0.3)",
              borderRadius: 10,
              background: "rgba(184,92,92,0.04)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
            }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, color: "#F6F1E6", fontWeight: 500 }}>{item.title}</p>
                {item.matter_id && (
                  <p style={{ margin: "3px 0 0", fontSize: 10, color: "rgba(198,165,90,0.5)", fontFamily: "monospace" }}>
                    {item.matter_id}
                  </p>
                )}
                {(item.escalation_reason || item.notes_public) && (
                  <p style={{ margin: "6px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                    {item.escalation_reason ?? item.notes_public}
                  </p>
                )}
              </div>
              <span style={{
                fontSize: 9,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                padding: "4px 10px",
                borderRadius: 999,
                border: "1px solid rgba(184,92,92,0.4)",
                color: "#B85C5C",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}>
                Escalated
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
