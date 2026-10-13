# Dependency audit and review

## Tailwind CSS 4 migration — 13 October 2026

The original imported lockfile contained 37 npm advisory findings (29 high), including 20 production dependency findings. Removing unused dependencies and upgrading the runtime reduced that inventory to eight development/build-tool findings (five high, three moderate), with zero production findings.

The isolated Tailwind CSS 4 [evaluation workflow](https://github.com/fraware/verse/actions/runs/38351632571) regenerated the lockfile using Node.js 22, and passed `npm ci`, TypeScript checks, lint, unit tests, static-site build verification, and a **full `npm audit --json` scan reporting zero advisories of any severity**. The present pull request reruns the complete audit against its exact committed dependency tree and treats moderate-or-higher findings in **all packages** as a release blocker.

## Toolchain changes

Tailwind CSS 4 uses the official `@tailwindcss/vite` plugin and the existing theme configuration explicitly imported from CSS. The obsolete Tailwind 3 `tailwindcss-animate`, separate PostCSS configuration and autoprefixer build dependencies are removed. Simple first-party toast animations preserve the intent of the previous plugin and respect reduced-motion preferences.

The release tests check functional browser workflows, storage/migration integrity, application privacy, WCAG A/AA rules, and theme-related computed styles at desktop/mobile viewport widths in Chromium, Firefox and WebKit. An npm audit with no findings does not prove the program secure against undiscovered vulnerabilities or malicious dependencies. Upstream Tailwind 4 has a newer minimum-browser support floor (Chrome 111, Firefox 128, Safari 16.4); older browsers need separate compatibility consideration. Review a representative release's screenshots in addition to automated tests.

## Enforcement

`npm ci` uses the committed npm lockfile; `npm audit --audit-level=moderate` blocks release if new advisory findings appear. The related history and follow-up evidence are in [issue #13](https://github.com/fraware/verse/issues/13).
