import assert from "node:assert/strict";
import test from "node:test";
import {
  PILOT_CONDITIONS, PILOT_PROTOCOL, PILOT_STIMULI,
  pilotAssignment, isPilotAllocation, makePilotExport, pilotExportJson,
} from "./pilotStudy.ts";
import type { PilotResponse } from "./pilotStudy.ts";
import { parsePilotRecord, summarizePilot } from "./pilotAnalysis.ts";

test("all and only 36 allocation codes are valid", () => {
  for (let i = 0; i < 36; i++) assert.equal(isPilotAllocation(i), true);
  for (const invalid of [-1, 36, Infinity, NaN, 1.5, 100, -0.5]) {
    assert.equal(isPilotAllocation(invalid), false);
    assert.throws(() => pilotAssignment(invalid), RangeError);
  }
});

test("complete allocation block balances conditions, stimuli and serial position", () => {
  const positionCounts = new Map<string, number>();
  const pairCounts = new Map<string, number>();
  for (let code = 0; code < 36; code++) {
    const trials = pilotAssignment(code);
    assert.equal(trials.length, 3);
    assert.equal(new Set(trials.map(item => item.condition)).size, 3);
    assert.equal(new Set(trials.map(item => item.stimulusId)).size, 3);
    for (const trial of trials) {
      const positionKey = `${trial.condition}:${trial.position}`;
      const pairKey = `${trial.condition}:${trial.stimulusId}`;
      positionCounts.set(positionKey, (positionCounts.get(positionKey) || 0) + 1);
      pairCounts.set(pairKey, (pairCounts.get(pairKey) || 0) + 1);
    }
  }
  for (const condition of PILOT_CONDITIONS) {
    for (const position of [1, 2, 3]) assert.equal(positionCounts.get(`${condition}:${position}`), 12);
    for (const stimulus of PILOT_STIMULI) assert.equal(pairCounts.get(`${condition}:${stimulus.id}`), 12);
  }
});

function responsesFor(code: number): PilotResponse[] {
  return pilotAssignment(code).map(item => ({
    position: item.position,
    completed: true,
    usefulness: 4 as const,
    friction: 2 as const,
    followedInstructions: true,
  }));
}

test("export contains only allow-listed metadata, never poetry or free text", () => {
  const responses = responsesFor(7);
  const poisoned = responses.map(record => ({
    ...record, poem: "SECRET-POEM-CONTENT", email: "person@example.org", identifier: "participant-secret",
  }));
  const exported = makePilotExport(7, poisoned);
  assert.deepEqual(Object.keys(exported).sort(), ["allocation", "protocol", "schemaVersion", "trials"]);
  assert.deepEqual(Object.keys(exported.trials[0]).sort(), [
    "completed", "condition", "followedInstructions", "friction",
    "position", "stimulusId", "usefulness",
  ]);
  const json = pilotExportJson(7, poisoned);
  assert.equal(exported.protocol, PILOT_PROTOCOL);
  assert.equal(exported.trials.length, 3);
  assert.equal(json.includes("SECRET-POEM-CONTENT"), false);
  assert.equal(json.includes("person@example.org"), false);
  assert.equal(json.includes("participant-secret"), false);
  for (const stimulus of PILOT_STIMULI) {
    assert.equal(json.includes(stimulus.lines), false);
  }
});

test("invalid and missing responses cannot be exported as completed sessions", () => {
  const baseline = responsesFor(0);
  assert.throws(() => makePilotExport(0, baseline.slice(0, 2)));
  assert.throws(() => makePilotExport(36, baseline));
  assert.throws(() => makePilotExport(0, baseline.map((x, i) =>
    i === 1 ? { ...x, usefulness: 0 as 1 } : x)));
  assert.throws(() => makePilotExport(0, baseline.map((x, i) =>
    i === 2 ? { ...x, followedInstructions: "yes" as unknown as boolean } : x)));
  assert.throws(() => makePilotExport(0, baseline.map((x, i) =>
    i === 0 ? { ...x, position: 2 } : x)));
});

test("validated analysis preserves paired participant units and category frequencies", () => {
  const first = parsePilotRecord(pilotExportJson(0, responsesFor(0)));
  const second = responsesFor(35).map(x => ({
    ...x,
    usefulness: (x.position === 1 ? 2 : 5) as 1 | 2 | 3 | 4 | 5,
  }));
  const records = [first, parsePilotRecord(pilotExportJson(35, second))];
  const summary = summarizePilot(records);
  assert.equal(summary.participantRecords, 2);
  for (const condition of PILOT_CONDITIONS) {
    assert.equal(summary.byCondition[condition].n, 2);
    assert.equal(summary.byCondition[condition].completed, 2);
    assert.equal(summary.byCondition[condition].adherence, 2);
    assert.equal(summary.byCondition[condition].usefulness.reduce((a, b) => a + b, 0), 2);
  }
  assert.equal(
    summary.pairedUsefulnessCraftVsUnaided.above +
    summary.pairedUsefulnessCraftVsUnaided.tied +
    summary.pairedUsefulnessCraftVsUnaided.below,
    2,
  );
});

test("analysis rejects unexpected fields, old versions and inconsistent assignments", () => {
  const valid = makePilotExport(2, responsesFor(2));
  const malformed = [
    { ...valid, author: "PRIVATE WRITER" },
    { ...valid, schemaVersion: 2 },
    { ...valid, trials: valid.trials.slice(1) },
    { ...valid, trials: valid.trials.map((x, i) => i === 0 ? { ...x, condition: "experiments" } : x) },
    { ...valid, trials: valid.trials.map((x, i) => i === 1 ? { ...x, text: "SECRET" } : x) },
  ];
  for (const item of malformed) {
    assert.throws(() => parsePilotRecord(JSON.stringify(item)));
  }
  assert.throws(() => parsePilotRecord("not json"));
});
