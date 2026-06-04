import { requireAllianceAccess } from "@/lib/allianceAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AllianceTrainingHub } from "@/components/alliance/AllianceTrainingHub";

export const metadata = {
  title: "Partner Training | Alliance Partner Portal",
  robots: { index: false, follow: false },
};

async function getTrainingModules(userId: string) {
  const admin = createAdminClient();

  // Resolve partner record
  const { data: partner } = await admin
    .from("alliance_partners")
    .select("id, partner_type")
    .eq("user_id", userId)
    .single();

  if (!partner) return { modules: [], partnerType: undefined };

  // Fetch toolbelt training modules if the table exists
  const { data: modules } = await admin
    .from("partner_training_modules")
    .select("id, title, description, status, duration_min")
    .eq("partner_id", partner.id)
    .order("created_at", { ascending: true })
    .then((r) => (r.error ? { data: [] } : r));

  return {
    modules: (modules ?? []) as Array<{
      id: string;
      title: string;
      description: string;
      status: "not_started" | "in_progress" | "completed" | "locked";
      duration_min?: number;
    }>,
    partnerType: partner.partner_type as string | undefined,
  };
}

export default async function AllianceTrainingPage() {
  const { userId } = await requireAllianceAccess();
  const { modules, partnerType } = await getTrainingModules(userId);

  return (
    <div
      className="min-h-screen"
      style={{ background: "#080808", color: "rgba(255,255,255,0.85)" }}
    >
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <p
            className="text-[10px] font-mono uppercase tracking-[0.3em]"
            style={{ color: "rgba(198,165,90,0.55)" }}
          >
            Alliance Partner Portal
          </p>
          <h1
            className="text-3xl font-light"
            style={{
              fontFamily: "var(--font-playfair),Georgia,serif",
              color: "#C6A55A",
            }}
          >
            Partner Training
          </h1>
          <p
            className="text-sm leading-relaxed max-w-xl"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Complete required training modules to advance your Tool Belt status.
          </p>
        </div>

        <AllianceTrainingHub modules={modules} partnerType={partnerType} />
      </div>
    </div>
  );
}
