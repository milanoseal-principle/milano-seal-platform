"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Inquiry = {
  id: string;
  full_name: string;
  email: string;
  country: string;
  created_at: string;
  canonical_matter_id: string | null;
  details: {
    firm?: string;
    intent?: string;
    destination?: string;
    summary?: string;
    attribution?: Record<string, string>;
    document_status?: string;
  };
};
type Evidence = {
  id: string;
  status: string;
  delivery_status: string | null;
  error_message: string | null;
  metadata: { inquiry_reference?: string };
};
export default function CounselInbox() {
  const [funnel, setFunnel] = useState<Record<string, unknown>>({});
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [notifications, setNotifications] = useState<Evidence[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  async function load() {
    try {
      const response = await fetch("/api/admin/counsel", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setFunnel({
        marketing_events: body.marketing,
        canonical_truth_for_displayed_inquiries: body.operational,
      });
      setInquiries(body.inquiries);
      setNotifications(body.notifications);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Inquiry inbox unavailable.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function action(reference: string, action: string, matter_id?: string) {
    setBusy(reference);
    setError("");
    setStatus("");
    try {
      const response = await fetch("/api/admin/counsel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, action, matter_id }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      if (body.url) window.location.assign(body.url);
      else {
        setStatus(
          body.notification
            ? `Notification evidence: ${body.notification}`
            : "Canonical Matter association saved.",
        );
        await load();
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  }
  return (
    <main className="mx-auto max-w-5xl p-6 text-white">
      <h1 className="font-serif text-3xl">Counsel inquiries</h1>
      <p className="my-4 text-sm text-white/70">
        Latest 100 inquiries. Receipt, email provider acceptance and delivery
        are separate facts. Link an existing canonical Matter only after
        governed intake; this action grants no execution authority.
      </p>
      <details className="my-4">
        <summary>Acquisition events and canonical Matter counts</summary>
        <p className="text-sm">
          Marketing events are observational and can be blocked or duplicated.
          Canonical counts cover Matters linked to the latest 100 inquiries;
          repeat sources count only those linked Matters.
        </p>
        <pre className="whitespace-pre-wrap break-all text-xs">
          {JSON.stringify(funnel, null, 2)}
        </pre>
      </details>
      <Link
        href="/professional/start"
        className="inline-block py-3 text-[#C6A65B] underline"
      >
        Open existing professional Matter workflow
      </Link>
      {error && <p role="alert">{error}</p>}
      <p role="status">{loading ? "Loading…" : status}</p>
      {!loading && !error && inquiries.length === 0 && (
        <p>No counsel inquiries found.</p>
      )}
      {inquiries.map((inquiry) => (
        <article
          key={inquiry.id}
          className="my-6 break-words border border-white/20 p-5"
        >
          <h2 className="font-serif text-2xl">
            {inquiry.full_name} · {inquiry.details.firm}
          </h2>
          <p>
            {inquiry.email} · {inquiry.country}
          </p>
          <p className="text-sm">
            {inquiry.created_at} · {inquiry.id}
          </p>
          <p className="mt-4">
            {inquiry.details.intent} · Destination:{" "}
            {inquiry.details.destination || "Not provided"}
          </p>
          <p className="my-3 whitespace-pre-wrap">{inquiry.details.summary}</p>
          <p>Document: {inquiry.details.document_status}</p>
          <p>
            Canonical Matter: {inquiry.canonical_matter_id || "Not yet linked"}
          </p>
          <details className="my-4">
            <summary>Acquisition context</summary>
            <pre className="whitespace-pre-wrap break-all text-xs">
              {JSON.stringify(inquiry.details.attribution ?? {}, null, 2)}
            </pre>
          </details>
          <ul className="my-4 text-sm">
            {notifications
              .filter((item) => item.metadata.inquiry_reference === inquiry.id)
              .map((item) => (
                <li key={item.id}>
                  Email: {item.delivery_status ?? item.status}
                  {item.error_message ? ` — ${item.error_message}` : ""}
                </li>
              ))}
          </ul>
          <div className="flex flex-wrap gap-4">
            <button
              disabled={busy === inquiry.id}
              onClick={() => void action(inquiry.id, "retry_notification")}
              className="min-h-12 border border-white/30 px-4"
            >
              Retry notification
            </button>
            {inquiry.details.document_status === "received" && (
              <button
                disabled={busy === inquiry.id}
                onClick={() => void action(inquiry.id, "document")}
                className="min-h-12 border border-white/30 px-4"
              >
                Download private document
              </button>
            )}
          </div>
          {!inquiry.canonical_matter_id && (
            <form
              className="mt-4 flex flex-wrap gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                const value = new FormData(event.currentTarget).get(
                  "matter_id",
                );
                void action(inquiry.id, "link_matter", String(value));
              }}
            >
              <label className="flex flex-col text-sm">
                Existing canonical Matter UUID
                <input
                  name="matter_id"
                  required
                  className="min-h-12 border border-white/30 bg-black p-2"
                />
              </label>
              <button
                disabled={busy === inquiry.id}
                className="min-h-12 self-end border border-[#C6A65B] px-4"
              >
                Link Matter
              </button>
            </form>
          )}
        </article>
      ))}
    </main>
  );
}
