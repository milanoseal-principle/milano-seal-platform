"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "What is an apostille?",
    a: "An apostille is a certificate used to help authenticate certain public documents for use in countries that participate in the Hague Apostille Convention. Requirements depend on the document, origin jurisdiction, and destination country.",
  },
  {
    q: "Can you help if I am outside Florida?",
    a: "Yes. The Milano Seal can review the document path and coordinate eligible notarization, apostille, courier, and tracking support based on signer location, document origin, and destination country.",
  },
  {
    q: "Can you coordinate remote online notarization?",
    a: "Where eligible, yes. Remote online notarization depends on the document type, signer location, receiving authority, and destination-country requirements.",
  },
  {
    q: "Do you handle documents for Italy, Spain, Portugal, Greece, UAE, and other countries?",
    a: "Yes. The Milano Seal supports international document execution paths for many destinations, including Italy, Spain, Portugal, Greece, UAE, and other countries. Final routing depends on the document and receiving authority.",
  },
  {
    q: "How fast can this be completed?",
    a: "Timing depends on document type, jurisdiction, apostille requirements, courier timing, signer availability, and receiving authority rules. Rush handling may be available.",
  },
  {
    q: "Do I pay before scheduling?",
    a: "Yes. Payment confirmation is required before scheduling, execution, apostille dispatch, courier release, or final document release.",
  },
  {
    q: "Will I get tracking?",
    a: "When courier handling is part of the matter, tracking and delivery status are made visible through the secure matter process.",
  },
  {
    q: "Do you provide document execution coordination?",
    a: "Yes. Document execution coordination only. The Milano Seal does not provide legal advice. Final acceptance remains subject to the receiving authority.",
    a: "No. The Milano Seal supports document execution logistics, notarization coordination, apostille coordination, courier tracking, and release controls. Legal advice should come from a licensed attorney.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="border-b"
      style={{ borderColor: "rgba(212,175,55,0.15)" }}
    >
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between text-left py-5 gap-4"
        aria-expanded={open}
      >
        <span
          className="text-base font-medium text-white"
          style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
        >
          {q}
        </span>
        <span
          className="text-xl flex-shrink-0 transition-transform"
          style={{
            color: "#C6A55A",
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
          }}
        >
          +
        </span>
      </button>
      {open && (
        <p className="pb-5 text-sm leading-relaxed" style={{ color: "#8A8A8A" }}>
          {a}
        </p>
      )}
    </div>
  );
}

export function PublicFAQ() {
  return (
    <section
      id="faq"
      className="py-24 px-6"
      style={{ background: "#0A0A0A" }}
    >
      <div className="max-w-3xl mx-auto">
        <h2
          className="text-3xl md:text-4xl font-medium text-white mb-12 text-center"
          style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
        >
          Common Questions
        </h2>

        <div
          className="border-t"
          style={{ borderColor: "rgba(212,175,55,0.15)" }}
        >
          {FAQ_ITEMS.map((item) => (
            <FAQItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </div>
    </section>
  );
}
