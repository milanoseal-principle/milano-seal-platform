import type { Metadata } from "next";
import { LocalApostillePage } from "@/components/seo/LocalApostillePage";

export const metadata: Metadata = {
  title: "Florida International Notary Coordination | The Milano Seal™",
  description:
    "Remote Online Notarization and mobile notary coordination for international documents prepared in Florida. RON-notarized documents are eligible for Florida apostille.",
  alternates: { canonical: "https://www.themilanoseal.com/florida/international-notary" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <LocalApostillePage
      cityName="Florida"
      regionLabel="Florida"
      slug="florida"
      canonicalPath="/florida/international-notary"
      headline="Florida International Notary Coordination"
      description="Remote Online Notarization (RON) and mobile notary coordination for international documents originating in Florida. Florida RON-notarized documents are eligible for apostille by the Florida Department of State."
      nearbyAreas={["Tampa", "St. Petersburg", "Clearwater", "Sarasota", "Orlando", "Miami"]}
      metaTitle="Florida International Notary Coordination | The Milano Seal™"
      metaDescription="Remote Online Notarization and mobile notary coordination for international documents prepared in Florida. RON-notarized documents are eligible for Florida apostille."
    />
  );
}
