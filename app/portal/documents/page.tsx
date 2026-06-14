"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { usePortal } from "@/components/portal/portal-context";

interface FileRow {
  document_id: string;
  matter_id: string;
  document_label: string;
  uploaded_at: string;
  verification_status: "released" | "processing" | "pending";
  signed_url: string | null;
  // optional vault intelligence fields
  released_by?: string | null;
  released_at?: string | null;
  version?: number | null;
}

const STATUS_LABEL: Record<string, string> = {
  released: "Released",
  processing: "Processing",
  pending: "Pending Review",
};

const STATUS_COLOR: Record<string, string> = {
  released: "#4a9e6b",
  processing: "#C6A55A",
  pending: "#5A5A5A",
};

// Compute a release status from deal state when the API doesn't supply one
type ReleaseStatus = "Released" | "Pending Release" | "Held";

function computeReleaseStatus(
  file: FileRow,
  matterStatus: string | null | undefined,
  isPaidAndReleased: boolean,
): ReleaseStatus {
  if (file.verification_status === "released") return "Released";
  if (isPaidAndReleased) return "Released";

  const COURIER_READY_AND_BEYOND = [
    "courier_ready",
    "shipped",
    "delivered",
    "completed",
    "closed",
  ];
  if (COURIER_READY_AND_BEYOND.includes(matterStatus ?? "")) return "Pending Release";
  return "Held";
}

const RELEASE_STATUS_COLOR: Record<ReleaseStatus, string> = {
  Released: "#4a9e6b",
  "Pending Release": "#C6A55A",
  Held: "#5A5A5A",
};

