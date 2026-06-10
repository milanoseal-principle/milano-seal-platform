import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import { WisePaymentCard } from "@/components/portal/WisePaymentCard";

export const metadata: Metadata = {
  title: "Matter Room | The Milano Seal™",
  robots: { index: false, follow: false },
};

// Safe fields only — never expose internal fields
const SAFE_MATTER_FIELDS = [
  "id", "matter_reference", "deal_status", "release_status",
  "payment_status", "payment_confirmed", "paid_at", "currency",
  "wise_reference", "wise_payment_url", "amount_due",
  "document_type", "destination_country", "total_price",
  "receiving_authority", "created_at", "updated_at",
  "client_name", "estimated_completion_date",
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
    id: string; matter_reference?: string | null; deal_status?: string | null;
    release_status?: string | null; payment_status?: string | null;
    payment_confirmed?: boolean | null; paid_at?: string | null;
    currency?: string | null; wise_reference?: string | null;
    wise_payment_url?: string | null; amount_due?: number | null;
    total_price?: number | null;
    document_type?: string | null; destination_country?: string | null;
    receiving_authority?: string | null; created_at?: string | null;
    updated_at?: string | null; client_name?: string | null;
    estimated_completion_date?: string | null;
  };
  let matter: MatterRow | null = null;
  if (matter_id) {
    const { data } = await supabase
      .from("deals")
      .select(SAFE_MATTER_FIELDS)
      .eq("id", matter_id)
      .eq("client_email", user.email)
      .single();
    matter = data as unknown as MatterRow | null;
  }

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
              {matter.matter_reference ?? matter.id?.slice(0, 8).toUpperCase()} · {matter.document_type ?? "Document Matter"}
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
                  { label: "Status", value: matter.deal_status ?? "—" },
                  { label: "Payment", value: matter.payment_status ?? "—" },
                  { label: "Release", value: matter.release_status ?? "—" },
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

            {/* Receiving Authority */}
            {matter.receiving_authority && (
              <div className="rounded border p-6" style={{ borderColor: "rgba(212,175,55,0.12)", background: "rgba(255,255,255,0.02)" }}>
                <p className="font-mono text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: "rgba(212,175,55,0.4)" }}>Receiving Authority</p>
                <p className="text-white font-medium">{matter.receiving_authority}</p>
              </div>
            )}

            {/* Payment Card */}
            {(matter.payment_status !== "paid" && !matter.payment_confirmed) || matter.wise_reference ? (
              <div>
                <p className="font-mono text-[9px] tracking-[0.2em] uppercase mb-3" style={{ color: "rgba(212,175,55,0.4)" }}>Payment</p>
                <WisePaymentCard
                  amountDue={matter.amount_due ?? matter.total_price ?? 0}
                  currency={matter.currency ?? "USD"}
                  paymentStatus={matter.payment_confirmed ? "paid" : (matter.payment_status ?? "awaiting_payment")}
                  wiseReference={
                    matter.wise_reference ??
                    `MS-${matter.id.slice(0, 8).toUpperCase()}`
                  }
                  wisePaymentUrl={matter.wise_payment_url ?? null}
                  paidAt={matter.paid_at ?? null}
                />
              </div>
            ) : null}

            {/* Release Readiness */}
            <div className="rounded border p-6" style={{ borderColor: "rgba(212,175,55,0.12)", background: "rgba(255,255,255,0.02)" }}>
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase mb-4" style={{ color: "rgba(212,175,55,0.4)" }}>Release Readiness</p>
              {matter.payment_status === "paid" && matter.release_status === "released" ? (
                <p className="font-mono text-sm" style={{ color: "#22c55e" }}>✓ Documents released. Contact your coordinator for delivery confirmation.</p>
              ) : (matter.payment_status !== "paid" && !matter.payment_confirmed) ? (
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
                The Milano Seal provides document coordination, notarization, apostille/authentication routing review, courier custody, and release support. This service does not provide legal advice.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
