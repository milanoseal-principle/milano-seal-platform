import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/landing/header'
import { Footer } from '@/components/landing/footer'

export const metadata: Metadata = {
  title: 'Affidavit of Name Discrepancy — Italy, International Use | The Milano Seal™',
  description: 'Professional affidavit of name discrepancy for Italian citizenship, Spanish documents, and international legal proceedings. Apostille-ready. Florida notary, globally accepted.',
  alternates: { canonical: 'https://themilanoseal.com/affidavit-name-discrepancy' },
}

const schema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Affidavit of Name Discrepancy',
  provider: { '@type': 'ProfessionalService', name: 'The Milano Seal™', url: 'https://themilanoseal.com' },
  serviceType: 'Notarization and Apostille',
  description: 'Sworn affidavit reconciling name discrepancies across passports, birth certificates, and foreign civil records, with apostille authentication.',
}

const faqs = [
  { q: 'What is an affidavit of name discrepancy?', a: 'A sworn statement before a notary public confirming that two or more differently-spelled names across official documents refer to the same person. It is commonly required for Italian citizenship applications, foreign property transactions, and immigration proceedings.' },
  { q: 'When is a name discrepancy affidavit required for Italy?', a: 'Italian municipalities and courts require this affidavit when the applicant\'s name appears differently across U.S. and Italian records — for example, "Maria" vs "Mary," missing middle names, or hyphenated surnames that differ between documents.' },
  { q: 'Does the affidavit need an apostille for Italy?', a: 'Yes. Italy is a Hague Convention member. Any U.S.-executed affidavit intended for use in Italian proceedings must bear a Florida apostille issued by the Florida Department of State.' },
  { q: 'How long does the process take?', a: 'Standard execution with apostille: 5–10 business days. Expedited: 2–4 business days. Urgent same-day execution available subject to scheduling.' },
]

export default function AffidavitNameDiscrepancyPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [schema, {
          '@type': 'FAQPage',
          mainEntity: faqs.map(f => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a }
          }))
        }]
      }) }} />
      <Header />
      <main className="bg-[#0A0A0A] min-h-screen">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-32 pb-16">
          <p className="text-[#C6A55A] text-[10px] tracking-[0.3em] uppercase font-semibold mb-4">Name Reconciliation Documents</p>
          <h1 className="font-serif text-4xl md:text-5xl text-white leading-tight mb-6">
            Affidavit of Name<br />Discrepancy
          </h1>
          <p className="text-[#8A8A8A] text-lg leading-relaxed font-light max-w-2xl">
            When your name appears differently across passports, birth certificates, and foreign civil records, foreign governments and courts require a sworn affidavit reconciling the difference. The Milano Seal™ executes these documents with apostille authentication for use in Italy, Spain, Greece, and internationally.
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <Link href="/intake" className="px-8 py-3.5 bg-[#C6A55A] text-[#0A0A0A] text-xs font-semibold tracking-[0.15em] uppercase rounded-sm hover:bg-[#D4BB7A] transition-colors">
              Begin Your Matter
            </Link>
          </div>
        </section>

        {/* Why it matters */}
        <section className="max-w-4xl mx-auto px-6 py-12 border-t border-[#1A1A1A]">
          <h2 className="font-serif text-2xl text-white mb-5">Why Name Discrepancies Require a Sworn Affidavit</h2>
          <div className="text-[#8A8A8A] text-base leading-relaxed space-y-4 font-light">
            <p>Foreign civil registries and courts do not automatically reconcile spelling differences between documents from different countries. A person born as "Giovanni" in Italian records who holds a U.S. passport as "John" must affirmatively establish the connection through sworn testimony before a notary public.</p>
            <p>Common discrepancy scenarios include: anglicized first names, missing or added middle names, hyphenated vs. non-hyphenated surnames, maiden name vs. married name differences across document generations, and typographic variations introduced during naturalization or record migration.</p>
            <p>For Italian citizenship by descent (jure sanguinis), the municipal consulate (Giudice Tutelare) or the Italian court handling the recognition will flag any name inconsistency and may refuse to proceed without a properly authenticated affidavit.</p>
          </div>
        </section>

        {/* Process */}
        <section className="max-w-4xl mx-auto px-6 py-12 border-t border-[#1A1A1A]">
          <h2 className="font-serif text-2xl text-white mb-6">The Milano Seal™ Process</h2>
          <div className="space-y-4">
            {[
              { step: '01', title: 'Matter Intake', desc: 'Submit your documents and details. Identify all name variations across every record involved.' },
              { step: '02', title: 'Draft Review', desc: 'Nicholas Milano reviews each document pair and drafts the affidavit language with precise name reconciliation.' },
              { step: '03', title: 'Execution', desc: 'The affiant executes the affidavit before Nicholas Milano as Florida Notary Public #668288.' },
              { step: '04', title: 'Apostille Authentication', desc: 'The executed affidavit is submitted to the Florida Department of State for apostille issuance.' },
              { step: '05', title: 'Delivery', desc: 'The completed apostilled affidavit is delivered via courier or digitally as required.' },
            ].map(s => (
              <div key={s.step} className="flex gap-6 bg-[#111111] border border-[#1A1A1A] rounded-xl p-5">
                <span className="text-[#C6A55A] font-serif text-2xl font-light flex-shrink-0">{s.step}</span>
                <div>
                  <p className="text-white font-medium text-sm mb-1">{s.title}</p>
                  <p className="text-[#8A8A8A] text-sm font-light">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section className="max-w-4xl mx-auto px-6 py-12 border-t border-[#1A1A1A]">
          <h2 className="font-serif text-2xl text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map(f => (
              <div key={f.q} className="bg-[#111111] border border-[#1A1A1A] rounded-xl p-5">
                <p className="text-white font-medium text-sm mb-2">{f.q}</p>
                <p className="text-[#8A8A8A] text-sm font-light leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Internal links */}
        <section className="max-w-4xl mx-auto px-6 py-12 border-t border-[#1A1A1A]">
          <h2 className="font-serif text-xl text-white mb-4">Related Services</h2>
          <div className="space-y-3">
            {[
              { href: '/international-affidavit', label: 'International Affidavit Execution & Apostille' },
              { href: '/power-of-attorney-international', label: 'International Power of Attorney with Apostille' },
              { href: '/apostille/italy', label: 'Apostille for Italy — Complete Guide' },
              { href: '/map', label: 'International Compliance Map' },
            ].map(link => (
              <Link key={link.href} href={link.href} className="flex items-center justify-between px-5 py-3.5 bg-[#111111] border border-[#1A1A1A] rounded-lg hover:border-[#C6A55A]/30 transition-colors group">
                <span className="text-[#B0B0B0] text-sm group-hover:text-white transition-colors">{link.label}</span>
                <span className="text-[#C6A55A] text-xs">→</span>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6 py-16 border-t border-[#1A1A1A] text-center">
          <p className="text-[#C6A55A] text-[10px] tracking-[0.3em] uppercase font-semibold mb-3">Begin Your Matter</p>
          <h2 className="font-serif text-3xl text-white mb-4">Ready to Resolve Your Name Discrepancy?</h2>
          <p className="text-[#8A8A8A] text-base font-light mb-8 max-w-xl mx-auto">Submit your documents and matter details. Every engagement reviewed personally by Nicholas Milano.</p>
          <Link href="/intake" className="inline-block px-10 py-4 bg-[#C6A55A] text-[#0A0A0A] text-xs font-semibold tracking-[0.2em] uppercase rounded-sm hover:bg-[#D4BB7A] transition-colors">
            Submit Your Matter
          </Link>
        </section>
      </main>
      <Footer />
    </>
  )
}
