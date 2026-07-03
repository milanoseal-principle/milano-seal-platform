export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { milanoServiceRegistry } from "@/lib/service-registry/milanoServiceRegistry";
import { mobileFieldNetworkRegistry } from "@/lib/service-registry/mobileFieldNetwork";

export const metadata = {
  title: "Fingerprint & Apostille Network — Milano Seal",
};

export default async function FingerprintApostilleNetworkPage() {
  await requireDashboardAccess();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 text-stone-200">
      <h1 className="text-2xl font-semibold text-amber-100">
        Fingerprint & Apostille Network
      </h1>
      <p className="mt-2 text-sm text-stone-400">
        Payment Gate Status: ENFORCED — scheduling unlocks only after payment
        confirmation.
      </p>
      <p className="mt-1 text-xs text-stone-500">Internal sample data.</p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-amber-100">Service Registry</h2>
        <ul className="mt-3 space-y-2 text-sm text-stone-300">
          {milanoServiceRegistry.map((entry) => (
            <li
              key={entry.id}
              className="rounded-xl border border-amber-300/15 bg-black/40 p-4"
            >
              <div className="font-medium text-amber-100">{entry.label}</div>
              <div className="mt-1 text-stone-400">{entry.publicSummary}</div>
              <div className="mt-1 text-xs text-stone-500">
                Manual review: {entry.requiresManualReview ? "yes" : "no"} · Payment
                gated scheduling: enforced
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-amber-100">Field Network</h2>
        <ul className="mt-3 space-y-2 text-sm text-stone-300">
          {mobileFieldNetworkRegistry.map((node) => (
            <li
              key={node.id}
              className="rounded-xl border border-amber-300/15 bg-black/40 p-4"
            >
              <div className="font-medium text-amber-100">{node.label}</div>
              <div className="mt-1 text-stone-400">{node.publicSummary}</div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
