# Immediate Scheduling After Wise Submission

## Canonical rule

A governed Wise payment submission immediately satisfies the payment component of scheduling authority.

It does not wait for Wise settlement.

Client submission truth and Wise settlement truth remain separate:

- `payment_observed_at` + `observed_pending` = scheduling payment authority satisfied
- `payment_confirmed = false` = paid/settled truth not yet verified
- final settlement-dependent release remains locked until canonical Wise verification

## BlueNotary

Once a governed Wise submission is observed, the BlueNotary module may proceed through readiness and session creation without waiting for settlement, subject to the remaining execution gates:

- signer data complete
- Matter document present
- signer location known
- notary jurisdiction known
- notarial act explicitly confirmed

The signing-link release may still require stronger provider evidence under the existing RON guard. This does not block scheduling or BlueNotary readiness/session creation.

## Internal processing note

Operator notification language must state:

- Wise payment processing / settlement pending
- scheduling authority satisfied now
- continue scheduling and BlueNotary readiness
- do not represent the Matter as paid/settled until canonical Wise verification
- settlement-dependent final release remains protected

## Prohibited regression

Never restore language that says scheduling unlocks only after verified settlement.
