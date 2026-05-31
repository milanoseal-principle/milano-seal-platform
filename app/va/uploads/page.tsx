export const dynamic = "force-dynamic";

import { requireVAAccess } from "@/lib/vaAuth";
import { VAUploadsClient } from "@/components/va/VAUploadsClient";

export default async function VAUploadsPage() {
  const { role } = await requireVAAccess();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <p className="text-[9px] font-mono tracking-[0.3em]" style={{ color: "rgba(212,175,55,0.4)" }}>
          {role.replace(/_/g, " ").toUpperCase()} · DOCUMENT COORDINATION
        </p>
        <h1 className="text-xl font-light mt-1" style={{ color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-playfair),Georgia,serif" }}>
          Document Uploads
        </h1>
        <p className="text-[10px] font-mono mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
          Client-submitted documents pending verification. Review and update status in the operator dashboard.
        </p>
      </div>
      <VAUploadsClient />
    </div>
  );
}
