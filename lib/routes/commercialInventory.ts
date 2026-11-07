// P2 canonical revenue-bearing public route inventory.
//
// This is the machine-readable contract behind the no-commercial-dead-end
// regression guard. Each entry names a representative revenue-bearing public
// route, the page file that must resolve to a governed commercial action, the
// commercial category, the canonical (non-authoritative) service intent, and
// the context expected to be preserved. Dynamic segments ([country],
// [document], a representative [city]) are represented by one template/page
// file that governs the whole family.
//
// It intentionally references the canonical PUBLIC_LIVE_ROUTES / sitemap rather
// than inventing a second source of truth; it adds only the commercial metadata
// the conversion guard needs.

export type CommercialCategory =
  | "core"
  | "instrument"
  | "service"
  | "country"
  | "document"
  | "local"
  | "counsel";

export interface CommercialRouteEntry {
  route: string;
  file: string;
  category: CommercialCategory;
  serviceIntent: string;
  preserveContext: string[];
}

export const REVENUE_BEARING_PUBLIC_ROUTES: CommercialRouteEntry[] = [
  { route: "/", file: "app/page.tsx", category: "core", serviceIntent: "unsure", preserveContext: ["source"] },
  { route: "/pricing", file: "app/pricing/page.tsx", category: "core", serviceIntent: "unsure", preserveContext: ["service_intent", "destination", "source"] },
  { route: "/counsel", file: "app/counsel/page.tsx", category: "counsel", serviceIntent: "foreign_counsel", preserveContext: ["service_intent", "audience"] },
  { route: "/map", file: "app/map/page.tsx", category: "core", serviceIntent: "unsure", preserveContext: ["source"] },
  { route: "/countries", file: "app/countries/page.tsx", category: "core", serviceIntent: "unsure", preserveContext: ["source"] },

  { route: "/international-affidavits", file: "app/international-affidavits/page.tsx", category: "instrument", serviceIntent: "international_execution", preserveContext: ["service_intent"] },
  { route: "/international-affidavit", file: "app/international-affidavit/page.tsx", category: "instrument", serviceIntent: "international_execution", preserveContext: ["service_intent"] },
  { route: "/power-of-attorney-international", file: "app/power-of-attorney-international/page.tsx", category: "instrument", serviceIntent: "international_execution", preserveContext: ["service_intent"] },
  { route: "/affidavit-name-discrepancy", file: "app/affidavit-name-discrepancy/page.tsx", category: "instrument", serviceIntent: "international_execution", preserveContext: ["service_intent"] },
  { route: "/affidavit-one-and-the-same", file: "app/affidavit-one-and-the-same/page.tsx", category: "instrument", serviceIntent: "international_execution", preserveContext: ["service_intent"] },
  { route: "/affidavit-non-existence-record", file: "app/affidavit-non-existence-record/page.tsx", category: "instrument", serviceIntent: "international_execution", preserveContext: ["service_intent"] },
  { route: "/affidavit-translation-accuracy", file: "app/affidavit-translation-accuracy/page.tsx", category: "instrument", serviceIntent: "international_execution", preserveContext: ["service_intent"] },

  { route: "/services/remote-online-notarization", file: "app/services/remote-online-notarization/page.tsx", category: "service", serviceIntent: "ron", preserveContext: ["service_intent"] },
  { route: "/services/apostille", file: "app/services/apostille/page.tsx", category: "service", serviceIntent: "apostille", preserveContext: ["service_intent"] },
  { route: "/services/mobile-notary", file: "app/services/mobile-notary/page.tsx", category: "service", serviceIntent: "domestic_execution", preserveContext: ["service_intent"] },
  { route: "/services/international-execution", file: "app/services/international-execution/page.tsx", category: "service", serviceIntent: "international_execution", preserveContext: ["service_intent"] },

  { route: "/countries/:country", file: "app/countries/[country]/page.tsx", category: "country", serviceIntent: "apostille", preserveContext: ["service_intent", "destination"] },
  { route: "/documents/:document", file: "app/documents/[document]/page.tsx", category: "document", serviceIntent: "apostille", preserveContext: ["service_intent", "document_type"] },

  { route: "/:city/apostille-services", file: "app/sarasota/apostille-services/page.tsx", category: "local", serviceIntent: "apostille", preserveContext: ["service_intent", "source"] },
  { route: "/florida/apostille-services", file: "app/florida/apostille-services/page.tsx", category: "local", serviceIntent: "apostille", preserveContext: ["service_intent", "source"] },
];
