"use client";

import { Download, FileText } from "lucide-react";

type SharedDocument = {
  id: string;
  document_name: string;
  shared_at: string;
  document_type?: string;
  download_url?: string;
};

type Props = {
  documents: SharedDocument[];
  onDownload?: (id: string) => void;
};

export function AllianceSharedDocuments({ documents, onDownload }: Props) {
  return (
    <div
      className="rounded-sm"
      style={{
        background: "rgba(8,5,1,0.96)",
        border: "1px solid rgba(198,165,90,0.1)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 border-b"
        style={{ borderColor: "rgba(198,165,90,0.08)" }}
      >
        <h2
          className="text-sm font-light"
          style={{
            fontFamily: "var(--font-playfair),Georgia,serif",
            color: "rgba(246,241,230,0.85)",
          }}
        >
          Shared Documents
        </h2>
        <p
          className="text-[10px] mt-0.5"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          Documents explicitly authorized for your review.
        </p>
      </div>

      {/* Empty state */}
      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <FileText size={28} style={{ color: "rgba(198,165,90,0.15)" }} />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
            No documents have been shared with you yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(198,165,90,0.08)" }}>
                {["Document Name", "Type", "Shared Date", "Download"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-[9px] font-mono uppercase tracking-[0.15em]"
                    style={{ color: "rgba(198,165,90,0.4)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr
                  key={doc.id}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={12} style={{ color: "rgba(198,165,90,0.4)", flexShrink: 0 }} />
                      <span style={{ color: "rgba(246,241,230,0.75)" }}>
                        {doc.document_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="text-[9px] font-mono uppercase tracking-[0.1em] px-2 py-0.5 rounded-sm"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        color: "rgba(255,255,255,0.35)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      {doc.document_type ?? "—"}
                    </span>
                  </td>
                  <td
                    className="px-5 py-3 font-mono text-[10px]"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    {new Date(doc.shared_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3">
                    {doc.download_url ? (
                      <button
                        onClick={() => onDownload?.(doc.id)}
                        className="flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-sm transition-opacity hover:opacity-80"
                        style={{
                          background: "rgba(198,165,90,0.08)",
                          color: "#C6A55A",
                          border: "1px solid rgba(198,165,90,0.2)",
                        }}
                      >
                        <Download size={10} />
                        Download
                      </button>
                    ) : (
                      <span
                        className="text-[10px] font-mono"
                        style={{ color: "rgba(255,255,255,0.2)" }}
                      >
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer note */}
      <div
        className="px-5 py-3 border-t"
        style={{ borderColor: "rgba(255,255,255,0.04)" }}
      >
        <p
          className="text-[9px] font-mono"
          style={{ color: "rgba(255,255,255,0.15)" }}
        >
          Only documents explicitly shared by Milano Seal are visible here. Internal files are not accessible through this portal.
        </p>
      </div>
    </div>
  );
}
