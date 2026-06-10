"use client";

import React from "react";
import { WorldMapCanvas } from "@/components/rituals/WorldMapCanvas";
import { RitualMedallion } from "@/components/ritual/RitualMedallion";

export function RitualEntryLock(){
  return React.createElement("div", { style: { position: "fixed", inset: 0, zIndex: 9100, background: "#050507" } }, React.createElement(WorldMapCanvas), React.createElement(RitualMedallion));
}
