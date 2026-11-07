"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  buildIntakeAnalyticsPayload,
  type IntakeAnalyticsEvent,
} from "@/lib/intake/intakeAnalytics";

function track(
  event: IntakeAnalyticsEvent,
  metadata: Record<string, unknown> = {},
) {
  try {
    void fetch("/api/intake/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildIntakeAnalyticsPayload(event, metadata)),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* Observational only. */
  }
}
import {
  counselAttribution,
  documentError,
  inquirySchema,
  type CounselInquiry,
} from "@/lib/counsel/inquiry";
import { SEO_ATTRIBUTION_STORAGE_KEY } from "@/lib/attribution/seo-attribution";

type Receipt = {
  reference: string;
  destination: string;
  email: string;
  document_status: string;
};
type Field =
  | "full_name"
  | "firm"
  | "country"
  | "email"
  | "destination"
  | "summary";
export function CounselExperience({
  countries,
}: {
  countries: { name: string; slug: string }[];
}) {
  const [intent, setIntent] =
    useState<CounselInquiry["intent"]>("execution_review");
  const [values, setValues] = useState<Record<Field, string>>({
    full_name: "",
    firm: "",
    country: "",
    email: "",
    destination: "",
    summary: "",
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [active, setActive] = useState(false);
  const requestId = useRef<string | null>(null);
  const submittedPayload = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const attribution = useRef<Record<string, string>>({});
  const opened = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const destination = params.get("destination") ?? "";
    const known = countries.find(
      (country) =>
        country.slug === destination ||
        country.name.toLowerCase() === destination.toLowerCase(),
    );
    if (destination)
      setValues((old) => ({
        ...old,
        destination: known?.name ?? destination.slice(0, 100),
      }));
    attribution.current = counselAttribution(params);
    try {
      const stored = JSON.parse(
        sessionStorage.getItem(SEO_ATTRIBUTION_STORAGE_KEY) ?? "null",
      );
      // Preserve the existing canonical first touch; URL context remains separate.
      if (stored?.firstTouch)
        attribution.current.canonical_first_touch = JSON.stringify(
          stored.firstTouch,
        ).slice(0, 4000);
    } catch {
      /* Storage is optional; never persist inquiry contents. */
    }
    track("counsel_visit");
  }, [countries]);
  useEffect(() => {
    if (receipt) successRef.current?.focus();
  }, [receipt]);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  function open(next: CounselInquiry["intent"]) {
    setIntent(next);
    setActive(true);
    if (!opened.current) {
      track("counsel_inquiry_opened", { intent: next });
      opened.current = true;
    }
    requestAnimationFrame(() =>
      formRef.current
        ?.querySelector<HTMLInputElement>("input")
        ?.focus({ preventScroll: true }),
    );
  }
  function change(field: Field, value: string) {
    setValues((old) => ({ ...old, [field]: value }));
    setErrors((old) => ({ ...old, [field]: undefined }));
  }
  function validateField(field: Field) {
    const result = inquirySchema.safeParse({
      request_id: "00000000-0000-4000-8000-000000000000",
      intent,
      ...values,
    });
    const issue = result.success
      ? undefined
      : result.error.issues.find((item) => item.path[0] === field);
    setErrors((old) => ({ ...old, [field]: issue?.message }));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError("");
    const result = inquirySchema.safeParse({
      request_id: requestId.current ?? crypto.randomUUID(),
      intent,
      ...values,
      attribution: attribution.current,
    });
    if (!result.success) {
      const nextErrors: Partial<Record<Field, string>> = {};
      for (const issue of result.error.issues)
        nextErrors[issue.path[0] as Field] = issue.message;
      setErrors(nextErrors);
      const field = String(result.error.issues[0]?.path[0]);
      formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
      return;
    }
    if (fileError && intent === "execution_review") {
      document.getElementById("counsel-document")?.focus();
      return;
    }
    const payloadKey = JSON.stringify({
      ...result.data,
      request_id: undefined,
      file:
        intent === "execution_review" && file
          ? { name: file.name, size: file.size, modified: file.lastModified }
          : null,
    });
    if (submittedPayload.current && submittedPayload.current !== payloadKey)
      result.data.request_id = crypto.randomUUID();
    requestId.current = result.data.request_id;
    submittedPayload.current = payloadKey;
    const form = new FormData();
    form.set("inquiry", JSON.stringify(result.data));
    if (file && intent === "execution_review") form.set("document", file);
    setBusy(true);
    setProgress(0);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/counsel");
    xhr.timeout = 90000;
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable)
        setProgress(Math.round((event.loaded / event.total) * 100));
    };
    const failed = () => {
      setError(
        "We could not confirm receipt. Please retry; your details are still here.",
      );
      setBusy(false);
      setProgress(null);
    };
    xhr.onerror = failed;
    xhr.ontimeout = failed;
    xhr.onload = () => {
      setBusy(false);
      setProgress(null);
      try {
        const body = JSON.parse(xhr.responseText);
        if (
          xhr.status < 200 ||
          xhr.status >= 300 ||
          !body.ok ||
          !body.reference
        ) {
          setError(
            body.error ?? "We could not confirm receipt. Please try again.",
          );
          track("counsel_submission_failed");
          return;
        }
        setReceipt(body);
        track("counsel_inquiry_submitted", {
          intent,
          document_received: body.document_status === "received",
          inquiryReference: body.reference,
        });
      } catch {
        failed();
      }
    };
    xhr.send(form);
  }
  const field = (
    name: Exclude<Field, "summary">,
    label: string,
    autocomplete?: string,
  ) => (
    <div className="counsel-field">
      <label htmlFor={`counsel-${name}`}>{label}</label>
      <input
        id={`counsel-${name}`}
        name={name}
        type={name === "email" ? "email" : "text"}
        autoComplete={autocomplete}
        list={
          name === "country" || name === "destination"
            ? "counsel-countries"
            : undefined
        }
        required={name !== "destination" || intent === "execution_review"}
        maxLength={
          name === "email"
            ? 254
            : name === "firm"
              ? 240
              : name === "full_name"
                ? 160
                : 100
        }
        value={values[name]}
        onChange={(e) => change(name, e.target.value)}
        onBlur={() => validateField(name)}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `${name}-error` : undefined}
      />
      {errors[name] && (
        <p className="counsel-error" id={`${name}-error`}>
          {errors[name]}
        </p>
      )}
    </div>
  );
  return (
    <>
      <section className="counsel-hero counsel-wrap">
        <p className="counsel-eyebrow">For international counsel</p>
        <h1>
          Your U.S. execution desk
          <br />
          <em>for international matters.</em>
        </h1>
        <p className="counsel-intro">
          When your client is in the United States and their document must work
          abroad, The Milano Seal coordinates the U.S. execution side — from
          execution-readiness review through governed notarization where
          applicable, apostille or authentication routing, custody, and
          international release.
        </p>
        <p className="counsel-boundary">
          You remain counsel.
          <br />
          We handle the U.S. execution workflow.
        </p>
        <div className="counsel-actions">
          <a
            className="counsel-button"
            href="#inquiry"
            onClick={() => open("execution_review")}
          >
            Send a U.S. Matter <span aria-hidden="true">↗︎</span>
          </a>
          <a
            className="counsel-text-link"
            href="#inquiry"
            onClick={() => open("question")}
          >
            Ask about a Matter <span aria-hidden="true">↗︎</span>
          </a>
        </div>
        <p className="counsel-note">
          First contact requires no account. Matter-specific scope and quote
          follow review.
        </p>
      </section>
      <div className="counsel-trust">
        <div className="counsel-wrap">
          <span>Founder-led coordination</span>
          <span>Controlled Matter tracking</span>
          <span>Custody & release controls</span>
        </div>
      </div>
      <section className="counsel-wrap counsel-section">
        <p className="counsel-eyebrow">
          Across borders. One accountable U.S. point.
        </p>
        <h2>
          When your client is here
          <br />
          <em>and the Matter is there.</em>
        </h2>
        <div className="counsel-scenarios">
          {[
            [
              "Italy",
              "A U.S. client needs a power of attorney executed for Italian use.",
            ],
            [
              "Spain",
              "A U.S. signer needs documents executed for an overseas property transaction.",
            ],
            [
              "Portugal",
              "U.S.-origin documents require execution and authentication coordination.",
            ],
            [
              "International estate",
              "A beneficiary or principal in the United States must execute documents for foreign counsel.",
            ],
            [
              "Corporate",
              "U.S.-based signatories need governed execution for documents moving abroad.",
            ],
          ].map(([title, body], index) => (
            <article key={title}>
              <span className="counsel-number">0{index + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="counsel-note">
          Each example is subject to document, signer, destination and
          receiving-authority review.
        </p>
      </section>
      <section className="counsel-control">
        <div className="counsel-wrap counsel-split">
          <div>
            <p className="counsel-eyebrow">Counsel retains</p>
            <h2>
              The legal work.
              <br />
              <em>Your client relationship.</em>
            </h2>
            <ul>
              {[
                "Legal advice and strategy",
                "Document substance",
                "Client representation",
                "Foreign-law analysis",
                "Receiving-authority legal judgment",
              ].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="counsel-eyebrow">Milano coordinates</p>
            <h2>
              The U.S. side.
              <br />
              <em>From review to release.</em>
            </h2>
            <ul>
              {[
                "Execution-readiness review",
                "Signer coordination and eligible notarization",
                "Apostille or authentication routing",
                "Custody and courier coordination",
                "International release",
                "Operational Matter visibility",
              ].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <section
        id="inquiry"
        className="counsel-wrap counsel-section counsel-inquiry"
        onFocusCapture={() => {
          setActive(true);
          if (!opened.current) {
            track("counsel_inquiry_opened", { intent });
            opened.current = true;
          }
        }}
      >
        <div>
          <p className="counsel-eyebrow">
            Your first Matter starts with a conversation
          </p>
          <h2>
            Send the context.
            <br />
            <em>We’ll review the next step.</em>
          </h2>
          <p>
            Tell us what your client needs. You do not need to determine the
            execution method, authentication route or scope before contacting
            Milano.
          </p>
          <p>
            Nicholas Milano, founder, leads coordination through the existing
            professional execution workflow.
          </p>
          <p className="counsel-note">
            Please provide only the information needed for initial review. Your
            details are not saved in this browser; reloading clears an
            unfinished form.
          </p>
          <Link className="counsel-text-link" href="/professional">
            Existing professional? Start a client Matter ↗︎
          </Link>
        </div>
        {receipt ? (
          <div
            ref={successRef}
            className="counsel-receipt"
            tabIndex={-1}
            role="status"
          >
            <p className="counsel-eyebrow">Request received</p>
            <h2>
              {intent === "question"
                ? "Your question is with Milano."
                : "Your Matter is with Milano."}
            </h2>
            <p>
              We received the{" "}
              {intent === "question" ? "question" : "execution request"} and
              will review the U.S. execution requirements, unresolved
              dependencies, and appropriate next step.
            </p>
            <dl>
              <dt>Inquiry reference</dt>
              <dd>{receipt.reference}</dd>
              {receipt.destination && (
                <>
                  <dt>Destination</dt>
                  <dd>{receipt.destination}</dd>
                </>
              )}
              <dt>Contact email</dt>
              <dd>{receipt.email}</dd>
              <dt>Document</dt>
              <dd>
                {receipt.document_status === "received"
                  ? "Received securely"
                  : "Not provided"}
              </dd>
              <dt>Next step</dt>
              <dd>
                Milano reviews your request and contacts you using the email
                above.
              </dd>
            </dl>
            <p className="counsel-note">
              Receipt confirms submission. Review, quote and execution
              authorization follow separately.
            </p>
          </div>
        ) : (
          <form ref={formRef} onSubmit={submit} noValidate aria-busy={busy}>
            <fieldset disabled={busy}>
              <legend>How can we help?</legend>
              <div className="counsel-intent">
                <label>
                  <input
                    type="radio"
                    name="intent"
                    checked={intent === "execution_review"}
                    onChange={() => {
                      setIntent("execution_review");
                      setErrors({});
                    }}
                  />{" "}
                  Execution review
                </label>
                <label>
                  <input
                    type="radio"
                    name="intent"
                    checked={intent === "question"}
                    onChange={() => {
                      setIntent("question");
                      setErrors({});
                    }}
                  />{" "}
                  A question first
                </label>
              </div>
              <div className="counsel-form-grid">
                {field("full_name", "Name", "name")}
                {field("firm", "Firm / organization", "organization")}
                {field("country", "Your country", "country-name")}
                {field("email", "Professional email", "email")}
                {intent === "execution_review" &&
                  field("destination", "Destination country")}
              </div>
              <datalist id="counsel-countries">
                {countries.map((country) => (
                  <option key={country.slug} value={country.name} />
                ))}
              </datalist>
              <div className="counsel-field">
                <label htmlFor="counsel-summary">
                  {intent === "question"
                    ? "Your question"
                    : "What does your client need executed?"}
                </label>
                <textarea
                  id="counsel-summary"
                  name="summary"
                  rows={4}
                  required
                  maxLength={4000}
                  value={values.summary}
                  onChange={(e) => change("summary", e.target.value)}
                  onBlur={() => validateField("summary")}
                  aria-invalid={Boolean(errors.summary)}
                  aria-describedby={
                    errors.summary ? "summary-error" : undefined
                  }
                />
                {errors.summary && (
                  <p id="summary-error" className="counsel-error">
                    {errors.summary}
                  </p>
                )}
              </div>
              {intent === "execution_review" && (
                <details className="counsel-upload">
                  <summary>
                    Add a document <span>(optional)</span>
                  </summary>
                  <label htmlFor="counsel-document">
                    PDF, JPEG or PNG · up to 4 MB · private storage
                  </label>
                  <input
                    id="counsel-document"
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    aria-describedby="document-help document-error"
                    onChange={(event) => {
                      const next = event.target.files?.[0] ?? null;
                      setFile(next);
                      setFileError(next ? (documentError(next) ?? "") : "");
                    }}
                  />
                  <p id="document-help">
                    The document is uploaded when you submit. Avoid including
                    unnecessary personal information.
                  </p>
                  <p
                    id="document-error"
                    className="counsel-error"
                    role="status"
                  >
                    {fileError}
                  </p>
                  {file && (
                    <button
                      type="button"
                      className="counsel-text-link"
                      onClick={() => {
                        setFile(null);
                        setFileError("");
                        const input = document.getElementById(
                          "counsel-document",
                        ) as HTMLInputElement;
                        input.value = "";
                      }}
                    >
                      Remove document
                    </button>
                  )}
                </details>
              )}
              <button type="submit" className="counsel-button">
                {busy
                  ? "Sending request…"
                  : intent === "question"
                    ? "Send your question"
                    : "Request U.S. execution review"}
              </button>
            </fieldset>
            <div aria-live="polite">
              {busy && (
                <p>
                  {progress !== null && progress < 100
                    ? `Uploading request: ${progress}%`
                    : "Confirming receipt…"}
                </p>
              )}
            </div>
            {error && (
              <p
                ref={errorRef}
                tabIndex={-1}
                className="counsel-error"
                role="alert"
              >
                {error}
              </p>
            )}
            <p className="counsel-note">
              By submitting, you ask Milano to contact you about this request.{" "}
              <Link href="/privacy">Privacy</Link>
            </p>
          </form>
        )}
      </section>
      <section className="counsel-wrap counsel-section counsel-close">
        <h2>
          First Matter. Earned trust.
          <br />
          <em>A lasting professional relationship.</em>
        </h2>
        <p>
          After review, Milano coordinates the appropriate next step through its
          existing Matter workflow. Professional access and recurring
          submissions can follow as the relationship develops.
        </p>
        <p className="counsel-note">
          The Milano Seal is not a law firm and does not provide legal advice or
          legal representation. Counsel retains legal judgment. Final acceptance
          remains with the applicable receiving authority.
        </p>
      </section>
      {!active && !receipt && (
        <div className="counsel-mobile-action">
          <a
            href="#inquiry"
            className="counsel-button"
            onClick={() => open("execution_review")}
          >
            Send a Matter <span aria-hidden="true">↗︎</span>
          </a>
        </div>
      )}
    </>
  );
}
