import { Header } from "@/components/landing/header";
import { GlobalIntel } from "@/components/landing/global-intel";
import { DocumentIntelligence } from "@/components/landing/document-intelligence";
import { Hero } from "@/components/landing/hero";
import { TrustStrip } from "@/components/landing/trust-strip";
import { RitualOverlay } from "@/components/landing/ritual-overlay";
import { Services } from "@/components/landing/services";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ExecutionTiers } from "@/components/landing/execution-tiers";
import { ClientTypes } from "@/components/landing/client-types";
import { GlobalMap } from "@/components/landing/global-map";
import { RoutingIntelligenceSection } from "@/components/landing/routing-intelligence-section";
import { HighTrustClose } from "@/components/landing/high-trust-close";
import { PaymentFounder } from "@/components/landing/payment-founder";
import { Footer } from "@/components/landing/footer";
import { PlatformPrinciples } from "@/components/landing/platform-principles";
import { CinematicStage } from "@/components/landing/cinematic-stage";
import { IntelligenceRail } from "@/components/landing/IntelligenceRail";
import { ExecutionStatusTicker } from "@/components/landing/ExecutionStatusTicker";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <RitualOverlay />
      <Header />
      <IntelligenceRail />
      <ExecutionStatusTicker />
      <CinematicStage>
        <Hero />
        <TrustStrip />
        <div id="services">
          <Services />
        </div>
        <div id="process">
          <HowItWorks />
        </div>
        <div id="pricing">
          <ExecutionTiers />
        </div>
        <ClientTypes />
        <div id="countries">
          <RoutingIntelligenceSection />
          <GlobalMap />
        </div>
      </CinematicStage>
      <GlobalIntel />
      <DocumentIntelligence />
      <HighTrustClose />
      <PaymentFounder />
      <PlatformPrinciples />
      <Footer />
    </main>
  );
}
