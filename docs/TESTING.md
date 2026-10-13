# Testing and release checks

## Validation levels

1. **Static checks** — `npm ci`, `npm run typecheck`, `npm run lint` and `npm run build`.
2. **Data, literary and editing contracts** — `npm run test:unit` checks backup round trips, collision resolution, malformed inputs, storage failure, duplicate IDs, all twelve poet registries, exact Unicode phrase boundaries, snapshot-checked craft operations, and counterbalanced pilot assignments and export validation.
3. **Build boundary** — `GITHUB_PAGES=true npm run build && GITHUB_PAGES=true npm run verify:dist` checks the Pages asset base and output presence.
4. **Privacy isolation** — each browser engine tests two independent profiles, reload persistence, explicit outbound sharing consent, denied local storage, and absence of third-party network calls during ordinary use.
5. **IndexedDB transaction and migration checks** — `scripts/concurrency.mjs` exercises simultaneous writes from multiple tabs, stale edit conflicts, overlapping backup imports, non-destructive legacy localStorage migration, malformed legacy data, and blocked IndexedDB in three browser engines.
6. **Backup freshness** — `scripts/backup-freshness.mjs` verifies that an export queries committed IndexedDB data even if a tab's in-memory collection is stale.
7. **Visual regression contract** — `scripts/style-regression.mjs` verifies typography, 375px and 1440px responsive styling, writing-grid rendering and toast animations in three browser engines.
8. **Browser workflows, literary examples and draft safety** — the Playwright smoke script exercises the editor, collection, save/update, backup export/restore, import and suggestions in Chromium, Firefox and WebKit. The editor-safety script also checks browser Back, in-app navigation, title-only unsaved drafts, confirmed text imports, and edits made while a save completion is pending. The literary-catalogue script checks all twelve choices, general examples and guarded substitutions. The craft-experiments script exercises native selection, exact preview, guarded apply/undo, stale-source invalidation and explicit saving in three engines. The optional pilot script verifies three condition tasks, a poem-free local download, memory-only responses and no external requests. Screenshots are CI artifacts.
9. **Automated accessibility** — axe-core checks WCAG 2.0/2.1 A and AA rules for the landing, writing, collection and optional study pages at desktop and mobile widths. The results are saved as CI artifacts; this does not replace expert screen-reader or keyboard testing.
10. **Deployment** — a successful, validation-gated Pages publish job plus HTTP/browser verification at the project URL.

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

- IndexedDB readwrite transactions serialize writes from up-to-date clients, with stale-record checks for edits and deletes. Older cached clients writing legacy localStorage do not participate in the database; refresh all tabs. Clearing site data or device loss can destroy local writing, making exported backups essential.
- Text-influence examples are editorial suggestions, not model-generated analysis.
- The build dependency advisories tracked in [issue #13](https://github.com/fraware/verse/issues/13) were resolved with the Tailwind CSS 4 migration. Each new dependency change still needs a fresh audit and browser review.
- GitHub Pages has previously published successfully. Future publication depends on the repository's Pages configuration and passing all required CI jobs.
- SPA route transitions are guarded using React Router's data-router blocker; full reloads and external navigation still rely on browser-managed `beforeunload` prompts, which browsers may suppress. Maintain an external backup of important work.
