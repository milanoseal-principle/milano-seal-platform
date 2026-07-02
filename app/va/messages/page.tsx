export const dynamic = "force-dynamic";

import { requireVAAccess } from "@/lib/vaAuth";

export const metadata = {
  title: "Messages | Operations Desk",
  robots: { index: false, follow: false },
};

export default async function VAMessagesPage() {
  const { role } = await requireVAAccess();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <p className="text-[9px] font-mono tracking-[0.3em]" style={{ color: "rgba(212,175,55,0.4)" }}>
          {role.replace(/_/g, " ").toUpperCase()} · MESSAGES
        </p>
        <h1 className="text-xl font-light mt-1" style={{ color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-playfair),Georgia,serif" }}>
          Message Studio
        </h1>
        <p className="text-[10px] font-mono mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
          Draft and review client-safe coordinator messages.
        </p>
      </div>

      <div style={{
        padding: 32,
        border: "1px solid rgba(198,165,90,0.14)",
        borderRadius: 12,
        background: "rgba(11,11,11,0.8)",
        textAlign: "center",
      }}>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, margin: 0 }}>
          This module is not yet available. Client-safe coordinator messaging is managed through your
          operator until Message Studio is enabled.
        </p>
      </div>

      <div style={{
        padding: "12px 18px",
        border: "1px solid rgba(198,165,90,0.16)",
        borderRadius: 10,
        background: "rgba(198,165,90,0.04)",
        fontSize: 11,
        color: "rgba(198,165,90,0.6)",
        lineHeight: 1.6,
      }}>
        VA rule: All client messages must be reviewed and approved by Nicholas before sending.
        Do not send messages directly without operator approval.
      </div>
    </div>
  );
}
