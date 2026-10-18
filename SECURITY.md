# Security Policy

## Disclosure

Please **do not** post security vulnerabilities, leaked credentials, personal Gmail access lists, or any child participant records in public GitHub Issues or pull requests.

Until the repository owner configures private vulnerability reporting and designates a security contact, report sensitive findings privately through GitHub's repository **Security → Advisories** once enabled, or through a private channel agreed with the maintainer. Do not invent a public email address in issue templates.

## Protected data

Do not upload actual Google Form exports, live spreadsheets/Drive files, OAuth tokens, account allowlists, parental contacts, unpublished results, signed or unsigned minutes, or logs with personal data.

## Responsible testing

Use synthetic data only. Do not test vulnerabilities against live events, third-party accounts, or other people's information without explicit authorization.

## Security release gate

The application must not be deployed for real judging without PASS on Gmail AUTH-GATE, branch-scoped authorization, blind-judging payload privacy, concurrency and final-score auditing as specified in PRD V1.4.


## Internal-account credentials (PRD V1.5)

The initial 13 usernames are a *public specification*, not actual credentials. Do not commit initial passwords, password hashes, password reset codes, session token values, login-attempt logs, recovery material, or privileged deployment identifiers. Never propose a global starter password. Vulnerability reports about identity/session security should be sent privately, not in GitHub issues.
