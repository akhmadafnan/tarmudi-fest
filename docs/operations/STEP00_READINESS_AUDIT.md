# STEP 00 — Readiness Audit & Source Handover

**Document:** TF26-STEP00-001  
**Status:** `IN_PROGRESS / CONDITIONAL_NO_GO`  
**Date:** 2026-10-18  
**Product baseline:** PRD V1.5 LOCKED (authentication supersedes V1.4; V1.4 archived)  
**Scope:** preparation, source inventory, open-source repository governance, missing inputs, and STEP 01 entry requirements. **No app code, deployment, or production-data changes.**

## 1. Facts verified

| ID | Fact or source | Status | Notes |
|---|---|---|---|
| SRC-01 | Tarmudi Fest 2026 PRD V1.5 (18 Oct 2026) | APPROVED FOR DOCUMENTATION | Active baseline; V1.4 archived unchanged in `docs/product/`. |
| SRC-02 | Original Juknis Tarmudi Fest 2026 (7-page PDF) | REVIEWED (PRIVATE SOURCE) | Event date 24 Oct; 3 branches; public repository should NOT include unreviewed original PDF. Includes organizer contact details. |
| SRC-03 | Google Form registrations are pre-existing | CONFIRMED AS REQUIREMENT | Actual export / column headers not yet provided. |
| SRC-04 | Internal username/password, 13 seed users | LOCKED REQUIREMENT | Technical password/session implementation NOT yet validated. AUTH-GATE STEP 01; see ADR-0003. |
| SRC-05 | Repo account | VERIFIED | GitHub connector identified `akhmadafnan`. |
| SRC-06 | Repo name / owner / public / license | CREATED AND VERIFIED | `akhmadafnan/tarmudi-fest`, Public; MIT approved, personal copyright. Repository Public telah dibuat dan diverifikasi. |

## 2. Locked rules for implementation

- Three separate branch assignments and sequential unique start numbers at check-in.
- 13 internal pre-provisioned username/password accounts (1 Admin, 3 Registration, 9 Judges); no public self-registration; passwords individually generated and privately delivered only after proven-secure provisioning.
- Blind judging: judge API must not return participant name or school.
- Dynamic Admin scoring scheme versioning; **integer direct points 0..max**, sum of maxima **100**.
- Scheme defaults: Mendongeng 25/25/20/15/15, Tahfidz 40/30/20/10, Mewarnai 25/25/25/25.
- All required judges finalize before an interim leaderboard entry appears. Final score is mean of judges' sums.
- Interim public results by number only; names/schools only after branch approval and appropriate privacy check.
- Tahfidz tie by Juknis criterion order; others by documented judges' deliberation.
- Mobile-first Neo-Brutalism; responsive usable on phone.

## 3. Missing inputs / confirmations

| Code | Missing item | Why needed | Priority | Status |
|---|---|---|---|---|
| IN-01 | Synthetic import template approved as working baseline (30 fictional participants; 10 per branch) | fixed headers, IDs, replacements, deduplication; production data supplied only after app stabilizes | STEP 02 input contract satisfied with synthetic fixture; real mapping deferred | CLOSED (SYNTHETIC BASELINE) |
| IN-02 | Initial user roles/branch assignments fixed as 13 usernames; actual personnel handover and secure provisioning pending | server-side role/cabang authorization | Design CLOSED; secure account issuance pending STEP 01 | PARTIAL (13-ACCOUNT SPECIFICATION) |
| IN-03 | Personal Google account of project owner will own GAS deployment, Sheet, Drive | ownership and permissions | BLOCKER for STEP 01 | DECIDED; actual Google resources not yet provisioned |
| IN-04 | Decision: repository ownership/slug, code copyright holder, MIT license approval | public open-source creation | DECIDED | CLOSED (personal, MIT, slug agreed); initial GitHub repo creation VERIFIED |
| IN-05 | Actual judges per branch (2 or 3), policy addendum if Juknis conflicts | valid results, approvals | BLOCKER before judging | OPEN |
| IN-06 | Event logo, trademark permission, branding assets | design and legally reusable sample assets | IMPORTANT | OPEN |
| IN-07 | Expected internet conditions/peak public visitors/available operator devices | sizing, load test, contingency | IMPORTANT before STEP 09 | OPEN |
| IN-08 | Parent/guardian notice/permission approach for child name + school publication | privacy clearance | BLOCKER before identity publication | OPEN |
| IN-09 | Signatories and approval process for official minutes | PDF workflow and official release | IMPORTANT before STEP 08 | OPEN |
| IN-10 | Data controller/contact and data retention/deletion policy | security and open-source boundary | IMPORTANT | OPEN |
| IN-11 | Juknis amendment approval: score max weights, two-judge exception if applicable | governance integrity | BLOCKER before real judging | OPEN |

## 4. Risks and immediate safeguards

