import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { recommendExecutionPathway } from "@/lib/execution/pathwayIntelligence";
import { AGENCY_REGISTRY, OPPORTUNITY_REGISTRY, buildCapabilityStatement, buildProcurementKnowledgeGraph, predictAgencyOpportunities, scoreAgency } from "@/lib/government/intelligence";
import { CANONICAL_MATTER_FIELDS, CASE_STUDY_001_ITALY_BASELINE, GOVERNMENT_OPPORTUNITY_CENTER_SCOPE, INTELLIGENCE_FEEDBACK_TARGETS, MILANO_OPERATING_SYSTEM_LAYERS, PLATFORM_GOVERNANCE_RULES, PLATFORM_UI_STANDARD, TRUST_NETWORK_PROGRESSIONS, UNIVERSAL_PRICING_MODELS } from "@/lib/platform";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Government Intelligence Platform — The Milano Seal™",
  robots: { index: false },
};

const workbookSignals = [
  "Entity records: Articles of Organization, EIN letter, operating agreement, statement of organizer, certificate of status.",
  "Brand and IP records: DBA registration, trademark watch, renewal cycle, source-link retention.",
  "Compliance records: notary commission, RON authorization, E&O insurance, expiration reminders.",
  "Operational records: append-only notes, source folders, quick-copy identity fields, status dashboard.",
];

const automationReminders = ["Renewals", "Registrations", "Insurance Expiration", "RON Commission", "Notary Commission", "Capability Updates", "Follow Ups", "Proposal Deadlines"];

