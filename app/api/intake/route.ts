import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizeMatter, validateMatter, riskScore } from "@/lib/validation";
import { determineLaneAndPrice } from "@/lib/pricing";
import { generateInvoice } from "@/lib/invoice";
import { validateCompliance } from "@/lib/compliance";
import { parseIntake } from "@/lib/parseIntake";
import { logActivity } from "@/lib/activity";
import { createWisePaymentRequest } from "@/lib/wise";
import { sendIntakeConfirmation } from "@/lib/email";
import { DESTINATIONS } from "@/data/destinations";
import { appendLedger, CUSTODY_EVENTS } from "@/lib/custodyLedger";
import { runDealEngine } from "@/lib/core/engine";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://themilanoseal.com";

function genDealId(): string {
  return `MS-${new Date().getFullYear()}-${Math.floor(
    1000 + Math.random() * 9000,
  )}`;
}

function autoSelectLane({
  country,
  urgency,
  signerCount,
  apostilleRequired,
}: {
  country: string;
  urgency?: string;
  signerCount?: number;
  apostilleRequired?: boolean;
}): "Executive" | "Priority" | "Signature" {
  if (urgency === "urgent") return "Executive";
  if (apostilleRequired) return "Priority";
  if ((signerCount || 1) > 1) return "Priority";
  return "Signature";
}

function calculateScore({
  country,
  useCase,
  urgency,
}: {
  country: string;
  useCase?: string;
  urgency?: string;
}): number {
  let score = 0;
  const dest = DESTINATIONS.find(
    (d) =>
      d.slug === country.toLowerCase().replace(/\s+/g, "-") ||
      d.name.toLowerCase() === country.toLowerCase(),
  );
  if (dest) {
    if (dest.demand >= 80) score += 30;
    else if (dest.demand >= 50) score += 20;
    else score += 10;
  } else score += 10;

  if (useCase === "dual-citizenship") score += 25;
  if (useCase === "citizenship") score += 20;
  if (useCase === "real-estate") score += 20;
  if (useCase === "property-transfer") score += 20;
  if (useCase === "corporate-expansion") score += 20;
  if (useCase === "foreign-business-registration") score += 15;
  if (useCase === "immigration") score += 15;
  if (useCase === "legal-filings") score += 10;
  if (urgency === "urgent") score += 25;

  return Math.min(score, 100);
}

