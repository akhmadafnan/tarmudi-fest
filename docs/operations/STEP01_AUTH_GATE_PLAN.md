# STEP 01 — AUTH-GATE test plan (preparation only)

**Status:** NOT STARTED. This file specifies the test; it does not implement any authentication.

## Preconditions
- Owner of GAS deployment/Sheets/Drive identified.
- Two volunteer personal Gmail accounts for staff/judge testing; one unlisted Gmail account for negative tests.
- No real participant data in test environment; synthetic entries only.
- Result of public repository licensing/ownership decision recorded.

## Test matrix

| ID | Scenario | Expected |
|---|---|---|
| AUTH-01 | Approved personal Gmail A signs in on Android | verified account identity, correct role |
| AUTH-02 | Approved personal Gmail B signs in on iPhone/Android | verified account identity, different permissions |
| AUTH-03 | Unlisted Gmail signs in | access denied |
| AUTH-04 | Disabled listed account signs in | access denied |
| AUTH-05 | Judge A calls other branch data function | denied on server |
| AUTH-06 | Judge requests participant profile | response has zero name/school fields |
| AUTH-07 | Judge opens source spreadsheet URL | no access granted by app |
| AUTH-08 | Public visitor not signed in visits interim leaderboard | reads anonymous number-only snapshot |
| AUTH-09 | Public visitor attempts write action | denied |
| AUTH-10 | Session expiry/logout/revoked role | privileged actions denied |

## Decision
Every critical test PASS → document chosen login implementation and allow STEP 02. Any privacy or authorization bypass → NO-GO and review alternative no-cost deployment architecture with owner.
