import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeDiscountCode } from "@/lib/discountCodes";

export const runtime = "nodejs";

const MANAGER_ROLES = new Set([
  "founder",
  "founder_admin",
  "admin",
  "admin_operator",
]);

async function requireFounderOrAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const role = String(user.app_metadata?.role ?? "");
  return MANAGER_ROLES.has(role) ? { user, role } : null;
}

function safeMetadata(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const raw = input as Record<string, unknown>;
  return {
    alliance_member_id:
      typeof raw.alliance_member_id === "string" && raw.alliance_member_id.trim()
        ? raw.alliance_member_id.trim()
        : null,
    eligible_service_scope:
      typeof raw.eligible_service_scope === "string" && raw.eligible_service_scope.trim()
        ? raw.eligible_service_scope.trim()
        : "all_eligible_services",
    stackable: false,
  };
}

export async function GET() {
  if (!(await requireFounderOrAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("discount_codes")
    .select(
      "id,code,discount_type,discount_value,status,usage_limit,usage_count,starts_at,expires_at,applies_to,client_id,attorney_profile_id,matter_id,internal_reason,client_label,created_by,updated_by,metadata,created_at,updated_at",
    )
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const auth = await requireFounderOrAdmin();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = (await request.json()) as {
    code?: string;
    discount_type?: "percentage" | "fixed_amount";
    discount_value?: number;
    applies_to?: "eligible_subtotal" | "specific_line_items" | "matter_total";
    usage_limit?: number | null;
    starts_at?: string | null;
    expires_at?: string | null;
    internal_reason?: string | null;
    client_label?: string | null;
    matter_id?: string | null;
    client_id?: string | null;
    metadata?: Record<string, unknown> | null;
  };

  if (!body.code || !body.discount_type || body.discount_value === undefined) {
    return NextResponse.json(
      { error: "code, discount_type, and discount_value are required" },
      { status: 400 },
    );
  }

  if (!new Set(["percentage", "fixed_amount"]).has(body.discount_type)) {
    return NextResponse.json({ error: "Invalid discount_type" }, { status: 400 });
  }
  if (body.discount_value <= 0 || (body.discount_type === "percentage" && body.discount_value > 100)) {
  if (
    body.discount_value <= 0 ||
    (body.discount_type === "percentage" && body.discount_value > 100)
  ) {
    return NextResponse.json({ error: "Invalid discount_value" }, { status: 400 });
  }
  if (body.usage_limit !== undefined && body.usage_limit !== null && body.usage_limit < 1) {
    return NextResponse.json({ error: "usage_limit must be at least 1" }, { status: 400 });
  }
  if (!body.internal_reason?.trim()) {
    return NextResponse.json({ error: "internal_reason is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("discount_codes")
    .insert({
      code: normalizeDiscountCode(body.code),
      discount_type: body.discount_type,
      discount_value: body.discount_value,
      applies_to: body.applies_to ?? "eligible_subtotal",
      usage_limit: body.usage_limit ?? null,
      usage_count: 0,
      starts_at: body.starts_at ?? null,
      expires_at: body.expires_at ?? null,
      internal_reason: body.internal_reason ?? null,
      client_label: body.client_label ?? "Milano Seal courtesy adjustment",
      matter_id: body.matter_id ?? null,
      client_id: body.client_id ?? null,
      internal_reason: body.internal_reason.trim(),
      client_label: body.client_label ?? "Milano Seal courtesy adjustment",
      matter_id: body.matter_id ?? null,
      client_id: body.client_id ?? null,
      metadata: safeMetadata(body.metadata),
      // Creation never silently activates a courtesy code. Founder/admin must
      // explicitly activate it after reviewing scope and eligibility.
      status: "inactive",
      created_by: auth.user.id,
      updated_by: auth.user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireFounderOrAdmin();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = (await request.json()) as {
    id?: string;
    status?: "inactive" | "active" | "exhausted" | "expired" | "revoked";
    starts_at?: string | null;
    expires_at?: string | null;
    usage_limit?: number | null;
    client_label?: string;
    internal_reason?: string;
    metadata?: Record<string, unknown> | null;
  };
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const update: Record<string, unknown> = { updated_by: auth.user.id };
  if (body.status !== undefined) update.status = body.status;
  if (body.starts_at !== undefined) update.starts_at = body.starts_at;
  if (body.expires_at !== undefined) update.expires_at = body.expires_at;
  if (body.usage_limit !== undefined) update.usage_limit = body.usage_limit;
  if (body.client_label !== undefined) update.client_label = body.client_label;
  if (body.internal_reason !== undefined) {
    if (!body.internal_reason.trim()) {
      return NextResponse.json({ error: "internal_reason cannot be blank" }, { status: 400 });
    }
    update.internal_reason = body.internal_reason.trim();
  }
  if (body.metadata !== undefined) update.metadata = safeMetadata(body.metadata);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("discount_codes")
    .update(update)
    .eq("id", body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
