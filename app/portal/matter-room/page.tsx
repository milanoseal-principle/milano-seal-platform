import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import { WisePaymentCard } from "@/components/portal/WisePaymentCard";
import { buildWisePaymentUrl } from "@/lib/payments/wiseUrl";

export const metadata: Metadata = {
  title: "Matter Room | The Milano Seal™",
  robots: { index: false, follow: false },
};

// Safe fields only — never expose internal fields.
// Restricted to columns guaranteed to exist in the live deals table;
// optional columns (currency, wise_payment_url, amount_due) are derived
// with in-app fallbacks so a missing column can't fail the whole select.
const SAFE_MATTER_FIELDS = [
  "id", "status", "payment_status",
  "wise_reference", "document_type", "destination_country",
  "total_price", "created_at", "updated_at", "client_name",
].join(", ");

export default async function MatterRoomPage({
  searchParams,
}: {
  searchParams: Promise<{ matter_id?: string }>;
}) {
  const { matter_id } = await searchParams;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "client") redirect("/portal");

  type MatterRow = {
    id: string; status?: string | null; payment_status?: string | null;
    wise_reference?: string | null; total_price?: number | null;
    document_type?: string | null; destination_country?: string | null;
    created_at?: string | null; updated_at?: string | null;
    client_name?: string | null;
  };
  let matter: MatterRow | null = null;
  if (matter_id) {
    const { data } = await supabase
      .from("deals")
      .select(SAFE_MATTER_FIELDS)
      .eq("id", matter_id)
      .ilike("email", user.email ?? "")
      .single();
    matter = data as unknown as MatterRow | null;
  }

  const matterPaid = matter?.payment_status === "paid";

  const statusColor = (s: string) => {
    if (s === "completed" || s === "released") return "#22c55e";
    if (s === "on_hold" || s === "blocked") return "#f59e0b";
    if (s === "payment_failed") return "#ef4444";
    return "#D4AF37";
  };

  return (
    <div className="min-h-screen" style={{ background: "#060402" }}>
      {/* Concierge Header */}
      <div className="border-b" style={{ borderColor: "rgba(212,175,55,0.12)", background: "rgba(212,175,55,0.04)" }}>
        <div className="max-w-4xl mx-auto px-6 py-8">
          <p className="font-mono text-[10px] tracking-[0.25em] uppercase mb-2" style={{ color: "rgba(212,175,55,0.5)" }}>
            Private Client · Matter Room
          </p>
          <h1 className="font-serif text-2xl text-white tracking-wide">
            {profile.full_name ?? "Your Matter"}
          </h1>
          {matter && (
            <p className="font-mono text-xs mt-1" style={{ color: "rgba(212,175,55,0.6)" }}>
              {matter.id?.slice(0, 8).toUpperCase()} · {matter.document_type ?? "Document Matter"}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {!matter ? (
          <div className="rounded border px-6 py-10 text-center" style={{ borderColor: "rgba(212,175,55,0.12)", background: "rgba(255,255,255,0.02)" }}>
            <p className="font-mono text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>No matter selected.</p>
          </div>
        ) : (
          <>
            {/* Matter Status */}
            <div className="rounded border p-6" style={{ borderColor: "rgba(212,175,55,0.12)", background: "rgba(255,255,255,0.02)" }}>
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase mb-4" style={{ color: "rgba(212,175,55,0.4)" }}>Matter Status</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Status", value: matter.status ?? "—" },
                  { label: "Payment", value: matter.payment_status ?? "—" },
                  { label: "Document", value: matter.document_type ?? "—" },
                  { label: "Destination", value: matter.destination_country ?? "—" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="font-mono text-[9px] tracking-widest uppercase mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</p>
                    <p className="font-mono text-sm font-medium" style={{ color: statusColor(value) }}>
                      {value.replace(/_/g, " ").toUpperCase()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Card */}
            <div>
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase mb-3" style={{ color: "rgba(212,175,55,0.4)" }}>Payment</p>
              <WisePaymentCard
                amountDue={matter.total_price ?? 0}
                currency="USD"
                paymentStatus={matter.payment_status ?? "awaiting_payment"}
                wiseReference={
                  matter.wise_reference ??
                  `MS-${matter.id.slice(0, 8).toUpperCase()}`
                }
                wisePaymentUrl={buildWisePaymentUrl({
                  wiseReference:
                    matter.wise_reference ??
                    `MS-${matter.id.slice(0, 8).toUpperCase()}`,
                  amountDue: matter.total_price ?? 0,
                })}
                paidAt={null}
              />
            </div>

            {/* Release Readiness */}
            <div className="rounded border p-6" style={{ borderColor: "rgba(212,175,55,0.12)", background: "rgba(255,255,255,0.02)" }}>
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase mb-4" style={{ color: "rgba(212,175,55,0.4)" }}>Release Readiness</p>
              {matterPaid && matter.status === "released" ? (
                <p className="font-mono text-sm" style={{ color: "#22c55e" }}>✓ Documents released. Contact your coordinator for delivery confirmation.</p>
              ) : !matterPaid ? (
                <p className="font-mono text-sm" style={{ color: "#f59e0b" }}>Payment Required — Complete payment above to unlock scheduling and document release.</p>
              ) : (
                <p className="font-mono text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Release pending operator review.</p>
              )}
            </div>

            {/* Coordinator Card */}
            <div className="rounded border p-6" style={{ borderColor: "rgba(212,175,55,0.12)", background: "rgba(255,255,255,0.02)" }}>
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase mb-3" style={{ color: "rgba(212,175,55,0.4)" }}>Your Coordinator</p>
              <p className="text-white font-medium">The Milano Seal™</p>
              <p className="font-mono text-xs mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>contact@themilanoseal.com</p>
              <p className="font-mono text-[10px] mt-3" style={{ color: "rgba(255,255,255,0.3)" }}>
                The Milano Seal provides document coordination, notarization, apostille/authentication routing review, courier custody, and release support. This service does not provide legal guidance.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
