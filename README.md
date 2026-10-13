<div align="center">

<img src="./public/assets/verse-mark.jpg" width="88" height="88" alt="Verse brand mark, shared with the website favicon" />

<img src="./docs/assets/verse-readme-cover.svg" alt="Verse. A quiet place for poetry. Write privately. Keep every word your own." width="100%" />

**A quiet, browser-based writing companion for poets.**

[**Enter the writing room**](https://fraware.github.io/verse/) · [**Explore the source**](https://github.com/fraware/verse) · [**Understand your privacy**](docs/DATA_AND_PRIVACY.md)

<sub>FREE TO USE · PRIVATE BY DEFAULT · NO ACCOUNT</sub>

</div>

---

## The writing room

Verse is a place to draft, revise, and collect poems without handing them to a cloud service. Its typography, warm parchment palette, and considered spacing draw from the printed page. The interface is intentionally small, leaving room for the writing itself.

| **Compose** | **Explore** | **Keep** |
| :--- | :--- | :--- |
| Write and title poems in a focused editor. Save a new work or revise an existing one. | Explore curated literary examples, then select an original passage to preview local echo, isolation, or omission experiments. Changes always require an explicit click. | Organize a personal collection, revisit earlier writing, import plain text, and carry your work away in a JSON backup. |

> **On literary examples.** The examples are static, curated substitutions. Verse does not analyze a poem with a language model, evaluate its literary quality, or send drafts to a hosted inference service.

## Your words, in your browser

Verse runs as a static site. Its poem collection lives in **IndexedDB in your current browser profile**. There are no accounts, cloud poem storage, analytics uploads, or automatic publication.

- **Private to a browser profile.** Separate profiles have separate collections. Anyone using the same browser profile has access to its stored poems. Verse does not encrypt them.
- **Designed for concurrent tabs.** IndexedDB transactions coordinate saves and imports. If another tab edits the same poem, Verse preserves your draft and provides a **Save a separate copy** option.
- **Compatible with older Verse writing.** The first visit copies records from `localStorage["verse_poems"]` into IndexedDB. It leaves the original records untouched. Refresh older open tabs before continuing work.
- **Backups belong to you.** Use **My Collection → Export backup** regularly. Backups are plain-text JSON files with schema version 1. Import merges new poem IDs without replacing existing entries.

**Important:** Clearing browser data, using temporary/private browsing, losing a device, or switching to a different site origin can leave poems inaccessible. Local browser storage is not a durable substitute for your own backups. External sharing transmits the chosen text to the destination following user confirmation, including before a final social post is published.

Read the [data and privacy guide](docs/DATA_AND_PRIVACY.md) for the storage schema, limits, sharing boundaries, and recovery behavior.

## Opening the atelier locally

You need **Node.js 22 or newer** and npm.

```bash
git clone https://github.com/fraware/verse.git
cd verse
npm ci
npm run dev
```

Open the address printed by Vite, usually `http://localhost:5173/`.

<details>
<summary><strong>Build, validate, and preview</strong></summary>

| Command | Purpose |
| :--- | :--- |
| `npm run typecheck` | TypeScript analysis |
| `npm run lint` | ESLint |
| `npm run test:unit` | Poem-schema and data-contract tests |
| `npm run build` | Production assets in `dist/` |
| `npm run verify:dist` | Validate bundled assets and deployment paths |
| `npm run preview` | Inspect the production build locally |

To build specifically for GitHub Pages:

```bash
GITHUB_PAGES=true npm run build
GITHUB_PAGES=true npm run verify:dist
```

The `/verse/` base path is configured for this repository. Another repository name, domain, or host needs a corresponding deployment path.

</details>

## The workshop behind the page

Verse is a React, TypeScript, Vite, and Tailwind CSS 4 application. It uses locally bundled Crimson Text and IBM Plex Mono fonts, the browser's IndexedDB for poem storage, and a static catalogue of literary examples.

Its [GitHub Actions pipeline](.github/workflows/ci.yml) checks TypeScript, lint, unit tests, the complete dependency audit, browser-local privacy, data integrity, backup freshness, brand consistency, visual styling, and automated accessibility before publication. Browser regression tests run in Chromium, Firefox, and WebKit. Automated accessibility tests do not replace manual assistive-technology review.

| Read | For |
| :--- | :--- |
| [Architecture](docs/ARCHITECTURE.md) | Components, storage transactions, migration, and trade-offs |
| [Literary exercises](docs/LITERARY_METHOD.md) | Editorial method, example matching, author references and limitations |
| [Craft experiments](docs/CRAFT_EXPERIMENTS.md) | Selected-text previews, explicit application, guarded undo and evaluation limits |
| [Exploratory study](docs/USABILITY_PILOT.md) | Voluntary pilot protocol, counterbalanced allocation and privacy limits |
| [Testing and release checks](docs/TESTING.md) | Browser workflows, release gates, and known limits |
| [Data and privacy](docs/DATA_AND_PRIVACY.md) | Local persistence, sharing behavior, and backups |
| [Dependency review](docs/DEPENDENCIES.md) | Package audit evidence and compatibility notes |
| [Contributing](CONTRIBUTING.md) | Working on changes and reviewing pull requests |
| [Security](SECURITY.md) | Responsible reporting and safe handling of issues |

### Publishing this static application

The public installation is at **[fraware.github.io/verse](https://fraware.github.io/verse/)**. The repository's workflow builds and publishes to GitHub Pages once its checks pass. Under repository **Settings → Pages**, the publication source must be **GitHub Actions**.

If you deploy another copy, configure the Vite base URL and GitHub Pages path appropriately. No poem backend is necessary for standalone, browser-local use.

## Provenance and rights

This source was migrated from the owner's private `verse-whisper-alchemy` project at commit `801efa918727e5fa805d616ea3f2ce7cc2b6d8f2`. Private history, credentials, and unused hosted integrations were excluded.

**No license has been selected.** Public access to this repository does not grant permission to reuse or redistribute its source. Permission and licensing must be settled with the rights holder before incorporating the code into another project.

---

<div align="center">
  <sub>VERSE · A PLACE FOR WORDS TO FIND THEIR SHAPE</sub>
</div>
