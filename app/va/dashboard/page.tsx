export const dynamic = "force-dynamic";

import { requireVAAccess } from "@/lib/vaAuth";
import { VATaskQueue } from "@/components/va/VATaskQueue";
import { VALiveEventStream } from "@/components/va/VALiveEventStream";
import { VAExecutionPipeline } from "@/components/va/VAExecutionPipeline";
import { VAAssistant } from "@/components/va/VAAssistant";
import { VADailyCompletionTracker } from "@/components/va/VADailyCompletionTracker";
import { VAEscalationQueue } from "@/components/va/VAEscalationQueue";
import { VASOPReference } from "@/components/va/VASOPReference";

export default async function VADashboardPage() {
  const { role } = await requireVAAccess();

  return (
    <div className="ms-safe-bottom mx-auto max-w-7xl space-y-6">
      {/* Role header */}
      <div className="ms-os-panel rounded-lg p-5 sm:p-6">
        <p
          className="text-[11px] font-mono tracking-[0.22em]"
          style={{ color: "rgba(212,175,55,0.5)" }}
        >
          {role.replace(/_/g, " ").toUpperCase()} · RESTRICTED ENVIRONMENT
        </p>
        <h1
          className="text-xl font-light mt-1"
          style={{
            color: "rgba(255,255,255,0.75)",
            fontFamily: "var(--font-playfair),Georgia,serif",
          }}
        >
          Operations Desk
        </h1>
        <p
          className="text-[11px] font-mono mt-1"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          Assigned coordination tasks and execution queue.
        </p>
      </div>

      {/* Daily completion tracker */}
      <VADailyCompletionTracker />

      {/* Pipeline overview */}
      <VAExecutionPipeline />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <VATaskQueue />
        <VALiveEventStream />
      </div>

      {/* Escalation queue */}
      <VAEscalationQueue />

      {/* SOP Reference */}
      <VASOPReference />

      {/* Assistant */}
      <VAAssistant />
    </div>
  );
}
