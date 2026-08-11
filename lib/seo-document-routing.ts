export type DocumentAuthorityClass =
  | "federal"
  | "state_public_record"
  | "private_or_mixed";

const FEDERAL_DOCUMENTS = new Set(["fbi-background-check"]);
const STATE_PUBLIC_RECORDS = new Set([
  "birth-certificate",
  "marriage-certificate",
  "death-certificate",
  "divorce-decree",
  "court-documents",
]);

export function getDocumentAuthorityClass(documentSlug: string): DocumentAuthorityClass {
  if (FEDERAL_DOCUMENTS.has(documentSlug)) return "federal";
  if (STATE_PUBLIC_RECORDS.has(documentSlug)) return "state_public_record";
  return "private_or_mixed";
}

export function getDocumentAuthenticationCopy(params: {
  documentSlug: string;
  documentName: string;
  countryName: string;
}) {
  const authorityClass = getDocumentAuthorityClass(params.documentSlug);
  const docName = params.documentName;
  const countryName = params.countryName;

  const federal = authorityClass === "federal";
  const stateRecord = authorityClass === "state_public_record";

  const aboutPrimary = federal
    ? `For a ${docName} intended for use in ${countryName}, the authentication path is federal. The receiving-country treaty status determines whether the U.S. Department of State issues an apostille or an authentication certificate. The original federal document should not be notarized.`
    : `For a ${docName} intended for use in ${countryName}, the required authentication path depends on the issuing authority, the destination country's current treaty status, and the receiving authority's requirements. Hague destinations may use an apostille; non-Hague destinations may require authentication and additional legalization.`;

  const aboutSecondary = stateRecord
    ? `State-issued public records normally must be authenticated by the competent authority for the state that issued the record. A certified public record is not converted into a private notarized document merely for apostille processing.`
    : federal
      ? `The Milano Seal™ coordinates document review, federal authentication routing, destination-country requirements, and secure release without replacing the issuing federal authority or the U.S. Department of State.`
      : `The Milano Seal™ reviews whether notarization, a certified public record, state authentication, federal authentication, translation, or additional legalization is actually required before the document is routed.`;

  const requirements = [
    "Original or properly certified document, as required for the issuing authority",
    "Destination country and receiving authority or intended use",
    "Document origin / issuing authority information",
    "Translation requirements confirmed when applicable",
  ];

  if (!federal) {
    requirements.push("Signer identification when notarization or document execution is required");
  }

  const process = [
    {
      title: "Submit Your Document",
      description: `Provide your ${docName.toLowerCase()} and destination details through secure intake.`,
    },
    {
      title: "Authority & Destination Review",
      description: `We identify the issuing authority, document class, and current authentication route for use in ${countryName}.`,
    },
    federal
      ? {
          title: "Federal Document Review",
          description:
            "The federal document is reviewed for the issuing official, seal/signature requirements, and U.S. Department of State authentication path. The original federal document is not notarized.",
        }
      : {
          title: "Execution / Certification Review",
          description:
            "Notarization or certified-copy handling is used only when appropriate for the document type and issuing authority.",
        },
    {
      title: federal ? "U.S. Department of State Routing" : "Competent Authority Routing",
      description: federal
        ? `The matter is routed for the applicable U.S. Department of State apostille or authentication certificate based on ${countryName}'s current treaty status.`
        : `The matter is routed to the competent authority for the document's origin. Non-Hague destinations may also require additional authentication or consular/legalization review.`,
    },
    {
      title: "Secure Release",
      description: `Completed documents are released with tracking and destination-sensitive handling for use in ${countryName}.`,
    },
  ];

  return {
    authorityClass,
    pageLabel: "International Authentication",
    heading: `${docName} Authentication for ${countryName}`,
    aboutPrimary,
    aboutSecondary,
    requirements,
    process,
  };
}
