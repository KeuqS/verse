# Literary exercises and editorial scope

## What the feature actually does

Verse contains a fixed, first-party catalogue of short before-and-after writing exercises. A selected literary influence determines which editorial examples appear. Every one of the twelve choices has its own set, while **General craft exercises** is a separate, explicit option.

The feature does not inspect meaning, measure verse, perform attribution, retrieve outside material, send a draft over a network, or run language-model inference. Showing exercises is not a recommendation about the quality of the user's text.

## How to read the exercises

An exercise demonstrates a single possible craft move: replacing an abstraction with an image, adding concrete detail, changing syntax, introducing repetition, or asking a rhetorical question. These choices are neither normative judgments nor guaranteed improvements.

- The **From** phrase is a deliberately short example of existing wording.
- The **To** phrase is an editorial demonstration, not a quotation or authorized reproduction of a named writer's work.
- The explanation describes the *local textual change* being illustrated, without asserting stylistic fidelity, prosodic correctness, or literary superiority.
- The selected author provides a broad point of creative reference. These miniature exercises neither reproduce nor reliably characterize that person's complete writing practice.
- Rumi's examples are English-language craft exercises, not translations from Persian.

Familiar literary language and associations are not evidence of exact attribution. Treat quotation, authorship, and close textual parallels as a separate research and rights-review problem before adding cited lines to the catalogue. Current exercises are drafted for this project, without a systematic corpus-based originality audit.

## When an example affects a draft

An exercise is usable only if its **exact case-sensitive source phrase** appears at standalone Unicode word boundaries in the current editor text. Verse modifies only the first matching occurrence, and only following **Apply to draft**. All other text, whitespace and line breaks are preserved byte-for-byte at the JavaScript string level. An example with no match is shown as an illustration with its application button disabled.

This is an intentional, conservative limit. There is no fuzzy replacement, automatic insertion, background revision, or unreviewed change to saved documents. Writers must explicitly save revisions. Standard editor revision tracking also covers example applications during in-flight IndexedDB saves.

## Maintenance contract

1. Keep `INFLUENCES` and `EXAMPLES_BY_INFLUENCE` together in `src/lib/literaryExamples.ts`.
2. Ensure each selectable influence has dedicated examples. Preserve stable IDs and previously saved `selected_poet` values.
3. Avoid direct quotations, false meter or rhyme labels, unsupported claims of precision, and claims that the program analyzes or imitates individual poets.
4. State what each exercise changes in the text. Use cautious descriptions that invite literary judgment.
5. Run `npm run test:unit` and the Chromium, Firefox and WebKit browser suite, including `scripts/literary-catalogue.mjs`, before release.
6. Human literary editing and relevant rights review remain necessary for future additions. Unit tests establish structural and matching properties, not literary merit or originality.

No collection schema, profile isolation, backup format, remote API or deployment path changes accompany this catalogue revision.
