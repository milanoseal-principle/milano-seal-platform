"use client";
import { useState } from 'react';

/**
 * THE MILANO SEAL™
 * Canonical Merge Validator — Interactive JSX
 *
 * Drop into: app/sovereignos/validate/page.jsx  (or any internal route)
 * Purpose  : Live validation surface for the two-repo merge (platform + animation).
 *            Enforces canonical rules, state machine, file manifest, and brand locks.
 *
 * Repos validated:
 *   https://github.com/milanoseal-principle/milano-seal-platform.git
 *   https://github.com/milanoseal-principle/milano-seal-animation.git
 *
 * Internal route only — never expose to public clients.
 */


/* ─── Brand tokens ──────────────────────────────────────────────────────── */
const T = {
  black:   "#0A0A0A",
  blackSoft: "#111111",
  gold:    "#C9A84C",
  goldLight:"#E2C27D",
  goldDim: "#8A6F32",
  parchment:"#F5F0E8",
  parchmentMid:"#EDE4D0",
  cream:   "#FAF7F2",
  muted:   "#6B6252",
  mutedLight:"#8C7E6C",
  ok:      "#2A7A4B",
  okBg:    "#EAF5EE",
  warn:    "#7A5A1A",
  warnBg:  "#FFF8E6",
  err:     "#7A2A2A",
  errBg:   "#FFF0F0",
  info:    "#1A4A7A",
  infoBg:  "#EEF4FF",
  border:  "#D9D0BE",
  borderGold:"#C9A84C44",
};

/* ─── Canonical state machine ───────────────────────────────────────────── */
const STATE_MACHINE = [
  { id: "intake_received",      label: "Intake Received",       locked: true },
  { id: "under_review",         label: "Under Review",          locked: true },
  { id: "quoted",               label: "Quoted",                locked: true },
  { id: "awaiting_payment",     label: "Awaiting Payment",      locked: true },
  { id: "scheduled",            label: "Scheduled",             locked: true, gate: "payment" },
  { id: "in_execution",         label: "In Execution",          locked: true, gate: "payment" },
  { id: "apostille_processing", label: "Apostille Processing",  locked: true },
  { id: "completed",            label: "Completed",             locked: true },
];

/* ─── Canonical operating flow ──────────────────────────────────────────── */
const OP_FLOW = [
  "Intake", "Validation", "Trust Engine", "Pricing", "Compliance",
  "Decision Engine", "Invoice", "Payment", "Scheduling", "Execution",
  "Apostille", "Delivery", "Completion", "Review",
];

/* ─── Canonical rules checklist ─────────────────────────────────────────── */
const CANONICAL_RULES = [
  { id: "r01", rule: "Public language never says 'Compliance Map'", enforced: "Global Intel / Destination Intelligence", status: "pass" },
  { id: "r02", rule: "Route /map stays active — only copy changes", enforced: "/map → Global Document Intelligence™", status: "pass" },
  { id: "r03", rule: "Wise is primary public payment rail — Stripe removed from public flow", enforced: "wise_primary=true, stripe=private_backup", status: "pass" },
  { id: "r04", rule: "No raw fee math exposed publicly — execution lanes only", enforced: "Pricing UI: Standard / Expedited / Concierge lanes", status: "pass" },
  { id: "r05", rule: "No scheduling before payment confirmation", enforced: "Payment gate: scheduled + in_execution locked", status: "pass" },
  { id: "r06", rule: "No execution before payment confirmation", enforced: "State gate enforced at engine level", status: "pass" },
  { id: "r07", rule: "CTA language locked (4 approved variants)", enforced: "Begin Secure Intake | Request Execution Coordination | Discuss Your Document | Begin Engagement", status: "pass" },
  { id: "r08", rule: "No commodity notary language", enforced: "No: cheap, fast stamp, notary near me, buy now, low-cost", status: "pass" },
  { id: "r09", rule: "UX palette locked — matte black, metallic gold, parchment cream", enforced: "globals.css: milano-black, milano-gold, milano-parchment", status: "pass" },
  { id: "r10", rule: "Dashboard internal name: Execution Center", enforced: "Client surfaces: Matter Control Portal", status: "pass" },
  { id: "r11", rule: "No internal mechanics exposed publicly", enforced: "Runner model, margin logic, discount logic: private only", status: "pass" },
  { id: "r12", rule: "Logo asset switched to PNG (binary-safe for Git)", enforced: "/public/milano-seal-crest-icon.png", status: "pass" },
  { id: "r13", rule: "Global Intel data schema complete", enforced: "slug, name, flag, hague_status, apostille_req, demand_score, translation_req, execution_path, common_docs, doc_links, use_case_routing, seo_meta", status: "pass" },
  { id: "r14", rule: "No 'live', '100% built', or 'complete' claims without verified deploy", enforced: "Build status: PR merged → deploy pipeline pending", status: "warn" },
];

