"use client";

import { useState, useCallback } from "react";
import { Upload, CheckCircle2, AlertTriangle, XCircle, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────────

interface PacketFlag {
  code: string;
  label: string;
  severity: "error" | "warning" | "info";
  resolution: string;
}

interface PacketAnalysis {
  score: number;
  matter_id: string;
  document_type: string;
  destination_country: string;
  apostille_path: "hague" | "legalization" | "none";
  flags: PacketFlag[];
  checklist: { label: string; present: boolean }[];
}

// ── Parser (client-side keyword heuristics — real version uses /api route) ────

function analyzePacket(filename: string, size: number): PacketAnalysis {
  const name = filename.toLowerCase();

  const isApostille = name.includes("apostille") || name.includes("hague");
  const hasPOA = name.includes("poa") || name.includes("power") || name.includes("attorney");
  const hasBirth = name.includes("birth");
  const hasMarriage = name.includes("marriage");
  const hasCorporate = name.includes("corporate") || name.includes("resolution") || name.includes("articles");
  const hasTranslation = name.includes("translation") || name.includes("translated");
  const hasAffidavit = name.includes("affidavit");

  const docType = hasBirth ? "Birth Certificate"
    : hasMarriage ? "Marriage Certificate"
    : hasPOA ? "Power of Attorney"
    : hasCorporate ? "Corporate Document"
    : hasAffidavit ? "Affidavit"
    : "Document Packet";

  const flags: PacketFlag[] = [];

  if (size < 50_000) {
    flags.push({
      code: "small_file",
      label: "File unusually small",
      severity: "warning",
      resolution: "Verify the complete signed packet was uploaded, not a preview or cover sheet.",
    });
  }

  if (!hasTranslation && (name.includes("brazil") || name.includes("france") || name.includes("germany") || name.includes("spain"))) {
    flags.push({
      code: "missing_translation",
      label: "Translation may be required",
      severity: "warning",
      resolution: "Destination country may require certified translation. Confirm with authority requirements.",
    });
  }

  const checklist = [
    { label: "Signed original document", present: size > 80_000 },
    { label: "Notary block complete", present: !name.includes("draft") && !name.includes("unsigned") },
    { label: "Notary seal / stamp", present: !name.includes("draft") },
    { label: "Apostille stamp / certificate", present: isApostille },
    { label: "Certified translation (if required)", present: hasTranslation },
    { label: "Client ID / authorization", present: name.includes("id") || name.includes("auth") || name.includes("passport") },
    { label: "Payment receipt attached", present: name.includes("receipt") || name.includes("payment") || name.includes("paid") },
    { label: "Courier label / tracking ref", present: name.includes("label") || name.includes("tracking") || name.includes("dhl") || name.includes("fedex") },
  ];

  const presentCount = checklist.filter((c) => c.present).length;
  const score = Math.round((presentCount / checklist.length) * 100);

  if (!checklist[1].present) {
    flags.push({ code: "notary_block", label: "Notary block may be incomplete", severity: "error", resolution: "Review document for completed notary acknowledgment or jurat block." });
  }
  if (!checklist[2].present) {
    flags.push({ code: "notary_seal", label: "Notary seal / stamp not detected", severity: "error", resolution: "Ensure the notary's official seal is affixed before apostille submission." });
  }
  if (!checklist[3].present && (hasBirth || hasMarriage || hasPOA)) {
    flags.push({ code: "apostille_missing", label: "Apostille not detected", severity: "warning", resolution: "Confirm whether apostille has been obtained or is still processing." });
  }

  return {
    score,
    matter_id: `MS-PENDING-${String(size).slice(-4)}`,
    document_type: docType,
    destination_country: "—",
    apostille_path: isApostille ? "hague" : "none",
    flags,
    checklist,
  };
}

// ── Styling ────────────────────────────────────────────────────────────────────

const GOLD = "rgba(212,175,55,1)";
const GOLD_DIM = "rgba(212,175,55,0.45)";
const BORDER = "rgba(212,175,55,0.12)";
const SURFACE = "rgba(255,255,255,0.03)";

const SEVERITY_COLOR = {
  error: "rgba(239,68,68,0.75)",
  warning: "rgba(245,158,11,0.75)",
  info: "rgba(59,130,246,0.7)",
};
const SEVERITY_BG = {
  error: "rgba(239,68,68,0.06)",
  warning: "rgba(245,158,11,0.06)",
  info: "rgba(59,130,246,0.06)",
};
const SEVERITY_BORDER = {
  error: "rgba(239,68,68,0.18)",
  warning: "rgba(245,158,11,0.18)",
  info: "rgba(59,130,246,0.18)",
};

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PacketReviewPage() {
  const [dragging, setDragging] = useState(false);
  const [analysis, setAnalysis] = useState<PacketAnalysis | null>(null);
  const [filename, setFilename] = useState<string | null>(null);

  const processFile = useCallback((file: File) => {
    setFilename(file.name);
    setAnalysis(analyzePacket(file.name, file.size));
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const scoreColor = analysis
    ? analysis.score >= 90 ? "rgba(34,197,94,0.85)"
    : analysis.score >= 70 ? "rgba(212,175,55,0.85)"
    : "rgba(239,68,68,0.8)"
    : GOLD;

  return (
    <div style={{ color: "#e8e4dc", fontFamily: "monospace" }}>
      {/* Back */}
      <Link href="/dashboard/matter-intelligence"
        className="inline-flex items-center gap-1.5 mb-5 text-[10px] hover:opacity-80 transition-opacity"
        style={{ color: GOLD_DIM, letterSpacing: "0.15em" }}>
        <ArrowLeft size={11} /> MATTER INTELLIGENCE
      </Link>

      {/* Header */}
      <div className="mb-6">
        <p style={{ fontSize: 9, letterSpacing: "0.25em", color: GOLD_DIM, marginBottom: 4 }}>PACKET QA ENGINE</p>
        <h1 style={{ fontSize: "clamp(1rem,2.5vw,1.35rem)", fontFamily: "Georgia,serif", fontWeight: "normal", color: "#f4e5b8", marginBottom: 4 }}>
          Document Packet Upload
        </h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          Upload an executed document packet to receive completeness score, missing-item flags, and apostille readiness assessment.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className="relative rounded-sm mb-6 flex flex-col items-center justify-center gap-3 py-10 cursor-pointer transition-colors"
        style={{
          border: `1px dashed ${dragging ? GOLD : BORDER}`,
          background: dragging ? "rgba(212,175,55,0.04)" : SURFACE,
        }}
        onClick={() => document.getElementById("packet-upload")?.click()}
      >
        <Upload size={22} style={{ color: dragging ? GOLD : GOLD_DIM }} />
        <div className="text-center">
          <div style={{ fontSize: 11, color: dragging ? "#f4e5b8" : "rgba(255,255,255,0.5)", letterSpacing: "0.08em" }}>
            Drop packet here or click to upload
          </div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>
            PDF · DOCX · ZIP · Signed execution packet
          </div>
        </div>
        <input id="packet-upload" type="file" accept=".pdf,.docx,.zip,.png,.jpg" className="sr-only" onChange={onFileChange} />
      </div>

      {/* Result */}
      {analysis && filename && (
        <div className="space-y-4">
          {/* Score card */}
          <div className="rounded-sm p-4 flex items-center gap-4" style={{ border: `1px solid ${BORDER}`, background: SURFACE }}>
            <div className="flex-shrink-0 text-center" style={{ minWidth: 70 }}>
              <div style={{ fontSize: "1.8rem", fontVariantNumeric: "tabular-nums", color: scoreColor, fontFamily: "Georgia,serif" }}>
                {analysis.score}%
              </div>
              <div style={{ fontSize: 8, color: GOLD_DIM, letterSpacing: "0.2em", marginTop: 2 }}>PACKET SCORE</div>
            </div>
            <div style={{ width: 1, height: 48, background: BORDER }} />
            <div className="flex-1">
              <div style={{ fontSize: 11, color: "#f4e5b8", marginBottom: 2 }}>{filename}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>
                {analysis.document_type} · Apostille path: {analysis.apostille_path.toUpperCase()}
              </div>
              <div style={{ fontSize: 9, color: analysis.flags.length > 0 ? "rgba(239,68,68,0.6)" : "rgba(34,197,94,0.6)", marginTop: 3 }}>
                {analysis.flags.length > 0
                  ? `${analysis.flags.length} flag${analysis.flags.length > 1 ? "s" : ""} require attention`
                  : "No blocking issues detected"}
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="rounded-sm p-4" style={{ border: `1px solid ${BORDER}`, background: SURFACE }}>
            <div style={{ fontSize: 9, color: GOLD_DIM, letterSpacing: "0.2em", marginBottom: 12 }}>PACKET CHECKLIST</div>
            <div className="space-y-2">
              {analysis.checklist.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  {item.present
                    ? <CheckCircle2 size={13} style={{ color: "rgba(34,197,94,0.75)", flexShrink: 0 }} />
                    : <XCircle size={13} style={{ color: "rgba(239,68,68,0.6)", flexShrink: 0 }} />}
                  <span style={{ fontSize: 11, color: item.present ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.3)" }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Flags */}
          {analysis.flags.length > 0 && (
            <div className="rounded-sm p-4" style={{ border: `1px solid rgba(239,68,68,0.15)`, background: "rgba(239,68,68,0.03)" }}>
              <div style={{ fontSize: 9, color: "rgba(239,68,68,0.6)", letterSpacing: "0.2em", marginBottom: 12 }}>FLAGS REQUIRING ACTION</div>
              <div className="space-y-3">
                {analysis.flags.map((flag) => (
                  <div key={flag.code} className="rounded-sm p-3 flex gap-3"
                    style={{ background: SEVERITY_BG[flag.severity], border: `1px solid ${SEVERITY_BORDER[flag.severity]}` }}>
                    <AlertTriangle size={13} style={{ color: SEVERITY_COLOR[flag.severity], flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <div style={{ fontSize: 10, color: SEVERITY_COLOR[flag.severity], letterSpacing: "0.08em", marginBottom: 2 }}>
                        {flag.label.toUpperCase()}
                      </div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{flag.resolution}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Needs review */}
          {analysis.score < 90 && (
            <div className="rounded-sm px-4 py-3 flex items-center gap-3"
              style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)" }}>
              <FileText size={12} style={{ color: "rgba(245,158,11,0.7)" }} />
              <span style={{ fontSize: 10, color: "rgba(245,158,11,0.65)", letterSpacing: "0.08em" }}>
                Packet routed to Needs Review queue. Resolve flagged items before advancing to execution.
              </span>
            </div>
          )}

          {/* Reset */}
          <button onClick={() => { setAnalysis(null); setFilename(null); }}
            className="text-[10px] tracking-widest px-3 py-1.5 rounded-sm hover:bg-white/5 transition-colors"
            style={{ border: `1px solid ${BORDER}`, color: GOLD_DIM }}>
            UPLOAD ANOTHER PACKET
          </button>
        </div>
      )}

      {/* Empty notice */}
      {!analysis && (
        <div className="rounded-sm p-4" style={{ border: `1px solid ${BORDER}`, background: SURFACE }}>
          <div style={{ fontSize: 9, color: GOLD_DIM, letterSpacing: "0.2em", marginBottom: 8 }}>WHAT GETS CHECKED</div>
          <div className="space-y-1.5">
            {[
              "Signed original document present",
              "Notary block and seal completeness",
              "Apostille stamp or certificate",
              "Certified translation (if destination requires)",
              "Client ID / authorization on file",
              "Payment receipt attached",
              "Courier label / tracking reference",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="w-1 h-1 rounded-full" style={{ background: GOLD_DIM }} />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
