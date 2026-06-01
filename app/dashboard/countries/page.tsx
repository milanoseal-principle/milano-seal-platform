import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { CountryOpsCenter } from "@/components/dashboard/CountryOpsCenter";

export const metadata = {
  title: "Country Operations — Milano Seal",
};

export default async function CountriesPage() {
  await requireDashboardAccess();
  return (
    <div style={{ minHeight: "100vh", background: "#050507", padding: "32px 40px", color: "rgba(255,255,255,0.75)" }}>
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontSize: 9,
            fontFamily: "monospace",
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "rgba(198,165,90,0.5)",
            marginBottom: 6,
          }}
        >
          Milano Seal — Intelligence
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.9)", margin: 0 }}>
          Country Operations Center
        </h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: "4px 0 0" }}>
          Destination country performance, revenue, and execution health.
        </p>
      </div>
      <CountryOpsCenter />
    </div>
  );
}
