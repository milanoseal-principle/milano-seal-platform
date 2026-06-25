"use client";

import { useState, useCallback, useRef } from "react";
import { SealImpressionReview } from "@/components/reviews/SealImpressionReview";
import { shouldShowReviewPrompt } from "@/lib/reviews/googleBusinessProfile";
import Image from "next/image";
import { StatusTransitionPill } from "@/components/animations/StatusTransitionPill";
import { TrustConfirmSeal } from "@/components/animations/TrustConfirmSeal";
import {
  Lock,
  Mail,
  CheckCircle,
  FileText,
  Upload,
  Download,
  Eye,
  X,
  Shield,
  Clock,
  ArrowRight,
  AlertCircle,
  File,
  ImageIcon,
  Loader2,
  CreditCard,
} from "lucide-react";

// ── STATUS CONFIG ──────────────────────────────────────────────
const STEPS = [
  { key: "new", label: "Matter Received" },
  { key: "reviewing", label: "Under Review" },
  { key: "quoted", label: "Quoted" },
  { key: "awaiting_payment", label: "Awaiting Payment" },
  { key: "scheduled", label: "Scheduled" },
  { key: "in_execution", label: "In Execution" },
  { key: "apostille", label: "Apostille Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "completed", label: "Completed" },
];

interface Deal {
  id: string;
  email: string;
  client_name: string;
  status: string;
  execution_tier: string;
  amount: number;
  country: string;
  document: string;
  payment_status: string;
  invoice_status: string;
  invoice_retainer?: number | null;
  invoice_balance?: number | null;
  payment_link?: string | null;
  balance_payment_link?: string | null;
  balance_payment_status?: string | null;
  created_at: string;
  deal_status?: string | null;
  release_status?: string | null;
  delivery_status?: string | null;
  is_paid_and_released?: boolean | null;
}
interface FileRecord {
  id: string;
  filename: string;
  signed_url: string | null;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function FileIcon({ type }: { type: string }) {
  if (type?.startsWith("image/"))
    return <ImageIcon className="w-5 h-5 text-[var(--ms-gold)]" />;
  return <FileText className="w-5 h-5 text-[var(--ms-gold)]" />;
}

// ── EMAIL GATE ─────────────────────────────────────────────────
function EmailGate({
  token,
  onVerified,
}: {
  token: string;
  onVerified: () => void;
}) {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [session, setSession] = useState("");

  const sendOtp = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/portal/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setStep("otp");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const confirmOtp = async () => {
    if (!otp.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/portal/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email: email.trim(), otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      sessionStorage.setItem(`ms_portal_${token}`, data.session);
      onVerified();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <img
            src="/brand/milano-seal-feather-m-orb.png"
            alt="The Milano Seal"
            className="w-16 h-16 mx-auto mb-6 opacity-90"
          />
          <p className="text-[var(--ms-gold)] text-xs tracking-[0.3em] uppercase font-semibold mb-3">
            The Milano Seal™
          </p>
          <h1 className="font-serif text-2xl text-white mb-2">
            Matter Control Portal
          </h1>
          <p className="text-[#8A8A8A] text-sm font-light">
            {step === "email"
              ? "Enter the email address on file for this matter to access your documents."
              : `We sent a 6-digit code to ${email}. Enter it below.`}
          </p>
        </div>

        <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-8">
          {step === "email" ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-[var(--ms-gold)]" />
                <label className="text-xs font-semibold tracking-[0.1em] uppercase text-[#8A8A8A]">
                  Email Address
                </label>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-white text-sm placeholder:text-[#8A8A8A] focus:outline-none focus:border-[var(--ms-gold)]/50 transition-colors mb-4"
              />
              <button
                onClick={sendOtp}
                disabled={loading || !email.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[var(--ms-gold)] text-[#0A0A0A] font-semibold rounded-xl hover:bg-[#D4B76A] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                {loading ? "Sending…" : "Send Access Code"}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-[var(--ms-gold)]" />
                <label className="text-xs font-semibold tracking-[0.1em] uppercase text-[#8A8A8A]">
                  Access Code
                </label>
              </div>
              <input
                type="text"
                value={otp}
                onChange={(e) =>
                  setOtp(
                    e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, "")
                      .slice(0, 6),
                  )
                }
                onKeyDown={(e) => e.key === "Enter" && confirmOtp()}
                placeholder="A1B2C3"
                maxLength={6}
                className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-white text-sm text-center font-mono text-2xl tracking-[0.4em] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[var(--ms-gold)]/50 transition-colors mb-4"
              />
              <button
                onClick={confirmOtp}
                disabled={loading || otp.length < 6}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[var(--ms-gold)] text-[#0A0A0A] font-semibold rounded-xl hover:bg-[#D4B76A] transition-all disabled:opacity-50 mb-3"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {loading ? "Verifying…" : "Access Portal"}
              </button>
              <button
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setError("");
                }}
                className="w-full text-xs text-[#8A8A8A] hover:text-white transition-colors text-center"
              >
                ← Use a different email
              </button>
            </>
          )}
          {error && (
            <div className="flex items-start gap-2 mt-4 p-3 bg-red-500/8 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}
        </div>

        <p className="text-center text-[#8A8A8A] text-xs mt-6">
          <Lock className="w-3 h-3 inline mr-1" />
          Secured by token-based access. Your information is protected.
        </p>
      </div>
    </div>
  );
}

// ── DROP ZONE ──────────────────────────────────────────────────
function DropZone({
  dealId,
  onUploadComplete,
}: {
  dealId: string;
  onUploadComplete: (file: FileRecord) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{
    name: string;
    url: string;
    type: string;
  } | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setUploadError("");
    setProgress(10);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (file.type.startsWith("image/")) {
        setPreview({
          name: file.name,
          url: e.target?.result as string,
          type: file.type,
        });
      } else {
        setPreview({ name: file.name, url: "", type: file.type });
      }
    };
    reader.readAsDataURL(file);

    try {
      setProgress(40);
      const form = new FormData();
      form.append("file", file);
      form.append("deal_id", dealId);
      form.append("uploaded_by", "client");

      const res = await fetch("/api/upload", { method: "POST", body: form });
      setProgress(90);
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Upload failed");
        setUploading(false);
        return;
      }
      setProgress(100);
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
        onUploadComplete(data.file);
      }, 600);
    } catch {
      setUploadError("Upload failed. Please try again.");
      setUploading(false);
      setProgress(0);
    }
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) upload(file);
    },
    [dealId],
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
          dragging
            ? "border-[var(--ms-gold)] bg-[var(--ms-gold)]/8 scale-[1.01]"
            : "border-[#2A2A2A] hover:border-[var(--ms-gold)]/50 hover:bg-[var(--ms-gold)]/4"
        } ${uploading ? "pointer-events-none" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={onFileChange}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic"
        />

        {uploading ? (
          <div className="space-y-4">
            <Loader2 className="w-8 h-8 text-[var(--ms-gold)] mx-auto animate-spin" />
            <p className="text-[#B0B0B0] text-sm">Uploading {preview?.name}…</p>
            <div className="w-full bg-[#1A1A1A] rounded-full h-1.5">
              <div
                className="bg-[var(--ms-gold)] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : preview && progress === 100 ? (
          <div className="space-y-2">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto" />
            <p className="text-green-400 text-sm font-medium">
              Uploaded successfully
            </p>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-[var(--ms-gold)] mx-auto mb-4 opacity-70" />
            <p className="text-[#B0B0B0] text-sm mb-1">
              {dragging ? "Drop to upload" : "Drag & drop your document here"}
            </p>
            <p className="text-[#8A8A8A] text-xs">
              or click to browse — PDF, DOC, JPG, PNG · Max 20MB
            </p>
          </>
        )}
      </div>

      {/* Image preview */}
      {preview?.url && preview.type.startsWith("image/") && (
        <div className="relative bg-[#111111] border border-[#2A2A2A] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#1A1A1A]">
            <span className="text-xs text-[#8A8A8A]">
              Preview — {preview.name}
            </span>
            <button
              onClick={() => setPreview(null)}
              className="text-[#8A8A8A] hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <img
            src={preview.url}
            alt={preview.name}
            className="w-full max-h-64 object-contain"
          />
        </div>
      )}

      {uploadError && (
        <div className="flex items-start gap-2 p-3 bg-red-500/8 border border-red-500/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-xs">{uploadError}</p>
        </div>
      )}
    </div>
  );
}

