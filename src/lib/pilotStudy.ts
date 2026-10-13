/**
 * Verse exploratory usability pilot, protocol version 1.
 *
 * Six condition sequences crossed with six stimulus sequences give 36
 * reproducible allocations. The participant's poem text is never accepted
 * into a response or exported record.
 */
export const PILOT_PROTOCOL = "verse-craft-pilot-v1" as const;
export type PilotCondition = "unaided" | "examples" | "experiments";
export type PilotStimulusId = "station" | "path" | "trees";

export const PILOT_CONDITIONS: readonly PilotCondition[] = ["unaided", "examples", "experiments"];
export const PILOT_STIMULI = [
  {
    id: "station",
    label: "Station",
    lines: "I feel very sad\nAt the empty station\nThe rain is ending",
    exampleSelection: "General craft exercises",
  },
  {
    id: "path",
    label: "Path",
    lines: "the road splits\nBeyond the dark fence\nI stay beside the grass",
    exampleSelection: "Robert Frost",
  },
  {
    id: "trees",
    label: "Trees",
    lines: "trees are tall\nIn the last light\nI listen to the wind",
    exampleSelection: "Mary Oliver",
  },
] as const;

export interface PilotTrial {
  position: 1 | 2 | 3;
  condition: PilotCondition;
  stimulusId: PilotStimulusId;
}

export interface PilotResponse {
  position: 1 | 2 | 3;
  completed: boolean;
  usefulness: 1 | 2 | 3 | 4 | 5;
  friction: 1 | 2 | 3 | 4 | 5;
  followedInstructions: boolean;
}

export interface PilotExport {
  schemaVersion: 1;
  protocol: typeof PILOT_PROTOCOL;
  allocation: number;
  trials: (PilotTrial & Omit<PilotResponse, "position">)[];
}

const orders = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
] as const;

export function isPilotAllocation(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0 && value < 36;
}

/**
 * Each condition appears in every serial position six times over 36 codes.
 * Every condition/stimulus pair appears twelve times over 36 codes.
 * Allocation codes must be distributed in balanced blocks for a study to
 * achieve these properties in its realized sample.
 */
export function pilotAssignment(allocation: number): PilotTrial[] {
  if (!isPilotAllocation(allocation)) throw new RangeError("Pilot allocation must be an integer from 0 through 35");
  const conditions = orders[Math.floor(allocation / 6)];
  const stimuli = orders[allocation % 6];
  return conditions.map((condition, index) => ({
    position: (index + 1) as 1 | 2 | 3,
    condition: PILOT_CONDITIONS[condition],
    stimulusId: PILOT_STIMULI[stimuli[index]].id,
  }));
}

function isScale(value: number): value is 1 | 2 | 3 | 4 | 5 {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

/**
 * Explicit allow-list serializer. Never accept user-authored poem text,
 * participant names, free-text feedback, browser metadata or timestamps.
 */
export function makePilotExport(allocation: number, responses: readonly PilotResponse[]): PilotExport {
  const trials = pilotAssignment(allocation);
  if (responses.length !== 3) throw new Error("All three trials must be completed before exporting");
  const records = trials.map((trial, index) => {
    const response = responses[index];
    if (!response || response.position !== trial.position ||
        typeof response.completed !== "boolean" ||
        typeof response.followedInstructions !== "boolean" ||
        !isScale(response.usefulness) || !isScale(response.friction)) {
      throw new Error("Invalid or incomplete pilot response");
    }
    return {
      position: trial.position,
      condition: trial.condition,
      stimulusId: trial.stimulusId,
      completed: response.completed,
      usefulness: response.usefulness,
      friction: response.friction,
      followedInstructions: response.followedInstructions,
    };
  });
  return { schemaVersion: 1, protocol: PILOT_PROTOCOL, allocation, trials: records };
}

export function pilotExportJson(allocation: number, responses: readonly PilotResponse[]): string {
  return JSON.stringify(makePilotExport(allocation, responses), null, 2) + "\n";
}
