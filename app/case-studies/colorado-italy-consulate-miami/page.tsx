import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Colorado → Italy Consulate Miami | The Milano Seal™",
  description: "Colorado vital records, Colorado apostille rail, Florida RON translation execution, Italian Consulate Miami packet assembly.",
};

const PHASES = [
  {
    title: "Colorado Document Extraction",
    steps: [
      "Order fresh long-form certified copies from Colorado CDPHE",
      "Confirm current Colorado State Registrar signature and seal on records",
      "Courier walks into 1700 Broadway, Denver — Colorado Secretary of State",
      "Submit original certified records for in-person apostille authentication",
      "Receive apostilled Colorado vital records",
      "Route apostilled packet to Florida hub via secured express carrier",
    ],
  },
  {
    title: "Florida Hub Intake",
    steps: [
      "Receive apostilled Colorado vital records at Florida hub",
      "Confirm record completeness and apostille validity",
      "Assign certified Italian translator",
    ],
  },
  {
    title: "Florida RON Translation Execution",
    steps: [
      "Translator prepares complete Italian translation of applicable records",
      "Translator prepares Translator's Affidavit (name, credentials, language pair, documents translated, accuracy statement)",
      "Schedule Florida RON session — translator may be anywhere",
      "Florida RON notary confirms physical presence in Florida",
      "Launch Florida-approved RON platform, credential analysis + KBA",
      "Administer oath — translator signs Translator's Affidavit electronically",
      "Apply Florida electronic notary seal and digital certificate",
      "Download and preserve full RON journal entry",
    ],
  },
  {
    title: "Florida Apostille",
    steps: [
      "Submit notarized translation affidavit to Florida Department of State",
      "Use e-Apostille or physical submission per current DOS process",
      "Florida DOS verifies active Florida notary commission",
      "Florida apostille issued on notarized Translator's Affidavit / translation packet",
    ],
  },
  {
    title: "Consular Packet Assembly",
    steps: [
      "Long-form birth certificate(s) — Colorado Registrar + Colorado Apostille",
      "Death certificate(s) if applicable — Colorado Registrar + Colorado Apostille",
      "Italian translation of records — Florida RON session + Florida Apostille",
      "Translator's Affidavit — Florida RON session + Florida Apostille",
    ],
  },
  {
    title: "Italian Consulate Miami Submission",
    steps: [
      "Verify current Italian Consulate Miami submission requirements",
      "Assemble physical packet in correct consular order",
      "Submit for jure sanguinis application review",
      "Retain copies of all records, apostilles, and RON journal",
      "Log all events in Chain of Custody",
    ],
  },
];

const COC_EVENTS = [
  "COLORADO_RECORD_ORDERED",
  "COLORADO_RECORD_RECEIVED",
  "COLORADO_APOSTILLE_SUBMITTED",
  "COLORADO_APOSTILLE_COMPLETED",
  "PACKET_RECEIVED_FLORIDA_HUB",
  "TRANSLATOR_ASSIGNED",
  "TRANSLATION_PREPARED",
  "RON_SESSION_SCHEDULED",
  "RON_SESSION_COMPLETED",
  "TRANSLATOR_AFFIDAVIT_NOTARIZED",
  "FLORIDA_APOSTILLE_SUBMITTED",
  "FLORIDA_APOSTILLE_COMPLETED",
  "CONSULAR_PACKET_ASSEMBLED",
  "CONSULAR_PACKET_SUBMITTED",
];

export default function ColoradoItalyPage() {
  return (
    <main className="min-h-screen bg-[#08080b] text-gray-100">
      {/* Header */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-[10px] text-[#D4AF37]/60 tracking-[0.4em] uppercase mb-4 font-mono">
          Execution Route Case Study · MS-RON-WORKFLOW-COLORADO-ITALY-V1
        </div>
        <h1 className="font-serif text-4xl md:text-5xl text-white mb-6 leading-tight">
          Colorado → Italy<br/>Consulate Miami
        </h1>
        <p className="text-gray-400 text-base leading-relaxed max-w-2xl mb-4">
          Colorado vital records, Colorado apostille rail, Florida RON translation execution, and Italian Consulate Miami packet assembly.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded text-[10px] font-mono text-[#D4AF37]/70 tracking-wider uppercase">
          Two-Rail Sovereign Protocol
        </div>
      </section>

      {/* Execution Map */}
      <section className="max-w-4xl mx-auto px-6 pb-12">
        <div className="text-[9px] text-[#D4AF37]/50 tracking-[0.3em] uppercase mb-6 font-mono">/ Execution Map</div>
        <div className="space-y-2 font-mono text-sm">
          {[
            "Colorado Vital Records (CDPHE)",
            "Colorado Secretary of State (1700 Broadway, Denver)",
            "Florida Hub Receipt",
            "Florida RON Session — Translator Affidavit",
            "Florida Department of State (e-Apostille / Paper)",
            "Italian Consulate Miami — Packet Assembly",
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3 text-gray-400">
              <span className="text-[#D4AF37]/40 w-5 text-right text-[9px]">{String(i + 1).padStart(2, "0")}</span>
              <span className="w-4 h-px bg-[#D4AF37]/20 flex-shrink-0" />
              <span>{step}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Six phases */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="text-[9px] text-[#D4AF37]/50 tracking-[0.3em] uppercase mb-8 font-mono">/ Execution Phases</div>
        <div className="space-y-6">
          {PHASES.map((phase, i) => (
            <div key={i} className="border border-[#D4AF37]/10 rounded p-5 bg-black/30">
              <div className="text-[9px] font-mono text-[#D4AF37]/50 tracking-wider uppercase mb-1">Phase {i + 1}</div>
              <h3 className="font-serif text-lg text-white mb-2">{phase.title}</h3>
              <ul className="space-y-1.5">
                {phase.steps.map((s, j) => (
                  <li key={j} className="flex items-start gap-2 text-[11px] text-gray-400">
                    <span className="text-[#D4AF37]/40 font-mono mt-0.5">{String(j + 1).padStart(2, "0")}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Chain of Custody events */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="text-[9px] text-[#D4AF37]/50 tracking-[0.3em] uppercase mb-6 font-mono">/ Chain of Custody Events</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {COC_EVENTS.map(e => (
            <div key={e} className="px-3 py-2 bg-black/40 border border-[#D4AF37]/10 rounded text-[9px] font-mono text-[#D4AF37]/60 tracking-wider">
              {e}
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <p className="text-[11px] text-gray-600 leading-relaxed border-t border-[#D4AF37]/10 pt-6">
          The Milano Seal™ is not a law firm and does not provide legal advice. This case study documents notarial services, document execution support, apostille coordination, courier coordination, and administrative liaison support where permitted. Final consular requirements, eligibility determinations, document acceptance, and legal strategy must be verified with the appropriate authority or licensed counsel. Requirements change — verify all authority requirements before use.
        </p>
      </section>
    </main>
  );
}
