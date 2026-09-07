# Tiffany Operator E2E Test — Current Control

Use Tiffany's existing regression Matter only when safe:

`MS-2026-4887`

Do not create a replacement Matter, do not charge it again, and do not mutate historical truth just to pass a test.

Current certification sequence:

1. Authenticate through the real client flow.
2. Open the same canonical Matter.
3. Confirm one Matter ID and document lineage.
4. Confirm governed Wise submission truth.
5. Confirm scheduling authority is available without waiting for final settlement.
6. Confirm there is no second payment CTA.
7. Open `/portal/ron`.
8. Confirm real RON blockers/readiness.
9. Resolve notarial act only through governed operator control; never guess Jurat vs Acknowledgment.
10. Create or reuse one canonical BlueNotary session.
11. Confirm browser return alone does not author RON completion.
12. Confirm provider evidence drives RON completion.
13. Confirm signed-document retrieval and execution validation.
14. Confirm apostille/authentication evidence and route.
15. Confirm custody/courier/delivery evidence.
16. Confirm required Wise settlement before final settlement-dependent release.
17. Release exactly once when all canonical gates pass.
18. Close the same Matter.
19. Verify required notifications.
20. Verify no duplicate Matter/payment/session/booking/apostille/release records.
21. Verify production runtime logs for the transaction window.
22. Repeat critical client/operator actions at 375/390/430px and desktop.

Controlling architecture:
- `docs/architecture/README.md`
- `docs/architecture/LAYER_MANIFEST.json`
- `docs/architecture/layer-15-validation/*`
- `docs/FINAL_PRODUCTION_CERTIFICATION.md`
