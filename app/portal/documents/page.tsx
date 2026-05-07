"use client";

import { useEffect, useState } from "react";
import { usePortal } from "@/components/portal/portal-context";

interface FileRow {
  id: string;
  name?: string;
  filename?: string;
  url?: string;
  storage_path?: string;
  size?: number;
  mime?: string;
  category?: string;
  created_at: string;
}

function fmtSize(b?: number): string {
  if (b == null) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
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
          const body = (await r.json()) as { files: FileRow[] };
          setFiles(body.files ?? []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [deal]);

  if (dealLoading || loading) {
    return <div style={{ color: "rgba(255,255,255,.4)" }}>Loading documents…</div>;
  }
  if (!deal) {
    return (
      <div style={{ color: "rgba(255,255,255,.5)" }}>
        No matter linked to this account.
      </div>
    );
  }

  return (
    <div>
      <div className="cd-eyebrow">Your Documents</div>
      <h1 className="cd-h1">Files &amp; Uploads</h1>

      <div className="cd-card">
        {files.length === 0 ? (
          <div className="cd-empty">
            No documents yet. Files you upload during intake or that we complete
            (notarized PDF, apostille certificate) will appear here.
          </div>
        ) : (
          files.map((f) => {
            const name = f.name ?? f.filename ?? "Document";
            return (
              <div key={f.id} className="cd-row">
                <div>
                  <div className="cd-name">{name}</div>
                  {f.category && (
                    <span className="cd-tag">{f.category}</span>
                  )}
                </div>
                <div className="cd-meta cd-meta-hide">{fmtSize(f.size)}</div>
                <div className="cd-meta cd-meta-hide">
                  {new Date(f.created_at).toLocaleDateString()}
                </div>
                <div>
                  {f.url ? (
                    <a
                      href={f.url}
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
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
