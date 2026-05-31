export interface MatterVector {
  label: string
  path: string[]
  timeline: string
  translation?: boolean
}

export interface CorridorIntel {
  timeline: string
  translationRequired: boolean
  routeType: string
  matterVectors: MatterVector[]
}

export const CORRIDOR_INTEL: Record<string, CorridorIntel> = {
  italy: {
    timeline: "7–21 Business Days",
    translationRequired: true,
    routeType: "Hague Convention",
    matterVectors: [
      {
        label: "Dual Citizenship",
        timeline: "14–21 Days",
        translation: true,
        path: [
          "Certified birth or marriage certificate from issuing county",
          "Florida Department of State apostille",
          "Italian-certified translation by sworn translator",
          "Courier to Italian Vital Records office or consulate",
        ],
      },
      {
        label: "Power of Attorney",
        timeline: "7–14 Days",
        path: [
          "Mobile notarization — identification & witnesses confirmed",
          "Florida DOS apostille",
          "Translation if required by recipient",
          "Courier to Italian recipient or studio legale",
        ],
      },
      {
        label: "Estate Documents",
        timeline: "10–21 Days",
        translation: true,
        path: [
          "Certified document preparation and notarization",
          "Florida DOS apostille",
          "Certified Italian translation",
          "Courier to Italian Tribunale or notaio",
        ],
      },
    ],
  },

  greece: {
    timeline: "10–21 Business Days",
    translationRequired: true,
    routeType: "Hague Convention",
    matterVectors: [
      {
        label: "Citizenship",
        timeline: "14–21 Days",
        translation: true,
        path: [
          "Mobile notarization — 2 witnesses required",
          "Florida DOS apostille",
          "Certified Greek translation by sworn translator",
          "Courier to Greek municipality or consulate",
        ],
      },
      {
        label: "Power of Attorney",
        timeline: "10–14 Days",
        path: [
          "Mobile notarization — 2 witnesses required",
          "Florida DOS apostille",
          "Translation as required by recipient",
          "Courier to Greek recipient",
        ],
      },
    ],
  },

  spain: {
    timeline: "7–14 Business Days",
    translationRequired: false,
    routeType: "Hague Convention",
    matterVectors: [
      {
        label: "Real Estate",
        timeline: "7–10 Days",
        path: [
          "RON or mobile notarization",
          "Florida DOS apostille",
          "Courier to Spanish registry or notario",
        ],
      },
      {
        label: "Corporate",
        timeline: "5–10 Days",
        path: [
          "RON notarization with corporate authorization",
          "Florida DOS apostille",
          "Courier to Spanish business entity",
        ],
      },
      {
        label: "Affidavit",
        timeline: "5–7 Days",
        path: [
          "Mobile or RON notarization",
          "Florida DOS apostille",
          "Courier to Spanish authority",
        ],
      },
    ],
  },

  brazil: {
    timeline: "10–21 Business Days",
    translationRequired: true,
    routeType: "Hague Convention",
    matterVectors: [
      {
        label: "Real Estate",
        timeline: "10–14 Days",
        translation: true,
        path: [
          "Mobile notarization — 2 witnesses required",
          "Florida DOS apostille",
          "Portuguese translation by certified translator",
          "Courier delivery to Brazilian registry",
        ],
      },
      {
        label: "Corporate",
        timeline: "7–14 Days",
        translation: true,
        path: [
          "RON or mobile notarization with corporate authority",
          "Florida DOS apostille",
          "Portuguese translation",
          "Courier to Brazilian entity or Junta Comercial",
        ],
      },
    ],
  },

  portugal: {
    timeline: "7–14 Business Days",
    translationRequired: false,
    routeType: "Hague Convention",
    matterVectors: [
      {
        label: "Citizenship",
        timeline: "10–14 Days",
        path: [
          "Mobile or RON notarization",
          "Florida DOS apostille",
          "Courier to Portuguese consulate or Conservatória",
        ],
      },
      {
        label: "Real Estate",
        timeline: "7–10 Days",
        path: [
          "RON or mobile notarization",
          "Florida DOS apostille",
          "Courier to Portuguese Cartório or notário",
        ],
      },
    ],
  },

  germany: {
    timeline: "5–10 Business Days",
    translationRequired: false,
    routeType: "Hague Convention",
    matterVectors: [
      {
        label: "Corporate",
        timeline: "5–7 Days",
        path: [
          "Mobile or RON notarization",
          "Florida DOS apostille",
          "Courier to German Handelsregister or Notar",
        ],
      },
      {
        label: "Estate",
        timeline: "7–10 Days",
        path: [
          "Certified document notarization",
          "Florida DOS apostille",
          "Courier to German Nachlassgericht",
        ],
      },
    ],
  },

  uae: {
    timeline: "21–35 Business Days",
    translationRequired: false,
    routeType: "Consular Authentication",
    matterVectors: [
      {
        label: "Corporate",
        timeline: "21–35 Days",
        path: [
          "Mobile notarization with corporate resolution",
          "Florida Secretary of State authentication",
          "U.S. State Department authentication",
          "UAE Embassy legalization in Washington D.C.",
          "Courier delivery to UAE entity",
        ],
      },
    ],
  },

  mexico: {
    timeline: "14–28 Business Days",
    translationRequired: false,
    routeType: "Consular Authentication",
    matterVectors: [
      {
        label: "Power of Attorney",
        timeline: "14–21 Days",
        path: [
          "Mobile notarization with full identification",
          "Florida Secretary of State authentication",
          "Mexican Consulate legalization",
          "Courier delivery to Mexican recipient",
        ],
      },
      {
        label: "Real Estate",
        timeline: "21–28 Days",
        path: [
          "RON or mobile notarization",
          "Florida SOS authentication",
          "Mexican Consulate legalization",
          "Courier to Mexican Registro Público",
        ],
      },
    ],
  },

  france: {
    timeline: "7–14 Business Days",
    translationRequired: false,
    routeType: "Hague Convention",
    matterVectors: [
      {
        label: "Corporate",
        timeline: "7–10 Days",
        path: [
          "Mobile notarization — 2 witnesses required",
          "Florida DOS apostille",
          "Courier to French authority or Greffier",
        ],
      },
    ],
  },

  argentina: {
    timeline: "10–18 Business Days",
    translationRequired: true,
    routeType: "Hague Convention",
    matterVectors: [
      {
        label: "Citizenship",
        timeline: "10–18 Days",
        translation: true,
        path: [
          "Mobile notarization",
          "Florida DOS apostille",
          "Spanish translation by certified translator",
          "Courier delivery to Argentine Registro Civil",
        ],
      },
    ],
  },

  colombia: {
    timeline: "10–18 Business Days",
    translationRequired: false,
    routeType: "Hague Convention",
    matterVectors: [
      {
        label: "Legal",
        timeline: "10–18 Days",
        path: [
          "Mobile notarization",
          "Florida DOS apostille",
          "Courier delivery to Colombian authority",
        ],
      },
    ],
  },

  "united-kingdom": {
    timeline: "5–10 Business Days",
    translationRequired: false,
    routeType: "Hague Convention",
    matterVectors: [
      {
        label: "Corporate",
        timeline: "5–7 Days",
        path: [
          "RON or mobile notarization",
          "Florida DOS apostille",
          "Courier to UK Companies House or solicitor",
        ],
      },
    ],
  },

  japan: {
    timeline: "10–18 Business Days",
    translationRequired: true,
    routeType: "Hague Convention",
    matterVectors: [
      {
        label: "Corporate",
        timeline: "10–18 Days",
        translation: true,
        path: [
          "Mobile notarization",
          "Florida DOS apostille",
          "Japanese translation required",
          "Courier to Japanese entity",
        ],
      },
    ],
  },

  australia: {
    timeline: "7–14 Business Days",
    translationRequired: false,
    routeType: "Hague Convention",
    matterVectors: [
      {
        label: "Legal",
        timeline: "7–14 Days",
        path: [
          "RON or mobile notarization",
          "Florida DOS apostille",
          "Courier to Australian recipient",
        ],
      },
    ],
  },
};

const DEFAULT_ROUTE_TYPE: Record<string, string> = {
  true: "Hague Convention",
  false: "Consular Authentication",
};

export function getCorridorIntel(slug: string, hague: boolean): CorridorIntel {
  return CORRIDOR_INTEL[slug] ?? {
    timeline: hague ? "7–21 Business Days" : "21–35 Business Days",
    translationRequired: false,
    routeType: DEFAULT_ROUTE_TYPE[String(hague)],
    matterVectors: [],
  };
}
