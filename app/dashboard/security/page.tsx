import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  await requireDashboardAccess();

  const supabase = await createClient();

  // Query audit_events — requires migration 001_audit_security_events.sql applied
  const { data: auditRows, error: auditError } = await supabase
    .from("audit_events")
    .select("id, event_type, user_id, created_at, metadata")
    .order("created_at", { ascending: false })
    .limit(50);

  const tablesMissing =
    auditError?.code === "42P01" || // relation does not exist
    auditError?.message?.includes("does not exist");

  return (
    <div style={{ padding: "32px 24px", maxWidth: 900, margin: "0 auto" }}>
      <h1
        style={{
          fontFamily: "var(--font-playfair, Georgia, serif)",
          fontSize: 22,
          fontWeight: 400,
          color: "rgba(255,255,255,.9)",
          marginBottom: 6,
        }}
      >
        Security Center
      </h1>
      <p
        style={{
          fontSize: 12,
          color: "rgba(255,255,255,.4)",
          marginBottom: 32,
        }}
      >
        Audit events, session activity, and access monitoring.
      </p>

      {tablesMissing ? (
        <div
          style={{
            padding: "24px",
            background: "rgba(198,165,90,.04)",
            border: "1px solid rgba(198,165,90,.18)",
            borderRadius: 3,
            color: "rgba(255,255,255,.55)",
            fontSize: 13,
          }}
        >
          Security audit logging is not yet configured.
          <br />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 8, display: "block" }}>
            Apply <code>supabase/migrations/001_audit_security_events.sql</code> to enable audit event tracking.
          </span>
        </div>
      ) : (
        <SecurityCenter rows={auditRows ?? []} />
      )}
    </div>
  );
}

type AuditRow = {
  id: string;
  event_type: string;
  user_id: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

function SecurityCenter({ rows }: { rows: AuditRow[] }) {
  const magicLinkEvents = rows.filter(
    (r) =>
      r.event_type?.includes("magic") ||
      r.event_type?.includes("otp") ||
      r.event_type?.includes("magic_link")
  );
  const failedEvents = rows.filter(
    (r) =>
      r.event_type?.includes("failed") ||
      r.event_type?.includes("denied") ||
      r.event_type?.includes("invalid")
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { label: "Total Audit Events", value: rows.length },
          { label: "Failed / Denied", value: failedEvents.length },
          { label: "Magic Link Events", value: magicLinkEvents.length },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              padding: "16px 18px",
              background: "rgba(255,255,255,.02)",
              border: "1px solid rgba(198,165,90,.12)",
              borderRadius: 3,
            }}
          >
            <div
              style={{
                fontSize: 9,
                letterSpacing: ".18em",
                textTransform: "uppercase",
                color: "rgba(198,165,90,.55)",
                marginBottom: 8,
              }}
            >
              {label}
            </div>
            <div style={{ fontSize: 24, color: "rgba(255,255,255,.85)", fontWeight: 600 }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Recent audit events */}
      <section>
        <div
          style={{
            fontSize: 9,
            letterSpacing: ".18em",
            textTransform: "uppercase",
            color: "rgba(198,165,90,.55)",
            marginBottom: 10,
          }}
        >
          Recent Audit Events
        </div>
        {rows.length === 0 ? (
          <div
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,.35)",
              padding: "16px",
              background: "rgba(255,255,255,.02)",
              border: "1px solid rgba(198,165,90,.1)",
              borderRadius: 3,
            }}
          >
            No audit events recorded yet.
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
              border: "1px solid rgba(198,165,90,.12)",
              borderRadius: 3,
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr
                  style={{
                    background: "rgba(198,165,90,.05)",
                    borderBottom: "1px solid rgba(198,165,90,.14)",
                  }}
                >
                  {["Time", "Event Type", "User ID"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "8px 12px",
                        textAlign: "left",
                        fontSize: 9,
                        letterSpacing: ".14em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,.4)",
                        fontWeight: 600,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    style={{ borderBottom: "1px solid rgba(255,255,255,.04)" }}
                  >
                    <td
                      style={{
                        padding: "8px 12px",
                        color: "rgba(255,255,255,.4)",
                        fontFamily: "var(--font-geist-mono, monospace)",
                        fontSize: 10,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td
                      style={{
                        padding: "8px 12px",
                        color: "rgba(255,255,255,.75)",
                      }}
                    >
                      {row.event_type}
                    </td>
                    <td
                      style={{
                        padding: "8px 12px",
                        color: "rgba(255,255,255,.35)",
                        fontFamily: "var(--font-geist-mono, monospace)",
                        fontSize: 10,
                      }}
                    >
                      {row.user_id ? row.user_id.slice(0, 8) + "…" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
