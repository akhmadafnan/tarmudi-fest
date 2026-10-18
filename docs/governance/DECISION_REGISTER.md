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
