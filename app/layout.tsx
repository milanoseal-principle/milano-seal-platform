import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata = {
  title: "The Milano Seal™ — International Document Execution",
  description: "A trusted U.S. liaison for notarization and apostille services worldwide.",
  openGraph: {
    title: "The Milano Seal™",
    description: "International document execution and apostille coordination.",
    url: "https://themilanoseal.com",
    siteName: "The Milano Seal",
    images: [
      {
        url: "https://themilanoseal.com/nick.jpg",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://themilanoseal.com/nick.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
