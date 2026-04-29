'use client'

import dynamic from 'next/dynamic'

const TrustStrip = dynamic(() => import('@/components/landing/trust-strip'
const Services = dynamic(() => import('@/components/landing/services'
const HowItWorks = dynamic(() => import('@/components/landing/how-it-works'
const ExecutionTiers = dynamic(() => import('@/components/landing/execution-tiers'
const ClientTypes = dynamic(() => import('@/components/landing/client-types'
const GlobalMap = dynamic(() => import('@/components/landing/global-map'
const HighTrustClose = dynamic(() => import('@/components/landing/high-trust-close'
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
