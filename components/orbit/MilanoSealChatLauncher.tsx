"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, Send } from "lucide-react";
import { MilanoSealOrbitCore } from "./MilanoSealOrbitCore";

type MilanoSealChatLauncherProps = {
  variant?: "public" | "portal" | "dashboard";
};

export function MilanoSealChatLauncher({ variant = "public" }: MilanoSealChatLauncherProps) {
  const [open, setOpen] = useState(false);
  const reducedMotion = useReducedMotion();

  return (
    <div className={`milano-chat-launcher milano-chat-${variant}`}>
      <AnimatePresence>
        {open && (
          <motion.aside
            className="milano-chat-panel"
            initial={reducedMotion ? false : { opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-label="Milano Seal Concierge"
          >
            <header className="milano-chat-header">
              <div className="milano-chat-title">
                <MilanoSealOrbitCore
                  mode="launcher"
                  state="chat-open"
                  size="sm"
                  showRouteArcs={false}
                  showNodes={false}
                  showHalo={false}
                  label="Milano Seal Concierge"
                />
                <div>
                  <strong>Milano Seal Concierge</strong>
                  <span>Document execution assistant</span>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close Milano Seal Concierge"
                onClick={() => setOpen(false)}
                className="milano-chat-close"
              >
                <X size={18} />
              </button>
            </header>

            <div className="milano-chat-body">
              <div className="milano-chat-message inbound">
                Good evening. How may I help with your document matter today?
              </div>
              <div className="milano-chat-note">
                This assistant can help route intake, explain document status, and prepare questions for operator review.
              </div>
              {variant !== "public" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                  <Link
                    href="/intake"
                    onClick={() => setOpen(false)}
                    style={{
                      display: "block",
                      padding: "10px 14px",
                      background: "#C6A55A",
                      borderRadius: 6,
                      color: "#0A0A0A",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      textDecoration: "none",
                      textAlign: "center",
                    }}
                  >
                    Begin Secure Intake →
                  </Link>
                  <a
                    href="mailto:contact@themilanoseal.com"
                    style={{
                      display: "block",
                      padding: "9px 14px",
                      border: "1px solid rgba(198,165,90,0.3)",
                      borderRadius: 6,
                      color: "rgba(198,165,90,0.8)",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      textDecoration: "none",
                      textAlign: "center",
                    }}
                  >
                    Email Concierge
                  </a>
                </div>
              )}
            </div>

            <form
              className="milano-chat-input"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                aria-label="Ask Milano Seal"
                placeholder="Ask about intake, apostille, release, or routing..."
              />
              <button type="submit" aria-label="Send message">
                <Send size={17} />
              </button>
            </form>
          </motion.aside>
        )}
      </AnimatePresence>

      <button
        type="button"
        className="milano-chat-button"
        aria-label={open ? "Close Milano Seal Concierge" : "Open Milano Seal Concierge"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <X size={20} color="rgba(198,165,90,0.8)" />
        ) : (
          <MilanoSealOrbitCore
            mode="launcher"
            state="idle"
            size="sm"
            showRouteArcs={false}
            showNodes={false}
            label="Milano Seal Concierge launcher"
          />
        )}
      </button>
    </div>
  );
}
