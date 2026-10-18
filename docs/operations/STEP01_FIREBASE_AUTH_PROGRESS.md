# STEP 01 — Firebase Spark Hybrid AUTH-GATE Progress Report

**Status:** IN PROGRESS / **NOT PRODUCTION READY**  
**Date:** 19 October 2026 after midnight WIB  
**Product baseline:** PRD V1.5, ADR-0005 approved by owner.  
**Time constraint:** Target 19 October 2026 12:00 WIB; target is not evidence of completion.

## Completed work

- User explicitly approved Firebase Authentication Spark for password identity provider. GAS remains business backend; private Sheets/Drive remain Google-account-owned.
- Pinned local `firebase-tools` CLI v15.34.0 installed on authorized Windows workstation, along with clasp, Node, TypeScript and testing tools.
- Architecture decision [ADR-0005](../architecture/ADR-0005-firebase-auth-spark.md) and updated [AUTH-GATE plan](STEP01_AUTH_GATE_PLAN.md) recorded.
- GAS Firebase-auth experiment source checked in under `experiments/step01-firebase-gas/` on `develop`: username-only HTML login, Firebase REST `accounts:signInWithPassword`, server-side `accounts:lookup` validation, and private UID→role/branch allowlist.
- The password input is sent to Firebase over HTTPS, **not** to GAS.
- Eight mocked Node.js contract tests executed on the connected workstation: **8 PASS / 0 FAIL**. Includes bad/malformed/expired/foreign-project tokens; disabled Firebase user; account not in role allowlist; inaccessible configuration; valid UID projected only to role/branch.
- `clasp push` of GAS test HTML/Code/manifest succeeded; test-only deployment created at version 3, **not production**.
- HTTP request to version-3 web app received **403 / "Anda memerlukan akses"** from Google. An earlier version-2 web app returned 404; **live Firebase integrated login is NOT working yet**. Access/authorization in the Apps Script deployment requires investigation and verification.
- Firebase CLI `login:list` returned **no authorized accounts**. This is a separate credential authorization step from the earlier successful `clasp login`.

## Remaining blocking items

1. **Owner step:** run Firebase CLI login interactively on their laptop, approve the account privately through browser. Never send login code/password or OAuth redirect to ChatGPT.
2. Create Firebase project with **Spark** (no Blaze/billing) and enable Email/Password provider, confirm Web API key and project ID. Neither has been done.
3. Provision two synthetic test accounts with unique passwords securely (no account yet).
4. Resolve Google Apps Script Web App version-3 **403** access issue and run a real UI/mobile login.
5. Prove GAS server accepts valid Firebase token and rejects forged/foreign/expired tokens; verify UID to private scoped roles; test disabled/revoked accounts and quota/latency.
6. Provision up to 13 actual internal accounts only after safety and workflow proven; no published credentials.
7. Verify end-to-end operational app functions before any production release.

## Explicitly NOT proved

- Mock test PASS **does not prove** cryptographic token validation by Firebase in the live GAS deployment.
- Firebase identity project does not yet exist.
- The unconfigured GAS login page is not publicly accessible; observed 403.
- No complete application UI, participant import, check-in, judges' scoring, rankings or results publishing has been implemented.
- No production customer data, child records, credentials, passwords, Google Sheets, or real judges' accounts were created.

## Security and quality policy

- The GAS verifier uses the documented Identity Toolkit `accounts:lookup` API as an external trust boundary, then checks project UID/issuer/audience/time and private account allowlist. This is a **candidate**, pending live positive and negative tests.
- UID→role/cabang assignment must stay server-side. Browser-supplied username, email or role are never authorization.
- GAS web app access and OAuth scopes must be tested; bypass by sharing Sheets or storing passwords in GAS forbidden.
- `npm audit` reported vulnerabilities in installed dev toolchain; assess these separately before release. Runtime app does not bundle Firebase CLI.
- No change to scoring/publishing/child privacy rules in PRD V1.5.

**Gate decision:** **NO GO** for production release. Continue AUTH-GATE only after CLI owner sign-in; do not silently lower security. 
