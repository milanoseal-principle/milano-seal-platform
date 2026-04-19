import { notFound } from 'next/navigation'
import { Header } from '@/components/landing/header'
import { Footer } from '@/components/landing/footer'
import { countries, documents, getCountryBySlug, getDocumentBySlug } from '@/lib/seo-data'
import { ArrowRight, CheckCircle, FileText, Globe, Shield } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ document: string; country: string }>
}

export async function generateStaticParams() {
  const params: { document: string; country: string }[] = []
  
  for (const doc of documents) {
    for (const country of countries) {
      params.push({
        document: doc.slug,
        country: country.slug,
      })
    }
  }
  
  return params
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { document: docSlug, country: countrySlug } = await params
  
  if (docSlug.includes('.') || countrySlug.includes('.')) {
    return { title: 'Not Found' }
  }
  
  const doc = getDocumentBySlug(docSlug)
  const country = getCountryBySlug(countrySlug)
  
  if (!doc || !country) {
    return { title: 'Not Found' }
  }
  
  return {
    title: `${doc.name} Apostille for ${country.name} | The Milano Seal™`,
    description: `${doc.name} apostille services for ${country.name}. Professional notarization and authentication for international acceptance. Executed properly the first time.`,
    keywords: [
      `${doc.name.toLowerCase()} apostille ${country.name}`,
      `${doc.name.toLowerCase()} for ${country.name}`,
      `apostille ${doc.name.toLowerCase()}`,
      `${country.name} ${doc.name.toLowerCase()}`,
      'document authentication',
      'apostille services',
    ],
  }
}

export default async function DocumentCountryPage({ params }: PageProps) {
  const { document: docSlug, country: countrySlug } = await params
  
  if (docSlug.includes('.') || countrySlug.includes('.')) {
    notFound()
  }
  
  const doc = getDocumentBySlug(docSlug)
  const country = getCountryBySlug(countrySlug)
  
  if (!doc || !country) {
    notFound()
  }
  
  const requirements = [
    'Original document or certified copy',
    'Valid photo identification',
    'Document must be issued in the United States',
    'Document must be in acceptable condition',
  ]
  
  const process = [
    {
      title: 'Submit Your Document',
      description: `Provide your ${doc.name.toLowerCase()} through our secure intake process.`,
    },
    {
      title: 'Compliance Review',
      description: `We verify your document meets ${country.name}'s specific requirements.`,
    },
    {
      title: 'Notarization',
      description: 'Document is notarized by a certified Florida Notary Public.',
    },
    {
      title: 'Apostille Certification',
      description: 'Authentication through the Florida Secretary of State.',
    },
    {
      title: 'Delivery',
      description: `Completed documents delivered ready for use in ${country.name}.`,
    },
  ]
  
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />
      
      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C6A55A]/10 border border-[#C6A55A]/30 rounded-full mb-6">
            <FileText className="w-4 h-4 text-[#C6A55A]" />
            <span className="text-sm text-[#C6A55A] font-medium">{doc.shortName}</span>
          </div>
          
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6 text-balance">
            {doc.name} Apostille for {country.name}
          </h1>
          
          <p className="text-lg text-[#B0B0B0] mb-8 max-w-2xl mx-auto leading-relaxed">
            {doc.description} Professional apostille coordination for acceptance in {country.name}.
          </p>
          
          <Link
            href="/intake"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Begin Apostille Process</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
      
      {/* About this document */}
      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-6">
            About {doc.name} Apostille for {country.name}
          </h2>
          <p className="text-[#B0B0B0] leading-relaxed mb-6">
            When presenting a {doc.name.toLowerCase()} in {country.name}, an apostille certification 
            is required to authenticate the document under the Hague Convention. This certification 
            confirms that the notary seal, signature, and stamps on your document are genuine, 
            allowing it to be legally recognized in {country.name}.
          </p>
          <p className="text-[#B0B0B0] leading-relaxed">
            The Milano Seal™ provides end-to-end coordination for your {doc.name.toLowerCase()}, 
            from notarization through apostille certification and delivery. We ensure your document 
            is executed properly and structured for international acceptance.
          </p>
        </div>
      </section>
      
      {/* Requirements */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-8">
            Requirements
          </h2>
          
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6">
            <ul className="space-y-4">
              {requirements.map((req) => (
                <li key={req} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#C6A55A] flex-shrink-0 mt-0.5" />
                  <span className="text-[#B0B0B0]">{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      
      {/* Process */}
      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-8 text-center">
            The Process
          </h2>
          
          <div className="space-y-4">
            {process.map((step, index) => (
              <div
                key={step.title}
                className="flex gap-6 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-6"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#C6A55A]/10 border border-[#C6A55A]/30 flex items-center justify-center">
                  <span className="text-[#C6A55A] font-medium">{index + 1}</span>
                </div>
                <div>
                  <h3 className="font-medium text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-[#B0B0B0]">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Why Choose Us */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6 text-center">
              <div className="inline-flex p-3 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] mb-4">
                <Shield className="w-6 h-6 text-[#C6A55A]" />
              </div>
              <h3 className="font-medium text-white mb-2">Compliance First</h3>
              <p className="text-sm text-[#B0B0B0]">
                Every document verified for {country.name} requirements.
              </p>
            </div>
            
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6 text-center">
              <div className="inline-flex p-3 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] mb-4">
                <Globe className="w-6 h-6 text-[#C6A55A]" />
              </div>
              <h3 className="font-medium text-white mb-2">Global Expertise</h3>
              <p className="text-sm text-[#B0B0B0]">
                Experienced with {country.name} document requirements.
              </p>
            </div>
            
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6 text-center">
              <div className="inline-flex p-3 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] mb-4">
                <CheckCircle className="w-6 h-6 text-[#C6A55A]" />
              </div>
              <h3 className="font-medium text-white mb-2">Executed Properly</h3>
              <p className="text-sm text-[#B0B0B0]">
                Precision and discretion at every step.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Related Links */}
      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-xl font-medium text-white mb-6">
            Related Services
          </h2>
          
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/apostille/${country.slug}`}
              className="px-4 py-2 text-sm text-[#B0B0B0] bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg hover:border-[#C6A55A]/30 hover:text-white transition-colors"
            >
              All {country.name} Apostille Services
            </Link>
            <Link
              href={`/services/${doc.slug}`}
              className="px-4 py-2 text-sm text-[#B0B0B0] bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg hover:border-[#C6A55A]/30 hover:text-white transition-colors"
            >
              {doc.name} Services
            </Link>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-4">
            Ready to Begin?
          </h2>
          <p className="text-[#B0B0B0] mb-8">
            Start your {doc.name.toLowerCase()} apostille process for {country.name} today.
          </p>
          <Link
            href="/intake"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <span>Begin Execution</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
      
      <Footer />
    </main>
  )
}
