"use client";

import { motion } from "framer-motion";
import { Lock, Shield, CheckCircle2 } from "lucide-react";

export interface VaultDocument {
  id: string;
  title: string;
  fileSize: string;
  clearanceRequired: string;
  releaseState: "locked" | "authorized";
}

const KINEMATIC_EASE = [0.1, 0.9, 0.2, 1] as const;

export function SecureDocumentVault({
  documents,
}: {
  documents: VaultDocument[];
}) {
  return (
    <div
      className="rounded-sm"
      style={{ background: "#020101", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      {/* Header */}
      <div
        className="px-6 pt-5 pb-4 border-b"
        style={{ borderColor: "rgba(255,255,255,0.04)" }}
      >
        <span
          className="text-[9px] font-mono tracking-[0.3em] block mb-0.5"
          style={{ color: "rgba(212,175,55,0.45)" }}
        >
          ZERO-KNOWLEDGE CUSTODY CHANNEL
        </span>
        <h3
          className="text-sm font-light"
          style={{
            color: "rgba(255,255,255,0.65)",
            fontFamily: "var(--font-playfair),Georgia,serif",
          }}
        >
          Secure Document Exchange
        </h3>
      </div>

      <div className="p-4 space-y-2">
        {documents.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-3">
            <div
              className="w-10 h-10 rounded-sm flex items-center justify-center"
              style={{
                background: "rgba(212,175,55,0.04)",
                border: "1px solid rgba(212,175,55,0.1)",
              }}
            >
              <Shield className="w-5 h-5" style={{ color: "rgba(212,175,55,0.25)" }} />
            </div>
            <div className="text-center">
              <div
                className="text-[10px] font-mono tracking-[0.22em] mb-1"
                style={{ color: "rgba(255,255,255,0.18)" }}
              >
                VAULT NOT YET ACTIVE
              </div>
              <div
                className="text-[9px] leading-relaxed max-w-[260px]"
                style={{ color: "rgba(255,255,255,0.1)" }}
              >
                Secure document exchange activates once operator assignments
                are matched and custody channels are provisioned.
              </div>
            </div>
          </div>
        ) : (
          documents.map((doc, i) => (
            <div
              key={doc.id}
              className="relative rounded-sm overflow-hidden flex items-center justify-between p-4"
              style={{
                background: "rgba(12,8,2,0.75)",
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              {/* Completion Confirmation Shimmer — runs once on authorize */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={
                  doc.releaseState === "authorized" ? { x: "100%" } : { x: "-100%" }
                }
                transition={{ ease: KINEMATIC_EASE, duration: 0.8, delay: i * 0.1 }}
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(90deg,transparent,rgba(212,175,55,0.04),transparent)",
                }}
              />

              <div className="space-y-0.5">
                <div className="text-xs tracking-wide" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {doc.title}
                </div>
                <div className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {doc.fileSize} —{" "}
                  <span style={{ color: "rgba(255,255,255,0.35)" }}>
                    {doc.clearanceRequired}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {doc.releaseState === "locked" ? (
                  <Lock className="w-3 h-3" style={{ color: "rgba(255,255,255,0.18)" }} />
                ) : (
                  <CheckCircle2 className="w-3 h-3" style={{ color: "#34d399" }} />
                )}
                <span
                  className="text-[8px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-sm"
                  style={
                    doc.releaseState === "authorized"
                      ? {
                          background: "rgba(52,211,153,0.07)",
                          border: "1px solid rgba(52,211,153,0.22)",
                          color: "#34d399",
                        }
                      : {
                          background: "rgba(107,114,128,0.05)",
                          border: "1px solid rgba(107,114,128,0.14)",
                          color: "#6b7280",
                        }
                  }
                >
                  {doc.releaseState}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
