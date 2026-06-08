export const dynamic = "force-dynamic";

import { requireVAAccess } from "@/lib/vaAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Document Workspace | Operations Desk",
  robots: { index: false, follow: false },
};

async function getDocumentTasks(userId: string) {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("va_tasks")
      .select("id, title, status, due_at, urgency, priority, task_type, matter_id")
      .eq("assigned_to", userId)
      .in("task_type", ["document_prep", "translation_review"])
      .order("due_at", { ascending: true, nullsFirst: false });
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function VADocumentsPage() {
  const { userId, role } = await requireVAAccess();
  const tasks = await getDocumentTasks(userId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <p className="text-[9px] font-mono tracking-[0.3em]" style={{ color: "rgba(212,175,55,0.4)" }}>
          {role.replace(/_/g, " ").toUpperCase()} · DOCUMENTS
        </p>
        <h1 className="text-xl font-light mt-1" style={{ color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-playfair),Georgia,serif" }}>
          Document Workspace
        </h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4, margin: "4px 0 0" }}>
          Document preparation and checklist tasks assigned to you.
        </p>
      </div>

      {tasks.length === 0 ? (
        <div style={{
          padding: 32,
          border: "1px solid rgba(198,165,90,0.14)",
          borderRadius: 12,
          background: "rgba(11,11,11,0.8)",
          textAlign: "center",
        }}>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, margin: 0 }}>
            No document tasks assigned.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tasks.map((item) => (
            <div key={item.id} style={{
              padding: "14px 18px",
              border: "1px solid rgba(198,165,90,0.18)",
              borderRadius: 10,
              background: "rgba(11,11,11,0.9)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, color: "#F6F1E6", fontWeight: 500 }}>{item.title}</p>
                {item.matter_id && (
                  <p style={{ margin: "3px 0 0", fontSize: 10, color: "rgba(198,165,90,0.5)", fontFamily: "monospace" }}>
                    {item.matter_id}
                  </p>
                )}
                <p style={{ margin: "3px 0 0", fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: "monospace", letterSpacing: "0.1em" }}>
                  {item.task_type}
                </p>
              </div>
              <span style={{
                fontSize: 9,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                padding: "4px 10px",
                borderRadius: 999,
                border: "1px solid rgba(198,165,90,0.3)",
                color: item.status === "complete" || item.status === "completed" ? "#3FA47A" : "#C6A55A",
                whiteSpace: "nowrap",
              }}>
                {item.status ?? "open"}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{
        padding: "12px 16px",
        border: "1px solid rgba(198,165,90,0.1)",
        borderRadius: 8,
        background: "rgba(11,11,11,0.5)",
      }}>
        <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "monospace", letterSpacing: "0.08em" }}>
          VA RULE — Document tasks only. VA may not release or approve documents.
        </p>
      </div>
    </div>
  );
}
