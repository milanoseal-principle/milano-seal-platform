export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const TRANSLATION_REQUIRED_COUNTRIES = [
  "Italy", "France", "Spain", "Portugal", "Germany", "Mexico",
  "Brazil", "China", "Japan", "South Korea", "Russia", "Ukraine",
  "Poland", "Czech Republic", "Hungary", "Romania", "Bulgaria",
  "Greece", "Turkey", "Saudi Arabia", "UAE", "Egypt", "Morocco",
  "Argentina", "Chile", "Colombia", "Peru", "Venezuela",
];

function maskName(fullName: string | null): string {
  if (!fullName) return "—";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase() + ".";
  const first = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${first} ${lastInitial}.`;
}

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export async function GET() {
  try {
    const admin = createAdminClient();
    const now = new Date();
    const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const d2 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const d3 = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const h48 = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

    const { data: allDeals } = await admin
      .from("deals")
      .select("id, deal_id, client_name, matter_status, deal_status, destination_country, document_type, payment_status, updated_at, created_at, translation, total_price");

    const deals = (allDeals ?? []) as Record<string, unknown>[];

    const completedStatuses = ["completed", "closed", "delivered"];

    function toRow(d: Record<string, unknown>, severity: string) {
      const updatedAt = d.updated_at as string;
      const days = updatedAt ? daysSince(updatedAt) : 0;
      return {
        id: d.id as string,
        deal_id: d.deal_id as string,
        client_name_masked: maskName(d.client_name as string),
        matter_status: ((d.matter_status ?? d.deal_status ?? "unknown") as string),
        destination_country: d.destination_country as string,
        document_type: d.document_type as string,
        days_blocked: days,
        severity,
      };
    }

    const payment_issues = deals
      .filter(d =>
        d.payment_status === "pending" &&
        (d.created_at as string) < h24
      )
      .map(d => toRow(d, "HIGH"));

    const authority_issues = deals
      .filter(d => {
        const ms = (d.matter_status ?? d.deal_status) as string;
        return ms === "compliance_review" && (d.updated_at as string) < d3;
      })
      .map(d => toRow(d, "AMBER"));

    const courier_issues = deals
      .filter(d => {
        const ms = (d.matter_status ?? d.deal_status) as string;
        return ["courier_ready", "shipped"].includes(ms) && (d.updated_at as string) < d2;
      })
      .map(d => toRow(d, "GREEN"));

    const translation_issues = deals
      .filter(d => {
        const country = d.destination_country as string;
        const needsTranslation = TRANSLATION_REQUIRED_COUNTRIES.includes(country);
        const ms = (d.matter_status ?? d.deal_status) as string;
        const beyondScheduled = !["intake_received", "awaiting_payment"].includes(ms);
        return needsTranslation && !d.translation && beyondScheduled;
      })
      .map(d => toRow(d, "AMBER"));

    const missing_docs = deals
      .filter(d => {
        const ms = (d.matter_status ?? d.deal_status) as string;
        return ms === "intake_received" && (d.updated_at as string) < h48;
      })
      .map(d => toRow(d, "GREEN"));

    const blocked_3d = deals
      .filter(d => {
        const ms = (d.matter_status ?? d.deal_status) as string;
        return (d.updated_at as string) < d3 && !completedStatuses.includes(ms);
      })
      .map(d => toRow(d, "AMBER"));

    const blocked_7d = deals
      .filter(d => {
        const ms = (d.matter_status ?? d.deal_status) as string;
        return (d.updated_at as string) < d7 && !completedStatuses.includes(ms);
      })
      .map(d => toRow(d, "RED"));

    const needs_operator = deals
      .filter(d => {
        const ms = (d.matter_status ?? d.deal_status) as string;
        return ["under_review", "compliance_review"].includes(ms) &&
          (d.updated_at as string) < h24;
      })
      .map(d => toRow(d, "GOLD"));

    return NextResponse.json({
      payment_issues,
      authority_issues,
      courier_issues,
      translation_issues,
      missing_docs,
      blocked_3d,
      blocked_7d,
      needs_operator,
    });
  } catch (err) {
    console.error("[execution-control]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
