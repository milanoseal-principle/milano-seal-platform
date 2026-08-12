import Link from "next/link";
import { ALLIANCE_MEMBER_TYPES, ALLIANCE_POSITIONING } from "@/lib/alliance/memberTypes";
import { ALLIANCE_ONBOARDING_PIPELINE } from "@/lib/alliance/onboardingPipeline";
import { ALLIANCE_SCORE_CATEGORIES, allianceStanding } from "@/lib/alliance/readinessScore";
import { ALLIANCE_PASSPORT_FIELDS, ALLIANCE_LEVELS } from "@/lib/alliance/alliancePassport";
import { ALLIANCE_DISPATCH_STAGES, DISPATCH_SAFETY_RULES } from "@/lib/alliance/dispatchEngine";
import { ALLIANCE_COMPLIANCE_ITEMS } from "@/lib/alliance/complianceEngine";
import { TRUST_LEDGER_EVENT_TYPES, TRUST_LEDGER_RULES } from "@/lib/alliance/trustLedger";
import { PLATFORM_SPACES } from "@/lib/trust-network/platformSpaces";
import { TRUST_NETWORK_POSITIONING, TRUST_NETWORK_TIERS } from "@/lib/trust-network/tierRegistry";
import { VALUE_STACK, DIGITAL_PRODUCTS } from "@/lib/trust-network/valueModel";
import { TRUST_NETWORK_REVENUE_LINES } from "@/lib/trust-network/revenueModel";
import { TRUST_NETWORK_SAFETY_RULES } from "@/lib/trust-network/safetyRules";
import { APOSTILLE_ROUTING_ENGINE } from "@/lib/intelligence-platform/apostilleRoutingEngine";
import { GOVERNMENT_CENTER_CAPABILITIES, GOVERNMENT_OPPORTUNITY_SIGNALS } from "@/lib/intelligence-platform/governmentOpportunityCenter";
import { GLOBAL_COVERAGE_NOTE, GLOBAL_JURISDICTION_REGISTRY } from "@/lib/intelligence-platform/globalJurisdictionRegistry";
import { HAGUE_INTELLIGENCE_ENGINE } from "@/lib/intelligence-platform/hagueIntelligenceEngine";
import { COMPLIANCE_REVIEW_ENGINE, EXECUTION_QA_CHECKS } from "@/lib/intelligence-platform/executionQAEngine";
import { SMART_INTAKE_FACTORS, SMART_INTAKE_OUTCOME } from "@/lib/intelligence-platform/smartIntakeEngine";
import { EXECUTION_LANE_ADD_ONS, EXPEDITED_EXECUTION_PROTOCOL, THREE_TIER_EXECUTION_LANES } from "@/lib/intelligence-platform/threeTierPricingEngine";
import { PLATFORM_REVENUE_CAPABILITIES, REVENUE_FORECAST_RULES } from "@/lib/intelligence-platform/revenueForecastEngine";

const shell = "min-h-screen bg-[#050507] text-white";
const wrap = "mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 lg:px-10";
const eyebrow = "font-mono text-[10px] uppercase tracking-[0.28em] text-[#c9a65a]";
const h1 = "font-serif text-4xl text-white sm:text-5xl";
const h2 = "font-serif text-2xl text-white";
const card = "rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.25)]";
const muted = "text-sm leading-6 text-white/68";

function Section({ title, eyebrowText, children }: { title: string; eyebrowText?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5 py-8">
      {eyebrowText ? <p className={eyebrow}>{eyebrowText}</p> : null}
      <h2 className={h2}>{title}</h2>
      {children}
    </section>
  );
}

function PillCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={card}>
      <h3 className="font-serif text-lg text-[#f7e7b2]">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Price({ value }: { value?: number }) {
  if (!value) return <span className="text-white/50">Application</span>;
  return <span className="text-[#d6b86a]">${value.toLocaleString()}</span>;
}

