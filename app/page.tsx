import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { TrustStrip } from "@/components/landing/trust-strip";
import { RitualEntryLock } from "@/components/ritual/RitualEntryLock";
import { MilanoTrustCore } from "@/components/landing/milano-trust-core";
import { Services } from "@/components/landing/services";
import { DocumentIntelligence } from "@/components/landing/document-intelligence";
import { PaymentFounder } from "@/components/landing/payment-founder";
import { ClientTypes } from "@/components/landing/client-types";
import { HighTrustClose } from "@/components/landing/high-trust-close";
import { Footer } from "@/components/landing/footer";
import { CinematicStage } from "@/components/landing/cinematic-stage";
import { IntelligenceRail } from "@/components/landing/IntelligenceRail";
import { HomepageRoutingPreview } from "@/components/landing/homepage-routing-preview";
import { PersonaRouting } from "@/components/landing/persona-routing";
import type { Metadata } from "next";
import { HowItWorks } from "@/components/landing/how-it-works";
import { CorridorTimeStrip } from "@/components/landing/corridor-time-strip";
import { PublicFAQ } from "@/components/conversion/PublicFAQ";
import { TrustProof } from "@/components/conversion/TrustProof";
import { FinalCTA } from "@/components/conversion/FinalCTA";

export const metadata: Metadata = {
  title: "The Milano Seal™ | International Notary, Apostille & Document Execution",
  description:
    "Premium international document execution support for apostille coordination, notarization, secure intake, matter tracking, and document release.",
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <RitualEntryLock
        sessionKey="milano_ritual_home_seen"
        sectionLabel="Structuring secure matter environment"
        steps={[
          "Verifying secure workspace",
          "Preparing Global Document Intelligence",
          "Reviewing execution pathway",
          "Checking payment-gated scheduling",
          "Structuring chain-of-custody visibility",
          "Ready for review",
        ]}
      />
      <Header />
      <IntelligenceRail />
      <CorridorTimeStrip />
      <CinematicStage>
        {/* 1. Hero — globe replaces founder card */}
        <Hero />

        {/* 2. Trust strip — credential badges */}
        <TrustStrip />

        {/* 2b. Persona routing — explicit door per visitor type */}
        <PersonaRouting />

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

        {/* 6. Guided routing preview — full workspace remains on /map */}
        <div id="map">
          <HomepageRoutingPreview />
        </div>

        {/* 6. What Are You Executing — document type grid */}
        <DocumentIntelligence />

        {/* 8. Payment gate + Founder-Led Execution */}
        <PaymentFounder />

        {/* 9. Who We Serve */}
        <ClientTypes />
      </CinematicStage>

      {/* 10. Ready to Execute CTA */}
      <HighTrustClose />

      <TrustProof />
      <PublicFAQ />
      <FinalCTA />

      <Footer />
    </main>
  );
}
