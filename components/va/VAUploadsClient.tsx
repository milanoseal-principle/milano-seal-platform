"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Clock, AlertCircle, ExternalLink } from "lucide-react";

interface PendingDoc {
  id: string;
  matter_id: string;
  document_label: string;
  source: string;
  uploaded_by: string | null;
  uploaded_at: string;
  verification_status: "pending" | "processing" | "released";
}

export function VAUploadsClient() {
  const [docs, setDocs] = useState<PendingDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch("/api/va/uploads", { cache: "no-store" });
        if (r.ok) {
          const body = (await r.json()) as { documents?: PendingDoc[] };
          setDocs(body.documents ?? []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div
      className="rounded-xl border p-6"
      style={{ background: "rgba(255,255,255,0.01)", borderColor: "rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" style={{ color: "rgba(212,175,55,0.4)" }} />
          <p className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
            Pending Verification · File contents not visible here
          </p>
        </div>
        <a
          href="/dashboard"
          className="flex items-center gap-1 text-xs"
          style={{ color: "rgba(212,175,55,0.6)" }}
        >
          <ExternalLink className="w-3 h-3" />
          Dashboard
        </a>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : !docs.length ? (
        <div className="text-center py-16">
          <FileText className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.1)" }} />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No pending uploads.</p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.15)" }}>
            Client-submitted documents awaiting verification will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className="flex items-center justify-between px-4 py-3 rounded-lg border"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(212,175,55,0.6)" }} />
                <div className="min-w-0">
                  <p className="text-sm truncate" style={{ color: "rgba(255,255,255,0.75)" }}>
                    {doc.document_label}
                  </p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                    {doc.source === "client_portal" ? "Client Upload" : doc.source} ·{" "}
                    {doc.uploaded_by ?? "unknown"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                <div className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                  <Clock className="w-3 h-3" />
                  {new Date(doc.uploaded_at).toLocaleDateString()}
                </div>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                  style={{
                    background: doc.verification_status === "pending"
                      ? "rgba(212,175,55,0.1)"
                      : "rgba(74,158,107,0.1)",
                    color: doc.verification_status === "pending"
                      ? "rgba(212,175,55,0.8)"
                      : "rgba(74,158,107,0.8)",
                    border: `1px solid ${doc.verification_status === "pending"
                      ? "rgba(212,175,55,0.2)"
                      : "rgba(74,158,107,0.2)"}`,
                  }}
                >
                  {doc.verification_status.toUpperCase()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-center mt-4" style={{ color: "rgba(255,255,255,0.1)" }}>
        Storage paths and file contents are not accessible in the VA workspace.
      </p>
    </div>
  );
}
