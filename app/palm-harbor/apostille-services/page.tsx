import type { Metadata } from "next";
import { LocalApostillePage } from "@/components/seo/LocalApostillePage";

export const metadata: Metadata = {
  title: "Palm Harbor Apostille Services | The Milano Seal™",
  description:
    "Apostille coordination and international document execution support for Palm Harbor, FL clients. Remote Online Notarization available.",
  alternates: { canonical: "https://www.themilanoseal.com/palm-harbor/apostille-services" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <LocalApostillePage
      cityName="Palm Harbor"
      regionLabel="Pinellas County"
      slug="palm-harbor"
      canonicalPath="/palm-harbor/apostille-services"
      headline="Palm Harbor Apostille Services for International Documents"
      description="Apostille coordination, Remote Online Notarization, and international document execution support for Palm Harbor, FL clients."
      nearbyAreas={["Dunedin", "Clearwater", "Tarpon Springs", "Oldsmar"]}
      metaTitle="Palm Harbor Apostille Services | The Milano Seal™"
      metaDescription="Apostille coordination and international document execution support for Palm Harbor, FL clients. Remote Online Notarization available."
    />
  );
}
