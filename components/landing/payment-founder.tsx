"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Shield, Globe, FileCheck } from "lucide-react";

const CREDENTIALS = [
  { icon: Shield, text: "Florida Notary Public" },
  { icon: Globe, text: "Remote Online Notary Specialist" },
  { icon: FileCheck, text: "International Document Execution Liaison" },
  { icon: Shield, text: "Florida Notary Commission #668288" },
];

export function PaymentFounder() {
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <section className="py-12 px-6 border-t border-[#1A1A1A]">
      <div className="max-w-7xl mx-auto flex justify-center">
        <div ref={cardRef} className="ms-founder-wrap">
          {/* Collapsed chip */}
          {!open && (
            <button
              onClick={() => setOpen(true)}
              className="ms-founder-chip"
              aria-expanded={open}
              aria-label="Founder Trust Anchor — Meet the Founder Nicholas Milano"
            >
              <span className="ms-founder-chip__dot" aria-hidden="true" />
              <span className="ms-founder-chip__label">
                <span className="ms-founder-chip__eyebrow">Founder Trust Anchor</span>
                <span className="ms-founder-chip__name">Meet the Founder</span>
              </span>
              <ChevronDown className="ms-founder-chip__chevron" aria-hidden="true" />
            </button>
          )}

          {/* Expanded card */}
          {open && (
            <div className="ms-founder-card ms-gold-edge is-visible" role="region" aria-label="Founder information">
              <button
                onClick={() => setOpen(false)}
                className="ms-founder-card__close"
                aria-label="Close founder information"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="ms-founder-card__inner">
                {/* Identity */}
                <div className="ms-founder-card__identity">
                  <div className="ms-founder-card__monogram" aria-hidden="true">
                    NM
                  </div>
                  <div>
                    <p className="ms-founder-card__name">Nicholas Milano</p>
                    <p className="ms-founder-card__title">
                      Founder · The Milano Seal™
                    </p>
                  </div>
                </div>

                {/* Credentials list */}
                <ul className="ms-founder-card__credentials">
                  {CREDENTIALS.map(({ icon: Icon, text }) => (
                    <li key={text} className="ms-founder-card__credential">
                      <Icon className="ms-founder-card__cred-icon" aria-hidden="true" />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
