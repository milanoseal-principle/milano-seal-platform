import { Header } from '@/components/landing/header'
import { Hero } from '@/components/landing/hero'
import dynamic from 'next/dynamic'
import { Footer } from '@/components/landing/footer'

const TrustStrip = dynamic(() => import('@/components/landing/trust-strip'), { ssr: false })
const Services = dynamic(() => import('@/components/landing/services'), { ssr: false })
const HowItWorks = dynamic(() => import('@/components/landing/how-it-works'), { ssr: false })
const ExecutionTiers = dynamic(() => import('@/components/landing/execution-tiers'), { ssr: false })
const ClientTypes = dynamic(() => import('@/components/landing/client-types'), { ssr: false })
const GlobalMap = dynamic(() => import('@/components/landing/global-map'), { ssr: false })
const HighTrustClose = dynamic(() => import('@/components/landing/high-trust-close'), { ssr: false })

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
