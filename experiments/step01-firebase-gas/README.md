# Firebase Spark ↔ Google Apps Script AUTH-GATE Proof-of-Concept

**Status:** UNPROVEN / NON-PRODUCTION / TEST-ONLY. No 13 accounts are provisioned by this source.

The user approved Firebase Authentication Spark to replace native GAS password hashing. This proof-of-concept tests direct Firebase REST sign-in from a GAS HTMLService iframe and server-side validation of the Firebase ID token using Google Identity Toolkit `accounts:lookup`. It then maps Firebase UID to a **private** allowlist.

## Deployment and configuration

Use a SEPARATE test-only GAS project. Do not overwrite the preexisting immutable capability-probe deployment. Edit Script Properties in the test project's Apps Script editor or via a secured one-time owner-only operation:

- `TF26_FIREBASE_API_KEY`: Firebase Web API key (public client identifier, but project-specific).
- `TF26_FIREBASE_PROJECT_ID`: exact expected Firebase project ID.
- `TF26_INTERNAL_LOGIN_DOMAIN`: internal alias domain, for example `accounts.tarmudi-fest.example` if accepted by Firebase Auth.
- `TF26_AUTH_ALLOWLIST_JSON`: **private** JSON mapping Firebase UID to `{ "role":"juri"|"registrasi"|"admin", "competition":"MDG"|"THF"|"MWN"|"ALL", "active":true }`. Never commit actual UIDs/rosters or passwords.

Enable Email/Password sign-in in the Firebase project; provision user emails/passwords only via trusted owner-approved actions, without forcing 13 Gmail accounts.

## Required negative tests

- Missing configuration, no token, bad token, modified token, expired token, other-project token → no access.
- Legitimate Firebase user without UID whitelist → no access.
- Disabled Firebase/locally-disabled user, roles from browser, cross-branch call → rejected server-side.
- Success response only shows role and competition, never token/UID, real child participant data or Sheet ID.
- Mobile browsers, Google HTMLService iframe, Chrome/Safari, HTTPS; verify network and Firebase/Spark quotas.
- Logout destroys JS-memory token; refresh/revocation strategy must be developed and verified for production.

**Important:** `accounts:lookup` is currently an architectural candidate; acceptance requires real cross-project/invalid-token tests and project-bound verification. This code is NOT a PASS or a deployed business application.

## Security notes

- Password goes to Firebase via HTTPS directly from browser, never to GAS.
- Only short-lived Firebase ID token is held in page JavaScript memory; never in localStorage/sessionStorage. XSS could still steal a token; output encoding and iframe/browser tests remain mandatory.
- Web API keys are public Firebase client configuration; they are not authorization credentials.
- The GAS backend verifies `accounts:lookup` response first and then checks issuer/project/time claims and its private UID allowlist; it does **not** trust unsigned decoded claims alone.
- Configuration in Script Properties is not a full secrets vault, and this POC is not yet a complete rate-limit, session lifecycle, or production hardening design.

## Official sources

- https://firebase.google.com/docs/reference/rest/auth
- https://firebase.google.com/docs/auth/admin/verify-id-tokens
- https://developers.google.com/apps-script/guides/html/communication
