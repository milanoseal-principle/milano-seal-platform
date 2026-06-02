// Customs support for international document shipments.
// Customs declarations support courier processing only.
// They do NOT guarantee customs clearance or foreign authority acceptance.

const HAGUE_COUNTRIES = new Set([
  "DE","FR","IT","ES","PT","NL","BE","AT","CH","PL","CZ","SK","HU","RO","BG","HR","SI",
  "EE","LV","LT","FI","SE","DK","NO","GR","CY","MT","LU","IE","IS","AL","RS","ME","MK",
  "BA","MD","UA","BY","RU","GE","AM","AZ","TR","IL","JO","LB","SA","AE","KW","QA","BH",
  "OM","MX","BR","AR","CO","CL","PE","VE","EC","BO","PY","UY","CR","PA","GT","HN","SV",
  "NI","DO","JM","TT","BS","BB","AU","NZ","JP","KR","SG","MY","IN","ZA","KE","MA","EG",
  "TN","NG","GH",
]);

export function requiresCustoms(destinationCountry: string): boolean {
  return destinationCountry !== "US";
}

export function getCustomsAdvisory(destinationCountry: string): string {
  const hague = HAGUE_COUNTRIES.has(destinationCountry.toUpperCase());
  if (hague) {
    return "Customs declaration supports courier processing. Apostille satisfies authentication requirements for Hague Convention member countries. Receiving authority acceptance is not guaranteed.";
  }
  return "Customs declaration supports courier processing. Non-Hague destinations may require embassy legalization in addition to notarization. Receiving authority acceptance is not guaranteed.";
}

interface MatterCustomsInput {
  client_name?: string | null;
  document_type?: string | null;
  document_count?: number | null;
}

export async function buildDocumentCustomsPayload(matter: MatterCustomsInput): Promise<{
  item: {
    description: string;
    quantity: number;
    net_weight: string;
    mass_unit: string;
    value_amount: string;
    value_currency: string;
    origin_country: string;
  };
  declaration: {
    contents_type: "DOCUMENTS";
    contents_explanation: string;
    non_delivery_option: "RETURN";
    certify: boolean;
    certify_signer: string;
  };
}> {
  const count = matter.document_count ?? 1;
  const docType = matter.document_type ?? "Legal documents";

  return {
    item: {
      description: `${docType} — authenticated for international use`,
      quantity: count,
      net_weight: "0.5",
      mass_unit: "lb",
      value_amount: "1.00",
      value_currency: "USD",
      origin_country: "US",
    },
    declaration: {
      contents_type: "DOCUMENTS",
      contents_explanation: "Legal documents for international document execution. No commercial value.",
      non_delivery_option: "RETURN",
      certify: true,
      certify_signer: matter.client_name ?? "Authorized Signatory",
    },
  };
}
