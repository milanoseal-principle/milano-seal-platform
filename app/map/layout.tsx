import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Global Document Intelligence Map | The Milano Seal™",
  description: "Explore governed apostille, authentication, legalization, and receiving-authority routing intelligence for U.S. documents intended for use abroad.",
  alternates: { canonical: "https://www.themilanoseal.com/map" },
  openGraph: {
    title: "Global Document Intelligence Map | The Milano Seal™",
    description: "Governed document-route intelligence by destination, including apostille, authentication, legalization, origin, and receiving-authority review.",
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