export function TrustNetworkCommandCenter() {
  return (
    <main className={shell}>
      <div className={wrap}>
        <div className="rounded-3xl border border-[#c9a65a]/25 bg-[radial-gradient(circle_at_top_left,rgba(201,166,90,0.22),transparent_34%),linear-gradient(135deg,#08080a,#101014)] p-8 sm:p-10">
          <p className={eyebrow}>{TRUST_NETWORK_POSITIONING.category}</p>
          <h1 className={`${h1} mt-4`}>{TRUST_NETWORK_POSITIONING.product}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-white/74">{TRUST_NETWORK_POSITIONING.coreMessage}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard/alliance" className="rounded-full border border-[#c9a65a]/40 px-4 py-2 text-sm text-[#f7e7b2]">Open Alliance</Link>
            <Link href="/dashboard/intelligence-platform" className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/75">Open Intelligence Platform</Link>
          </div>
        </div>
        <MembershipTierGrid />
        <ValueStackCards />
        <PlatformSpaceGrid />
        <RevenueLedgerPanel />
      </div>
    </main>
  );
}

export function MembershipTierGrid() {
  return (
    <Section title="Trust Network Licenses" eyebrowText="Pricing model">
      <div className="grid gap-4 lg:grid-cols-3">
        {TRUST_NETWORK_TIERS.map((tier) => (
          <PillCard key={tier.id} title={tier.name}>
            <p className={muted}>{tier.tagline}</p>
            <div className="mt-4 text-2xl font-semibold"><Price value={tier.monthlyPrice} /> <span className="text-sm text-white/45">/ month</span></div>
            {tier.annualPrice ? <p className="text-sm text-white/55">${tier.annualPrice.toLocaleString()} annual</p> : null}
            {tier.applicationFee ? <p className="text-sm text-white/55">${tier.applicationFee.toLocaleString()} application fee</p> : null}
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              {tier.includes.slice(0, 7).map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </PillCard>
        ))}
      </div>
    </Section>
  );
}

export function ValueStackCards() {
  return (
    <Section title="Why They Pay" eyebrowText="Value stack">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {VALUE_STACK.map((item) => (
          <PillCard key={item.name} title={item.name}>
            <p className="text-[#d6b86a]">Value: {item.estimatedValue}</p>
            <p className={muted}>{item.description}</p>
          </PillCard>
        ))}
      </div>
    </Section>
  );
}

export function PlatformSpaceGrid() {
  return (
    <Section title="Operating Centers" eyebrowText="Professional infrastructure">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PLATFORM_SPACES.map((space) => (
          <PillCard key={space.id} title={space.name}>
            <p className={muted}>{space.purpose}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[#c9a65a]/80">Outcomes</p>
            <p className={muted}>{space.outcomes.join(" • ")}</p>
          </PillCard>
        ))}
      </div>
    </Section>
  );
}

export function PartnerDirectory() {
  return <PillCard title="Partner Directory™"><p className={muted}>Verified specialty profiles, coverage maps, languages, RON status, service areas, specialties, and availability signals.</p></PillCard>;
}

export function PartnerVerificationPanel() {
  return <PillCard title="Partner Verification"><p className={muted}>Identity, licensing, RON status, training, agreement, and operational readiness review before public status display.</p></PillCard>;
}

export function ReferralRoutingBoard() {
  return <PillCard title="Referral Routing Board"><p className={muted}>Routing eligibility, opportunity matching, and coverage need visibility without any referral or income guarantee.</p></PillCard>;
}

export function MatterDispatchBoard() {
  return (
    <PillCard title="Matter Dispatch Board">
      <div className="grid gap-2 sm:grid-cols-2">
        {ALLIANCE_DISPATCH_STAGES.map((stage) => <p key={stage.order} className="rounded-xl bg-white/[0.04] p-3 text-sm text-white/72">{stage.order}. {stage.label}</p>)}
      </div>
    </PillCard>
  );
}

export function PartnerScorecard() {
  return <PillCard title="Partner Scorecard"><p className={muted}>Sample standing: 92 / 100 — {allianceStanding(92)}. Scored across identity, licensing, RON, insurance, response, communication, QA, feedback, completion, international, healthcare, and government readiness.</p></PillCard>;
}

export function AllianceOnboardingPipeline() {
  return (
    <Section title="Alliance Onboarding™" eyebrowText="Verify • Deploy • Coordinate • Execute">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {ALLIANCE_ONBOARDING_PIPELINE.map((step) => <PillCard key={step.order} title={`${step.order}. ${step.label}`}><p className={muted}>{step.description}</p></PillCard>)}
      </div>
    </Section>
  );
}

export function AlliancePassportPanel() {
  return <PillCard title="Alliance Passport™"><p className={muted}>{ALLIANCE_PASSPORT_FIELDS.map((field) => field.label).join(" • ")}</p></PillCard>;
}

export function AllianceReadinessScore() {
  return <PillCard title="Alliance Readiness Score™"><p className={muted}>{ALLIANCE_SCORE_CATEGORIES.map((category) => category.label).join(" • ")}</p></PillCard>;
}

export function AllianceComplianceTracker() {
  return <PillCard title="Alliance Compliance Engine™"><p className={muted}>{ALLIANCE_COMPLIANCE_ITEMS.map((item) => item.label).join(" • ")}</p></PillCard>;
}

export function TrustLedgerPanel() {
  return <PillCard title="Trust Ledger™"><p className={muted}>{TRUST_LEDGER_RULES.join(" ")} Events: {TRUST_LEDGER_EVENT_TYPES.map((event) => event.type).join(" • ")}</p></PillCard>;
}

export function IntelligenceEnginePanel() {
  return <PillCard title="The Milano Seal Intelligence Engine™"><p className={muted}>Every completed matter improves jurisdiction intelligence, dispatch decisions, pricing guidance, QA standards, government opportunity scoring, and execution guidance.</p></PillCard>;
}

export function ThreeTierPricingEnginePanel() {
  return (
    <Section title="Three-Tier Client Pricing Engine" eyebrowText="Canonical Milano Seal pricing">
      <div className="grid gap-4 lg:grid-cols-3">
        {THREE_TIER_EXECUTION_LANES.map((lane) => <PillCard key={lane.id} title={lane.name}><p className="text-2xl text-[#d6b86a]">${lane.price.toLocaleString()}</p><p className={muted}>{lane.timeline}</p><p className="mt-3 text-sm text-white/60">{lane.includes.join(" • ")}</p></PillCard>)}
      </div>
      <PillCard title="Add-ons"><p className={muted}>{EXECUTION_LANE_ADD_ONS.map((a) => `${a.label}: ${a.price}`).join(" • ")}</p></PillCard>
    </Section>
  );
}

export function SmartIntakeEnginePanel() {
  return <PillCard title="Smart Intake Engine™"><p className={muted}>{SMART_INTAKE_FACTORS.map((factor) => factor.label).join(" • ")}. {SMART_INTAKE_OUTCOME}</p></PillCard>;
}

export function HagueIntelligencePanel() {
  return <PillCard title="Hague Intelligence Engine™"><p className={muted}>{HAGUE_INTELLIGENCE_ENGINE.tracks.join(" • ")}. {HAGUE_INTELLIGENCE_ENGINE.verificationRule}</p></PillCard>;
}

export function GovernmentOpportunityCenter() {
  return <PillCard title="Government Opportunity Center™"><p className={muted}>{GOVERNMENT_CENTER_CAPABILITIES.join(" • ")}. Signals: {GOVERNMENT_OPPORTUNITY_SIGNALS.map((signal) => signal.source).join(" • ")}</p></PillCard>;
}

export function InternationalCorridorRoom() {
  return <PillCard title="International Corridor Intelligence™"><p className={muted}>{GLOBAL_JURISDICTION_REGISTRY.map((record) => `${record.country} (${record.pathway})`).join(" • ")}. {GLOBAL_COVERAGE_NOTE}</p></PillCard>;
}

export function ApostilleRoutingLibrary() {
  return <PillCard title="Apostille Routing Engine™"><p className={muted}>{APOSTILLE_ROUTING_ENGINE.pathways.map((path) => path.label).join(" • ")}. {APOSTILLE_ROUTING_ENGINE.safety}</p></PillCard>;
}

export function ExecutionQAPanel() {
  return <PillCard title="Execution QA Engine™"><p className={muted}>{COMPLIANCE_REVIEW_ENGINE.rule} Checks: {EXECUTION_QA_CHECKS.join(" • ")}</p></PillCard>;
}

export function RevenueLedgerPanel() {
  return <PillCard title="Revenue Ledger"><p className={muted}>{TRUST_NETWORK_REVENUE_LINES.map((line) => line.label).join(" • ")}. Forecast rules: {REVENUE_FORECAST_RULES.join(" ")}</p></PillCard>;
}

export function ExecutiveDashboardPanel() {
  return <PillCard title="Executive Dashboard™"><p className={muted}>Revenue, pipeline, partners, government, international, healthcare, airport, AI recommendations, opportunity scoring, dispatch health, and partner readiness.</p></PillCard>;
}

export function AllianceCommandCenter() {
  return (
    <main className={shell}>
      <div className={wrap}>
        <p className={eyebrow}>{ALLIANCE_POSITIONING.tagline}</p>
        <h1 className={`${h1} mt-3`}>{ALLIANCE_POSITIONING.name}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-white/72">{ALLIANCE_POSITIONING.mission}</p>
        <Section title="Alliance Member Types"><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{ALLIANCE_MEMBER_TYPES.map((type) => <PillCard key={type.id} title={type.label}><p className={muted}>{type.examples.join(" • ")}</p><p className={muted}>{type.value}</p></PillCard>)}</div></Section>
        <AllianceOnboardingPipeline />
        <div className="grid gap-4 lg:grid-cols-2"><AlliancePassportPanel /><AllianceReadinessScore /><AllianceComplianceTracker /><PartnerScorecard /><MatterDispatchBoard /><TrustLedgerPanel /></div>
        <p className="mt-8 text-xs text-white/45">{DISPATCH_SAFETY_RULES.join(" ")}</p>
      </div>
    </main>
  );
}

export function IntelligencePlatformCommandCenter() {
  return (
    <main className={shell}>
      <div className={wrap}>
        <p className={eyebrow}>Analyze • Predict • Optimize • Scale</p>
        <h1 className={`${h1} mt-3`}>The Milano Seal™ Intelligence Platform</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-white/72">AI-driven knowledge graph, procurement intelligence, international corridor analytics, pricing intelligence, and operational forecasting.</p>
        <div className="mt-8 grid gap-4 lg:grid-cols-2"><SmartIntakeEnginePanel /><ExecutionQAPanel /><ApostilleRoutingLibrary /><HagueIntelligencePanel /><GovernmentOpportunityCenter /><InternationalCorridorRoom /><IntelligenceEnginePanel /><ExecutiveDashboardPanel /></div>
        <ThreeTierPricingEnginePanel />
        <PillCard title="Expedited Execution Protocol"><p className={muted}>{EXPEDITED_EXECUTION_PROTOCOL.summary} {EXPEDITED_EXECUTION_PROTOCOL.caveat}</p></PillCard>
      </div>
    </main>
  );
}

export function SOPLibraryPanel() { return <PillCard title="SOP Library"><p className={muted}>{DIGITAL_PRODUCTS.join(" • ")}</p></PillCard>; }
export function TrustNetworkEvents() { return <PillCard title="Monthly Live Intelligence Briefing™"><p className={muted}>Law updates, country updates, RON updates, apostille updates, government opportunities, and implementation Q&A.</p></PillCard>; }
export function PartnerSpotlightPanel() { return <PillCard title="Partner Spotlight"><p className={muted}>Approved visibility for verified profiles without guaranteed referrals or income claims.</p></PillCard>; }
