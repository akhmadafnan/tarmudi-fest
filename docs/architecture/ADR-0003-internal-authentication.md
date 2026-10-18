# ADR-0003 — Internal Username/Password Authentication and Account Provisioning

**Status:** ACCEPTED PRODUCT DECISION / TECHNICAL FEASIBILITY UNPROVEN  
**Date:** 2026-10-18  
**Applies to:** PRD V1.5; supersedes *only authentication identity* in ADR-0001.

## Context and decision
The owner requests zero manual Gmail allowlisting for staff/judges. The system must provision **13 internal username/password accounts** and map each to a role and competition. The owner's personal Google account remains owner of Apps Script, Sheets, Drive and deployment; staff and judges do not need access to those Google resources.

## Initial accounts (provisioning specification, not yet created)

| Username | Role | Scope | Initial state |
|---|---|---|---|
| `admin` | Admin | All competitions | enabled after secure owner-only bootstrap |
| `reg-mdg` | Registration | Mendongeng | enabled after secure provisioning |
| `reg-thf` | Registration | Tahfidz | enabled after secure provisioning |
| `reg-mwn` | Registration | Mewarnai | enabled after secure provisioning |
| `juri-mdg-01` .. `juri-mdg-03` | Judge | Mendongeng | based on assigned judge count |
| `juri-thf-01` .. `juri-thf-03` | Judge | Tahfidz | based on assigned judge count |
| `juri-mwn-01` .. `juri-mwn-03` | Judge | Mewarnai | based on assigned judge count |

Total: 1 + 3 + 9 = **13** initial accounts. All usernames are identifiers, **not passwords**. Judge accounts beyond the frozen required count must be disabled/unassigned before judging.

## Nonnegotiable controls
1. Unique initial high-entropy passwords, generated securely and delivered privately; forced rotation at first login; never include credentials in GitHub, issue text, templates, test snapshots or logs.
2. Password verification server-side using a vetted adaptive salted hash. Prefer Argon2id where proven compatible; PBKDF2-HMAC-SHA-256 may be evaluated if sufficiently hardened and efficient in the deployment environment. Single SHA-256/base64/obfuscation are forbidden.
3. Cryptographically unpredictable session credentials; enforced expiration, revocation, logout and reset invalidation. Evaluate browser cookie/iframe constraints and CSRF/XSS surface; GAS does **not** automatically guarantee application-controlled secure HttpOnly cookies.
4. Rate-limit failed login attempts, generic errors for invalid username/password, private monitoring and audit (no raw secrets).
5. Each privileged server operation checks current account state, role and competition scope. Public endpoint is read-only and only exposes phase-appropriate published snapshots.
6. Judges have no participant names/schools, cross-judge results, or direct Sheets/Drive permissions. No password checking only in client-side JS.
7. Bootstrap/recovery must not rely on a universal public password, owner Gmail being shared, or bypass endpoints that remain enabled.

## STEP 01 AUTH-GATE
Prove the implementation with 13 synthetic test accounts, phones, invalid credentials, deactivated accounts, brute-force controls, token/session replay, reset, role boundaries, blind judging payloads, Sheets access isolation and anonymous public access. Do not start business module development until this is PASS.

## No-go and alternative
Apps Script provides server-side execution but is not a purpose-built password identity provider; its crypto/session and HTML Service/browser constraints must be evaluated. If strong identity and session security cannot be demonstrated without paid components, produce a documented NO-GO and request approval for a no-cost alternative. Do not silently enable an insecure custom login.

## Implications
The 2026-10-18 change removes the requirement that staff/judges use their personal Gmail accounts. It does **not** remove the personal Google account as owner/deployer of the Google infrastructure. Product v1.4 remains archived as history; v1.5 is active.

No application code, real credentials, accounts, deployments or production data exist as a result of this ADR.
