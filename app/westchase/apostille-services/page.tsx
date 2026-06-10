import type { Metadata } from "next";
import { LocalApostillePage } from "@/components/seo/LocalApostillePage";

export const metadata: Metadata = {
  title: "Westchase Apostille Services | The Milano Seal™",
  description:
    "Apostille coordination and international document execution support for Westchase, FL clients. Remote Online Notarization available.",
  alternates: { canonical: "https://www.themilanoseal.com/westchase/apostille-services" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <LocalApostillePage
      cityName="Westchase"
      regionLabel="Hillsborough County"
      slug="westchase"
      canonicalPath="/westchase/apostille-services"
      headline="Westchase Apostille Services for International Documents"
      description="Apostille coordination, Remote Online Notarization, and international document execution support for Westchase, FL clients."
      nearbyAreas={["Tampa", "Odessa", "Citrus Park", "Carrollwood"]}
      metaTitle="Westchase Apostille Services | The Milano Seal™"
      metaDescription="Apostille coordination and international document execution support for Westchase, FL clients. Remote Online Notarization available."
    />
  );
}
