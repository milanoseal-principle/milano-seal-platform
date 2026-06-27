import { Metadata } from "next";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { GlobalMap } from "@/components/landing/global-map";
import { RoutingIntelligenceSection } from "@/components/landing/routing-intelligence-section";
import { MilanoPublicCtaModule } from "@/components/conversion/MilanoPublicCtaModule";
import { CorridorTimeStrip } from "@/components/landing/corridor-time-strip";

export const metadata: Metadata = {
  title: "Global Document Intelligence Atlas | The Milano Seal™",
  description: "Review international document execution pathways, apostille routing, jurisdiction intelligence, and secure U.S. document coordination through The Milano Seal™.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Global Document Intelligence Atlas | The Milano Seal™",
    description: "Review international document execution pathways, apostille routing, jurisdiction intelligence, and secure U.S. document coordination through The Milano Seal™.",
    url: "https://themilanoseal.com/map",
    siteName: "The Milano Seal™",
    type: "website",
  },
  alternates: { canonical: "https://themilanoseal.com/map" },
};

export default async function MapPage({ searchParams }: { searchParams: Promise<{ country?: string }> }) {
  const { country } = await searchParams
  return (
    <>
      <Header />
      <main className="bg-[#060606] min-h-screen pb-0 overflow-x-hidden" style={{ paddingTop: "calc(var(--header-total-height) + var(--sa-top))" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
          <div className="mb-4 md:mb-6">
            <p className="text-[#C6A55A] text-[10px] md:text-xs tracking-[0.24em] md:tracking-[0.3em] uppercase font-medium mb-2 md:mb-4">
              Full Operational Intelligence Workspace
            </p>
            <h1 className="font-serif text-2xl md:text-4xl lg:text-5xl font-medium text-white mb-3 md:mb-5">
              Global Document Intelligence <em className="text-[#C6A55A]">Atlas</em>
            </h1>
            <p className="text-[#8A8A8A] text-sm md:text-base font-light max-w-2xl mb-3 md:mb-6 leading-relaxed">
              Explore destination corridors, matter vectors, jurisdictional frameworks,
              procedural sequences, translation review, and international release pathways.
            </p>
            <div style={{ width: 80, height: 1, background: "linear-gradient(90deg, transparent, rgba(198,165,90,0.4), transparent)" }} />
          </div>
        </div>

        <GlobalMap initialCountry={country} />
        <RoutingIntelligenceSection />
        <CorridorTimeStrip />
      </main>
      <MilanoPublicCtaModule className="py-12" />
      <Footer />
    </>
  );
}
