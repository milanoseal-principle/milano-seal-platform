import { GROSS_MARGIN_BANDS } from "./grossMarginModel";
import { REVENUE_SCENARIOS } from "./revenueProjectionEngine";

export const INVESTOR_POSITIONING = {
  platform: "The Milano Seal is a high-trust document execution platform for U.S. documents used abroad.",
  monetization: "The company monetizes the coordination layer around notarization, RON eligibility, apostille/authentication routing, signer coordination, partner dispatch, courier release, and secure execution tracking.",
  capTable: {
    founder: "Nicholas Milano — 100%",
    investors: "Investors — 0%",
    optionPoolCurrent: "Option pool — 0% current",
    futureAdvisorPool: "Recommended future option/advisor pool — 10%–15%",
    safe: "Future pre-seed SAFE after revenue proof only.",
  },
  scenarios: REVENUE_SCENARIOS,
  grossMarginBands: GROSS_MARGIN_BANDS,
} as const;
