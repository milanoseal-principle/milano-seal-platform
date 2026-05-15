"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function RitualOverlay() {
  const [phase, setPhase] = useState<"idle" | "visible" | "exit" | "gone">(
    "idle"
  );

  useEffect(() => {
    if (sessionStorage.getItem("ms_ritual_seen")) {
      setPhase("gone");
      return;
    }
    setPhase("visible");
    const exitTimer = setTimeout(() => setPhase("exit"), 1800);
    const goneTimer = setTimeout(() => {
      setPhase("gone");
      sessionStorage.setItem("ms_ritual_seen", "1");
    }, 2450);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(goneTimer);
    };
  }, []);

  if (phase === "idle" || phase === "gone") return null;

  return (
    <div
      className={`ritual-overlay${phase === "exit" ? " ritual-overlay--exit" : ""}`}
      aria-hidden="true"
    >
      <div className="ritual-overlay__inner">
        <Image
          src="/milano-seal-gold-transparent-512.png"
          alt=""
          width={72}
          height={72}
          className="ritual-overlay__seal"
          priority
        />
        <div className="ritual-overlay__line" />
        <p className="ritual-overlay__wordmark">The Milano Seal</p>
        <p className="ritual-overlay__sub">U.S. Document Execution</p>
      </div>
    </div>
  );
}
