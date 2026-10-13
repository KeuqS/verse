# Architecture

## Design and execution model

Verse is a client-only React 18 / TypeScript / Vite application. React Router handles three routes: `/` (landing), `/write` (editor), and `/collection` (saved documents). Tailwind CSS and shadcn/Radix primitives supply a restrained editorial interface. The deployed build consists of static HTML, CSS, assets, and JavaScript.

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
| `src/App.tsx` | Page routing, providers, SPA base URL |
| `src/pages/Index.tsx` | Unsaved editor state and save/update orchestration |
| `src/pages/Collection.tsx` | Collection management, backup exchange, accessible selection |
| `src/hooks/useLocalPoems.ts` | Storage hook, cross-tab updates, success/error reporting |
| `src/lib/poems.ts` | Validated record format and versioned export/import |
| `src/hooks/useLocalSuggestions.ts` | Deterministic curated example catalogue |
| `src/components/SuggestionsPanel.tsx` | Example presentation and explicit application guard |
| `src/components/SharingPanel.tsx` | Native/web sharing and clipboard behavior |
| `src/components/FileUpload.tsx` | Plain-text import workflow |
| `src/components/ui/` | Reusable design-system primitives |

## Core invariants

1. **Data durability:** storage is written before a successful save is reported. Read or write failure is surfaced to the user.
2. **No silent clobbering:** malformed stored data is not replaced with an empty collection; backup imports validate before writing and prefer existing records for matching IDs.
3. **Local scope:** poems are stored per browser origin. Cross-tab updates trigger reloading, although simultaneous edits in two tabs are not transactional.
4. **Suggestion scope:** examples are prewritten. An application action is enabled only if the current text contains the exact original phrase.
5. **Public/private boundary:** there are no built-in credentials, auth, API calls for inference, or server persistence. External share actions happen only through user interaction.

## Trade-offs and future improvements

Browser `localStorage` is straightforward and deployment-independent, but has quotas, limited transactionality, and no device synchronization. For larger libraries, consider an IndexedDB abstraction with formal migration/versioning, optimistic concurrency, user-directed export, and tests for crash recovery. For true collaboration, introduce a separate authenticated backend and explicit privacy controls.

The template catalogue is intentionally narrow: it does not model meter, linguistic quality, or authorial style empirically. Real analysis needs a documented method, evaluation dataset, failure cases, and independently assessed claims. No mathematical or literary-quality guarantee is made.

## Build boundary

`GITHUB_PAGES=true` changes Vite's public base path to `/verse/`. The Pages workflow builds once using that flag, checks the compiled assets, copies `index.html` to `404.html` for SPA fallback, and deploys `dist/`. `npm run verify:dist` must receive the same variable when validating the Pages build.
