import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { inquirySchema, documentError } from "@/lib/counsel/inquiry";
import { sendCounselInquiryAlerts } from "@/lib/notifications/transactionalEmailAlerts";

const hash = (value: string | Uint8Array) =>
  createHash("sha256").update(value).digest("hex");
const fail = (error: string, status: number) =>
  NextResponse.json({ ok: false, error }, { status });

export async function receiveCounselInquiry(
  request: Request,
  dependencies = { admin: createAdminClient, notify: sendCounselInquiryAlerts },
) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return fail("Please submit from the Milano website.", 403);
  if (Number(request.headers.get("content-length") ?? 0) > 4.2 * 1024 * 1024)
    return fail("The request is too large.", 413);
  try {
    const reader = request.body?.getReader();
    if (!reader) return fail("The request is empty.", 400);
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 4.2 * 1024 * 1024) {
        await reader.cancel();
        return fail("The request is too large.", 413);
      }
      chunks.push(value);
    }
    const form = await new Response(Buffer.concat(chunks), {
      headers: { "content-type": request.headers.get("content-type") ?? "" },
    }).formData();
    if (form.get("website")) return fail("Unable to submit this request.", 400);
    let raw: unknown;
    try {
      raw = JSON.parse(String(form.get("inquiry") ?? "{}"));
    } catch {
      return fail("Please check the form.", 400);
    }
    const parsed = inquirySchema.safeParse(raw);
    if (!parsed.success)
      return fail(
        parsed.error.issues[0]?.message ?? "Please check the form.",
        400,
      );
    const inquiry = parsed.data;
    const entry = form.get("document");
    const file = entry instanceof File && entry.size ? entry : null;
    if (file && (inquiry.intent === "question" || documentError(file)))
      return fail(
        documentError(file) ?? "Documents belong with an execution review.",
        400,
      );
    const bytes = file ? new Uint8Array(await file.arrayBuffer()) : null;
    // Check signatures rather than trusting browser MIME alone.
    if (bytes && file) {
      const valid =
        file.type === "application/pdf"
          ? Buffer.from(bytes.slice(0, 5)).toString() === "%PDF-"
          : file.type === "image/png"
            ? Buffer.from(bytes.slice(0, 8)).equals(
                Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
              )
            : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
      if (!valid)
        return fail(
          "The document format could not be verified. Choose another file.",
          400,
        );
    }
    const fingerprint = hash(
      JSON.stringify(inquiry) + (bytes ? hash(bytes) : ""),
    );
    const admin = dependencies.admin();
    const { data: existing, error: lookupError } = await admin
      .from("sales_leads")
      .select("id,details")
      .eq("id", inquiry.request_id)
      .maybeSingle();
    if (lookupError)
      return fail("We could not receive your request. Please try again.", 503);
    if (existing && existing.details?.fingerprint !== fingerprint)
      return fail(
        "This request changed. Please start a fresh submission.",
        409,
      );
    if (!existing) {
      // Hash network address; do not retain the raw address in inquiry records.
      const ipHash = hash(
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          "unknown",
      );
      const { count, error: rateError } = await admin
        .from("sales_leads")
        .select("id", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .gte("created_at", new Date(Date.now() - 3600000).toISOString());
      if (rateError)
        return fail(
          "We could not receive your request. Please try again.",
          503,
        );
      if ((count ?? 0) >= 20)
        return fail("Please wait before sending another request.", 429);
      const { error } = await admin.from("sales_leads").insert({
        id: inquiry.request_id,
        full_name: inquiry.full_name,
        email: inquiry.email.toLowerCase(),
        audience: "foreign_counsel",
        country: inquiry.country,
        source_route: "/counsel",
        desired_next_step: inquiry.intent,
        lead_type: "counsel_inquiry",
        ip_hash: ipHash,
        details: {
          ...inquiry,
          fingerprint,
          document_status: file ? "pending" : "not_provided",
        },
      });
      if (error && error.code !== "23505")
        return fail(
          "We could not receive your request. Please try again.",
          503,
        );
      if (error)
        return fail(
          "A submission is already being processed. Please retry.",
          409,
        );
    }
    let documentStatus =
      existing?.details?.document_status ?? (file ? "pending" : "not_provided");
    if (file && bytes && documentStatus !== "received") {
      const { data: bucket, error: bucketError } =
        await admin.storage.getBucket("deal-documents");
      if (bucketError || !bucket || bucket.public !== false)
        return fail(
          "Your inquiry was saved, but private document storage is unavailable. Please retry later.",
          503,
        );
      const path = `counsel/${inquiry.request_id}/${hash(bytes)}`;
      const { error: uploadError } = await admin.storage
        .from("deal-documents")
        .upload(path, bytes, { contentType: file.type, upsert: true });
      if (uploadError)
        return fail(
          "Your inquiry was saved, but the document was not received. Retry with the same document to finish.",
          503,
        );
      const { error: updateError } = await admin
        .from("sales_leads")
        .update({
          details: {
            ...inquiry,
            fingerprint,
            document_status: "received",
            document: {
              path,
              name: file.name.slice(0, 200),
              type: file.type,
              size: file.size,
            },
          },
        })
        .eq("id", inquiry.request_id);
      if (updateError)
        return fail(
          "Document confirmation is unavailable. Please retry to finish.",
          503,
        );
      documentStatus = "received";
    }
    // Persistence establishes receipt. Email is a separate evidenced transport.
    let notification = "unavailable";
    try {
      notification = await dependencies.notify(inquiry.request_id);
    } catch {
      console.error("[counsel] notification unavailable", {
        reference: inquiry.request_id,
      });
    }
    return NextResponse.json({
      ok: true,
      reference: inquiry.request_id,
      destination: inquiry.destination,
      email: inquiry.email,
      document_status: documentStatus,
      notification,
    });
  } catch {
    return fail(
      "We could not receive your request. Your form is still here; please try again.",
      503,
    );
  }
}
