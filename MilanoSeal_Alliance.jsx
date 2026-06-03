"use client";

/**
 * THE MILANO SEAL™
 * Alliance Partner Portal — Single-file React component
 *
 * Mobile notary · RON platform · Translator · Courier partner verification
 * and dispatch network.
 *
 * Architecture: AlliancePreLogin → AllianceLoading → AllianceHeader + AllianceShell
 *
 * No external imports. No Tailwind. Inline styles only.
 * No emojis. Crest via <img src="/milano-seal-crest-icon.png" />.
 */

import { useState, useEffect } from "react";

/* ─── Brand tokens ──────────────────────────────────────────────────────── */
const T = {
  black:        "#000000",
  blackSoft:    "#0A0A0A",
  blackCard:    "#0D0D0D",
  gold:         "#C6A55A",
  goldDim:      "#8A6F38",
  goldBorder:   "#C6A55A44",
  goldBorderMid:"#C6A55A88",
  emerald:      "#4a9e6b",
  emeraldDim:   "#2d6b47",
  emeraldBg:    "#0D1F15",
  danger:       "#c0392b",
  dangerBg:     "#200a09",
  warning:      "#d68910",
  warningBg:    "#1f1600",
  parchment:    "#F0EAD6",
  parchmentMid: "#C8BFA8",
  muted:        "#6B6252",
  mutedLight:   "#8C7E6C",
  border:       "#1F1F1F",
};

/* ─── Demo member (static — no Date.now, no Math.random) ───────────────── */
const DEMO_MEMBER = {
  id: "MSA-2026-0041",
  name: "Jordan Ellis",
  email: "jordan@example.com",
  state: "TOOL_BELT",
  joined: "2026-04-15",
  toolBelt: {
    identity:          "completed",
    credentials:       "completed",
    eo_insurance:      "completed",
    background_check:  "pending",
    ron_certification: "completed",
    service_categories:"completed",
    language_pairs:    "completed",
    coverage_area:     "completed",
    banking:           "pending",
    protocols_review:  "required",
  },
  services: ["RON", "Mobile Notary", "Apostille Coordination", "Certified Translation"],
  compliance: {
    eo_expiry:         "2027-03-01",
    background_expiry: "2027-01-15",
    commission_expiry: "2027-06-30",
  },
};

/* ─── State machine definitions ─────────────────────────────────────────── */
const VERIFICATION_STATES = [
  {
    id: "APPLICATION_SUBMITTED",
    label: "Application Submitted",
    description:
      "Your application has been received and is queued for initial administrative review. No action is required at this time.",
    next: "Documents are under review. You will be contacted if additional information is needed.",
  },
  {
    id: "VERIFICATION_REVIEW",
    label: "Verification Review",
    description:
      "Your submitted documents are being reviewed for completeness and accuracy by the Alliance operations team.",
    next: "Complete any outstanding Tool Belt requirements identified during your review.",
  },
  {
    id: "TOOL_BELT",
    label: "Tool Belt",
    description:
      "Your application has passed initial review. You must complete all required verification items in your Tool Belt before advancing.",
    next: "Resolve all pending and required Tool Belt items to proceed to administrative approval.",
  },
  {
    id: "ADMIN_APPROVED",
    label: "Admin Approved",
    description:
      "Your credentials have been verified and approved by the Alliance administration. Routing eligibility assessment is in progress.",
    next: "Your profile is being evaluated for dispatch routing eligibility. No further action is required.",
  },
  {
    id: "ROUTING_ELIGIBLE",
    label: "Routing Eligible",
    description:
      "You have met all verification requirements and are eligible to receive dispatch routing from the Milano Seal platform.",
    next: "Maintain compliance document renewals and service category declarations to retain eligibility.",
  },
];

/* ─── Tool Belt item definitions ────────────────────────────────────────── */
const TOOL_BELT_ITEMS = [
  { key: "identity",           label: "Identity Verification",         description: "Government-issued photo identification, verified against application." },
  { key: "credentials",        label: "Notary Credentials",            description: "Active state notary commission certificate on file." },
  { key: "eo_insurance",       label: "E&O Insurance",                 description: "Errors and omissions insurance policy, minimum coverage thresholds met." },
  { key: "background_check",   label: "Background Check",              description: "National criminal background check within the required validity window." },
  { key: "ron_certification",  label: "RON Platform Certification",    description: "Certification from an approved remote online notarization platform." },
  { key: "service_categories", label: "Service Categories Declaration", description: "Formal declaration of offered service categories submitted and confirmed." },
  { key: "language_pairs",     label: "Language Pairs",                description: "Languages of competency declared for translation or bilingual witness services." },
  { key: "coverage_area",      label: "Coverage Area",                 description: "Geographic service counties and ZIP code ranges declared and validated." },
  { key: "banking",            label: "Banking Verification",          description: "Disbursement account verified for partner payout processing." },
  { key: "protocols_review",   label: "Execution Protocols Review",    description: "Alliance execution protocols and standards of conduct reviewed and acknowledged." },
];

/* ─── Service categories ────────────────────────────────────────────────── */
const SERVICE_CATEGORIES = [
  { id: "RON",                    label: "Remote Online Notarization",  toolBeltKey: "ron_certification" },
  { id: "Mobile Notary",          label: "Mobile Notary",               toolBeltKey: "credentials" },
  { id: "Apostille Coordination", label: "Apostille Coordination",      toolBeltKey: "protocols_review" },
  { id: "Embassy Legalization",   label: "Embassy Legalization",        toolBeltKey: "protocols_review" },
  { id: "Certified Translation",  label: "Certified Translation",       toolBeltKey: "language_pairs" },
  { id: "International Courier",  label: "International Courier",       toolBeltKey: "coverage_area" },
  { id: "Witness Coordination",   label: "Witness Coordination",        toolBeltKey: "credentials" },
  { id: "After-Hours Availability", label: "After-Hours Availability",  toolBeltKey: "service_categories" },
];

