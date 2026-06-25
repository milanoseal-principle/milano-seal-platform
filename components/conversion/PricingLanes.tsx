"use client";

import Link from "next/link";
import { CheckCircle2, XCircle, Info } from "lucide-react";
import {
  STATUTORY_FEES,
  RON_PRICING,
  MOBILE_NOTARY_PRICING,
  PRICING_LANES,
  PRICING_ADD_ONS,
  COURIER_STRUCTURE,
  PAYMENT_STRUCTURE,
} from "@/lib/config/pricing";

const GOLD = "rgba(212,175,55,1)";
const GOLD_DIM = "rgba(212,175,55,0.45)";
const BORDER = "rgba(212,175,55,0.14)";
const SURFACE = "rgba(255,255,255,0.025)";

const DISCLAIMER =
  "Final pricing is confirmed after matter review. Scheduling begins only after payment confirmation. Apostille processing times may vary by state authority workload. Courier timing appears after label selection. The Milano Seal™ coordinates document execution, notarization, apostille handling, and secure release. The Milano Seal™ does not provide legal advice.";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 9, letterSpacing: "0.28em", color: GOLD_DIM, marginBottom: 8, textAlign: "center" }}>
      {children}
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: "var(--font-playfair, Georgia, serif)",
        fontWeight: "normal",
        fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)",
        color: "#f4e5b8",
        marginBottom: 10,
        textAlign: "center",
      }}
    >
      {children}
    </h2>
  );
}

function Divider() {
  return (
    <div
      style={{
        height: 1,
        background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.18), transparent)",
        margin: "48px 0",
      }}
    />
  );
}

function LineItemRow({
  label,
  price,
  note,
  when,
}: {
  label: string;
  price: string;
  note?: string;
  when?: string;
}) {
  return (
    <div
      style={{
        borderBottom: "1px solid rgba(212,175,55,0.07)",
        padding: "14px 0",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{label}</span>
        <span style={{ fontSize: 12, color: GOLD, flexShrink: 0, fontFamily: "monospace" }}>{price}</span>
      </div>
      {when && (
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>When used: {when}</span>
      )}
      {note && (
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", fontStyle: "italic" }}>{note}</span>
      )}
    </div>
  );
}

function ClientNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: 16,
        padding: "12px 16px",
        border: "1px solid rgba(212,175,55,0.1)",
        borderRadius: 6,
        background: "rgba(212,175,55,0.025)",
        fontSize: 10,
        color: "rgba(255,255,255,0.38)",
        lineHeight: 1.7,
      }}
    >
      {children}
    </div>
  );
}

