import type { Metadata } from "next";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { E2EDemoShell } from "./_components/e2e-demo-shell";

export const metadata: Metadata = {
  title: "Tiffany E2E Demo — Milano Seal Operator",
  robots: { index: false, follow: false },
};

export default async function TiffanyE2EPage() {
  await requireDashboardAccess();

  const demoEnabled = process.env.MILANO_E2E_DEMO_MODE === "true";

  if (!demoEnabled) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="border border-yellow-400/40 bg-yellow-950/20 rounded-lg p-6 text-center">
          <p className="text-yellow-400 font-semibold text-sm uppercase tracking-widest mb-2">
            Demo Mode Disabled
          </p>
          <p className="text-muted-foreground text-sm">
            Set{" "}
            <code className="bg-muted px-1 rounded text-xs">
              MILANO_E2E_DEMO_MODE=true
            </code>{" "}
            in your environment to enable the Tiffany E2E demo harness.
          </p>
          <p className="text-muted-foreground text-xs mt-3">
            This page is never public and never indexed regardless of this flag.
          </p>
        </div>
      </div>
    );
  }

  return <E2EDemoShell />;
import { calculateMilanoPricing } from "@/src/features/pricing/pricingEngine";
import { finalPacketChecklist } from "@/src/features/shipping/shippingService";

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
          Controlled operator demo for the Milano Seal OS production spine. Enable with MILANO_E2E_DEMO_MODE=true before using live workflow actions.
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
      </section>
    </main>
  );
}
