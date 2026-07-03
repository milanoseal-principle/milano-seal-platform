export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { routeApostille } from "@/lib/apostille-rules/apostilleRoutingEngine";
import { MAX_SUBMISSION_RULES } from "@/lib/apostille-rules/maxDocumentSubmissionRules";

export const metadata = {
  title: "Apostille Rules — Milano Seal",
};

export default async function ApostilleRulesDashboardPage() {
  await requireDashboardAccess();

  // Internal sample data — illustrative routing outputs only.
  const samples = [
    routeApostille({ documentType: "FBI Identity History Summary", destinationCountry: "Italy" }),
    routeApostille({ documentType: "Birth Certificate", destinationCountry: "Italy" }),
    routeApostille({ documentType: "Power of Attorney" }),
    routeApostille({ documentType: "Mystery Document" }),
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 text-stone-200">
      <h1 className="text-2xl font-semibold text-amber-100">Apostille Rules</h1>
      <p className="mt-2 text-sm text-stone-400">Payment Gate Status: ENFORCED</p>
      <p className="mt-1 text-xs text-stone-500">Internal sample data.</p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-amber-100">Sample Routing Output</h2>
        <ul className="mt-3 space-y-3 text-sm text-stone-300">
          {samples.map((result, i) => (
            <li
              key={`${result.documentAuthority}-${i}`}
              className="rounded-xl border border-amber-300/15 bg-black/40 p-4"
            >
              <div className="font-medium text-amber-100">
                {result.documentAuthority} → {result.route}
              </div>
              <div className="mt-1 text-xs text-stone-400">
                Authority level: {result.authorityLevel} · Manual review:{" "}
                {result.requiresManualReview ? "yes" : "no"}
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

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-amber-100">
          Max Submission Rules
        </h2>
        <p className="mt-2 text-sm text-stone-400">
          {MAX_SUBMISSION_RULES.length === 0
            ? "No submission limits seeded. Limits require sourced, operator-reviewed data; unsourced rules default to manual review."
            : `${MAX_SUBMISSION_RULES.length} rules loaded.`}
        </p>
      </section>
    </main>
  );
}
