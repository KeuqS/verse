# Contributing

Verse prioritizes reliable writing workflows, clear epistemic claims, accessibility, and restrained visual design.

## Change workflow

1. Fork or create a topic branch from `main`. Keep changes scoped and give the pull request a clear reason and expected behavior.
2. Install dependencies using `npm ci` (do not commit `node_modules/`).
3. Run `npm run typecheck`, `npm run lint`, `npm run test:unit`, and `npm run build`.
4. Update tests and docs for all changed persistence, routing, backup, or deployment behavior.
5. Check keyboard accessibility, mobile responsiveness, error messages, and local data safety.
6. Wait for CI. Merge only with a green validation run, or document any exception.

## Implementation principles

- Preserve original text, including whitespace, punctuation, and line breaks.
- Prefer simple functions with explicit errors over simulated APIs or fictitious confidence scores.
- Never silently discard or replace stored writing.
- Avoid unused dependencies, unnecessary public endpoints, and hidden platform integrations.
- Keep the published JavaScript free of credentials and personal poem backups.
- Separate source-supported capabilities from experiments or future plans.
- Verify new authorial quotations, external links, and dependencies.

## Licensing

No license is currently granted. Contact the rights holder before reusing code beyond rights otherwise provided by law.
