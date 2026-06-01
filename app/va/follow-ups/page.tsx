export const dynamic = "force-dynamic";

import { requireVAAccess } from "@/lib/vaAuth";
import { VALiveEventStream } from "@/components/va/VALiveEventStream";
import { VAEscalationQueue } from "@/components/va/VAEscalationQueue";

export default async function VAFollowUpsPage() {
  const { role } = await requireVAAccess();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <p className="text-[9px] font-mono tracking-[0.3em]" style={{ color: "rgba(212,175,55,0.4)" }}>
          {role.replace(/_/g, " ").toUpperCase()} · FOLLOW-UPS
        </p>
        <h1 className="text-xl font-light mt-1" style={{ color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-playfair),Georgia,serif" }}>
          Follow-Up Queue
        </h1>
        <p className="text-[10px] font-mono mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
          Active follow-up actions and live event stream for matters requiring outreach.
        </p>
      </div>

      <VAEscalationQueue />
      <VALiveEventStream />
    </div>
  );
}
