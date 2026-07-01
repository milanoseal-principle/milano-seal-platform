export interface MarketBundle {
  name: string;
  docs: string[];
  apostilles: string;
  client: string;
  priority: "High" | "Medium" | "Low";
  market: string;
  valueBand: "internal only";
  note?: string;
}

export const MARKET_BUNDLES: MarketBundle[] = [
  { name: "Italian Citizenship", docs: ["birth certificates", "marriage certificates", "death certificates", "name discrepancy affidavit", "one and the same affidavit", "translation certification"], apostilles: "4-8", client: "citizenship applicants", valueBand: "internal only", priority: "High", market: "Italy", note: "strongest consistent market" },
  { name: "FBI Background Check Apostille", docs: ["FBI Identity History Summary", "apostille", "optional translation/declaration"], apostilles: "1-2", client: "residency visas, digital nomad visas, employment abroad", valueBand: "internal only", priority: "High", market: "Italy / Spain / Portugal" },
  { name: "International Property Transaction", docs: ["POA", "passport copy notarization", "identity affidavit"], apostilles: "1-3", client: "property abroad", valueBand: "internal only", priority: "High", market: "Mexico / Italy / Spain" },
  { name: "Immigration / Residency Package", docs: ["FBI apostille", "birth certificate apostille", "translation affidavit"], apostilles: "2-4", client: "residency applicants", valueBand: "internal only", priority: "High", market: "Spain / Portugal / Italy / Mexico" },
  { name: "Missing Record Case", docs: ["affidavit of non-existence", "supporting identity affidavit"], apostilles: "case-specific", client: "citizenship / legal", valueBand: "internal only", priority: "Medium", market: "citizenship / legal" },
  { name: "Translation Certification Package", docs: ["translation", "translation accuracy affidavit", "notarization"], apostilles: "case-specific", client: "multiple", valueBand: "internal only", priority: "Medium", market: "multiple" },
  { name: "International POA + Apostille Coordination", docs: ["POA", "notarization coordination", "apostille", "overseas shipment"], apostilles: "1-2", client: "international transaction parties", valueBand: "internal only", priority: "High", market: "Italy" },
];

export function getMarketBundles(): MarketBundle[] {
  return MARKET_BUNDLES;
}

export function getHighPriorityBundles(): MarketBundle[] {
  return MARKET_BUNDLES.filter((bundle) => bundle.priority === "High");
}

export function findBundlesForMarket(market: string): MarketBundle[] {
  const needle = market.toLowerCase();
  return MARKET_BUNDLES.filter((bundle) => bundle.market.toLowerCase().includes(needle));
}
