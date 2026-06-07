<<<<<<< HEAD
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Private Matter Review | The Milano Seal™",
  robots: "noindex, nofollow",
};

// Timeline steps from intake to release
const TIMELINE_STEPS = [
  {
    key: "intake_received",
    label: "Intake Received",
    doneStatuses: [
      "under_review","compliance_review","quoted","awaiting_payment","payment_confirmed",
      "scheduled","in_execution","apostille_processing","courier_ready","shipped",
      "delivered","completed","closed",
    ],
    activeStatuses: ["intake_received"],
  },
  {
    key: "scope_confirmed",
    label: "Scope Confirmed",
    doneStatuses: [
      "quoted","awaiting_payment","payment_confirmed","scheduled","in_execution",
      "apostille_processing","courier_ready","shipped","delivered","completed","closed",
    ],
    activeStatuses: ["under_review","compliance_review"],
  },
  {
    key: "payment_confirmed",
    label: "Payment Confirmed",
    doneStatuses: [
      "payment_confirmed","scheduled","in_execution","apostille_processing","courier_ready",
      "shipped","delivered","completed","closed",
    ],
    activeStatuses: ["awaiting_payment"],
  },
  {
    key: "execution_scheduled",
    label: "Execution Scheduled",
    doneStatuses: [
      "in_execution","apostille_processing","courier_ready","shipped","delivered",
      "completed","closed",
    ],
    activeStatuses: ["scheduled"],
  },
  {
    key: "documents_notarized",
    label: "Documents Notarized",
    doneStatuses: [
      "apostille_processing","courier_ready","shipped","delivered","completed","closed",
    ],
    activeStatuses: ["in_execution"],
  },
  {
    key: "apostille_authentication",
    label: "Apostille / Authentication",
    doneStatuses: ["courier_ready","shipped","delivered","completed","closed"],
    activeStatuses: ["apostille_processing"],
  },
  {
    key: "packaging_qa",
    label: "Packaging & QA",
    doneStatuses: ["shipped","delivered","completed","closed"],
    activeStatuses: ["courier_ready"],
  },
  {
    key: "in_transit",
    label: "In Transit",
    doneStatuses: ["delivered","completed","closed"],
    activeStatuses: ["shipped"],
  },
  {
    key: "delivered",
    label: "Delivered",
    doneStatuses: ["completed","closed"],
    activeStatuses: ["delivered"],
  },
  {
    key: "released",
    label: "Released",
    doneStatuses: ["closed"],
    activeStatuses: ["completed"],
  },
];

function stepState(
  step: (typeof TIMELINE_STEPS)[0],
  status: string
): "done" | "active" | "pending" {
  if (step.doneStatuses.includes(status)) return "done";
  if (step.activeStatuses.includes(status)) return "active";
  return "pending";
}

// Safe field subset from client_safe_matter_view
interface SafeMatter {
  id: string;
  display_id?: string | null;
  client_name?: string | null;
  document_type?: string | null;
  destination_country?: string | null;
  matter_status?: string | null;
  payment_status?: string | null;
  is_paid_and_released?: boolean | null;
  client_facing_status?: string | null;
}

