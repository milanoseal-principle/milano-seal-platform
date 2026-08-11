# Cinematic cross-platform coverage

This matrix records code-level coverage for the canonical Milano motion and surface infrastructure. It does not represent production deployment or visual approval. Every route inherits `CinematicPageShell`, global focus rules, mobile touch targets, and reduced-motion CSS from the root layout. Specialized motion remains restrained and must consume the canonical tokens or shared preference hook.

| Surface | Representative routes | Canonical motion | Reduced motion | Mobile rules | State surfaces | Focus | Logic |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Public | `/`, `/about`, `/founder`, `/alliance` | Root shell; homepage section reveals | Code verified | Code verified | Global error/loading | Code verified | Unchanged |
| Secure intake | `/intake` | Root shell | Code verified | Code verified | Existing intake states | Code verified | Unchanged |
| Global intelligence | `/map` | Root shell; existing map motion | Code verified | Code verified | Existing map states | Code verified | Unchanged |
| Matter Control Portal | `/portal`, `/portal/tracking`, `/portal/invoice`, `/portal/documents` | Root shell; existing timeline and courier motion | Code verified | Code verified | Portal empty states normalized | Code verified | Unchanged |
| Alliance | `/alliance`, `/alliance/apply`, `/alliance/onboarding`, `/alliance/dashboard` | Root shell; Alliance hero paused offscreen | Code verified | Code verified | Existing alliance states | Code verified | Unchanged |
| Operator and admin | `/dashboard`, `/dashboard/intake`, `/dashboard/deals`, `/dashboard/pipeline`, `/dashboard/admin/payments` | Root shell; dashboard primitives tokenized | Code verified | Code verified | Existing dashboard system states | Code verified | Unchanged |
| Founder Command | `/dashboard/founder`, `/founder` | Root shell; dashboard primitives tokenized | Code verified | Code verified | Existing command states | Code verified | Unchanged |
| Execution operations | Matter detail, scheduling, pre-execution, apostille, custody, shipping, release | Root shell; specialized status/timeline motion retained | Code verified | Code verified | Existing operational states | Code verified | Unchanged |
| VA and field operations | `/va`, `/va/tasks`, `/va/matters`, `/today` | Root shell; operator atmosphere normalized | Code verified | Code verified | Existing workflow states | Code verified | Unchanged |
| Authentication | `/login`, `/operator/login`, `/alliance/login`, `/access` | Root shell | Code verified | Code verified | Existing access errors | Code verified | Unchanged |

## Visual verification still required

Viewport screenshots, keyboard traversal, focus trapping, 200% zoom, and production integration states require browser-based review in the Vercel preview. Code-level coverage must not be described as deployed or visually approved until that review is complete.
