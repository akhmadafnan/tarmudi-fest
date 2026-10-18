# STEP 01 — Live GAS Runtime Capability Probe Results

**Date:** 2026-10-18 (Asia/Jakarta), about 23:48 WIB  
**Status:** PARTIAL TECHNICAL EVIDENCE / **AUTH-GATE NOT PASSED**  
**Product baseline:** PRD V1.5 (13 internal accounts; no production credentials created)  
**Reference source:** [test-only Code.js](../../experiments/step01-auth-gate/Code.js)  
**Privacy:** separate Apps Script test project owned by maintainer's personal Google account; actual script identifier, OAuth credentials, and deployment IDs are kept out of the public repo.

## Setup evidence

1. On authorized Windows laptop, `D:\\PROJEKKU\\tarmudi-fest`, cloned `develop`.
2. Node.js v24.21.0; npm 11.19.0; local `@google/clasp` v3.4.1.
3. Apps Script API enabled by project owner; `clasp create-script` succeeded (standalone test-only GAS project).
4. `clasp push` uploaded `Code.js` and `appsscript.json` into that project.
5. `clasp deploy` created immutable **version 1**, read-only public capability probe.
6. Independent unauthenticated Windows PowerShell HTTP GET using `Invoke-WebRequest` returned **HTTP 200** with the exact JSON below. The probe has no mutating endpoints and accesses no Sheets/Drive or identity data.

## Measured remote response (GAS execution)

```json
{
  "probe": "TF26-AUTH-GATE-RUNTIME-CAPABILITIES",
  "version": 1,
  "runtime": "Apps Script V8",
  "classSyntax": true,
  "globalCryptoAvailable": false,
  "subtleCryptoAvailable": false,
  "textEncoderAvailable": false,
  "hmacPrimitiveAvailable": true,
  "scriptLockAvailable": true,
  "disclaimer": "This proves no password KDF, secure session, rate limit or auth."
}
```

## Conclusions supported by evidence

- **PASS:** OAuth access for test owner, Apps Script API, project creation, source push, deployment, anonymous read-only endpoint, GAS V8 classes, HMAC primitive and script-scope lock availability.
- **UNAVAILABLE NATIVELY:** server `crypto`, `SubtleCrypto` and `TextEncoder` globals (all returned `false`).
- **UNTESTED / CRITICAL:** actual vetted password KDF speed and correctness on GAS, cryptographically secure session-token derivation, safe transport/storage of session token in iframe, revocation and timeout, login throttling, bootstrap, multi-branch authorization, attack simulations and concurrency. These are still mandatory in [AUTH-GATE plan](STEP01_AUTH_GATE_PLAN.md).
- **Do not infer:** an HMAC primitive by itself does NOT satisfy password-hashing policy, nor does it supply a CSPRNG; a working public GAS endpoint is NOT a secure login.

## Owner decision and next tests

- Preserve `PRD V1.5`: username/password 13 pre-provisioned accounts and branch-scoped business access.
- Continue security proof before adding any participant management or judging business application module.
- Assess an externally maintained password/security service only if GAS-native KDF and session transport cannot reach the required bar. Candidate Firebase Authentication supports email/password on its no-cost tier, but its account-mapping and server verification would require a separate owner-approved architecture ADR; **no such approval has been granted yet**.
- If the standalone custom-login design fails critical tests, designate it `NO-GO`, explicitly propose a zero-fee alternative, and wait for owner decision. Do not weaken passwords or make a shared Admin password.

## Build/dependency audit note

`npm audit --omit=dev --audit-level=high` returned **0 production dependency vulnerabilities** for the pre-tooling package, while full dev-dependency install flagged **3 high vulnerabilities**, which require review before shipping. Toolchain and generated runtime code are not a release.

**Overall STEP 01 result: IN_PROGRESS, AUTH-GATE NOT PASSED.** Do not claim production-ready or that any real login account exists.
