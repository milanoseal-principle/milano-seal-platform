import { createAdminClient } from "@/lib/supabase/admin";
import type { IntakePayload, MilanoMatterLike } from "@/src/features/milano/types";

function splitName(input?: string) {
  const parts = String(input ?? "").trim().split(/\s+/).filter(Boolean);
  return { first_name: parts[0] ?? null, last_name: parts.slice(1).join(" ") || null };
}

export function createMatterReference(date = new Date()) {
  const year = date.getUTCFullYear();
  const suffix = `${date.getTime()}`.slice(-6);
  return `MS-${year}-${suffix}`;
}

export async function createClientAndMatter(payload: IntakePayload, matter: Partial<MilanoMatterLike>) {
  const supabase = createAdminClient();
  const name = splitName(payload.full_name);
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      first_name: payload.first_name ?? name.first_name,
      last_name: payload.last_name ?? name.last_name,
      email: payload.email,
      phone: payload.phone,
      whatsapp: payload.whatsapp,
      firm_name: payload.firm_name,
      client_type: payload.client_type ?? "client",
    })
    .select("id")
    .single();

  if (clientError) throw clientError;

  const matterReference = matter.matter_reference ?? createMatterReference();
  const portalToken = matter.portal_token ?? crypto.randomUUID();
  const { data: createdMatter, error: matterError } = await supabase
    .from("matters")
    .insert({
      ...matter,
      matter_reference: matterReference,
      portal_token: portalToken,
      client_id: client.id,
      status: matter.status ?? "intake_received",
      payment_status: matter.payment_status ?? "unpaid",
      release_status: matter.release_status ?? "locked",
      document_type: payload.document_type,
      document_description: payload.document_description,
      destination_country: payload.destination_country,
      origin_state: payload.origin_state,
      signer_location: payload.signer_location,
      document_count: payload.document_count ?? 1,
      signer_count: payload.signer_count ?? 1,
      notarized_signature_count: payload.notarized_signature_count ?? payload.signer_count ?? 1,
      execution_type: payload.execution_type ?? "unsure",
      apostille_required: payload.apostille_required,
      translation_required: payload.translation_required,
      deadline_date: payload.deadline_date || null,
      urgency: payload.urgency,
      referral_source: payload.referral_source,
    })
    .select("*")
    .single();

  if (matterError) throw matterError;
  return { client, matter: createdMatter };
}

export async function getMatterById(id: string) {
  const supabase = createAdminClient();
  return supabase.from("matters").select("*").eq("id", id).single();
}

export async function updateMatter(id: string, values: Record<string, unknown>) {
  const supabase = createAdminClient();
  return supabase.from("matters").update(values).eq("id", id).select("*").single();
}