| Risk | Level | Safe STEP 00 action |
|---|---|---|
| Risk GAS may fail secure password hashing, session management or login throttling within quota/browser constraints | CRITICAL | STEP 01 AUTH-GATE is mandatory; reject insecure custom auth shortcuts if feasibility fails. |
| GitHub public repository leaks minors' data, production hashes, initial passwords or session tokens | CRITICAL | Publish docs/code and synthetic fixtures only; keep credentials and operations outside repo. |
| Third-party assets mistakenly represented as MIT-licensed | HIGH | MIT approval recorded, `LICENSE` included; exclude original logo/Juknis and external proprietary assets. |
| Event-brand intellectual-property rights confused with MIT code license | MEDIUM | Trademark/logo excluded unless separately authorized. |
| Juknis says 3 judges but app permits 2 | HIGH | Written organizer approval/addendum if running with 2. |
| Only six days until event date | HIGH | Prioritize integrity gates and fallback operations; no unjustified go-live promises. |

## 5. GitHub repository governance proposal

- Repository: `akhmadafnan/tarmudi-fest` (**created, Public**).
- Visibility: Public, default branch `main`; working branch `develop` after documentation baseline commit.
- PR-based contributions: feature branches → PR into `develop` → tested release into `main`.
- CODEOWNERS/branch protection to be enabled after GitHub repo settings are available.
- Issue templates: bug report, feature request; `SECURITY.md` for private disclosures.
- Code license: **MIT approved**, copyright **Akhmad Afnan Fajarudin** (personal; public GitHub profile confirms full name). Root `LICENSE` included. Trademark and private event data excluded.
- Public data: documentation and synthetic fixtures only. No live backups, authentic participant info, emails or private PDF files.

## 6. Exit gate — STEP 00

**PASS conditions:**

1. Locked PRD reviewed and available.
2. Sources inventoried; safe synthetic participant-import fixture and documented five-column import contract accepted for development. The event owner will later supply real participant data **privately** once the app is stable; no actual child data pushed to public GitHub.
3. Owner/deployer personal Google account identified; 13 internal test username/role/cabang contract defined, and STEP 01 secure-provisioning protocol agreed (actual passwords not created).
4. Repo slug, owner and license/copyright decided; public repo initialized with correct documentation and secret exclusions.
5. Open issues, risks and sponsor's decision-maker recorded; responsibilities for Juknis amendments and data privacy assigned.

**Current decision:** `CONDITIONAL_NO_GO`. MIT license and public-repository governance have been approved; starter package is prepared, but the repository and the personal Google deployment owner have been decided; other required STEP 00 operational inputs remain open. **Do not start STEP 01 until gate conditions are met**, except planning the revised internal-account AUTH-GATE protocol.

**2026-10-18 update:** Connected GitHub app verified account `akhmadafnan`; sebelum repository dibuat, target sempat menghasilkan NOT_FOUND; kini repository terverifikasi Public. Laptop GitHub CLI version 2.102.0 installed but `gh auth status` returned not logged in. Repository dibuat pengguna melalui GitHub UI; initial README sudah berhasil di-commit. Dokumen lainnya diunggah pada pembaruan berikutnya. No source code or deployment created.

## 7. Repository creation verified (2026-10-18)

- Public GitHub URL: https://github.com/akhmadafnan/tarmudi-fest
- Connected repository administrator permissions: confirmed.
- Initial README commit: `1e512e61b1b8c77de3bb229f1c21d3f5610bd0f5`.
- MIT license / personal copyright approved by project owner.
- **STEP 00 remains IN_PROGRESS** because test account arrangements and operational privacy/Juknis responsibilities remain open. A 30-row synthetic participant template is now the approved baseline import schema. Google deployment ownership is now assigned to the product owner's personal Google account; resources have not been created or verified.
- This is not evidence that the app is deployed, or that internal-account password/session authentication has been validated.


### Documentation repository publication verified

- Main documentation commit: `9b4ac243b416231a8f041b75342031e2f990c805`
- GitHub repository is **Public** and administrator write access was verified.
- 19 files exist; essential README, LICENSE, locked PRD, SECURITY and CONTRIBUTING are present.
- Working branch `develop` was created at the same documentation commit.
- Targeted checks found no real participant phone numbers, Gmail addresses or credential patterns in critical public files.
- Repository bootstrap: **PASS**. Overall STEP 00: **IN_PROGRESS / CONDITIONAL_NO_GO** pending authorization test accounts and other operational handover decisions. Google deployment ownership and the synthetic Excel-import schema have been decided.

## 8. Google deployment ownership decision (2026-10-18)

