import type { Metadata } from "next";
import { ServicePageLayout } from "@/components/module2/ServicePageLayout";

export const metadata: Metadata = {
  title: "Immigration Fingerprinting Documents | The Milano Seal™",
  description:
    "Document coordination support for immigration, residency, and citizenship fingerprint-based document matters.",
  alternates: {
    canonical:
      "https://www.themilanoseal.com/services/immigration-fingerprinting-documents",
  },
};

export default function ImmigrationFingerprintingDocumentsPage() {
  return (
    <ServicePageLayout
      h1="Immigration Fingerprinting Documents"
      intro="We coordinate the document side of fingerprint-based records used in immigration, residency, and citizenship matters — including routing toward authentication when a receiving authority requires it."
      sections={[
        {
          title: "What we review",
          items: [
            "The record being requested and its intended use",
            "Whether federal authentication routing applies",
            "Destination requirements (operator-reviewed, not absolute)",
            "Translation and accuracy affidavit needs, if any",
          ],
        },
        {
          title: "How coordination works",
          items: [
            "Secure intake and document review first",
            "Operator review before any submission or partner referral",
            "Final packet assembly and return delivery",
          ],
        },
      ]}
      disclaimers={[
        "The Milano Seal does not provide immigration advice. We provide document coordination support only.",
      ]}
    />
  );
}
