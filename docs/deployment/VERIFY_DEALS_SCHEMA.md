# Verify Canonical `deals` Schema (Production)

The enterprise intelligence loaders read canonical `deals` columns through one
adapter (`lib/deals/canonicalDealReadModel.ts`) using the **migration-confirmed**
names (migrations 001 + 043). Run the SQL below in the Supabase SQL Editor to
confirm production matches. No secrets required.

```sql
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'deals'
ORDER BY ordinal_position;
```

## Expected canonical columns (what the adapter selects)
| App field | Canonical DB column | Migration | If production instead has… |
|---|---|---|---|
| status | `deal_status` | 001 | `status` → schema drift; update adapter mapping |
| destinationCountry | `destination_country` | 001 | `country` → schema drift; update adapter mapping |
| companyName | `company_name` | 001 | — |
| documentType | `document_type` | 001 | — |
| createdAt | `created_at` | 001 | — |
| completedAt | `completed_at` | 001 | — |
| paymentConfirmed (derived) | `payment_status` = `'paid'` | 001 | if a `payment_confirmed` column exists, prefer it |
| amountPaid | `amount_paid` | 043 | — |
| verifiedRevenue | `verified_revenue` | 043 | — |
| paymentDisposition | `payment_disposition` | 043 | — |
| compAuthorized | `comp_authorized` | 043 | — |
| currency | (none on `deals`) | — | left null; never guessed |

## Interpreting results
- **All expected columns present** → intelligence reads real data; no migration needed.
- **`deal_status`/`destination_country` MISSING but `status`/`country` present** →
  production drifted from committed migrations. The adapter now targets the
  migration-confirmed names, so update the single mapping in
  `canonicalDealReadModel.ts` (one place) to match production, OR add a
  backward-compatible compatibility view. Do **not** rename columns destructively.
- **Loader shows "Canonical source unavailable — schema verification required."** →
  the query errored (column mismatch). This is surfaced honestly as
  `evidenceStatus: "unavailable"` (NOT insufficient evidence, NOT fake zeros).

## Migration decision
No migration is included in this hotfix: the committed schema (001 + 043) is
internally consistent and the adapter targets it. A compatibility migration/view
is warranted only if this SQL proves production uses column names absent from the
committed migrations.