export default async function MatterRoomPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/portal/matter-room");

  const { data: matter } = await supabase
    .from("client_safe_matter_view")
    .select(
      "id,display_id,client_name,document_type,destination_country,matter_status,payment_status,is_paid_and_released,client_facing_status"
    )
    .eq("client_user_id", user.id)
    .maybeSingle();

  const deal = matter as SafeMatter | null;

  const status = deal?.matter_status ?? "";
  const isPaid =
    deal?.payment_status === "paid" ||
    deal?.payment_status === "confirmed" ||
    status === "payment_confirmed";
  const isDelivered = status === "delivered";
  const isReleased = deal?.is_paid_and_released === true || status === "completed" || status === "closed";

  // ─── Styles ──────────────────────────────────────────────────────────────────

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(170deg, #080501 0%, #060810 100%)",
    color: "rgba(229,224,216,0.85)",
    fontFamily: "var(--font-geist-mono, monospace)",
    padding: "48px 24px 80px",
  };

  const innerStyle: React.CSSProperties = {
    maxWidth: 720,
    margin: "0 auto",
  };

  const sectionStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.015)",
    border: "1px solid rgba(198,165,90,0.1)",
    borderRadius: 8,
    padding: "28px 30px",
    marginBottom: 20,
  };

  const eyebrowStyle: React.CSSProperties = {
    fontSize: 9,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: "rgba(198,165,90,0.55)",
    fontFamily: "monospace",
    marginBottom: 6,
  };

  const h2Style: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 600,
    color: "rgba(255,255,255,0.9)",
    fontFamily: "var(--font-playfair, Georgia, serif)",
    margin: "0 0 4px",
    letterSpacing: "0.01em",
  };

  if (!deal) {
    return (
      <div style={containerStyle}>
        <div style={innerStyle}>
          <div style={{ ...sectionStyle, textAlign: "center", padding: "48px 30px" }}>
            <div style={eyebrowStyle}>Private Matter Review</div>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginTop: 16 }}>
              Contact your coordinator.
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 8 }}>
              Nicholas Milano · The Milano Seal™ · nicholas@themilanoseal.com
            </p>
          </div>
        </div>
      </div>
    );
  }

  const displayId =
    deal.display_id
      ? deal.display_id.slice(0, 8).toUpperCase()
      : deal.id.slice(0, 8).toUpperCase();

  const docTypeLabel = deal.document_type
    ? deal.document_type.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Document";

  const countryLabel = deal.destination_country
    ? deal.destination_country.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "—";

  const statusPillColor = isReleased
    ? "#4a9e6b"
    : isDelivered
    ? "#C6A55A"
    : "rgba(255,255,255,0.5)";

  const statusLabel =
    deal.client_facing_status ??
    (status ? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—");

  return (
    <div style={containerStyle}>
      <div style={innerStyle}>
        {/* ── Eyebrow / Private Matter Header ────────────────────────── */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: "rgba(198,165,90,0.6)",
              fontFamily: "monospace",
              marginBottom: 6,
            }}
          >
            / PRIVATE MATTER REVIEW /
          </div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.2em",
              color: "rgba(198,165,90,0.35)",
              fontFamily: "monospace",
            }}
          >
            {displayId}
          </div>
        </div>

        {/* ── 1. Concierge Header ──────────────────────────────────────── */}
        <div style={sectionStyle}>
          <div style={eyebrowStyle}>Concierge Header</div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#C6A55A",
              fontFamily: "var(--font-playfair, Georgia, serif)",
              margin: "0 0 6px",
              letterSpacing: "0.02em",
            }}
          >
            {docTypeLabel}
          </h1>
          <div
            style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 20 }}
          >
            Destination:{" "}
            <span style={{ color: "rgba(255,255,255,0.7)" }}>{countryLabel}</span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingTop: 16,
            }}
          >
            <div
              style={{
                fontSize: 9,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.25)",
                marginBottom: 2,
              }}
            >
              Coordinator
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
              Nicholas Milano · The Milano Seal™
            </div>
            <a
              href="mailto:nicholas@themilanoseal.com"
              style={{ fontSize: 12, color: "#C6A55A", textDecoration: "none" }}
            >
              nicholas@themilanoseal.com
            </a>
          </div>
        </div>

        {/* ── 2. Private Client Timeline ───────────────────────────────── */}
        <div style={sectionStyle}>
          <div style={eyebrowStyle}>Private Client Timeline</div>
          <h2 style={h2Style}>Execution Journey</h2>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "4px 0 20px" }}>
            From intake to release.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {TIMELINE_STEPS.map((step, i) => {
              const state = stepState(step, status);
              const isLast = i === TIMELINE_STEPS.length - 1;

              const dotColor =
                state === "done"
                  ? "#4a9e6b"
                  : state === "active"
                  ? "#C6A55A"
                  : "rgba(255,255,255,0.12)";

              const labelColor =
                state === "done"
                  ? "rgba(255,255,255,0.7)"
                  : state === "active"
                  ? "#C6A55A"
                  : "rgba(255,255,255,0.25)";

              return (
                <div
                  key={step.key}
                  style={{ display: "flex", alignItems: "flex-start", gap: 14 }}
                >
                  {/* Dot + line */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: dotColor,
                        border:
                          state === "active"
                            ? "2px solid rgba(198,165,90,0.6)"
                            : "none",
                        marginTop: 3,
                        boxShadow:
                          state === "active"
                            ? "0 0 8px rgba(198,165,90,0.4)"
                            : "none",
                        transition: "all 0.3s",
                      }}
                    />
                    {!isLast && (
                      <div
                        style={{
                          width: 1,
                          height: 28,
                          background:
                            state === "done"
                              ? "rgba(74,158,107,0.25)"
                              : "rgba(255,255,255,0.06)",
                        }}
                      />
                    )}
                  </div>
                  {/* Label */}
                  <div
                    style={{
                      paddingBottom: isLast ? 0 : 18,
                      paddingTop: 1,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: labelColor,
                        fontWeight: state === "active" ? 600 : 400,
                      }}
                    >
                      {step.label}
                      {state === "active" && (
                        <span
                          style={{
                            marginLeft: 8,
                            fontSize: 9,
                            letterSpacing: "0.1em",
                            color: "#C6A55A",
                            fontFamily: "monospace",
                          }}
                        >
                          — IN PROGRESS
                        </span>
                      )}
                      {state === "done" && (
                        <span
                          style={{
                            marginLeft: 8,
                            fontSize: 9,
                            color: "#4a9e6b",
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 3. Document Custody Summary ──────────────────────────────── */}
        <div style={sectionStyle}>
          <div style={eyebrowStyle}>Document Custody</div>
          <h2 style={h2Style}>Custody Summary</h2>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.55)",
              margin: "10px 0 16px",
              lineHeight: 1.6,
            }}
          >
            Your documents are in secure custody. The Milano Seal™ maintains
            chain-of-custody at every stage of execution.
          </p>
          <div style={{ display: "inline-block" }}>
            <span
              style={{
                fontSize: 10,
                fontFamily: "monospace",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: statusPillColor,
                border: `1px solid ${statusPillColor}`,
                borderRadius: 99,
                padding: "4px 12px",
                background: `${statusPillColor}10`,
              }}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        {/* ── 4. Release Readiness ─────────────────────────────────────── */}
        <div
          style={{
            ...sectionStyle,
            borderColor: isReleased
              ? "rgba(74,158,107,0.25)"
              : isDelivered
              ? "rgba(198,165,90,0.2)"
              : "rgba(198,165,90,0.1)",
          }}
        >
          <div style={eyebrowStyle}>Release Readiness</div>
          <h2 style={h2Style}>Release Status</h2>
          <div style={{ marginTop: 12 }}>
            {isReleased ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: "#4a9e6b",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                <span style={{ fontSize: 20 }}>✓</span> Released &amp; Sealed
              </div>
            ) : isDelivered ? (
              <p style={{ fontSize: 13, color: "#C6A55A", margin: 0 }}>
                Your documents have arrived. Release review in progress.
              </p>
            ) : !isPaid ? (
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.45)",
                  margin: 0,
                }}
              >
                Release requires payment confirmation.
              </p>
            ) : (
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.45)",
                  margin: 0,
                }}
              >
                Execution in progress. Release will be confirmed upon delivery.
              </p>
            )}
          </div>
        </div>

        {/* ── 5. What We Handle ────────────────────────────────────────── */}
        <div style={sectionStyle}>
          <div style={eyebrowStyle}>Scope of Service</div>
          <h2 style={h2Style}>What We Handle</h2>
          <ul
            style={{
              margin: "16px 0 0",
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {[
              "Document notarization & authentication",
              "International routing & apostille coordination",
              "Secure courier with chain-of-custody",
              "Final release with verification record",
            ].map((item) => (
              <li
                key={item}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  fontSize: 13,
                  color: "rgba(255,255,255,0.6)",
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color: "#C6A55A", flexShrink: 0, marginTop: 1 }}>
                  ✦
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* ── 6. Private Matter Review CTA ─────────────────────────────── */}
        <div
          style={{
            ...sectionStyle,
            border: "1px solid rgba(198,165,90,0.3)",
            background: "rgba(198,165,90,0.03)",
            textAlign: "center",
          }}
        >
          <div style={eyebrowStyle}>Questions?</div>
          <h2 style={{ ...h2Style, color: "#C6A55A", textAlign: "center" }}>
            Contact Your Coordinator
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.45)",
              margin: "12px 0 20px",
              lineHeight: 1.6,
            }}
          >
            Questions about your matter? Your coordinator is available throughout
            every stage of your execution.
          </p>
          <a
            href="mailto:nicholas@themilanoseal.com"
            style={{
              display: "inline-block",
              fontSize: 11,
              fontFamily: "monospace",
              letterSpacing: "0.08em",
              color: "#C6A55A",
              border: "1px solid rgba(198,165,90,0.4)",
              borderRadius: 4,
              padding: "10px 22px",
              background: "rgba(198,165,90,0.07)",
              textDecoration: "none",
              transition: "background 0.2s",
            }}
          >
            nicholas@themilanoseal.com
          </a>
        </div>
