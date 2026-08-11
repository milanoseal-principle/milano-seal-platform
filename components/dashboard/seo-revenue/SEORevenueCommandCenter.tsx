import { servicePageRegistry } from "@/lib/seo-revenue/servicePageRegistry";
import { countryRevenueMatrix } from "@/lib/seo-revenue/countryRevenueMatrix";
import { scoreSeoOpportunity } from "@/lib/seo-revenue/seoOpportunityScoring";
import { SEORevenueKPIGrid } from "./SEORevenueKPIGrid";
import { ServicePageRevenueBoard } from "./ServicePageRevenueBoard";
import { CountryRevenueMatrix } from "./CountryRevenueMatrix";
import { CTAConversionBoard } from "./CTAConversionBoard";
import { IntakeSourceAttribution } from "./IntakeSourceAttribution";
import { SEOOpportunityQueue } from "./SEOOpportunityQueue";
import { ContentActionQueue } from "./ContentActionQueue";
import { SEORevenueSafetyPanel } from "./SEORevenueSafetyPanel";

export function SEORevenueCommandCenter() {
  return (
    <main className="min-h-screen bg-[#050505] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-amber-400/25 bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-6">
          <p className="text-xs uppercase tracking-[0.32em] text-amber-300">Revenue Operations</p>
          <h1 className="mt-3 text-3xl font-semibold">SEO Authority + Service Page Revenue Engine</h1>
          <p className="mt-3 max-w-3xl text-sm text-zinc-300">
            Turns service and country pages into qualified Secure Records Intake traffic with source slugs, safe CTAs, and manual review reminders.
          </p>
        </header>
        <SEORevenueKPIGrid />
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {servicePageRegistry.map((page) => (
            <article key={page.slug} className="rounded-2xl border border-amber-400/20 bg-zinc-950/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-amber-300">{page.revenueLane}</p>
              <h2 className="mt-2 text-lg font-semibold">{page.title}</h2>
              <p className="mt-2 text-sm text-zinc-400">Client: {page.targetClientType}</p>
              <p className="mt-1 text-sm text-zinc-400">CTA: {page.recommendedCta}</p>
              <p className="mt-1 text-sm text-zinc-400">Source: {page.intakeSourceSlug}</p>
              <p className="mt-1 text-sm text-amber-200">Opportunity score: {scoreSeoOpportunity(page)}</p>
            </article>
          ))}
        </section>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {countryRevenueMatrix.map((country) => (
            <article key={country.country} className="rounded-2xl border border-white/10 bg-black/40 p-5">
              <h3 className="text-lg font-semibold">{country.country}</h3>
              <p className="mt-2 text-sm text-zinc-400">{country.manualReview}</p>
            </article>
          ))}
        </section>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ServicePageRevenueBoard />
          <CountryRevenueMatrix />
          <CTAConversionBoard />
          <IntakeSourceAttribution />
          <SEOOpportunityQueue />
          <ContentActionQueue />
        </section>
        <SEORevenueSafetyPanel />
      </div>
    </main>
  );
}
