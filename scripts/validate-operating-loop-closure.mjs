import { readFileSync, existsSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const checks = [];
const check = (label, ok) => checks.push({ label, ok: Boolean(ok) });
const hasAll = (text, values) => values.every((value) => text.includes(value));

const lifecyclePath = 'lib/governance/matter-lifecycle-certification.ts';
const reviewMigrationPath = 'supabase/migrations/064_milano_review_requests.sql';
const seoMigrationPath = 'supabase/migrations/065_search_console_revenue_feedback.sql';
const reviewApiPath = 'app/api/review-requests/route.ts';
const reviewMutationPath = 'app/api/review-requests/[id]/route.ts';
const reviewDashboardPath = 'app/dashboard/review-requests/page.tsx';
const reviewPortalPath = 'app/portal/review/page.tsx';
const copilotPath = 'components/assistant/MilanoExecutionCopilot.tsx';
const seoClientPath = 'lib/seo/search-console/client.ts';
const seoSyncPath = 'lib/seo/search-console/sync.ts';
const seoReportingPath = 'lib/seo/search-console/reporting.ts';
const seoApiPath = 'app/api/admin/seo/search-console/sync/route.ts';
const seoDashboardPath = 'app/dashboard/seo/page.tsx';
const authorityFreshnessPath = 'app/dashboard/authorities/verify/layout.tsx';
const portalRailPath = 'components/portal/portal-status-rail.tsx';
const operatorShellPath = 'components/dashboard/OperatorShell.tsx';

for (const path of [lifecyclePath, reviewMigrationPath, seoMigrationPath, reviewApiPath, reviewMutationPath, reviewDashboardPath, reviewPortalPath, copilotPath, seoClientPath, seoSyncPath, seoReportingPath, seoApiPath, seoDashboardPath, authorityFreshnessPath, portalRailPath, operatorShellPath]) {
  check(`present: ${path}`, existsSync(path));
}

const lifecycle = read(lifecyclePath);
const reviewMigration = read(reviewMigrationPath);
const reviewApi = read(reviewApiPath);
const reviewMutation = read(reviewMutationPath);
const copilot = read(copilotPath);
const seoMigration = read(seoMigrationPath);
const seoClient = read(seoClientPath);
const seoReporting = read(seoReportingPath);
const seoDashboard = read(seoDashboardPath);
const authorityFreshness = read(authorityFreshnessPath);
const portalRail = read(portalRailPath);
const operatorShell = read(operatorShellPath);

check('lifecycle certification spans the full canonical Matter chain', hasAll(lifecycle, [
  'MATTER_CREATED','VALIDATED','QUOTED','WISE_PAYMENT_VERIFIED','EXECUTION_UNLOCKED','EXECUTED','APOSTILLE_OR_AUTHENTICATION','CUSTODY_RECORDED','COURIER_RELEASED','DELIVERED','MATTER_CLOSED',
]));
check('lifecycle certification checks cross-system same-Matter continuity', hasAll(lifecycle, ['apiMatterId','portalMatterId','operatorMatterId','wiseMatterReference','eventMatterIds','releaseMatterId','trackingMatterId','identityContinuity']));
check('lifecycle certification is read-only and does not create another state engine', !/\.from\(|\.insert\(|\.update\(|\.delete\(/.test(lifecycle));
check('Wise processing cannot certify as verified settlement', lifecycle.includes("['settled', 'confirmed', 'paid']") && !lifecycle.includes('observed_pending'));

check('human review schema is persisted and governed', hasAll(reviewMigration, ['create table if not exists public.review_requests','REQUESTED','ACKNOWLEDGED','IN_REVIEW','RESOLVED','CLOSED','enable row level security','revoke all']));
check('review creation links a Matter only through authorized client ownership', hasAll(reviewApi, ['getAllClientDeals','clientCtx?.deals.some','matter_id: matterId','status: \'REQUESTED\'']));
check('operator review transitions are optimistic and governed', hasAll(reviewMutation, ['canTransitionReview','.eq(\'status\', from)','assigned_operator_id','acknowledged_at','resolved_at']));
check('Copilot persists review before claiming request success', hasAll(copilot, ['fetch("/api/review-requests"','MILANO REVIEW REQUESTED','if (!response.ok || !body.review?.id)','No human-review status has been claimed']));
check('Copilot never fabricates Nicholas joining', !/Nicholas joined/i.test(copilot));

check('Search Console observation table is source-bound and service-role governed', hasAll(seoMigration, ['seo_search_console_observations','google_search_console','enable row level security','service_role']));
check('Search Console client is credential optional and read-only', hasAll(seoClient, ['GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON','GOOGLE_SEARCH_CONSOLE_SITE_URL','webmasters.readonly','searchConsoleConfigured']));
check('SEO reporting counts revenue from canonical verified paid Matters', hasAll(seoReporting, [".eq('payment_confirmed', true)",'verified_revenue','amount_paid','attributionBoundary']));
check('SEO dashboard does not fabricate data when Search Console is unconfigured', hasAll(seoDashboard, ['SEARCH CONSOLE UNCONFIGURED','No verified Search Console observations are available yet','query-to-revenue attribution']));

check('authority freshness control plane reuses receiving_authorities', hasAll(authorityFreshness, [".from('receiving_authorities')",'STALE ROUTES','REVIEW-DUE ROUTES','PENDING CONVENTION CHANGES','SOURCE CONFLICTS']));
check('authority freshness does not define a second country registry', !/create table|COUNTRY_REGISTRY|countryRegistry/.test(authorityFreshness));
check('portal is status-first and derives lifecycle projection from real Matter status', hasAll(portalRail, ['CURRENT STAGE','ACTION REQUIRED','NEXT EXPECTED EVENT','MATTER JOURNEY','resolvePortalLifecycleSummary']));
check('review request is not treated as canonical Matter closure', !/\["completed",\s*"review_requested"/.test(portalRail) && !/\['completed',\s*'review_requested'/.test(portalRail));
check('operator navigation exposes human review and SEO feedback surfaces', hasAll(operatorShell, ['/dashboard/review-requests','/dashboard/seo','RON / BlueNotary','Payments']));

const allNew = [lifecycle, reviewMigration, reviewApi, reviewMutation, copilot, seoMigration, seoClient, seoReporting, seoDashboard, authorityFreshness, portalRail, operatorShell].join('\n');
check('operating-loop closure introduces no Stripe dependency', !/stripe/i.test(allNew));
check('operating-loop closure creates no competing payment table or settlement mutation path',
  !/create\s+table\s+(if\s+not\s+exists\s+)?public\.(payments|payment_events|payment_settlements)/i.test(`${reviewMigration}\n${seoMigration}`) &&
  !/payment_confirmed\s*[:=]\s*true|payment_status\s*[:=]\s*['"]paid['"]/i.test(`${reviewApi}\n${reviewMutation}`)
);

const failed = checks.filter((item) => !item.ok);
for (const item of checks) console.log(`${item.ok ? 'PASS' : 'FAIL'} ${item.label}`);
console.log(`Operating loop closure: ${checks.length - failed.length}/${checks.length} passed`);
if (failed.length) process.exit(1);
