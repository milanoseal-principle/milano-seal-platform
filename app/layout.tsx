import type { Metadata } from "next";
import { Geist, Inter, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://themilanoseal.com"),
  title: {
    default: "The Milano Seal™ — International Document Execution & Apostille",
    template: "%s | The Milano Seal™",
  },
  description:
    "U.S. document execution and apostille coordination for international use. Attorneys, private clients, and institutions operating across jurisdictions.",
  keywords: [
    "apostille",
    "notarization",
    "international documents",
    "RON",
    "Hague Convention",
    "document execution",
  ],
  authors: [
    { name: "Nicholas Milano", url: "https://themilanoseal.com/founder" },
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
    url: "https://themilanoseal.com",
    siteName: "The Milano Seal™",
    title: "The Milano Seal™ — International Document Execution",
    description:
      "U.S. document execution and apostille liaison. Precision, discretion, and procedural control for international matters.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "The Milano Seal™",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Milano Seal™",
    description: "International document execution and apostille coordination.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfessionalService",
      "@id": "https://themilanoseal.com/#business",
      name: "The Milano Seal™",
      url: "https://themilanoseal.com",
      logo: "https://themilanoseal.com/milano-seal-gold-transparent-512.png",
      image: "https://themilanoseal.com/og-image.png",
      description:
        "U.S. document execution and apostille coordination for international use. Attorneys, private clients, and institutions operating across jurisdictions.",
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
      founder: { "@id": "https://themilanoseal.com/founder#person" },
      sameAs: ["https://themilanoseal.com"],
    },
    {
      "@type": "Person",
      "@id": "https://themilanoseal.com/founder#person",
      name: "Nicholas Milano",
      jobTitle: "Founder & U.S. International Document Execution Liaison",
      worksFor: { "@id": "https://themilanoseal.com/#business" },
      url: "https://themilanoseal.com/founder",
      image: "https://themilanoseal.com/nicholas-milano.jpeg",
      description:
        "Florida-licensed Notary Public #668288 and RON specialist. Founder of The Milano Seal™.",
    },
    {
      "@type": "WebSite",
      "@id": "https://themilanoseal.com/#website",
      url: "https://themilanoseal.com",
      name: "The Milano Seal™",
      publisher: { "@id": "https://themilanoseal.com/#business" },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://themilanoseal.com/map?q={search_term_string}",
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
      <body
        className={`${geist.variable} ${inter.variable} ${playfair.variable} font-sans antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
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
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
