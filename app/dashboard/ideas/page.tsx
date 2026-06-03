"use client";

type IdeaStatus = "Idea" | "Evaluating" | "Planned";
type IdeaCategory = "Revenue" | "Product" | "System";

interface Idea {
  title: string;
  description: string;
  category: IdeaCategory;
  status: IdeaStatus;
}

const IDEAS: Idea[] = [
  // Revenue
  {
    title: "Subscription Apostille Monitoring",
    description: "Monthly subscription for clients with recurring international document needs — automatic alerts when apostille requirements change for their countries.",
    category: "Revenue",
    status: "Idea",
  },
  {
    title: "Document Bundle Packages",
    description: "Pre-packaged bundles for common scenarios (Italian citizenship, immigration, estate). Single price, faster intake, higher average deal value.",
    category: "Revenue",
    status: "Evaluating",
  },
  {
    title: "Embassy Liaison Service",
    description: "Premium add-on for direct embassy coordination — scheduling, submission, and tracking handled entirely by Milano Seal.",
    category: "Revenue",
    status: "Idea",
  },
  // Product
  {
    title: "Mobile Client Portal",
    description: "Lightweight mobile experience for clients to track matter status, upload documents, and receive notifications.",
    category: "Product",
    status: "Planned",
  },
  {
    title: "Automated Status SMS",
    description: "Trigger SMS updates at each matter stage milestone — intake, payment, execution, apostille, completion.",
    category: "Product",
    status: "Evaluating",
  },
  {
    title: "Batch Processing for Law Firms",
    description: "Law firm dashboard to submit multiple client matters at once, with bulk pricing and grouped tracking.",
    category: "Product",
    status: "Idea",
  },
  // System
  {
    title: "Webhook Retry Queue",
    description: "Robust retry logic for failed webhook deliveries (payment confirmations, status updates) with dead-letter logging.",
    category: "System",
    status: "Planned",
  },
  {
    title: "Automated Wise Reconciliation Alerts",
    description: "Daily reconciliation between Wise payment records and Supabase deals — flag mismatches automatically.",
    category: "System",
    status: "Evaluating",
  },
  {
    title: "Supabase Realtime Matter Updates",
    description: "Use Supabase Realtime subscriptions so the dashboard reflects matter status changes instantly without polling.",
    category: "System",
    status: "Planned",
  },
];

const CATEGORY_COLORS: Record<IdeaCategory, { color: string; bg: string }> = {
  Revenue: { color: "#4a9e6b", bg: "rgba(74,158,107,0.08)" },
  Product: { color: "#C6A55A", bg: "rgba(198,165,90,0.08)" },
  System: { color: "#a78bfa", bg: "rgba(167,139,250,0.08)" },
};

const STATUS_COLORS: Record<IdeaStatus, { color: string; bg: string }> = {
  Idea: { color: "rgba(255,255,255,0.35)", bg: "rgba(255,255,255,0.04)" },
  Evaluating: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  Planned: { color: "#4a9e6b", bg: "rgba(74,158,107,0.08)" },
};

const CATEGORIES: IdeaCategory[] = ["Revenue", "Product", "System"];

function IdeaCard({ idea }: { idea: Idea }) {
  const cat = CATEGORY_COLORS[idea.category];
  const stat = STATUS_COLORS[idea.status];

  return (
    <div
      style={{
        background: "rgba(8,5,1,0.97)",
        border: "1px solid rgba(212,175,55,0.08)",
        borderRadius: 6,
        padding: "16px 18px",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.88)", lineHeight: 1.3 }}>
          {idea.title}
        </p>
        <span
          style={{
            fontSize: 9,
            fontFamily: "monospace",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            padding: "2px 8px",
            borderRadius: 4,
            color: stat.color,
            background: stat.bg,
            border: `1px solid ${stat.color}33`,
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          {idea.status}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
        {idea.description}
      </p>
    </div>
  );
}

export default function IdeasPage() {
  return (
    <div style={{ padding: "32px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p
          style={{
            fontFamily: "monospace",
            fontSize: 9,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "rgba(198,165,90,0.5)",
            margin: "0 0 4px",
          }}
        >
          MILANO SEAL / OPERATOR WORKSPACE
        </p>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "rgba(255,255,255,0.92)",
            margin: "0 0 8px",
          }}
        >
          Product, Revenue &amp; System Ideas
        </h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: "0 0 36px" }}>
          Operator idea bank. Update statuses as ideas progress to evaluation or planning.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          {CATEGORIES.map((cat) => {
            const catStyle = CATEGORY_COLORS[cat];
            const catIdeas = IDEAS.filter((i) => i.category === cat);
            return (
              <div key={cat}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: catStyle.color,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 9,
                      letterSpacing: "0.3em",
                      textTransform: "uppercase",
                      color: catStyle.color,
                    }}
                  >
                    {cat}
                  </span>
                  <span style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.2)" }}>
                    ({catIdeas.length})
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {catIdeas.map((idea) => (
                    <IdeaCard key={idea.title} idea={idea} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
