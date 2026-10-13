# Dependency audit and review

The baseline is the 12 October 2026 GitHub Actions npm audit of the committed lockfile. The first migration reported 37 total affected packages (29 high), including 20 under `npm audit --omit=dev`. The cleaned branch reports 8 (5 high, 3 moderate), with zero production dependency findings. Advisory reports concern package versions and are not equivalent to demonstrated exploitability of the static website.

## What changed

The reachable-import review retained eleven direct browser-runtime packages and removed 44 unused files. Build-only `tailwindcss-animate` was moved to development dependencies, Vite was updated within its supported major line, and React Router moved to a patched v7 release. The lockfile was regenerated with npm on GitHub Actions; changes were verified with `npm ci`, static checks, smoke tests and the production audit.

## Residual findings

The remaining reported development/build dependency names are `braces`, `chokidar`, `fast-glob`, `micromatch`, `postcss-nested`, `postcss-selector-parser`, `tailwindcss` (v3) and `tailwindcss-animate`. Several names are affected through transitive dependency relationships, not necessarily independently actionable security flaws. Potential consequences include excessive CPU/memory usage on pathological inputs processed during development or building, rather than direct runtime execution by site visitors.

The Tailwind CSS 3 to 4 migration changes plugin behavior and styling configuration, so it must be reviewed independently with full visual regression tests. Do not run forced dependency upgrades merely to obtain a green aggregate report. Restrict build inputs, review dependency updates, and track upstream fixes.

## Enforcement

`npm audit --omit=dev --audit-level=moderate` is a CI release gate. `npm ci` uses the committed lockfile. Read detailed audit advisories in GitHub Actions, and continue to track the remaining build-tool risks in [issue #13](https://github.com/fraware/verse/issues/13). A zero reported production dependency count is not a substitute for security testing or review of malicious dependencies.