- **DECIDED:** Use the project owner's personal Google account as owner of Apps Script, Google Sheets and Google Drive production resources.
- This is **ownership of future resources only**, not evidence that any resource exists, was connected, shared or deployed.
- Keep exact Gmail address, IDs of Sheets/Script/Drive, tokens, OAuth client secrets and access-control lists outside this public repository.
- The application will use **internal username/password accounts** for Admin, Registration and Judges (ADR-0003); Google personal account ownership of the GAS/Sheets/Drive infrastructure is **unchanged**. Server-enforced branch scopes and separate anonymous public read surface remain mandatory, subject to STEP 01 AUTH-GATE verification.
- **Continuity risk:** production resources depend on one personal account. Before go-live, configure secure account recovery and private backup/export plus an emergency operations handover plan, without granting uncontrolled access to participant identities.
- **IN-03 disposition:** OWNER_DECIDED; provisioning/permissions validation deferred to STEP 01. STEP 00 overall **IN_PROGRESS / CONDITIONAL_NO_GO** until remaining gate inputs are addressed.

## 9. Synthetic sample accepted instead of production Excel (2026-10-18)

- The owner explicitly chose to defer real Google Form/Excel participant data until after the application is stable.
- Template created: **30 fully fictitious entries**, 10 each for Mendongeng, Tahfidz and Mewarnai, each with a unique registration ID and a fictional school; Mendongeng/Tahfidz delegations remain at most two per simulated school.
- Contract and public synthetic CSV: [`ADR-0002-participant-import-contract.md`](../architecture/ADR-0002-participant-import-contract.md) and [`examples/synthetic/participants_tarmudi_fest_30.csv`](../../examples/synthetic/participants_tarmudi_fest_30.csv).
- Future Admin flow: upload → preview → validate → confirm. Before any check-in or scores, allow audited whole-dataset replacement. **After check-in or scoring begins, destructive replacement must be blocked**, preserving start numbers and judge submissions.
- No private production data is required for the current design phase. **IN-01 is CLOSED using synthetic baseline**; mapping of actual Google Form headers can be done during later private pilot onboarding, and must not require a code edit if Admin's template is followed.
- The STEP 00 technical gate remains open on secure internal-account provisioning test arrangements, authorization responsibility and other operational concerns. No application code or deployment yet.

## 10. Internal authentication change request and documentation freeze (2026-10-18)

- **Approved:** Replace Google/Gmail sign-in for internal users with **username/password** managed by application.
- **Seed usernames:** `admin`; `reg-mdg`, `reg-thf`, `reg-mwn`; `juri-mdg-01..03`, `juri-thf-01..03`, `juri-mwn-01..03` = **13** account specifications. They have not been created.
- **Owner infrastructure unchanged:** Google personal account of project owner owns Apps Script/Sheets/Drive.
- **No insecure defaults:** per-user cryptographically secure temporary passwords, private delivery, forced first-use rotation, adaptive salted hashes, revocable sessions, server authorization, throttled authentication attempts. Feasibility in GAS to be demonstrated; if it cannot be secured, stop and seek approval for an alternative.
- **Docs:** active `PRD_TARMUDI_FEST_V1.5.md`, `DECISION_REGISTER.md`, `ADR-0003-internal-authentication.md`, rewritten `STEP01_AUTH_GATE_PLAN.md`. V1.4 remains archive unchanged.
- **Gate result:** repository documentation UPDATED, but overall STEP 00 remains **IN_PROGRESS / CONDITIONAL_NO_GO**; operational privacy/approvers, Juknis judge count, mobile/fallback details and account-bootstrap feasibility still pending. No business module code or deployment authorized.

### 13-account synthetic provisioning blueprint

- An explicit **username/role/competition CSV** has been prepared at `examples/synthetic/initial_internal_accounts_13.csv`.
- It contains only approved account *identifiers* and planned scopes; it includes **no password/hash/token/email** and does not provision real accounts.
- Use it for tests in STEP 01 only after secure implementation is approved; activate the required 2–3 judges per competition before judging begins.


## 11. GAS/OOP engineering readiness review (2026-10-18)

- ADR-0004 adopted as OOP modular-monolith **design**: domain/application/ports/GAS adapters, typed source with GAS-compatible bundling, minimal entrypoints, no server-only Node/browser APIs, per-request authorization, validated DTOs, locked write operations, unit/contract/mobile testing.
- Official GAS V8 guide supports classes but not native ES modules, private class fields, or Node/browser crypto; `google.script.run` is asynchronous and all exposed functions require server authorization.
- Password/KDF, session-token randomness and secure cookie handling in GAS are **UNPROVEN**, not an assumed security PASS. Security risks captured in `docs/security/AUTH_THREAT_MODEL_V1.md`.
- STEP 00 status remains `IN_PROGRESS / CONDITIONAL_NO_GO`; signed operational responsibilities and non-production test account/deployment approval remain to be resolved.
- References: `docs/operations/STEP00_ENGINEERING_READINESS_GATE.md`, `docs/architecture/GAS_MODULE_CONTRACTS_V1.md`.
