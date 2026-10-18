# Tarmudi Fest 2026 — Decision Register

**Active product baseline:** [PRD V1.5](../product/PRD_TARMUDI_FEST_V1.5.md)  
**Date:** 2026-10-18  
**Status:** LOCKED product requirements; implementation subject to technical GO/NO-GO.

| Code | Decision | Status | Evidence / notes |
|---|---|---|---|
| ARCH-01 | Prefer free Google Apps Script + Sheets + Drive/Docs; no PHP/paid domain/hosting | LOCKED INTENT | Must pass quotas and AUTH-GATE |
| OWNER-01 | Personal Google account of project owner owns platform infrastructure | LOCKED | No Gmail address is published |
| AUTH-01 | Internal username/password replaces Gmail login for Admin, Registration, Judges | LOCKED | Change from PRD V1.4, see ADR-0003 |
| AUTH-02 | 13 pre-provisioned accounts: 1 Admin, 3 Registration, 9 Judges | LOCKED | No self-sign-up, role and competition scoped |
| AUTH-03 | Password unique, adaptive salted hash, forced first-use rotation and private distribution | LOCKED SECURITY NEED | Feasibility must PASS STEP 01 |
| AUTH-04 | Secure, revocable, expiring sessions; throttled failed logins; generic failures | LOCKED SECURITY NEED | Implement only if credible on chosen stack |
| AUTH-05 | Admin manages reset, activation, assignment and account deactivation | LOCKED | Server verifies authorization every action |
| REG-01 | Excel/Google Form import; five-column synthetic example; re-import prior to check-in | LOCKED | Production records stay private |
| REG-02 | Sequential unique check-in number per competition | LOCKED | Server lock/idempotency |
| JRY-01 | Blind judging by participant number only; no names/schools | LOCKED | Enforce at API response layer |
| JRY-02 | Direct integer points, 0..max for criterion, total max 100 | LOCKED | Admin dynamic, versioned |
| JRY-03 | Initial scoring max points: Mendongeng 25/25/20/15/15; Tahfidz 40/30/20/10; Mewarnai 25/25/25/25 | LOCKED DEFAULTS | Configurable in Admin prior to scoring lock |
| JRY-04 | 2–3 judges required per branch; ALL required judges finalize for interim results | LOCKED | If 2 vs official Juknis 3, formal addendum |
| JRY-05 | Tahfidz tie by priority, other branches by documented jury deliberation | LOCKED | No silent tie-break |
| PUB-01 | Interim results number-only; final results include name/school AFTER branch authorization | LOCKED | Subject to child privacy safeguards |
| DOC-01 | Admin manages minutes and official PDF | LOCKED | Publish final only |
| UI-01 | Mobile-first Neo-Brutalism for staff, judges and public | LOCKED | Accessible on phones |
| OSS-01 | `akhmadafnan/tarmudi-fest` Public, original code MIT, copyright personal | LOCKED | Third-party logos and live data excluded |
| PROCESS-01 | STEP 00–10, each with GO/NO-GO; no coding business modules before AUTH-GATE PASS | LOCKED | STEP 00 in progress |

## Historical supersession
- PRD V1.4 and the original ADR-0001 required Gmail login for staff/judges. This is **superseded only for authentication** by the explicit 2026-10-18 decision.
- PRD V1.4 remains available for transparent audit history; do **not** use its Gmail-login sections for new implementation.
- Previous scoring, access, publication, child privacy and UI decisions remain in force.
- The 13 accounts are a **specification**, not actual provisioned accounts. No passwords are in this public repository.

## Open gates
1. STEP 00 administrative handover: judge-count/addendum, publication/privacy authority, device/network fallback and operational responsibilities.
2. STEP 01 authentication feasibility on the candidate GAS stack, including vetted credential storage and revocable sessions.
3. No production deployment or actual participant records are authorized by this document.

**Seed account manifest (no secrets):** [`examples/synthetic/initial_internal_accounts_13.csv`](../../examples/synthetic/initial_internal_accounts_13.csv). The manifest represents *planned accounts*, not operational credentials.


## Engineering baseline supplement — 2026-10-18

- **ENG-01:** OOP modular monolith, separated domain/application/ports/infrastructure/GAS adapters, composition root, class dependencies via explicit constructor injection (design baseline; no app code yet).
- **ENG-02:** TypeScript strict as source candidate, reproducible GAS-compatible bundle with no native server `import/export`/unsupported class features. Exact build tools pinned after engineering environment setup.
- **ENG-03:** All callable server entrypoints deny by default and validate session/role/branch on each privileged action. Client UI and suffix `_` are not authorization boundaries.
- **ENG-04:** Pure-domain unit tests, GAS integration tests, contract tests for blind judging, concurrency tests and mobile E2E required before release.
- **ENG-05:** Password hashing, CSPRNG and session transport on GAS **NOT APPROVED YET**; STEP 01 AUTH-GATE remains mandatory and can produce NO-GO.

These are engineering controls supporting PRD V1.5, **not changes** to accepted competition rules, existing usernames or the locked product baseline. Supporting docs: [ADR-0004](../architecture/ADR-0004-oop-gas-modular-monolith.md) and [STEP 00 engineering review](../operations/STEP00_ENGINEERING_READINESS_GATE.md).


## 2026-10-18 — Authorized authentication provider amendment

- **AUTH-PROVIDER-01:** Firebase Authentication **Spark (no-cost)** selected by owner for internal login. **Approved as provider choice**, not as security/pass or created resource.
- **AUTH-PROVIDER-02:** Keep 13 username/password user experience. GAS remains business backend and private Sheet/Drive controller.
- **AUTH-PROVIDER-03:** Verify Firebase ID token server-side on every privileged GAS request, then map verified Firebase UID to private role/branch assignment. Test `accounts:lookup` endpoint with project-specific key; never trust browser-supplied role/username.
- **AUTH-PROVIDER-04:** Initial password provisioning/reset remains owner-controlled, unique, private. Firebase synthetic email alias design requires test, because no Gmail accounts should be created for the 13 staff users.
- **AUTH-PROVIDER-05:** [ADR-0005](../architecture/ADR-0005-firebase-auth-spark.md) supersedes proposed **GAS-native password hashing and sessions** in ADR-0003; all underlying security requirements remain mandatory. AUTH-GATE still NOT PASSED.
