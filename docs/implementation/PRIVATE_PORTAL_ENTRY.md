# Private portal entry correction

The former `/secure-portal` page was a public, hard-coded marketing preview. Its sample Matter reference, payment verification, scheduling eligibility and custody panels did not come from client records, but the “Live Matter shell preview” label made them appear operational.

`/secure-portal` now redirects to the existing `/portal` session and client-role gates and declares noindex metadata. No sample Matter or payment panels remain. Existing public navigation continues to resolve through that canonical access boundary. With streamed rendering, Next.js may emit an HTTP 200 shell containing its redirect instruction rather than an HTTP 307 response; browser navigation still resolves to `/portal`.

The service-role client Matter lookup also now requires a confirmed client identity, uses escaped email pattern candidates, and applies the existing exact normalized email comparator before returning records. SQL/PostgREST wildcard matches cannot establish ownership. Disabled users and other roles are rejected before the administrative query.

## Verification

- Typecheck and lint passed.
- Full test suite: 1,030 passed; targeted tests cover redirect behavior, exact client ownership, wildcard candidates and rejected identities.
- Portal entry validator passed; it now guards the private entry contract instead of requiring the old public demo.
- Local HTTP rendering contains the canonical Next.js redirect instruction to `/portal`, with no sample operational panels.
- A read-only request to the supplied deployed `/api/portal/me` returned HTTP 401 without an application session. This confirms that anonymous API check only; it is not a certification of all authenticated paths or hosted policies.

No hosted migration, customer record mutation or production deployment was performed. The deployed public preview remains until this change is reviewed and deployed.
