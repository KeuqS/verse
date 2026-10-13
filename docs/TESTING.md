# Testing and release checks

## Validation levels

1. **Static checks** — `npm ci`, `npm run typecheck`, `npm run lint` and `npm run build`.
2. **Data contract** — `npm run test:unit` checks backup round trips, collision resolution, malformed inputs, storage failure, and duplicate IDs.
3. **Build boundary** — `GITHUB_PAGES=true npm run build && GITHUB_PAGES=true npm run verify:dist` checks the Pages asset base and output presence.
4. **Privacy isolation** — each browser engine tests two independent profiles, reload persistence, explicit outbound sharing consent, denied local storage, and absence of third-party network calls during ordinary use.
5. **Backup freshness** — `scripts/backup-freshness.mjs` verifies an export reads the last committed IndexedDB snapshot even if a collection tab cannot receive BroadcastChannel updates and its React view is stale.
6. **IndexedDB transaction and migration checks** — `scripts/concurrency.mjs` exercises simultaneous writes from multiple tabs, stale edit conflicts, overlapping backup imports, non-destructive legacy localStorage migration, malformed legacy data, and blocked IndexedDB in three browser engines.
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
GITHUB_PAGES=true npm run build
GITHUB_PAGES=true npm run verify:dist
```

The browser suite uses Chromium, Firefox and WebKit in GitHub Actions with a fixed Playwright version installed in that runner. Its dependencies are isolated from the production bundle. See `.github/workflows/ci.yml` and `scripts/smoke.mjs`.

## Manual release review

Check 375px and 1440px layouts, keyboard focus order, reduced-motion preferences, clipboard denial, storage denial/quota, import rejection, a blank collection, refresh of deep routes, and external sharing on supported browsers. Confirm backups by opening the downloaded JSON file. Assess third-party share destinations and npm advisories separately. No claim of fully automated WCAG certification is made.

## Known risks

- IndexedDB readwrite transactions serialize writes from up-to-date clients, with stale-record checks for edits and deletes. Older cached clients writing legacy localStorage do not participate in the database; refresh all tabs. Clearing site data or device loss can destroy local writing, making exported backups essential.
- Text-influence examples are editorial suggestions, not model-generated analysis.
- Dependabot updates and the outstanding dependency advisory triage require separate validation.
- GitHub Pages must be enabled in repository Settings before publishing will succeed.
