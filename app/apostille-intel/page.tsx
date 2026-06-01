"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getAllCountries, getAllDocumentTypes } from "@/data/intelligence";

// Note: metadata is exported from the layout or a separate server component.
// Defined here for reference; Next.js ignores metadata in client components.
// The actual metadata is in app/apostille-intel/layout.tsx.

export default function ApostilleIntelPage() {
  const router = useRouter();
  const countries = getAllCountries();
  const documents = getAllDocumentTypes();

  const [country, setCountry] = useState("");
  const [document, setDocument] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!country || !document) return;
    router.push(`/apostille-intel/${country}/${document}`);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#0A0A0A",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        fontFamily: "var(--font-geist, sans-serif)",
      }}
    >
      <div style={{ maxWidth: "540px", width: "100%", textAlign: "center" }}>
        {/* Eyebrow */}
        <p
          style={{
            color: "#C6A55A",
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: "1rem",
          }}
        >
          Execution Readiness Engine
        </p>

        {/* Heading */}
        <h1
          style={{
            color: "#FFFFFF",
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontFamily: "var(--font-playfair, serif)",
            fontWeight: 700,
            lineHeight: 1.15,
            marginBottom: "1.25rem",
          }}
        >
          Apostille Intelligence
        </h1>

        {/* Subheading */}
        <p
          style={{
            color: "#9A9A9A",
            fontSize: "1rem",
            lineHeight: 1.65,
            marginBottom: "2.5rem",
            maxWidth: "460px",
            margin: "0 auto 2.5rem",
          }}
        >
          Enter your destination country and document type to receive complete
          execution requirements, estimated timeline, and common rejection
          triggers.
        </p>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", textAlign: "left" }}>
            <label
              htmlFor="country-select"
              style={{ color: "#C6A55A", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}
            >
              Destination Country
            </label>
            <select
              id="country-select"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
              style={{
                backgroundColor: "#111111",
                border: "1px solid #2A2A2A",
                borderRadius: "6px",
                color: country ? "#FFFFFF" : "#5A5A5A",
                fontSize: "0.95rem",
                padding: "0.75rem 1rem",
                width: "100%",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="" disabled>Select a country</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id} style={{ color: "#FFFFFF", backgroundColor: "#111111" }}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", textAlign: "left" }}>
            <label
              htmlFor="document-select"
              style={{ color: "#C6A55A", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}
            >
              Document Type
            </label>
            <select
              id="document-select"
              value={document}
              onChange={(e) => setDocument(e.target.value)}
              required
              style={{
                backgroundColor: "#111111",
                border: "1px solid #2A2A2A",
                borderRadius: "6px",
                color: document ? "#FFFFFF" : "#5A5A5A",
                fontSize: "0.95rem",
                padding: "0.75rem 1rem",
                width: "100%",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="" disabled>Select a document type</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id} style={{ color: "#FFFFFF", backgroundColor: "#111111" }}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={!country || !document}
            style={{
              marginTop: "0.5rem",
              backgroundColor: country && document ? "#C6A55A" : "#2A2A2A",
              color: country && document ? "#0A0A0A" : "#5A5A5A",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.9rem",
              fontWeight: 700,
              letterSpacing: "0.05em",
              padding: "0.9rem 2rem",
              cursor: country && document ? "pointer" : "not-allowed",
              transition: "background-color 0.2s, color 0.2s",
            }}
          >
            View Requirements →
          </button>
        </form>
      </div>
    </main>
  );
}