/* ─── Sovereign Atmosphere keyframe style tag ───────────────────────────── */
const AtmosphereStyle = () => (
  <style>{`
    @keyframes atmosphereDrift1 {
      0%   { transform: translate(0%, 0%) scale(1); }
      33%  { transform: translate(3%, -4%) scale(1.05); }
      66%  { transform: translate(-2%, 3%) scale(0.97); }
      100% { transform: translate(0%, 0%) scale(1); }
    }
    @keyframes atmosphereDrift2 {
      0%   { transform: translate(0%, 0%) scale(1); }
      40%  { transform: translate(-4%, 3%) scale(1.07); }
      70%  { transform: translate(3%, -2%) scale(0.95); }
      100% { transform: translate(0%, 0%) scale(1); }
    }
    @keyframes progressFill {
      from { width: 0%; }
      to   { width: 72%; }
    }
    @keyframes progressPulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.6; }
    }
    @media (prefers-reduced-motion: reduce) {
      .atm1, .atm2 { animation: none !important; }
      .progress-bar-inner { animation: none !important; width: 72% !important; }
    }
  `}</style>
);

/* ─── Inline styles ─────────────────────────────────────────────────────── */
const S = {
  root: {
    position: "relative",
    minHeight: "100vh",
    background: T.black,
    color: T.parchment,
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    overflowX: "hidden",
  },
  atmBase: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: 0,
  },
  atm1: {
    position: "absolute",
    top: "-30%",
    left: "-20%",
    width: "70%",
    height: "70%",
    background: "radial-gradient(ellipse at center, rgba(198,165,90,0.07) 0%, transparent 70%)",
    animationName: "atmosphereDrift1",
    animationDuration: "32s",
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
  },
  atm2: {
    position: "absolute",
    bottom: "-20%",
    right: "-15%",
    width: "60%",
    height: "60%",
    background: "radial-gradient(ellipse at center, rgba(74,158,107,0.05) 0%, transparent 70%)",
    animationName: "atmosphereDrift2",
    animationDuration: "36s",
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
  },
  above: {
    position: "relative",
    zIndex: 1,
  },

  /* Header */
  header: {
    background: T.blackSoft,
    borderBottom: `1px solid ${T.goldBorder}`,
    padding: "0 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "64px",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  headerBrand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  headerCrest: {
    width: "36px",
    height: "36px",
    objectFit: "contain",
    display: "block",
  },
  headerWordmark: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: "15px",
    letterSpacing: "1.5px",
    color: T.gold,
    fontWeight: "400",
  },
  headerWordmarkSub: {
    fontSize: "10px",
    letterSpacing: "2px",
    textTransform: "uppercase",
    color: T.goldDim,
    fontFamily: "system-ui, sans-serif",
    marginTop: "2px",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  headerMember: {
    fontSize: "12px",
    color: T.parchmentMid,
    letterSpacing: "0.5px",
    fontFamily: "system-ui, sans-serif",
  },
  signOutBtn: {
    padding: "7px 18px",
    background: "transparent",
    border: `1px solid ${T.goldDim}66`,
    borderRadius: "4px",
    color: T.goldDim,
    fontSize: "11px",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    fontFamily: "system-ui, sans-serif",
    cursor: "pointer",
    fontWeight: "600",
  },

  /* Shell */
  shell: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "40px 32px 80px",
  },
  tabBar: {
    display: "flex",
    gap: "2px",
    borderBottom: `1px solid ${T.goldBorder}`,
    marginBottom: "36px",
    flexWrap: "wrap",
  },
  tab: (active) => ({
    padding: "10px 22px",
    fontSize: "11px",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    fontFamily: "system-ui, sans-serif",
    fontWeight: "600",
    cursor: "pointer",
    background: "transparent",
    border: "none",
    borderBottom: active ? `2px solid ${T.gold}` : "2px solid transparent",
    color: active ? T.gold : T.mutedLight,
    marginBottom: "-1px",
    transition: "color 0.15s, border-color 0.15s",
  }),

  /* Cards */
  card: {
    background: T.blackCard,
    border: `1px solid ${T.goldBorder}`,
    borderRadius: "8px",
    padding: "24px",
    marginBottom: "16px",
  },
  cardTitle: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: "18px",
    fontWeight: "400",
    color: T.parchment,
    marginBottom: "6px",
    letterSpacing: "0.3px",
  },
  sectionLabel: {
    fontSize: "10px",
    letterSpacing: "3px",
    textTransform: "uppercase",
    color: T.goldDim,
    fontFamily: "system-ui, sans-serif",
    fontWeight: "600",
    marginBottom: "6px",
  },
  divider: {
    height: "1px",
    background: `linear-gradient(90deg, ${T.goldDim}22 0%, ${T.goldDim}66 50%, ${T.goldDim}22 100%)`,
    border: "none",
    margin: "28px 0",
  },

  /* Status badges */
  stateBadge: (state) => {
    const map = {
      APPLICATION_SUBMITTED: { bg: "#1A1500", color: T.gold,    border: `1px solid ${T.goldDim}66` },
      VERIFICATION_REVIEW:   { bg: "#1F1200", color: T.warning,  border: `1px solid ${T.warning}44` },
      TOOL_BELT:             { bg: "#001220", color: "#5A9AFF",  border: "1px solid #1A3A6A" },
      ADMIN_APPROVED:        { bg: T.emeraldBg, color: T.emerald, border: `1px solid ${T.emeraldDim}` },
      ROUTING_ELIGIBLE:      { bg: "#001A10", color: "#4FD890",  border: "1px solid #1A5A38" },
    };
    const style = map[state] || map.APPLICATION_SUBMITTED;
    return {
      display: "inline-block",
      padding: "5px 14px",
      borderRadius: "20px",
      fontSize: "11px",
      letterSpacing: "1px",
      textTransform: "uppercase",
      fontWeight: "700",
      fontFamily: "system-ui, sans-serif",
      ...style,
    };
  },
  toolBeltStatus: (status) => {
    if (status === "completed") return { color: T.emerald, label: "Completed" };
    if (status === "pending")   return { color: T.warning, label: "Pending" };
    return                             { color: T.danger,  label: "Required" };
  },

  /* Progress bar */
  progressWrap: {
    background: "#111",
    border: `1px solid ${T.goldBorder}`,
    borderRadius: "4px",
    height: "8px",
    overflow: "hidden",
    margin: "12px 0 6px",
  },
  progressInner: (pct) => ({
    height: "100%",
    width: `${pct}%`,
    background: `linear-gradient(90deg, ${T.goldDim}, ${T.gold})`,
    borderRadius: "4px",
    transition: "width 0.4s ease",
  }),
};

