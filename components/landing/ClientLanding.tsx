'use client'

import dynamic from 'next/dynamic'

const TrustStrip = dynamic(() => import('@/components/landing/trust-strip'), { ssr: false })
const Services = dynamic(() => import('@/components/landing/services'), { ssr: false })
const HowItWorks = dynamic(() => import('@/components/landing/how-it-works'), { ssr: false })
const ExecutionTiers = dynamic(() => import('@/components/landing/execution-tiers'), { ssr: false })
const ClientTypes = dynamic(() => import('@/components/landing/client-types'), { ssr: false })
const GlobalMap = dynamic(() => import('@/components/landing/global-map'), { ssr: false })
const HighTrustClose = dynamic(() => import('@/components/landing/high-trust-close'), { ssr: false })

export default function ClientLanding() {
  return (
    <>
      <TrustStrip />
      <Services />
      <HowItWorks />
      <ExecutionTiers />
      <ClientTypes />
      <GlobalMap />
      <HighTrustClose />
    </>
  )
}