// ── PORTAL MAIN ────────────────────────────────────────────────
export function PortalClient({ token, deal }: { token: string; deal: Deal }) {
  const [verified, setVerified] = useState(false);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Check for existing session
  useState(() => {
    if (typeof window !== "undefined") {
      const session = sessionStorage.getItem(`ms_portal_${token}`);
      if (session) {
        setVerified(true);
        loadFiles();
      }
    }
  });

  const loadFiles = async () => {
    if (loaded) return;
    setLoaded(true);
    const res = await fetch(`/api/portal/files?deal_id=${deal.id}`);
    if (res.ok) {
      const d = await res.json();
      setFiles(d.files || []);
    }
  };

  const handleVerified = () => {
    setVerified(true);
    loadFiles();
  };

  if (!verified) return <EmailGate token={token} onVerified={handleVerified} />;

  const currentStep = STEPS.findIndex((s) => s.key === deal.status);
  const pctComplete = Math.round(((currentStep + 1) / STEPS.length) * 100);

  const retainerDue =
    deal.payment_status !== "paid" && Boolean(deal.payment_link);
  const balanceDue =
    deal.balance_payment_status !== "paid" &&
    Boolean(deal.balance_payment_link) &&
    Number(deal.invoice_balance ?? 0) > 0;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div className="border-b border-[#1A1A1A] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/brand/milano-seal-feather-m-orb.png"
              alt="The Milano Seal"
              className="w-8 h-8"
            />
            <div>
              <p className="text-white font-medium text-sm">The Milano Seal™</p>
              <p className="text-[#8A8A8A] text-xs">Matter Control Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#111111] border border-[#2A2A2A] rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-[#B0B0B0]">Secure Session</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Greeting */}
        <div>
          <p className="text-[var(--ms-gold)] text-xs tracking-[0.2em] uppercase font-semibold mb-1">
            Welcome
          </p>
          <h1 className="font-serif text-2xl text-white">
            {deal.client_name || "Your Matter"}
          </h1>
          <p className="text-[#8A8A8A] text-sm mt-1">
            {deal.document} · {deal.country}
          </p>
        </div>

        {/* Matter summary */}
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Execution Lane", value: deal.execution_tier || "—" },
              {
                label: "Investment",
                value: deal.amount
                  ? `$${Number(deal.amount).toLocaleString()}`
                  : "—",
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[#8A8A8A] text-[10px] uppercase tracking-[0.1em] mb-1">
                  {label}
                </p>
                <p className="text-white font-medium capitalize text-sm">
                  {value}
                </p>
              </div>
            ))}
            <div>
              <p className="text-[#8A8A8A] text-[10px] uppercase tracking-[0.1em] mb-1">
                Status
              </p>
              <StatusTransitionPill status={deal.status || "new"} size="sm" />
            </div>
            <div>
              <p className="text-[#8A8A8A] text-[10px] uppercase tracking-[0.1em] mb-1">
                Payment
              </p>
              <StatusTransitionPill status={deal.payment_status || "pending"} size="sm" />
            </div>
          </div>
        </div>

        {(retainerDue || balanceDue) && (
          <div className="bg-[#0A0A0A] border border-[var(--ms-gold)]/30 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-[var(--ms-gold)]" />
              <p className="text-[var(--ms-gold)] text-xs font-semibold tracking-[0.2em] uppercase">
                {retainerDue ? "Retainer Due" : "Balance Due"}
              </p>
            </div>
            <p className="text-[#B0B0B0] text-sm mb-4 leading-relaxed">
              {retainerDue
                ? "Pay your 50% retainer to release the matter into execution. Reference is matched automatically on receipt."
                : "Your matter has shipped. Settle the remaining balance to close out the engagement."}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 p-4 bg-[#111111] border border-[#1A1A1A] rounded-xl">
              <div>
                <p className="text-[#8A8A8A] text-[10px] uppercase tracking-[0.15em]">
                  Amount due
                </p>
                <p className="text-white text-xl font-medium">
                  $
                  {Number(
                    retainerDue
                      ? (deal.invoice_retainer ?? deal.amount)
                      : deal.invoice_balance,
                  ).toLocaleString()}{" "}
                  USD
                </p>
              </div>
              <a
                href={
                  (retainerDue
                    ? deal.payment_link
                    : deal.balance_payment_link) ?? "#"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-3 bg-[var(--ms-gold)] text-[#0A0A0A] font-semibold rounded-xl hover:bg-[#D4B76A] transition-all"
              >
                Pay with Wise
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <p className="text-[#8A8A8A] text-xs italic">
              Wise is the primary payment method. For alternative arrangements, contact us directly.
            </p>
          </div>
        )}

        {/* Payment confirmed seal */}
        {deal.payment_status === "paid" && (
          <div className="flex justify-center py-2">
            <TrustConfirmSeal event="payment_confirmed" size="md" />
          </div>
        )}

        {/* Progress tracker */}
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[var(--ms-gold)] text-xs font-semibold tracking-[0.2em] uppercase">
              Execution Progress
            </p>
            <span className="text-[#8A8A8A] text-xs">
              {pctComplete}% complete
            </span>
          </div>
          <div className="w-full bg-[#1A1A1A] rounded-full h-1 mb-6">
            <div
              className="bg-gradient-to-r from-[var(--ms-gold)] to-[#D4B76A] h-1 rounded-full transition-all duration-1000"
              style={{ width: `${pctComplete}%` }}
            />
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {STEPS.map((step, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              const pending = i > currentStep;
              return (
                <div
                  key={step.key}
                  className={`relative text-center p-2 rounded-lg border transition-all ${
                    active
                      ? "border-[var(--ms-gold)] bg-[var(--ms-gold)]/10"
                      : done
                        ? "border-[#2A2A2A] bg-[#0A0A0A]"
                        : "border-[#1A1A1A] bg-transparent opacity-40"
                  }`}
                >
                  {done ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-400 mx-auto mb-1" />
                  ) : active ? (
                    <div className="relative mx-auto w-3.5 h-3.5 mb-1">
                      <div className="absolute inset-0 rounded-full bg-[var(--ms-gold)] animate-ping opacity-60" />
                      <div className="relative w-3.5 h-3.5 rounded-full bg-[var(--ms-gold)]" />
                    </div>
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-[#2A2A2A] mx-auto mb-1" />
                  )}
                  <p
                    className={`text-[9px] leading-tight font-medium ${
                      active
                        ? "text-[var(--ms-gold)]"
                        : done
                          ? "text-[#8A8A8A]"
                          : "text-[#4A4A4A]"
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Documents */}
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6">
          <p className="text-[var(--ms-gold)] text-xs font-semibold tracking-[0.2em] uppercase mb-5">
            Controlled Records
          </p>
          {files.length === 0 ? (
            <p className="text-[#8A8A8A] text-sm italic text-center py-4">
              No documents uploaded yet.
            </p>
          ) : (
            <div className="space-y-2 mb-6">
              {files.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-3 bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl hover:border-[#2A2A2A] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileIcon type={f.file_type} />
                    <div>
                      <p className="text-white text-sm font-medium">
                        {f.filename}
                      </p>
                      <p className="text-[#8A8A8A] text-xs">
                        {f.file_size ? formatBytes(f.file_size) : ""} ·{" "}
                        {f.uploaded_by}
                      </p>
                    </div>
                  </div>
                  {f.signed_url && <a
                    href={f.signed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-xs text-[var(--ms-gold)] hover:border-[var(--ms-gold)]/40 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </a>}
                </div>
              ))}
            </div>
          )}

          {/* Upload zone */}
          <div className="border-t border-[#1A1A1A] pt-5">
            <p className="text-[#8A8A8A] text-xs mb-4">
              Upload documents for your matter (POA drafts, ID copies,
              supporting records):
            </p>
            <DropZone
              dealId={deal.id}
              onUploadComplete={(f) => setFiles((prev) => [f, ...prev])}
            />
          </div>
        </div>

        {/* Review prompt */}
        <SealImpressionReview
          token={token}
          matterId={deal.id}
          clientName={deal.client_name}
          executionLane={deal.execution_tier ?? null}
          destinationCountry={deal.country ?? null}
          documentType={deal.document ?? null}
          isUnlocked={shouldShowReviewPrompt(deal as unknown as Record<string, unknown>)}
        />

        {/* Footer */}
        <div className="text-center text-[#8A8A8A] text-xs space-y-1 pb-4">
          <p>Questions? Contact Nicholas Milano directly.</p>
          <p className="text-[var(--ms-gold)]">themilanoseal.com</p>
        </div>
      </div>
    </div>
  );
}
