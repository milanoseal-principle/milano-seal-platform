import type { Metadata } from "next";
import { ServicePageLayout } from "@/components/module2/ServicePageLayout";

export const metadata: Metadata = {
  title: "Translation Coordination | The Milano Seal™",
  description:
    "Coordination of certified translation and translation accuracy affidavit support for documents intended for receiving authorities abroad.",
  alternates: {
    canonical: "https://www.themilanoseal.com/services/translation-coordination",
  },
};

export default function TranslationCoordinationPage() {
  return (
    <ServicePageLayout
      h1="Translation Coordination"
      intro="Many receiving authorities require documents in their own language. We coordinate certified translation and, where needed, translation accuracy affidavits alongside authentication."
      sections={[
        {
          title: "What we review",
          items: [
            "The document language and destination language",
            "Whether a certified translation is likely needed",
            "Whether a translation accuracy affidavit is required",
            "Receiving-authority specific requirements",
          ],
        },
        {
          title: "How coordination works",
          items: [
            "Secure intake and document review first",
            "Partner translation coordination after operator review",
            "Affidavit notarization and authentication routing if needed",
          ],
        },
      ]}
    />
  );
}
