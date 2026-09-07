# Data Model

The layer-specific data authority is defined in `../../LAYER_MANIFEST.json`.

Rules:
- `deals.id` is the immutable internal Matter key.
- `deals.deal_id` is the public Matter reference.
- Child evidence retains canonical Matter linkage.
- Browser-local state is never an authority for protected truth.
- Provider-derived truth requires provider evidence.
- New tables may store evidence/read models only when they do not duplicate an existing authority.
