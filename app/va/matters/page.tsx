export const dynamic = "force-dynamic";

import { requireVAAccess } from "@/lib/vaAuth";
import { VAMattersClient } from "@/components/va/VAMattersClient";

export default async function VAMattersPage() {
  const { role } = await requireVAAccess();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <p className="text-[9px] font-mono tracking-[0.3em]" style={{ color: "rgba(212,175,55,0.4)" }}>
          {role.replace(/_/g, " ").toUpperCase()} · MATTER VIEW
        </p>
        <h1 className="text-xl font-light mt-1" style={{ color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-playfair),Georgia,serif" }}>
          My Matters
        </h1>
        <p className="text-[10px] font-mono mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
          Matters with active tasks assigned to your role. Client names and financial details are not shown here.
        </p>
      </div>
      <VAMattersClient />
    </div>
  );
}
