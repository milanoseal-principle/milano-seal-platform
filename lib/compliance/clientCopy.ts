export const CLIENT_COPY = {
  disclaimer: "The Milano Seal provides document coordination, notarization support, apostille/authentication routing review, courier custody, and release support. International use remains subject to destination-country, receiving-authority, document-type, and signer-location requirements. This assistant does not provide legal advice or guarantee foreign acceptance.",

  apostilleIntro: "An apostille is a certificate issued under the Hague Convention of 5 October 1961 that authenticates the origin of a public document for use in participating countries.",

  nonHagueMemberNote: (countryName: string) =>
    `${countryName} is not a member of the Hague Apostille Convention. Documents intended for ${countryName} require a different authentication pathway — typically consular legalization rather than a standard apostille.`,

  hagueMemberNote: (countryName: string) =>
    `${countryName} is a member of the Hague Apostille Convention. Florida-issued documents apostilled by the Florida Secretary of State are generally recognized by ${countryName} receiving authorities, subject to document type and the requirements of the specific receiving institution.`,

  translationNote: "Certified translation requirements vary by destination country, receiving authority, and document type. We recommend verifying translation requirements with the specific institution receiving your documents.",

  corridorActiveLabel: "Active Corridor",
  corridorInactiveLabel: "Available on Request",

  routeLabels: {
    "notarize-only": "Notarization",
    "notarize-apostille": "Notarize + Apostille",
    "notarize-apostille-translate": "Notarize + Apostille + Translation",
    "certified-copy-apostille": "Certified Copy + Apostille",
    "certified-copy-apostille-translate": "Certified Copy + Apostille + Translation",
    "consular-legalization": "Consular Legalization",
    "federal-apostille": "Federal Apostille",
  } as const,
} as const;
