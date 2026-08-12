"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle, Route, ScanSearch } from "lucide-react";
import {
  buildApostilleRoute,
  scanDocumentReadiness,
  type ReadinessScanInput,
  type RouteArchitectResult,
} from "@/lib/alliance/professionalToolbelt";

const checkLabels: Record<keyof ReadinessScanInput, string> = {
  documentPresent: "Document present",
  signatureBlocks: "Signature blocks present",
  signerCountConfirmed: "Signer count confirmed",
  dateFieldsComplete: "Date fields complete",
  venuePresent: "Venue present",
  notarialWordingReviewed: "Acknowledgment / jurat wording reviewed",
  missingPages: "Missing pages detected",
  duplicatePages: "Duplicate pages detected",
  lowResolutionOrCutOff: "Low-resolution or cut-off scan",
  foreignLanguage: "Foreign-language document",
  receivingCountryConfirmed: "Receiving country confirmed",
  authenticationPathConfirmed: "Authentication pathway confirmed",
};

const initialScan: ReadinessScanInput = {
  documentPresent: false,
  signatureBlocks: false,
  signerCountConfirmed: false,
  dateFieldsComplete: false,
  venuePresent: false,
  notarialWordingReviewed: false,
  missingPages: false,
  duplicatePages: false,
  lowResolutionOrCutOff: false,
  foreignLanguage: false,
  receivingCountryConfirmed: false,
  authenticationPathConfirmed: false,
};

export function AllianceProfessionalTools() {
  const [origin, setOrigin] = useState("Florida");
  const [destination, setDestination] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [issuance, setIssuance] = useState<"state" | "federal" | "unknown">("unknown");
  const [route, setRoute] = useState<RouteArchitectResult | null>(null);
  const [checks, setChecks] = useState(initialScan);
  const [scan, setScan] = useState<ReturnType<typeof scanDocumentReadiness> | null>(null);
  const inputClass = "w-full rounded border border-[#c6a55a]/25 bg-black px-3 py-2 text-sm text-[#f6f1e6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c6a55a]";

  function architect() {
    if (!destination.trim() || !documentType.trim()) return;
    setRoute(buildApostilleRoute({
      originatingState: origin,
      destinationCountry: destination,
      destinationSlug: destination.toLowerCase().trim().replace(/\s+/g, "-"),
      documentType,
      signingRequirement: "unknown",
      issuance,
      urgency: "standard",
    }));
  }

  return (
    <section className="space-y-5" aria-labelledby="professional-tools-heading">
      <div>
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#a8a29a]">Actionable professional controls</p>
        <h2 id="professional-tools-heading" className="font-serif text-2xl font-normal text-[#f6f1e6]">Alliance Tool Belt V2</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#a8a29a]">Build a governed route indication and perform a document-readiness review before submitting through canonical Milano Seal intake.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-lg border border-[#c6a55a]/20 bg-[#0d0d0d] p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3"><Route className="text-[#c6a55a]" size={18} /><h3 className="text-base text-[#f6f1e6]">Apostille Route Architect</h3></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-[#a8a29a]">Originating U.S. state<input className={`${inputClass} mt-1`} value={origin} onChange={(event) => setOrigin(event.target.value)} /></label>
            <label className="text-xs text-[#a8a29a]">Destination country<input className={`${inputClass} mt-1`} value={destination} onChange={(event) => setDestination(event.target.value)} /></label>
            <label className="text-xs text-[#a8a29a]">Document type<input className={`${inputClass} mt-1`} value={documentType} onChange={(event) => setDocumentType(event.target.value)} /></label>
            <label className="text-xs text-[#a8a29a]">Issuing authority<select className={`${inputClass} mt-1`} value={issuance} onChange={(event) => setIssuance(event.target.value as typeof issuance)}><option value="unknown">Review required</option><option value="state">State / local</option><option value="federal">Federal</option></select></label>
          </div>
          <button type="button" onClick={architect} disabled={!destination.trim() || !documentType.trim()} className="mt-4 rounded border border-[#c6a55a]/40 bg-[#c6a55a]/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-[#c6a55a] disabled:cursor-not-allowed disabled:opacity-40">Build route indication</button>
          {route && <div className="mt-5 space-y-3 border-t border-[#c6a55a]/15 pt-4 text-sm text-[#a8a29a]" aria-live="polite"><p className="font-mono text-xs text-[#c6a55a]">{route.reviewRequired ? "REVIEW REQUIRED" : "ROUTE INDICATED"} · {route.hagueStatus}</p><p className="text-[#f6f1e6]">{route.routeIndicated}</p><ol className="list-decimal space-y-1 pl-5">{route.authorityPath.map((step) => <li key={step}>{step}</li>)}</ol><p>{route.translationConsideration}</p><p>{route.embassyConsideration}</p><p className="text-xs italic">{route.disclaimer}</p></div>}
        </article>
        <article className="rounded-lg border border-[#c6a55a]/20 bg-[#0d0d0d] p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3"><ScanSearch className="text-[#c6a55a]" size={18} /><h3 className="text-base text-[#f6f1e6]">Document Readiness Scan</h3></div>
          <div className="grid gap-2 sm:grid-cols-2">{(Object.keys(checkLabels) as Array<keyof ReadinessScanInput>).map((key) => <label key={key} className="flex min-h-10 items-center gap-2 rounded border border-white/5 px-3 py-2 text-xs text-[#a8a29a]"><input type="checkbox" checked={checks[key]} onChange={(event) => setChecks((current) => ({ ...current, [key]: event.target.checked }))} className="accent-[#c6a55a]" />{checkLabels[key]}</label>)}</div>
          <button type="button" onClick={() => setScan(scanDocumentReadiness(checks))} className="mt-4 rounded border border-[#c6a55a]/40 bg-[#c6a55a]/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-[#c6a55a]">Run readiness scan</button>
          {scan && <div className="mt-5 border-t border-[#c6a55a]/15 pt-4" aria-live="polite"><div className="flex items-center gap-2 font-mono text-xs text-[#c6a55a]">{scan.status === "READY" ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}{scan.status}</div>{scan.findings.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#a8a29a]">{scan.findings.map((finding) => <li key={finding}>{finding}</li>)}</ul>}<p className="mt-3 text-xs italic text-[#a8a29a]">{scan.disclaimer}</p></div>}
        </article>
      </div>
    </section>
  );
}
