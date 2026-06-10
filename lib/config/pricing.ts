export const PRICING_LANES = [
  {
    id: "signature",
    name: "Signature Lane",
    price: 750,
    priceLabel: "Starting at $750",
    description: "For one coordinated document execution matter.",
    features: [
      "Document path review",
      "Notary coordination",
      "Apostille preparation guidance",
      "Secure matter tracking",
    ],
    cta: "Start Signature Lane",
  },
  {
    id: "priority",
    name: "Priority Lane",
    price: 975,
    priceLabel: "Starting at $975",
    description: "For urgent review, scheduling, and accelerated coordination.",
    features: [
      "Everything in Signature Lane",
      "Priority scheduling coordination",
      "Accelerated operator review",
      "Courier visibility",
    ],
    cta: "Start Priority Lane",
  },
  {
    id: "executive",
    name: "Executive Lane",
    price: 1850,
    priceLabel: "Starting at $1,850",
    description: "For complex international matters, multiple parties, or white-glove coordination.",
    features: [
      "White-glove matter coordination",
      "Multi-party execution support",
      "Complex document path review",
      "Priority release oversight",
    ],
    cta: "Start Executive Lane",
  },
] as const;

export const PRICING_ADD_ONS = [
  { name: "Apostille coordination", priceLabel: "from +$250" },
  { name: "Rush handling", priceLabel: "from +$400" },
  { name: "Additional signer", priceLabel: "from +$150" },
] as const;

export const PRICING_DISCLAIMER =
  "Final pricing depends on document type, origin jurisdiction, signer location, destination country, apostille requirements, courier needs, and urgency.";
