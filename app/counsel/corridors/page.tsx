import { PublicShell } from "@/components/layout/PublicShell";
import { CounselDiscoveryList } from "@/components/counsel/CounselContent";
import type { Metadata } from "next";
import "../counsel.css";
export const metadata: Metadata = {
  title: "U.S. Execution Corridors for Counsel | The Milano Seal™",
  description:
    "Destination context for international counsel coordinating the U.S. execution side of a client Matter.",
  alternates: { canonical: "https://www.themilanoseal.com/counsel/corridors" },
  openGraph: {
    type: "website",
    url: "https://www.themilanoseal.com/counsel/corridors",
    images: ["/og-image.png"],
  },
};
export default function Page() {
  return (
    <PublicShell>
      <main className="counsel-page">
        <CounselDiscoveryList kind="corridors" />
      </main>
    </PublicShell>
  );
}
