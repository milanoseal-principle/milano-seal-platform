import type { Metadata } from "next";
import { ServicePageLayout } from "@/components/module2/ServicePageLayout";

export const metadata: Metadata = {
  title: "Apostille & Authentication Coordination | The Milano Seal™",
  description:
    "Apostille and authentication routing coordination based on document authority and destination review for international document use.",
  alternates: {
    canonical: "https://www.themilanoseal.com/services/apostille-authentication",
  },
};

export default function ApostilleAuthenticationPage() {
  return (
    <ServicePageLayout
      h1="Apostille & Authentication Coordination"
      intro="We determine how a document should be authenticated for international use — reviewing its issuing authority and destination to route it through the correct state, federal, or consular path."
      sections={[
        {
          title: "What we review",
          items: [
            "The document's issuing authority and jurisdiction",
            "Whether state apostille or federal authentication applies",
            "Destination classification (operator-reviewed, not absolute)",
            "Whether county, registrar, or agency certification is needed first",
          ],
        },
        {
          title: "How coordination works",
          items: [
            "Secure intake and document review first",
            "Routing determined by document authority and destination",
            "Return delivery and final packet assembly",
          ],
        },
      ]}
    />
  );
}
