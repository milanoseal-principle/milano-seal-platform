export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Review Engine — Milano Seal",
};

export default async function ReviewsPage() {
  await requireDashboardAccess();

  const supabase = createAdminClient();

  let completedCount = 0;

  try {
    const { count } = await supabase
      .from("deals")
      .select("*", { count: "exact", head: true })
      .eq("matter_status", "completed");

    completedCount = count ?? 0;
  } catch {}

  const cardStyle: React.CSSProperties = {
    background: "rgba(8,5,1,0.97)",
    border: "1px solid rgba(212,175,55,0.08)",
    borderRadius: 8,
    padding: "24px",
  };

  const pendingBadge = (
    <span style={{
      fontSize: 10,
      fontFamily: "monospace",
      color: "#f59e0b",
      background: "rgba(245,158,11,0.08)",
      border: "1px solid rgba(245,158,11,0.2)",
      borderRadius: 4,
      padding: "2px 8px",
    }}>
      Pending Integration
    </span>
  );

  const TESTIMONIAL_SCRIPT = `Hi [CLIENT_NAME], thank you for trusting Milano Seal for your [DOCUMENT_TYPE] apostille. Your experience matters to us — if you have a moment, a Google review helps other clients find us: [LINK]`;

  return (
    <div style={{ padding: "32px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 4px" }}>
          MILANO SEAL / REVIEW ENGINE
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)", margin: "0 0 32px" }}>
          Review Engine
        </h1>

        {/* Platform cards */}
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 12px" }}>
          REVIEW PLATFORMS
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 32 }}>
          {/* Google */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)", margin: 0 }}>Google Business Profile</p>
              {pendingBadge}
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0, fontFamily: "monospace" }}>
              Connect via Google Business API
            </p>
          </div>

          {/* Trustpilot */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)", margin: 0 }}>Trustpilot</p>
              {pendingBadge}
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0, fontFamily: "monospace" }}>
              Trustpilot Business integration pending
            </p>
          </div>

          {/* Facebook */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)", margin: 0 }}>Facebook</p>
              {pendingBadge}
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0, fontFamily: "monospace" }}>
              Facebook Page Reviews — pending integration
            </p>
          </div>

          {/* Direct Testimonials */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)", margin: 0 }}>Direct Testimonials</p>
              <span style={{
                fontSize: 10,
                fontFamily: "monospace",
                color: "#4a9e6b",
                background: "rgba(74,158,107,0.08)",
                border: "1px solid rgba(74,158,107,0.25)",
                borderRadius: 4,
                padding: "2px 8px",
              }}>
                Active
              </span>
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: "#C6A55A", margin: "0 0 4px", fontFamily: "monospace" }}>
              {completedCount}
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0, fontFamily: "monospace" }}>
              Matters eligible for testimonial request
            </p>
          </div>
        </div>

        {/* Testimonial request script */}
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 10px" }}>
          TESTIMONIAL REQUEST SCRIPT
        </p>
        <div style={{
          background: "rgba(8,5,1,0.97)",
          border: "1px solid rgba(212,175,55,0.08)",
          borderRadius: 8,
          padding: "20px 24px",
        }}>
          <p style={{ fontSize: 11, fontFamily: "monospace", color: "rgba(198,165,90,0.5)", margin: "0 0 10px", letterSpacing: "0.1em" }}>
            COPY TEMPLATE
          </p>
          <p style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.75)",
            margin: 0,
            lineHeight: 1.7,
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
          }}>
            {TESTIMONIAL_SCRIPT}
          </p>
        </div>
      </div>
    </div>
  );
}