export default function ClientDocumentsPage() {
  const { deal, isLoading: dealLoading } = usePortal();
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload state
  const [dragActive, setDragActive] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLabel, setUploadLabel] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(async (dealId: string) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/portal/me/documents?deal_id=${dealId}`, {
        cache: "no-store",
      });
      if (r.ok) {
        const body = (await r.json()) as { files?: FileRow[] };
        setFiles(body.files ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!deal) return;
    void fetchDocuments(deal.id);
  }, [deal, fetchDocuments]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setUploadFile(f);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setUploadFile(f);
  };

  const handleUpload = async () => {
    if (!deal || !uploadFile || uploading) return;
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    const fd = new FormData();
    fd.append("file", uploadFile);
    fd.append("label", uploadLabel || uploadFile.name.replace(/\.[^.]+$/, ""));

    try {
      const r = await fetch(`/api/portal/me/upload?deal_id=${deal.id}`, {
        method: "POST",
        body: fd,
      });
      const body = (await r.json()) as { success?: boolean; error?: string };
      if (r.ok && body.success) {
        setUploadSuccess(true);
        setUploadFile(null);
        setUploadLabel("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        await fetchDocuments(deal.id);
      } else {
        setUploadError(body.error ?? "Upload failed. Please try again.");
      }
    } catch {
      setUploadError("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (dealLoading || loading) {
    return (
      <div style={{ paddingTop: 8 }}>
        {[80, 62, 72].map((w, i) => (
          <div
            key={i}
            style={{
              height: 48,
              borderRadius: 2,
              marginBottom: 10,
              background: "rgba(198,165,90,0.05)",
              border: "1px solid rgba(198,165,90,0.08)",
              animation: "cdSkeleton 2s ease-in-out infinite",
              animationDelay: `${i * 0.18}s`,
              width: `${w}%`,
            }}
          />
        ))}
      </div>
    );
  }

  if (!deal) {
    return (
      <div style={{ color: "rgba(255,255,255,.5)" }}>
        No matter linked to this account.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-8"
    >
      {/* Upload zone */}
      <div className="rounded-xl border border-[#2A2A2A] bg-[#0D0D0D] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1A1A1A] flex items-center justify-between">
          <div>
            <h2 className="text-white text-sm font-medium">Submit Supporting Records</h2>
            <p className="text-[#5A5A5A] text-xs mt-0.5">
              PDF, JPEG, PNG, or TIFF · Max 25 MB · Encrypted in transit and at rest
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[#4A4A4A]">
            <Lock className="w-3 h-3" />
            <span className="text-[10px] font-mono tracking-widest uppercase">Private Vault</span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? "border-[#C6A55A]/60 bg-[#C6A55A]/5"
                : uploadFile
                ? "border-[#C6A55A]/30 bg-[#C6A55A]/5"
                : "border-[#2A2A2A] hover:border-[#3A3A3A]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.tiff,.tif"
              className="hidden"
              onChange={handleFileChange}
            />
            {uploadFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-5 h-5 text-[#C6A55A]" />
                <div className="text-left">
                  <p className="text-white text-sm font-medium">{uploadFile.name}</p>
                  <p className="text-[#5A5A5A] text-xs">
                    {(uploadFile.size / 1024 / 1024).toFixed(2)} MB ·{" "}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setUploadFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="text-[#C6A55A]/60 hover:text-[#C6A55A] underline"
                    >
                      Remove
                    </button>
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 text-[#3A3A3A] mx-auto mb-3" />
                <p className="text-[#5A5A5A] text-sm">
                  Drag a file here or <span className="text-[#C6A55A]/80">click to browse</span>
                </p>
              </div>
            )}
          </div>

          {/* Label + submit */}
          <AnimatePresence>
            {uploadFile && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                <input
                  type="text"
                  value={uploadLabel}
                  onChange={(e) => setUploadLabel(e.target.value)}
                  placeholder="Document label (optional — e.g. Birth Certificate)"
                  maxLength={120}
                  className="w-full bg-[#111111] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#3A3A3A] focus:outline-none focus:border-[#C6A55A]/40 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => void handleUpload()}
                  disabled={uploading}
                  className="w-full py-2.5 rounded-lg bg-[#C6A55A] hover:bg-[#D4B46A] disabled:opacity-40 disabled:cursor-not-allowed text-black text-sm font-medium transition-all flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Submit to Secure Vault
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status messages */}
          <AnimatePresence>
            {uploadSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                onAnimationComplete={() => setTimeout(() => setUploadSuccess(false), 4000)}
                className="flex items-center gap-2 text-emerald-400/90 bg-emerald-400/5 border border-emerald-400/20 rounded-lg px-4 py-3"
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <p className="text-xs">Document received. Your operator has been notified and will review it within your matter timeline.</p>
              </motion.div>
            )}
            {uploadError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-red-400/80 bg-red-400/5 border border-red-400/20 rounded-lg px-4 py-3"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-xs">{uploadError}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Document list */}
      <div className="cd-card">
        <div className="cd-eyebrow">Controlled Records</div>
        <h1 className="cd-h1">Secure Record Exchange</h1>
        {files.length === 0 ? (
          <div className="cd-empty">
            No documents yet. Files you upload above or that we complete (notarized PDF, apostille certificate) will appear here once released by your operator.
          </div>
        ) : (
          files.map((f, fileIndex) => {
            const releaseStatus = computeReleaseStatus(
              f,
              deal.matter_status,
              deal.is_paid_and_released,
            );
            const releaseColor = RELEASE_STATUS_COLOR[releaseStatus];
            const releasedBy =
              f.released_by ?? (releaseStatus === "Released" ? "Milano Seal Team" : null);
            const releaseDate =
              f.released_at ?? (releaseStatus === "Released" ? f.uploaded_at : null);
            return (
              <motion.div
                key={f.document_id}
                className="cd-row"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.28, delay: fileIndex * 0.05, ease: "easeOut" }}
              >
                <div className="flex items-center gap-3" style={{ flex: 1, minWidth: 0 }}>
                  <FileText className="w-4 h-4 flex-shrink-0" style={{ color: releaseColor }} />
                  <div style={{ minWidth: 0 }}>
                    <div className="cd-name">{f.document_label}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 10px", marginTop: 2 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: "monospace",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase" as const,
                          color: releaseColor,
                          background: `${releaseColor}14`,
                          border: `1px solid ${releaseColor}30`,
                          borderRadius: 99,
                          padding: "1px 7px",
                          lineHeight: 1.6,
                        }}
                      >
                        {releaseStatus}
                      </span>
                      {releasedBy && (
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                          {releasedBy}
                        </span>
                      )}
                      {releaseDate && (
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", fontFamily: "monospace" }}>
                          {new Date(releaseDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="cd-meta cd-meta-hide">
                  {new Date(f.uploaded_at).toLocaleDateString()}
                </div>
                <div>
                  {f.signed_url ? (
                    <a
                      href={f.signed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cd-link"
                    >
                      View
                    </a>
                  ) : (
                    <span className="cd-link-na">—</span>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <p className="text-[#2A2A2A] text-[10px] text-center">
        All documents stored in a private encrypted vault. Access is scoped to your matter only.
        Files are never shared or publicly accessible.
      </p>
    </motion.div>
  );
}
