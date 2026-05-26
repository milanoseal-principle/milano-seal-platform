export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";

const DOCTRINE_SECTIONS = [
  {
    id: "ai-role-boundaries",
    label: "AI ROLE BOUNDARIES",
    title: "AI Role Boundaries",
    items: [
      "AI surfaces information — humans make decisions",
      "AI-generated responses are reviewed before client delivery",
      "AI cannot approve, authorize, or release any operational action",
      "AI operates within pre-approved response boundaries only",
      "AI output is logged as AI_RESPONSE_GENERATED before any use",
      "Confidence below threshold routes automatically to VA review",
      "AI never communicates directly with clients without human approval",
    ],
  },
  {
    id: "va-limitations",
    label: "VA LIMITATIONS",
    title: "VA Operational Boundaries",
    items: [
      "VA cannot give legal advice or legal interpretation",
      "VA cannot approve compliance requirements",
      "VA cannot release documents",
      "VA cannot change payment state",
      "VA cannot access revenue intelligence",
      "VA cannot access acquisition intelligence",
      "VA cannot access alliance trust graph",
      "VA cannot view unrestricted matters outside their assignment",
      "VA cannot modify SOP content — read access only",
      "VA actions limited to assigned tasks; all actions are audit-logged",
    ],
  },
  {
    id: "operator-review",
    label: "OPERATOR REVIEW",
    title: "Operator Review Requirements",
    items: [
      "All client-facing communications reviewed before delivery",
      "Compliance flags reviewed before matter advances",
      "Embassy/legalization routing confirmed by operator",
      "Translation requirements confirmed before external submission",
      "Courier release authorized by operator after payment confirmation",
      "Alliance dispatch assignments reviewed before confirmation",
      "Escalated VA tasks reviewed within 4 business hours",
      "All operator decisions logged as OPERATOR_REVIEW_COMPLETED",
    ],
  },
  {
    id: "nicholas-review-triggers",
    label: "NICHOLAS FINAL REVIEW",
    title: "Nicholas Final Review Triggers",
    variant: "gold" as const,
    items: [
      "High-value matter (above standard tier threshold)",
      "Embassy or legalization chain uncertainty",
      "Escalated client conflict or dispute",
      "Release exception request",
      "Payment override or adjustment",
      "Unusual or unsupported country requirement",
      "Reputation-sensitive partner issue",
      "Any matter flagged with NICHOLAS_REVIEW_REQUIRED event",
    ],
  },
  {
    id: "client-communication",
    label: "CLIENT COMMUNICATION RULES",
    title: "Client-Safe Communication",
    items: [
      "Only procedural status updates delivered to clients",
      "No legal interpretations in client communication",
      "No guarantee language: avoid 'will be accepted', 'guaranteed'",
      "No internal notes, pricing detail, or margin data",
      "Tracking number shared only after label purchase confirmed",
      "Evidence and completion packets via signed URL only",
      "All client communications logged before and after delivery",
    ],
  },
  {
    id: "event-logging",
    label: "EVENT LOGGING",
    title: "Required Event Log Entries",
    items: [
      "AI_RESPONSE_GENERATED — every AI output before use",
      "VA_REVIEW_COMPLETED — when VA reviews AI output or task",
      "OPERATOR_REVIEW_COMPLETED — when operator approves action",
      "NICHOLAS_REVIEW_REQUIRED — trigger for principal review",
      "NICHOLAS_REVIEW_COMPLETED — after principal decision",
      "CLIENT_SAFE_UPDATE_SENT — after client communication delivered",
    ],
  },
  {
    id: "escalation-rules",
    label: "ESCALATION RULES",
    title: "Escalation Protocol",
    items: [
      "Unresolved VA task after 4 hours → operator escalation",
      "Unresolved operator review after 24 hours → Nicholas notification",
      "Any embassy/legalization uncertainty → operator + Nicholas flag",
      "Client dispute → operator escalation immediately",
      "Payment anomaly → Nicholas notification immediately",
      "Compliance flag on high-value matter → Nicholas review required",
      "Failed courier delivery after 7 days → operator escalation",
    ],
  },
  {
    id: "forbidden-ai-outputs",
    label: "FORBIDDEN AI OUTPUTS",
    title: "Forbidden AI Outputs",
    variant: "red" as const,
    items: [
      "Legal advice or legal interpretation of any kind",
      "Guarantee of document acceptance",
      "Specific embassy requirements without manual verification",
      "Client pricing, margin, or cost breakdowns",
      "Internal operational notes or operator annotations",
      "Compliance approvals or compliance sign-offs",
      "Release authorizations",
      "Payment instructions or payment modifications",
      "Claims of government approval or official authority",
      "Country-specific requirements without verified source",
    ],
  },
];

const FLOW_STEPS = [
  { step: "1", label: "AI Chatbox", note: "Generates response within boundary" },
  { step: "2", label: "VA Review", note: "Reviews AI output, completes assigned task" },
  { step: "3", label: "Operator Review", note: "Approves client communication or action" },
  { step: "4", label: "Nicholas Final Review", note: "Required for triggers above" },
  { step: "5", label: "Event Log", note: "Each step creates an audit event" },
  { step: "6", label: "Client-Safe Update", note: "Delivered after human approval" },
];

