# Architecture

## Design and execution model

Verse is a client-only React 18 / TypeScript / Vite application. React Router handles three routes: `/` (landing), `/write` (editor), and `/collection` (saved documents). Tailwind CSS 4 and shadcn/Radix primitives supply a restrained editorial interface. The deployed build consists of static HTML, CSS, assets, and JavaScript.

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

Local persistence: IndexedDB["verse-local-poems"]["poems"]
Legacy migration: localStorage["verse_poems"] copied once, original retained
Deployment: GitHub Actions → GitHub Pages /verse/
```

## Responsibilities

| Path | Responsibility |
| --- | --- |
| `src/App.tsx` | Browser routing, toast notifications, SPA base URL |
| `src/pages/Index.tsx` | Unsaved editor state and save/update orchestration |
| `src/pages/Collection.tsx` | Collection management, backup exchange, accessible selection |
| `src/hooks/useLocalPoems.ts` | Async storage hook, cross-tab refreshes, success/error reporting |
| `src/lib/poemStore.ts` | IndexedDB transactions, conflict checks, idempotent legacy migration |
| `src/lib/poems.ts` | Validated record format and versioned export/import |
| `src/hooks/useLocalSuggestions.ts` | Deterministic curated example catalogue |
| `src/components/SuggestionsPanel.tsx` | Example presentation and explicit application guard |
| `src/components/SharingPanel.tsx` | Native/web sharing and clipboard behavior |
| `src/components/FileUpload.tsx` | Plain-text import workflow |
| `src/components/ui/` | Reusable design-system primitives |

## Core invariants

1. **Data durability:** storage is written before a successful save is reported. Read or write failure is surfaced to the user.
2. **No silent clobbering:** malformed stored data is not replaced with an empty collection; backup imports validate before writing and prefer existing records for matching IDs.
3. **Transactional local scope:** saved poems are individual IndexedDB records scoped to a browser origin/profile. All current create/update/delete/import operations run inside readwrite transactions; record comparisons reject stale same-poem updates and deletes. BroadcastChannel prompts other tabs to reload committed data.
4. **Suggestion scope:** examples are prewritten. An application action is enabled only if the current text contains the exact original phrase.
5. **Public/private boundary:** there are no built-in credentials, auth, API calls for inference, or server persistence. External share actions happen only through user interaction.

## Trade-offs and future improvements

IndexedDB transactions serialize writes across tabs within a browser origin without a remote server. On initial use, the original localStorage array is validated and copied in an atomic transaction alongside a migration marker; existing IndexedDB records win ID collisions. The source localStorage key is deliberately retained for recovery, and is not synchronized with subsequent writes. Old cached Verse clients still accessing that key do not participate in current storage; refresh all tabs. Browser data deletion, quota limits and device failure remain possible; keep external backups. For collaboration or cross-device access, a separate authenticated backend and explicit privacy controls would be necessary.

The template catalogue is intentionally narrow: it does not model meter, linguistic quality, or authorial style empirically. Real analysis needs a documented method, evaluation dataset, failure cases, and independently assessed claims. No mathematical or literary-quality guarantee is made.

## Build boundary

`GITHUB_PAGES=true` changes Vite's public base path to `/verse/`. The validated CI publish job builds using that flag only after quality, browser and accessibility jobs pass. It checks compiled assets, copies `index.html` to `404.html` for SPA fallback, and deploys `dist/`. `npm run verify:dist` must receive the same variable when validating the Pages build.

## Browser network boundary

The production bundle self-hosts its typography using Fontsource. A Content Security Policy limits scripts, fonts, styles and connections to the static site's own origin (with inline styling needed for UI components). No poem is uploaded as part of drafting, save, import, export or suggestion use. Opening an external sharing destination requires confirmation and transfers the prefilled text to that destination even if publication is cancelled.

## CSS build and browser support

Tailwind CSS 4 is integrated through the Vite plugin and uses the legacy TypeScript design configuration imported via `@config`; a `dark` custom variant preserves the site's existing toggles. A first-party animation replaces the legacy Tailwind 3 animation plugin for toasts and honors the system's reduced-motion preference. The new toolchain targets Chrome 111+, Firefox 128+, and Safari 16.4+; check older-browser compatibility separately.