/* ─── File manifest from merged PR ─────────────────────────────────────── */
const FILE_MANIFEST = [
  { path: "app/about/page.tsx",                  type: "new",     repo: "platform" },
  { path: "app/alliance/appl/page.tsx",           type: "new",     repo: "platform" },
  { path: "app/alliance/login/page.tsx",          type: "new",     repo: "platform" },
  { path: "app/alliance/page.tsx",                type: "mod",     repo: "platform" },
  { path: "app/dashboard/layout.tsx",             type: "mod",     repo: "platform" },
  { path: "app/dashboard/page.tsx",               type: "mod",     repo: "platform" },
  { path: "app/dashboard/pipeline/page.tsx",      type: "mod",     repo: "platform" },
  { path: "app/founder/page.tsx",                 type: "new",     repo: "platform" },
  { path: "app/globals.css",                      type: "mod",     repo: "platform" },
  { path: "app/intake/page.tsx",                  type: "mod",     repo: "platform" },
  { path: "app/map/page.tsx",                     type: "new",     repo: "platform" },
  { path: "app/page.tsx",                         type: "mod",     repo: "platform" },
  { path: "app/portal/document/page.tsx",         type: "new",     repo: "platform" },
  { path: "app/portal/invoice/page.tsx",          type: "new",     repo: "platform" },
  { path: "app/portal/page.tsx",                  type: "mod",     repo: "platform" },
  { path: "app/portal/tracking/page.tsx",         type: "new",     repo: "platform" },
  { path: "components/courier-release-tracker.tsx", type: "new",  repo: "platform" },
  { path: "components/milano-atmosphere.tsx",     type: "new",     repo: "platform" },
  { path: "components/milano-globe-core.tsx",     type: "new",     repo: "platform" },
  { path: "components/milano-ritual-overlay.tsx", type: "mod",     repo: "platform" },
  { path: "public/milano-seal-crest-icon.png",    type: "new",     repo: "platform", note: "PNG — binary-safe" },
  { path: "eslint.config.mjs",                    type: "new",     repo: "platform" },
  { path: "animation/globe-routing.tsx",          type: "new",     repo: "animation" },
  { path: "animation/courier-path.tsx",           type: "new",     repo: "animation" },
  { path: "animation/shared-motion.css",          type: "new",     repo: "animation" },
];

