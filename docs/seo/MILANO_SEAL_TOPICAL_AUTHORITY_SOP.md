# Milano Seal — Topical Authority Engine (Foundation)

A canonical topic architecture that MAPS existing content to sixteen authority
pillars. Reuses Atlas (canonical `DESTINATIONS`) for country topics and the
existing SEO utilities (`app/sitemap.ts`, `app/robots.ts`, `lib/seo/schema.ts`,
`components/seo/JsonLd.tsx`, breadcrumb) — no duplicate country/service/FAQ/schema/
metadata/sitemap engines.

## Modules (`lib/topical-authority/`)
- `topicRegistry` — the 16 pillars (each references its reused vertical/engine).
- `contentRegistry` — pillar hub topics + Atlas-derived country topics (`canonicalSource: "atlas"`).
- `internalLinkEngine` — orphan detection; every topic must link to intake + its pillar.
- `contentSafety` — banned-claim + duplicate-intent + fabricated-metric guards.

## Surface
`/dashboard/topical-authority` command center — pillar coverage, orphan pages,
and a Search Console panel that shows **nothing** until a real integration exists
(no fabricated rankings/traffic/backlinks).

## Follow-ups (noted, not in this foundation)
Full guide/document/client/glossary/case-study page templates, breadcrumb+schema
wiring per page, editorial workflow + freshness queue, off-site/GBP plans, 90-day
authority plan, content-to-intake attribution deep-wiring.

## Safety
People-first content. No doorway pages, duplicate country facts, fake rankings/
traffic/backlinks, unsupported "official/approved/guaranteed" claims, or legal/
immigration/medical advice. Dashboards/portals stay noindex. Protected systems
untouched.
