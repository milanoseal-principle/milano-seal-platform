import { readFileSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");
const checks = [];
const check = (n, o) => checks.push({ n, o });

const damianiPage = read("app/professional/damiani/page.tsx");
const damianiReentry = read("app/professional/damiani/DamianiReentry.tsx");
const page = read("app/intake/page.tsx");
const wizard = read("components/intake/smart-intake-sop-wizard.tsx");
const intakeRoute = read("app/api/intake/route.ts");
const intake = `${intakeRoute}\n${read("app/api/intake/core.ts")}`;
const discount = read("src/features/discounts/discountService.ts");
const discountRoute = read("app/api/deals/[id]/apply-discount/route.ts");
const wise = read("app/api/webhooks/wise/route.ts");
const migration = read("supabase/migrations/047_discount_wise_deal_wiring.sql");
const governedDamiani = read("supabase/migrations/051_damiani50_governed_scope.sql");

check(
  "dedicated Damiani route auto-carries courtesy",
  /\/intake\?lane=professional&courtesy=DAMIANI50&source=damiani-reentry/.test(
    damianiReentry,
  ) && !/courtesyDetected\s*\?/.test(damianiReentry),
);
check(
  "Damiani Italian default",
  /params\.lang === "en" \? "en" : "it"/.test(damianiPage) &&
    /Bentornata, Avv\. Damiani/.test(damianiReentry),
);
check(
  "Damiani route noindex nofollow",
  /index:\s*false/.test(damianiPage) && /follow:\s*false/.test(damianiPage),
);
check(
  "courtesy language remains server-verified",
  /verified and applied before payment/.test(damianiReentry) &&
    /verificato e applicato prima del pagamento/.test(damianiReentry),
);
check("courtesy page handoff", /courtesyCode=\{courtesyCode\}/.test(page));
check("wizard server payload", /courtesy_code:\s*courtesyCode/.test(wizard));
check(
  "server courtesy validation",
  /requestedCourtesy/.test(intake) &&
    /redemption_status:\s*"not_redeemed"/.test(intake),
);
check(
  "canonical Wise reference",
  /const payment_reference = deal_id;/.test(intake) &&
    !/\$\{deal_id\}-R/.test(intake),
);
check("exact amount due stored", /amount_due:\s*invoice\.retainer/.test(intake));
check(
  "courtesy fail closed",
  /\.insert\(\[intakePayload\]\)[\s\S]*if \(persistenceError\)[\s\S]*safeFailure\("PERSISTENCE_FAILED"/.test(
    intake,
  ) &&
    /requestedCourtesy/.test(intake) &&
    !/minimalPayload|barePayload/.test(intake),
);
check(
  "discount uses deals",
  /from\("deals"\)/.test(discount) && !/matterRepository/.test(discount),
);
check("explicit eligible subtotal", /DISCOUNT_REVIEW_REQUIRED/.test(discount));
check(
  "Damiani source is preserved server-side",
  /damiani-reentry/.test(intakeRoute) &&
    /source_channel:\s*sourceChannel/.test(intakeRoute),
);
check(
  "review-required intake is not awaiting payment",
  /update\(\{\s*deal_status:\s*"reviewing"\s*\}\)/.test(intakeRoute) &&
    /INTAKE_REVIEW_STATUS_PERSISTENCE_FAILED/.test(intakeRoute),
);
check(
  "discount source restriction enforced",
  /allowed_source_channel/.test(intakeRoute) &&
    /allowed_source_channel/.test(discountRoute) &&
    /Discount code is not eligible for this intake source/.test(discountRoute),
);
check(
  "DAMIANI50 governed metadata is additive",
  /allowed_source_channel',\s*'damiani-reentry'/.test(governedDamiani) &&
    /eligible_service_scope',\s*'professional_services'/.test(governedDamiani) &&
    /where upper\(code\) = 'DAMIANI50'/.test(governedDamiani) &&
    !/usage_count\s*=|discount_value\s*=|status\s*=/.test(governedDamiani),
);
check(
  "atomic Wise RPC",
  /confirm_wise_payment_for_deal/.test(wise) &&
    /atomic_confirmation_failed/.test(wise),
);
check(
  "redemption deal lock",
  /from public\.deals where id=p_matter_id for update/i.test(migration),
);
check(
  "discount row lock",
  /from public\.discount_codes where id=p_discount_code_id for update/i.test(
    migration,
  ),
);
check(
  "exact amount in RPC",
  /round\(p_amount\*100\) <> round\(v_deal\.amount_due\*100\)/.test(migration),
);
check(
  "currency fail closed",
  /invalid_payment_currency/.test(migration) &&
    /payment_currency_mismatch/.test(migration),
);
check(
  "service-role confirm",
  /grant execute on function public\.confirm_wise_payment_for_deal[\s\S]*service_role/i.test(
    migration,
  ),
);
check(
  "service-role redeem",
  /grant execute on function public\.redeem_discount_for_matter[\s\S]*service_role/i.test(
    migration,
  ),
);

const failed = checks.filter((x) => !x.o);
for (const x of checks) console.log(`${x.o ? "PASS" : "FAIL"} ${x.n}`);
console.log(
  `Damiani production wiring: ${checks.length - failed.length}/${checks.length} passed`,
);
if (failed.length) process.exit(1);
