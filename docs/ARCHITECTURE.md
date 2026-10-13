# Architecture

## Design and execution model

Verse is a client-only React 18 / TypeScript / Vite application. React Router handles three routes: `/` (landing), `/write` (editor), and `/collection` (saved documents). Tailwind CSS 4 with a migrated legacy design theme, and shadcn/Radix primitives supply a restrained editorial interface. The deployed build consists of static HTML, CSS, assets, and JavaScript.

```text
Browser
  ├── Landing
  ├── Writing editor
  │   ├── title + content
  │   ├── poet selector
  │   ├── curated example catalogue
  │   ├── .txt importer
  │   └── explicit sharing controls
  └── Collection
      ├── browse / reopen / rename / delete
      └── JSON export / merge import

Local persistence: localStorage["verse_poems"]
Deployment: GitHub Actions → GitHub Pages /verse/
```

## Responsibilities

| Path | Responsibility |
| --- | --- |
| `src/App.tsx` | Browser routing, toast notifications, SPA base URL |
| `src/pages/Index.tsx` | Unsaved editor state and save/update orchestration |
| `src/pages/Collection.tsx` | Collection management, backup exchange, accessible selection |
| `src/hooks/useLocalPoems.ts` | Storage hook, cross-tab updates, success/error reporting |
| `src/lib/poems.ts` | Validated record format and versioned export/import |
| `src/lib/poemTransactions.ts` | Origin-scoped write serialization and stale-version checks |
| `src/hooks/useLocalSuggestions.ts` | Deterministic curated example catalogue |
| `src/components/SuggestionsPanel.tsx` | Example presentation and explicit application guard |
| `src/components/SharingPanel.tsx` | Native/web sharing and clipboard behavior |
| `src/components/FileUpload.tsx` | Plain-text import workflow |
| `src/components/ui/` | Reusable design-system primitives |

## Core invariants

1. **Data durability:** storage is written before a successful save is reported. Read or write failure is surfaced to the user.
2. **No silent clobbering:** malformed stored data is not replaced with an empty collection; backup imports validate before writing and prefer existing records for matching IDs.
3. **Local scope and concurrency:** poems are stored per browser origin/profile. All current-version mutations run under the same origin-scoped Web Lock, serializing the read/modify/write operation. Stale edits and deletes are refused by comparing the entire saved record; a conflicting editor retains its draft with a separate-copy recovery action. Backups and localStorage schema v1 remain unchanged.
4. **Suggestion scope:** examples are prewritten. An application action is enabled only if the current text contains the exact original phrase.
5. **Public/private boundary:** there are no built-in credentials, auth, API calls for inference, or server persistence. External share actions happen only through user interaction.

## Trade-offs and future improvements

Browser `localStorage` is straightforward and deployment-independent, but has quotas and no device synchronization. Web Locks serialize only cooperating tabs and only while the browser supports the API. Older app versions, external storage mutations, or disabled Web Locks lie outside this guarantee; writes fail closed if Web Locks are unavailable. An interrupted JavaScript execution cannot roll back a browser storage operation, although each JSON string is replaced in one setItem operation. For larger libraries, consider IndexedDB with explicit versioned migration, transactional storage, and backup-first recovery. For true collaboration, introduce a separate authenticated backend and explicit privacy controls.

The template catalogue is intentionally narrow: it does not model meter, linguistic quality, or authorial style empirically. Real analysis needs a documented method, evaluation dataset, failure cases, and independently assessed claims. No mathematical or literary-quality guarantee is made.

## Build boundary

`GITHUB_PAGES=true` changes Vite's public base path to `/verse/`. The validated CI publish job builds using that flag only after quality, browser and accessibility jobs pass. It checks compiled assets, copies `index.html` to `404.html` for SPA fallback, and deploys `dist/`. `npm run verify:dist` must receive the same variable when validating the Pages build.

## Browser network boundary

The production bundle self-hosts its typography using Fontsource. A Content Security Policy limits scripts, fonts, styles and connections to the static site's own origin (with inline styling needed for UI components). No poem is uploaded as part of drafting, save, import, export or suggestion use. Opening an external sharing destination requires confirmation and transfers the prefilled text to that destination even if publication is cancelled.

## CSS build

Tailwind CSS 4 runs through the Vite plugin and explicitly imports the project's TypeScript theme configuration via `@config`. The historical v3 animation plugin was removed. Toast motion uses first-party CSS keyframes and opts out under `prefers-reduced-motion`. The source remains on the static-site deployment path, without runtime CSS services.