export default async function HumanTouchTrustEnginePage() {
  await requireDashboardAccess();

  return (
    <div
      className="min-h-screen"
      style={{ background: "rgba(8,5,1,0.97)" }}
    >
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <span
            className="text-[9px] font-mono tracking-[0.3em] block mb-2"
            style={{ color: "rgba(212,175,55,0.45)" }}
          >
            INTERNAL DOCTRINE · RESTRICTED ACCESS
          </span>
          <h1
            className="text-2xl font-light mb-3"
            style={{
              color: "rgba(255,255,255,0.85)",
              fontFamily: "var(--font-playfair),Georgia,serif",
            }}
          >
            Human Touch Trust Engine
          </h1>
          <p
            className="text-sm font-light leading-relaxed max-w-2xl"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            The operational doctrine governing how AI, VA assistants, operators,
            and principal review interact within The Milano Seal™ execution
            infrastructure. No automated output reaches clients without human approval.
          </p>
        </div>

        {/* Document flow */}
        <div
          className="rounded-sm p-6 mb-8"
          style={{
            background: "rgba(212,175,55,0.04)",
            border: "1px solid rgba(212,175,55,0.1)",
          }}
        >
          <span
            className="text-[9px] font-mono tracking-[0.3em] block mb-4"
            style={{ color: "rgba(212,175,55,0.5)" }}
          >
            REVIEW CHAIN
          </span>
          <div className="flex flex-wrap gap-0">
            {FLOW_STEPS.map((step, i) => (
              <div key={step.step} className="flex items-center">
                <div className="flex flex-col items-center text-center px-3 py-1">
                  <div
                    className="h-6 w-6 rounded-sm flex items-center justify-center mb-1 text-[10px] font-mono"
                    style={{
                      background: "rgba(212,175,55,0.1)",
                      color: "rgba(212,175,55,0.7)",
                    }}
                  >
                    {step.step}
                  </div>
                  <span
                    className="text-[10px] font-light block"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                  >
                    {step.label}
                  </span>
                  <span
                    className="text-[9px] font-mono block max-w-[100px]"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                  >
                    {step.note}
                  </span>
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <span
                    className="text-xs mx-1 self-start mt-3"
                    style={{ color: "rgba(212,175,55,0.25)" }}
                  >
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Doctrine sections */}
        <div className="space-y-4">
          {DOCTRINE_SECTIONS.map((section) => {
            const isGold = section.variant === "gold";
            const isRed = section.variant === "red";
            return (
              <div
                key={section.id}
                className="rounded-sm"
                style={{
                  background: isRed
                    ? "rgba(239,68,68,0.03)"
                    : isGold
                      ? "rgba(212,175,55,0.03)"
                      : "rgba(255,255,255,0.02)",
                  border: isRed
                    ? "1px solid rgba(239,68,68,0.08)"
                    : isGold
                      ? "1px solid rgba(212,175,55,0.1)"
                      : "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div
                  className="px-6 pt-5 pb-4"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <span
                    className="text-[9px] font-mono tracking-[0.3em] block mb-0.5"
                    style={{
                      color: isRed
                        ? "rgba(239,68,68,0.5)"
                        : "rgba(212,175,55,0.45)",
                    }}
                  >
                    {section.label}
                  </span>
                  <h2
                    className="text-sm font-light"
                    style={{
                      color: "rgba(255,255,255,0.65)",
                      fontFamily: "var(--font-playfair),Georgia,serif",
                    }}
                  >
                    {section.title}
                  </h2>
                </div>
                <ul className="px-6 py-4 space-y-2">
                  {section.items.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-xs font-light"
                      style={{ color: "rgba(255,255,255,0.55)" }}
                    >
                      <span
                        className="mt-1.5 h-1 w-1 rounded-full flex-shrink-0"
                        style={{
                          background: isRed
                            ? "rgba(239,68,68,0.5)"
                            : "rgba(212,175,55,0.4)",
                        }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Access control note */}
        <div
          className="mt-8 px-6 py-4 rounded-sm"
          style={{
            background: "rgba(255,255,255,0.01)",
            border: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <span
            className="text-[9px] font-mono tracking-[0.3em] block mb-2"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            ACCESS CONTROL MATRIX
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { role: "AI", access: "Generate only — no approval" },
              { role: "VA", access: "Review + task execution — no release" },
              { role: "Operator", access: "Review + approve + dispatch" },
              { role: "Nicholas", access: "Final review on triggers" },
            ].map((row) => (
              <div key={row.role} className="space-y-1">
                <span
                  className="text-[9px] font-mono tracking-wider block"
                  style={{ color: "rgba(212,175,55,0.5)" }}
                >
                  {row.role}
                </span>
                <span
                  className="text-[10px] font-light block"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  {row.access}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p
          className="mt-8 text-[9px] font-mono tracking-wider text-center"
          style={{ color: "rgba(255,255,255,0.15)" }}
        >
          INTERNAL DOCTRINE · THE MILANO SEAL™ · RESTRICTED TO AUTHORIZED OPERATORS
        </p>
      </div>
    </div>
  );
}
