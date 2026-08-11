import { mandatoryQAChecks } from "@/lib/matter-ops/preExecutionQA";
import { identifierVerificationRule } from "@/lib/matter-ops/identifierVerification";
import { releaseGateVisibilityRule } from "@/lib/matter-ops/releaseGateVisibility";
import { MatterReadinessBoard } from "./MatterReadinessBoard";
import { PreExecutionQAChecklist } from "./PreExecutionQAChecklist";
import { IdentifierVerificationPanel } from "./IdentifierVerificationPanel";
import { SignerWitnessReadinessPanel } from "./SignerWitnessReadinessPanel";
import { ApostillePacketReadinessPanel } from "./ApostillePacketReadinessPanel";
import { CourierReadinessPanel } from "./CourierReadinessPanel";
import { ReleaseGateVisibilityPanel } from "./ReleaseGateVisibilityPanel";
import { IssueBlockerQueue } from "./IssueBlockerQueue";
import { CompletedMatterReviewPanel } from "./CompletedMatterReviewPanel";
import { SOPUpdateCapturePanel } from "./SOPUpdateCapturePanel";
import { MatterOpsSafetyPanel } from "./MatterOpsSafetyPanel";

export function MatterOpsCommandCenter() {
  return (
    <main className="min-h-screen bg-[#050505] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-amber-400/25 bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-6">
          <p className="text-xs uppercase tracking-[0.32em] text-amber-300">Matter Operations</p>
          <h1 className="mt-3 text-3xl font-semibold">Matter Operations + QA Command Center</h1>
          <p className="mt-3 max-w-3xl text-sm text-zinc-300">
            Makes paid matters harder to mishandle by surfacing readiness, pre-execution QA, identifier verification, blocker queues, and release eligibility visibility.
          </p>
        </header>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MatterReadinessBoard />
          <PreExecutionQAChecklist />
          <IdentifierVerificationPanel />
          <SignerWitnessReadinessPanel />
          <ApostillePacketReadinessPanel />
          <CourierReadinessPanel />
          <ReleaseGateVisibilityPanel />
          <IssueBlockerQueue />
          <CompletedMatterReviewPanel />
          <SOPUpdateCapturePanel />
        </section>
        <section className="rounded-2xl border border-amber-400/20 bg-black/40 p-5">
          <h2 className="text-xl font-semibold">Mandatory QA Checks</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {mandatoryQAChecks.map((check) => (
              <div key={check.key} className="rounded-xl border border-white/10 p-3">
                <p className="font-medium text-amber-200">{check.label}</p>
                <p className="text-xs text-zinc-500">{check.required ? "Required" : "If applicable"}{check.damianiIdentifierCheck ? " · character-by-character" : ""}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-amber-400/20 bg-zinc-950/80 p-5 text-sm text-zinc-300">{identifierVerificationRule}</div>
          <div className="rounded-2xl border border-amber-400/20 bg-zinc-950/80 p-5 text-sm text-zinc-300">{releaseGateVisibilityRule}</div>
        </section>
        <MatterOpsSafetyPanel />
      </div>
    </main>
  );
}
