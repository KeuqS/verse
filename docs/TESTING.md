# Testing and release checks

## Validation levels

1. **Static checks** — `npm ci`, `npm run typecheck`, `npm run lint` and `npm run build`.
2. **Data contract** — `npm run test:unit` checks backup round trips, collision resolution, malformed inputs, storage failure, and duplicate IDs.
3. **Build boundary** — `GITHUB_PAGES=true npm run build && GITHUB_PAGES=true npm run verify:dist` checks the Pages asset base and output presence.
4. **Privacy isolation** — each browser engine tests two independent profiles, reload persistence, explicit outbound sharing consent, denied local storage, and absence of third-party network calls during ordinary use.
5. **Concurrency** — `scripts/concurrency.mjs` exercises an explicitly held Web Lock, two queued saves, multi-tab same-poem conflict and separate-copy recovery, concurrent backup import, and the unsupported-Web-Locks fail-closed path in Chromium/Firefox/WebKit.
6. **Visual style contract** — `scripts/style-regression.mjs` verifies the brand fonts, theme colors, 375px/1440px layout, writing grid, and CSS toast motion in three browser engines.
7. **Browser workflows** — the Playwright smoke script exercises the editor, collection, save/update, backup export/restore, import and suggestions in Chromium, Firefox and WebKit. Screenshots are CI artifacts.
8. **Automated accessibility** — axe-core checks WCAG 2.0/2.1 A and AA rules for the landing, writing, and collection pages at desktop and mobile widths. The results are saved as CI artifacts; this does not replace expert screen-reader or keyboard testing.
9. **Deployment** — a successful, validation-gated Pages publish job plus HTTP/browser verification at the project URL.

A passing typecheck is not a substitute for interaction testing. Browser smoke tests verify a small representative path, not exhaustive platform, mobile, or accessibility coverage.

## Local commands

```bash
npm ci
npm run typecheck
npm run lint
npm run test:unit
npm audit --audit-level=moderate
GITHUB_PAGES=true npm run build
GITHUB_PAGES=true npm run verify:dist
```

The browser suite uses Chromium, Firefox and WebKit in GitHub Actions with a fixed Playwright version installed in that runner. Its dependencies are isolated from the production bundle. See `.github/workflows/ci.yml` and `scripts/smoke.mjs`.

## Manual release review

Check 375px and 1440px layouts, keyboard focus order, reduced-motion preferences, clipboard denial, storage denial/quota, import rejection, a blank collection, refresh of deep routes, and external sharing on supported browsers. Confirm backups by opening the downloaded JSON file. Assess third-party share destinations and npm advisories separately. No claim of fully automated WCAG certification is made.

## Known risks

- Web Locks coordinate current-version tabs on the same origin. Old cached tabs or extensions writing directly to the storage key do not cooperate. The browser-local collection is still vulnerable to site-data deletion, quota exhaustion, and device loss; exported backups remain essential.
- Text-influence examples are editorial suggestions, not model-generated analysis.
- Dependabot updates and the outstanding dependency advisory triage require separate validation.
- GitHub Pages must be enabled in repository Settings before publishing will succeed.
