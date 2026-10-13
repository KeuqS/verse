# Verse

**A quiet, browser-based writing companion for poets.**

Verse preserves a focused editorial interface for drafting, exploring literary examples, organizing poems, and selectively sharing writing. It is a fully static React application and does not depend on Lovable, Supabase, Vercel, hosted AI inference, or an account.

## Features

| Area | Behavior |
| --- | --- |
| Writing | Compose and title poems, then save or update them explicitly |
| Literary influences | Select a poet and inspect curated, prewritten example substitutions |
| Suggestions | Apply examples only if the exact source phrase appears in the draft; nothing is changed without a click |
| Collection | Browse saved poems, rename, reopen for editing, copy, or delete with confirmation |
| Data portability | Export a versioned JSON backup and restore it without replacing conflicting local poem IDs |
| Import | Import a UTF-8 `.txt` file under 1 MB after confirming draft replacement |
| Sharing | Copy locally, invoke native share, or open external service composition pages |

**Important:** Verse's examples are deterministic templates, not AI-generated critiques or validated metrics of writing quality.

## Quick start

Node.js **22** or newer and npm are required.

```bash
git clone https://github.com/fraware/verse.git
cd verse
npm ci
npm run dev
```

Open the address printed by Vite (normally `http://localhost:5173/`).

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run typecheck` | TypeScript analysis |
| `npm run lint` | ESLint |
| `npm run test:unit` | Data-contract regression tests |
| `npm run build` | Production site in `dist/` |
| `npm run verify:dist` | Verify static build output |
| `npm run preview` | Preview the compiled site |

The [CI workflow](.github/workflows/ci.yml) runs static checks and a Chromium/Firefox/WebKit smoke suite and automated accessibility checks for core workflows.

## Deployment

The production target is **GitHub Pages**, at `https://fraware.github.io/verse/`.

1. Under **Settings → Pages**, select **GitHub Actions** as the publishing source.
2. Push to `main`. The [Pages workflow](.github/workflows/pages.yml) compiles using the `/verse/` Vite base path and deploys `dist/`.
3. The workflow includes an SPA fallback for direct navigations to `/verse/write` and `/verse/collection`.
4. Check the Pages workflow result before treating the site as live.

A custom domain needs corresponding GitHub Pages and DNS settings. No external platform is mandatory.

## Privacy and data durability

Poems are persisted in the current browser's `localStorage` under `verse_poems`; storage is **device/browser/origin-specific** and has no account sync. An unavailable, full, or damaged storage area prevents successful saves. Verse does not upload poem contents to a server. Explicit external sharing transfers the text to the chosen service.

**Export backups regularly.** Clearing browser data or changing the site's origin can make local content inaccessible. Restore accepts version-1 Verse JSON files, validates records, and preserves existing items if IDs conflict. It is not a full synchronization mechanism.

See [data model and privacy](docs/DATA_AND_PRIVACY.md) for the backup format and trust boundaries.

## Repository guide

- [Architecture](docs/ARCHITECTURE.md) — boundaries, component structure, and technical trade-offs
- [Testing](docs/TESTING.md) — checks, browser smoke cases, and validation limits
- [Contributing](CONTRIBUTING.md) — change process and review criteria
- [Security](SECURITY.md) — reporting and safe handling
- [Dependency inventory](docs/DEPENDENCIES.md) — advisory evidence and build-tool risk
- [Dependency audit issue](https://github.com/fraware/verse/issues/13) — inherited package advisories awaiting classification

The source was migrated from the owner's private `verse-whisper-alchemy` project, at source commit `801efa918727e5fa805d616ea3f2ce7cc2b6d8f2`. The private source history, `.env`, and unused Lovable/Supabase integrations were excluded from this public repository.

## License

No license has been selected. **Public source availability is not an open-source license.** Reuse and redistribution permissions should be settled by the rights holder before an external release under an open-source license.
