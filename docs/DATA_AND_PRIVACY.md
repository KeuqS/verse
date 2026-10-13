# Data model and privacy

## Local document schema

Local poems are stored as a JSON array at `localStorage["verse_poems"]`.

```json
{
  "id": "generated-uuid",
  "title": "Untitled Poem",
  "content": "The poem's exact text",
  "selected_poet": "dickinson",
  "is_public": false,
  "created_at": "2026-10-12T00:00:00.000Z",
  "updated_at": "2026-10-12T00:00:00.000Z"
}
```

`selected_poet` is optional. The `is_public` field is a legacy local schema field; **it does not publish writing** and does not implement access control. Publication only occurs through explicit third-party sharing. Unknown schema versions are rejected during backup import.

## Backup format

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-10-12T00:00:00.000Z",
  "poems": []
}
```

The exported file contains all writing in plain text: protect it accordingly. Import is capped at 20 MB; invalid JSON, malformed documents, and duplicate IDs are rejected. An import adds new IDs and keeps existing records in collisions. This is **merge-only**, not a restore-to-exact-state operation. Export a backup before importing, deleting, or clearing site data.

## Trust and failure boundaries

- A public GitHub repository contains application source, **not users' poems**. Browser writing does not enter the GitHub repository.
- Typography is bundled with the site using Fontsource packages; the application does not request Google Fonts at runtime. Crimson Text and IBM Plex Mono are OFL-1.1 fonts. Normal network metadata is shared with the static site host when loading application assets.
- There is no built-in server account, database, or cloud backup.
- A browser can deny storage or clipboard access, or storage can reach its quota. Save actions report failure.
- Clearing site data, private browsing, or changing domain/origin can orphan prior poems. There is no migration from a previous Lovable domain unless its browser data is exported separately.
- Browser storage is readable by JavaScript executing in this origin. Treat external scripts, dependency updates, and XSS prevention as privacy-critical.
- Clicking Tumblr or X first asks for confirmation. If accepted, opening the share URL transmits prefilled poem text to the chosen service **before any final post is published**. Native sharing and copying require separate user actions; review destination privacy terms.
- Never commit local `.env`, backup JSON files with real writing, access tokens, or credentials.

## Data migration

The original private project's localStorage key was also `verse_poems`; moving to a new origin does **not** move browser data. Export via the original site if still available, and import into this site, or retrieve records directly through browser developer tools with appropriate care. Do not assume old data was automatically transferred.
