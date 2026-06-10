import type { Metadata } from "next";
import { LocalApostillePage } from "@/components/seo/LocalApostillePage";

export const metadata: Metadata = {
  title: "Florida Apostille Services | The Milano Seal™",
  description:
    "Florida apostille coordination, Remote Online Notarization, and international document execution support for clients across the state of Florida.",
  alternates: { canonical: "https://www.themilanoseal.com/florida/apostille-services" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <LocalApostillePage
      cityName="Florida"
      regionLabel="Florida"
      slug="florida"
      canonicalPath="/florida/apostille-services"
      headline="Florida Apostille Services for Documents Used Abroad"
      description="Florida apostille coordination, Remote Online Notarization, and international document execution support for clients statewide. Documents executed in Florida are apostilled by the Florida Department of State."
      nearbyAreas={["Tampa", "St. Petersburg", "Clearwater", "Sarasota", "Orlando", "Miami"]}
      metaTitle="Florida Apostille Services | The Milano Seal™"
      metaDescription="Florida apostille coordination, Remote Online Notarization, and international document execution support for clients across the state of Florida."
    />
  );
}
