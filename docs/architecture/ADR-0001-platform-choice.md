# ADR-0001 — Platform and Authentication Gate

**Status:** Proposed / technical feasibility NOT yet proven  
**Product:** Tarmudi Fest V1.4

## Decision context
The product targets no paid hosting/domain and no PHP. A single Google-based ecosystem is preferred. Admin/judges/registration staff must use **personal Gmail** accounts, while the public results page is anonymously readable. Judges must not gain direct read access to participant identity data or Google Sheets.

## Candidate architecture
- HTML/CSS/JavaScript mobile-first Neo-Brutalism frontend.
- Google Apps Script as business-layer candidate.
- Google Sheets data, Google Drive private documents, Google Docs PDF templates.
- Server-verified Google account identity and server-enforced role/cabang assignments.
- Separation of admin/judge/private data views from anonymous public snapshots.

## No-go shortcuts
- Do not rely on `Session.getActiveUser().getEmail()` for arbitrary personal Gmail addresses without proof.
- Do not trust a client-supplied email, name, or role.
- Do not share source Sheets or sensitive Drive folders with judges/public.
- Do not authenticate by secret URL or shared password.

## STEP 01 must demonstrate
1. Two personal Gmail accounts from different owners authenticate on phones.
2. Identity is cryptographically verified server-side; unknown/disabled accounts rejected.
3. Scoped branch permissions work, including attempted cross-branch access.
4. Judge payload contains no participant names or school names.
5. Public pages work anonymously but cannot write or access private data.
6. Sessions expire/revoke; logout behavior is tested.
7. No direct Sheets edit/view access is required by judges.

If pure GAS fails, publish an evidence-based NO-GO and present a no-cost alternative for explicit sponsor approval. Do not silently switch architecture.

## Documentation
Product source of truth: `docs/product/PRD_TARMUDI_FEST_V1.4.md`, section I.
