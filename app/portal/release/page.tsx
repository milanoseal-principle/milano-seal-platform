export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MilanoReleaseSeal } from "@/components/orbit/MilanoReleaseSeal";

export const metadata = {
  title: "Release Review | The Milano Seal™",
  robots: { index: false, follow: false },
};

async function getReleaseMatter() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // Canonical ownership: the authenticated (confirmed) email must equal the
  // Matter's stored email. RLS (client_own_deal) enforces this; the explicit
  // email filter is belt-and-suspenders and fails closed on a missing email.
  const email = user?.email?.trim().toLowerCase();
  if (!email) return null;

  const { data } = await supabase
    .from("deals")
    .select("id, deal_id, status, payment_status")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return {
    display_id: data.deal_id ?? data.id,
    deal_id: data.deal_id ?? data.id,
    payment_status: data.payment_status,
    status: data.status,
  };
}

export default async function PortalReleasePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/portal/release");

  const matter = await getReleaseMatter();
  const isReleased = matter?.payment_status === "paid" && matter?.status === "completed";

  return (
    <main className="max-w-3xl mx-auto py-10 px-4 space-y-8">
      <div>
        <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: 0 }}>
          / RELEASE DESK /
        </p>
        <h1 style={{ fontFamily: "var(--font-playfair,Georgia,serif)", fontSize: "clamp(24px,4vw,40px)", fontWeight: 400, color: "#F6F1E6", margin: "8px 0 4px" }}>
          Release Review
        </h1>
        <p style={{ fontSize: 12, color: "#A8A29A", margin: 0 }}>
          Final document release requires payment confirmation and operator approval.
        </p>
      </div>

      {matter ? (
        <MilanoReleaseSeal
          verificationId={matter.display_id ?? matter.deal_id}
          isReleased={isReleased}
        />
      ) : (
        <div style={{
          padding: 32,
          border: "1px solid rgba(198,165,90,0.16)",
          borderRadius: 16,
          background: "#0B0B0B",
          textAlign: "center",
        }}>
          <p style={{ color: "#A8A29A", fontSize: 13 }}>
            No matter found. Please contact your coordinator.
          </p>
        </div>
      )}

      {!isReleased && (
        <div style={{
          padding: "12px 18px",
          background: "rgba(201,154,61,0.06)",
          border: "1px solid rgba(201,154,61,0.2)",
          borderRadius: 10,
          fontSize: 12,
          color: "#C99A3D",
          lineHeight: 1.6,
        }}>
          Your packet has been delivered and is awaiting release review. Documents are released only after operator approval. You will be notified when release is confirmed.
        </div>
      )}
    </main>
  );
}
