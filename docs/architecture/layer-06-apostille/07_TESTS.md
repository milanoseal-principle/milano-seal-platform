# Tests

Layer-specific mandatory regression coverage is defined in `../../LAYER_MANIFEST.json`.

Rules:
- Tests are additive to typecheck, lint, full tests, migration-chain, responsive/mobile, governance, and production gates.
- Provider truth requires provider evidence in tests where applicable.
- Unknown/review-required semantics must be asserted explicitly.
- Historical production truth may not be mutated merely to make a certification pass.
- No test may introduce a parallel Matter, payment, scheduler, RON, apostille, custody, or release authority.
