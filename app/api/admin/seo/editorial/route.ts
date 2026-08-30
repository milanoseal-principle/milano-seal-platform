import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { COUNTRY_DOCUMENT_SEO_RECORDS } from "@/lib/seo/country-document/registry";

export async function GET() {
  await requireDashboardAccess();
  const admin = createAdminClient();
  const { data, error } = await admin.from("seo_editorial_reviews").select("*");
  if (error) return NextResponse.json({ code: "SEO_EDITORIAL_READ_FAILED" }, { status: 500 });
  const persisted = new Map((data ?? []).map((item) => [`${item.country_slug}:${item.document_slug}`, item]));
  return NextResponse.json({ records: COUNTRY_DOCUMENT_SEO_RECORDS.map((record) => ({ ...record, editorialReview: persisted.get(`${record.countrySlug}:${record.documentSlug}`) ?? null })) });
}
