"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import { useApi } from "@/hooks/useApi";

const FADE_EASE = [0.16, 1, 0.3, 1] as const;

interface SOP {
  id: string;
  title: string;
  category: string;
  role_scope: string[];
  status: string;
  version: number;
  body_markdown: string | null;
  checklist_json: unknown;
  published_at: string | null;
}

interface SOPsResponse {
  sops: SOP[];
  migration_needed?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  Intake: "rgba(99,179,237,0.7)",
  Payment: "rgba(104,211,145,0.7)",
  Scheduling: "rgba(246,173,85,0.7)",
  RON: "rgba(183,148,244,0.7)",
  Apostille: "rgba(252,129,74,0.7)",
  Translation: "rgba(129,230,217,0.7)",
  Courier: "rgba(237,137,54,0.7)",
  "Client Communication": "rgba(104,211,145,0.7)",
  "VA Tasks": "rgba(198,160,246,0.7)",
  "Alliance Dispatch": "rgba(236,72,153,0.7)",
  "Release Authorization": "rgba(252,196,25,0.7)",
};

function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className="font-mono tracking-widest rounded-sm px-1.5 py-0.5 flex-shrink-0"
      style={{
        fontSize: 8,
        background: "rgba(212,175,55,0.08)",
        color: CATEGORY_COLORS[category] ?? "rgba(212,175,55,0.6)",
      }}
    >
      {category.toUpperCase()}
    </span>
  );
}

function SOPRow({ sop }: { sop: SOP }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
        style={{
          background: expanded ? "rgba(212,175,55,0.06)" : "transparent",
          borderBottom: "1px solid rgba(212,175,55,0.06)",
        }}
      >
        <div className="flex-shrink-0 w-3.5">
          {expanded ? (
            <ChevronDown
              className="w-3 h-3"
              style={{ color: "rgba(212,175,55,0.5)" }}
            />
          ) : (
            <ChevronRight
              className="w-3 h-3"
              style={{ color: "rgba(212,175,55,0.3)" }}
            />
          )}
        </div>
        <span
          className="flex-1 text-sm truncate"
          style={{ color: "rgba(255,255,255,0.75)" }}
        >
          {sop.title}
        </span>
        <CategoryBadge category={sop.category} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: FADE_EASE }}
            style={{ overflow: "hidden" }}
          >
            <div
              className="px-4 py-3 mx-3 my-2 rounded-sm"
              style={{
                background: "rgba(212,175,55,0.03)",
                border: "1px solid rgba(212,175,55,0.08)",
              }}
            >
              {sop.body_markdown ? (
                <pre
                  className="whitespace-pre-wrap text-xs leading-relaxed font-mono"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  {sop.body_markdown}
                </pre>
              ) : (
                <p
                  className="text-xs font-mono"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                >
                  No procedure body defined for this SOP.
                </p>
              )}
              <p
                className="mt-3 font-mono text-[9px] tracking-widest"
                style={{ color: "rgba(212,175,55,0.3)" }}
              >
                v{sop.version}
                {sop.published_at
                  ? ` · PUBLISHED ${new Date(sop.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                  : ""}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function VASOPReference() {
  const { data, isLoading } = useApi<SOPsResponse>("/api/va/sops");

  const sops = data?.sops ?? [];
  const migrationNeeded = data?.migration_needed ?? false;

  return (
    <div
      className="rounded-sm overflow-hidden"
      style={{
        background: "rgba(8,5,1,0.97)",
        border: "1px solid rgba(212,175,55,0.12)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-4 py-3"
        style={{ borderBottom: "1px solid rgba(212,175,55,0.1)" }}
      >
        <BookOpen
          className="w-3.5 h-3.5 flex-shrink-0"
          style={{ color: "rgba(212,175,55,0.5)" }}
        />
        <p
          className="font-mono text-[9px] tracking-[0.25em]"
          style={{ color: "rgba(212,175,55,0.5)" }}
        >
          SOP REFERENCE
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="px-4 py-4 space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-9 rounded-sm animate-pulse"
              style={{
                background: "rgba(212,175,55,0.04)",
                opacity: 1 - i * 0.25,
              }}
            />
          ))}
        </div>
      ) : migrationNeeded ? (
        <div className="px-4 py-6 text-center">
          <p
            className="font-mono text-[9px] tracking-widest"
            style={{ color: "rgba(251,191,36,0.5)" }}
          >
            SOP LIBRARY PENDING CONFIGURATION
          </p>
        </div>
      ) : sops.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, ease: FADE_EASE }}
          className="px-4 py-8 text-center"
        >
          <p
            className="font-mono text-[9px] tracking-widest"
            style={{ color: "rgba(212,175,55,0.35)" }}
          >
            NO SOPs ASSIGNED TO YOUR ROLE
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: FADE_EASE }}
        >
          {sops.map((sop) => (
            <SOPRow key={sop.id} sop={sop} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