export function PricingLanes() {
  return (
    <section
      id="pricing"
      style={{ background: "rgba(8,5,1,0.99)", padding: "64px 0", fontFamily: "monospace" }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>

        {/* ── Page Header ── */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{ fontSize: 9, letterSpacing: "0.28em", color: GOLD_DIM, marginBottom: 10 }}>
            COMPLETE SERVICE PRICING
          </p>
          <h1
            style={{
              fontFamily: "var(--font-playfair, Georgia, serif)",
              fontWeight: "normal",
              fontSize: "clamp(1.4rem, 3.5vw, 2.1rem)",
              color: "#f4e5b8",
              marginBottom: 14,
            }}
          >
            Line-Itemized Service Architecture
          </h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", maxWidth: 580, margin: "0 auto", lineHeight: 1.7 }}>
            Every service priced to the line. Payment confirmed before scheduling. Final pricing after matter review.
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════
            1. FLORIDA STATUTORY NOTARIAL FEES
        ══════════════════════════════════════════════════════════ */}
        <div className="rounded-sm p-6 mb-4" style={{ border: BORDER, background: SURFACE }}>
          <SectionLabel>SECTION 1</SectionLabel>
          <SectionTitle>Florida Statutory Notarial Fees</SectionTitle>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textAlign: "center", marginBottom: 24 }}>
            Florida statutory fees applied per notarized signature when applicable.
          </p>

          <LineItemRow
            label="In-Person Notarization"
            price={`$${STATUTORY_FEES.inPersonPerSignature} per notarized signature`}
            when="Applied per notarized signature at in-person appointments"
          />
          <LineItemRow
            label="Remote Online Notarization (RON)"
            price={`$${STATUTORY_FEES.ronPerSignature} per notarized signature`}
            when="Applied per notarized signature during RON sessions"
          />

          <ClientNote>
            Florida statutory notarization fees are applied per notarized signature when applicable.
          </ClientNote>
        </div>

        <Divider />

        {/* ══════════════════════════════════════════════════════════
            2. REMOTE ONLINE NOTARIZATION
        ══════════════════════════════════════════════════════════ */}
        <div className="rounded-sm p-6 mb-4" style={{ border: BORDER, background: SURFACE }}>
          <SectionLabel>SECTION 2</SectionLabel>
          <SectionTitle>Remote Online Notarization (RON)</SectionTitle>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textAlign: "center", marginBottom: 24 }}>
            RON pricing covers session coordination and execution handling.
          </p>

          {RON_PRICING.map((item) => (
            <LineItemRow
              key={item.id}
              label={item.name}
              price={item.priceLabel}
              note={item.note}
            />
          ))}

          <ClientNote>
            RON pricing covers session coordination and execution handling. Statutory notarization fees may
            apply by signature where applicable.
          </ClientNote>
        </div>

        <Divider />

        {/* ══════════════════════════════════════════════════════════
            3. FLORIDA MOBILE NOTARY / IN-PERSON EXECUTION
        ══════════════════════════════════════════════════════════ */}
        <div
          className="rounded-sm p-6 mb-4"
          style={{ border: "1px solid rgba(212,175,55,0.28)", background: "rgba(212,175,55,0.03)" }}
        >
          <SectionLabel>SECTION 3</SectionLabel>
          <SectionTitle>Florida Mobile Notary / In-Person Execution</SectionTitle>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textAlign: "center", marginBottom: 24 }}>
            In-person Florida appointments. Final pricing depends on location, timing, signer count, signatures, and document readiness.
          </p>

          {MOBILE_NOTARY_PRICING.map((item) => (
            <LineItemRow
              key={item.id}
              label={item.name}
              price={item.priceLabel}
              note={item.note}
            />
          ))}

          <ClientNote>
            Mobile notary pricing applies to in-person Florida appointments. Final pricing depends on
            location, timing, signer count, number of notarized signatures, and document readiness.
            Payment confirmation required before scheduling.
          </ClientNote>
        </div>

        <Divider />

        {/* ══════════════════════════════════════════════════════════
            4. INTERNATIONAL DOCUMENT EXECUTION LANES
        ══════════════════════════════════════════════════════════ */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <SectionLabel>SECTION 4</SectionLabel>
          <SectionTitle>International Document Execution Lanes</SectionTitle>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", maxWidth: 560, margin: "0 auto" }}>
            Each lane includes a defined scope. Payment required before scheduling.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {PRICING_LANES.map((lane) => {
            const isPriority = lane.id === "priority";
            return (
              <div
                key={lane.id}
                className="rounded-sm flex flex-col"
                style={{
                  border: `1px solid ${isPriority ? "rgba(212,175,55,0.35)" : BORDER}`,
                  background: isPriority ? "rgba(212,175,55,0.04)" : SURFACE,
                  padding: 24,
                }}
              >
                {isPriority && (
                  <div style={{ fontSize: 8, color: GOLD, letterSpacing: "0.25em", marginBottom: 10 }}>
                    ◆ MOST SELECTED
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: GOLD_DIM, letterSpacing: "0.2em", marginBottom: 4 }}>
                    {lane.name.toUpperCase()}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-playfair, Georgia, serif)",
                      fontSize: "2rem",
                      color: "#f4e5b8",
                      lineHeight: 1,
                      marginBottom: 8,
                    }}
                  >
                    {lane.priceLabel}
                  </div>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                    {lane.description}
                  </p>
                </div>

                <div style={{ height: 1, background: BORDER, marginBottom: 16 }} />

                <div style={{ marginBottom: 16, flex: 1 }}>
                  <div style={{ fontSize: 8, color: GOLD_DIM, letterSpacing: "0.2em", marginBottom: 10 }}>
                    INCLUDED
                  </div>
                  <div className="space-y-2">
                    {lane.inclusions.map((item) => (
                      <div key={item} className="flex gap-2">
                        <CheckCircle2 size={11} style={{ color: "rgba(34,197,94,0.65)", flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.2em", marginBottom: 10 }}>
                    NOT INCLUDED
                  </div>
                  <div className="space-y-1.5">
                    {lane.notIncluded.map((item) => (
                      <div key={item} className="flex gap-2">
                        <XCircle size={10} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", lineHeight: 1.5 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 12, padding: "8px 12px", border: "1px solid rgba(212,175,55,0.12)", borderRadius: 4 }}>
                  <span style={{ fontSize: 9, color: "rgba(212,175,55,0.5)" }}>
                    Payment required before scheduling.
                  </span>
                </div>

                <Link
                  href={`/intake?lane=${lane.id}`}
                  className="block text-center rounded-sm py-2.5 text-[10px] tracking-widest transition-colors hover:opacity-90"
                  style={{
                    background: isPriority ? "rgba(212,175,55,0.15)" : "transparent",
                    border: `1px solid ${isPriority ? "rgba(212,175,55,0.5)" : BORDER}`,
                    color: isPriority ? GOLD : GOLD_DIM,
                  }}
                >
                  {lane.cta.toUpperCase()}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Other Legal Document / Custom Matter — Review path, not a lane */}
        <div
          className="rounded-sm p-6 mb-4"
          style={{ border: "1px solid rgba(212,175,55,0.12)", background: SURFACE }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: GOLD_DIM, letterSpacing: "0.2em", marginBottom: 6 }}>
                OTHER LEGAL DOCUMENT / CUSTOM MATTER
              </div>
              <div
                style={{
                  fontFamily: "var(--font-playfair, Georgia, serif)",
                  fontSize: "1.2rem",
                  color: "#f4e5b8",
                  marginBottom: 8,
                }}
              >
                Review Required — Price Confirmed After Intake
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, maxWidth: 520 }}>
                Multi-document, multi-jurisdiction, corporate, estate, or attorney-led matters require
                a dedicated intake review before a lane is assigned. Every matter is processed through
                Signature, Priority, or Executive — final pricing confirmed after review.
              </p>
            </div>
            <Link
              href="/intake"
              className="inline-block text-center rounded-sm py-2.5 px-6 text-[10px] tracking-widest transition-colors hover:opacity-90 self-start"
              style={{ border: `1px solid ${BORDER}`, color: GOLD_DIM }}
            >
              REQUEST REVIEW
            </Link>
          </div>
        </div>

        <Divider />

        {/* ══════════════════════════════════════════════════════════
            5. INTERNATIONAL ADD-ONS
        ══════════════════════════════════════════════════════════ */}
        <div className="rounded-sm p-6 mb-4" style={{ border: BORDER, background: SURFACE }}>
          <SectionLabel>SECTION 5</SectionLabel>
          <SectionTitle>International Add-Ons</SectionTitle>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textAlign: "center", marginBottom: 24 }}>
            Added to any execution lane when applicable. Quoted after matter review.
          </p>

          <LineItemRow
            label="Apostille Coordination"
            price="+$250"
            when="Destination use requires apostille handling"
            note="Verified against destination and document origin before finalizing."
          />
          <LineItemRow
            label="Rush Handling"
            price="+$400"
            when="Timing requires accelerated coordination"
            note="Used only when urgency changes handling burden. Apostille processing times may vary by state authority workload."
          />
          <LineItemRow
            label="Additional Signer"
            price="+$150 per additional signer"
            when="More than one signer must be coordinated in an international execution matter"
          />
          <LineItemRow
            label="Witness Support"
            price="Scoped"
            when="A compliant witness is required"
            note="Added only when the matter requires witness support."
          />
          <LineItemRow
            label="Translation Coordination"
            price="Scoped"
            when="The receiving authority requires translated materials"
            note="Quoted after document and destination review."
          />
          <LineItemRow
            label="Courier Release"
            price="Scoped"
            when="Original documents must be released by tracked courier"
            note="Courier timing appears after label selection. Release only after payment, execution, apostille, and custody checks."
          />
        </div>

        <Divider />

        {/* ══════════════════════════════════════════════════════════
            6. COURIER STRUCTURE
        ══════════════════════════════════════════════════════════ */}
        <div className="rounded-sm p-5 mb-6" style={{ border: "1px solid rgba(59,130,246,0.15)", background: "rgba(59,130,246,0.03)" }}>
          <div className="flex items-start gap-3">
            <Info size={13} style={{ color: "rgba(59,130,246,0.6)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 9, color: "rgba(59,130,246,0.6)", letterSpacing: "0.2em", marginBottom: 6 }}>
                INTERNATIONAL COURIER & DISPATCH — BILLED SEPARATELY
              </div>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, marginBottom: 8 }}>
                {COURIER_STRUCTURE.note}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                  Carriers: {COURIER_STRUCTURE.carriers.join(" · ")}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                  Estimate: {COURIER_STRUCTURE.estimate}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                  Customs: {COURIER_STRUCTURE.customsClassification.type} — HS {COURIER_STRUCTURE.customsClassification.hsCode}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                  Duties & taxes: {COURIER_STRUCTURE.customsClassification.dutiesAndTaxes}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            7. PAYMENT & RELEASE RULES
        ══════════════════════════════════════════════════════════ */}
        <div className="rounded-sm p-5 mb-8" style={{ border: BORDER, background: SURFACE }}>
          <div style={{ fontSize: 9, color: GOLD_DIM, letterSpacing: "0.2em", marginBottom: 10 }}>
            PAYMENT &amp; RELEASE RULES
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.15em", marginBottom: 3 }}>RETAINER</div>
              <div style={{ fontSize: 11, color: "#e8e4dc" }}>{PAYMENT_STRUCTURE.retainer}</div>
            </div>
            <div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.15em", marginBottom: 3 }}>BALANCE</div>
              <div style={{ fontSize: 11, color: "#e8e4dc" }}>{PAYMENT_STRUCTURE.balance}</div>
            </div>
          </div>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>
            {PAYMENT_STRUCTURE.note}
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════
            DISCLAIMER
        ══════════════════════════════════════════════════════════ */}
        <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", lineHeight: 1.7, textAlign: "center", maxWidth: 720, margin: "0 auto" }}>
          {DISCLAIMER}
        </p>

      </div>
    </section>
  );
}
