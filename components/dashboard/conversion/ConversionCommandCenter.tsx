import { conversionStages } from "@/lib/conversion/conversionStageRegistry";
import { followUpScripts } from "@/lib/conversion/followUpScriptRegistry";
import { getPaymentRecoveryQueue } from "@/lib/conversion/paymentRecoveryEngine";
import { ConversionKPIGrid } from "./ConversionKPIGrid";
import { AbandonedIntakeRecoveryBoard } from "./AbandonedIntakeRecoveryBoard";
import { QuoteFollowUpQueue } from "./QuoteFollowUpQueue";
import { UnpaidInvoiceRecoveryBoard } from "./UnpaidInvoiceRecoveryBoard";
import { WisePaymentStatusBoard } from "./WisePaymentStatusBoard";
import { FounderHighValueFollowUp } from "./FounderHighValueFollowUp";
import { PaymentGateEnforcementPanel } from "./PaymentGateEnforcementPanel";
import { FollowUpScriptLibrary } from "./FollowUpScriptLibrary";
import { ConversionSafetyPanel } from "./ConversionSafetyPanel";

export function ConversionCommandCenter() {
  const recoveryQueue = getPaymentRecoveryQueue();

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-amber-400/25 bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-6">
          <p className="text-xs uppercase tracking-[0.32em] text-amber-300">Revenue Operations</p>
          <h1 className="mt-3 text-3xl font-semibold">Conversion + Payment Recovery Engine</h1>
          <p className="mt-3 max-w-3xl text-sm text-zinc-300">
            Turns quote-ready matters into paid, scheduled work while keeping payment confirmation, release, custody, and Wise webhook logic untouched.
          </p>
        </header>

        <ConversionKPIGrid />

        <section className="grid gap-4 lg:grid-cols-3">
          {recoveryQueue.map((matter) => (
            <article key={matter.id} className="rounded-2xl border border-amber-400/20 bg-zinc-950/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-amber-300">Internal sample data</p>
              <h2 className="mt-2 text-lg font-semibold">{matter.matter}</h2>
              <p className="mt-2 text-sm text-zinc-400">Stage: {matter.stage}</p>
              <p className="mt-1 text-sm text-zinc-400">Next action: {matter.nextAction}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AbandonedIntakeRecoveryBoard />
          <QuoteFollowUpQueue />
          <UnpaidInvoiceRecoveryBoard />
          <WisePaymentStatusBoard />
          <FounderHighValueFollowUp />
          <PaymentGateEnforcementPanel />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-amber-400/20 bg-black/40 p-5">
            <h2 className="text-xl font-semibold">Stage Registry</h2>
            <div className="mt-4 grid gap-3">
              {conversionStages.map((stage) => (
                <div key={stage.stage} className="rounded-xl border border-white/10 p-3">
                  <p className="font-medium text-amber-200">{stage.label}</p>
                  <p className="text-sm text-zinc-400">{stage.operatorAction}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-amber-400/20 bg-black/40 p-5">
            <h2 className="text-xl font-semibold">24 / 48 / 72 Hour Scripts</h2>
            <div className="mt-4 grid gap-3">
              {Object.entries(followUpScripts).map(([cadence, script]) => (
                <div key={cadence} className="rounded-xl border border-white/10 p-3">
                  <p className="font-medium text-amber-200">{script.title}</p>
                  <p className="text-sm text-zinc-400">{script.script}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <FollowUpScriptLibrary />
        <ConversionSafetyPanel />
      </div>
    </main>
  );
}
