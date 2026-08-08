import fs from "node:fs";
const failures=[];
const locks=fs.readFileSync("lib/canonical/milanoLocks.ts","utf8");
const docs=fs.readFileSync("docs/architecture/CANONICAL_LOCKS.md","utf8");
for (const text of ["internalBase: 750","internalBase: 975","internalBase: 1850","cleanCompliantDraftInternalAdjustment: 650","publicPriceVisible: false","Next.js","Vercel","Supabase Postgres","Wise-first payment flow","Webflow","Airtable","founder_led","staged_after_compliance","targetPageCount: 5","targetPageCount: 60","targetPageCount: 2400","Stripe","cheap","100% off","free coupon","payment bypass"]) if(!locks.includes(text)) failures.push(`missing ${text}`);
for (const text of ["Next.js + Vercel + Supabase Postgres + Wise-first","Signature Lane 750","Phase 3 targets a 2400-page programmatic engine","Deals remain the source of truth"]) if(!docs.includes(text)) failures.push(`docs missing ${text}`);
if(failures.length){console.error(failures.join("\n"));process.exit(1)}
console.log("Canonical locks validation passed.");