export default async function GovernmentIntelligencePage() {
  await requireDashboardAccess();
  const graph = buildProcurementKnowledgeGraph();
  const governmentCapability = buildCapabilityStatement("Government");
  const publicSectorCapability = buildCapabilityStatement("Public Sector");
  const totalRelationshipScore = AGENCY_REGISTRY.reduce((sum, agency) => sum + agency.relationshipScore, 0);
  const averageRelationshipScore = Math.round(totalRelationshipScore / AGENCY_REGISTRY.length);
  const pathway = recommendExecutionPathway({
    jurisdiction: "Florida",
    country: "Italy",
    documentType: "International execution packet",
    signerLocation: "Florida",
    witnessRequirements: [],
    translationRequired: true,
    governmentRequirements: ["Receiving authority review"],
    fieldAvailability: "Unverified",
  });

  return (
    <main className="min-h-screen bg-[#05070b] px-4 py-8 text-white sm:px-6 lg:px-10 pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-[2rem] border border-[#c9a24a]/30 bg-[#0b1118]/90 p-6 shadow-2xl shadow-black/40">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[#c9a24a]">Module 15 · Layer 5 Intelligence</p>
              <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight text-white md:text-5xl">Government Intelligence Platform</h1>
              <p className="mt-4 max-w-4xl text-sm leading-7 text-white/68">A public-sector intelligence layer inside one Global Document Execution Operating System. It supports Procurement Alignment, SAM Ready Profile preparation, relationship memory, opportunity watch, capability statement routing, and safe institutional knowledge retention without government endorsement, bid guarantees, legal advice, or fake awards.</p>
            </div>
            <div className="rounded-2xl border border-[#c9a24a]/20 bg-black/25 p-4 text-sm text-white/70 lg:max-w-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-[#c9a24a]">Operator next action</p>
              <p className="mt-3">Verify agency registration requirements, attach the record to the canonical Matter object when applicable, and update intelligence append-only.</p>
            </div>
          </div>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#c9a24a]">Global Document Execution Operating System</p>
              <h2 className="mt-2 text-2xl font-semibold">Six connected architecture layers</h2>
            </div>
            <p className="text-sm text-white/55">No standalone feature islands. Every module connects back to Matter, organization, procurement, and intelligence.</p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {MILANO_OPERATING_SYSTEM_LAYERS.map((layer) => (
              <article key={layer.id} className="rounded-2xl border border-[#c9a24a]/15 bg-[#0b1118] p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-[#c9a24a]">Layer {layer.layer}</p>
                <h3 className="mt-2 text-lg font-semibold">{layer.name}</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">{layer.purpose}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {layer.modules.slice(0, 5).map((item) => <span key={item} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/60">{item}</span>)}
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-4">
          {[{ label: "Agency profiles", value: AGENCY_REGISTRY.length }, { label: "Relationship avg", value: averageRelationshipScore }, { label: "Opportunity watch", value: OPPORTUNITY_REGISTRY.length }, { label: "Graph links", value: graph.edges.length }].map((item) => (
            <div key={item.label} className="rounded-2xl border border-[#c9a24a]/20 bg-[#101820] p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-[#c9a24a]">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>

        <section className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-3xl border border-[#c9a24a]/20 bg-[#0b1118] p-6">
            <h2 className="text-2xl font-semibold">Platform Governance</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {PLATFORM_GOVERNANCE_RULES.map((rule) => <div key={rule} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm leading-6 text-white/68">{rule}</div>)}
            </div>
          </div>
          <div className="rounded-3xl border border-[#c9a24a]/20 bg-[#0b1118] p-6">
            <h2 className="text-2xl font-semibold">Canonical Matter Object</h2>
            <p className="mt-3 text-sm leading-6 text-white/60">Every module references one Matter object instead of creating duplicate intake, pricing, compliance, or procurement records.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {CANONICAL_MATTER_FIELDS.map((field) => <span key={field} className="rounded-full border border-[#c9a24a]/20 px-2.5 py-1 text-[11px] text-[#f1d58b]">{field}</span>)}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          {AGENCY_REGISTRY.map((agency) => {
            const score = scoreAgency(agency);
            const predictions = predictAgencyOpportunities(agency);
            return (
              <article key={agency.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-[#c9a24a]">{agency.type}</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">{agency.agency}</h2>
                  </div>
                  <span className="rounded-full border border-[#c9a24a]/30 px-3 py-1 text-xs text-[#f1d58b]">{score.total}</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-white/65">{agency.mission}</p>
                <div className="mt-5 space-y-3 text-sm text-white/70">
                  <p><span className="text-[#c9a24a]">Stage:</span> {agency.relationshipStage}</p>
                  <p><span className="text-[#c9a24a]">NAICS:</span> {agency.naicsUsed.join(", ")}</p>
                  <p><span className="text-[#c9a24a]">Cycle:</span> {agency.renewalCycle}</p>
                  <p><span className="text-[#c9a24a]">Prediction:</span> {predictions[0]?.signal} · {predictions[0]?.confidence}</p>
                </div>
              </article>
            );
          })}
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-[#c9a24a]/20 bg-[#0b1118] p-6">
            <h2 className="text-2xl font-semibold">Execution Pathway Intelligence</h2>
            <p className="mt-3 text-sm leading-6 text-white/65">Determines the best operational pathway from jurisdiction, country, document type, signer location, identity requirements, witnesses, timeline, translation, government requirements, client preferences, and field availability.</p>
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-[#c9a24a]">Recommended pathway</p>
              <p className="mt-2 text-2xl font-semibold">{pathway.recommendedPath}</p>
              <ul className="mt-3 space-y-2 text-sm text-white/65">{pathway.rationale.map((item) => <li key={item}>• {item}</li>)}</ul>
              <p className="mt-4 text-sm text-[#f1d58b]">{pathway.operatorNextAction}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-[#c9a24a]/20 bg-[#0b1118] p-6">
            <h2 className="text-2xl font-semibold">Three-Tier Pricing Engine Governance</h2>
            <p className="mt-3 text-sm leading-6 text-white/65">Every pricing model uses the existing pricing engine as the source of truth. This page does not create a second pricing calculator.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {Object.entries(UNIVERSAL_PRICING_MODELS).filter(([key]) => key !== "governance").map(([segment, tiers]) => (
                <div key={segment} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#c9a24a]">{segment}</p>
                  <p className="mt-2 text-sm text-white/65">{Array.isArray(tiers) ? tiers.join(" · ") : tiers}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-[#c9a24a]/20 bg-[#0b1118] p-6">
            <h2 className="text-2xl font-semibold">Government Opportunity Center</h2>
            <p className="mt-3 text-sm leading-6 text-white/65">A permanent Procurement Intelligence Center for opportunity watch, registrations, commodity code mapping, proposal assets, response history, and verified award tracking.</p>
            <div className="mt-5 flex flex-wrap gap-2">{GOVERNMENT_OPPORTUNITY_CENTER_SCOPE.tracks.map((track) => <span key={track} className="rounded-full border border-[#c9a24a]/25 px-3 py-1 text-xs text-[#f1d58b]">{track}</span>)}</div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">{GOVERNMENT_OPPORTUNITY_CENTER_SCOPE.features.map((feature) => <div key={feature} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/65">{feature}</div>)}</div>
          </div>

          <div className="rounded-3xl border border-[#c9a24a]/20 bg-[#0b1118] p-6">
            <h2 className="text-2xl font-semibold">Capability Statement Builder</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[governmentCapability, publicSectorCapability].map((statement) => (
                <div key={statement.variant} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-[#c9a24a]">{statement.variant}</p>
                  <h3 className="mt-2 font-semibold">{statement.headline}</h3>
                  <ul className="mt-3 space-y-2 text-sm text-white/65">{statement.coreCompetencies.slice(0, 4).map((item) => <li key={item}>• {item}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-3xl border border-[#c9a24a]/20 bg-[#0b1118] p-6">
            <h2 className="text-2xl font-semibold">Case Study Intelligence</h2>
            <p className="mt-3 text-sm leading-6 text-white/65">{CASE_STUDY_001_ITALY_BASELINE.label} is the canonical Italy training baseline. Revenue remains private until verified and approved for internal use.</p>
            <ol className="mt-4 space-y-2 text-sm text-white/65">{CASE_STUDY_001_ITALY_BASELINE.timeline.map((step) => <li key={step}>• {step}</li>)}</ol>
          </div>
          <div className="rounded-3xl border border-[#c9a24a]/20 bg-[#0b1118] p-6">
            <h2 className="text-2xl font-semibold">Trust Network Evolution</h2>
            <p className="mt-3 text-sm leading-6 text-white/65">Replace membership language with operational maturity progression.</p>
            <div className="mt-4 space-y-2">{TRUST_NETWORK_PROGRESSIONS.map((stage) => <div key={stage} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/70">{stage}</div>)}</div>
          </div>
          <div className="rounded-3xl border border-[#c9a24a]/20 bg-[#0b1118] p-6">
            <h2 className="text-2xl font-semibold">Intelligence Feedback Loop</h2>
            <p className="mt-3 text-sm leading-6 text-white/65">Every completed matter improves the operating system.</p>
            <div className="mt-4 flex flex-wrap gap-2">{INTELLIGENCE_FEEDBACK_TARGETS.map((target) => <span key={target} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/60">{target}</span>)}</div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-[#c9a24a]/20 bg-[#0b1118] p-6">
            <h2 className="text-2xl font-semibold">Legal Compliance Engine Injection</h2>
            <p className="mt-3 text-sm leading-6 text-white/65">Workbook intelligence is used as operational readiness data only. Source records, dates, insurance limits, notary/RON status, and folder links should remain append-only and verified before any government-facing packet is sent.</p>
            <ul className="mt-5 space-y-3 text-sm text-white/70">{workbookSignals.map((signal) => <li key={signal} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">{signal}</li>)}</ul>
          </div>
          <div className="rounded-3xl border border-[#c9a24a]/20 bg-[#0b1118] p-6">
            <h2 className="text-2xl font-semibold">Enterprise UI Standard</h2>
            <p className="mt-3 text-sm leading-6 text-white/65">Every OS page should follow the same operator pattern and avoid marketing-style screens inside the dashboard.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">{PLATFORM_UI_STANDARD.map((item) => <div key={item} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/65">{item}</div>)}</div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
          <h2 className="text-2xl font-semibold">Automation and Copilot Questions</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#c9a24a]">Reminder triggers</p>
              <div className="mt-3 flex flex-wrap gap-2">{automationReminders.map((item) => <span key={item} className="rounded-full border border-[#c9a24a]/25 px-3 py-1 text-xs text-[#f1d58b]">{item}</span>)}</div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#c9a24a]">Copilot can answer</p>
              <ul className="mt-3 grid gap-2 text-sm text-white/70 sm:grid-cols-2">
                <li>Which agencies buy services like ours?</li><li>Who have we never contacted?</li><li>Which registrations expire soon?</li><li>What opportunities match our capabilities?</li><li>Which contracts renew this quarter?</li><li>Which counties have no relationships?</li>
              </ul>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
