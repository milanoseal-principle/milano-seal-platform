"use client";
import { useState } from 'react';

import { motion, AnimatePresence } from "framer-motion";
import { getAllCountries, getWorkflowsForCountry } from "@/data/intelligence";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { Globe2, ChevronRight, X } from "lucide-react";
import type { DestinationIntelligenceResponse } from "@/lib/types/dashboard";

const EASE = [0.16, 1, 0.3, 1] as const;

const countries = getAllCountries().slice(0, 12);

interface CountryCardProps {
  countryId: string;
  name: string;
  corridorType: "hague" | "consular";
  activeMatters?: number;
  workflowCount: number;
  onClick: () => void;
  selected: boolean;
}

function CountryCard({
  countryId,
  name,
  corridorType,
  activeMatters,
  workflowCount,
  onClick,
  selected,
}: CountryCardProps) {
  const routeLabel =
    corridorType === "hague" ? "HAGUE" : "CONSULAR";

  return (
    <motion.div
      whileHover={{ y: -1 }}
      onClick={onClick}
      style={{
        background: selected
          ? "rgba(198,165,90,0.06)"
          : "rgba(198,165,90,0.02)",
        border: `1px solid ${selected ? "rgba(198,165,90,0.35)" : "rgba(198,165,90,0.08)"}`,
        borderRadius: "2px",
        padding: "0.875rem",
        cursor: "pointer",
        transition: "border-color 0.15s",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div
            className="text-xs font-medium truncate"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            {name}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-[8px] font-mono uppercase tracking-wider px-1 py-px rounded-sm"
              style={{
                color:
                  corridorType === "hague"
                    ? "rgba(198,165,90,0.8)"
                    : "rgba(167,139,250,0.8)",
                background:
                  corridorType === "hague"
                    ? "rgba(198,165,90,0.08)"
                    : "rgba(167,139,250,0.08)",
                border: `1px solid ${corridorType === "hague" ? "rgba(198,165,90,0.15)" : "rgba(167,139,250,0.15)"}`,
              }}
            >
              {routeLabel}
            </span>
            <span
              className="text-[8px] font-mono"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              {workflowCount} workflow{workflowCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0">
          {activeMatters !== undefined && activeMatters > 0 && (
            <motion.div
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-lg font-light leading-none"
              style={{
                fontFamily: "var(--font-playfair), Georgia, serif",
                color: "rgba(198,165,90,0.8)",
              }}
            >
              {activeMatters}
            </motion.div>
          )}
          <Link
            href={`/apostille-intel/${countryId}`}
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className="text-[8px] font-mono uppercase tracking-wider"
              style={{ color: "rgba(198,165,90,0.4)" }}
            >
              Intel →
            </span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export function GDIWidget() {
  const [selected, setSelected] = useState<string | null>(null);

  const { data: destData } = useApi<DestinationIntelligenceResponse>(
    "/api/dashboard/destination-intelligence"
  );

  function getActiveMatters(countryName: string): number | undefined {
    if (!destData?.destinations) return undefined;
    const d = destData.destinations.find(
      (x) =>
        x.country.toLowerCase() === countryName.toLowerCase()
    );
    return d?.activeMatters;
  }

  const selectedCountry = selected
    ? countries.find((c) => c.id === selected)
    : null;

  const selectedWorkflows = selected
    ? getWorkflowsForCountry(selected)
    : [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Globe2 className="w-4 h-4" style={{ color: "rgba(198,165,90,0.6)" }} />
        <p
          className="text-[9px] font-mono uppercase tracking-[0.28em]"
          style={{ color: "rgba(198,165,90,0.5)" }}
        >
          Global Document Intelligence
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {countries.map((c, idx) => {
          const workflows = getWorkflowsForCountry(c.id);
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE, delay: idx * 0.04 }}
            >
              <CountryCard
                countryId={c.id}
                name={c.name}
                corridorType={c.corridorType}
                workflowCount={workflows.length}
                activeMatters={getActiveMatters(c.name)}
                onClick={() =>
                  setSelected(selected === c.id ? null : c.id)
                }
                selected={selected === c.id}
              />
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedCountry && (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="mt-4"
            style={{
              background: "rgba(198,165,90,0.03)",
              border: "1px solid rgba(198,165,90,0.12)",
              borderRadius: "2px",
              padding: "1rem",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <span
                  className="text-sm font-medium"
                  style={{ color: "rgba(255,255,255,0.85)" }}
                >
                  {selectedCountry.name}
                </span>
                <span
                  className="text-[9px] font-mono ml-2"
                  style={{ color: "rgba(198,165,90,0.5)" }}
                >
                  {selectedWorkflows.length} workflow{selectedWorkflows.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Link href={`/apostille-intel/${selectedCountry.id}`}>
                  <span
                    className="text-[9px] font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    style={{ color: "rgba(198,165,90,0.6)" }}
                  >
                    Full Intel <ChevronRight className="w-3 h-3" />
                  </span>
                </Link>
                <button onClick={() => setSelected(null)}>
                  <X className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />
                </button>
              </div>
            </div>

            {selectedWorkflows.length === 0 ? (
              <p
                className="text-xs"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                No workflows indexed for this corridor.
              </p>
            ) : (
              <div className="space-y-1.5">
                {selectedWorkflows.map((wf) => (
                  <div
                    key={wf.id}
                    className="flex items-center justify-between gap-3 text-xs"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      paddingBottom: "0.375rem",
                    }}
                  >
                    <span style={{ color: "rgba(255,255,255,0.6)" }}>
                      {wf.documentId.replace(/-/g, " ")}
                    </span>
                    <span
                      className="text-[9px] font-mono shrink-0"
                      style={{ color: "rgba(198,165,90,0.45)" }}
                    >
                      {wf.estimatedTimeline}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
