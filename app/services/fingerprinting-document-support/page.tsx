import type { Metadata } from "next";
import { ServicePageLayout } from "@/components/module2/ServicePageLayout";

export const metadata: Metadata = {
  title: "Fingerprinting Document Support | The Milano Seal™",
  description:
    "Coordination and document routing support for fingerprint-based submissions, identity-history requests, and downstream authentication.",
  alternates: {
    canonical: "https://www.themilanoseal.com/services/fingerprinting-document-support",
  },
};

export default function FingerprintingDocumentSupportPage() {
  return (
    <ServicePageLayout
      h1="Fingerprinting Document Support"
      intro="We coordinate the document side of fingerprint-based submissions — reviewing which authority is requesting the record, what instructions apply, and how results move toward authentication when needed."
      sections={[
        {
          title: "What we review",
          items: [
            "The requesting authority and its instructions",
            "Whether an ORI or agency instruction packet is required",
            "Whether an electronic livescan or card-based route applies",
            "Whether results are intended for downstream apostille or authentication",
          ],
        },
        {
          title: "How coordination works",
          items: [
            "Secure intake and document review first",
            "Operator confirmation of required instructions before any submission",
            "Partner or mobile coordination arranged only after review",
          ],
        },
      ]}
      disclaimers={[
        "The Milano Seal provides document coordination support and does not provide legal advice.",
        "An FBI Identity History Summary is a personal record request and is not a substitute for an employment or licensing background check.",
      ]}
    />
  );
}
