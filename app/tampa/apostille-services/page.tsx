import type { Metadata } from "next";
import { LocalApostillePage } from "@/components/seo/LocalApostillePage";

export const metadata: Metadata = {
  title: "Tampa Apostille Services | The Milano Seal™",
  description:
    "Apostille coordination and international document execution support for Tampa area clients. Remote Online Notarization available. Florida Department of State apostille routing.",
  alternates: { canonical: "https://www.themilanoseal.com/tampa/apostille-services" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <LocalApostillePage
      cityName="Tampa"
      regionLabel="Tampa Bay"
      slug="tampa"
      canonicalPath="/tampa/apostille-services"
      headline="Tampa Apostille Services for International Documents"
      description="Apostille coordination, Remote Online Notarization, and international document execution support for Tampa area clients. Documents executed in Florida are apostilled by the Florida Department of State."
      nearbyAreas={["St. Petersburg", "Clearwater", "Brandon", "Westchase", "Temple Terrace"]}
      metaTitle="Tampa Apostille Services | The Milano Seal™"
      metaDescription="Apostille coordination and international document execution support for Tampa area clients. Remote Online Notarization available. Florida Department of State apostille routing."
    />
  );
}
