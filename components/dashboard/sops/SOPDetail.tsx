"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, CheckSquare, Square, Edit2, Clock } from "lucide-react";
import { useApi } from "@/hooks/useApi";

const FADE_EASE = [0.16, 1, 0.3, 1] as const;

interface ChecklistItem {
  label: string;
  required?: boolean;
}

interface SOP {
  id: string;
  title: string;
  category: string;
  role_scope: string[];
  status: "draft" | "published" | "archived";
  version: number;
  owner_id: string;
  body_markdown: string | null;
  checklist_json: unknown;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

interface SOPVersion {
  id: string;
  sop_id: string;
  version: number;
  body_markdown: string | null;
  checklist_json: unknown;
  changed_by: string;
  change_note: string | null;
  created_at: string;
}

interface SOPResponse {
  sop?: SOP;
  error?: string;
  migration_needed?: boolean;
}

interface VersionsResponse {
  versions: SOPVersion[];
  migration_needed?: boolean;
}

function StatusBadge({
  status,
}: {
  status: "draft" | "published" | "archived";
}) {
  const cfg = {
    draft: {
      bg: "rgba(251,191,36,0.15)",
      color: "rgba(251,191,36,0.9)",
      label: "DRAFT",
    },
    published: {
      bg: "rgba(74,222,128,0.15)",
      color: "rgba(74,222,128,0.9)",
      label: "PUBLISHED",
    },
    archived: {
      bg: "rgba(148,163,184,0.12)",
      color: "rgba(148,163,184,0.6)",
      label: "ARCHIVED",
    },
  }[status];

  return (
    <span
      className="font-mono tracking-widest rounded-sm px-1.5 py-0.5"
      style={{ fontSize: 8, background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className="font-mono tracking-widest rounded-sm px-1.5 py-0.5"
      style={{
        fontSize: 9,
        background: "rgba(212,175,55,0.12)",
        color: "rgba(212,175,55,0.7)",
      }}
    >
      {category.toUpperCase()}
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function parseChecklist(raw: unknown): ChecklistItem[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.filter(
    (item): item is ChecklistItem =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as Record<string, unknown>).label === "string"
  );
}

export function SOPDetail({ sopId }: { sopId: string }) {
  const { data: sopData, isLoading: sopLoading } = useApi<SOPResponse>(
    `/api/dashboard/sops/${sopId}`
  );

  const { data: versionsData, isLoading: versionsLoading } =
    useApi<VersionsResponse>(`/api/dashboard/sops/${sopId}/versions`);

  if (sopLoading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <div
          className="h-8 w-48 rounded-sm animate-pulse"
          style={{ background: "rgba(212,175,55,0.06)" }}
        />
        <div
          className="h-48 rounded-sm animate-pulse"
          style={{ background: "rgba(212,175,55,0.04)" }}
        />
      </div>
    );
  }

  if (!sopData?.sop) {
    if (sopData?.migration_needed) {
      return (
        <div className="max-w-3xl mx-auto text-center py-12">
          <p
            className="font-mono text-[10px] tracking-widest"
            style={{ color: "rgba(251,191,36,0.6)" }}
          >
            SOP TABLE PENDING MIGRATION
          </p>
        </div>
      );
    }
    return (
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard/sops">
          <div
            className="flex items-center gap-2 text-xs font-mono tracking-widest mb-6 w-fit"
            style={{ color: "rgba(212,175,55,0.5)" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            BACK TO SOPs
          </div>
        </Link>
        <div
          className="rounded-sm px-4 py-12 text-center"
          style={{
            background: "rgba(8,5,1,0.97)",
            border: "1px solid rgba(212,175,55,0.1)",
          }}
        >
          <p
            className="font-mono text-[10px] tracking-widest"
            style={{ color: "rgba(212,175,55,0.4)" }}
          >
            SOP NOT FOUND
          </p>
        </div>
      </div>
    );
  }

  const sop = sopData.sop;
  const checklist = parseChecklist(sop.checklist_json);
  const versions = versionsData?.versions ?? [];

  return (
    <motion.div
      className="space-y-6 max-w-3xl mx-auto"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: FADE_EASE }}
    >
      {/* Back link */}
      <Link href="/dashboard/sops">
        <div
          className="flex items-center gap-2 text-xs font-mono tracking-widest w-fit"
          style={{ color: "rgba(212,175,55,0.5)" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          BACK TO SOPs
        </div>
      </Link>

      {/* Header card */}
      <div
        className="rounded-sm px-5 py-5"
        style={{
          background: "rgba(8,5,1,0.97)",
          border: "1px solid rgba(212,175,55,0.15)",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <CategoryBadge category={sop.category} />
              <StatusBadge status={sop.status} />
              <span
                className="font-mono text-[9px]"
                style={{ color: "rgba(212,175,55,0.35)" }}
              >
                v{sop.version}
              </span>
            </div>
            <h1
              className="text-xl font-light"
              style={{
                color: "rgba(255,255,255,0.85)",
                fontFamily: "var(--font-playfair),Georgia,serif",
              }}
            >
              {sop.title}
            </h1>
            {sop.status === "published" && sop.published_at && (
              <p
                className="mt-1.5 text-[10px] font-mono flex items-center gap-1.5"
                style={{ color: "rgba(74,222,128,0.55)" }}
              >
                <Clock className="w-2.5 h-2.5" />
                Published {formatDate(sop.published_at)}
              </p>
            )}
          </div>
          <Link href={`/dashboard/sops/${sop.id}/edit`}>
            <button
              className="flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[10px] font-mono tracking-widest flex-shrink-0 transition-colors"
              style={{
                background: "rgba(212,175,55,0.08)",
                border: "1px solid rgba(212,175,55,0.2)",
                color: "rgba(212,175,55,0.7)",
              }}
            >
              <Edit2 className="w-3 h-3" />
              EDIT
            </button>
          </Link>
        </div>

        {sop.role_scope.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {sop.role_scope.map((r) => (
              <span
                key={r}
                className="font-mono rounded-sm px-1.5 py-0.5"
                style={{
                  fontSize: 8,
                  background: "rgba(183,148,244,0.1)",
                  color: "rgba(183,148,244,0.7)",
                }}
              >
                {r.replace(/_/g, " ").toUpperCase()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Body markdown */}
      {sop.body_markdown && (
        <div
          className="rounded-sm px-5 py-4"
          style={{
            background: "rgba(8,5,1,0.97)",
            border: "1px solid rgba(212,175,55,0.1)",
          }}
        >
          <p
            className="text-[9px] font-mono tracking-widest mb-3"
            style={{ color: "rgba(212,175,55,0.35)" }}
          >
            PROCEDURE
          </p>
          <pre
            className="whitespace-pre-wrap text-sm leading-relaxed font-mono"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            {sop.body_markdown}
          </pre>
        </div>
      )}

      {/* Checklist */}
      {checklist && checklist.length > 0 && (
        <div
          className="rounded-sm px-5 py-4"
          style={{
            background: "rgba(8,5,1,0.97)",
            border: "1px solid rgba(212,175,55,0.1)",
          }}
        >
          <p
            className="text-[9px] font-mono tracking-widest mb-3"
            style={{ color: "rgba(212,175,55,0.35)" }}
          >
            CHECKLIST
          </p>
          <div className="space-y-2">
            {checklist.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                {item.required ? (
                  <CheckSquare
                    className="w-4 h-4 flex-shrink-0 mt-0.5"
                    style={{ color: "rgba(212,175,55,0.5)" }}
                  />
                ) : (
                  <Square
                    className="w-4 h-4 flex-shrink-0 mt-0.5"
                    style={{ color: "rgba(255,255,255,0.2)" }}
                  />
                )}
                <span
                  className="text-sm"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  {item.label}
                  {item.required && (
                    <span
                      className="ml-2 font-mono text-[8px] tracking-widest"
                      style={{ color: "rgba(252,129,74,0.7)" }}
                    >
                      REQUIRED
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Version history */}
      <div
        className="rounded-sm px-5 py-4"
        style={{
          background: "rgba(8,5,1,0.97)",
          border: "1px solid rgba(212,175,55,0.08)",
        }}
      >
        <p
          className="text-[9px] font-mono tracking-widest mb-3"
          style={{ color: "rgba(212,175,55,0.35)" }}
        >
          VERSION HISTORY
        </p>
        {versionsLoading ? (
          <div
            className="h-8 rounded-sm animate-pulse"
            style={{ background: "rgba(212,175,55,0.04)" }}
          />
        ) : versions.length === 0 ? (
          <p
            className="text-xs font-mono"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            No version history available.
          </p>
        ) : (
          <div className="space-y-1.5">
            {versions.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-3 py-1.5 rounded-sm px-2"
                style={{ background: "rgba(212,175,55,0.03)" }}
              >
                <span
                  className="font-mono text-[10px] w-8 flex-shrink-0"
                  style={{ color: "rgba(212,175,55,0.6)" }}
                >
                  v{v.version}
                </span>
                <span
                  className="text-xs flex-1 min-w-0 truncate"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {v.change_note ?? "—"}
                </span>
                <span
                  className="font-mono text-[9px] flex-shrink-0"
                  style={{ color: "rgba(255,255,255,0.2)" }}
                >
                  {new Date(v.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