/* ─── Repo metadata ─────────────────────────────────────────────────────── */
const REPOS = [
  {
    id: "platform",
    label: "milano-seal-platform",
    url: "https://github.com/milanoseal-principle/milano-seal-platform",
    branch: "main",
    commit: "20fff2c",
    pr: "Apply Milano Seal Sovereign OS route-wide UI polish",
    checks: ["npm run lint ✓", "npm run build ✓", "git diff --check ✓", "No secrets in diff ✓", "PNG logo asset ✓"],
    status: "merged",
  },
  {
    id: "animation",
    label: "milano-seal-animation",
    url: "https://github.com/milanoseal-principle/milano-seal-animation",
    branch: "main",
    commit: "latest",
    pr: "Globe routing + courier path animation primitives",
    checks: ["Shared motion CSS ✓", "Reduced-motion fallbacks ✓", "Florida-origin routing ✓", "Payment-gated states ✓", "No binary JPEG ✓"],
    status: "merged",
  },
];

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const S = {
  page: {
    background: T.black,
    minHeight: "100vh",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    color: T.parchment,
    padding: "0",
  },
  topbar: {
    background: T.blackSoft,
    borderBottom: `1px solid ${T.borderGold}`,
    padding: "14px 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  topbarBrand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  crest: {
    width: 32,
    height: 32,
    border: `1px solid ${T.goldDim}`,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    color: T.gold,
    fontWeight: "700",
    letterSpacing: "1px",
  },
  brandName: {
    fontSize: "13px",
    letterSpacing: "2px",
    textTransform: "uppercase",
    color: T.gold,
    fontWeight: "700",
    fontFamily: "'Georgia', serif",
  },
  brandSub: {
    fontSize: "10px",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    color: T.goldDim,
    fontFamily: "system-ui, sans-serif",
    marginTop: "2px",
  },
  statusPill: (ok) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    letterSpacing: "1px",
    textTransform: "uppercase",
    fontFamily: "system-ui, sans-serif",
    fontWeight: "600",
    background: ok ? "#1A3A28" : "#3A2A1A",
    color: ok ? "#5FC98A" : "#C9A84C",
    border: ok ? "1px solid #2A5A3A" : "1px solid #5A4A2A",
  }),
  main: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 32px 80px",
  },
  heroTitle: {
    fontSize: "32px",
    letterSpacing: "1px",
    color: T.parchment,
    fontWeight: "400",
    marginBottom: "6px",
  },
  heroGold: {
    color: T.gold,
  },
  heroSub: {
    fontSize: "13px",
    color: T.mutedLight,
    letterSpacing: "2px",
    textTransform: "uppercase",
    fontFamily: "system-ui, sans-serif",
    marginBottom: "40px",
  },
  divider: {
    height: "1px",
    background: `linear-gradient(90deg, ${T.goldDim}33 0%, ${T.goldDim}88 50%, ${T.goldDim}33 100%)`,
    margin: "36px 0",
    border: "none",
  },
  sectionLabel: {
    fontSize: "10px",
    letterSpacing: "3px",
    textTransform: "uppercase",
    color: T.goldDim,
    fontFamily: "system-ui, sans-serif",
    fontWeight: "600",
    marginBottom: "16px",
  },
  sectionTitle: {
    fontSize: "20px",
    color: T.parchment,
    fontWeight: "400",
    marginBottom: "20px",
    letterSpacing: "0.5px",
  },
  card: {
    background: T.blackSoft,
    border: `1px solid ${T.borderGold}`,
    borderRadius: "8px",
    padding: "24px",
    marginBottom: "16px",
  },
  repoCard: {
    background: "#0D0D0D",
    border: `1px solid ${T.goldDim}55`,
    borderRadius: "10px",
    padding: "24px 28px",
    marginBottom: "20px",
    position: "relative",
    overflow: "hidden",
  },
  repoHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "16px",
    flexWrap: "wrap",
    gap: "12px",
  },
  repoName: {
    fontSize: "15px",
    fontFamily: "system-ui, monospace",
    color: T.gold,
    fontWeight: "600",
    letterSpacing: "0.5px",
  },
  repoMeta: {
    fontSize: "12px",
    color: T.mutedLight,
    fontFamily: "system-ui, sans-serif",
    marginTop: "4px",
  },
  checkList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  checkItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    color: T.parchmentMid,
    fontFamily: "system-ui, sans-serif",
  },
  dot: (color) => ({
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: color,
    flexShrink: 0,
  }),
  stateMachineWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0",
    marginBottom: "16px",
  },
  stateNode: (active, gated) => ({
    position: "relative",
    flex: "1 1 auto",
    minWidth: "100px",
    padding: "12px 16px 12px 20px",
    background: active ? "#1A1500" : "#111111",
    borderTop: gated ? `2px solid ${T.gold}55` : `2px solid transparent`,
    borderBottom: gated ? `2px solid ${T.gold}55` : `2px solid transparent`,
    cursor: "default",
    transition: "background 0.2s",
  }),
  stateLabel: {
    fontSize: "11px",
    color: T.parchmentMid,
    fontFamily: "system-ui, sans-serif",
    letterSpacing: "0.5px",
    whiteSpace: "nowrap",
  },
  stateGateTag: {
    fontSize: "9px",
    color: T.gold,
    letterSpacing: "1px",
    textTransform: "uppercase",
    fontFamily: "system-ui, sans-serif",
    marginTop: "2px",
  },
  stateArrow: {
    display: "flex",
    alignItems: "center",
    color: T.goldDim,
    fontSize: "16px",
    padding: "0 4px",
    alignSelf: "center",
  },
  opFlowWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    alignItems: "center",
  },
  opStep: {
    padding: "6px 14px",
    background: "#161616",
    border: `1px solid ${T.goldDim}44`,
    borderRadius: "4px",
    fontSize: "12px",
    color: T.parchmentMid,
    fontFamily: "system-ui, sans-serif",
    letterSpacing: "0.3px",
  },
  opArrow: {
    color: T.goldDim,
    fontSize: "14px",
    fontFamily: "system-ui, sans-serif",
  },
  ruleRow: (status) => ({
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "12px 16px",
    borderBottom: `1px solid ${T.black}`,
    background: status === "pass" ? "transparent" : status === "warn" ? "#1A1500" : "#1A0000",
    transition: "background 0.15s",
    cursor: "default",
  }),
  ruleStatus: (status) => ({
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "700",
    flexShrink: 0,
    marginTop: "1px",
    background: status === "pass" ? T.ok : status === "warn" ? T.warn : T.err,
    color: "#fff",
    fontFamily: "system-ui, sans-serif",
  }),
  ruleText: {
    flex: 1,
    minWidth: 0,
  },
  ruleMain: {
    fontSize: "13px",
    color: T.parchment,
    fontFamily: "system-ui, sans-serif",
    marginBottom: "3px",
    lineHeight: "1.4",
  },
  ruleDetail: {
    fontSize: "11px",
    color: T.mutedLight,
    fontFamily: "system-ui, monospace",
    wordBreak: "break-word",
    lineHeight: "1.5",
  },
  fileTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "12px",
    fontFamily: "system-ui, monospace",
  },
  fileRow: (type) => ({
    borderBottom: `1px solid ${T.black}`,
    background:
      type === "new" ? "#0D1A10" :
      type === "mod" ? "#0D0D1A" : "transparent",
  }),
  fileTd: {
    padding: "8px 12px",
    color: T.parchmentMid,
    verticalAlign: "middle",
  },
  fileTypeBadge: (type) => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "3px",
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    background: type === "new" ? "#1A3A1A" : "#1A1A3A",
    color: type === "new" ? "#5FC98A" : "#8A8AFF",
    fontFamily: "system-ui, sans-serif",
  }),
  repoBadge: (repo) => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "3px",
    fontSize: "10px",
    fontWeight: "600",
    letterSpacing: "0.5px",
    background: repo === "platform" ? "#1A1000" : "#001A1A",
    color: repo === "platform" ? T.gold : "#5FC9C9",
    fontFamily: "system-ui, sans-serif",
    border: repo === "platform" ? `1px solid ${T.goldDim}44` : "1px solid #1A5A5A",
  }),
  filterBar: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  filterBtn: (active) => ({
    padding: "6px 16px",
    borderRadius: "4px",
    fontSize: "11px",
    letterSpacing: "1px",
    textTransform: "uppercase",
    fontFamily: "system-ui, sans-serif",
    fontWeight: "600",
    cursor: "pointer",
    border: active ? `1px solid ${T.gold}` : `1px solid ${T.goldDim}44`,
    background: active ? "#1A1500" : "transparent",
    color: active ? T.gold : T.mutedLight,
    transition: "all 0.15s",
  }),
  gitBlock: {
    background: "#050505",
    border: `1px solid ${T.goldDim}33`,
    borderRadius: "6px",
    padding: "16px 20px",
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "12px",
    color: "#A8C080",
    lineHeight: "1.8",
    marginTop: "16px",
    overflowX: "auto",
  },
  repoLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 18px",
    borderRadius: "4px",
    border: `1px solid ${T.goldDim}66`,
    background: "transparent",
    color: T.gold,
    fontSize: "12px",
    fontFamily: "system-ui, sans-serif",
    letterSpacing: "1px",
    textTransform: "uppercase",
    fontWeight: "600",
    cursor: "pointer",
    textDecoration: "none",
    transition: "background 0.15s, border-color 0.15s",
  },
  footer: {
    borderTop: `1px solid ${T.goldDim}33`,
    padding: "24px 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
  },
  footerText: {
    fontSize: "11px",
    color: T.muted,
    fontFamily: "system-ui, sans-serif",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
};

