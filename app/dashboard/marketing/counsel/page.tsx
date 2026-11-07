"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";

type Inquiry = {
  id: string;
  full_name: string;
  email: string;
  country: string;
  created_at: string;
  canonical_matter_id: string | null;
  acquisition?: {
    stage: string;
    age_hours: number;
    response_evidence: string;
    next_action: string;
    professional_profile_id: string | null;
    follow_up_due: boolean;
    activation_opportunity: boolean;
    repeat_opportunity: boolean;
    last_operator_action: { recorded_at: string; note: string } | null;
  };
  details: {
    firm?: string;
    intent?: string;
    destination?: string;
    summary?: string;
    attribution?: Record<string, string>;
    document_status?: string;
    handoff_failures?: Array<{ code: string; occurred_at: string }>;
  };
};
type Evidence = {
  id: string;
  status: string;
  delivery_status: string | null;
  error_message: string | null;
  metadata: { inquiry_reference?: string };
};
function operatorTime(value: string) {
  return (
    new Date(value).toLocaleString("en-US", { timeZone: "America/New_York" }) +
    " New York"
  );
}
export default function CounselInbox() {
  const [profiles, setProfiles] = useState<
    Array<{ id: string; firm_name: string; email: string; status: string }>
  >([]);
  const [filter, setFilter] = useState("");
  const actionIds = useRef(new Map<string, { key: string; id: string }>());
  const [funnel, setFunnel] = useState<Record<string, unknown>>({});
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [notifications, setNotifications] = useState<Evidence[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  async function load() {
    try {
      const response = await fetch(
        `/api/admin/counsel${filter ? `?${filter}` : ""}`,
        { cache: "no-store" },
      );
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setProfiles(body.professional_profiles ?? []);
      setFunnel({
        acquisition_cohort: body.acquisition,
        professional_history: body.professional_history,
        professional_history_scope: body.professional_history_scope,
        notification_failures_in_latest_300_records: body.notification_failures,
        marketing_scope: body.marketing_scope,
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
  async function action(
    reference: string,
    action: string,
    input?: string | Record<string, unknown>,
  ) {
    setBusy(reference);
    setError("");
    setStatus("");
    try {
      let operator_action: Record<string, unknown> | undefined;
      if (input && typeof input === "object") {
        const key = JSON.stringify(input),
          previous = actionIds.current.get(reference);
        const id = previous?.key === key ? previous.id : crypto.randomUUID();
        actionIds.current.set(reference, { key, id });
        operator_action = { ...input, id };
      }
      const response = await fetch("/api/admin/counsel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference,
          action,
          matter_id: typeof input === "string" ? input : undefined,
          operator_action,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      if (body.url) window.location.assign(body.url);
      else {
        setStatus(
          body.notification
            ? `Notification evidence: ${body.notification}`
            : "Operator action saved.",
        );
        await load();
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  }
  const cohort = funnel.acquisition_cohort as
    | Record<string, unknown>
    | undefined;
  const sourceCounts = cohort?.sources as Record<string, number> | undefined;
  return (
    <main className="mx-auto max-w-5xl p-6 text-white">
      <h1 className="font-serif text-3xl">Counsel inquiries</h1>
      <p className="my-4 text-sm text-white/70">
        Latest 100 inquiries. Receipt, email provider acceptance and delivery
        are separate facts. Link an existing canonical Matter only after
        governed intake; this action grants no execution authority.
      </p>
      <form
        className="my-5 flex flex-wrap gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void load();
        }}
      >
        <label>
          Segment filters (source, campaign, destination, professional_country,
          practice_area, professional_id, medium, content, landing_page)
          <input
            aria-label="Segment filters"
            className="block min-h-12 w-full border border-white/30 bg-black p-2"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="source=instagram&destination=Italy"
          />
        </label>
        <button className="min-h-12 border border-[#C6A65B] px-5">
          Apply filters
        </button>
      </form>
      {cohort && (
        <section className="my-6 border-y border-white/20 py-5">
          <h2 className="font-serif text-2xl">Latest inquiry cohort</h2>
          <p className="my-3 text-sm text-white/70">
            New York business day; latest 100 records before filters.
            Qualification and response are operator-attested. Operational counts
            require canonical records.
          </p>
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {[
              ["new_today", "New today"],
              ["awaiting_response", "Awaiting response"],
              ["qualified", "Qualified"],
              ["documents_received", "Documents received"],
              ["uploads_pending", "Uploads pending"],
              ["follow_ups_due", "Follow-ups due"],
            ].map(([key, label]) => (
              <div key={key}>
                <dt className="text-sm text-white/70">{label}</dt>
                <dd className="mt-1 text-2xl">
                  {String(cohort[key] ?? "Unknown")}
                </dd>
              </div>
            ))}
          </dl>
          <h3 className="mt-5 font-serif text-xl">Known sources</h3>
          <ul className="mt-2 text-sm">
            {Object.entries(sourceCounts ?? {}).map(([source, count]) => (
              <li key={source}>
                {source}: {count} persisted inquiries
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm">
            Notification failures in the latest notification sample:{" "}
            {String(
              funnel.notification_failures_in_latest_300_records ?? "Unknown",
            )}
          </p>
        </section>
      )}
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
          id={`inquiry-${inquiry.id}`}
          className="my-6 break-words border border-white/20 p-5"
        >
          <h2 className="font-serif text-2xl">
            {inquiry.full_name} · {inquiry.details.firm}
          </h2>
          <p>
            {inquiry.email} · {inquiry.country}
          </p>
          <p className="text-sm">
            {operatorTime(inquiry.created_at)} · {inquiry.id}
          </p>
          <p className="mt-4">
            {inquiry.details.intent} · Destination:{" "}
            {inquiry.details.destination || "Not provided"}
          </p>
          <p className="my-3 whitespace-pre-wrap">{inquiry.details.summary}</p>
          <p>Document: {inquiry.details.document_status}</p>
          {inquiry.details.handoff_failures?.length ? (
            <p>
              Last handoff failure:{" "}
              {inquiry.details.handoff_failures.at(-1)?.code} ·{" "}
              {operatorTime(
                inquiry.details.handoff_failures.at(-1)!.occurred_at,
              )}
              . Inquiry remains available for review and retry.
            </p>
          ) : null}
          {inquiry.acquisition && (
            <div className="my-4 border-l border-[#C6A65B] pl-4">
              <p>
                {inquiry.acquisition.stage} · {inquiry.acquisition.age_hours}{" "}
                hours since receipt
              </p>
              <p>
                Response evidence: {inquiry.acquisition.response_evidence}.
                Operator attestation does not prove email delivery.
              </p>
              <p>Next: {inquiry.acquisition.next_action}</p>
              {inquiry.acquisition.follow_up_due && <p>Follow-up is due.</p>}
              {inquiry.acquisition.last_operator_action && (
                <p>
                  Last action:{" "}
                  {operatorTime(
                    inquiry.acquisition.last_operator_action.recorded_at,
                  )}{" "}
                  · {inquiry.acquisition.last_operator_action.note}
                </p>
              )}
            </div>
          )}
          <button
            type="button"
            className="my-3 min-h-12 border border-white/30 px-4"
            disabled={busy === inquiry.id}
            onClick={async () => {
              setBusy(inquiry.id);
              try {
                const response = await fetch("/api/admin/professionals");
                const result = await response.json();
                if (!response.ok) throw new Error(result.error);
                const matches = (result.profiles ?? []).filter(
                  (profile: { email: string }) =>
                    profile.email.trim().toLowerCase() ===
                    inquiry.email.trim().toLowerCase(),
                );
                setProfiles((current) => [
                  ...current.filter(
                    (profile) =>
                      !matches.some(
                        (match: { id: string }) => match.id === profile.id,
                      ),
                  ),
                  ...matches,
                ]);
                setStatus(
                  matches.length
                    ? `Existing professional profile: ${matches[0].id}. Review the relationship before qualification.`
                    : "No existing professional profile matches. Use the existing professional profile workflow after contacting counsel; lookup grants no access.",
                );
              } catch (failure) {
                setError(
                  failure instanceof Error
                    ? failure.message
                    : "Professional lookup failed.",
                );
              } finally {
                setBusy(null);
              }
            }}
          >
            Find existing professional profile
          </button>
          {inquiry.acquisition?.response_evidence === "operator_attested" && (
            <button
              type="button"
              className="my-3 min-h-12 border border-white/30 px-4"
              disabled={busy === inquiry.id}
              onClick={async () => {
                setBusy(inquiry.id);
                try {
                  const response = await fetch("/api/professional/profile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      firm_name: inquiry.details.firm,
                      contact_name: inquiry.full_name,
                      email: inquiry.email,
                      country: inquiry.country,
                    }),
                  });
                  const result = await response.json();
                  if (!response.ok || !result.ok)
                    throw new Error(
                      result.error || "Profile could not be saved.",
                    );
                  setStatus(
                    "Prospect profile received through the existing workflow. No account has been activated. Find the existing profile, then review qualification.",
                  );
                } catch (failure) {
                  setError(
                    failure instanceof Error
                      ? failure.message
                      : "Profile could not be saved.",
                  );
                } finally {
                  setBusy(null);
                }
              }}
            >
              Create prospect through existing profile workflow
            </button>
          )}
          <details className="my-4">
            <summary className="min-h-12 cursor-pointer">
              Record operator action
            </summary>
            <form
              className="grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                const values = Object.fromEntries(
                  new FormData(event.currentTarget),
                );
                const evidence = Object.fromEntries(
                  Object.entries(values).filter(([, value]) =>
                    String(value).trim(),
                  ),
                );
                if (evidence.follow_up_at)
                  evidence.follow_up_at = new Date(
                    String(evidence.follow_up_at),
                  ).toISOString();
                void action(inquiry.id, "record_action", evidence);
              }}
            >
              <label>
                Action
                <select
                  name="kind"
                  className="block min-h-12 w-full border border-white/30 bg-black p-2"
                >
                  <option value="review">Review</option>
                  <option value="respond">
                    Record completed response (operator attestation)
                  </option>
                  <option value="qualify">Qualify existing professional</option>
                  <option value="follow_up">Set follow-up</option>
                  <option value="close">Close inquiry</option>
                </select>
              </label>
              <label>
                Operator note (required)
                <textarea
                  name="note"
                  required
                  minLength={10}
                  maxLength={1000}
                  className="block w-full border border-white/30 bg-black p-2"
                />
              </label>
              <label>
                Next action
                <input
                  name="next_action"
                  maxLength={240}
                  className="block min-h-12 w-full border border-white/30 bg-black p-2"
                />
              </label>
              <label>
                Follow-up date in your local time (optional)
                <input
                  name="follow_up_at"
                  type="datetime-local"
                  className="block min-h-12 w-full border border-white/30 bg-black p-2"
                />
              </label>
              <label>
                Completed response channel
                <select
                  name="channel"
                  className="block min-h-12 w-full border border-white/30 bg-black p-2"
                >
                  <option value="">Only for a completed response</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="meeting">Meeting</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>
                Response evidence reference (required for response)
                <input
                  name="evidence_reference"
                  maxLength={300}
                  placeholder="Call record or message reference; no document contents"
                  className="block min-h-12 w-full border border-white/30 bg-black p-2"
                />
              </label>
              <label>
                Existing professional profile UUID (required for qualification)
                <input
                  name="professional_profile_id"
                  defaultValue={
                    profiles.find(
                      (profile) =>
                        profile.email.toLowerCase() ===
                        inquiry.email.toLowerCase(),
                    )?.id ?? ""
                  }
                  className="block min-h-12 w-full border border-white/30 bg-black p-2"
                />
              </label>
              <button
                disabled={busy === inquiry.id}
                className="min-h-12 border border-[#C6A65B] px-5"
              >
                Save evidenced action
              </button>
            </form>
          </details>
          {inquiry.acquisition?.activation_opportunity &&
            profiles
              .filter(
                (profile) =>
                  profile.id === inquiry.acquisition?.professional_profile_id,
              )
              .map((profile) => (
                <div key={profile.id} className="my-4">
                  <p>
                    Linked professional: {profile.firm_name} · {profile.status}
                  </p>
                  {profile.status !== "active" && (
                    <button
                      disabled={busy === inquiry.id}
                      className="min-h-12 border border-[#C6A65B] px-4"
                      onClick={async () => {
                        setBusy(inquiry.id);
                        try {
                          const response = await fetch(
                            `/api/admin/professionals/${profile.id}/activate`,
                            { method: "POST" },
                          );
                          const result = await response.json();
                          if (!response.ok) throw new Error(result.error);
                          setStatus(
                            "Canonical professional activation completed. Check provider evidence separately.",
                          );
                          await load();
                        } catch (failure) {
                          setError(
                            failure instanceof Error
                              ? failure.message
                              : "Activation failed.",
                          );
                        } finally {
                          setBusy(null);
                        }
                      }}
                    >
                      Invite through existing Professional Access
                    </button>
                  )}
                </div>
              ))}
          {inquiry.acquisition?.repeat_opportunity && (
            <p className="my-4">
              Completed Matter: operator follow-up opportunity for Professional
              Access or another Matter. No promotional message has been sent
              automatically.
            </p>
          )}

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
