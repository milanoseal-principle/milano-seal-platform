import Link from "next/link";
import { AllianceMotionHero } from "@/components/alliance/AllianceMotionHero";
import { FileText, GitBranch, Eye, ShieldCheck, Users, Wrench } from "lucide-react";

export const metadata = {
  title: "Global Execution Alliance | The Milano Seal™",
  description:
    "Partner infrastructure for international document execution, apostille coordination, referral visibility, and controlled client handoff.",
};

const WHO_ITS_FOR = [
  {
    title: "Immigration Attorneys",
    description: "Refer clients requiring foreign document authentication, apostilles, or legalization for visa and residency applications.",
  },
  {
    title: "Notary Operators",
    description: "Coordinate notarizations, remote online notarizations, and document execution for international matters.",
  },
  {
    title: "Relocation Firms",
    description: "Manage document requirements for clients relocating internationally — from birth certificates to corporate records.",
  },
  {
    title: "Real Estate Professionals",
    description: "Support cross-border property transactions requiring authenticated powers of attorney and foreign-language documents.",
  },
];

const REFERRAL_STEPS = [
  { step: "01", label: "Submit a Referral", desc: "Use the partner portal to submit a client matter with destination country, document type, and matter context." },
  { step: "02", label: "Milano Seal Reviews", desc: "The operations team reviews the referral, assesses feasibility, and accepts or declines within 1–2 business days." },
  { step: "03", label: "Execution Begins", desc: "Accepted matters enter the Milano Seal execution queue. The partner receives a partner-safe status update, not internal detail." },
  { step: "04", label: "Commission Recorded", desc: "Upon completion, commission eligibility is reviewed and recorded. Payouts are processed manually on a scheduled basis." },
];

const WHAT_PARTNERS_SEE = [
  "Partner-safe matter status (not internal processing detail)",
  "Referral submission history and reference IDs",
  "Commission status: Not Eligible, Pending Review, Approved, Paid, or On Hold",
  "Your intake link performance (click count, active links)",
  "Compliance and Tool Belt readiness indicators",
  "No client documents. No internal margin. No other partners' data.",
];

const TOOLBELT_OVERVIEW = [
  { icon: Users, label: "Identity", desc: "Verify professional identity and legal standing." },
  { icon: FileText, label: "Service Scope", desc: "Define jurisdictions and document categories." },
  { icon: ShieldCheck, label: "Compliance", desc: "Confirm Alliance SOPs and data handling standards." },
  { icon: Wrench, label: "Security Attestation", desc: "Attest to your security controls and incident response readiness." },
  { icon: GitBranch, label: "Referral Routing", desc: "Understand referral workflows and partner-safe handoff procedures." },
  { icon: Eye, label: "Routing Eligibility", desc: "Complete readiness review to activate matter routing." },
];

const sectionHeadStyle: React.CSSProperties = {
  fontSize: 11,
  fontFamily: "monospace",
  letterSpacing: "0.28em",
  textTransform: "uppercase",
  color: "rgba(198,166,91,0.6)",
  marginBottom: 12,
};

const h2Style: React.CSSProperties = {
  fontSize: "clamp(20px,3.5vw,30px)",
  fontWeight: 300,
  fontFamily: "var(--font-playfair, Georgia, serif)",
  color: "#F6F1E6",
  margin: "0 0 16px",
};

const cardStyle: React.CSSProperties = {
  padding: "24px",
  background: "#0d0d0d",
  border: "1px solid rgba(198,166,91,0.12)",
  borderRadius: 8,
};

