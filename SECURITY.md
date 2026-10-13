# Security policy

## Scope

Verse is a static, client-only writing application. Its principal security risks are unauthorized access to browser-stored writing, script injection, malicious dependencies, and accidental data loss.

## Reporting

Please do **not** publish exploit details, personal poems, or secrets in a public issue. Use GitHub's private vulnerability-reporting channel if enabled under **Security → Advisories → Report a vulnerability**, or contact the repository owner privately through an established contact method. Do not assume the channel is enabled.

Include the affected commit, reproduction steps using synthetic text, browser and OS versions, and potential impact. Never send real user writing or credentials as evidence.

## Maintainer expectations

- Keep npm lockfile reviewable and classify `npm audit` findings by runtime exposure.
- Keep deployment credentials in GitHub's secret/permission system; no static site secrets are needed.
- Review pull requests changing storage access, sharing, remote scripts, or build workflows especially carefully.
- Run dependency and browser regression checks prior to publication.
- Treat successful compilation separately from security review. No security guarantee is implied by a green CI check.

The current inherited dependency audit is tracked in [issue #13](https://github.com/fraware/verse/issues/13).

## Dependency review (13 October 2026)

The initial migration reported 37 dependency advisories. Tailwind 3 and its build-tool graph retained eight development-only advisories after pruning the runtime. The Tailwind 4 evaluation reported **zero npm audit advisories in the complete dependency tree**, as documented in [the dependency inventory](docs/DEPENDENCIES.md). The whole dependency tree now has a moderate-or-higher advisory CI gate. This is a time-bounded registry result, not a claim of perfect application security.
