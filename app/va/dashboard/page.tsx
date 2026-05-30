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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Role header */}
      <div>
        <p
          className="text-[9px] font-mono tracking-[0.3em]"
          style={{ color: "rgba(212,175,55,0.4)" }}
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
          VA Workspace
        </h1>
        <p
          className="text-[10px] font-mono mt-1"
          style={{ color: "rgba(255,255,255,0.25)" }}
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
