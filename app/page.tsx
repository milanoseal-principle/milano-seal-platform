'use client'

import dynamic from 'next/dynamic'

const Header = dynamic(() => import('@/components/landing/header'
const Hero = dynamic(() => import('@/components/landing/hero'
const TrustStrip = dynamic(() => import('@/components/landing/trust-strip'
const Services = dynamic(() => import('@/components/landing/services'
const HowItWorks = dynamic(() => import('@/components/landing/how-it-works'
const ExecutionTiers = dynamic(() => import('@/components/landing/execution-tiers'
const ClientTypes = dynamic(() => import('@/components/landing/client-types'
const GlobalMap = dynamic(() => import('@/components/landing/global-map'
const HighTrustClose = dynamic(() => import('@/components/landing/ClientLanding'
const Footer = dynamic(() => import('@/components/landing/footer'
import { Header } from '@/components/landing/header'
import { Hero } from '@/components/landing/hero'
import ClientLanding from '@/components/landing/ClientLanding'
import { Footer } from '@/components/landing/footer'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Header />
      <Hero />
      <ClientLanding />
      <Footer />
    </main>
  )
}
