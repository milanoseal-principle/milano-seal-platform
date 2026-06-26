import type { Metadata } from "next";
import { calculateMilanoPricing } from "@/src/features/pricing/pricingEngine";
import { finalPacketChecklist } from "@/src/features/shipping/shippingService";
import { E2EDemoShell } from "./_components/e2e-demo-shell";

export const metadata: Metadata = {
  title: "Tiffany E2E Demo Flow",
  robots: { index: false, follow: false },
};

const steps = [
  "Start/reset demo matter",
  "Open client portal",
  "Open invoice",
  "Apply TIFFANYTEST",
  "View Wise instructions",
  "Confirm deposit or full payment",
  "Schedule RON",
  "Mark RON completed",
  "Submit apostille",
  "Receive apostille",
  "Request final payment",
  "Confirm final payment",
  "Assemble final packet",
  "Add tracking",
  "Ship",
  "Deliver",
  "Complete",
  "Trigger review",
];

export default function TiffanyE2ETestPage() {
  const demoEnabled = process.env.MILANO_E2E_DEMO_MODE === "true";

  const pricing = calculateMilanoPricing({
    lane: "priority",
    apostilleRequired: true,
    discountAmount: 100,
    paymentMode: "split_50_50",
    matterReference: "MS-DEMO-2026-000001",
  });

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-10 text-[#F6F1E6]">
      <section className="mx-auto max-w-6xl">
        <p className="text-xs uppercase tracking-[0.28em] text-[#C6A65B]">THE MILANO SEAL™</p>
        <h1 className="mt-3 text-4xl font-semibold">Tiffany E2E Demo Flow</h1>
        <p className="mt-3 max-w-3xl text-sm text-[#d8cfbd]">
          Controlled operator demo for the Milano Seal OS production spine. Enable with
          MILANO_E2E_DEMO_MODE=true before using live workflow actions.
        </p>

        <div className="mt-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-2xl border border-[#C6A65B]/20 bg-white/[0.035] p-6">
            <h2 className="text-xl text-[#C6A65B]">Demo Matter</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt>Matter</dt><dd>MS-DEMO-2026-000001</dd></div>
              <div className="flex justify-between gap-4"><dt>Lane</dt><dd>Priority</dd></div>
              <div className="flex justify-between gap-4"><dt>Original Total</dt><dd>${pricing.original_total.toLocaleString()}</dd></div>
              <div className="flex justify-between gap-4"><dt>Discount</dt><dd>$100</dd></div>
              <div className="flex justify-between gap-4"><dt>Final Total</dt><dd>${pricing.final_total.toLocaleString()}</dd></div>
              <div className="flex justify-between gap-4"><dt>Deposit</dt><dd>${pricing.deposit_amount.toLocaleString()}</dd></div>
              <div className="flex justify-between gap-4"><dt>Balance</dt><dd>${pricing.balance_due.toLocaleString()}</dd></div>
              <div className="flex justify-between gap-4"><dt>Payment Method</dt><dd>Wise</dd></div>
            </dl>
          </div>

          <div className="rounded-2xl border border-[#C6A65B]/20 bg-white/[0.035] p-6">
            <h2 className="text-xl text-[#C6A65B]">Operator Steps</h2>
            <ol className="mt-5 grid gap-3 md:grid-cols-2">
              {steps.map((step, index) => (
                <li key={step} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
                  <span className="mr-2 text-[#C6A65B]">{index + 1}.</span>{step}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-[#C6A65B]/20 bg-white/[0.035] p-6">
          <h2 className="text-xl text-[#C6A65B]">Final Packet Checklist</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {finalPacketChecklist.map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm">{item}</div>
            ))}
          </div>
        </div>

        {/* Interactive operator harness — gated on MILANO_E2E_DEMO_MODE */}
        <div className="mt-8">
          {demoEnabled ? (
            <E2EDemoShell />
          ) : (
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.05] p-6 text-sm text-amber-200/80">
              Interactive demo actions are disabled. Set{" "}
              <code className="font-mono text-amber-100">MILANO_E2E_DEMO_MODE=true</code> in the
              environment to enable the live seed / discount / payment / lifecycle controls.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
