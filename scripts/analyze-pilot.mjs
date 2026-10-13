import { readFile, stat } from "node:fs/promises";
import { parsePilotRecord, summarizePilot } from "../src/lib/pilotAnalysis.ts";

/**
 * Offline analysis of user-supplied pilot JSON files.
 * Does not contact any service or write participant-level results.
 * Usage: node --experimental-strip-types scripts/analyze-pilot.mjs file1.json file2.json
 */
const paths = process.argv.slice(2);
if (!paths.length) {
  console.error("Usage: node --experimental-strip-types scripts/analyze-pilot.mjs <response.json> [response.json...]");
  process.exitCode = 2;
} else {
  try {
    const records = [];
    for (const path of paths) {
      const info = await stat(path);
      if (!info.isFile() || info.size > 65536) throw new Error("Input is not a small JSON response file");
      const raw = await readFile(path, "utf8");
      records.push(parsePilotRecord(raw));
    }
    console.log(JSON.stringify(summarizePilot(records), null, 2));
  } catch (error) {
    // Never print input file contents, even for malformed responses.
    console.error("Pilot analysis failed:", error instanceof Error ? error.message : "unknown error");
    process.exitCode = 1;
  }
}
