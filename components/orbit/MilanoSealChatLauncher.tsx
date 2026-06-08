"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ArrowRight, Zap, FileText, Globe, Phone } from "lucide-react";

const MESSAGES = [
  {
    id: 1,
    role: "assistant" as const,
    text: "Secure workspace initialized. I coordinate international document execution — notarization, apostille, and cross-border release. How can I direct your matter?",
    delay: 0,
  },
];

const QUICK_ACTIONS = [
  { icon: FileText, label: "Start Intake",       href: "/intake" },
  { icon: Globe,    label: "Country Routes",     href: "/map" },
  { icon: Zap,      label: "Services",           href: "/#services" },
  { icon: Phone,    label: "Contact Founder",    href: "/founder" },
];

export function MilanoSealChatLauncher() {
  const [open, setOpen]         = useState(false);
  const [shown, setShown]       = useState(false);
  const [orbBorn, setOrbBorn]   = useState(false);
  const scrollRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setOrbBorn(true), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setShown(true), 40);
      return () => clearTimeout(t);
    } else {
      setShown(false);
    }
  }, [open]);

  return (
    <>
      <style>{`
        @keyframes ms-orb-breathe {
          0%, 100% { box-shadow: 0 0 0 0 rgba(198,165,90,0), 0 4px 32px rgba(198,165,90,0.28), 0 0 0 1.5px rgba(198,165,90,0.55); }
          50%       { box-shadow: 0 0 0 8px rgba(198,165,90,0.08), 0 4px 48px rgba(198,165,90,0.48), 0 0 0 1.5px rgba(198,165,90,0.8); }
        }
        @keyframes ms-orb-ring {
          0%   { transform: scale(1);   opacity: 0.55; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes ms-orb-ring2 {
          0%   { transform: scale(1);   opacity: 0.3; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes ms-orb-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ms-orb-born {
          0%   { opacity: 0; transform: scale(0.7) translateY(12px); }
          60%  { opacity: 1; transform: scale(1.06) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes ms-panel-in {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ms-msg-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ms-cursor-blink {
          0%, 100% { opacity: 1; } 50% { opacity: 0; }
        }
        @keyframes ms-status-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(52,211,153,0.7); }
          50%       { opacity: 0.7; box-shadow: 0 0 12px rgba(52,211,153,0.4); }
        }
        @keyframes ms-grain {
          0%,100% { transform: translate(0,0); }
          10% { transform: translate(-1px,1px); }
          20% { transform: translate(1px,-1px); }
          30% { transform: translate(-1px,0); }
          40% { transform: translate(1px,1px); }
          50% { transform: translate(0,-1px); }
          60% { transform: translate(-1px,1px); }
          70% { transform: translate(1px,0); }
          80% { transform: translate(-1px,-1px); }
          90% { transform: translate(0,1px); }
        }
        .ms-launcher-orb {
          animation: ms-orb-born 0.9s cubic-bezier(0.16,1,0.3,1) both, ms-orb-breathe 3.6s ease-in-out 1.2s infinite;
        }
        .ms-launcher-orb:hover {
          animation: ms-orb-breathe 1.5s ease-in-out infinite !important;
        }
        .ms-orb-img-wrap {
          animation: ms-orb-spin 220s linear infinite;
        }
        .ms-panel-in { animation: ms-panel-in 0.28s cubic-bezier(0.16,1,0.3,1) both; }
        .ms-msg-in   { animation: ms-msg-in 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        .ms-cursor   { animation: ms-cursor-blink 1.1s ease-in-out infinite; }
        .ms-status-dot { animation: ms-status-pulse 2.5s ease-in-out infinite; }
      `}</style>

      {/* ── Orb trigger ── */}
      {orbBorn && (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999 }}>
          {/* Expanding rings */}
          {!open && (
            <>
              <span style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                border: "1px solid rgba(198,165,90,0.4)",
                animation: "ms-orb-ring 2.8s ease-out 0.4s infinite",
                pointerEvents: "none",
              }} />
              <span style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                border: "1px solid rgba(198,165,90,0.2)",
                animation: "ms-orb-ring2 2.8s ease-out 1.2s infinite",
                pointerEvents: "none",
              }} />
            </>
          )}

          <button
            onClick={() => setOpen(o => !o)}
            aria-label="Open Milano Seal concierge"
            className="ms-launcher-orb"
            style={{
              width: 60, height: 60,
              borderRadius: "50%",
              background: "#050507",
              border: "1.5px solid rgba(198,165,90,0.65)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              padding: 0,
              position: "relative",
              overflow: "hidden",
              transition: "border-color 0.3s",
            }}
          >
            {open ? (
              <X style={{ color: "#C6A55A", width: 20, height: 20 }} />
            ) : (
              <div className="ms-orb-img-wrap" style={{ width: 44, height: 44, position: "relative" }}>
                <Image
                  src="/milano-seal-orb-v2.png"
                  alt="The Milano Seal"
                  fill
                  style={{ objectFit: "contain" }}
                />
              </div>
            )}
          </button>
        </div>
      )}

      {/* ── Panel ── */}
      {open && (
        <div
          className={shown ? "ms-panel-in" : ""}
          style={{
            position: "fixed",
            bottom: 100,
            right: 28,
            width: 340,
            maxHeight: "calc(100vh - 140px)",
            background: "rgba(5,5,7,0.96)",
            backdropFilter: "blur(40px) saturate(1.4)",
            WebkitBackdropFilter: "blur(40px) saturate(1.4)",
            border: "1px solid rgba(198,165,90,0.18)",
            borderRadius: 16,
            zIndex: 9998,
            boxShadow: "0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(198,165,90,0.06), inset 0 1px 0 rgba(198,165,90,0.10)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Subtle grain overlay */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", borderRadius: 16,
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
            opacity: 0.6,
          }} />

          {/* Gold top line */}
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(198,165,90,0.6) 40%, rgba(198,165,90,0.6) 60%, transparent)", flexShrink: 0 }} />

          {/* Header */}
          <div style={{
            padding: "14px 16px 12px",
            borderBottom: "1px solid rgba(198,165,90,0.10)",
            display: "flex", alignItems: "center", gap: 10,
            flexShrink: 0, position: "relative", zIndex: 1,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "#050507",
              border: "1px solid rgba(198,165,90,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, overflow: "hidden",
            }}>
              <div style={{ width: 28, height: 28, position: "relative" }}>
                <Image src="/milano-seal-orb-v2.png" alt="" fill style={{ objectFit: "contain" }} />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#D4AF5A", letterSpacing: "0.06em", lineHeight: 1.2 }}>
                Milano Seal™ Concierge
              </div>
              <div style={{ fontSize: 8.5, color: "rgba(198,165,90,0.45)", letterSpacing: "0.22em", textTransform: "uppercase", marginTop: 2 }}>
                Secure Execution Desk
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div
                className="ms-status-dot"
                style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399", flexShrink: 0 }}
              />
              <span style={{ fontSize: 8, color: "rgba(52,211,153,0.7)", letterSpacing: "0.18em", textTransform: "uppercase" }}>Live</span>
            </div>
          </div>

          {/* Message area */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px 16px 8px",
              position: "relative", zIndex: 1,
              scrollbarWidth: "none",
            }}
          >
            {/* Assistant message bubble */}
            {MESSAGES.map(msg => (
              <div key={msg.id} className="ms-msg-in" style={{ display: "flex", gap: 8, marginBottom: 12, animationDelay: `${msg.delay}ms` }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: "#050507", border: "1px solid rgba(198,165,90,0.3)",
                  flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  marginTop: 2, overflow: "hidden",
                }}>
                  <div style={{ width: 18, height: 18, position: "relative" }}>
                    <Image src="/milano-seal-orb-v2.png" alt="" fill style={{ objectFit: "contain" }} />
                  </div>
                </div>
                <div style={{
                  background: "rgba(198,165,90,0.06)",
                  border: "1px solid rgba(198,165,90,0.12)",
                  borderRadius: "4px 12px 12px 12px",
                  padding: "10px 13px",
                  flex: 1,
                }}>
                  <p style={{ fontSize: 12, color: "rgba(220,210,190,0.92)", lineHeight: 1.65, margin: 0 }}>
                    {msg.text}
                  </p>
                </div>
              </div>
            ))}

            {/* Quick action chips */}
            <div style={{ paddingLeft: 32, display: "flex", flexDirection: "column", gap: 6, marginBottom: 4 }}>
              {QUICK_ACTIONS.map(({ icon: Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setOpen(false)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 12px",
                    background: "rgba(198,165,90,0.04)",
                    border: "1px solid rgba(198,165,90,0.15)",
                    borderRadius: 8,
                    color: "rgba(198,165,90,0.85)",
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    textDecoration: "none",
                    transition: "background 0.2s, border-color 0.2s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLAnchorElement).style.background = "rgba(198,165,90,0.1)";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(198,165,90,0.35)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLAnchorElement).style.background = "rgba(198,165,90,0.04)";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(198,165,90,0.15)";
                  }}
                >
                  <Icon style={{ width: 13, height: 13, flexShrink: 0, opacity: 0.7 }} />
                  {label}
                  <ArrowRight style={{ width: 10, height: 10, marginLeft: "auto", opacity: 0.4 }} />
                </Link>
              ))}
            </div>
          </div>

          {/* Primary CTA */}
          <div style={{ padding: "12px 16px 14px", borderTop: "1px solid rgba(198,165,90,0.08)", flexShrink: 0, position: "relative", zIndex: 1 }}>
            <Link
              href="/intake"
              onClick={() => setOpen(false)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "11px 16px",
                background: "linear-gradient(135deg, #C6A55A 0%, #D4B76A 50%, #C6A55A 100%)",
                backgroundSize: "200% 100%",
                borderRadius: 8,
                color: "#0A0A0A",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                textDecoration: "none",
                transition: "opacity 0.2s, transform 0.2s",
                position: "relative",
                overflow: "hidden",
              }}
            >
              Begin Secure Intake
              <ArrowRight style={{ width: 13, height: 13 }} />
            </Link>
            <p style={{ fontSize: 8.5, color: "rgba(198,165,90,0.28)", letterSpacing: "0.16em", textTransform: "uppercase", textAlign: "center", marginTop: 10, marginBottom: 0 }}>
              Florida Licensed · Payment-Gated · Founder-Led
            </p>
          </div>
        </div>
      )}
    </>
  );
}
