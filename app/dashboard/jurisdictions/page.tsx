export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { JurisdictionCommandCenter } from "@/components/jurisdictions/JurisdictionCommandCenter";
import { CountryEditor } from "@/components/jurisdictions/CountryEditor";
import { HagueStatusPanel } from "@/components/jurisdictions/HagueStatusPanel";
import { EmbassyConsulatePanel } from "@/components/jurisdictions/EmbassyConsulatePanel";
import { ManualReviewFlags } from "@/components/jurisdictions/ManualReviewFlags";
import {
  DestinationRequirements,
  type DestinationRequirementRow,
} from "@/components/jurisdictions/DestinationRequirements";
import { listCountries } from "@/lib/jurisdictions/countryRegistry";
import { listEmbassies } from "@/lib/jurisdictions/embassyRegistry";
import { listConsulates } from "@/lib/jurisdictions/consulateRegistry";
import { getTranslationRule } from "@/lib/jurisdictions/translationRules";
import { getProcessingNote } from "@/lib/jurisdictions/processingNotes";
import { evaluateDestinationFlags } from "@/lib/jurisdictions/manualReviewFlags";
import type { ManualReviewFlag } from "@/lib/jurisdictions/types";
import { VERIFY_BEFORE_EXECUTION_CAPTION } from "@/lib/jurisdictions/jurisdictionSafety";

export const metadata = {
  title: "Jurisdictions — The Milano Seal™",
  robots: { index: false },
};

export default async function JurisdictionsDashboardPage() {
  await requireDashboardAccess();

  const countries = listCountries();
  const embassies = listEmbassies();
  const consulates = listConsulates();

  const requirementRows: DestinationRequirementRow[] = countries.map((country) => ({
    country,
    translation: getTranslationRule(country.iso),
    processing: getProcessingNote(country.iso),
  }));

  const flags: ManualReviewFlag[] = countries.flatMap((c) =>
    evaluateDestinationFlags({ destinationIso: c.iso, lastVerified: null }),
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 text-stone-200">
      <DashboardPageHeader
        eyebrow="Global Jurisdiction Intelligence"
        title="Jurisdictions"
        description="Illustrative, operational-only jurisdiction intelligence. Not legal or immigration advice, not government-approved, no guaranteed acceptance."
        meta={
          <p className="text-[11px] uppercase tracking-[0.16em] text-amber-200/70">
            {VERIFY_BEFORE_EXECUTION_CAPTION}
          </p>
        }
      />

      <div className="space-y-6">
        <JurisdictionCommandCenter countries={countries} flags={flags} />
        <HagueStatusPanel countries={countries} />
        <DestinationRequirements rows={requirementRows} />
        <EmbassyConsulatePanel embassies={embassies} consulates={consulates} />
        <ManualReviewFlags flags={flags} />
        <CountryEditor initial={countries[0]} />
      </div>

      <p className="mt-8 text-center text-[11px] text-stone-500">
        {VERIFY_BEFORE_EXECUTION_CAPTION}
      </p>
    </main>
  );
}
