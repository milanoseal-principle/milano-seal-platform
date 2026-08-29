import Link from "next/link";
import type { CountryComplianceProfile } from "@/lib/compliance/countries";
import type { CountryDocumentSeoRecord } from "@/lib/seo/country-document/types";
import type { SeoEvidenceRecord } from "@/lib/seo/evidence/types";
import { DirectAnswer } from "./DirectAnswer";
import { SourceNote } from "./SourceNote";
import { AuthorityLinks } from "./AuthorityLinks";

const Panel = ({ title, items }: { title: string; items: string[] }) => <section><h2 className="font-serif text-2xl text-white">{title}</h2><ul className="mt-4 space-y-3">{items.map((item) => <li className="border-l border-[#C6A55A]/40 pl-4 leading-7 text-zinc-300" key={item}>{item}</li>)}</ul></section>;
export function CountryDocumentAuthorityPage({ record, country, evidence, links, conversionTarget }: { record: CountryDocumentSeoRecord; country: CountryComplianceProfile; evidence: SeoEvidenceRecord[]; links: string[]; conversionTarget: string }) {
  return <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-20">
    <nav className="mb-8 text-xs uppercase tracking-[0.2em] text-zinc-500"><Link href="/">Home</Link> <span className="mx-2 text-[#C6A55A]">/</span><Link href={`/apostille/${country.slug}`}>{country.name}</Link><span className="mx-2 text-[#C6A55A]">/</span>{record.documentName}</nav>
    <p className="text-xs uppercase tracking-[0.32em] text-[#C6A55A]">Secure International Document Execution &amp; Authentication Infrastructure</p>
    <h1 className="mt-5 max-w-4xl font-serif text-4xl leading-tight text-white md:text-6xl">{record.h1}</h1>
    <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300">{record.intro}</p>
    <div className="mt-10"><DirectAnswer question={`How are U.S. ${record.documentName.toLowerCase()} prepared for use in ${country.name}?`} answer={`The route depends on the document's U.S. origin, issuance or execution posture, and the instructions of the receiving authority in ${country.name}. The Milano Seal coordinates an origin-first review, applicable authentication routing, and controlled release; the receiving authority determines matter-specific acceptance.`} route={["Origin review", "Execution or certified-record review", "Applicable authority path", `Release for ${country.name}`]} /></div>
    <div className="mt-14 grid gap-12 md:grid-cols-2"><Panel title="Common use cases" items={record.commonUseCases}/><Panel title="Execution questions" items={record.executionQuestions}/><Panel title={`${country.name} receiving-authority questions`} items={record.receivingAuthorityQuestions}/><Panel title="Pre-flight rejection-risk review" items={record.rejectionRiskChecks}/></div>
    <section className="mt-14 border border-[#C6A55A]/20 bg-[#C6A55A]/[0.04] p-6 md:p-8"><h2 className="font-serif text-2xl text-white">Coordination boundaries</h2><div className="mt-5 grid gap-6 md:grid-cols-2"><div><p className="text-xs uppercase tracking-widest text-[#C6A55A]">What Milano coordinates</p><p className="mt-2 leading-7 text-zinc-300">Document-origin review, execution logistics, applicable apostille or authentication coordination, Chain-of-Custody Visibility, and International Courier Release.</p></div><div><p className="text-xs uppercase tracking-widest text-[#C6A55A]">What counsel or the recipient retains</p><p className="mt-2 leading-7 text-zinc-300">Instrument drafting, legal advice, substantive sufficiency, destination-law analysis, and final receiving-authority requirements.</p></div></div></section>
    <section className="mt-14"><h2 className="mb-5 font-serif text-2xl text-white">Continue through the authority graph</h2><AuthorityLinks links={links}/></section>
    <section className="mt-14 border border-[#C6A55A]/30 p-8 text-center"><p className="text-xs uppercase tracking-[0.26em] text-[#C6A55A]">Secure Records Intake</p><h2 className="mt-3 font-serif text-3xl text-white">Structure this route for operator review.</h2><p className="mx-auto mt-3 max-w-2xl text-zinc-400">Intake context supports preflight review. It does not create approval, determine legal sufficiency, or guarantee foreign acceptance.</p><Link className="mt-6 inline-flex bg-[#C6A55A] px-6 py-3 text-sm font-semibold text-black" href={conversionTarget}>Begin secure intake</Link></section>
    <div className="mt-12"><SourceNote evidence={evidence}/></div>
  </div>;
}
