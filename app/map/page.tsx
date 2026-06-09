import { Metadata } from "next";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { RoutingIntelligenceSection } from "@/components/landing/routing-intelligence-section";
import { CorridorTimeStrip } from "@/components/landing/corridor-time-strip";

export const metadata: Metadata = {
  title: "Global Routing Intelligence | The Milano Seal™",
  description: "Active document execution corridors from Florida into high-demand international jurisdictions. Italy, Spain, Portugal, UAE, Brazil, Mexico, and more.",
  robots: { index: true, follow: true },
};

export default function MapPage() {
  return (
    <>
      <Header />
      <main className="bg-[#060606] min-h-screen pt-24 pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          <div className="mb-10">
            <p className="text-[#C6A55A] text-xs tracking-[0.3em] uppercase font-medium mb-4">
              Global Routing Intelligence
            </p>
            <h1 className="font-serif text-3xl md:text-5xl font-medium text-white mb-5">
              Priority Destination <em className="text-[#C6A55A]">Corridors</em>
            </h1>
            <p className="text-[#8A8A8A] text-base md:text-lg font-light max-w-2xl mb-6">
              Active document execution pathways from Florida into high-demand international jurisdictions.
              Each corridor reflects apostille routing, consular authentication requirements, and execution path review.
            </p>
            <div style={{ width: 80, height: 1, background: "linear-gradient(90deg, transparent, rgba(198,165,90,0.4), transparent)" }} />
          </div>
        </div>

        <RoutingIntelligenceSection />
        <CorridorTimeStrip />
      </main>
      <Footer />
    </>
  );
}
