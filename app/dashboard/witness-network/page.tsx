import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WitnessNetworkPanel } from "@/components/execution-qa/WitnessNetworkPanel";
import { Metadata } from "next";
import { resolveServerRole } from "@/lib/auth/server-role";

export const metadata: Metadata = {
  title: "Witness & Backup Network | The Milano Seal™",
  robots: { index: false, follow: false },
};

const ADMIN_ROLES = new Set(["admin", "operator", "superadmin", "founder_admin", "admin_operator", "ops_manager"]);

export default async function WitnessNetworkPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  // Role comes from the authoritative server-side resolver; there is no profiles table.
  if (!ADMIN_ROLES.has(await resolveServerRole(user))) redirect("/dashboard");

  return (
    <div className="min-h-screen p-6" style={{ background: "#060402" }}>
      <div className="mb-8">
        <p className="font-mono text-[10px] tracking-[0.25em] uppercase mb-1" style={{ color: "rgba(212,175,55,0.5)" }}>Dashboard · Network</p>
        <h1 className="font-serif text-2xl text-white tracking-wide">Witness & Backup Network</h1>
        <p className="font-mono text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Internal operator network only. Not visible to clients or partners.</p>
      </div>
      <WitnessNetworkPanel />
    </div>
  );
}
