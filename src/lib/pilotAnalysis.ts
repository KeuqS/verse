import { pilotAssignment, PILOT_CONDITIONS, PILOT_PROTOCOL } from "./pilotStudy.ts";
import type { PilotCondition, PilotExport, PilotResponse } from "./pilotStudy.ts";

function objectRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid pilot record shape");
  }
  return value as Record<string, unknown>;
}

function exactFields(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  return actual.length === expected.length &&
    actual.every((field, index) => field === [...expected].sort()[index]);
}

function rating(value: unknown): value is PilotResponse["usefulness"] {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;
}

/** Reject unknown fields and invalid assignments; never silently ingest private text. */
export function parsePilotRecord(text: string): PilotExport {
  if (text.length > 65536) throw new Error("Pilot record exceeds the allowed file size");
  const record = objectRecord(JSON.parse(text) as unknown);
  if (!exactFields(record, ["schemaVersion", "protocol", "allocation", "trials"]) ||
      record.schemaVersion !== 1 || record.protocol !== PILOT_PROTOCOL ||
      typeof record.allocation !== "number" || !Array.isArray(record.trials) ||
      record.trials.length !== 3) {
    throw new Error("Invalid pilot record or unsupported protocol");
  }
  const expected = pilotAssignment(record.allocation);
  const trials = record.trials.map((value: unknown, index: number) => {
    const t = objectRecord(value);
    if (!exactFields(t, [
      "position", "condition", "stimulusId", "completed",
      "usefulness", "friction", "followedInstructions",
    ]) || t.position !== expected[index].position ||
       t.condition !== expected[index].condition ||
       t.stimulusId !== expected[index].stimulusId ||
       typeof t.completed !== "boolean" ||
       typeof t.followedInstructions !== "boolean" ||
       !rating(t.usefulness) || !rating(t.friction)) {
      throw new Error("Trial has invalid responses or contradicts the allocation schedule");
    }
    return {
      ...expected[index],
      completed: t.completed,
      usefulness: t.usefulness,
      friction: t.friction,
      followedInstructions: t.followedInstructions,
    };
  });
  return { schemaVersion: 1, protocol: PILOT_PROTOCOL, allocation: record.allocation, trials };
}

type Counts = { above: number; tied: number; below: number };
interface ConditionSummary {
  n: number;
  usefulness: [number, number, number, number, number];
  friction: [number, number, number, number, number];
  completed: number;
  adherence: number;
}
function initCondition(): ConditionSummary {
  return { n: 0, usefulness: [0, 0, 0, 0, 0], friction: [0, 0, 0, 0, 0], completed: 0, adherence: 0 };
}
function initCounts(): Counts { return { above: 0, tied: 0, below: 0 }; }

/**
 * Descriptive summaries only. Participants are the paired comparison units.
 * No automatic p-values, claims of effect, or literary-quality metrics.
 */
export function summarizePilot(records: readonly PilotExport[]) {
  const byCondition: Record<PilotCondition, ConditionSummary> = {
    unaided: initCondition(), examples: initCondition(), experiments: initCondition(),
  };
  const vsUnaided = initCounts();
  const vsExamples = initCounts();
  for (const record of records) {
    const trials = new Map(record.trials.map(t => [t.condition, t]));
    for (const condition of PILOT_CONDITIONS) {
      const response = trials.get(condition);
      if (!response) throw new Error("Missing assigned condition");
      const summary = byCondition[condition];
      summary.n++;
      summary.usefulness[response.usefulness - 1]++;
      summary.friction[response.friction - 1]++;
      if (response.completed) summary.completed++;
      if (response.followedInstructions) summary.adherence++;
    }
    const craft = trials.get("experiments")!.usefulness;
    for (const [comparison, counts] of [
      ["unaided", vsUnaided], ["examples", vsExamples],
    ] as const) {
      const other = trials.get(comparison)!.usefulness;
      if (craft > other) counts.above++;
      else if (craft < other) counts.below++;
      else counts.tied++;
    }
  }
  return {
    protocol: PILOT_PROTOCOL,
    participantRecords: records.length,
    byCondition,
    pairedUsefulnessCraftVsUnaided: vsUnaided,
    pairedUsefulnessCraftVsExamples: vsExamples,
    interpretation: "Exploratory self-reported usability counts only; no inference about literary quality or causal superiority.",
  };
}
