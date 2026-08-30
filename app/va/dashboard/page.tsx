export const dynamic = "force-dynamic";

import { requireVAAccess } from "@/lib/vaAuth";
import { VATaskQueue } from "@/components/va/VATaskQueue";
import { VALiveEventStream } from "@/components/va/VALiveEventStream";
import { VAExecutionPipeline } from "@/components/va/VAExecutionPipeline";
import { VAAssistant } from "@/components/va/VAAssistant";
import { VADailyCompletionTracker } from "@/components/va/VADailyCompletionTracker";
import { VAEscalationQueue } from "@/components/va/VAEscalationQueue";
import { VASOPReference } from "@/components/va/VASOPReference";
import { vaDashboardModules } from "@/lib/modules/vaDashboardModules";

export default async function VADashboardPage() {
  const { role } = await requireVAAccess();

  return (
    <div className="ms-safe-bottom mx-auto max-w-7xl space-y-6">
      <div className="ms-os-panel relative overflow-hidden rounded-lg p-5 sm:p-6">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-mono tracking-[0.2em] text-[#D4AF37]/55">
              THE MILANO SEAL™ · EXECUTION OPERATIONS
            </p>
            <h1 className="mt-2 font-serif text-2xl font-light text-[#F6F1E6] sm:text-3xl">
              Milano Execution Coordinator™ Workbench
            </h1>
            <p className="mt-2 max-w-2xl text-[12px] leading-5 text-white/42">
              Governed Matter preparation, packet control, follow-up, courier, RON support, and exception handling. Assigned operational work only; no legal or notarial authority is created by this designation.
            </p>
          </div>
          <div className="rounded-xl border border-[#D4AF37]/16 bg-[#D4AF37]/[0.035] px-4 py-3">
            <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#D4AF37]/55">Network designation</div>
            <div className="mt-1 text-[12px] font-medium text-[#E1CC96]">Milano Execution Coordinator™</div>
            <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-white/22">{role.replace(/_/g, " ")} · restricted environment</div>
          </div>
        </div>
        <div className="sr-only">{vaDashboardModules.join(",")}</div>
      </div>

      <VADailyCompletionTracker />
      <VAExecutionPipeline />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <VATaskQueue />
        <VALiveEventStream />
      </div>

      <VAEscalationQueue />
      <VASOPReference />
      <VAAssistant />
    </div>
  );
}
