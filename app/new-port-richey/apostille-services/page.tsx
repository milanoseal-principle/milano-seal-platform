import type { Metadata } from "next";
import { LocalApostillePage } from "@/components/seo/LocalApostillePage";

export const metadata: Metadata = {
  title: "New Port Richey Apostille Services | The Milano Seal™",
  description:
    "Apostille coordination and international document execution support for New Port Richey, FL clients. Remote Online Notarization available.",
  alternates: { canonical: "https://www.themilanoseal.com/new-port-richey/apostille-services" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <LocalApostillePage
      cityName="New Port Richey"
      regionLabel="Pasco County"
      slug="new-port-richey"
      canonicalPath="/new-port-richey/apostille-services"
      headline="New Port Richey Apostille Services for International Documents"
      description="Apostille coordination, Remote Online Notarization, and international document execution support for New Port Richey, FL clients."
      nearbyAreas={["Trinity", "Port Richey", "Tarpon Springs", "Odessa"]}
      metaTitle="New Port Richey Apostille Services | The Milano Seal™"
      metaDescription="Apostille coordination and international document execution support for New Port Richey, FL clients. Remote Online Notarization available."
    />
  );
}
