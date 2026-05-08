import { Header } from "@/components/landing/header";
import { GlobalIntel } from "@/components/landing/global-intel";
import { DocumentIntelligence } from "@/components/landing/document-intelligence";
import { Hero } from "@/components/landing/hero";
import { TrustStrip } from "@/components/landing/trust-strip";
import { Services } from "@/components/landing/services";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ExecutionTiers } from "@/components/landing/execution-tiers";
import { ClientTypes } from "@/components/landing/client-types";
import { GlobalMap } from "@/components/landing/global-map";
import { HighTrustClose } from "@/components/landing/high-trust-close";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />
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
        <GlobalMap />
      </div>
      <GlobalIntel />
      <DocumentIntelligence />
      <HighTrustClose />
      <Footer />
    </main>
  );
}
