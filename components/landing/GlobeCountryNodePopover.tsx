"use client";

import { useEffect, useState } from "react";
import { DESTINATIONS, type Destination } from "@/data/destinations";
import { DestinationIntelligenceCard } from "@/components/landing/destination-intelligence-card";

type AnchorPoint = {
  left: number;
  top: number;
};

function resolveDestination(label: string | null): Destination | null {
  if (!label) return null;

  const countryName = label.replace(/\s+routing information$/i, "").trim();
  const canonicalName = countryName === "UK" ? "United Kingdom" : countryName;

  return (
    DESTINATIONS.find(
      (destination) =>
        destination.name.toLowerCase() === canonicalName.toLowerCase(),
    ) ?? null
  );
}

function clampAnchor(clientX: number, clientY: number): AnchorPoint {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const edge = 12;
  const gap = 18;
  const cardWidth = Math.min(360, viewportWidth - edge * 2);
  const minimumTop = 92;

  const opensRight = clientX + gap + cardWidth <= viewportWidth - edge;
  const left = opensRight
    ? clientX + gap
    : Math.max(edge, clientX - cardWidth - gap);

  const top = Math.max(
    minimumTop,
    Math.min(clientY - 72, viewportHeight - 220),
  );

  return { left, top };
}

export function GlobeCountryNodePopover() {
  const [destination, setDestination] = useState<Destination | null>(null);
  const [anchor, setAnchor] = useState<AnchorPoint | null>(null);

  useEffect(() => {
    const openFromElement = (
      element: Element,
      clientX: number,
      clientY: number,
    ) => {
      const nextDestination = resolveDestination(
        element.getAttribute("aria-label"),
      );
      if (!nextDestination) return;

      setDestination(nextDestination);
      setAnchor(clampAnchor(clientX, clientY));
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const countryNode = target.closest("[data-target-vector]");
      if (!countryNode) return;

      openFromElement(countryNode, event.clientX, event.clientY);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDestination(null);
        setAnchor(null);
        return;
      }

      if (event.key !== "Enter" && event.key !== " ") return;
      const target = event.target;
      if (!(target instanceof Element)) return;

      const countryNode = target.closest("[data-target-vector]");
      if (!countryNode) return;

      const rect = countryNode.getBoundingClientRect();
      openFromElement(
        countryNode,
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
      );
    };

    const closeOnScroll = () => {
      setDestination(null);
      setAnchor(null);
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("scroll", closeOnScroll, { passive: true });

    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("scroll", closeOnScroll);
    };
  }, []);

  if (!destination || !anchor) {
    return (
      <style jsx global>{`
        @media (min-width: 768px) {
          .ms-destination-popover {
            display: none !important;
          }
        }
      `}</style>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media (min-width: 768px) {
          .ms-destination-popover {
            display: none !important;
          }
        }
      `}</style>

      <div
        className="fixed z-[70] hidden md:block"
        style={{
          left: anchor.left,
          top: anchor.top,
          width: "min(360px, calc(100vw - 24px))",
          maxHeight: `calc(100dvh - ${anchor.top}px - 12px)`,
          overflowY: "auto",
          overscrollBehavior: "contain",
        }}
        data-globe-country-popover={destination.slug}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setDestination(null);
              setAnchor(null);
            }}
            aria-label="Close country intelligence"
            className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 font-mono text-base text-white/50 transition-colors hover:bg-black/75 hover:text-white"
          >
            ×
          </button>

          <DestinationIntelligenceCard
            destination={destination}
            variant="globePreview"
            className="w-full max-w-none"
            onPrimaryAction={() => {
              setDestination(null);
              setAnchor(null);
            }}
          />
        </div>
      </div>
    </>
  );
}
