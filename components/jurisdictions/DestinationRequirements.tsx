"use client";

import type {
  CountryRecord,
  TranslationRule,
  ProcessingNote,
} from "@/lib/jurisdictions/types";
import { VERIFY_BEFORE_EXECUTION_CAPTION } from "@/lib/jurisdictions/jurisdictionSafety";

export interface DestinationRequirementRow {
  country: CountryRecord;
  translation: TranslationRule;
  processing: ProcessingNote;
}

export function DestinationRequirements({
  rows,
}: {
  rows: DestinationRequirementRow[];
}) {
  return (
    <section className="rounded-2xl border border-amber-300/25 bg-black/50 p-5">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
        Destination Requirements
      </h2>
      <p className="mb-4 text-[11px] text-stone-500">
        {VERIFY_BEFORE_EXECUTION_CAPTION}
      </p>
      <div className="space-y-3">
        {rows.map(({ country, translation, processing }) => (
          <div
            key={country.iso + country.name}
            className="rounded-lg border border-amber-300/10 bg-black/30 p-3 text-xs text-stone-300"
          >
            <div className="mb-2 font-medium text-amber-100">
              {country.name} <span className="text-stone-500">({country.iso})</span>
            </div>
            <dl className="grid gap-1 sm:grid-cols-2">
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-amber-200/60">
                  Translation
                </dt>
                <dd>
                  {translation.translationExpected}
                  {translation.requiresManualReview && " · manual review"}
                  {translation.certifiedTranslationNote && (
                    <div className="text-[11px] text-stone-500">
                      {translation.certifiedTranslationNote}
                    </div>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-amber-200/60">
                  Processing / courier
                </dt>
                <dd>
                  {processing.estimatedBusinessDays == null
                    ? "Timeline unknown — verify"
                    : `~${processing.estimatedBusinessDays} business days (estimate)`}
                  {processing.requiresManualReview && " · manual review"}
                  {processing.courierNote && (
                    <div className="text-[11px] text-stone-500">
                      {processing.courierNote}
                    </div>
                  )}
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-[10px] uppercase tracking-wide text-amber-200/60">
              Verify before execution
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