function routeDeal(score: number): "HIGH" | "MEDIUM" | "LOW" {
  if (score >= 70) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

async function notifyHighValue(
  dealId: string,
  country: string,
  value: number,
  tier: string,
) {
  if (tier !== "HIGH") return;
  try {
    const supabase = createAdminClient();
    await supabase.from("notifications").insert({
      message: `HIGH VALUE MATTER — ${country} · $${value} · ${dealId}`,
      type: "HIGH_VALUE_DEAL",
      deal_id: dealId,
      read: false,
    });
  } catch {}
}

export async function POST(req: NextRequest) {
  try {
    let raw = await req.json();

    const useCase = (raw.use_case || raw.useCase || "") as string;
    const prefillDoc = (raw.document_type || raw.document || "") as string;
    const prefillCountry = (raw.country ||
      raw.destination_country ||
      "") as string;

    if (raw.message && !raw.document_type) {
      const parsed = parseIntake(raw.message);
      raw = {
        ...raw,
        name: raw.name || parsed.client_name || "",
        client_name: raw.client_name || parsed.client_name || "",
        country: raw.country || parsed.country || "",
        document_type: prefillDoc || parsed.document_type,
        signers: raw.signers || parsed.signer_count,
        urgency: raw.urgency || parsed.urgency,
        apostille: raw.apostille ?? parsed.apostille_needed,
      };
    }

    const data = normalizeMatter(raw);

    try {
      validateMatter(data);
    } catch (e: any) {
      return NextResponse.json(
        { error: e.message, code: e.message },
        { status: 400 },
      );
    }

    const country = data.country || prefillCountry || "United States";
    let compliance = null;
    try {
      compliance = validateCompliance({
        country,
        documentType: data.document_type || prefillDoc || "general",
        executionType: data.mobile ? "mobile" : "ron",
        destinationCountry: country,
      });
      if (compliance.apostille_required) data.apostille = true;
    } catch {}

    const autoLane = autoSelectLane({
      country,
      urgency: data.urgency as string,
      signerCount: Number(data.signers) || 1,
      apostilleRequired: compliance?.apostille_required ?? data.apostille,
    });

    const pricingInput = {
      ...data,
      urgency: data.urgency as "standard" | "urgent" | undefined,
      witness_type: data.witness_type as "ron" | "in_person" | undefined,
    };
    const pricing = determineLaneAndPrice(pricingInput);

    const laneOrder = ["Signature", "Priority", "Executive"];
    const finalLane =
      laneOrder.indexOf(autoLane) > laneOrder.indexOf(pricing.lane)
        ? autoLane
        : pricing.lane;

    const invoice = generateInvoice(pricing.total);
    const decline_risk = riskScore(data);
    const deal_id = genDealId();
    const access_token = randomUUID();
    const client_name =
      data.name || (raw as Record<string, string>).client_name || "";
    const source =
      ((data as Record<string, unknown>).source_channel as string) || "web";

    const conversion_score = calculateScore({
      country,
      useCase,
      urgency: data.urgency as string,
    });

    const priority_tier = routeDeal(conversion_score);

    const wiseResult = await createWisePaymentRequest({
      dealId: deal_id,
      amount: invoice.retainer,
      currency: "USD",
      description: `The Milano Seal™ — ${finalLane} Lane Retainer · ${
        data.document_type || prefillDoc || "Document"
      } · ${country}`,
      clientName: client_name,
      clientEmail: data.email || null,
      redirectUrl: `${SITE}/portal`,
    });
    const payment_link = wiseResult.url;
    const wise_invoice = {
      payment_method: "WISE",
      amount: invoice.retainer,
      reference: deal_id,
      note: `The Milano Seal™ — Retainer (50%) · ${client_name}`,
      wise_link: wiseResult.url,
      wise_request_id: wiseResult.id,
      wise_mode: wiseResult.mode,
      status: "AWAITING_PAYMENT",
    };

    const docType = data.document_type || prefillDoc || "";
    const companyName =
      ((raw as Record<string, string>).company_name as string) ||
      ((raw as Record<string, string>).company as string) ||
      null;
    const intakePayload = {
      deal_id,

      client_name,
      full_name: client_name,
      client_type:
        ((raw as Record<string, string>).client_type as string) ?? "individual",
      company_name: companyName,
      company: companyName,
      email: data.email || "",
      phone: data.phone || "",
      country,
      destination_country: country,
      origin_state:
        ((raw as Record<string, string>).origin_state as string) || null,
      document: docType,
      document_type: docType,
      service_type: docType,
      use_case: useCase || null,
      notes: data.notes || "",
      lane: finalLane,
      execution_tier: finalLane,
      execution_lane: finalLane,
      docs_count: Number(data.docs ?? 1),
      docs: Number(data.docs ?? 1),
      signers: Number(data.signers ?? 1),
      witnesses: Number(data.witnesses ?? 0),
      witness_type: data.witness_type ?? null,
      after_hours: Boolean(data.after_hours ?? false),
      urgency: (data.urgency as string) ?? "standard",
      mobile: Boolean(data.mobile ?? false),
      miles: Number(data.miles ?? 0),
      translation: Boolean(data.translation ?? false),
      multi_country: Boolean(data.multi_country ?? false),
      apostille_required:
        compliance?.apostille_required ?? Boolean(data.apostille ?? false),
      requires_apostille:
        compliance?.apostille_required ?? Boolean(data.apostille ?? false),
      amount: pricing.total,
      total_price: pricing.total,
      base_price: pricing.base,
      witness_total: pricing.witness_total,
      status: "awaiting_payment",
      deal_status: "awaiting_payment",
      payment_status: "pending",
      payment_method: "wise",
      invoice_status: "proforma",
      invoice_subtotal: invoice.subtotal,
      invoice_retainer: invoice.retainer,
      invoice_balance: invoice.balance,
      invoice_valid_until: new Date(invoice.valid_until).toISOString(),
      compliance_result: JSON.stringify(compliance),
      decline_risk,
      conversion_score,
      priority_tier,
      follow_up_active: true,
      last_contacted: null,
      followup_schedule: JSON.stringify(["24h", "72h", "7d"]),
      source,
      payment_link,
      access_token,
    };

    const supabase = createAdminClient();
    const { data: deal, error } = await supabase
      .from("deals")
      .insert([intakePayload])
      .select()
      .single();

    if (error) {
      console.error("DB insert error:", error);
      return NextResponse.json(
        {
          error: "Failed to save matter. Please try again or contact support.",
        },
        { status: 500 },
      );
    }

    void notifyHighValue(deal_id, country, pricing.total, priority_tier);

    if (deal?.id) {
      void (async () => {
        try {
          await appendLedger({
            deal_id: deal.id,
            event: CUSTODY_EVENTS.DOC_CREATED,
            actor_type: "system",
            location: "Milano Seal Intake",
            method: "intake",
            status: "created",
            metadata: {
              deal_code: deal_id,
              source,
              lane: finalLane,
              country,
              total: pricing.total,
            },
          });
        } catch (err) {
          console.error(
            "[intake] custody ledger failed:",
            err instanceof Error ? err.message : err,
          );
        }
      })();

      void (async () => {
        try {
          await runDealEngine({
            id: deal.id,
            deal_id,
            email: data.email,
            phone: data.phone as string | undefined,
            client_name,
            document_type: data.document_type as string | undefined,
            destination_country: country,
            country,
            status: "awaiting_payment",
            payment_status: "pending",
            payment_link,
            raw_text:
              ((raw as Record<string, string>).message as string) ?? null,
            mobile: Boolean(data.mobile ?? false),
            signers: Number(data.signers ?? 1),
            witnesses: Number(data.witnesses ?? 0),
          });
        } catch (err) {
          console.error(
            "[intake] runDealEngine failed:",
            err instanceof Error ? err.message : err,
          );
        }
      })();
    }

    if (data.email) {
      void sendIntakeConfirmation({
        to: data.email as string,
        name: client_name,
        dealId: deal_id,
        lane: finalLane,
        total: pricing.total,
        retainer: invoice.retainer,
        paymentLink: payment_link,
        portalUrl: `${SITE}/portal/${access_token}`,
      });
    }

    void (async () => {
      let actor = source === "admin" ? "admin" : `${source}-intake`;
      try {
        const ssr = await createClient();
        const {
          data: { user },
        } = await ssr.auth.getUser();
        if (user?.email) actor = user.email;
      } catch {}
      await logActivity({
        deal_id,
        actor,
        action: "created",
        detail: `Intake captured · ${finalLane} lane · $${pricing.total} · ${country}`,
        meta: {
          source,
          lane: finalLane,
          conversion_score,
          priority_tier,
        },
      });
    })();

    const pricingBreakdown: { label: string; amount: number }[] = [
      { label: `${finalLane} base`, amount: pricing.base },
    ];
    if (pricing.witness_total > 0) {
      pricingBreakdown.push({
        label: `Witnesses · ${data.witnesses ?? 0}`,
        amount: pricing.witness_total,
      });
    }
    for (const addon of pricing.addons) {
      pricingBreakdown.push({ label: addon.item, amount: addon.amount });
    }
    const rationaleByLane: Record<string, string> = {
      RON_SIMPLE: "Colorado RON-only path — RON Simple lane applies.",
      MOBILE_STANDARD: "Florida mobile execution + round-trip mileage.",
      Signature: "Standard international execution path.",
      Priority: "Multi-signer or translation triggers Priority lane.",
      Executive:
        "Urgent or multi-country routing — Executive lane handles it end-to-end.",
    };

    return NextResponse.json({
      success: true,
      deal_id: deal?.deal_id || deal_id,
      lane: finalLane,
      estimated_value: pricing.total,
      conversion_score,
      priority_tier,
      payment_method: "WISE",
      wise_invoice,
      payment_link,
      pricing: {
        lane: finalLane,
        base: pricing.base,
        witness_total: pricing.witness_total,
        total: pricing.total,
        breakdown: pricingBreakdown,
        rationale: rationaleByLane[finalLane] ?? "Standard pricing applied.",
      },
      execution_stage: "Awaiting Payment",
      portal_url: `${
        process.env.NEXT_PUBLIC_SITE_URL || "https://themilanoseal.com"
      }/portal/${access_token}`,
      compliance_result: compliance,
      decline_risk,
      invoice,
    });
  } catch (err: any) {
    console.error("Intake error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
