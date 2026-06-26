import { Metadata } from "next";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { GlobalMap } from "@/components/landing/global-map";
import { RoutingIntelligenceSection } from "@/components/landing/routing-intelligence-section";
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

export default function MapPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#060606] pb-0 pt-20">
        <div className="mx-auto max-w-7xl px-4 pb-7 pt-7 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-[#C6A55A] text-xs tracking-[0.3em] uppercase font-medium mb-4">
              Full Operational Intelligence Workspace
            </p>
            <h1 className="font-serif text-3xl md:text-5xl font-medium text-white mb-5">
              Global Document Intelligence <em className="text-[#C6A55A]">Atlas</em>
            </h1>
            <p className="text-[#8A8A8A] text-base md:text-lg font-light max-w-2xl mb-6">
              Explore destination corridors, matter vectors, jurisdictional frameworks,
              procedural sequences, translation review, and international release pathways.
            </p>
            <div style={{ width: 80, height: 1, background: "linear-gradient(90deg, transparent, rgba(198,165,90,0.4), transparent)" }} />
          </div>
        </div>

        <GlobalMap />
        <RoutingIntelligenceSection />
        <CorridorTimeStrip />
      </main>
      <Footer />
    </>
  );
}
