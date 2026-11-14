import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import { FounderRevenueCommand } from "@/components/dashboard/revenue/FounderRevenueCommand";
import { UnifiedRevenueCommandCenter } from "@/components/dashboard/revenue/UnifiedRevenueCommandCenter";
import { resolveServerRole } from "@/lib/auth/server-role";

export const metadata: Metadata = {
  title: "Revenue Close Desk | The Milano Seal™",
  robots: { index: false, follow: false },
};

const ADMIN_ROLES = new Set(["admin", "operator", "superadmin", "founder_admin", "admin_operator", "ops_manager"]);

const STAGES = [
  { id: "new_intake", label: "New Intake", status: ["new", "intake_review"] },
  { id: "quote_needed", label: "Quote Needed", status: ["quote_needed"] },
  { id: "invoice_sent", label: "Invoice Sent", status: ["invoice_sent"] },
  { id: "payment_pending", label: "Payment Pending", status: ["awaiting_payment"] },
  { id: "in_progress", label: "In Progress", status: ["open", "scheduled", "in_execution", "apostille", "shipped"] },
  { id: "delivered", label: "Delivered", status: ["delivered"] },
  { id: "closed", label: "Closed", status: ["completed", "released"] },
];

export default async function RevenuePage() {
  const serverClient = await createClient();
  const { data: { user }, error: authError } = await serverClient.auth.getUser();
  if (authError || !user) redirect("/login");

  // Role comes from the authoritative server-side resolver; there is no profiles table.
  if (!ADMIN_ROLES.has(await resolveServerRole(user))) redirect("/dashboard");

  const supabase = createAdminClient();
  const { data: deals } = await supabase
    .from("deals")
    .select("id, deal_status, document_type, destination_country, created_at, client_name")
    .order("created_at", { ascending: false });

  const staged = STAGES.map(stage => ({
    ...stage,
    items: (deals ?? []).filter(d => stage.status.includes(d.deal_status ?? "")),
  }));

  return (
    <div className="min-h-screen p-6" style={{ background: "#060402" }}>
      <div className="mb-8">
        <p className="font-mono text-[10px] tracking-[0.25em] uppercase mb-1" style={{ color: "rgba(212,175,55,0.5)" }}>Dashboard · Revenue</p>
        <h1 className="font-serif text-2xl text-white tracking-wide">Revenue Close Desk</h1>
      </div>

      <div className="mb-8">
        <FounderRevenueCommand />
      </div>

      <div className="mb-8">
        <UnifiedRevenueCommandCenter />
      </div>

      {!deals || deals.length === 0 ? (
        <div className="rounded border px-6 py-12 text-center" style={{ borderColor: "rgba(212,175,55,0.12)", background: "rgba(255,255,255,0.02)" }}>
          <p className="font-mono text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>No Data Yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {staged.map(stage => (
            <div key={stage.id} className="rounded border p-4" style={{ borderColor: "rgba(212,175,55,0.12)", background: "rgba(255,255,255,0.02)" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-[9px] tracking-[0.2em] uppercase" style={{ color: "rgba(212,175,55,0.5)" }}>{stage.label}</p>
                <span className="font-mono text-[11px] font-bold" style={{ color: stage.items.length > 0 ? "#D4AF37" : "rgba(255,255,255,0.2)" }}>
                  {stage.items.length}
                </span>
              </div>
              <div className="space-y-2">
                {stage.items.slice(0, 5).map(item => (
                  <div key={item.id} className="px-2 py-1.5 rounded" style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.08)" }}>
                    <p className="font-mono text-[10px] truncate" style={{ color: "rgba(255,255,255,0.6)" }}>
                      {item.client_name ?? item.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="font-mono text-[9px]" style={{ color: "rgba(212,175,55,0.4)" }}>
                      {item.document_type ?? "—"} · {item.destination_country ?? "—"}
                    </p>
                  </div>
                ))}
                {stage.items.length > 5 && (
                  <p className="font-mono text-[9px] text-center" style={{ color: "rgba(255,255,255,0.25)" }}>+{stage.items.length - 5} more</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
