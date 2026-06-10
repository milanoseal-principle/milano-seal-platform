import type { Metadata } from "next";
import { LocalApostillePage } from "@/components/seo/LocalApostillePage";

export const metadata: Metadata = {
  title: "Brandon Apostille Services | The Milano Seal™",
  description:
    "Apostille coordination and international document execution support for Brandon, FL clients. Remote Online Notarization available.",
  alternates: { canonical: "https://www.themilanoseal.com/brandon/apostille-services" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <LocalApostillePage
      cityName="Brandon"
      regionLabel="Hillsborough County"
      slug="brandon"
      canonicalPath="/brandon/apostille-services"
      headline="Brandon Apostille Services for International Documents"
      description="Apostille coordination, Remote Online Notarization, and international document execution support for Brandon, FL clients."
      nearbyAreas={["Tampa", "Riverview", "Valrico", "Lithia"]}
      metaTitle="Brandon Apostille Services | The Milano Seal™"
      metaDescription="Apostille coordination and international document execution support for Brandon, FL clients. Remote Online Notarization available."
    />
  );
}