/* ─── Helper: status icon circle ────────────────────────────────────────── */
const StatusDot = ({ status }) => {
  const { color } = S.toolBeltStatus(status);
  const symbol = status === "completed" ? "+" : status === "pending" ? "~" : "!";
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "20px",
      height: "20px",
      borderRadius: "50%",
      background: status === "completed" ? T.emeraldBg : status === "pending" ? T.warningBg : T.dangerBg,
      border: `1px solid ${color}`,
      color,
      fontSize: "11px",
      fontWeight: "700",
      fontFamily: "system-ui, sans-serif",
      flexShrink: 0,
    }}>
      {symbol}
    </span>
  );
};

/* ─── Pre-login page ────────────────────────────────────────────────────── */
function AlliancePreLogin({ onSignIn }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    background: "#0A0A0A",
    border: `1px solid ${T.goldBorder}`,
    borderRadius: "4px",
    color: T.parchment,
    fontSize: "14px",
    fontFamily: "system-ui, sans-serif",
    outline: "none",
    boxSizing: "border-box",
  };

  const benefitBlocks = [
    {
      heading: "Verified Dispatch Network",
      body: "Alliance members undergo a structured credential verification process before being considered for dispatch routing. This keeps the network accountable and protects the integrity of every execution.",
    },
    {
      heading: "Specialized Document Execution",
      body: "Work across apostille coordination, remote online notarization, embassy-bound packages, certified translation, and international courier — a single credentialed relationship across service types.",
    },
    {
      heading: "Transparent Verification Pathway",
      body: "A five-state verification pathway with clear requirements at each stage. No ambiguity. No hidden criteria. Progress is tracked inside your member portal from submission through routing eligibility.",
    },
    {
      heading: "Compliance-First Infrastructure",
      body: "Automated compliance reminders for E&O insurance, background check, and notary commission renewals ensure your credentials stay current and your dispatch eligibility is never interrupted by a lapse.",
    },
  ];

  return (
    <div style={{ ...S.above, minHeight: "100vh" }}>
      {/* Header (unauthenticated) */}
      <div style={S.header}>
        <div style={S.headerBrand}>
          <img src="/milano-seal-crest-icon.png" alt="The Milano Seal Crest" style={S.headerCrest} />
          <div>
            <div style={S.headerWordmark}>The Milano Seal™ Alliance</div>
            <div style={S.headerWordmarkSub}>Partner Verification Network</div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "64px 32px 0" }}>
        <div style={{ ...S.sectionLabel, marginBottom: "12px" }}>Partner Access Portal</div>
        <h1 style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: "clamp(28px, 4vw, 46px)",
          fontWeight: "400",
          color: T.parchment,
          lineHeight: "1.2",
          marginBottom: "18px",
          letterSpacing: "0.3px",
        }}>
          The Milano Seal<br />
          <span style={{ color: T.gold }}>Alliance</span>
        </h1>
        <p style={{
          fontSize: "16px",
          color: T.parchmentMid,
          lineHeight: "1.7",
          maxWidth: "520px",
          fontFamily: "system-ui, sans-serif",
          marginBottom: "48px",
        }}>
          A credential-verified dispatch network for mobile notaries, RON platforms, translators, and courier partners serving The Milano Seal™ document execution platform.
        </p>

        {/* Two-column layout: benefits + login */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr minmax(300px, 380px)",
          gap: "48px",
          alignItems: "start",
        }}>
          {/* Benefits */}
          <div>
            <div style={{ ...S.sectionLabel, marginBottom: "20px" }}>Why Join the Alliance</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {benefitBlocks.map((b, i) => (
                <div key={i} style={{
                  borderLeft: `2px solid ${T.goldDim}`,
                  paddingLeft: "20px",
                }}>
                  <div style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: "15px",
                    color: T.gold,
                    marginBottom: "6px",
                    fontWeight: "400",
                  }}>
                    {b.heading}
                  </div>
                  <p style={{
                    fontSize: "13px",
                    color: T.parchmentMid,
                    lineHeight: "1.65",
                    fontFamily: "system-ui, sans-serif",
                    margin: 0,
                  }}>
                    {b.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Login form */}
          <div style={{
            background: T.blackCard,
            border: `1px solid ${T.goldBorder}`,
            borderRadius: "10px",
            padding: "32px",
          }}>
            <div style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "20px",
              color: T.parchment,
              marginBottom: "6px",
              fontWeight: "400",
            }}>
              Member Sign In
            </div>
            <div style={{ fontSize: "12px", color: T.mutedLight, fontFamily: "system-ui, sans-serif", marginBottom: "24px", letterSpacing: "0.3px" }}>
              Alliance credentials required
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "10px", letterSpacing: "1.5px", textTransform: "uppercase", color: T.goldDim, fontFamily: "system-ui, sans-serif", fontWeight: "600", marginBottom: "6px" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="member@example.com"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "10px", letterSpacing: "1.5px", textTransform: "uppercase", color: T.goldDim, fontFamily: "system-ui, sans-serif", fontWeight: "600", marginBottom: "6px" }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder=""
                  style={inputStyle}
                />
              </div>
            </div>
            <button
              onClick={onSignIn}
              style={{
                width: "100%",
                padding: "13px",
                background: "linear-gradient(135deg, #8A6F38, #C6A55A)",
                border: "none",
                borderRadius: "4px",
                color: "#000",
                fontSize: "11px",
                letterSpacing: "2px",
                textTransform: "uppercase",
                fontFamily: "system-ui, sans-serif",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Sign In to Alliance Portal
            </button>
            <hr style={{ ...S.divider, margin: "20px 0" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "12px", color: T.mutedLight, fontFamily: "system-ui, sans-serif", marginBottom: "12px" }}>
                Not yet an Alliance member?
              </div>
              <button style={{
                width: "100%",
                padding: "11px",
                background: "transparent",
                border: `1px solid ${T.goldDim}`,
                borderRadius: "4px",
                color: T.gold,
                fontSize: "11px",
                letterSpacing: "2px",
                textTransform: "uppercase",
                fontFamily: "system-ui, sans-serif",
                fontWeight: "600",
                cursor: "pointer",
              }}>
                Apply to Join
              </button>
            </div>
          </div>
        </div>

        {/* Verification pathway preview */}
        <hr style={{ ...S.divider, margin: "56px 0 32px" }} />
        <div style={{ ...S.sectionLabel, marginBottom: "20px" }}>Alliance Verification Pathway</div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "2px",
          marginBottom: "32px",
        }}>
          {VERIFICATION_STATES.map((vs, i) => (
            <div key={vs.id} style={{
              background: T.blackCard,
              border: `1px solid ${T.goldBorder}`,
              borderRadius: "6px",
              padding: "16px",
              position: "relative",
            }}>
              <div style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: "#1A1500",
                border: `1px solid ${T.goldDim}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                color: T.gold,
                fontFamily: "system-ui, sans-serif",
                fontWeight: "700",
                marginBottom: "10px",
              }}>
                {i + 1}
              </div>
              <div style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "13px",
                color: T.gold,
                marginBottom: "6px",
                fontWeight: "400",
              }}>
                {vs.label}
              </div>
              <div style={{ fontSize: "11px", color: T.parchmentMid, lineHeight: "1.5", fontFamily: "system-ui, sans-serif" }}>
                {vs.description}
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div style={{
          borderTop: `1px solid ${T.goldBorder}`,
          paddingTop: "24px",
          paddingBottom: "48px",
        }}>
          <p style={{
            fontSize: "11px",
            color: T.muted,
            fontFamily: "system-ui, sans-serif",
            letterSpacing: "0.3px",
            lineHeight: "1.6",
            maxWidth: "680px",
            margin: "0 auto",
            textAlign: "center",
          }}>
            Alliance participation does not guarantee dispatch volume, client assignment, or routing eligibility.
            Verification decisions are made by the Milano Seal Alliance operations team and are not subject to appeal
            outside the formal review process. Dispatch volume is determined by operational demand, not membership status.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Loading screen ────────────────────────────────────────────────────── */
function AllianceLoading() {
  return (
    <div style={{
      ...S.above,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "32px",
    }}>
      <img
        src="/milano-seal-crest-icon.png"
        alt="The Milano Seal Crest"
        style={{ width: "72px", height: "72px", objectFit: "contain", display: "block" }}
      />
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: "14px",
          color: T.gold,
          letterSpacing: "2px",
          marginBottom: "4px",
        }}>
          The Milano Seal™ Alliance
        </div>
        <div style={{
          fontSize: "11px",
          color: T.mutedLight,
          letterSpacing: "2.5px",
          textTransform: "uppercase",
          fontFamily: "system-ui, sans-serif",
        }}>
          Verifying Alliance credentials...
        </div>
      </div>
      <div style={{
        width: "260px",
        height: "3px",
        background: "#111",
        borderRadius: "2px",
        overflow: "hidden",
        border: `1px solid ${T.goldBorder}`,
      }}>
        <div
          className="progress-bar-inner"
          style={{
            height: "100%",
            background: `linear-gradient(90deg, ${T.goldDim}, ${T.gold})`,
            borderRadius: "2px",
            animationName: "progressFill, progressPulse",
            animationDuration: "1.8s, 0.9s",
            animationTimingFunction: "ease-out, ease-in-out",
            animationFillMode: "forwards, none",
            animationIterationCount: "1, infinite",
          }}
        />
      </div>
    </div>
  );
}

/* ─── Header (authenticated) ────────────────────────────────────────────── */
function AllianceHeader({ member, onSignOut }) {
  return (
    <div style={S.header}>
      <div style={S.headerBrand}>
        <img src="/milano-seal-crest-icon.png" alt="The Milano Seal Crest" style={S.headerCrest} />
        <div>
          <div style={S.headerWordmark}>The Milano Seal™ Alliance</div>
          <div style={S.headerWordmarkSub}>Partner Member Portal</div>
        </div>
      </div>
      <div style={S.headerRight}>
        <div style={S.headerMember}>
          <span style={{ color: T.goldDim }}>Member: </span>
          <span style={{ color: T.parchment }}>{member.name}</span>
          <span style={{ color: T.muted, marginLeft: "12px", fontSize: "11px" }}>{member.id}</span>
        </div>
        <button style={S.signOutBtn} onClick={onSignOut}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

/* ─── Tab: Overview ─────────────────────────────────────────────────────── */
function TabOverview({ member }) {
  const stateInfo = VERIFICATION_STATES.find(s => s.id === member.state);
  const stateIdx  = VERIFICATION_STATES.findIndex(s => s.id === member.state);

  return (
    <div>
      <div style={{ ...S.sectionLabel, marginBottom: "20px" }}>Member Overview</div>

      {/* Member status card */}
      <div style={{
        ...S.card,
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: "20px",
        alignItems: "start",
        marginBottom: "20px",
      }}>
        <div>
          <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "22px", color: T.parchment, marginBottom: "4px" }}>
            {member.name}
          </div>
          <div style={{ fontSize: "12px", color: T.mutedLight, fontFamily: "system-ui, sans-serif", marginBottom: "16px", letterSpacing: "0.3px" }}>
            {member.email}
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <div>
              <div style={{ ...S.sectionLabel, marginBottom: "4px" }}>Member ID</div>
              <div style={{ fontSize: "13px", color: T.gold, fontFamily: "system-ui, monospace" }}>{member.id}</div>
            </div>
            <div>
              <div style={{ ...S.sectionLabel, marginBottom: "4px" }}>Joined</div>
              <div style={{ fontSize: "13px", color: T.parchmentMid, fontFamily: "system-ui, sans-serif" }}>{member.joined}</div>
            </div>
            <div>
              <div style={{ ...S.sectionLabel, marginBottom: "4px" }}>Verification State</div>
              <span style={S.stateBadge(member.state)}>
                {stateInfo ? stateInfo.label : member.state}
              </span>
            </div>
          </div>
        </div>
        <div style={{
          textAlign: "right",
          fontSize: "11px",
          color: T.mutedLight,
          fontFamily: "system-ui, sans-serif",
        }}>
          <div style={{ color: T.goldDim, fontWeight: "600", letterSpacing: "0.5px" }}>
            Step {stateIdx + 1} of {VERIFICATION_STATES.length}
          </div>
        </div>
      </div>

      {/* Current state description */}
      {stateInfo && (
        <div style={{ ...S.card, borderLeft: `3px solid ${T.gold}` }}>
          <div style={{ ...S.sectionLabel, marginBottom: "8px" }}>Current Verification State</div>
          <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "17px", color: T.gold, marginBottom: "10px" }}>
            {stateInfo.label}
          </div>
          <p style={{ fontSize: "14px", color: T.parchmentMid, lineHeight: "1.65", fontFamily: "system-ui, sans-serif", margin: "0 0 16px" }}>
            {stateInfo.description}
          </p>
          <div style={{ borderTop: `1px solid ${T.goldBorder}`, paddingTop: "14px" }}>
            <div style={{ ...S.sectionLabel, marginBottom: "6px" }}>What Comes Next</div>
            <div style={{ fontSize: "13px", color: T.parchment, fontFamily: "system-ui, sans-serif", lineHeight: "1.55" }}>
              {stateInfo.next}
            </div>
          </div>
        </div>
      )}

      {/* Declared services */}
      <div style={S.card}>
        <div style={{ ...S.sectionLabel, marginBottom: "12px" }}>Declared Service Categories</div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {member.services.map(svc => (
            <span key={svc} style={{
              padding: "5px 14px",
              background: T.emeraldBg,
              border: `1px solid ${T.emeraldDim}`,
              borderRadius: "20px",
              fontSize: "12px",
              color: T.emerald,
              fontFamily: "system-ui, sans-serif",
              fontWeight: "600",
              letterSpacing: "0.3px",
            }}>
              {svc}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Tab: Verification ─────────────────────────────────────────────────── */
function TabVerification({ member }) {
  const currentIdx = VERIFICATION_STATES.findIndex(s => s.id === member.state);

  return (
    <div>
      <div style={{ ...S.sectionLabel, marginBottom: "20px" }}>Verification Pathway</div>

      <div style={{ ...S.card, marginBottom: "24px" }}>
        <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "16px", color: T.parchment, marginBottom: "6px" }}>
          Five-State Verification Process
        </div>
        <div style={{ fontSize: "12px", color: T.mutedLight, fontFamily: "system-ui, sans-serif", lineHeight: "1.55", marginBottom: "20px" }}>
          All Alliance members progress through five sequential verification states. Advancement between states is determined by the Alliance operations team based on submitted documentation and fulfilled requirements.
        </div>

        {/* Stepper */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {VERIFICATION_STATES.map((vs, i) => {
            const isActive   = i === currentIdx;
            const isComplete = i < currentIdx;
            const isFuture   = i > currentIdx;

            let stateColor = T.mutedLight;
            let dotBg      = "#111";
            let dotBorder  = T.muted;
            let dotColor   = T.muted;
            if (isActive)   { stateColor = T.gold;    dotBg = "#1A1500"; dotBorder = T.gold;    dotColor = T.gold; }
            if (isComplete) { stateColor = T.emerald; dotBg = T.emeraldBg; dotBorder = T.emeraldDim; dotColor = T.emerald; }

            return (
              <div key={vs.id} style={{ display: "flex", gap: "0", alignItems: "stretch" }}>
                {/* Left: number + line */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "48px", flexShrink: 0 }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: dotBg,
                    border: `2px solid ${dotBorder}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    color: dotColor,
                    fontFamily: "system-ui, sans-serif",
                    fontWeight: "700",
                    flexShrink: 0,
                    zIndex: 1,
                  }}>
                    {isComplete ? "+" : i + 1}
                  </div>
                  {i < VERIFICATION_STATES.length - 1 && (
                    <div style={{
                      width: "2px",
                      flex: 1,
                      minHeight: "20px",
                      background: isComplete ? T.emeraldDim : "#222",
                    }} />
                  )}
                </div>
                {/* Right: content */}
                <div style={{
                  flex: 1,
                  padding: "0 0 24px 16px",
                  background: isActive ? "#0D0D00" : "transparent",
                  borderRadius: isActive ? "6px" : "0",
                  border: isActive ? `1px solid ${T.goldBorder}` : "1px solid transparent",
                  marginBottom: isActive ? "8px" : "0",
                  paddingLeft: "16px",
                  paddingRight: isActive ? "16px" : "0",
                  paddingTop: "4px",
                }}>
                  <div style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: "15px",
                    color: stateColor,
                    marginBottom: "4px",
                    marginTop: "4px",
                  }}>
                    {vs.label}
                    {isActive && (
                      <span style={{
                        display: "inline-block",
                        marginLeft: "10px",
                        padding: "2px 10px",
                        background: "#1A1500",
                        border: `1px solid ${T.goldDim}`,
                        borderRadius: "12px",
                        fontSize: "9px",
                        color: T.gold,
                        letterSpacing: "1.5px",
                        textTransform: "uppercase",
                        fontFamily: "system-ui, sans-serif",
                        verticalAlign: "middle",
                      }}>
                        Current
                      </span>
                    )}
                    {isComplete && (
                      <span style={{
                        display: "inline-block",
                        marginLeft: "10px",
                        padding: "2px 10px",
                        background: T.emeraldBg,
                        border: `1px solid ${T.emeraldDim}`,
                        borderRadius: "12px",
                        fontSize: "9px",
                        color: T.emerald,
                        letterSpacing: "1.5px",
                        textTransform: "uppercase",
                        fontFamily: "system-ui, sans-serif",
                        verticalAlign: "middle",
                      }}>
                        Complete
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: "12px",
                    color: isFuture ? T.muted : T.parchmentMid,
                    fontFamily: "system-ui, sans-serif",
                    lineHeight: "1.55",
                  }}>
                    {vs.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Tab: Tool Belt ────────────────────────────────────────────────────── */
function TabToolBelt({ member }) {
  const items    = TOOL_BELT_ITEMS;
  const statuses = member.toolBelt;
  const completed = Object.values(statuses).filter(v => v === "completed").length;
  const total     = Object.values(statuses).length;
  const pct       = Math.round((completed / total) * 100);

  return (
    <div>
      <div style={{ ...S.sectionLabel, marginBottom: "20px" }}>Tool Belt — Verification Requirements</div>

      {/* Completion bar */}
      <div style={{ ...S.card, marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
          <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "16px", color: T.parchment }}>
            Completion Status
          </div>
          <div style={{ fontSize: "24px", color: T.gold, fontFamily: "Georgia, 'Times New Roman', serif" }}>
            {pct}<span style={{ fontSize: "14px", color: T.goldDim }}>%</span>
          </div>
        </div>
        <div style={S.progressWrap}>
          <div style={S.progressInner(pct)} />
        </div>
        <div style={{ fontSize: "11px", color: T.mutedLight, fontFamily: "system-ui, sans-serif", letterSpacing: "0.3px" }}>
          {completed} of {total} requirements completed
        </div>
      </div>

      {/* Items list */}
      <div style={{ ...S.card, padding: "0", overflow: "hidden" }}>
        {items.map((item, i) => {
          const status = statuses[item.key] || "required";
          const { color, label } = S.toolBeltStatus(status);
          return (
            <div key={item.key} style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
              padding: "16px 20px",
              borderBottom: i < items.length - 1 ? `1px solid #111` : "none",
              background: status === "required" ? T.dangerBg : "transparent",
            }}>
              <StatusDot status={status} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ fontSize: "13px", color: T.parchment, fontFamily: "system-ui, sans-serif", fontWeight: "600" }}>
                    {item.label}
                  </div>
                  <span style={{
                    fontSize: "10px",
                    color,
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    fontFamily: "system-ui, sans-serif",
                    fontWeight: "700",
                  }}>
                    {label}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: T.mutedLight, fontFamily: "system-ui, sans-serif", marginTop: "3px", lineHeight: "1.5" }}>
                  {item.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Tab: Service Categories ───────────────────────────────────────────── */
function TabServiceCategories({ member }) {
  const toolBeltStatuses = member.toolBelt;

  return (
    <div>
      <div style={{ ...S.sectionLabel, marginBottom: "20px" }}>Service Categories</div>

      <div style={{ ...S.card, marginBottom: "20px" }}>
        <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "16px", color: T.parchment, marginBottom: "8px" }}>
          Declared Categories
        </div>
        <div style={{ fontSize: "13px", color: T.parchmentMid, fontFamily: "system-ui, sans-serif", lineHeight: "1.6" }}>
          Service categories determine the types of execution work for which you may be considered during dispatch routing. Each category has a corresponding Tool Belt requirement that must be completed.
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {SERVICE_CATEGORIES.map(cat => {
          const isDeclared = member.services.includes(cat.id);
          const tbStatus   = toolBeltStatuses[cat.toolBeltKey] || "required";
          const tbItem     = TOOL_BELT_ITEMS.find(t => t.key === cat.toolBeltKey);
          const { color: tbColor, label: tbLabel } = S.toolBeltStatus(tbStatus);

          return (
            <div key={cat.id} style={{
              ...S.card,
              padding: "16px 20px",
              display: "grid",
              gridTemplateColumns: "1fr auto",
              alignItems: "center",
              gap: "16px",
              borderLeft: isDeclared ? `3px solid ${T.emerald}` : `3px solid #222`,
              marginBottom: 0,
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <div style={{ fontSize: "14px", color: isDeclared ? T.parchment : T.muted, fontFamily: "system-ui, sans-serif", fontWeight: "600" }}>
                    {cat.label}
                  </div>
                  <span style={{
                    fontSize: "9px",
                    color: isDeclared ? T.emerald : T.muted,
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    fontFamily: "system-ui, sans-serif",
                    fontWeight: "700",
                    padding: "2px 8px",
                    background: isDeclared ? T.emeraldBg : "#111",
                    border: `1px solid ${isDeclared ? T.emeraldDim : "#222"}`,
                    borderRadius: "10px",
                  }}>
                    {isDeclared ? "Declared" : "Not Declared"}
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: T.muted, fontFamily: "system-ui, sans-serif" }}>
                  Requires: <span style={{ color: tbColor }}>{tbItem ? tbItem.label : cat.toolBeltKey}</span>
                  {" — "}
                  <span style={{ color: tbColor, fontWeight: "600" }}>{tbLabel}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Tab: Routing Eligibility ──────────────────────────────────────────── */
function TabRoutingEligibility({ member }) {
  const allCompleted = Object.values(member.toolBelt).every(v => v === "completed");
  const isEligible   = member.state === "ROUTING_ELIGIBLE";

  const requirements = [
    { label: "All Tool Belt items completed",          met: allCompleted },
    { label: "Background check current and on file",   met: member.toolBelt.background_check === "completed" },
    { label: "E&O insurance active and on file",       met: member.toolBelt.eo_insurance === "completed" },
    { label: "Notary credentials verified",            met: member.toolBelt.credentials === "completed" },
    { label: "Banking verification complete",          met: member.toolBelt.banking === "completed" },
    { label: "Execution protocols review acknowledged", met: member.toolBelt.protocols_review === "completed" },
    { label: "Admin approval granted",                 met: member.state === "ADMIN_APPROVED" || member.state === "ROUTING_ELIGIBLE" },
  ];

  const metCount = requirements.filter(r => r.met).length;

  return (
    <div>
      <div style={{ ...S.sectionLabel, marginBottom: "20px" }}>Routing Eligibility</div>

      {/* Demo banner */}
      <div style={{
        background: T.warningBg,
        border: `1px solid ${T.warning}44`,
        borderRadius: "6px",
        padding: "12px 18px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: T.warning, flexShrink: 0 }} />
        <div style={{ fontSize: "11px", color: T.warning, fontFamily: "system-ui, sans-serif", letterSpacing: "1px", textTransform: "uppercase", fontWeight: "700" }}>
          Demo Preview — Not Live Data
        </div>
      </div>

      {/* Eligibility status */}
      <div style={{
        ...S.card,
        borderLeft: `3px solid ${isEligible ? T.emerald : T.warning}`,
        marginBottom: "20px",
      }}>
        <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "17px", color: isEligible ? T.emerald : T.gold, marginBottom: "6px" }}>
          {isEligible ? "Routing Eligible" : "Not Yet Routing Eligible"}
        </div>
        <div style={{ fontSize: "13px", color: T.parchmentMid, fontFamily: "system-ui, sans-serif", lineHeight: "1.6" }}>
          {isEligible
            ? "You have fulfilled all requirements and are eligible for dispatch routing consideration."
            : `${metCount} of ${requirements.length} eligibility requirements met. Complete outstanding requirements to advance your verification state.`}
        </div>
      </div>

      {/* Requirements list */}
      <div style={{ ...S.card, padding: "0", overflow: "hidden", marginBottom: "20px" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid #111` }}>
          <div style={{ ...S.sectionLabel, margin: 0 }}>Eligibility Requirements</div>
        </div>
        {requirements.map((req, i) => (
          <div key={i} style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "13px 20px",
            borderBottom: i < requirements.length - 1 ? `1px solid #111` : "none",
          }}>
            <div style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: req.met ? T.emeraldBg : T.dangerBg,
              border: `1px solid ${req.met ? T.emeraldDim : T.danger}44`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              color: req.met ? T.emerald : T.danger,
              fontWeight: "700",
              fontFamily: "system-ui, sans-serif",
              flexShrink: 0,
            }}>
              {req.met ? "+" : "x"}
            </div>
            <div style={{ fontSize: "13px", color: req.met ? T.parchmentMid : T.parchment, fontFamily: "system-ui, sans-serif" }}>
              {req.label}
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div style={{
        background: "#0A0A0A",
        border: `1px solid #1F1F1F`,
        borderRadius: "6px",
        padding: "16px 20px",
      }}>
        <div style={{ ...S.sectionLabel, marginBottom: "8px" }}>Dispatch Notice</div>
        <p style={{ fontSize: "12px", color: T.muted, fontFamily: "system-ui, sans-serif", lineHeight: "1.65", margin: 0 }}>
          Routing eligibility does not guarantee assignment volume. Dispatch decisions are made by the operator based on order type, geography, availability, and operational need. Eligibility status is a prerequisite for consideration, not a commitment to volume.
        </p>
      </div>
    </div>
  );
}

/* ─── Tab: Compliance ───────────────────────────────────────────────────── */
function TabCompliance({ member }) {
  const complianceItems = [
    {
      label: "E&O Insurance",
      expiry: member.compliance.eo_expiry,
      description: "Errors and omissions insurance policy must remain active with minimum coverage thresholds met.",
      renewalNote: "Renew at least 30 days prior to expiry to avoid eligibility interruption.",
    },
    {
      label: "Background Check",
      expiry: member.compliance.background_expiry,
      description: "National criminal background check must remain within the approved validity window.",
      renewalNote: "Background checks must be re-initiated through the approved vendor prior to expiry.",
    },
    {
      label: "Notary Commission",
      expiry: member.compliance.commission_expiry,
      description: "Active state notary public commission is required to maintain credential verification.",
      renewalNote: "Submit updated commission documentation through the Tool Belt upon renewal.",
    },
  ];

  return (
    <div>
      <div style={{ ...S.sectionLabel, marginBottom: "20px" }}>Compliance — Document Expiry Tracking</div>

      <div style={{ ...S.card, marginBottom: "20px" }}>
        <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "16px", color: T.parchment, marginBottom: "8px" }}>
          Compliance Calendar
        </div>
        <div style={{ fontSize: "13px", color: T.parchmentMid, fontFamily: "system-ui, sans-serif", lineHeight: "1.65" }}>
          Alliance members are responsible for maintaining active and current compliance documents at all times. A lapse in any required document may affect verification state and dispatch eligibility. The dates below reflect submitted documentation on file. All data shown is static demo data.
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {complianceItems.map((item, i) => (
          <div key={i} style={{
            ...S.card,
            marginBottom: 0,
            borderLeft: `3px solid ${T.emerald}`,
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "start", gap: "12px" }}>
              <div>
                <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "16px", color: T.parchment, marginBottom: "6px" }}>
                  {item.label}
                </div>
                <div style={{ fontSize: "12px", color: T.parchmentMid, fontFamily: "system-ui, sans-serif", lineHeight: "1.55", marginBottom: "10px" }}>
                  {item.description}
                </div>
                <div style={{ fontSize: "11px", color: T.mutedLight, fontFamily: "system-ui, sans-serif", fontStyle: "italic" }}>
                  {item.renewalNote}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ ...S.sectionLabel, textAlign: "right", marginBottom: "4px" }}>Expiry Date</div>
                <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "18px", color: T.emerald }}>
                  {item.expiry}
                </div>
                <div style={{ fontSize: "10px", color: T.emeraldDim, fontFamily: "system-ui, sans-serif", letterSpacing: "1px", textTransform: "uppercase", marginTop: "2px" }}>
                  On File
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "24px" }}>
        <div style={{ ...S.card, background: "#0A0A0A", border: `1px solid #1F1F1F` }}>
          <div style={{ ...S.sectionLabel, marginBottom: "8px" }}>License Renewal Reminders</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              "Renewal reminders are issued 90, 60, and 30 days prior to each expiry date.",
              "License renewals must be submitted through the Tool Belt verification upload flow.",
              "Documents submitted within 7 days of expiry may not be processed before the expiry date.",
              "It is the member's sole responsibility to maintain active credentials.",
            ].map((note, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: T.goldDim, flexShrink: 0, marginTop: "6px" }} />
                <div style={{ fontSize: "12px", color: T.parchmentMid, fontFamily: "system-ui, sans-serif", lineHeight: "1.55" }}>
                  {note}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Alliance Shell ────────────────────────────────────────────────────── */
const TABS = [
  { id: "overview",     label: "Overview" },
  { id: "verification", label: "Verification" },
  { id: "toolbelt",     label: "Tool Belt" },
  { id: "services",     label: "Service Categories" },
  { id: "routing",      label: "Routing Eligibility" },
  { id: "compliance",   label: "Compliance" },
];

function AllianceShell({ member, onSignOut }) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div style={S.above}>
      <AllianceHeader member={member} onSignOut={onSignOut} />
      <div style={S.shell}>
        {/* Tab bar */}
        <div style={S.tabBar}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              style={S.tab(activeTab === tab.id)}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "overview"     && <TabOverview            member={member} />}
        {activeTab === "verification" && <TabVerification        member={member} />}
        {activeTab === "toolbelt"     && <TabToolBelt            member={member} />}
        {activeTab === "services"     && <TabServiceCategories   member={member} />}
        {activeTab === "routing"      && <TabRoutingEligibility  member={member} />}
        {activeTab === "compliance"   && <TabCompliance          member={member} />}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: `1px solid ${T.goldBorder}`,
        padding: "20px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        background: T.blackSoft,
      }}>
        <div style={{ fontSize: "10px", color: T.muted, fontFamily: "system-ui, sans-serif", letterSpacing: "1px", textTransform: "uppercase" }}>
          The Milano Seal™ Alliance · Partner Member Portal
        </div>
        <div style={{ fontSize: "10px", color: T.muted, fontFamily: "system-ui, sans-serif", letterSpacing: "0.5px" }}>
          All data displayed is for demonstration purposes only.
        </div>
      </div>
    </div>
  );
}

/* ─── Root export ───────────────────────────────────────────────────────── */
export default function MilanoSealAlliance() {
  // phase: "prelogin" | "loading" | "app"
  const [phase, setPhase] = useState("prelogin");

  const handleSignIn = () => {
    setPhase("loading");
  };

  const handleSignOut = () => {
    setPhase("prelogin");
  };

  useEffect(() => {
    if (phase === "loading") {
      const timer = setTimeout(() => {
        setPhase("app");
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  return (
    <div style={S.root}>
      <AtmosphereStyle />

      {/* Sovereign Atmosphere background */}
      <div style={S.atmBase} aria-hidden="true">
        <div className="atm1" style={S.atm1} />
        <div className="atm2" style={S.atm2} />
      </div>

      {phase === "prelogin" && (
        <AlliancePreLogin onSignIn={handleSignIn} />
      )}

      {phase === "loading" && (
        <AllianceLoading />
      )}

      {phase === "app" && (
        <AllianceShell member={DEMO_MEMBER} onSignOut={handleSignOut} />
      )}
    </div>
  );
}
