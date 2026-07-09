export const APOSTILLE_ROUTING_ENGINE = {
  pathways: [
    { id: "state-apostille", label: "State Apostille", description: "Documents eligible for state-level apostille through the appropriate competent authority." },
    { id: "federal-authentication", label: "Federal Authentication", description: "Documents requiring federal authentication before foreign use." },
    { id: "embassy-legalization", label: "Embassy / Consular Legalization", description: "Non-Hague or special matters requiring embassy or consular coordination." },
    { id: "complex-routing", label: "Complex Cross-Border Routing", description: "Multi-document, multi-jurisdiction, translation, courier, and enterprise workflows." }
  ],
  routingInputs: ["document origin", "document type", "destination country", "signer location", "receiving authority", "urgency", "translation need", "courier need"],
  safety: "Routing is coordination support only. Government and receiving-authority processing remains outside Milano Seal control."
} as const;
