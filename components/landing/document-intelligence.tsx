"use client";
import Link from "next/link";
import { useState } from "react";
import { Scale, ClipboardList, ScanSearch, FileText, Building2, PenLine, HeartHandshake, Landmark } from "lucide-react";

const DOCUMENTS: { id: string; label: string; Icon: React.ElementType; countries: string[]; bundle: string | null }[] = [
  { id: "power-of-attorney", label: "Power of Attorney", Icon: Scale, countries: ["Italy","Spain","Greece","Brazil","Mexico","Germany"], bundle: "POA + Apostille Bundle" },
  { id: "affidavit-name-discrepancy", label: "Name Discrepancy Affidavit", Icon: ClipboardList, countries: ["Italy","Spain","Greece","Portugal"], bundle: "Citizenship Support Bundle" },
  { id: "fbi-background-check", label: "FBI Background Check", Icon: ScanSearch, countries: ["Italy","Germany","Australia","UAE","Brazil"], bundle: "Immigration Bundle" },
  { id: "birth-certificate", label: "Birth Certificate", Icon: FileText, countries: ["Italy","Spain","Greece","Argentina","Colombia"], bundle: "Citizenship Support Bundle" },
  { id: "corporate-resolution", label: "Corporate Resolution", Icon: Building2, countries: ["UAE","Germany","UK","Brazil","Mexico"], bundle: "Corporate Authority Bundle" },
  { id: "affidavit-general", label: "General Affidavit", Icon: PenLine, countries: ["Italy","Spain","France","Brazil","Argentina"], bundle: null },
  { id: "marriage-certificate", label: "Marriage Certificate", Icon: HeartHandshake, countries: ["Italy","Spain","Greece","Portugal","Brazil"], bundle: "Citizenship Support Bundle" },
  { id: "estate-inheritance", label: "Estate / Inheritance", Icon: Landmark, countries: ["Italy","Spain","Greece","Germany","France","UK"], bundle: "Estate Bundle" },
];

export { DOCUMENTS };

export function DocumentIntelligence() {
  const [selected, setSelected] = useState<string | null>(null);
  const doc = DOCUMENTS.find((d) => d.id === selected);

  return (
    <section className="py-20 px-6 border-t border-[#1A1A1A] bg-[#0A0A0A]">
      <div className="max-w-6xl mx-auto">
        <p className="text-[#C6A55A] text-[9px] tracking-[0.3em] uppercase font-semibold mb-3">
          Document Intelligence
        </p>
        <h2 className="font-serif text-3xl text-white font-light mb-2">
          What Are You Executing?
        </h2>
        <p className="text-[#8A8A8A] text-sm mb-10 max-w-xl">
          Select your document type to see destination requirements, apostille
          eligibility, and bundle options.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {DOCUMENTS.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelected(selected === d.id ? null : d.id)}
              className={`text-left p-4 rounded-xl border transition-all ${
                selected === d.id
                  ? "border-[#C6A55A]/50 bg-[#141210]"
                  : "border-[#1E1E1E] bg-[#111111] hover:border-[#2A2A2A]"
              }`}
            >
              <div className="mb-3">
                <d.Icon className="w-5 h-5 text-[#C6A55A]/60" strokeWidth={1.5} />
              </div>
              <p className="text-white text-xs font-medium leading-snug">
                {d.label}
              </p>
            </button>
          ))}
        </div>

        {doc && (
          <div className="bg-[#111111] border border-[#C6A55A]/20 rounded-xl p-6 animate-fade-in">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-[#C6A55A] text-[9px] tracking-widest uppercase mb-1">
                  Document Intelligence
                </p>
                <h3 className="text-white font-serif text-xl">{doc.label}</h3>
              </div>
              {doc.bundle && (
                <span className="px-3 py-1 bg-[#C6A55A]/10 border border-[#C6A55A]/20 text-[#C6A55A] text-[10px] tracking-wide rounded-full flex-shrink-0">
                  {doc.bundle}
                </span>
              )}
            </div>
            <div className="mb-4">
              <p className="text-[#8A8A8A] text-xs mb-2">
                Commonly executed for:
              </p>
              <div className="flex flex-wrap gap-2">
                {(doc.countries || []).map((c) => (
                  <Link
                    key={c}
                    href={`/apostille/${c.toLowerCase().replace(/\s+/g, "-")}`}
                    className="px-3 py-1 bg-[#1A1A1A] border border-[#2A2A2A] text-[#B0B0B0] text-[10px] rounded-full hover:border-[#C6A55A]/30 hover:text-[#C6A55A] transition-colors"
                  >
                    {c}
                  </Link>
                ))}
              </div>
            </div>
            <Link
              href={`/apostille/${
                doc.countries?.[0]?.toLowerCase().replace(/\s+/g, "-") ||
                "italy"
              }/${doc.id}`}
              className="inline-block px-6 py-3 bg-[#C6A55A] text-[#0A0A0A] text-[10px] tracking-[0.2em] uppercase font-semibold hover:bg-[#D4BB7A] transition-colors rounded-sm"
            >
              Begin This Matter →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