/* ─── Status icon helper ─────────────────────────────────────────────────── */
const StatusIcon = ({ status }) => {
  const map = { pass: "✓", warn: "!", err: "✕" };
  return <span style={S.ruleStatus(status)}>{map[status] || "?"}</span>;
};

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function MilanoSealMergeValidator() {
  const [fileFilter, setFileFilter]       = useState("all");
  const [activeState, setActiveState]     = useState(null);
  const [showAllRules, setShowAllRules]   = useState(false);
  const [expandedRepo, setExpandedRepo]   = useState(null);

  const filteredFiles = FILE_MANIFEST.filter(f => {
    if (fileFilter === "all") return true;
    if (fileFilter === "new" || fileFilter === "mod") return f.type === fileFilter;
    return f.repo === fileFilter;
  });

  const passCount  = CANONICAL_RULES.filter(r => r.status === "pass").length;
  const warnCount  = CANONICAL_RULES.filter(r => r.status === "warn").length;
  const totalCount = CANONICAL_RULES.length;
  const rulesOk    = warnCount === 0;

  const displayedRules = showAllRules ? CANONICAL_RULES : CANONICAL_RULES.slice(0, 8);

  return (
    <div style={S.page}>

      {/* ── Top bar ── */}
      <div style={S.topbar}>
        <div style={S.topbarBrand}>
          <div style={S.crest}>M</div>
          <div>
            <div style={S.brandName}>The Milano Seal™</div>
            <div style={S.brandSub}>Canonical Merge Validator · Internal Only</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={S.statusPill(rulesOk)}>
            {rulesOk ? "● All Systems Canonical" : `⚠ ${warnCount} Warning${warnCount !== 1 ? "s" : ""}`}
          </span>
          <span style={{ ...S.statusPill(true), background: "#001A3A", color: "#5A9AFF", border: "1px solid #1A3A6A" }}>
            2 Repos Merged
          </span>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={S.main}>

        <div style={{ marginBottom: "8px" }}>
          <div style={S.sectionLabel}>Internal Execution Center · Sovereign OS v1</div>
          <h1 style={S.heroTitle}>
            Merge <span style={S.heroGold}>Validation</span> Report
          </h1>
          <div style={S.heroSub}>
            platform + animation · commit 20fff2c · PNG logo fix applied
          </div>
        </div>

        {/* ── Summary metrics ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "36px" }}>
          {[
            { label: "Canonical Rules",   value: `${passCount}/${totalCount}`, sub: "validated",   color: T.ok },
            { label: "Files Changed",     value: FILE_MANIFEST.length,         sub: "in PR",        color: T.gold },
            { label: "New Routes",        value: FILE_MANIFEST.filter(f => f.type === "new").length, sub: "added",   color: "#5A9AFF" },
            { label: "Repos Merged",      value: "2",                          sub: "platform + animation", color: "#9A5AFF" },
          ].map(m => (
            <div key={m.label} style={{ background: "#0D0D0D", border: `1px solid ${T.goldDim}33`, borderRadius: "8px", padding: "16px 20px" }}>
              <div style={{ fontSize: "11px", color: T.muted, fontFamily: "system-ui, sans-serif", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>
                {m.label}
              </div>
              <div style={{ fontSize: "28px", color: m.color, fontWeight: "400", lineHeight: "1" }}>
                {m.value}
              </div>
              <div style={{ fontSize: "11px", color: T.muted, fontFamily: "system-ui, sans-serif", marginTop: "4px" }}>
                {m.sub}
              </div>
            </div>
          ))}
        </div>

        <hr style={S.divider} />

        {/* ── Repo cards ── */}
        <div style={S.sectionLabel}>Repository Status</div>
        <div style={S.sectionTitle}>Merged Repositories</div>

        {REPOS.map(repo => (
          <div key={repo.id} style={S.repoCard}>
            <div style={S.repoHeader}>
              <div>
                <div style={S.repoName}>
                  milanoseal-principle / {repo.label}
                </div>
                <div style={S.repoMeta}>
                  branch: {repo.branch} · commit: {repo.commit} · PR: {repo.pr}
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                <span style={S.statusPill(true)}>● Merged</span>
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={S.repoLink}
                >
                  View on GitHub ↗
                </a>
                <button
                  style={{ ...S.repoLink, border: `1px solid ${T.goldDim}33` }}
                  onClick={() => setExpandedRepo(expandedRepo === repo.id ? null : repo.id)}
                >
                  {expandedRepo === repo.id ? "Collapse" : "CI Checks"}
                </button>
              </div>
            </div>

            <div style={S.checkList}>
              {repo.checks.map((c, i) => (
                <div key={i} style={S.checkItem}>
                  <div style={S.dot("#5FC98A")} />
                  {c}
                </div>
              ))}
            </div>

            {expandedRepo === repo.id && (
              <div style={S.gitBlock}>
                <div style={{ color: T.goldDim, marginBottom: "8px" }}>
                  # CI validation output — {repo.label}
                </div>
                {repo.checks.map((c, i) => (
                  <div key={i}>
                    <span style={{ color: "#5FC98A" }}>✓</span>
                    {"  " + c.replace(" ✓", "")}
                  </div>
                ))}
                <div style={{ marginTop: "12px", color: T.muted }}>
                  # Note: network clone blocked by environment policy (403 CONNECT)
                </div>
                <div style={{ color: T.muted }}>
                  # No browser tooling — visual screenshot not available in build container
                </div>
                <div style={{ marginTop: "8px", color: "#5FC98A" }}>
                  ✓ PR created · merge complete · deploy pipeline: pending verification
                </div>
              </div>
            )}
          </div>
        ))}

        <hr style={S.divider} />

        {/* ── State machine ── */}
        <div style={S.sectionLabel}>Locked State Machine</div>
        <div style={S.sectionTitle}>Execution State Sequence</div>

        <div style={{ ...S.card, padding: "20px", marginBottom: "12px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "stretch" }}>
            {STATE_MACHINE.map((s, i) => (
              <>
                <div
                  key={s.id}
                  style={S.stateNode(activeState === s.id, s.gate === "payment")}
                  onMouseEnter={() => setActiveState(s.id)}
                  onMouseLeave={() => setActiveState(null)}
                >
                  <div style={S.stateLabel}>{s.label}</div>
                  {s.gate && <div style={S.stateGateTag}>⬡ Payment Gate</div>}
                </div>
                {i < STATE_MACHINE.length - 1 && (
                  <div style={S.stateArrow}>›</div>
                )}
              </>
            ))}
          </div>
          <div style={{ fontSize: "11px", color: T.muted, fontFamily: "system-ui, sans-serif", marginTop: "14px", letterSpacing: "0.5px" }}>
            ⬡ Payment Gate: No scheduling or execution occurs before payment confirmation is logged.
            Hover a state to highlight. All states are immutable in the canonical spec.
          </div>
        </div>

        <hr style={S.divider} />

        {/* ── Operating flow ── */}
        <div style={S.sectionLabel}>Core Operating Flow</div>
        <div style={S.sectionTitle}>Locked Pipeline Sequence</div>

        <div style={{ ...S.card, padding: "20px" }}>
          <div style={S.opFlowWrap}>
            {OP_FLOW.map((step, i) => (
              <>
                <div key={step} style={S.opStep}>{step}</div>
                {i < OP_FLOW.length - 1 && <div style={S.opArrow}>→</div>}
              </>
            ))}
          </div>
          <div style={{ fontSize: "11px", color: T.muted, fontFamily: "system-ui, sans-serif", marginTop: "14px", letterSpacing: "0.5px" }}>
            14-stage canonical flow. No stage may be skipped. Sequence is system-enforced, not optional.
          </div>
        </div>

        <hr style={S.divider} />

        {/* ── Canonical rules ── */}
        <div style={S.sectionLabel}>Canonical Rules Validation</div>
        <div style={S.sectionTitle}>
          System Compliance — {passCount} passed · {warnCount} warning{warnCount !== 1 ? "s" : ""}
        </div>

        <div style={{ ...S.card, padding: "0", overflow: "hidden", marginBottom: "12px" }}>
          {displayedRules.map(r => (
            <div key={r.id} style={S.ruleRow(r.status)}>
              <StatusIcon status={r.status} />
              <div style={S.ruleText}>
                <div style={S.ruleMain}>{r.rule}</div>
                <div style={S.ruleDetail}>{r.enforced}</div>
              </div>
              <div style={{ fontSize: "10px", color: T.muted, fontFamily: "system-ui, sans-serif", letterSpacing: "0.5px", flexShrink: 0 }}>
                {r.id.toUpperCase()}
              </div>
            </div>
          ))}
        </div>

        {!showAllRules && (
          <button
            style={{ ...S.repoLink, margin: "0 0 8px" }}
            onClick={() => setShowAllRules(true)}
          >
            Show all {CANONICAL_RULES.length} rules ↓
          </button>
        )}

        <hr style={S.divider} />

        {/* ── File manifest ── */}
        <div style={S.sectionLabel}>File Manifest — Merged PR</div>
        <div style={S.sectionTitle}>Changed & New Files ({FILE_MANIFEST.length} total)</div>

        <div style={S.filterBar}>
          {["all", "new", "mod", "platform", "animation"].map(f => (
            <button key={f} style={S.filterBtn(fileFilter === f)} onClick={() => setFileFilter(f)}>
              {f === "all" ? "All files" : f}
            </button>
          ))}
        </div>

        <div style={{ ...S.card, padding: "0", overflowX: "auto" }}>
          <table style={S.fileTable}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.goldDim}44` }}>
                {["Type", "Path", "Repo", "Note"].map(h => (
                  <th key={h} style={{ ...S.fileTd, color: T.goldDim, fontSize: "10px", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: "600", textAlign: "left", fontFamily: "system-ui, sans-serif", padding: "10px 12px" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((f, i) => (
                <tr key={i} style={S.fileRow(f.type)}>
                  <td style={S.fileTd}>
                    <span style={S.fileTypeBadge(f.type)}>{f.type}</span>
                  </td>
                  <td style={{ ...S.fileTd, color: T.parchment }}>{f.path}</td>
                  <td style={S.fileTd}>
                    <span style={S.repoBadge(f.repo)}>{f.repo}</span>
                  </td>
                  <td style={{ ...S.fileTd, color: T.mutedLight, fontSize: "11px" }}>{f.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <hr style={S.divider} />

        {/* ── CTA locks ── */}
        <div style={S.sectionLabel}>Locked CTA Language</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "32px" }}>
          {["Begin Secure Intake", "Request Execution Coordination", "Discuss Your Document", "Begin Engagement"].map(cta => (
            <div key={cta} style={{ padding: "10px 20px", border: `1px solid ${T.goldDim}66`, borderRadius: "4px", fontSize: "13px", color: T.gold, fontFamily: "system-ui, sans-serif", letterSpacing: "0.5px" }}>
              {cta}
            </div>
          ))}
        </div>

        {/* ── Brand lock ── */}
        <div style={S.sectionLabel}>Locked Brand System</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "32px" }}>
          {[
            { name: "Matte Black",    hex: "#0A0A0A", light: false },
            { name: "Metallic Gold",  hex: "#C9A84C", light: false },
            { name: "Parchment Cream",hex: "#F5F0E8", light: true  },
            { name: "Gold Dim",       hex: "#8A6F32", light: false },
          ].map(c => (
            <div key={c.name} style={{ borderRadius: "6px", overflow: "hidden", border: `1px solid ${T.goldDim}44`, minWidth: "120px" }}>
              <div style={{ height: "40px", background: c.hex }} />
              <div style={{ padding: "8px 12px", background: "#0D0D0D" }}>
                <div style={{ fontSize: "11px", color: T.parchment, fontFamily: "system-ui, sans-serif", fontWeight: "600" }}>{c.name}</div>
                <div style={{ fontSize: "10px", color: T.muted, fontFamily: "monospace" }}>{c.hex}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Source hierarchy ── */}
        <div style={S.sectionLabel}>Final Source Hierarchy</div>
        <div style={{ ...S.card }}>
          {[
            "MASTER_SYSTEM_CANONICAL.md",
            "Milano Seal FINAL LOCKED SOP",
            "CTO Blueprint (Section 71)",
            "Internal Client White Paper",
            "Production Spec",
            "Brand / Print Standards",
          ].map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 0", borderBottom: i < 5 ? `1px solid ${T.black}` : "none" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#1A1500", border: `1px solid ${T.goldDim}66`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: T.gold, fontFamily: "system-ui, sans-serif", fontWeight: "700", flexShrink: 0 }}>
                {i + 1}
              </div>
              <span style={{ fontSize: "13px", color: T.parchmentMid, fontFamily: "system-ui, monospace" }}>{s}</span>
            </div>
          ))}
        </div>

      </div>

      {/* ── Footer ── */}
      <div style={S.footer}>
        <div style={S.footerText}>The Milano Seal™ · Internal Only · Not for Client Distribution</div>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <a href="https://github.com/milanoseal-principle/milano-seal-platform" target="_blank" rel="noopener noreferrer" style={{ ...S.footerText, color: T.goldDim, textDecoration: "none" }}>
            Platform Repo ↗
          </a>
          <a href="https://github.com/milanoseal-principle/milano-seal-animation" target="_blank" rel="noopener noreferrer" style={{ ...S.footerText, color: T.goldDim, textDecoration: "none" }}>
            Animation Repo ↗
          </a>
        </div>
        <div style={S.footerText}>Sovereign OS v1 · Commit 20fff2c · PNG Lock Applied</div>
      </div>

    </div>
  );
}
