"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, PlusCircle, Clock } from "lucide-react";
import { useApi } from "@/hooks/useApi";

const FADE_EASE = [0.16, 1, 0.3, 1] as const;

const CATEGORIES = [
  "All",
  "Intake",
  "Payment",
  "Scheduling",
  "RON",
  "Apostille",
  "Translation",
  "Courier",
  "Client Communication",
  "VA Tasks",
  "Alliance Dispatch",
  "Release Authorization",
] as const;

type Category = (typeof CATEGORIES)[number];

interface SOP {
  id: string;
  title: string;
  category: string;
  role_scope: string[];
  status: "draft" | "published" | "archived";
  version: number;
  owner_id: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

interface SOPsResponse {
  sops: SOP[];
  migration_needed?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  Intake: "rgba(99,179,237,0.18)",
  Payment: "rgba(154,230,180,0.18)",
  Scheduling: "rgba(246,173,85,0.18)",
  RON: "rgba(183,148,244,0.18)",
  Apostille: "rgba(252,129,74,0.18)",
  Translation: "rgba(129,230,217,0.18)",
  Courier: "rgba(237,137,54,0.18)",
  "Client Communication": "rgba(104,211,145,0.18)",
  "VA Tasks": "rgba(198,160,246,0.18)",
  "Alliance Dispatch": "rgba(236,72,153,0.18)",
  "Release Authorization": "rgba(252,196,25,0.18)",
};

const CATEGORY_TEXT_COLORS: Record<string, string> = {
  Intake: "rgba(99,179,237,0.9)",
  Payment: "rgba(104,211,145,0.9)",
  Scheduling: "rgba(246,173,85,0.9)",
  RON: "rgba(183,148,244,0.9)",
  Apostille: "rgba(252,129,74,0.9)",
  Translation: "rgba(129,230,217,0.9)",
  Courier: "rgba(237,137,54,0.9)",
  "Client Communication": "rgba(104,211,145,0.9)",
  "VA Tasks": "rgba(198,160,246,0.9)",
  "Alliance Dispatch": "rgba(236,72,153,0.9)",
  "Release Authorization": "rgba(252,196,25,0.9)",
};

function StatusBadge({ status }: { status: "draft" | "published" | "archived" }) {
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
        background: CATEGORY_COLORS[category] ?? "rgba(212,175,55,0.12)",
        color: CATEGORY_TEXT_COLORS[category] ?? "rgba(212,175,55,0.7)",
      }}
    >
      {category.toUpperCase()}
    </span>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-14 rounded-sm animate-pulse"
          style={{ background: "rgba(212,175,55,0.04)", opacity: 1 - i * 0.2 }}
        />
      ))}
    </div>
  );
}

