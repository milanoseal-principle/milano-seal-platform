"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────

type Channel = "Email" | "LinkedIn" | "Phone" | "Mail";

interface OutreachTemplate {
  id: string;
  name: string;
  category: string;
  useCase: string;
  channels: Channel[];
  subject?: string;
  body: string;
}

// ── Country context ───────────────────────────────────────────────────────────

const COUNTRIES = [
  "Italy",
  "Portugal",
  "Mexico",
  "Spain",
  "Germany",
  "France",
  "UAE",
  "UK",
  "Brazil",
  "Greece",
] as const;

type Country = (typeof COUNTRIES)[number];

const COUNTRY_CONTEXT: Record<
  Country,
  {
    authority: string;
    ministry: string;
    consulate: string;
    language: string;
    treaty: string;
  }
> = {
  Italy: {
    authority: "Prefettura di Roma",
    ministry: "Ministry of Foreign Affairs (MAECI)",
    consulate: "Italian Consulate General",
    language: "Italian",
    treaty: "Hague Convention member since 1978",
  },
  Portugal: {
    authority: "IRN (Instituto dos Registos e do Notariado)",
    ministry: "Ministry of Justice",
    consulate: "Portuguese Consulate General",
    language: "Portuguese",
    treaty: "Hague Convention member since 1968",
  },
  Mexico: {
    authority: "SRE (Secretaría de Relaciones Exteriores)",
    ministry: "Secretariat of Foreign Affairs",
    consulate: "Mexican Consulate General",
    language: "Spanish",
    treaty: "Hague Convention member since 1995",
  },
  Spain: {
    authority: "Ministerio de Asuntos Exteriores",
    ministry: "Ministry of Foreign Affairs",
    consulate: "Spanish Consulate General",
    language: "Spanish",
    treaty: "Hague Convention member since 1978",
  },
  Germany: {
    authority: "Oberlandesgericht (OLG)",
    ministry: "Federal Foreign Office (Auswärtiges Amt)",
    consulate: "German Consulate General",
    language: "German",
    treaty: "Hague Convention member since 1965",
  },
  France: {
    authority: "Cour d'Appel de Paris",
    ministry: "Ministry of Europe and Foreign Affairs",
    consulate: "French Consulate General",
    language: "French",
    treaty: "Hague Convention member since 1965",
  },
  UAE: {
    authority: "Ministry of Foreign Affairs & International Cooperation (MOFAIC)",
    ministry: "UAE Ministry of Justice",
    consulate: "UAE Embassy",
    language: "Arabic",
    treaty: "Hague Convention member since 2024",
  },
  UK: {
    authority: "Foreign, Commonwealth & Development Office (FCDO)",
    ministry: "FCDO Legalisation Office",
    consulate: "British Embassy",
    language: "English",
    treaty: "Hague Convention member since 1965",
  },
  Brazil: {
    authority: "Cartório de Notas / Junta Comercial",
    ministry: "Ministry of Foreign Affairs (Itamaraty)",
    consulate: "Brazilian Consulate General",
    language: "Portuguese",
    treaty: "Hague Convention member since 2016",
  },
  Greece: {
    authority: "Ministry of Foreign Affairs — Apostille Division",
    ministry: "Greek Ministry of Justice",
    consulate: "Greek Consulate General",
    language: "Greek",
    treaty: "Hague Convention member since 1985",
  },
};

// ── Templates ─────────────────────────────────────────────────────────────────

