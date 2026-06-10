import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { TrustStrip } from "@/components/landing/trust-strip";
import { RitualOverlay } from "@/components/landing/ritual-overlay";
import { MilanoTrustCore } from "@/components/landing/milano-trust-core";
import { Services } from "@/components/landing/services";
import { GlobalMap } from "@/components/landing/global-map";
import { DocumentIntelligence } from "@/components/landing/document-intelligence";
import { ExecutionTiers } from "@/components/landing/execution-tiers";
import { PaymentFounder } from "@/components/landing/payment-founder";
import { ClientTypes } from "@/components/landing/client-types";
import { HighTrustClose } from "@/components/landing/high-trust-close";
import { Footer } from "@/components/landing/footer";
import { CinematicStage } from "@/components/landing/cinematic-stage";
import { IntelligenceRail } from "@/components/landing/IntelligenceRail";
import { JurisdictionComplianceLookup } from "@/components/landing/jurisdiction-compliance-lookup";
import { HowItWorks } from "@/components/landing/how-it-works";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <RitualOverlay />
      <Header />
      <IntelligenceRail />
      <CinematicStage>
        {/* 1. Hero — globe replaces founder card */}
        <Hero />

        {/* 2. Trust strip — credential badges */}
        <TrustStrip />

        {/* 3. Milano Trust Core — 6 pillars */}
        <div id="principles">
          <MilanoTrustCore />
        </div>

        {/* 4. Services — RON, Apostille, International Execution, Mobile Notary */}
        <div id="services">
          <Services />
        </div>

        {/* 5. How It Works — #process nav target */}
        <div id="process">
          <HowItWorks />
        </div>

        {/* 6. Jurisdiction compliance lookup */}
        <div id="countries">
          <JurisdictionComplianceLookup />
          <GlobalMap />
        </div>

        {/* 6. What Are You Executing — document type grid */}
        <DocumentIntelligence />

        {/* 7. Execution tiers — Signature / Priority / Executive */}
        <div id="pricing">
          <ExecutionTiers />
        </div>

        {/* 8. Payment gate + Founder-Led Execution */}
        <PaymentFounder />

        {/* 9. Who We Serve */}
        <ClientTypes />
      </CinematicStage>

      {/* 10. Ready to Execute CTA */}
      <HighTrustClose />

      <Footer />
    </main>
  );
}