export function SOPLibrary() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  const { data, isLoading, isError } = useApi<SOPsResponse>(
    "/api/dashboard/sops"
  );

  const sops = data?.sops ?? [];
  const migrationNeeded = data?.migration_needed ?? false;

  const filtered =
    activeCategory === "All"
      ? sops
      : sops.filter((s) => s.category === activeCategory);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className="text-[9px] font-mono tracking-[0.3em] mb-1"
            style={{ color: "rgba(212,175,55,0.4)" }}
          >
            INTERNAL · RESTRICTED
          </p>
          <h1
            className="text-xl font-light"
            style={{
              color: "rgba(255,255,255,0.75)",
              fontFamily: "var(--font-playfair),Georgia,serif",
            }}
          >
            SOP Library
          </h1>
        </div>
        <Link href="/dashboard/sops/new">
          <button
            className="flex items-center gap-2 rounded-sm px-3 py-2 text-xs font-mono tracking-widest transition-colors"
            style={{
              background: "rgba(212,175,55,0.1)",
              border: "1px solid rgba(212,175,55,0.25)",
              color: "rgba(212,175,55,0.85)",
            }}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            NEW SOP
          </button>
        </Link>
      </div>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="rounded-sm px-2.5 py-1 font-mono text-[9px] tracking-widest transition-colors"
              style={{
                background: isActive
                  ? "rgba(212,175,55,0.15)"
                  : "rgba(212,175,55,0.04)",
                border: isActive
                  ? "1px solid rgba(212,175,55,0.35)"
                  : "1px solid rgba(212,175,55,0.1)",
                color: isActive
                  ? "rgba(212,175,55,0.9)"
                  : "rgba(212,175,55,0.4)",
              }}
            >
              {cat.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <div
          className="rounded-sm px-4 py-8 text-center"
          style={{
            background: "rgba(8,5,1,0.97)",
            border: "1px solid rgba(212,175,55,0.12)",
          }}
        >
          <p
            className="font-mono text-[10px] tracking-widest"
            style={{ color: "rgba(212,175,55,0.4)" }}
          >
            FAILED TO LOAD SOP LIBRARY
          </p>
        </div>
      ) : migrationNeeded ? (
        <div
          className="rounded-sm px-4 py-10 text-center"
          style={{
            background: "rgba(8,5,1,0.97)",
            border: "1px solid rgba(212,175,55,0.12)",
          }}
        >
          <p
            className="font-mono text-[10px] tracking-widest"
            style={{ color: "rgba(251,191,36,0.6)" }}
          >
            SOP TABLE PENDING MIGRATION
          </p>
          <p
            className="mt-2 text-xs"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            Run migration 004_sops.sql to enable the SOP library.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: FADE_EASE }}
          className="rounded-sm px-4 py-12 text-center flex flex-col items-center gap-4"
          style={{
            background: "rgba(8,5,1,0.97)",
            border: "1px solid rgba(212,175,55,0.1)",
          }}
        >
          <BookOpen
            className="w-8 h-8"
            style={{ color: "rgba(212,175,55,0.2)" }}
          />
          <div>
            <p
              className="font-mono text-[10px] tracking-widest"
              style={{ color: "rgba(212,175,55,0.45)" }}
            >
              NO SOPs DEFINED
            </p>
            <p
              className="mt-1.5 text-xs"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              {activeCategory === "All"
                ? "No SOPs have been created yet."
                : `No SOPs in the ${activeCategory} category.`}
            </p>
          </div>
          {activeCategory === "All" && (
            <Link href="/dashboard/sops/new">
              <span
                className="text-xs font-mono tracking-widest underline underline-offset-2"
                style={{ color: "rgba(212,175,55,0.6)" }}
              >
                Create your first SOP
              </span>
            </Link>
          )}
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div
            className="rounded-sm overflow-hidden"
            style={{ border: "1px solid rgba(212,175,55,0.12)" }}
          >
            {filtered.map((sop, idx) => (
              <motion.div
                key={sop.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25, delay: idx * 0.04, ease: FADE_EASE }}
              >
                <Link href={`/dashboard/sops/${sop.id}`}>
                  <div
                    className="flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors"
                    style={{
                      background:
                        idx % 2 === 0
                          ? "rgba(8,5,1,0.97)"
                          : "rgba(212,175,55,0.02)",
                      borderBottom:
                        idx < filtered.length - 1
                          ? "1px solid rgba(212,175,55,0.07)"
                          : "none",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background =
                        "rgba(212,175,55,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background =
                        idx % 2 === 0
                          ? "rgba(8,5,1,0.97)"
                          : "rgba(212,175,55,0.02)";
                    }}
                  >
                    {/* Title */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: "rgba(255,255,255,0.8)" }}
                      >
                        {sop.title}
                      </p>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <CategoryBadge category={sop.category} />
                      <StatusBadge status={sop.status} />
                      <span
                        className="font-mono text-[9px] hidden sm:inline"
                        style={{ color: "rgba(212,175,55,0.35)" }}
                      >
                        v{sop.version}
                      </span>
                      <span
                        className="font-mono text-[9px] hidden md:flex items-center gap-1"
                        style={{ color: "rgba(255,255,255,0.25)" }}
                      >
                        <Clock className="w-2.5 h-2.5" />
                        {relativeTime(sop.updated_at)}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
