# Private craft experiments

## Purpose

The static literary catalogue illustrates possible textual changes. It cannot be applied to most original poems because the exact example phrases are absent. The **Craft experiments** panel gives a writer a deliberately limited set of operations on a passage they select themselves. It does not model the quality, meaning, prosody, or style of the poem.

## User workflow

1. Write a draft in Verse and select a single-line word or phrase in the editor (up to 160 UTF-16 code units).
2. Open **Preview echo**, **Preview isolate**, or **Preview omit**. The preview shows the proposed *entire* draft before any modification.
3. Choose **Apply preview to draft** or **Cancel preview**.
4. If applied, **Undo experiment** restores the exact previous editor content as long as the writer has not edited the resulting text.
5. Explicitly choose **Save poem** to commit the draft to IndexedDB.

The three operations are defined precisely.

| Operation | Deterministic operation | Limitation |
| --- | --- | --- |
| Echo | Repeat the selected string immediately after itself, separated by a newline | Does not claim the repetition works as a refrain |
| Isolate | Add a line break immediately before or after the selection where there is not already one | Retains surrounding spaces; preview may show unusual indentation |
| Omit | Remove only the selected string | Refuses a result containing no non-whitespace text |

These options are potential starting points for human revision, not assessments of an author's work. No score, recommendation ranking, stylistic diagnosis, or automated improvement claim is made. Selecting a phrase expresses the writer's intent to experiment with it; the program does not infer intent from the rest of the poem.

## Safety and preservation

Selection offsets come directly from the native textarea API and use UTF-16 indices. A preview checks the complete original draft, indices, selected bytes, size, line bounds and surrogate-pair boundaries. Its application verifies the same complete snapshot and recomputes the expected transformation. Any modification to the draft or selection invalidates the pending preview.

Applying or undoing an experiment increments the editor's revision number and marks the draft as modified. Suggestions from an earlier draft are cleared. An experiment never commits storage, exports data, accesses a network service, or silently changes the poem. Undo is confined to the most recent experiment and disappears if subsequent manual text edits diverge from its exact result; it is not a general revision history.

Browser reload, local data clearing and device loss still threaten unsaved text. Verse cannot restore an experiment's previous text after the editor session is gone. Writers must save and export backups as described in [Data and privacy](DATA_AND_PRIVACY.md).

## Evaluation boundaries

Automated tests establish deterministic transformations, no silent data writes during preview, exact preservation of surrounding text, stale-preview rejection, Unicode surrogate safety, guarded undo, integration with save-state tracking, and behavior in Chromium, Firefox and WebKit. The tests do **not** establish literary utility or improvement.

A substantive literary usefulness evaluation would recruit consenting writers, use their own short drafts, and compare the selection-based exercises against the existing static catalogue and unaided revision. Its outcomes would include whether writers could complete the intended revision, whether text or edits were unintentionally lost, how often they accepted or cancelled changes, and a blinded human assessment of author-perceived usefulness. No such study has been conducted.

## Implementation

- `src/lib/craftExperiments.ts` contains pure, snapshot-checked operations.
- `src/components/WritingCanvas.tsx` forwards native text selection.
- `src/components/CraftExperiments.tsx` displays local previews and explicit controls.
- `src/pages/Index.tsx` applies revisions and protects a one-step undo.
- `src/lib/craftExperiments.test.ts` and `scripts/craft-experiments.mjs` enforce core invariants.

This feature adds no runtime dependency, account, backend, poem schema field, or remote inference service.
