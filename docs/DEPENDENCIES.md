# Dependency audit and review

## 13 October 2026 — Tailwind 4 evaluation

The initial imported repository contained 37 npm advisories (29 high), including 20 affecting production dependencies. The reviewed migration cleanup reduced this to eight development/build-tool advisories (5 high, 3 moderate), with zero known production-dependency findings.

The dedicated [Tailwind 4 toolchain evaluation workflow](https://github.com/fraware/verse/actions/runs/38351632571) regenerated the lockfile from package manifests with Node.js 22, successfully ran `npm ci`, typecheck, lint, unit tests, the GitHub Pages production build and build verification. Its **full** `npm audit --json` report found zero low, moderate, high, or critical advisories in the evaluated dependency tree. This is a time-bounded registry report, not proof against unknown vulnerabilities.

## Migration changes

- Move from Tailwind 3 to Tailwind 4 with `@tailwindcss/vite`; load the legacy design theme explicitly with `@config`.
- Remove `tailwindcss-animate`, `autoprefixer`, and the now-unused PostCSS configuration. Preserve toast entry/exit behavior in minimal first-party CSS respecting reduced-motion preferences.
- Preserve locally hosted Crimson Text and IBM Plex Mono fonts, source colors, responsive typography, and the browser-local storage model.
- Add a cross-engine style contract to CI in addition to the existing functional, privacy, concurrency, and accessibility regressions.
- Make the **full dependency tree** subject to `npm audit --audit-level=moderate` in the publication gate.

## Remaining cautions

A change of CSS compiler is not inherently layout-neutral. Before adopting the migration, confirm visual parity by reviewing desktop and mobile screenshots and checking computed styles, keyboard focus, Radix controls, and animations. Upgrading to Tailwind 4 changes browser minimums (official support starts at Safari 16.4, Chrome 111 and Firefox 128). <https://tailwindcss.com/docs/upgrade-guide>

The public site remains a static build; development dependencies are not served to visitors. Keep reviewing dependency updates, build input trust, and generated assets separately. An empty npm audit advisory report establishes neither that the app has no bugs nor that every connected browser is secure.
