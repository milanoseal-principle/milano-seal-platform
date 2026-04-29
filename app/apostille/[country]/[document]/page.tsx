import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Header } from '@/components/landing/header'
import { Footer } from '@/components/landing/footer'
import { DESTINATIONS } from '@/data/destinations'
import { DOCUMENTS }    from '@/data/documents'
import { buildMetadata } from '@/lib/seo'
import { getRelatedCountries, getRelatedDocuments } from '@/lib/linking'

type Props = { params: Promise<{ country: string; document: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, document } = await params
  return buildMetadata(country, document)
}

export async function generateStaticParams() {
  const pairs: { country: string; document: string }[] = []
  DESTINATIONS.forEach(d => DOCUMENTS.forEach(doc => pairs.push({ country: d.slug, document: doc.id })))
  return pairs
}

export default async function CountryDocumentPage({ params }: Props) {
  const { country: countrySlug, document: documentId } = await params
  const country  = DESTINATIONS.find(d => d.slug === countrySlug)
  const document = DOCUMENTS.find(d => d.id === documentId)
  if (!country || !document) return notFound()

  const relatedCountries = getRelatedCountries(countrySlug, 5)
  const relatedDocuments = getRelatedDocuments(documentId)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${document.label} Apostille for ${country.name}`,
    provider: { '@type': 'ProfessionalService', name: 'The Milano Seal™', url: 'https://themilanoseal.com' },
    serviceType: 'Notarization and Apostille',
    areaServed: country.name,
    description: `Structured U.S. document execution and apostille coordination for ${document.label.toLowerCase()} documents intended for use in ${country.name}.`,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Header />
      <main className="bg-[#0A0A0A] min-h-screen">
        <section className="max-w-4xl mx-auto px-6 pt-32 pb-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">{country.flag}</span>
            <p className="text-[#C6A55A] text-[10px] tracking-[0.3em] uppercase font-semibold">{country.name} · {country.hague ? 'Hague Convention Member' : 'Non-Hague'}</p>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-white font-light leading-tight mb-6">
            {document.label}<br />Apostille for {country.name}
          </h1>
          <p className="text-[#8A8A8A] text-lg font-light leading-relaxed max-w-2xl mb-8">
            Structured execution and apostille coordination for {document.label.toLowerCase()} documents intended for use in {country.name}. All matters executed personally by Nicholas Milano, Florida Notary Public #668288.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href={`/intake?country=${countrySlug}&document=${documentId}`} className="px-8 py-3.5 bg-[#C6A55A] text-[#0A0A0A] text-xs font-semibold tracking-[0.15em] uppercase hover:bg-[#D4BB7A] transition-colors">
              Begin This Matter
            </Link>
            <Link href={`/apostille/${countrySlug}`} className="px-8 py-3.5 border border-[#2A2A2A] text-[#C6A55A] text-xs font-semibold tracking-[0.15em] uppercase hover:border-[#C6A55A] transition-colors">
              All {country.name} Services
            </Link>
          </div>
        </section>

        {/* Execution path */}
        <section className="max-w-4xl mx-auto px-6 py-12 border-t border-[#1A1A1A]">
          <h2 className="font-serif text-2xl text-white font-light mb-6">Execution Process</h2>
          <div className="space-y-3">
            {(country.executionPath || []).map((step, i) => (
              <div key={i} className="flex items-start gap-5 bg-[#111111] border border-[#1A1A1A] rounded-xl p-4">
                <span className="text-[#C6A55A] font-serif text-lg font-light flex-shrink-0">{String(i+1).padStart(2,'0')}</span>
                <p className="text-[#B0B0B0] text-sm font-light leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Internal links — same doc, other countries */}
        <section className="max-w-4xl mx-auto px-6 py-12 border-t border-[#1A1A1A]">
          <h2 className="font-serif text-xl text-white font-light mb-4">{document.label} — Other Destinations</h2>
          <div className="space-y-2">
            {relatedCountries.map(c => (
              <Link key={c.slug} href={`/apostille/${c.slug}/${documentId}`}
                className="flex items-center justify-between px-4 py-3 bg-[#111111] border border-[#1A1A1A] rounded-lg hover:border-[#C6A55A]/20 transition-colors group">
                <span className="flex items-center gap-3 text-sm text-[#B0B0B0] group-hover:text-white transition-colors">
                  <span>{c.flag}</span>{document.label} for {c.name}
                </span>
                <span className="text-[#C6A55A] text-xs">→</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Internal links — same country, other docs */}
        <section className="max-w-4xl mx-auto px-6 py-12 border-t border-[#1A1A1A]">
          <h2 className="font-serif text-xl text-white font-light mb-4">Other Documents for {country.name}</h2>
          <div className="space-y-2">
            {relatedDocuments.map(d => (
              <Link key={d.id} href={`/apostille/${countrySlug}/${d.id}`}
                className="flex items-center justify-between px-4 py-3 bg-[#111111] border border-[#1A1A1A] rounded-lg hover:border-[#C6A55A]/20 transition-colors group">
                <span className="flex items-center gap-3 text-sm text-[#B0B0B0] group-hover:text-white transition-colors">
                  <span>{d.icon}</span>{d.label} for {country.name}
                </span>
                <span className="text-[#C6A55A] text-xs">→</span>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6 py-16 border-t border-[#1A1A1A] text-center">
          <h2 className="font-serif text-3xl text-white font-light mb-4">Ready to Execute?</h2>
          <p className="text-[#8A8A8A] text-sm font-light mb-8 max-w-xl mx-auto">Submit your matter. Nicholas Milano reviews every {document.label.toLowerCase()} engagement personally before execution is scheduled.</p>
          <Link href={`/intake?country=${countrySlug}&document=${documentId}`} className="inline-block px-10 py-4 bg-[#C6A55A] text-[#0A0A0A] text-xs font-semibold tracking-[0.2em] uppercase hover:bg-[#D4BB7A] transition-colors">
            Submit Your Matter
          </Link>
        </section>
      </main>
      <Footer />
    </>
  )
}
