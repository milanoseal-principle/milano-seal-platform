"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  Upload,
  X,
  Globe,
} from "lucide-react";
import {
  STRUCTURING_LABEL,
  STRUCTURING_SEQUENCE,
  applyQuickTags,
  emptyAnalysis,
  parseMatter,
  type MatterAnalysis,
  type StructuringState,
} from "@/lib/intake/matterAnalysis";

interface SmartMatterIntakeProps {
  onAnalysisReady?: (analysis: MatterAnalysis) => void;
  onFilesPicked?: (files: File[]) => void;
  initialMessage?: string;
}

interface MatterIntelligencePreview {
  corridor_type: "hague" | "consular" | "unknown";
  estimated_timeline_days: number | null;
  translation_required: boolean;
  translation_language: string | null;
  witnesses_required: boolean;
  witness_count: number;
  apostille_required: boolean;
  next_action_client: string;
  is_derived: boolean;
  authority_name: string | null;
}

const STEP_INTERVAL_MS = 700;

export function SmartMatterIntake({
  onAnalysisReady,
  onFilesPicked,
  initialMessage,
}: SmartMatterIntakeProps) {
  const [analysis, setAnalysis] = useState<MatterAnalysis>(emptyAnalysis());
  const [message, setMessage] = useState(initialMessage ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [intelligencePreview, setIntelligencePreview] = useState<MatterIntelligencePreview | null>(null);
  const [intelligenceLoading, setIntelligenceLoading] = useState(false);

  useEffect(() => {
    setAnalysis((prev) => applyQuickTags(prev, message));
  }, [message]);

  const startStructuring = (): {
    advance: (state: StructuringState) => void;
    settle: () => void;
  } => {
    let cancelled = false;
    let i = 0;
    const tick = () => {
      if (cancelled) return;
      if (i >= STRUCTURING_SEQUENCE.length - 1) return;
      i += 1;
      setAnalysis((prev) => ({
        ...prev,
        structuringState: STRUCTURING_SEQUENCE[i],
      }));
      setTimeout(tick, STEP_INTERVAL_MS);
    };
    setAnalysis((prev) => ({
      ...prev,
      structuringState: STRUCTURING_SEQUENCE[0],
    }));
    setTimeout(tick, STEP_INTERVAL_MS);
    return {
      advance: (state) => {
        if (!cancelled)
          setAnalysis((prev) => ({ ...prev, structuringState: state }));
      },
      settle: () => {
        cancelled = true;
      },
    };
  };

  const runParse = async (): Promise<void> => {
    if (parsing) return;
    if (!message.trim() && files.length === 0) {
      setError("Add a description or upload at least one document.");
      return;
    }
    setParsing(true);
    setError(null);
    const ticker = startStructuring();
    try {
      const next = await parseMatter({ message, files });
      ticker.settle();
      setAnalysis({ ...next, structuringState: "READY_FOR_REVIEW" });
      onAnalysisReady?.(next);
      if (files.length) onFilesPicked?.(files);

      // Fetch matter intelligence preview if country + document detected
      if (next.country || next.documentType) {
        setIntelligenceLoading(true);
        setIntelligencePreview(null);
        try {
          const countrySlug = next.country.toLowerCase().replace(/\s+/g, "-");
          const docSlug = next.documentType.toLowerCase().replace(/\s+/g, "-");
          const params = new URLSearchParams({
            country: countrySlug,
            document: docSlug,
          });
          const r = await fetch(`/api/matter-intelligence?${params.toString()}`);
          if (r.ok) {
            const json = await r.json() as MatterIntelligencePreview;
            setIntelligencePreview(json);
          }
        } catch {
          // silently hide — don't crash form
        } finally {
          setIntelligenceLoading(false);
        }
      }
    } catch (e) {
      ticker.settle();
      setAnalysis((prev) => ({ ...prev, structuringState: "IDLE" }));
      setError(
        e instanceof Error ? e.message : "Could not structure the matter.",
      );
    } finally {
      setParsing(false);
    }
  };

  const removeFile = (i: number) => {
    setFiles((prev) => prev.filter((_, j) => j !== i));
  };

  const tags = liveTagsFrom(analysis);
  const showStructuring =
    parsing ||
    (analysis.structuringState !== "IDLE" &&
      analysis.structuringState !== "READY_FOR_REVIEW");
  const ready = analysis.structuringState === "READY_FOR_REVIEW";
  const showJurisdiction = ready && !!analysis.country;

  const showEmptyParseNotice = ready && !analysis.country;

  return (
    <div
      className="relative w-full max-w-2xl mx-auto mb-12 overflow-hidden border border-[rgba(198,165,90,0.32)] rounded-2xl"
      style={{
        background: "linear-gradient(180deg, rgba(13,13,15,0.96) 0%, rgba(7,7,8,0.98) 100%)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(198,165,90,0.06), inset 0 0 30px rgba(198,165,90,0.02)",
      }}
    >
      <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-[#C6A55A] to-transparent opacity-70" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(198,165,90,0.10), transparent 45%)",
        }}
      />

      <div className="relative px-8 py-7 md:px-10 md:py-8">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full border border-[rgba(198,165,90,0.5)] flex items-center justify-center text-[var(--ms-gold)]" style={{ background: "radial-gradient(circle, rgba(198,165,90,0.12), transparent)" }}>
              <Sparkles className="w-4 h-4" strokeWidth={1.6} />
            </div>
            <div>
              <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--ms-gold)]">
                Smart Matter Intake
              </div>
              <div className="text-[12px] text-white/55 mt-1 leading-relaxed max-w-md font-light">
                Upload PDF or Word documents, or describe your matter in any language. The
                system will structure your intake, detect jurisdiction
                requirements, and prepare your execution pathway.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="text-[10px] uppercase tracking-[0.18em] text-white/40 hover:text-[var(--ms-gold)] transition-colors cursor-pointer"
          >
            {collapsed ? "Open" : "Hide"}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div
                className="bg-[#0D0D0D] rounded-sm p-5 mb-5"
                style={{
                  border: inputFocused
                    ? "1px solid rgba(198,165,90,0.48)"
                    : "1px solid rgba(198,165,90,0.22)",
                  transition: "border-color 0.28s ease, box-shadow 0.28s ease",
                  boxShadow: inputFocused
                    ? "0 0 0 3px rgba(198,165,90,0.07)"
                    : "none",
                }}
              >
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder="Describe your international document matter…"
                  rows={4}
                  className="w-full bg-transparent border-none outline-none resize-none text-[#F5F1E8] text-base leading-relaxed font-light placeholder:text-[#888]/40"
                  disabled={parsing}
                />

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    <AnimatePresence initial={false}>
                      {tags.map((tag, i) => (
                        <motion.span
                          key={tag}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.22, delay: i * 0.05, ease: "easeOut" }}
                          className="px-3 py-1.5 rounded-full border border-[rgba(198,165,90,0.28)] bg-[rgba(198,165,90,0.08)] text-[#D8C08A] text-[10px] uppercase tracking-[0.14em] font-semibold"
                        >
                          {tag}
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    if (!e.target.files) return;
                    const ALLOWED = /\.(pdf|doc|docx)$/i;
                    const picked = Array.from(e.target.files)
                      .filter((f) => ALLOWED.test(f.name))
                      .slice(0, 10);
                    e.target.value = "";
                    setFiles((prev) => {
                      const seen = new Set(prev.map((f) => f.name));
                      return [
                        ...prev,
                        ...picked.filter((f) => !seen.has(f.name)),
                      ].slice(0, 10);
                    });
                  }}
                />
                {files.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    {files.map((f, i) => (
                      <div
                        key={f.name + i}
                        className="flex items-center justify-between bg-[rgba(255,255,255,0.04)] border border-[rgba(198,165,90,0.18)] rounded-sm px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-[#C6A55A] flex-shrink-0" />
                          <span className="text-[11px] text-[#D8C08A] truncate">
                            {f.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="text-[#8A7A60] hover:text-[#F5F1E8]"
                          disabled={parsing}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={parsing}
                  className="px-5 py-3 rounded-lg cursor-pointer border border-[var(--ms-gold)]/45 bg-black/30 text-[var(--ms-gold)]/85 hover:bg-[rgba(198,165,90,0.10)] hover:text-[var(--ms-gold)] text-[10.5px] font-semibold tracking-[0.16em] uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Add Documents
                </button>
                <button
                  type="button"
                  onClick={runParse}
                  disabled={parsing || (!message.trim() && files.length === 0)}
                  className="px-5 py-3 cursor-pointer bg-[#C6A55A] text-[#0A0A0A] hover:brightness-110 text-[10.5px] font-semibold tracking-[0.16em] uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {parsing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Structuring…
                    </>
                  ) : (
                    <>Structure This Matter</>
                  )}
                </button>
              </div>

              {error && (
                <div className="mb-5 px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-[11px] text-red-300">
                  {error}
                </div>
              )}

              {showStructuring && (
                <StructuringPanel current={analysis.structuringState} />
              )}

              {showJurisdiction && (
                <div className="grid md:grid-cols-2 gap-4 mb-5">
                  <JurisdictionPreview analysis={analysis} />
                  <ConfidencePanel analysis={analysis} />
                </div>
              )}

              {/* Matter Intelligence Preview */}
              {(intelligenceLoading || intelligencePreview) && (
                <div className="mb-5 bg-[#0D0D0D] border border-[rgba(198,165,90,0.28)] rounded-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-3 border-b border-[rgba(198,165,90,0.14)]">
                    <Globe className="w-3.5 h-3.5 text-[#C6A55A]" />
                    <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#C6A55A]">
                      Matter Intelligence Preview
                    </span>
                    {intelligenceLoading && (
                      <Loader2 className="w-3 h-3 text-[#C6A55A] animate-spin ml-auto" />
                    )}
                  </div>
                  {intelligencePreview && (
                    <div className="px-5 py-4 space-y-2.5">
                      <IntelRow label="Route Type">
                        {intelligencePreview.corridor_type === "hague"
                          ? "Hague Route"
                          : intelligencePreview.corridor_type === "consular"
                            ? "Consular Route"
                            : "Standard Corridor"}
                        {intelligencePreview.is_derived && (
                          <span className="ml-2 text-[9px] text-[#C6A55A] uppercase tracking-wider">(derived)</span>
                        )}
                      </IntelRow>
                      {intelligencePreview.estimated_timeline_days && (
                        <IntelRow label="Estimated Timeline">
                          {intelligencePreview.estimated_timeline_days} days
                        </IntelRow>
                      )}
                      <IntelRow label="Translation Required">
                        {intelligencePreview.translation_required
                          ? `Yes${intelligencePreview.translation_language ? ` — Certified ${intelligencePreview.translation_language}` : ""}`
                          : "No"}
                      </IntelRow>
                      <IntelRow label="Witness Required">
                        {intelligencePreview.witnesses_required
                          ? `Yes — ${intelligencePreview.witness_count} witness${intelligencePreview.witness_count > 1 ? "es" : ""}`
                          : "No"}
                      </IntelRow>
                      <IntelRow label="Apostille Route">
                        {intelligencePreview.apostille_required
                          ? "Florida Dept of State"
                          : "Not required"}
                      </IntelRow>
                      <IntelRow label="Client Next Action">
                        {intelligencePreview.next_action_client}
                      </IntelRow>
                      <p className="text-[10px] text-[#6E6558] font-light leading-relaxed pt-2 border-t border-[rgba(198,165,90,0.1)]">
                        International use is subject to destination and receiving-authority requirements. The Milano Seal provides notarial and document coordination services only and does not provide legal guidance.
                      </p>
                      <p className="text-[10px] text-[#9A9488] font-light leading-relaxed pt-2 border-t border-[rgba(198,165,90,0.1)]">
                        International use is subject to destination and receiving-authority requirements. The Milano Seal provides notarial and document coordination services only and does not provide legal advice.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {showEmptyParseNotice && (
                <div className="mb-5 px-4 py-3 bg-[rgba(198,165,90,0.06)] border border-[rgba(198,165,90,0.25)] rounded-sm">
                  <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#C6A55A] mb-1">
                    Insufficient Detail
                  </div>
                  <p className="text-[12px] text-[#E8DCC0] font-light leading-relaxed">
                    The system finished structuring but couldn&apos;t identify a
                    destination jurisdiction from your input. Please add a short
                    description of your matter (destination country, document
                    type, and timeline) and try again.
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-[rgba(198,165,90,0.14)] text-[11px] text-[#9A9488] leading-relaxed font-light">
                All matters are reviewed before execution begins. Jurisdictional
                requirements, apostille eligibility, and execution pathways are
                confirmed prior to scheduling.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StructuringPanel({ current }: { current: StructuringState }) {
  const idx = STRUCTURING_SEQUENCE.indexOf(current);
  return (
    <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(198,165,90,0.18)] rounded-sm p-5 mb-5">
      <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#C6A55A] mb-4">
        Matter Structuring Status
      </div>
      <div className="space-y-2.5">
        {STRUCTURING_SEQUENCE.map((step, i) => {
          const reached = i <= idx;
          const active = i === idx;
          return (
            <div
              key={step}
              className="flex items-center gap-3 transition-opacity duration-300"
              style={{ opacity: reached ? 1 : 0.3 }}
            >
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  reached ? "bg-[#C6A55A]" : "bg-white/10"
                } ${active ? "animate-pulse" : ""}`}
              />
              <div className="text-[10.5px] uppercase tracking-[0.14em] text-[#9A9488] font-semibold">
                {STRUCTURING_LABEL[step]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function JurisdictionPreview({ analysis }: { analysis: MatterAnalysis }) {
  const lr = analysis.languageRouting;
  return (
    <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(198,165,90,0.18)] rounded-sm p-5">
      <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#C6A55A] mb-4">
        Jurisdiction Preview
      </div>

      <div className="mb-4">
        <div className="text-[11px] text-[#9A9488] mb-1 font-light">
          Destination Jurisdiction
        </div>
        <div className="font-serif text-[22px] text-[#E8DCC0] leading-tight">
          {analysis.country || "—"}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-[11px] text-[#9A9488] mb-1 font-light">
          Hague Convention
        </div>
        <div
          className={`text-[13px] font-semibold ${
            analysis.hagueMember ? "text-[#5BBF84]" : "text-[#E0A07A]"
          }`}
        >
          {analysis.hagueMember ? "YES" : "NO"}
        </div>
      </div>

      {lr && (
        <div className="mb-4">
          <div className="text-[11px] text-[#9A9488] mb-1 font-light">
            Official Language{lr.officialLanguages.length > 1 ? "s" : ""}
          </div>
          <div className="text-[13px] text-[#E8DCC0] font-light">
            {lr.officialLanguages.join(", ")}
          </div>
        </div>
      )}

      {lr && (
        <div className="mb-4">
          <div className="text-[11px] text-[#9A9488] mb-1 font-light">
            Translation
          </div>
          <div
            className={`text-[12px] font-semibold ${
              lr.translationLikely ? "text-[#E0A07A]" : "text-[#5BBF84]"
            }`}
          >
            {lr.translationLikely ? "Typically required" : "Not typically required"}
          </div>
          <div className="text-[11px] text-[#9A9488] font-light mt-0.5 leading-relaxed">
            {lr.translationNote}
          </div>
        </div>
      )}

      {!lr && analysis.country && (
        <div className="mb-4">
          <div className="text-[11px] text-[#9A9488] mb-1 font-light">
            Translation
          </div>
          <div className="text-[12px] text-[#E0A07A] font-semibold">
            Manual review required
          </div>
          <div className="text-[11px] text-[#9A9488] font-light mt-0.5 leading-relaxed">
            Translation and language requirements for this jurisdiction will be confirmed by our team before execution.
          </div>
        </div>
      )}

      {analysis.executionPath.length > 0 && (
        <div>
          <div className="text-[11px] text-[#9A9488] mb-2 font-light">
            Execution Path
          </div>
          <div className="text-[13px] text-[#E8DCC0] leading-relaxed font-light">
            {analysis.executionPath.join(" → ")}
          </div>
        </div>
      )}
    </div>
  );
}

function ConfidencePanel({ analysis }: { analysis: MatterAnalysis }) {
  const complete = analysis.missingFields.length === 0;
  return (
    <div className="bg-[#111111] border border-[rgba(198,165,90,0.18)] rounded-sm p-5">
      <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#C6A55A] mb-3">Matter Structure</div>
      <div className="font-serif text-[24px] text-[#F6F1E6] leading-tight mb-4">
        {complete ? "Core Matter Facts Captured" : "Additional Matter Facts Needed"}
      </div>
      <div className="space-y-1.5 mb-3">
        {analysis.detectedFields.map((f) => (
          <div key={f} className="flex items-center gap-2 text-[12.5px] text-[#D9D1C4]">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" strokeWidth={2.4} />
            {f}
          </div>
        ))}
      </div>
      {analysis.missingFields.length > 0 && (
        <div className="pt-3 border-t border-white/[0.08]">
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-[#9A9488] mb-1.5 font-semibold">Still Needed</div>
          {analysis.missingFields.map((f) => <div key={f} className="text-[12px] text-[#9A9488] leading-relaxed font-light">· {f}</div>)}
        </div>
      )}
      <p className="mt-4 pt-3 border-t border-white/[0.08] text-[10.5px] text-[#777064] font-light leading-relaxed">Execution timeline and delivery are selected during Review and do not reduce matter-structuring confidence.</p>
    </div>
  );
}

function IntelRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#8A7A60] pt-0.5 w-[130px] flex-shrink-0">
        {label}
      </span>
      <span className="text-[12px] text-[#D8C08A] font-light leading-relaxed">{children}</span>
    </div>
  );
}

function liveTagsFrom(a: MatterAnalysis): string[] {
  const tags: string[] = [];
  if (a.country) tags.push(a.country.toUpperCase());
  if (a.documentType) tags.push(a.documentType.toUpperCase());
  if (a.apostilleRequired) tags.push("APOSTILLE REQUIRED");
  if (a.signerCount > 1) tags.push(`${a.signerCount} SIGNERS`);
  else if (a.signerCount === 1 && a.documentType) tags.push("1 SIGNER");
  if (a.urgency === "urgent") tags.push("URGENT TIMELINE");
  else if (a.urgency === "expedited") tags.push("EXPEDITED");
  else if (a.urgency === "standard" && a.country)
    tags.push("STANDARD TIMELINE");
  if (a.ronReviewRequired) tags.push("RON REVIEW REQUIRED");
  if (a.translationNeeded) tags.push("TRANSLATION REQUIRED");
  return tags;
}
