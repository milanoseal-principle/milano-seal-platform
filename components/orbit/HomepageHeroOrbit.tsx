"use client";

import { MilanoSealOrbitCore } from "./MilanoSealOrbitCore";

export function HomepageHeroOrbit() {
  return (
    <div className="homepage-hero-orbit">
      <MilanoSealOrbitCore
        mode="hero"
        state="page-hero"
        size="xl"
        interactive
        showHalo
        showRouteArcs
        showNodes
        label="Explore Global Document Intelligence"
        onClick={() => {
          const target = document.querySelector("#global-document-intelligence");
          target?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />
    </div>
  );
}
