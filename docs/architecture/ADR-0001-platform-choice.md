# ADR-0001 — Platform Choice (Authentication Section Superseded)

**Status:** PLATFORM PROPOSAL STILL ACTIVE; ORIGINAL GOOGLE LOGIN CHOICE SUPERSEDED by [ADR-0003](ADR-0003-internal-authentication.md) on 2026-10-18.  
**Product:** Tarmudi Fest PRD V1.5 (V1.4 archived)

## Architecture context
Free/no-PHP hosting remains preferred. Candidate stack remains frontend HTML/CSS/JavaScript mobile-first Neo-Brutalism; Google Apps Script backend; Google Sheets private storage; Google Drive and Google Docs for minutes/PDF.

The original ADR-0001 proposed personal Gmail sign-in for staff/judges. **Do not implement that superseded proposal.** The approved internal login is **13 pre-provisioned username/password accounts** with server-side per-branch privileges (see ADR-0003). The project owner's personal Google account is only the GAS/Sheets/Drive owner. Public results remain anonymous and read-only until official publication.

## Persistent no-go shortcuts
- No client-side-only password validation or trusted role parameters.
- No shared/default hard-coded passwords, raw passwords or tokens in GitHub.
- No sharing private source Sheets or Drive folders with staff/judges/public.
- No secret-URL login, unaudited crypto, non-revocable sessions or implicit session safety claims.

## Technical decision gate
STEP 01 must **prove** password hashing, secure provisioning, session lifecycle, brute-force protection and access isolation in the candidate platform. GAS may fail this gate; record evidence and obtain owner approval for an alternative before implementing business modules.

## Governing sources
- [Active PRD V1.5](../product/PRD_TARMUDI_FEST_V1.5.md)
- [ADR-0003](ADR-0003-internal-authentication.md)
- [STEP 01 test plan](../operations/STEP01_AUTH_GATE_PLAN.md)
