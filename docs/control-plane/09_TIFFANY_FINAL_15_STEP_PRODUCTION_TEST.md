# The Milano Seal™ — Tiffany Final 15-Step Production Test

This runbook is the controlled live certification for Gate 37. It does not replace the canonical Matter engine, pricing engine, Wise authority, scheduling gate, client portal, or operator workflow.

## Controlled Test Matter

- Matter: `MS-2026-4887`
- Document: One and the Same Affidavit
- Destination: Italy
- Signer location: Florida
- Requested execution: Remote Online Notarization
- Documents: 1
- Signers: 1
- Apostille: Yes — 1
- Translation: No
- Preferred execution timeline: Standard
- Delivery method: International courier
- Test discount code: `TIFFTEST99`
- Test file: `TIFF_TEST_ONE_AND_SAME_AFFIDAVIT.pdf`
- PDF marking: `TEST — NOT FOR LEGAL USE`

## Canonical Persisted Pricing Contract

Gate 37 follows the actual persisted production quote for Matter `MS-2026-4887`. The client must see the itemized order before payment:

```text
Priority Execution Lane                    $975.00
1 Florida apostille                        $250.00
International courier                      $150.00
-----------------------------------------------
ORIGINAL MATTER TOTAL                    $1,375.00

TIFFTEST99 = 99% of full Matter total    -$1,361.25
-----------------------------------------------
FINAL MATTER TOTAL                          $13.75

WISE RETAINER — 50%                          $6.88
REMAINING BALANCE                             $6.87
```

Production precondition: `TIFFTEST99` must be active as a 99% percentage discount applied to `matter_total`. The code must be entered by the client on the portal Invoice & Payment screen. It must not be auto-applied by intake, the database, an operator override, or any payment bypass.

The test discount changes pricing only. It never marks a Matter paid and never unlocks scheduling. Only verified Wise settlement may satisfy the payment gate.

## 15-Step Certification

1. Open production at `https://themilanoseal.com` on the phone used for certification.

2. Enter Secure Records Intake using normal public navigation.

3. Use the controlled Matter/account. The client identity must use the same verified email associated with the Matter. Do not use an operator/admin email as the client identity.

4. Controlled description:

```text
TIFFANY PRODUCTION TEST — One and the Same Affidavit for use in Italy. One Florida signer. Remote online notarization requested. One Florida apostille requested. No translation. TEST ONLY — NOT FOR LEGAL USE.
```

5. Confirm `TIFF_TEST_ONE_AND_SAME_AFFIDAVIT.pdf` is attached to the same Matter and marked `TEST — NOT FOR LEGAL USE`.

6. Confirm Matter ID `MS-2026-4887` exists exactly once. Do not create a duplicate Matter to continue the same certification run.

7. Enter the Secure Matter Portal and open the home Matter Control screen. PASS only if the portal shows the itemized order ledger and the same Matter pricing:

```text
Priority Execution Lane:  $975.00
Florida apostille:         $250.00
International courier:     $150.00
Original Matter total:   $1,375.00
```

8. Open `Invoice & Payment`. Enter `TIFFTEST99` in the Discount / Courtesy Code field and press Apply.

Expected result:

```text
Original Matter total:   $1,375.00
Discount — 99%:         -$1,361.25
Final Matter total:         $13.75
Wise retainer due now:       $6.88
Remaining balance:           $6.87
```

Save a screenshot. STOP if the code cannot be entered, the itemized order changes incorrectly, the discount is not exactly 99% of the full Matter total, or the retainer does not become `$6.88`.

9. Before paying, attempt scheduling. PASS only if scheduling remains blocked despite the discount being applied.

10. Complete the real Wise test payment for exactly `$6.88 USD` using only the Matter-specific Wise payment link/reference generated after the discount is applied. Do not use a fake card, Stripe test card, generic Wise link, manual paid override, or test bypass. Save the Wise confirmation/reference and screenshot.

11. Confirm the same Matter updates to paid exactly once. Verify correct Matter ID, `$6.88` payment amount, Wise reference, no duplicate Matter, and no duplicate payment event.

12. Attempt scheduling again. PASS only if scheduling is now unlocked. Complete one test appointment.

13. Verify the client portal remains accessible using the same confirmed client account. Test Forgot Password separately: request a reset, open the email, set a new password, return to login, and verify the same client Matter remains attached. Password recovery must not create a second account or Matter.

14. Test the operator/admin account separately at `https://themilanoseal.com/login`. Verify authorized operator/admin routing. Do not use the operator account as the client identity.

15. Advance the same Matter through:

```text
Scheduled
→ Execution / RON
→ Apostille
→ Release / Courier
→ Delivery
→ Complete
```

After each material transition, verify client/operator/Supabase parity for the same Matter.

## Evidence Returned

Capture and return:

- Matter ID `MS-2026-4887`
- itemized portal order screenshot
- `TIFFTEST99` before/after screenshot
- Wise `$6.88` reference and payment screenshot
- password-reset PASS / FAIL
- any error screenshots
- PASS / FAIL for Steps 1–15

## Final Pass Rule

PASS only if one Matter traverses:

```text
Verified client account
→ itemized $1,375.00 Matter order
→ TIFFTEST99 entered on Invoice & Payment
→ $13.75 final Matter total
→ $6.88 Wise retainer
→ verified payment exactly once
→ scheduling unlock
→ portal parity
→ execution
→ apostille
→ release/courier
→ delivery
→ complete
```

Any duplicate Matter, duplicate payment, false-success state, mismatched data, unauthorized lifecycle mutation, payment-gate bypass, discount applied without client action, or password-reset account split is NO-GO.
