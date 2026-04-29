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
