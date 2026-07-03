export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { evaluateTranslation } from "@/lib/translations/translationRequirementEngine";

export const metadata = {
  title: "Translation Coordination — Milano Seal",
};

export default async function TranslationsDashboardPage() {
  await requireDashboardAccess();

  // Internal sample data — illustrative evaluations only.
  const samples = [
    evaluateTranslation({ documentLanguage: "English", destinationLanguage: "Italian" }),
    evaluateTranslation({ documentLanguage: "English", destinationLanguage: "English" }),
    evaluateTranslation({ documentLanguage: "English" }),
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 text-stone-200">
      <h1 className="text-2xl font-semibold text-amber-100">Translation Coordination</h1>
      <p className="mt-2 text-sm text-stone-400">Payment Gate Status: ENFORCED</p>
      <p className="mt-1 text-xs text-stone-500">Internal sample data.</p>

      <section className="mt-8">
        <ul className="mt-3 space-y-3 text-sm text-stone-300">
          {samples.map((result, i) => (
            <li
              key={`${result.status}-${i}`}
              className="rounded-xl border border-amber-300/15 bg-black/40 p-4"
            >
              <div className="font-medium text-amber-100">{result.status}</div>
              <div className="mt-1 text-xs text-stone-400">
                Manual review: {result.requiresManualReview ? "yes" : "no"}
              </div>
              <ul className="mt-2 space-y-1 text-xs text-stone-500">
                {result.notes.map((n) => (
                  <li key={n}>• {n}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
