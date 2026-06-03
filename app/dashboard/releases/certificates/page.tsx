"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ReleaseCertificateRenderer } from "@/components/releases/ReleaseCertificateRenderer";
import { CertificateActions } from "@/components/releases/CertificateActions";

const GOLD = "#C6A55A";
const EMERALD = "#4a9e6b";

type TabType = "release" | "completion";

interface CertForm {
  matterId: string;
  clientName: string;
  documentType: string;
  destination: string;
  releaseDate: string;
  completionDate: string;
}

function generateHash(form: CertForm): string {
  const str = `${form.matterId}-${form.clientName}-${form.releaseDate}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `MS-${Math.abs(hash).toString(16).toUpperCase().padStart(8, "0")}`;
}

export default function CertificatesPage() {
  const [tab, setTab] = useState<TabType>("release");
  const [darkMode, setDarkMode] = useState(true);
  const [form, setForm] = useState<CertForm>({
    matterId: "",
    clientName: "",
    documentType: "",
    destination: "",
    releaseDate: "",
    completionDate: "",
  });
  const [generated, setGenerated] = useState(false);

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerated(true);
  }

  const hash = generateHash(form);

  const certBg = darkMode ? "rgba(8,5,1,0.97)" : "#f8f6f0";
  const certText = darkMode ? "rgba(255,255,255,0.85)" : "#1a1208";
  const certMuted = darkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const certBorder = darkMode ? "rgba(212,175,55,0.2)" : "rgba(198,165,90,0.3)";

  return (
    <>
      {/* DEMO PREVIEW — NOT LIVE DATA */}
      <div
        style={{
          marginBottom: 32,
          padding: "12px 16px",
          background: "rgba(198,165,90,0.05)",
          border: "1px solid rgba(198,165,90,0.15)",
          borderRadius: 3,
          fontSize: 10,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "rgba(198,165,90,0.6)",
          fontFamily: "monospace",
        }}
      >
        Demo Preview — Not Live Data
      </div>
      <ReleaseCertificateRenderer
        verificationId="DEMO-VERIFICATION-ID"
        matterId="DEMO-MATTER-ID"
        clientName="Demo Client"
        documentType="Power of Attorney"
        destinationCountry="Italy"
        executionLane="Standard"
        notarizationStatus="COMPLETE"
        apostilleStatus="COMPLETE"
        courierStatus="DELIVERED"
        releaseStatus="PENDING REVIEW"
        releaseDate={new Date().toISOString()}
        custodyHash="MS-DEMO-HASH-0000"
        verificationUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/verify/DEMO-VERIFICATION-ID`}
        operatorOfRecord="Milano Seal Operations"
      />
      <CertificateActions
        verificationId="DEMO-VERIFICATION-ID"
        matterId="DEMO-MATTER-ID"
      />
      <div style={{ margin: "32px 0", height: 1, background: "rgba(198,165,90,0.1)" }} />

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="min-h-screen p-6 space-y-8"
        style={{ background: "#0A0A0A" }}
      >
        {/* Header */}
        <div className="no-print">
          <p
            className="font-mono text-[9px] tracking-[0.32em] uppercase mb-2"
            style={{ color: "rgba(198,165,90,0.5)" }}
          >
            Operations / Releases / Certificates
          </p>
          <h1 className="text-2xl font-semibold" style={{ color: GOLD }}>
            Release Certification System
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            Generate and print official release and completion certificates
          </p>
        </div>

        {/* Tabs */}
        <div className="no-print flex gap-2">
          {(["release", "completion"] as TabType[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setGenerated(false);
              }}
              className="px-4 py-2 rounded font-mono text-xs capitalize transition-all"
              style={{
                background: tab === t ? `${GOLD}20` : "transparent",
                border: `1px solid ${tab === t ? GOLD + "50" : "rgba(255,255,255,0.1)"}`,
                color: tab === t ? GOLD : "rgba(255,255,255,0.45)",
              }}
            >
              {t === "release" ? "Release Certificate" : "Matter Completion Certificate"}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span
              className="text-[10px] font-mono"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Theme:
            </span>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-3 py-1.5 rounded font-mono text-xs"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              {darkMode ? "Dark" : "Light"}
            </button>
          </div>
        </div>

        {/* Form */}
        <div
          className="no-print rounded-lg p-6"
          style={{
            background: "rgba(8,5,1,0.97)",
            border: "1px solid rgba(212,175,55,0.08)",
          }}
        >
          <p
            className="font-mono text-[9px] tracking-[0.32em] uppercase mb-4"
            style={{ color: "rgba(198,165,90,0.5)" }}
          >
            Certificate Details
          </p>
          <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "matterId", label: "Matter ID", placeholder: "MS-2025-001" },
              { key: "clientName", label: "Client Name", placeholder: "Full legal name" },
              { key: "documentType", label: "Document Type", placeholder: "Birth Certificate" },
              { key: "destination", label: "Destination Country", placeholder: "Italy" },
              { key: "releaseDate", label: "Release Date", placeholder: "2025-01-15", type: "date" },
              ...(tab === "completion"
                ? [{ key: "completionDate", label: "Completion Date", placeholder: "2025-01-15", type: "date" }]
                : []),
            ].map((field) => (
              <div key={field.key}>
                <label
                  className="block font-mono text-[9px] tracking-[0.2em] uppercase mb-1.5"
                  style={{ color: "rgba(198,165,90,0.5)" }}
                >
                  {field.label}
                </label>
                <input
                  type={field.type ?? "text"}
                  placeholder={field.placeholder}
                  value={form[field.key as keyof CertForm]}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded text-sm font-mono outline-none"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.75)",
                  }}
                />
              </div>
            ))}
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                className="px-6 py-2.5 rounded font-mono text-sm transition-opacity"
                style={{
                  background: `${GOLD}22`,
                  border: `1px solid ${GOLD}44`,
                  color: GOLD,
                }}
              >
                Generate Certificate
              </button>
              {generated && (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-6 py-2.5 rounded font-mono text-sm"
                  style={{
                    background: `${EMERALD}18`,
                    border: `1px solid ${EMERALD}33`,
                    color: EMERALD,
                  }}
                >
                  Print Certificate
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Certificate Card */}
        <AnimatePresence>
          {generated && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="rounded-lg p-8 max-w-2xl mx-auto relative"
              style={{
                background: certBg,
                border: `1px solid ${certBorder}`,
                boxShadow: darkMode
                  ? "0 0 60px rgba(198,165,90,0.08)"
                  : "0 8px 40px rgba(0,0,0,0.15)",
              }}
            >
              {/* Seal impression */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.15,
                  duration: 0.4,
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                }}
                className="absolute right-8 top-8 w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  border: `3px solid ${GOLD}`,
                  background: `${GOLD}08`,
                }}
              >
                <span className="text-2xl" style={{ color: GOLD }}>◉</span>
              </motion.div>

              {/* Certificate content */}
              <div style={{ color: certText }}>
                <p
                  className="font-mono text-[10px] tracking-[0.4em] uppercase mb-1"
                  style={{ color: certMuted }}
                >
                  Official Document
                </p>
                <h2 className="text-2xl font-bold tracking-tight mb-0.5" style={{ color: GOLD }}>
                  THE MILANO SEAL™
                </h2>
                <p className="text-base font-medium mb-6" style={{ color: certMuted }}>
                  {tab === "release"
                    ? "Certificate of Release"
                    : "Certificate of Matter Completion"}
                </p>

                <div
                  className="grid grid-cols-2 gap-x-8 gap-y-3 mb-6 text-sm"
                  style={{ borderTop: `1px solid ${certBorder}`, paddingTop: 20 }}
                >
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-wider mb-0.5" style={{ color: certMuted }}>
                      Matter
                    </p>
                    <p className="font-medium">{form.matterId || "—"}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-wider mb-0.5" style={{ color: certMuted }}>
                      Client
                    </p>
                    <p className="font-medium">{form.clientName || "—"}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-wider mb-0.5" style={{ color: certMuted }}>
                      Document
                    </p>
                    <p className="font-medium">{form.documentType || "—"}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-wider mb-0.5" style={{ color: certMuted }}>
                      Destination
                    </p>
                    <p className="font-medium">{form.destination || "—"}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-wider mb-0.5" style={{ color: certMuted }}>
                      Released
                    </p>
                    <p className="font-medium">{form.releaseDate || "—"}</p>
                  </div>
                  {tab === "completion" && (
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-wider mb-0.5" style={{ color: certMuted }}>
                        Completed
                      </p>
                      <p className="font-medium">{form.completionDate || "—"}</p>
                    </div>
                  )}
                </div>

                <p
                  className="text-sm leading-relaxed mb-6"
                  style={{ color: certMuted, borderTop: `1px solid ${certBorder}`, paddingTop: 16 }}
                >
                  {tab === "release"
                    ? "This certifies the document has been executed, apostilled, and released through the Milano Seal chain of custody."
                    : "This certifies that the above matter has been completed in full, with all documents executed, apostilled, released, and delivered to satisfaction. The client has been served with professional excellence."}
                </p>

                <div
                  className="flex items-center justify-between"
                  style={{ borderTop: `1px solid ${certBorder}`, paddingTop: 16 }}
                >
                  {/* QR Placeholder */}
                  <div>
                    <div
                      className="w-16 h-16 rounded flex items-center justify-center mb-1"
                      style={{
                        background: "rgba(128,128,128,0.1)",
                        border: "1px solid rgba(128,128,128,0.2)",
                      }}
                    >
                      <span className="text-[8px] font-mono text-center leading-tight" style={{ color: certMuted }}>
                        QR
                      </span>
                    </div>
                    <p className="text-[8px] font-mono" style={{ color: certMuted }}>
                      QR: [Verification URL]
                    </p>
                    <p className="text-[8px] font-mono" style={{ color: certMuted }}>
                      Requires production URL config
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[9px] uppercase tracking-wider mb-1" style={{ color: certMuted }}>
                      Digital Verification
                    </p>
                    <p
                      className="font-mono text-xs"
                      style={{ color: darkMode ? GOLD : "#8a6a1a" }}
                    >
                      {hash}
                    </p>
                    <p
                      className="font-mono text-[8px] mt-1"
                      style={{ color: certMuted }}
                    >
                      The Milano Seal™ · Florida · USA
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
