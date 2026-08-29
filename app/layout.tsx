import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { MilanoExecutionCopilot } from "@/components/assistant/MilanoExecutionCopilot";
import { NavigationLoader } from "@/components/NavigationLoader";
import { CinematicPageShell } from "@/components/motion/CinematicPageShell";
import { SeoAttributionCapture } from "@/components/attribution/SeoAttributionCapture";
import "./globals.css";
import "./globe-core-fixes.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0A0A",
};

const fontVariables = "font-sans";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.themilanoseal.com"),
  title: {
    default: "The Milano Seal™ | U.S. Document Execution for International Use",
    template: "%s",
  },
  description:
    "Remote Online Notarization, Apostille Coordination, and International Document Execution Support with structured routing review, payment-gated execution, and secure release coordination.",
  keywords: [
    "apostille",
    "notarization",
    "international documents",
    "remote online notary",
    "Hague Convention",
    "document execution",
    "apostille coordination",
    "international document coordination",
  ],
  authors: [
    { name: "Nicholas Milano", url: "https://www.themilanoseal.com/founder" },
  ],
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [{ rel: "manifest", url: "/site.webmanifest" }],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.themilanoseal.com",
    siteName: "The Milano Seal™",
    title: "The Milano Seal™ | U.S. Document Execution for International Use",
    description:
      "Remote Online Notarization, Apostille Coordination, and International Document Execution Support.",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Milano Seal™",
    description: "International document execution and apostille coordination.",
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfessionalService",
      "@id": "https://www.themilanoseal.com/#business",
      name: "The Milano Seal™",
      url: "https://www.themilanoseal.com",
      logo: "https://www.themilanoseal.com/milano-seal-orb-v2.png",
      image: "https://www.themilanoseal.com/milano-seal-orb-v2.png",
      description:
        "U.S. Document Execution for International Use — Remote Online Notarization, Apostille Coordination, and International Document Execution Support.",
      address: {
        "@type": "PostalAddress",
        addressRegion: "FL",
        addressCountry: "US",
      },
      areaServed: "Worldwide",
      serviceType: [
        "Remote Online Notarization",
        "Apostille Coordination",
        "International Document Execution",
        "Mobile Notary",
      ],
      founder: { "@id": "https://www.themilanoseal.com/founder#person" },
      sameAs: ["https://www.themilanoseal.com"],
    },
    {
      "@type": "Person",
      "@id": "https://www.themilanoseal.com/founder#person",
      name: "Nicholas Milano",
      jobTitle: "Founder, Florida Notary Public, Remote Online Notary",
      worksFor: { "@id": "https://www.themilanoseal.com/#business" },
      url: "https://www.themilanoseal.com/founder",
      image: "https://www.themilanoseal.com/nicholas-milano.jpeg",
      description:
        "Nicholas Milano is a Florida Notary Public and Remote Online Notary supporting apostille coordination and international document coordination. Founder of The Milano Seal™.",
    },
    {
      "@type": "WebSite",
      "@id": "https://www.themilanoseal.com/#website",
      url: "https://www.themilanoseal.com",
      name: "The Milano Seal™",
      publisher: { "@id": "https://www.themilanoseal.com/#business" },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://www.themilanoseal.com/map?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${fontVariables} antialiased`}>
        <SeoAttributionCapture />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <CinematicPageShell>{children}</CinematicPageShell>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast:
                "!bg-[#1C1C1C] !text-white !border !border-[#C6A55A]/40 !rounded-xl !shadow-[0_8px_32px_rgba(0,0,0,0.7)]",
              success: "!bg-[#1C1C1C] !border-[#C6A55A]/40",
              error: "!bg-[#1C1C1C] !border-red-500/40",
              description: "!text-[#8A8A8A]",
            },
          }}
        />
        <NavigationLoader />
        <Suspense fallback={null}>
          <MilanoExecutionCopilot />
        </Suspense>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
