"use client";

interface SafetyInterruptionProps {
  reasons: string[];           // internal trigger reasons — never rendered to client
  onAcknowledge: () => void;
  visible: boolean;
}

// Client-facing copy — calm professional language, no error/fail/reject language
const CLIENT_TITLE = "Pre-Flight Review Required";
const CLIENT_BODY =
  "Your requested pathway requires a secondary review before scheduling can be unlocked. A coordinator will confirm your execution pathway before proceeding.";
const CLIENT_CTA = "Acknowledge & Continue";

export function SafetyInterruption({ onAcknowledge, visible }: SafetyInterruptionProps) {
  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="safety-interruption-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(3,3,2,0.82)",
        backdropFilter: "blur(6px)",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          background: "#0a0a0a",
          border: "1px solid rgba(198,165,90,0.28)",
          borderRadius: 10,
          padding: "32px 28px",
          maxWidth: 420,
          width: "100%",
          boxShadow: "0 0 48px rgba(0,0,0,0.8)",
        }}
      >
        {/* Header marker */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "rgba(212,175,55,0.75)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 9,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "rgba(198,165,90,0.6)",
              fontFamily: "monospace",
            }}
          >
            The Milano Seal™
          </span>
        </div>

        {/* Title */}
        <h2
          id="safety-interruption-title"
          style={{
            fontFamily: "var(--font-playfair, Georgia, serif)",
            fontSize: "1.2rem",
            fontWeight: "normal",
            color: "rgba(255,255,255,0.92)",
            marginBottom: 14,
            letterSpacing: "0.04em",
          }}
        >
          {CLIENT_TITLE}
        </h2>

        {/* Body */}
        <p
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.52)",
            lineHeight: 1.65,
            fontFamily: "system-ui, sans-serif",
            marginBottom: 24,
          }}
        >
          {CLIENT_BODY}
        </p>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(198,165,90,0.18), transparent)",
            marginBottom: 24,
          }}
        />

        {/* CTA */}
        <button
          onClick={onAcknowledge}
          style={{
            width: "100%",
            padding: "13px 20px",
            background: "transparent",
            border: "1px solid rgba(198,165,90,0.5)",
            borderRadius: 6,
            color: "#c6a55a",
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            fontFamily: "monospace",
            cursor: "pointer",
          }}
        >
          {CLIENT_CTA}
        </button>
      </div>
    </div>
  );
}

// Hook: returns whether a safety interruption should fire based on matter state.
// reasons is for operator logging only — never rendered client-side.
export function evaluateSafetyInterruption(matter: {
  destination_country?: string | null;
  document_type?: string | null;
  origin_jurisdiction?: string | null;
  signer_location?: string | null;
  is_platform_fee_only?: boolean;
  payment_confirmed?: boolean;
  apostille_required?: boolean | null;
}): { shouldInterrupt: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (!matter.destination_country)
    reasons.push("destination_country missing");

  if (!matter.document_type || matter.document_type.trim().length < 3)
    reasons.push("document_type vague or missing");

  if (!matter.signer_location)
    reasons.push("signer_location missing");

  if (matter.apostille_required == null && matter.destination_country)
    reasons.push("apostille_required unknown on international matter");

  if (matter.is_platform_fee_only && !matter.payment_confirmed)
    reasons.push("platform_fee_only matter requires external fee before scheduling");

  return { shouldInterrupt: reasons.length > 0, reasons };
}
