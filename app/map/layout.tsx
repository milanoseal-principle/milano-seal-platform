import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Global Document Intelligence Map | The Milano Seal™",
  description: "Explore apostille and document authentication requirements by country. Hague Convention members, legalization routes, and Florida execution corridors.",
  alternates: { canonical: "https://www.themilanoseal.com/map" },
  openGraph: {
    title: "Global Document Intelligence Map | The Milano Seal™",
    description: "Apostille and authentication requirements by country — Hague members, legalization routes, Florida execution corridors.",
    url: "https://www.themilanoseal.com/map",
    siteName: "The Milano Seal™",
    images: [{ url: "https://www.themilanoseal.com/og-image.png", width: 1200, height: 630, alt: "Global Document Intelligence Map" }],
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
