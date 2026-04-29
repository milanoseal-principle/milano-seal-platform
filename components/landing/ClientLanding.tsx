'use client'

import TrustStrip from '@/components/landing/trust-strip'
import Services from '@/components/landing/services'
import HowItWorks from '@/components/landing/how-it-works'
import ExecutionTiers from '@/components/landing/execution-tiers'
import ClientTypes from '@/components/landing/client-types'
import GlobalMap from '@/components/landing/global-map'
import HighTrustClose from '@/components/landing/high-trust-close'

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
