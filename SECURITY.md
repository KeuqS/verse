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

## Recorded dependency review (12 October 2026)

The initial dependency tree reported 37 advisories, including 29 high, and 20 reports under `npm audit --omit=dev`. After removing unused UI modules, pruning production dependencies, and updating React Router to v7.18.4, the runner reported **8 development/build-tool advisories** (5 high and 3 moderate), and **zero advisories in production dependencies**. CI blocks moderate-or-higher production advisories; detailed limitations are recorded in [Dependency inventory](docs/DEPENDENCIES.md).

A zero npm production-audit count is not a proof of application security. Eight build-tool reports still warrant review, particularly if untrusted assets or configuration files are processed by the build runner. No active exploitation has been established from these counts alone.

## Dependency review (13 October 2026)

The original migration began with 37 advisories and fell to eight development-only findings after pruning unused packages. The evaluated Tailwind 4 toolchain yielded **zero reported npm advisories across all dependencies** as recorded in [the dependency inventory](docs/DEPENDENCIES.md). CI now blocks moderate-or-higher advisories in the complete dependency tree. An advisory-free scan does not establish security or rule out malicious updates, XSS or undiscovered vulnerabilities.
