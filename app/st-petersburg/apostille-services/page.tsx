import type { Metadata } from "next";
import { LocalApostillePage } from "@/components/seo/LocalApostillePage";

export const metadata: Metadata = {
  title: "St. Petersburg Apostille Services | The Milano Seal™",
  description:
    "Apostille coordination and international document execution support for St. Petersburg, FL clients. Remote Online Notarization available statewide.",
  alternates: { canonical: "https://www.themilanoseal.com/st-petersburg/apostille-services" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <LocalApostillePage
      cityName="St. Petersburg"
      regionLabel="Pinellas County"
      slug="st-petersburg"
      canonicalPath="/st-petersburg/apostille-services"
      headline="St. Petersburg Apostille Services for International Documents"
      description="Apostille coordination, Remote Online Notarization, and international document execution support for St. Petersburg, FL clients."
      nearbyAreas={["Tampa", "Clearwater", "Pinellas Park", "Largo", "Gulfport"]}
      metaTitle="St. Petersburg Apostille Services | The Milano Seal™"
      metaDescription="Apostille coordination and international document execution support for St. Petersburg, FL clients. Remote Online Notarization available statewide."
    />
  );
}
