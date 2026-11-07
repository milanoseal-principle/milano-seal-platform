import { PublicShell } from "@/components/layout/PublicShell";
import { CounselDiscoveryList } from "@/components/counsel/CounselContent";
import type { Metadata } from "next";
import "../counsel.css";
export const metadata: Metadata = {
  title: "Professional Execution Support Situations | The Milano Seal™",
  description:
    "U.S. document execution support for counsel and professional advisers. Legal strategy and legal sufficiency remain with counsel.",
  alternates: { canonical: "https://www.themilanoseal.com/counsel/use-cases" },
  openGraph: {
    type: "website",
    url: "https://www.themilanoseal.com/counsel/use-cases",
    images: ["/og-image.png"],
  },
};
export default function Page() {
  return (
    <PublicShell>
      <main className="counsel-page">
        <CounselDiscoveryList kind="use-cases" />
      </main>
    </PublicShell>
  );
}
