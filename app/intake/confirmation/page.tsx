import { Suspense } from 'react'
import { Header } from '@/components/landing/header'
import { Footer } from '@/components/landing/footer'
import { CheckCircle, Clock, MessageCircle, Shield } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Intake Received | The Milano Seal™',
  description: 'Your document execution intake has been received. We will contact you shortly.',
}

function ConfirmationContent({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  return (
    <Suspense fallback={<div className="h-[400px]" />}>
      <ConfirmationDetails searchParams={searchParams} />
    </Suspense>
  )
}

async function ConfirmationDetails({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const params = await searchParams
  const dealId = params.id
  
  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-8 md:p-12 text-center">
      {/* Success icon */}
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#C6A55A]/10 border border-[#C6A55A]/30 mb-8">
        <CheckCircle className="w-10 h-10 text-[#C6A55A]" />
      </div>
      
      <h1 className="font-serif text-3xl md:text-4xl font-medium text-white mb-4">
        Matter Received
      </h1>
      
      <p className="text-[#B0B0B0] text-lg mb-8 max-w-md mx-auto">
        Your matter has been received and structured for execution.
      </p>
      
      {dealId && (
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg mb-8">
          <span className="text-[#B0B0B0] text-sm">Reference:</span>
          <span className="text-[#C6A55A] font-mono text-sm">{dealId.slice(0, 8).toUpperCase()}</span>
        </div>
      )}
      
      {/* Next steps */}
      <div className="grid md:grid-cols-3 gap-6 mt-12 text-left">
        <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-6">
          <div className="inline-flex p-2 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] mb-4">
            <MessageCircle className="w-5 h-5 text-[#C6A55A]" />
          </div>
          <h3 className="text-white font-medium mb-2">WhatsApp Contact</h3>
          <p className="text-sm text-[#B0B0B0]">
            You will receive a WhatsApp message with payment instructions and next steps.
          </p>
        </div>
        
        <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-6">
          <div className="inline-flex p-2 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] mb-4">
            <Clock className="w-5 h-5 text-[#C6A55A]" />
          </div>
          <h3 className="text-white font-medium mb-2">Compliance Review</h3>
          <p className="text-sm text-[#B0B0B0]">
            Our team will review your matter and confirm all jurisdiction requirements.
          </p>
        </div>
        
        <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-6">
          <div className="inline-flex p-2 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] mb-4">
            <Shield className="w-5 h-5 text-[#C6A55A]" />
          </div>
          <h3 className="text-white font-medium mb-2">Secure Execution</h3>
          <p className="text-sm text-[#B0B0B0]">
            Once payment is confirmed, your document will move into execution immediately.
          </p>
        </div>
      </div>
      
      <div className="mt-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 text-[#B0B0B0] hover:text-white transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  )
}

export default function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />
      
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <ConfirmationContent searchParams={searchParams} />
        </div>
      </section>
      
      <Footer />
    </main>
  )
}
