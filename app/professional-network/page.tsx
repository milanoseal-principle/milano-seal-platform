import type { Metadata } from "next";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ProfessionalNetworkExperience } from "@/components/professional-network/ProfessionalNetworkExperience";

export const metadata: Metadata = {
  title: "The Milano Seal Professional Network™",
  description:
    "Professional network infrastructure for international counsel, verified execution partners, and Milano execution coordinators working across governed cross-border Matters.",
};

export default function ProfessionalNetworkPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050507]">
      <Header />
      <div style={{ paddingTop: "calc(var(--header-total-height) + var(--sa-top))" }}>
        <ProfessionalNetworkExperience />
      </div>
      <Footer />
    </main>
  );
}
