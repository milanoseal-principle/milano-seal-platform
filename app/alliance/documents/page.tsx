"use client";

import { useState, useEffect } from "react";
import { AllianceSharedDocuments } from "@/components/alliance/AllianceSharedDocuments";

export default function AllianceDocumentsPage() {
  const [documents, setDocuments] = useState<
    Array<{
      id: string;
      document_name: string;
      shared_at: string;
      document_type?: string;
      download_url?: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/alliance/documents")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((data) => setDocuments(data.documents ?? []))
      .catch(() => setError("Could not load documents. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  function handleDownload(id: string) {
    const doc = documents.find((d) => d.id === id);
    if (doc?.download_url) {
      window.open(doc.download_url, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "#080808", color: "rgba(255,255,255,0.85)" }}
    >
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <p
            className="text-[10px] font-mono uppercase tracking-[0.3em]"
            style={{ color: "rgba(198,165,90,0.55)" }}
          >
            Alliance Partner Portal
          </p>
          <h1
            className="text-3xl font-light"
            style={{
              fontFamily: "var(--font-playfair),Georgia,serif",
              color: "#C6A55A",
            }}
          >
            Shared Documents
          </h1>
        </div>

        {error && (
          <div
            className="rounded-sm px-4 py-3 text-sm"
            style={{
              background: "rgba(180,50,50,0.08)",
              border: "1px solid rgba(180,50,50,0.2)",
              color: "rgba(255,100,100,0.8)",
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center">
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              Loading documents…
            </p>
          </div>
        ) : (
          <AllianceSharedDocuments
            documents={documents}
            onDownload={handleDownload}
          />
        )}
      </div>
    </div>
  );
}
