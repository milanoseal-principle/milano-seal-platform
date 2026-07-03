import type { Metadata } from "next";
import { ServicePageLayout } from "@/components/module2/ServicePageLayout";

export const metadata: Metadata = {
  title: "Federal Apostille & Authentication | The Milano Seal™",
  description:
    "Coordination for federal document authentication routing, including federally issued documents and FBI Identity History Summaries.",
  alternates: {
    canonical:
      "https://www.themilanoseal.com/services/federal-apostille-authentication",
  },
};

export default function FederalApostilleAuthenticationPage() {
  return (
    <ServicePageLayout
      h1="Federal Apostille & Authentication"
      intro="Federally issued documents follow a different path than state records. We coordinate federal authentication routing through the U.S. Department of State for documents that require it."
      sections={[
        {
          title: "Documents that route federally",
          items: [
            "FBI Identity History Summaries",
            "Federal agency documents",
            "Documents bearing a federal seal or certification",
          ],
        },
        {
          title: "How coordination works",
          items: [
            "Secure intake and document review first",
            "Federal authentication routing coordination",
            "Destination review (operator-reviewed, not absolute)",
            "Return delivery and final packet assembly",
          ],
        },
      ]}
    />
  );
}
