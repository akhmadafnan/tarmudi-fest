# Public repository versus private event operations

**Public GitHub may contain:** open-source application code once created; architectural documentation; public-facing design tokens where rights are cleared; synthetic test records; issue and PR templates; redacted/approved examples.

**Must stay out of GitHub:** participant names, minors' school affiliations, source Google Form/Excel responses, parent contact details, letters proving enrollment, private school IDs or Drive files, internal account credentials or password hashes, session tokens, reset codes, administrator/judge identity rosters, OAuth/client credentials, Google script IDs bound to private deployments, access tokens, backup exports, unpublished minutes, and production logs.

**Original Juknis PDF:** do not publish the original attachment by default because it contains direct contact information and may include copyrighted event assets. Request organizer approval and produce a properly redacted copy if required.

**Branding:** names, official logo, emblems, mascots, illustrations, and school marks are not automatically granted under the code license. Prefer replaceable placeholders for other forks.

**Child data:** public application may publish name and school ONLY once the branch is officially approved and the organizer has confirmed the appropriate notice/permission for parents or guardians. A source-code repository should never contain real child data.

**Security:** use non-production dummy examples; review `git status` and `git diff` before push. Secrets must be removed from Git history as well as the working tree if mistakenly committed. Report security issues privately following `SECURITY.md`.

## Licensing boundary (2026-10-18)
The owner selected MIT for original repository source code and original documentation, with copyright held personally. MIT is **not** permission to reproduce third-party material the owner does not own. Do not commit original festival logo, school crest, original Juknis PDF, or third-party imagery without clear permission and a separately documented license. Do not commit any operational spreadsheet containing real minors' names or school identities.
