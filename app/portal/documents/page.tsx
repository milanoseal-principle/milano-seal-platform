"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { usePortal } from "@/components/portal/portal-context";

interface FileRow {
  document_id: string;
  matter_id: string;
  document_label: string;
  uploaded_at: string;
  verification_status: "released" | "processing" | "pending";
  signed_url: string | null;
}


export default function ClientDocumentsPage() {
  const { deal, isLoading: dealLoading } = usePortal();
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deal) return;
    void (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/portal/me/documents?deal_id=${deal.id}`, {
          cache: "no-store",
        });
        if (r.ok) {
          const body = (await r.json()) as { files?: FileRow[] };
          setFiles(body.files ?? []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [deal]);

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
    >
      <div className="cd-eyebrow">Your Documents</div>
      <h1 className="cd-h1">Files &amp; Uploads</h1>

      <div className="cd-card">
        {files.length === 0 ? (
          <div className="cd-empty">
            No documents yet. Files you upload during intake or that we complete
            (notarized PDF, apostille certificate) will appear here.
          </div>
        ) : (
          files.map((f, fileIndex) => (
              <motion.div
                key={f.document_id}
                className="cd-row"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.28, delay: fileIndex * 0.05, ease: "easeOut" }}
              >
                <div>
                  <div className="cd-name">{f.document_label}</div>
                  <span className={`cd-tag ${f.verification_status}`}>
                    {f.verification_status === "released"
                      ? "Released"
                      : f.verification_status === "processing"
                      ? "Processing"
                      : "Pending Review"}
                  </span>
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
            ))
        )}
      </div>
    </motion.div>
  );
}