export default function AlliancePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#F6F1E6" }}>
      {/* Hero */}
      <AllianceMotionHero />

      {/* CTA bar */}
      <div style={{ textAlign: "center", padding: "32px 24px", borderBottom: "1px solid rgba(198,166,91,0.08)" }}>
        <Link
          href="/alliance/login"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 32px",
            background: "rgba(198,166,91,0.12)",
            border: "1px solid rgba(198,166,91,0.35)",
            borderRadius: 4,
            color: "#C6A55A",
            fontSize: 13,
            fontFamily: "monospace",
            letterSpacing: "0.12em",
            textDecoration: "none",
            textTransform: "uppercase",
          }}
        >
          Request Alliance Access →
        </Link>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px", display: "flex", flexDirection: "column", gap: 80 }}>

        {/* Who it's for */}
        <section>
          <p style={sectionHeadStyle}>Who It&apos;s For</p>
          <h2 style={h2Style}>Built for International Practice Professionals</h2>
          <p style={{ fontSize: 14, color: "#A8A29A", maxWidth: 560, lineHeight: 1.7, marginBottom: 32 }}>
            The Milano Seal Alliance is a B2B partner infrastructure layer for professionals who refer or coordinate international document execution matters on behalf of their clients.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {WHO_ITS_FOR.map((item) => (
              <div key={item.title} style={cardStyle}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#F6F1E6", marginBottom: 8 }}>{item.title}</div>
                <p style={{ fontSize: 13, color: "#A8A29A", lineHeight: 1.6, margin: 0 }}>{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How referrals work */}
        <section>
          <p style={sectionHeadStyle}>How Referrals Work</p>
          <h2 style={h2Style}>A Structured Referral Process</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {REFERRAL_STEPS.map((step) => (
              <div
                key={step.step}
                style={{
                  display: "flex",
                  gap: 24,
                  padding: "20px 24px",
                  background: "#0d0d0d",
                  border: "1px solid rgba(198,166,91,0.1)",
                  borderRadius: 8,
                  alignItems: "flex-start",
                }}
              >
                <span style={{ fontSize: 18, fontFamily: "monospace", fontWeight: 700, color: "rgba(198,166,91,0.4)", flexShrink: 0, lineHeight: 1.3 }}>
                  {step.step}
                </span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#F6F1E6", marginBottom: 6 }}>{step.label}</div>
                  <p style={{ fontSize: 13, color: "#A8A29A", lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* What partners see */}
        <section>
          <p style={sectionHeadStyle}>What Partners See</p>
          <h2 style={h2Style}>Visibility Without Exposure</h2>
          <p style={{ fontSize: 14, color: "#A8A29A", maxWidth: 560, lineHeight: 1.7, marginBottom: 24 }}>
            Partners have access to everything needed to track their referred matters and commissions — and nothing more. Internal processing detail, pricing, and other partners&apos; data are never exposed.
          </p>
          <div style={cardStyle}>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {WHAT_PARTNERS_SEE.map((item) => (
                <li
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    fontSize: 13,
                    color: "#F6F1E6",
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#C6A55A", flexShrink: 0, marginTop: 7 }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Tool Belt overview */}
        <section>
          <p style={sectionHeadStyle}>Execution Partner Toolkit™</p>
          <h2 style={h2Style}>The Alliance Onboarding Framework</h2>
          <p style={{ fontSize: 14, color: "#A8A29A", maxWidth: 560, lineHeight: 1.7, marginBottom: 32 }}>
            Partners progress through a structured readiness framework before receiving referred matters. Each module unlocks in sequence based on completion status.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {TOOLBELT_OVERVIEW.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={item.label} style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: "rgba(198,166,91,0.06)", border: "1px solid rgba(198,166,91,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={15} color="#C6A55A" />
                    </div>
                    <span style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(198,166,91,0.4)" }}>{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#F6F1E6", marginBottom: 6 }}>{item.label}</div>
                    <p style={{ fontSize: 12, color: "#A8A29A", lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom CTA */}
        <section style={{ textAlign: "center" }}>
          <p style={{ ...sectionHeadStyle, textAlign: "center" }}>Apply to Join</p>
          <h2 style={{ ...h2Style, textAlign: "center" }}>Ready to Become an Alliance Partner?</h2>
          <p style={{ fontSize: 14, color: "#A8A29A", maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.7 }}>
            Alliance membership is by invitation and review only. Contact the Milano Seal team to begin the application process.
          </p>
          <Link
            href="/alliance/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 36px",
              background: "rgba(198,166,91,0.12)",
              border: "1px solid rgba(198,166,91,0.35)",
              borderRadius: 4,
              color: "#C6A55A",
              fontSize: 13,
              fontFamily: "monospace",
              letterSpacing: "0.12em",
              textDecoration: "none",
              textTransform: "uppercase",
            }}
          >
            Request Alliance Access →
          </Link>
        </section>
      </div>
    </div>
  );
}
