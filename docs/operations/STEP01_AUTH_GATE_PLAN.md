# STEP 01 — AUTH-GATE for 13 Internal Accounts (Plan Only)

**Status:** NOT STARTED — DO NOT IMPLEMENT UNTIL STEP 00 EXIT GATE PASS  
**Product source:** [PRD V1.5](../product/PRD_TARMUDI_FEST_V1.5.md), ADR-0003.  
**Candidate:** Google Apps Script / HTML Service / Google Sheets, with private Google owner account.

## Objective
Show whether **13 pre-provisioned username/password accounts** can securely authenticate Admin, registration operators and judges without giving them direct access to Google Sheets/Drive. This is a feasibility test, **not** a predetermined approval to invent insecure password authentication in Apps Script.

## Preconditions
- Project owner's personal Google account is chosen as platform owner; Google resources and test deployment have not yet been provisioned.
- 13 **synthetic** test accounts following the specified usernames; credentials generated at test-time privately, never committed to GitHub.
- Dummy participant records only; judge and registration role scopes set by branch.
- At least two mobile devices/browser variants, plus an unauthenticated browser profile.
- Model threats: public network and shared devices, XSS, CSRF, brute-force, token theft/replay, session revocation, direct API misuse and infrastructure privilege escalation.

## Acceptance matrix

| ID | Test | PASS criteria |
|---|---|---|
| AUTH-01 | Bootstrap Admin once | No fixed shared password; no reusable bootstrap bypass |
| AUTH-02 | Provision all 13 internal usernames | Exactly 1 Admin, 3 Registration, 9 Judges; correct branch scopes |
| AUTH-03 | Verify credential handling | Unique passwords, unique salts, adaptive password hashing supported and practical in runtime |
| AUTH-04 | Successful login for Admin and 2 scoped users | Role-specific panel opens on phone; no Google OAuth required |
| AUTH-05 | Unknown user, incorrect password, disabled user | Generic denial; no username enumeration |
| AUTH-06 | Force rotation at first use | Initial temporary password no longer works |
| AUTH-07 | Admin reset and disable account | Existing sessions revoked; new session needs proper credentials |
| AUTH-08 | Logout/TTL/session renewal | Old credential rejected at protected endpoints |
| AUTH-09 | Forged/replayed/stolen-session attempt | Mitigations demonstrate reasonable resistance; reject invalid/expired token |
| AUTH-10 | Repeated failed login attempts | Enforced server-side throttling/lockout without logging raw passwords |
| AUTH-11 | Cross-competition request | Server denies wrong competition regardless of request/body |
| AUTH-12 | Judge tries obtaining name, school, others' scores | No identity fields in payload and forbidden data denied |
| AUTH-13 | Direct Sheets/Drive access by judge account | Not required or granted |
| AUTH-14 | Unauthenticated visitor interim leaderboard | Only number-only published snapshot returned |
| AUTH-15 | Anonymous visitor writes/checks participant master | Denied server |
| AUTH-16 | HTML Service iframe/cookie/session storage design | Security assumptions actually demonstrated; XSS/CSRF controls tested |
| AUTH-17 | Simultaneous logins and server calls | No privilege confusion or inconsistent session/role state |
| AUTH-18 | Source/repository/log leak audit | No real credential, secret key, session token or private access list included |

## Evaluation protocol
- List cryptographic facilities **actually** available in chosen platform; benchmark password KDF and quota overhead; do not claim Argon2id/PBKDF2 support before proof.
- Evaluate options for cryptographically unpredictable sessions and a browser-safe transport. Do not assume HttpOnly cookie controls from Apps Script HTML Service.
- Check all privileged handlers server-side, test forbidden requests and lifecycle.
- Record environmental conditions, screenshots without real participant data, PASS/FAIL evidence and remaining risks.
- Any failure of password handling, session security or branch isolation is **NO-GO**; propose alternative free approach only with owner approval.

**No production password accounts, app code, or deployment created by this plan.**


## Pre-code platform verification checklist (applicable when STEP 01 starts)

- [ ] V8 runtime API availability: no built-in `crypto.subtle`; verify HMAC primitives and the feasibility/benchmark of OWASP-grade password KDF at actual quotas.
- [ ] Verify high-quality randomness generation route for unique salts and session secrets; `Utilities.getUuid()` by itself is not accepted as proof of CSPRNG entropy.
- [ ] Browser/IFRAME test for cookie header controls, session storage model and CSRF/XSS mitigation; no assumption that GAS can set `HttpOnly; Secure; SameSite` on its own response.
- [ ] Audit all public `google.script.run` entrypoints (not just UI menus) for deny-by-default role, branch and session authorization.
- [ ] Verify that staff/judges never gain direct Sheets/Drive permissions; public endpoints are anonymous read-only and cannot be used to enumerate participants.
- [ ] Enforce scripted brute-force controls and generic login failure response, with concurrent attempts and session invalidation tests.
- [ ] Record platform benchmark, screenshots (synthetic only), outcome PASS/FAIL and owner approval. A failed critical item = **NO-GO** with documented alternative path, no insecure workaround.


## Amendment: Firebase Spark provider selected by owner (18 October 2026)

**New preferred experiment:** Firebase email/password identity provider; GAS accepts only validated Firebase ID tokens and resolves UID to a private role/cabang map. Password KDF and Firebase token issuance are delegated to the managed Firebase service. **The old plan to implement custom password KDF in GAS is an evaluated fallback, NOT the preferred implementation.** See ADR-0005.

| ID | New verification | PASS requirement |
|---|---|---|
| FB-01 | Firebase Spark project & provider | Free Spark selected, Email/Password enabled, no Blaze/billing |
| FB-02 | Two dummy users + UI login | Username-only UI maps uniquely, Firebase returns ID token on phone/HTMLService |
| FB-03 | Token verification from GAS | Genuine project's token accepted, tampered/foreign/expired token rejected |
| FB-04 | Verified UID→private RBAC | Unauthorized UID, wrong branch, disabled user denied server-side |
| FB-05 | Browser session | Memory-only persistence and logout/revocation test; no refresh tokens in localStorage/log |
| FB-06 | 13-user provisioning | 1 Admin/3 Registration/9 Judges, unique private passwords, no direct Sheet share |
| FB-07 | Disabled/password changed | Revoke strategy tested; no stale privileges after account deactivation |
| FB-08 | Browser anonymity | Public results work without Firebase login; public cannot write |
| FB-09 | Quotas/latency | Firebase verification and GAS workloads acceptable under realistic simulated load |

**No app/business feature implementation starts before mandatory tests PASS.** No claim that adopting Firebase by itself solves role authorization, token safety, or GAS iframe limitations.
