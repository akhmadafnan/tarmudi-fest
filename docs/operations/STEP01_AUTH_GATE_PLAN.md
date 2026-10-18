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
