import type { Metadata } from "next";
import { LocalApostillePage } from "@/components/seo/LocalApostillePage";

export const metadata: Metadata = {
  title: "Land O' Lakes Apostille Services | The Milano Seal™",
  description:
    "Apostille coordination and international document execution support for Land O' Lakes, FL clients. Remote Online Notarization available.",
  alternates: { canonical: "https://www.themilanoseal.com/land-o-lakes/apostille-services" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <LocalApostillePage
      cityName="Land O' Lakes"
      regionLabel="Pasco County"
      slug="land-o-lakes"
      canonicalPath="/land-o-lakes/apostille-services"
      headline="Land O' Lakes Apostille Services for International Documents"
      description="Apostille coordination, Remote Online Notarization, and international document execution support for Land O' Lakes, FL clients."
      nearbyAreas={["Wesley Chapel", "Lutz", "Zephyrhills", "Odessa"]}
      metaTitle="Land O' Lakes Apostille Services | The Milano Seal™"
      metaDescription="Apostille coordination and international document execution support for Land O' Lakes, FL clients. Remote Online Notarization available."
    />
  );
}
