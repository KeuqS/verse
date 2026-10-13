# Testing and release checks

## Validation levels

1. **Static checks** — `npm ci`, `npm run typecheck`, `npm run lint` and `npm run build`.
2. **Data contract** — `npm run test:unit` checks backup round trips, collision resolution, malformed inputs, storage failure, and duplicate IDs.
3. **Build boundary** — `GITHUB_PAGES=true npm run build && GITHUB_PAGES=true npm run verify:dist` checks the Pages asset base and output presence.
4. **Browser workflows** — the Playwright smoke script starts a local build and exercises the editor, collection, save/update, backup export/restore, and explicit suggestion application; screenshots are CI artifacts.
5. **Deployment** — a completed GitHub Pages publish job plus HTTP/browser verification at the project URL.

A passing typecheck is not a substitute for interaction testing. Browser smoke tests verify a small representative path, not exhaustive platform, mobile, or accessibility coverage.

## Local commands

```bash
npm ci
npm run typecheck
npm run lint
npm run test:unit
GITHUB_PAGES=true npm run build
GITHUB_PAGES=true npm run verify:dist
```

The browser suite uses Chromium in GitHub Actions with a fixed Playwright version installed in that runner. Its dependencies are isolated from the production bundle. See `.github/workflows/ci.yml` and `scripts/smoke.mjs`.

## Manual release review

Check 375px and 1440px layouts, keyboard focus order, reduced-motion preferences, clipboard denial, storage denial/quota, import rejection, a blank collection, refresh of deep routes, and external sharing on supported browsers. Confirm backups by opening the downloaded JSON file. Assess third-party share destinations and npm advisories separately. No claim of fully automated WCAG certification is made.

## Known risks

- Concurrent writes across browser tabs can still race because `localStorage` lacks transactions.
- Text-influence examples are editorial suggestions, not model-generated analysis.
- Dependabot updates and the outstanding dependency advisory triage require separate validation.
- GitHub Pages must be enabled in repository Settings before publishing will succeed.
