# The Milano Seal™ — Shared OS Surface Standard

Status: ACTIVE PRODUCTION DESIGN STANDARD

## Source standard followed

This implementation follows the current Milano Seal master identity, the premium operating-system UX doctrine, the existing cinematic motion system, and the canonical role/data boundaries already enforced in production.

The visual objective is one coherent Milano Seal operating system without merging role permissions or creating a second Matter, payment, execution, custody, or release engine.

## Global interaction sequence

COMMAND → ATTENTION → PRIORITY → INTELLIGENCE → CONTEXT → NEXT ACTION → EXECUTION → OUTCOME → CHRONOLOGICAL MEMORY

The shared shell provides the command/navigation layer, persistent context, route clarity, status visibility, responsive navigation, and restrained cinematic atmosphere. Each role surface retains its own operational content and permissions.

## Canonical role surfaces

- Operator / Founder: `/dashboard`
- Client: `/portal`
- Execution Support: `/va/dashboard`
- Alliance Partner: `/alliance/dashboard`

All surfaces remain under `themilanoseal.com` and use the existing canonical authorization layer.

## Shared shell

`components/os/MilanoOSShell.tsx`

The shell owns presentation only:

- Milano Seal brand chrome
- grouped navigation
- active-route context
- Cmd/Ctrl+K navigation palette
- responsive mobile drawer
- status pills supplied by the role surface
- restrained route transitions
- atmospheric black/gold background
- identity/sign-out presentation

The shell must never fetch Matter data, authorize users, confirm payment, unlock scheduling, mutate custody, advance execution, or release documents.

## Role-specific context

### Operator

Command, execution, intelligence, finance, network, and system navigation. New Matter remains the primary shell action. Payment language remains Wise-governed.

### Client

Client-safe Matter projection only. The shell may show the active Matter, destination, client-facing status, payment status, and Matter switcher supplied by the existing portal context. Internal notes and protected system truth remain excluded.

### Execution Support

Preparation, coordination, checklist, document, RON, courier, follow-up, and escalation navigation. Protected financial and release actions remain restricted.

### Alliance

Partner execution posture, readiness, Matter handoff, shared Matter visibility, account, and support navigation. Routing readiness remains evidence-based and role-gated.

## Motion standard

Reuse the existing Milano motion presets and entry ritual. Motion must communicate hierarchy and state without inventing telemetry.

Required safeguards:

- `prefers-reduced-motion` removes ambient drift and transition motion
- navigation never waits for animation
- no looping operational telemetry
- no fake live counts
- no hacker, crypto, neon, or game-HUD visual language
- no heavy WebGL dependency

## Mobile standard

- 44px minimum primary touch targets
- no horizontal page overflow
- mobile drawer replaces desktop sidebar
- status pills scroll horizontally when necessary
- route title and primary command remain visible
- content recomposes instead of merely shrinking desktop chrome

## Production gate

`scripts/validate-milano-os-surface-unification.mjs`

The gate fails if the four role surfaces stop using the shared shell, if reduced-motion/mobile/command behavior disappears, or if the shared presentation layer begins fetching or mutating operational data.
