'use client'

import dynamic from 'next/dynamic'

const Header = dynamic(() => import('@/components/landing/header'), { ssr: false })
const Hero = dynamic(() => import('@/components/landing/hero'), { ssr: false })
const TrustStrip = dynamic(() => import('@/components/landing/trust-strip'), { ssr: false })
const Services = dynamic(() => import('@/components/landing/services'), { ssr: false })
const HowItWorks = dynamic(() => import('@/components/landing/how-it-works'), { ssr: false })
const ExecutionTiers = dynamic(() => import('@/components/landing/execution-tiers'), { ssr: false })
const ClientTypes = dynamic(() => import('@/components/landing/client-types'), { ssr: false })
const GlobalMap = dynamic(() => import('@/components/landing/global-map'), { ssr: false })
const HighTrustClose = dynamic(() => import('@/components/landing/high-trust-close'), { ssr: false })
const Footer = dynamic(() => import('@/components/landing/footer'), { ssr: false })

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Header />
      <Hero />
      <TrustStrip />
      <div id="services">
        <Services />
      </div>
      <div id="process">
        <HowItWorks />
      </div>
      <div id="pricing">
        <ExecutionTiers />
      </div>
      <ClientTypes />
      <div id="countries">
        <GlobalMap />
      </div>
      <HighTrustClose />
      <Footer />
    </main>
  )
}
