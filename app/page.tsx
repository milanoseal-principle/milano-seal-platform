import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { TrustStrip } from "@/components/landing/trust-strip";
import { MilanoTrustCore } from "@/components/landing/milano-trust-core";
import { TrustCoreCinematicField } from "@/components/landing/TrustCoreCinematicField";
import { Services } from "@/components/landing/services";
import { PaymentFounder } from "@/components/landing/payment-founder";
import { HighTrustClose } from "@/components/landing/high-trust-close";
import { Footer } from "@/components/landing/footer";
import { CinematicStage } from "@/components/landing/cinematic-stage";
import { ServiceRouter } from "@/components/landing/service-router";
import { GlobeCountryNodePopover } from "@/components/landing/GlobeCountryNodePopover";
import type { Metadata } from "next";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PublicFAQ } from "@/components/conversion/PublicFAQ";
import { FinalCTA } from "@/components/conversion/FinalCTA";
import { SectionReveal } from "@/components/motion/SectionReveal";

export const metadata: Metadata = {
  title: "The Milano Seal™ | International Document Execution & Apostille Coordination",
  description:
    "International Document Execution, Apostille Coordination, Remote Online Notarization, Florida Mobile Notary Coordination, Witness Coordination, and secure final packet release for U.S. documents intended for use abroad.",
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />
      <GlobeCountryNodePopover />
      <CinematicStage>
        <Hero />
        <ServiceRouter />
        <section className="border-y border-[#C6A65B]/25 bg-[#10120F] px-6 py-12 text-white"><div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 md:flex-row md:items-center"><div><p className="text-xs uppercase tracking-[.2em] text-[#C6A65B]">Foreign counsel</p><h2 className="mt-3 font-serif text-3xl">Need something executed in the United States?</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-white/75">Your client is here. Their document needs to work abroad. The Milano Seal coordinates the U.S. execution side.</p><p className="mt-2 text-sm text-white/75">You retain the legal work. We coordinate execution.</p></div><Link href="/counsel" className="inline-flex min-h-12 shrink-0 items-center justify-center border border-[#C6A65B] px-6 py-3 text-sm text-[#E1C78F] focus-visible:outline-2 focus-visible:outline-offset-4">Send a U.S. Matter ↗︎</Link></div></section>
        <SectionReveal><TrustStrip /></SectionReveal>
        <div id="principles">
          <TrustCoreCinematicField>
            <MilanoTrustCore />
          </TrustCoreCinematicField>
        </div>
        <SectionReveal className="w-full"><div id="services"><Services /></div></SectionReveal>
        <SectionReveal className="w-full"><div id="process"><HowItWorks /></div></SectionReveal>
        <SectionReveal className="w-full">
          <section id="map" className="mx-auto w-full max-w-6xl px-6 py-12 text-white">
            <h2 className="font-serif text-3xl">Review your destination requirements</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">Explore country and document guidance, then request a review of your specific document and receiving authority.</p>
            <Link href="/map" className="mt-5 inline-flex min-h-12 items-center rounded-lg border border-[var(--ms-gold)] px-6 text-sm text-[var(--ms-gold)] focus-visible:ring-2">Explore destination guidance</Link>
          </section>
        </SectionReveal>
        <PaymentFounder />
      </CinematicStage>
      <HighTrustClose />
      <PublicFAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