function buildTemplates(country: Country): OutreachTemplate[] {
  const ctx = COUNTRY_CONTEXT[country];

  return [
    {
      id: "attorney-intro",
      name: "Attorney Introduction",
      category: "Attorney Introduction",
      useCase: "Cold introduction to estate, immigration, or corporate attorneys handling international matters",
      channels: ["Email", "LinkedIn"],
      subject: "International Document Authentication — Milano Seal Introduction",
      body: `Dear [ATTORNEY NAME],

I wanted to introduce The Milano Seal™ — a Florida-based international document execution and apostille coordination firm. We work with attorneys handling international estate, citizenship, and immigration matters to ensure documents are properly authenticated for use in [${country.toUpperCase()}].

Our process includes [DOCUMENT TYPE] notarization, apostille coordination through the [${ctx.authority}], and certified delivery with full chain of custody documentation. We handle every jurisdiction covered under the Hague Convention and provide direct-submission protocols for non-Hague countries.

Attorneys who refer international matters to us receive a dedicated point of contact, transparent status updates, and guaranteed turnaround timelines — so you can advise your clients with confidence.

I'd welcome a brief 15-minute call to discuss how we might support your international practice. We're structured specifically for high-volume legal referrals.

Best regards,
Nicholas Milano
The Milano Seal™
+1 (305) 000-0000
nicholas@themillanoseal.com`,
    },
    {
      id: "attorney-followup",
      name: "Attorney Follow-Up",
      category: "Attorney Follow-Up",
      useCase: "Second touch after initial outreach with no response — keep it brief and value-forward",
      channels: ["Email", "Phone"],
      subject: "Following Up — International Document Execution Support",
      body: `Dear [ATTORNEY NAME],

I wanted to follow up on my note from [DATE]. I understand your time is limited, so I'll keep this brief.

The Milano Seal™ handles the full authentication pipeline for documents used in [${country.toUpperCase()}] — from notarization through the [${ctx.authority}] apostille and certified international delivery. We turn complex, time-sensitive document chains into a single managed process, so your practice doesn't have to coordinate multiple vendors.

If a client matter comes across your desk requiring international document authentication, I'd be glad to handle it — at no additional burden to your team. I can provide a reference list of attorneys we currently serve.

Would a quick call this week work for you?

Warm regards,
Nicholas Milano
The Milano Seal™`,
    },
    {
      id: "citizenship-firm",
      name: "Citizenship Firm Outreach",
      category: "Citizenship Firm Outreach",
      useCase: "Outreach to CBI program agents, golden visa advisors, and second passport firms",
      channels: ["Email", "LinkedIn"],
      subject: "Apostille & Authentication Partner for Your CBI Clients",
      body: `Dear [FIRM NAME / CONTACT NAME],

I'm reaching out because The Milano Seal™ specializes in exactly the document authentication work that your [${country.toUpperCase()}] citizenship and residency clients require.

Every citizenship by investment application under [${ctx.treaty}] requires authenticated birth records, marriage certificates, police clearances, and notarized affidavits. We have active protocols with [${ctx.authority}] and handle [${ctx.language}]-language document sets with certified translation partnerships.

Our CBI-specific service package includes:
— Full-family document authentication
— FBI Apostille and state-level background clearance
— Certified translation coordination
— Express lane for time-sensitive program deadlines

We'd appreciate the opportunity to become your preferred authentication partner for all [${country.toUpperCase()}] applications. I can provide a per-document rate sheet and dedicated account management.

Best,
Nicholas Milano
The Milano Seal™`,
    },
    {
      id: "family-office-intro",
      name: "Family Office Introduction",
      category: "Family Office Introduction",
      useCase: "Introduction to family office principals and directors managing international estate and trust matters",
      channels: ["Email", "Mail"],
      subject: "Confidential Document Execution Services — The Milano Seal™",
      body: `Dear [PRINCIPAL / DIRECTOR NAME],

The Milano Seal™ provides white-glove international document authentication services to family offices and private wealth principals navigating cross-border estate, trust, and asset matters.

We understand that family office matters require absolute discretion, speed, and institutional-grade chain of custody. When a trust document, power of attorney, or estate instrument must be authenticated for use in [${country.toUpperCase()}] — including apostille through the [${ctx.authority}] and coordination with the [${ctx.ministry}] — we manage the entire process from execution to delivery.

Our engagements include:
— Priority scheduling with dedicated case management
— Secure handling and encrypted digital delivery
— Full audit trail with custodial documentation
— Direct coordination with [${country.toUpperCase()}] institutional counterparts

We currently serve several multi-family offices and private banks. References available on request.

I would welcome the opportunity for a brief introductory call.

Respectfully,
Nicholas Milano
The Milano Seal™`,
    },
    {
      id: "luxury-broker-intro",
      name: "Luxury Broker Introduction",
      category: "Luxury Broker Introduction (Yacht/Aircraft/Equine)",
      useCase: "Outreach to yacht, aircraft, equine, and luxury asset brokers handling international transfers",
      channels: ["Email", "LinkedIn", "Phone"],
      subject: "International Document Authentication for Asset Transfers",
      body: `Dear [BROKER NAME],

International asset transactions — whether a vessel registry transfer, aircraft re-registration, or bloodstock sale to a [${country.toUpperCase()}] buyer — consistently require authenticated corporate and ownership documentation that most brokers find difficult to coordinate efficiently.

The Milano Seal™ handles this entirely. We manage notarization, apostille through the [${ctx.authority}], and direct delivery to the [${ctx.ministry}] or counterparty counsel in [${country.toUpperCase()}], with tracking at every step.

Our typical broker relationship works like this: when you have a cross-border deal in progress that requires apostilled documents, you send us the documents and closing timeline. We handle everything, and you close the deal without the documentation becoming a bottleneck.

If you'd like to see a sample workflow or discuss a current transaction, I'm available this week.

Best,
Nicholas Milano
The Milano Seal™`,
    },
    {
      id: "corporate-service-provider",
      name: "Corporate Service Provider Outreach",
      category: "Corporate Service Provider Outreach",
      useCase: "Outreach to registered agent services, corporate formation firms, and compliance service providers",
      channels: ["Email", "Phone"],
      subject: "Apostille Partner for Your International Corporate Clients",
      body: `Dear [COMPANY NAME / CONTACT],

I'm Nicholas Milano, founder of The Milano Seal™. We provide apostille and international document authentication services, and I'm reaching out because many of your clients who form or maintain entities with you will eventually need those corporate documents authenticated for use in [${country.toUpperCase()}].

Certificates of Good Standing, Articles of Incorporation, corporate resolutions, and authorized signatory documents all require apostille coordination before they're accepted by the [${ctx.authority}] or [${ctx.ministry}].

We've built a streamlined white-label referral model for corporate service providers: you refer clients who need international authentication; we execute the work with your branding if desired; you maintain the client relationship. We handle all state-level apostille submission, authentication, and delivery.

Volume pricing is available for firms with recurring authentication needs. Happy to share a rate sheet and sample SLA.

Best regards,
Nicholas Milano
The Milano Seal™`,
    },
    {
      id: "translation-partner",
      name: "Translation Partner Recruitment",
      category: "Translation Partner Recruitment",
      useCase: "Recruiting certified [LANGUAGE] translators as execution partners for international matters",
      channels: ["Email", "LinkedIn"],
      subject: `Certified [${ctx.language}] Translation Partner Opportunity`,
      body: `Dear [TRANSLATOR / TRANSLATION FIRM NAME],

The Milano Seal™ is building a network of certified translation partners to support our international apostille and document authentication clients. We are actively seeking a certified [${ctx.language}] translator for documents destined for use in [${country.toUpperCase()}].

Our clients regularly require:
— Certified translation of birth, marriage, and death certificates
— Legal document translation for estate and trust instruments
— Translation of notarized affidavits and court records
— Apostilled document sets with accompanying certified translations

We are looking for a partner who holds [ATA / NAATI / relevant] certification, has experience with legal and vital records translation, and can meet 48–72 hour turnaround requirements for time-sensitive matters.

We provide a steady referral volume and consistent payment terms. If you are interested in becoming a preferred translation partner for [${country.toUpperCase()}]-bound document sets, I'd welcome a brief conversation.

Best regards,
Nicholas Milano
The Milano Seal™`,
    },
    {
      id: "courier-partner",
      name: "Courier Partner Recruitment",
      category: "Courier Partner Recruitment",
      useCase: "Recruiting international courier and secure document delivery partners for high-value document shipment",
      channels: ["Email", "Phone"],
      subject: "International Document Courier Partnership — The Milano Seal™",
      body: `Dear [COURIER COMPANY / CONTACT NAME],

The Milano Seal™ is an international document execution firm that regularly ships authenticated original documents — including apostilled instruments, notarized affidavits, and certified document packages — to recipients in [${country.toUpperCase()}] and throughout Europe, Latin America, and the Middle East.

Our shipments require:
— Tracked, signature-required international delivery
— Full chain of custody documentation
— Reliable 3–7 business day international transit to [${country.toUpperCase()}]
— Ability to handle shipments to [${ctx.authority}] and private legal addresses

We are looking to establish a preferred courier relationship with competitive volume pricing. Our typical shipment volume is [X] packages per month, and we anticipate consistent growth.

If your service covers international delivery to [${country.toUpperCase()}] with the above specifications, I'd like to discuss a partnership arrangement.

Best regards,
Nicholas Milano
The Milano Seal™`,
    },
    {
      id: "authority-verification",
      name: "Authority Verification Request",
      category: "Authority Verification Request",
      useCase: "Reaching out to local [COUNTRY] contacts or in-country agents to verify authority protocols",
      channels: ["Email"],
      subject: `Authentication Protocol Verification — [${country.toUpperCase()}] Apostille Procedures`,
      body: `Dear [LOCAL CONTACT / AUTHORITY NAME],

I am writing on behalf of The Milano Seal™, a Florida-based document execution and apostille coordination firm. We regularly process documents for authentication by the [${ctx.authority}] for use in legal and commercial proceedings in [${country.toUpperCase()}].

I am reaching out to verify current processing protocols, accepted submission formats, and any recent procedural updates from the [${ctx.ministry}]. Specifically, I am seeking:

1. Current accepted formats for foreign-notarized documents presented for apostille
2. Processing timelines for standard and expedited requests
3. Any requirements specific to documents originating from US state or federal authorities
4. Contact information for the appropriate department handling international authentication requests

We work with attorneys, family offices, and corporate clients whose matters are time-sensitive, and maintaining accurate protocol intelligence is critical to our service quality.

Your assistance is greatly appreciated.

Respectfully,
Nicholas Milano
The Milano Seal™`,
    },
    {
      id: "partner-followup",
      name: "Partner Follow-Up",
      category: "Partner Follow-Up",
      useCase: "Follow-up to an established referral partner or warm contact who hasn't sent business recently",
      channels: ["Email", "Phone"],
      subject: "Checking In — International Matters for [${country.toUpperCase()}]",
      body: `Dear [PARTNER NAME],

I wanted to check in and see how business has been. It has been a few months since we last connected, and I wanted to make sure you know we remain ready to support any international document authentication matters your clients need.

We have continued to build out our [${country.toUpperCase()}] capability — including our direct relationship with [${ctx.authority}] and our certified [${ctx.language}] translation network. Turnaround times for [${country.toUpperCase()}]-bound documents are currently running [X] business days from notarized original to apostilled delivery.

If any estate, citizenship, corporate, or personal matters have come through your practice that required international document work, I'd be glad to hear about them — and happy to offer a case review if a matter is still in progress.

Looking forward to reconnecting.

Warm regards,
Nicholas Milano
The Milano Seal™`,
    },
  ];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const CHANNEL_STYLES: Record<Channel, string> = {
  Email:
    "bg-[rgba(74,158,107,0.12)] text-[#4a9e6b] border border-[rgba(74,158,107,0.2)]",
  LinkedIn:
    "bg-[rgba(10,102,194,0.12)] text-[#4a9fd4] border border-[rgba(10,102,194,0.2)]",
  Phone:
    "bg-[rgba(245,158,11,0.1)] text-[#f59e0b] border border-[rgba(245,158,11,0.18)]",
  Mail: "bg-[rgba(198,165,90,0.1)] text-[#C6A55A] border border-[rgba(198,165,90,0.18)]",
};

const EASE = [0.22, 1, 0.36, 1] as const;

// ── Main Component ────────────────────────────────────────────────────────────

export default function OutreachPage() {
  const [selectedCountry, setSelectedCountry] = useState<Country>("Italy");
  const [selectedId, setSelectedId] = useState<string>("attorney-intro");
  const [copied, setCopied] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const templates = buildTemplates(selectedCountry);
  const active = templates.find((t) => t.id === selectedId) ?? templates[0];

  const handleCopy = useCallback(() => {
    const text = active.subject
      ? `Subject: ${active.subject}\n\n${active.body}`
      : active.body;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [active]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-6">
      {/* Header */}
      <div className="mb-6">
        <p className="font-mono text-[9px] tracking-[0.32em] uppercase text-[rgba(198,165,90,0.5)] mb-2">
          Outreach Layer
        </p>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-white text-2xl font-bold tracking-tight mb-1">
              Outreach Engine
            </h1>
            <p className="text-[rgba(255,255,255,0.4)] text-sm">
              Professional B2B outreach templates for attorneys, partners, and authorities.
            </p>
          </div>

          {/* Country selector */}
          <div className="relative">
            <button
              onClick={() => setShowCountryPicker((v) => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[rgba(198,165,90,0.2)] bg-[rgba(8,5,1,0.97)] text-[#C6A55A] font-mono text-[11px] tracking-wide hover:border-[rgba(198,165,90,0.4)] transition-colors duration-200"
            >
              <span className="text-[rgba(198,165,90,0.5)]">Country:</span>
              {selectedCountry}
              <span className="text-[rgba(198,165,90,0.4)] ml-1">▾</span>
            </button>
            {showCountryPicker && (
              <div className="absolute top-full right-0 mt-1 z-50 bg-[rgba(8,5,1,0.99)] border border-[rgba(198,165,90,0.2)] rounded-lg py-1 min-w-[140px] shadow-xl">
                {COUNTRIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setSelectedCountry(c);
                      setShowCountryPicker(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] font-mono transition-colors duration-150 ${
                      c === selectedCountry
                        ? "text-[#C6A55A] bg-[rgba(198,165,90,0.08)]"
                        : "text-[rgba(255,255,255,0.45)] hover:text-white hover:bg-[rgba(255,255,255,0.04)]"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Country context bar */}
      <div className="mb-6 px-4 py-2.5 rounded-lg bg-[rgba(198,165,90,0.04)] border border-[rgba(198,165,90,0.1)] flex flex-wrap gap-x-6 gap-y-1">
        <span className="font-mono text-[9px] text-[rgba(198,165,90,0.5)] uppercase tracking-widest">
          {selectedCountry} Authority:
        </span>
        <span className="font-mono text-[10px] text-[rgba(198,165,90,0.7)]">
          {COUNTRY_CONTEXT[selectedCountry].authority}
        </span>
        <span className="font-mono text-[9px] text-[rgba(255,255,255,0.2)] uppercase tracking-widest">
          Treaty:
        </span>
        <span className="font-mono text-[10px] text-[rgba(255,255,255,0.35)]">
          {COUNTRY_CONTEXT[selectedCountry].treaty}
        </span>
        <span className="font-mono text-[9px] text-[rgba(255,255,255,0.2)] uppercase tracking-widest">
          Language:
        </span>
        <span className="font-mono text-[10px] text-[rgba(255,255,255,0.35)]">
          {COUNTRY_CONTEXT[selectedCountry].language}
        </span>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-5 items-start">
        {/* Left sidebar: template list */}
        <div className="w-56 shrink-0 flex flex-col gap-1">
          <p className="font-mono text-[8px] tracking-[0.32em] uppercase text-[rgba(198,165,90,0.4)] mb-2 px-1">
            Templates
          </p>
          {templates.map((t) => {
            const isActive = t.id === selectedId;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-[11px] leading-snug transition-all duration-200 border ${
                  isActive
                    ? "bg-[rgba(198,165,90,0.1)] text-[#C6A55A] border-[rgba(198,165,90,0.25)]"
                    : "bg-transparent text-[rgba(255,255,255,0.4)] border-transparent hover:bg-[rgba(255,255,255,0.04)] hover:text-[rgba(255,255,255,0.7)]"
                }`}
              >
                {t.name}
              </button>
            );
          })}
        </div>

        {/* Right: template detail */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedId}-${selectedCountry}`}
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.18, ease: EASE }}
              className="bg-[rgba(8,5,1,0.97)] border border-[rgba(212,175,55,0.08)] rounded-xl p-6"
            >
              {/* Template header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-[#C6A55A] text-[15px] font-semibold mb-1">
                    {active.name}
                  </h2>
                  <p className="text-[rgba(255,255,255,0.35)] text-[11px]">
                    {active.useCase}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {active.channels.map((ch) => (
                    <span
                      key={ch}
                      className={`px-2 py-0.5 rounded text-[9px] font-mono ${CHANNEL_STYLES[ch]}`}
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              </div>

              {/* Subject line */}
              {active.subject && (
                <div className="mb-4">
                  <p className="font-mono text-[8px] tracking-[0.32em] uppercase text-[rgba(198,165,90,0.4)] mb-1">
                    Subject
                  </p>
                  <p className="font-mono text-[12px] text-white bg-[rgba(255,255,255,0.03)] px-3 py-2 rounded-md border border-[rgba(255,255,255,0.06)]">
                    {active.subject}
                  </p>
                </div>
              )}

              {/* Body */}
              <div className="mb-5">
                <p className="font-mono text-[8px] tracking-[0.32em] uppercase text-[rgba(198,165,90,0.4)] mb-2">
                  Body
                </p>
                <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-lg p-4 whitespace-pre-wrap text-[12px] leading-relaxed font-mono">
                  {active.body.split(/(\[[A-Z\s&'\/\-]+\])/g).map((part, i) => {
                    const isPlaceholder = /^\[[A-Z\s&'\/\-]+\]$/.test(part);
                    return isPlaceholder ? (
                      <span
                        key={i}
                        className="text-[#C6A55A] font-semibold bg-[rgba(198,165,90,0.08)] px-0.5 rounded"
                      >
                        {part}
                      </span>
                    ) : (
                      <span key={i} className="text-[rgba(255,255,255,0.7)]">
                        {part}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Copy button */}
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-[11px] tracking-wide transition-all duration-200 border ${
                  copied
                    ? "bg-[rgba(74,158,107,0.15)] text-[#4a9e6b] border-[rgba(74,158,107,0.3)]"
                    : "bg-[rgba(198,165,90,0.1)] text-[#C6A55A] border-[rgba(198,165,90,0.25)] hover:bg-[rgba(198,165,90,0.18)] hover:border-[rgba(198,165,90,0.4)]"
                }`}
              >
                {copied ? (
                  <>
                    <span>✓</span>
                    <span>Copied to clipboard</span>
                  </>
                ) : (
                  <>
                    <span>⎘</span>
                    <span>Copy {active.subject ? "Subject + Body" : "Template"}</span>
                  </>
                )}
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
