export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";

export const metadata = {
  title: "Asset Vault — Milano Seal",
};

const ASSET_CATEGORIES = [
  {
    category: "Brand",
    items: ["Logos", "Wordmarks", "Color Palette", "Typography"],
  },
  {
    category: "Founder",
    items: ["Founder Cards", "Headshots", "Bio Templates"],
  },
  {
    category: "Video",
    items: ["Brand Reels", "Process Explainers", "Testimonial Captures"],
  },
  {
    category: "Documents",
    items: ["Pitch Decks", "Service Menus", "Rate Cards", "Partnership One-Pagers"],
  },
  {
    category: "Templates",
    items: ["Email Templates", "Contract Templates", "Invoice Templates"],
  },
];

export default async function AssetsPage() {
  await requireDashboardAccess();

  return (
    <div style={{ padding: "32px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 4px" }}>
          MILANO SEAL / ASSET VAULT
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)", margin: "0 0 8px" }}>
          Asset Vault
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 32px", fontFamily: "monospace" }}>
          Asset management requires Google Drive integration. Contact operator to configure.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {ASSET_CATEGORIES.map((cat) => (
            <div
              key={cat.category}
              style={{
                background: "rgba(8,5,1,0.97)",
                border: "1px solid rgba(212,175,55,0.08)",
                borderRadius: 8,
                padding: "20px 22px",
              }}
            >
              <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 12px" }}>
                {cat.category}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {cat.items.map((item) => (
                  <div
                    key={item}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      background: "rgba(255,255,255,0.02)",
                      borderRadius: 4,
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{item}</span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>—</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0, fontFamily: "monospace" }}>
                Assets stored in Google Drive. Link drive folder here.
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
