# Tarmudi Fest — Competition Management Platform

> **Status: STEP 00 / documentation-only. No application source code or production deployment yet.**

A proposed open-source, mobile-first competition platform inspired by the operating requirements of Tarmudi Fest 2026. The intended platform covers participant check-in, unique start numbers, Google-account-based access, blind judging by participant number, configurable direct-point scoring, provisional leaderboards, official result approval, and event minutes/PDF publication.

## Scope and product baseline

- Three event branches in the original baseline: **Tahfidz**, **Mendongeng**, **Mewarnai**.
- Registration data from Google Forms/Excel; event-day check-in allocates sequential start numbers per branch.
- Judges never receive participant names or school affiliations while judging.
- Judges score **integer points from 0 to each criterion maximum**; the total maximum is 100 per judge, then the system averages required judges' totals.
- Public interim results use **participant numbers only**. Names/schools are published only after branch approval and appropriate privacy checks.
- Intended primary stack: **Google Apps Script + Sheets + Drive/Docs**, pending **STEP 01 AUTH-GATE** proving safe Google sign-in for personal Gmail accounts and private data access.
- Visual direction: **mobile-first Neo-Brutalism**.

The authoritative Indonesian product specification is in [`docs/product/PRD_TARMUDI_FEST_V1.4.md`](docs/product/PRD_TARMUDI_FEST_V1.4.md). The detailed STEP 00 readiness register is in [`docs/operations/STEP00_READINESS_AUDIT.md`](docs/operations/STEP00_READINESS_AUDIT.md).

## Repository status

This template intentionally contains documentation and GitHub collaboration scaffolding only. **Do not treat it as a working or secure implementation.** There is no authentication flow, app module, deployment, user data, or connection to Google in this repository.

## Open-source and privacy policy

The repository adopts the **MIT License** for original software and associated documentation authored for this project. Copyright © 2026 **Akhmad Afnan Fajarudin**. See [`LICENSE`](LICENSE).

Do **not** commit real participant records, minors' personal data, email allowlists, Google Forms response exports, private Sheets/Drive IDs, OAuth credentials, tokens, secrets, or unsigned minutes. See [`SECURITY.md`](SECURITY.md) and [`docs/governance/PUBLIC_PRIVATE_BOUNDARY.md`](docs/governance/PUBLIC_PRIVATE_BOUNDARY.md).

Third-party festival logos, school marks, and third-party copyrighted materials are **not included** in this repository or licensed for redistribution by its MIT license. See [`docs/governance/PUBLIC_PRIVATE_BOUNDARY.md`](docs/governance/PUBLIC_PRIVATE_BOUNDARY.md).

## Contributing

Contributions are welcome under the repository MIT License. Please read [`CONTRIBUTING.md`](CONTRIBUTING.md). For security issues, **do not file a public issue**; read [`SECURITY.md`](SECURITY.md).

## Roadmap

`STEP 00` audit and repository preparation → `STEP 01` Gmail AUTH-GATE proof of concept → `STEP 02` data structure → `STEP 03` check-in → `STEP 04` Admin scoring configuration → `STEP 05` mobile blind judging → `STEP 06` results/public interim leaderboard → `STEP 07` approval/identity publication → `STEP 08` official minutes/PDF → `STEP 09` UAT → `STEP 10` production release and archive.

No later STEP may be marked PASS unless the earlier gate has passed. See the locked PRD for acceptance tests.
