"use client";

import { buildCapabilityStatement } from "@/lib/government/capabilityStatementModel";

export function CapabilityStatementManager() {
  // Structured object built from operator-provided company data. Past performance
  // is intentionally empty here — nothing is fabricated.
  const statement = buildCapabilityStatement({
    companyData: {
      legalName: "Milano Seal International LLC",
      entityType: "Florida LLC",
      location: "Florida, United States",
      notaryCommission: "FL Notary #668288",
      ronAuthorized: true,
      email: "contact@themilanoseal.com",
      phone: "Available upon intake",
    },
  });

  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
          Capability Statement Manager
        </h2>
        <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
          Internal template
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-amber-200/60">
            Core Competencies
          </p>
          <ul className="mt-2 space-y-1 text-xs text-stone-300">
            {statement.coreCompetencies.map((c) => (
              <li key={c}>• {c}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-amber-200/60">
            Differentiators
          </p>
          <ul className="mt-2 space-y-1 text-xs text-stone-300">
            {statement.differentiators.map((c) => (
              <li key={c}>• {c}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-amber-300/10 bg-black/40 p-3 text-xs text-stone-300">
        <p className="text-amber-100">{statement.companyData.legalName}</p>
        <p>{statement.companyData.entityType} · {statement.companyData.location}</p>
        <p>{statement.companyData.notaryCommission}</p>
        <p className="mt-2 text-stone-500">
          Past performance: {statement.pastPerformance.length === 0
            ? "none recorded (no fabricated performance)"
            : `${statement.pastPerformance.length} entries`}
        </p>
      </div>
    </section>
  );
}
