export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { DOCUMENTS } from "@/components/landing/document-intelligence";

export const metadata = {
  title: "Document Classification — Milano Seal",
};

const STATIC_DOCS = [
  { name: "Power of Attorney", category: "Legal Authority", apostille_eligible: true, translation_typically_required: true, notes: "Most common for foreign property and legal matters." },
  { name: "Birth Certificate", category: "Vital Records", apostille_eligible: true, translation_typically_required: true, notes: "Required for citizenship and residency applications." },
  { name: "Marriage Certificate", category: "Vital Records", apostille_eligible: true, translation_typically_required: true, notes: "May require name match affidavit." },
  { name: "FBI Background Check", category: "Government / Law Enforcement", apostille_eligible: true, translation_typically_required: false, notes: "Used for immigration and residency visas." },
  { name: "Corporate Resolution", category: "Corporate", apostille_eligible: true, translation_typically_required: false, notes: "Common for international business filings." },
  { name: "Name Discrepancy Affidavit", category: "Affidavit", apostille_eligible: true, translation_typically_required: true, notes: "Required when name variations exist across documents." },
  { name: "General Affidavit", category: "Affidavit", apostille_eligible: true, translation_typically_required: true, notes: "Flexible sworn statement for various uses." },
  { name: "Estate / Inheritance Document", category: "Estate", apostille_eligible: true, translation_typically_required: true, notes: "Complex — often requires attorney coordination." },
];

// Build enriched list from DOCUMENTS constant, supplementing with static data
const enriched = DOCUMENTS.map((doc) => {
  const matched = STATIC_DOCS.find(
    (s) => s.name.toLowerCase().includes(doc.label.toLowerCase().split(" ")[0].toLowerCase())
  );
  return {
    name: doc.label,
    category: matched?.category ?? "General",
    apostille_eligible: matched?.apostille_eligible ?? true,
    translation_typically_required: matched?.translation_typically_required ?? false,
    notes: matched?.notes ?? "See country intelligence for requirements.",
    countries: doc.countries,
    bundle: doc.bundle,
  };
});

const Chip = ({ active, label, activeColor }: { active: boolean; label: string; activeColor: string }) => (
  <span
    style={{
      fontSize: 10,
      fontFamily: "monospace",
      padding: "2px 8px",
      borderRadius: 4,
      color: active ? activeColor : "rgba(255,255,255,0.35)",
      background: active ? `${activeColor}18` : "rgba(255,255,255,0.04)",
      border: `1px solid ${active ? activeColor + "33" : "rgba(255,255,255,0.06)"}`,
    }}
  >
    {label}
  </span>
);

export default async function DocumentsPage() {
  await requireDashboardAccess();

  return (
    <div style={{ padding: "32px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 4px" }}>
          MILANO SEAL / DOCUMENT REGISTRY
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)", margin: "0 0 8px" }}>
          Global Document Classification System
        </h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: "0 0 32px" }}>
          {enriched.length} document types tracked
        </p>

        <div style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Document Name", "Category", "Apostille Eligible", "Translation Req.", "Common Destinations", "Notes"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 16px",
                        textAlign: "left",
                        fontFamily: "monospace",
                        fontSize: 9,
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                        color: "rgba(198,165,90,0.5)",
                        borderBottom: "1px solid rgba(212,175,55,0.08)",
                        fontWeight: 400,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enriched.map((doc) => (
                  <tr key={doc.name} style={{ borderBottom: "1px solid rgba(212,175,55,0.04)" }}>
                    <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 500 }}>{doc.name}</td>
                    <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{doc.category}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <Chip active={doc.apostille_eligible} label={doc.apostille_eligible ? "YES" : "NO"} activeColor="#4a9e6b" />
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Chip active={doc.translation_typically_required} label={doc.translation_typically_required ? "YES" : "NO"} activeColor="#f59e0b" />
                    </td>
                    <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                      {doc.countries.slice(0, 3).join(", ")}{doc.countries.length > 3 ? ` +${doc.countries.length - 3}` : ""}
                    </td>
                    <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.35)", fontSize: 12 }}>{doc.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