=======
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Matter Room | The Milano Seal™",
  robots: { index: false, follow: false },
};

// Safe fields only — never expose internal fields
const SAFE_MATTER_FIELDS = [
  "id", "matter_reference", "deal_status", "release_status",
  "payment_status", "document_type", "destination_country",
  "receiving_authority", "created_at", "updated_at",
  "client_name", "estimated_completion_date",
].join(", ");

export default async function MatterRoomPage({
  searchParams,
}: {
  searchParams: Promise<{ matter_id?: string }>;
}) {
  const { matter_id } = await searchParams;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "client") redirect("/portal");

  let matter = null;
  if (matter_id) {
    const { data } = await supabase
      .from("deals")
      .select(SAFE_MATTER_FIELDS)
      .eq("id", matter_id)
      .eq("client_email", user.email)
      .single();
    matter = data;
  }

  const statusColor = (s: string) => {
    if (s === "completed" || s === "released") return "#22c55e";
    if (s === "on_hold" || s === "blocked") return "#f59e0b";
    if (s === "payment_failed") return "#ef4444";
    return "#D4AF37";
  };

  return (
    <div className="min-h-screen" style={{ background: "#060402" }}>
      {/* Concierge Header */}
      <div className="border-b" style={{ borderColor: "rgba(212,175,55,0.12)", background: "rgba(212,175,55,0.04)" }}>
        <div className="max-w-4xl mx-auto px-6 py-8">
          <p className="font-mono text-[10px] tracking-[0.25em] uppercase mb-2" style={{ color: "rgba(212,175,55,0.5)" }}>
            Private Client · Matter Room
          </p>
          <h1 className="font-serif text-2xl text-white tracking-wide">
            {profile.full_name ?? "Your Matter"}
          </h1>
          {matter && (
            <p className="font-mono text-xs mt-1" style={{ color: "rgba(212,175,55,0.6)" }}>
              {matter.matter_reference ?? matter.id?.slice(0, 8).toUpperCase()} · {matter.document_type ?? "Document Matter"}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {!matter ? (
          <div className="rounded border px-6 py-10 text-center" style={{ borderColor: "rgba(212,175,55,0.12)", background: "rgba(255,255,255,0.02)" }}>
            <p className="font-mono text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>No matter selected.</p>
          </div>
        ) : (
          <>
            {/* Matter Status */}
            <div className="rounded border p-6" style={{ borderColor: "rgba(212,175,55,0.12)", background: "rgba(255,255,255,0.02)" }}>
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase mb-4" style={{ color: "rgba(212,175,55,0.4)" }}>Matter Status</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Status", value: matter.deal_status ?? "—" },
                  { label: "Payment", value: matter.payment_status ?? "—" },
                  { label: "Release", value: matter.release_status ?? "—" },
                  { label: "Destination", value: matter.destination_country ?? "—" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="font-mono text-[9px] tracking-widest uppercase mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</p>
                    <p className="font-mono text-sm font-medium" style={{ color: statusColor(value) }}>
                      {value.replace(/_/g, " ").toUpperCase()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Receiving Authority */}
            {matter.receiving_authority && (
              <div className="rounded border p-6" style={{ borderColor: "rgba(212,175,55,0.12)", background: "rgba(255,255,255,0.02)" }}>
                <p className="font-mono text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: "rgba(212,175,55,0.4)" }}>Receiving Authority</p>
                <p className="text-white font-medium">{matter.receiving_authority}</p>
              </div>
            )}

            {/* Release Readiness */}
            <div className="rounded border p-6" style={{ borderColor: "rgba(212,175,55,0.12)", background: "rgba(255,255,255,0.02)" }}>
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase mb-4" style={{ color: "rgba(212,175,55,0.4)" }}>Release Readiness</p>
              {matter.payment_status === "paid" && matter.release_status === "released" ? (
                <p className="font-mono text-sm" style={{ color: "#22c55e" }}>✓ Documents released. Contact your coordinator for delivery confirmation.</p>
              ) : matter.payment_status !== "paid" ? (
                <p className="font-mono text-sm" style={{ color: "#f59e0b" }}>Payment must be confirmed before documents can be released.</p>
              ) : (
                <p className="font-mono text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Release pending operator review.</p>
              )}
            </div>

            {/* Coordinator Card */}
            <div className="rounded border p-6" style={{ borderColor: "rgba(212,175,55,0.12)", background: "rgba(255,255,255,0.02)" }}>
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase mb-3" style={{ color: "rgba(212,175,55,0.4)" }}>Your Coordinator</p>
              <p className="text-white font-medium">The Milano Seal™</p>
              <p className="font-mono text-xs mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>contact@themilanoseal.com</p>
              <p className="font-mono text-[10px] mt-3" style={{ color: "rgba(255,255,255,0.3)" }}>
                The Milano Seal provides document coordination, notarization, apostille/authentication routing review, courier custody, and release support. This service does not provide legal advice.
              </p>
            </div>
          </>
        )}
>>>>>>> claude/funny-maxwell-hlxQN
      </div>
    </div>
  );
}
