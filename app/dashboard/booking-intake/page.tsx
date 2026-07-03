export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { bookingIntakeRegistry } from "@/lib/service-registry/bookingIntakeRegistry";

export const metadata = {
  title: "Booking Intake — Milano Seal",
};

export default async function BookingIntakeDashboardPage() {
  await requireDashboardAccess();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 text-stone-200">
      <h1 className="text-2xl font-semibold text-amber-100">Booking Intake</h1>
      <p className="mt-2 text-sm text-stone-400">
        Payment Gate Status: ENFORCED — no confirmed appointment before payment
        confirmation.
      </p>
      <p className="mt-1 text-xs text-stone-500">Internal sample data.</p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-amber-100">Intake Stages</h2>
        <ol className="mt-3 space-y-2 text-sm text-stone-300">
          {bookingIntakeRegistry.map((stage, i) => (
            <li
              key={stage.id}
              className="rounded-xl border border-amber-300/15 bg-black/40 p-4"
            >
              <div className="font-medium text-amber-100">
                {i + 1}. {stage.label}
              </div>
              <div className="mt-1 text-stone-400">{stage.description}</div>
              <div className="mt-1 text-xs text-stone-500">
                Payment gated: {stage.paymentGated ? "yes" : "no"} · Operator review:{" "}
                {stage.requiresOperatorReview ? "yes" : "no"}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
