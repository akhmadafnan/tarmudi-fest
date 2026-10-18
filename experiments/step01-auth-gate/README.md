# STEP 01 — Read-only Apps Script capability probe

**Status:** EXPERIMENT / NOT AN AUTHENTICATION SYSTEM

This isolated Apps Script experiment reports whether GAS V8 supports a class, HMAC utility and script-scoped lock, and whether Web Crypto globals exist. **It cannot establish the safety of password hashing, secure session management, brute-force protection, or a 13-account deployment.** Do not merge or install this test in a business application.

- Script owned by the user's Google account, in a **separate test-only Apps Script project**.
- The web app may be reachable anonymously solely to inspect non-sensitive capability flags.
- `doGet` is read-only. There are **no privileged write RPC entrypoints**, no Google Sheet/Drive access, and no user/password data.
- The `test-key` literal in this source is a **deliberately public non-secret HMAC demonstration constant**, not a password, token, or credential.
- The real security decision stays under [PRD V1.5](../../docs/product/PRD_TARMUDI_FEST_V1.5.md) and [ADR-0003](../../docs/architecture/ADR-0003-internal-authentication.md).
- Do not include `.clasp.json`, personal OAuth tokens, deployment IDs, or production spreadsheet identifiers in Git.

After running the probe, write actual PASS/FAIL evidence into a dedicated AUTH-GATE report. A capability flag alone is never an authentication PASS.
