# Verse craft-workbench exploratory usability pilot

**Protocol:** `verse-craft-pilot-v1`  
**Application:** [Study instrument](https://fraware.github.io/verse/study)  
**Status:** Instrument implementation and methodological proposal. **No participant data have been collected or analyzed by this project.**

## Research question and limits

Does Verse's selected-text craft workbench help writers complete short revision tasks with less perceived difficulty and greater perceived usefulness than unaided editing or the existing fixed literary-example catalogue?

This is an **exploratory, within-participant usability comparison**, not an established measurement of literary merit. The implementation collects self-reported task completion, perceived usefulness, friction and adherence. It does not collect final drafts, blinded quality ratings, completion times, behavior analytics, or identifiable participant information. These exclusions are intentional privacy constraints, and substantially limit the conclusions the study supports.

## Eligibility, recruitment and consent

Eligible participants can read English and use a desktop browser's text editor. Include writers with varied experience, document experience levels outside the instrument only with separate voluntary consent, and report recruitment limitations. Use a facilitator-led dry run before any substantive study. If recruited participants form part of human-subjects research, determine the applicable institutional review, consent, and data-handling obligations before enrollment. The website's participation notice is **not** a substitute for formal informed consent.

Do not enroll participants merely by publishing the study URL. The instrument does not contact researchers and cannot record enrollment or withdrawal. Organizers must handle invitations, consent, allocation schedules, completion and dropout accounting separately.

## Design

Each participant completes three approximately five-minute revision tasks, one per condition, using three distinct provided starting poems.

| Condition code | Participant instructions |
| --- | --- |
| `unaided` | Revise with the normal writing editor. Avoid the two writing tools |
| `examples` | Consult the assigned fixed literary examples and revise as desired. Avoid the craft workbench |
| `experiments` | Preview at least one selected-text Echo, Isolate, or Omit experiment. The writer decides whether to apply it. Avoid literary examples |

The three stimuli are `station`, `path`, and `trees`. Their initial phrases permit fixed examples to be applicable in the examples condition: General craft exercises, Robert Frost, and Mary Oliver respectively. They are artificial prompts, not participants' personal writing. Each stimulus has different meaning and difficulty; counterbalancing mitigates but does not eliminate these differences.

The 36 possible allocation codes are the Cartesian product of all six condition orders and all six stimulus orders. A complete block of 36 assignments places each condition in each position twelve times and pairs each condition with each stimulus twelve times.

**Administration:** Print or prepare one randomized permutation of codes 0 through 35. Give the next code to each participant sequentially, retaining a record of issued codes and withdrawals outside Verse. Do not let participants choose favorable task orders. Across incomplete blocks, inspect realized balance and account for it in interpretation. A code is not a unique participant identifier and can be reused in a subsequent block.

## Procedure

1. Obtain applicable consent. Briefly explain the voluntary nature of the pilot and that no poem text is being collected by the survey.
2. Provide an allocation code and open `/verse/study`. Confirm the selected condition and starting text without changing assignment.
3. Copy the sample passage into the Verse writing room in a separate tab. Work for approximately five minutes using the assigned approach. Do not save test passages in the personal poem collection.
4. Return to the study tab. Record whether a revision was completed, perceived usefulness (1 = not useful, 5 = very useful), friction (1 = none, 5 = a great deal), and whether the participant followed the assigned instructions.
5. Repeat for all three tasks. Download the JSON result to the participant's device. Sharing it with the organizer is a separate, explicit action.
6. If participation stops, follow the study consent/withdrawal procedure and record the dropout in the organizer's enrollment log. The instrument discards unfinished sessions on refresh and supplies no partial-session export.
7. A facilitator must verify whether the assigned tools were actually used if procedural adherence is essential. The built-in adherence item is self-reported only.

Because the three conditions occur in the same user interface, contamination, familiarity effects, demand characteristics, and incomplete adherence are plausible. The app does not technically lock participants into one tool. Recruitment from a small convenience sample also limits generalizability.

## Pre-specified descriptive outcomes

**Primary pilot outcome:** Within-participant comparison of the five-category usefulness rating for `experiments` and `unaided`. Tabulate the number of participants rating experiments higher, equal, or lower, and report the full category frequencies.

**Secondary outcomes:** The same comparison against `examples`; friction category distributions; self-reported task completion counts; adherence counts; and rates of participant withdrawal recorded by the facilitator. Report results for all completed responses by assigned condition, and separately describe a restricted subset with self-reported adherence. Do not silently remove unfavorable ratings or failed tasks.

A small pilot principally tests the instrument, task feasibility, and whether further study is warranted. Descriptive contrasts from such a pilot are not demonstrations of causation, improvement, or statistical superiority. Formal confirmatory claims need a separate pre-registered analysis plan, adequate power, a validated outcome or blinded editorial scoring, and checks of order, stimulus, and carryover effects.

If an editorial-quality study is subsequently warranted, collect consenting before/after texts through a **separate controlled process** with an explicit content-sharing consent. Use blinded independent literary reviewers, a disclosed rubric, disagreement analysis, and sufficient sample size. The current Verse survey intentionally cannot provide those outputs.

## Data contract

A completed export is a UTF-8 JSON document:

```json
{
  "schemaVersion": 1,
  "protocol": "verse-craft-pilot-v1",
  "allocation": 0,
  "trials": [
    {
      "position": 1,
      "condition": "unaided",
      "stimulusId": "station",
      "completed": true,
      "usefulness": 4,
      "friction": 2,
      "followedInstructions": true
    }
  ]
}
```

This illustrative excerpt shows one trial; a valid submitted record has three. The exporter constructs fields from a strict allow-list and excludes draft contents, draft titles, names, emails, timestamps, IP addresses and free-form comments. **An allocation code could still be linked to a person if organizers retain identified allocation logs.** Handle downloaded records accordingly.

The study form stores answers in React memory only. It does not write localStorage, sessionStorage or IndexedDB, and makes no submission request. Browser asset retrieval from the static host remains necessary. Clearing the session or reloading removes in-memory responses. Completed downloads remain under the user's control, outside the app.

## Offline descriptive analysis

Once participants separately and voluntarily provide their response files, the study organizer can analyze them locally without sending data to Verse or an external service.

```bash
node --experimental-strip-types scripts/analyze-pilot.mjs responses/*.json
```

The command rejects unexpected fields, malformed scales, unsupported protocol versions, and trial labels that contradict the saved allocation. It prints aggregated category frequencies, completion and adherence counts, and participant-paired comparisons of usefulness for the craft workbench against the unaided and fixed-example conditions. It does not print individual submissions or raw filenames. The script accepts only completed three-trial records. The organizer must separately report recruitment, missing sessions, withdrawals and departures from the intended assignment schedule, including participants who never exported a file.

The output is descriptive. Ratings are five-category ordinal judgments, and arithmetic differences between category codes do not themselves establish literary improvement. Do not interpret the aggregate as a causal estimate without a stronger prospective design and appropriate statistical analysis.

## Verification and reproducibility

- `src/lib/pilotStudy.ts` defines stimuli, allocations, responses and export serialization.
- `src/lib/pilotStudy.test.ts` tests assignment balance, completeness and elimination of unwanted fields.
- `scripts/pilot-study.mjs` tests a full session, download, data isolation and session clearing in Chromium, Firefox and WebKit.
- `scripts/a11y.mjs` includes the study page in responsive automated accessibility checks.
- All production deploys are gated by the existing quality, browser and accessibility jobs.

**Interpretation boundary:** Passing all tests means the instrument behaves according to the defined data and interface contract. It does not mean that any human study has occurred, that an institutional review requirement has been satisfied, or that the writing workbench has demonstrated benefit.
