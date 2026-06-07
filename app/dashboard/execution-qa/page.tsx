import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExecutionQADesk } from "@/components/execution-qa/ExecutionQADesk";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Execution QA Desk | The Milano Seal™",
  robots: { index: false, follow: false },
};

const ADMIN_ROLES = new Set(["admin", "operator", "superadmin", "founder_admin", "admin_operator", "ops_manager"]);

export default async function ExecutionQAPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !ADMIN_ROLES.has(profile.role)) redirect("/dashboard");

  return (
    <div className="min-h-screen p-6" style={{ background: "#060402" }}>
      <div className="mb-8">
        <p className="font-mono text-[10px] tracking-[0.25em] uppercase mb-1" style={{ color: "rgba(212,175,55,0.5)" }}>Dashboard · Execution</p>
        <h1 className="font-serif text-2xl text-white tracking-wide">Execution QA Desk</h1>
        <p className="font-mono text-xs mt-1 max-w-xl" style={{ color: "rgba(255,255,255,0.4)", lineHeight: "1.7" }}>
          Review scan-backs, verify checklists, and pass or block matters before apostille, courier, or release.
        </p>
      </div>
      <ExecutionQADesk />
    </div>
  );
}
