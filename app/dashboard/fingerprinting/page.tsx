export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { fingerprintUseCaseRegistry } from "@/lib/fingerprinting/fingerprintUseCaseRegistry";
import { routeFingerprint } from "@/lib/fingerprinting/fingerprintRoutingEngine";

export const metadata = {
  title: "Fingerprinting Routing — Milano Seal",
};

export default async function FingerprintingDashboardPage() {
  await requireDashboardAccess();

  // Internal sample data — illustrative routing outputs only.
  const samples = [
    routeFingerprint({ useCase: "healthcare_license" }),
    routeFingerprint({ useCase: "fbi_identity_history_summary" }),
    routeFingerprint({ useCase: "concealed_weapon_license" }),
    routeFingerprint({ useCase: "unknown" }),
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 text-stone-200">
      <h1 className="text-2xl font-semibold text-amber-100">Fingerprinting Routing</h1>
      <p className="mt-2 text-sm text-stone-400">Payment Gate Status: ENFORCED</p>
      <p className="mt-1 text-xs text-stone-500">Internal sample data.</p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-amber-100">Use Cases</h2>
        <ul className="mt-3 grid gap-2 text-sm text-stone-300 sm:grid-cols-2">
          {Object.values(fingerprintUseCaseRegistry).map((uc) => (
            <li
              key={uc.useCase}
              className="rounded-xl border border-amber-300/15 bg-black/40 p-3"
            >
              <div className="font-medium text-amber-100">{uc.label}</div>
              <div className="text-xs text-stone-500">
                {uc.authorityType} · employment/licensing:{" "}
                {uc.employmentOrLicensing ? "yes" : "no"}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-amber-100">Sample Routing Output</h2>
        <ul className="mt-3 space-y-3 text-sm text-stone-300">
          {samples.map((result) => (
            <li
              key={result.useCase}
              className="rounded-xl border border-amber-300/15 bg-black/40 p-4"
            >
              <div className="font-medium text-amber-100">{result.useCase}</div>
              <div className="mt-1 text-xs text-stone-400">
                Manual review: {result.requiresManualReview ? "yes" : "no"} · Can
                transmit: {result.canTransmit ? "yes" : "no"}
              </div>
              {result.warnings.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-amber-200/80">
                  {result.warnings.map((w) => (
                    <li key={w}>• {w}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
