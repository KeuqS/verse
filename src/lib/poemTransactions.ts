import { POEMS_KEY, readPoems, writePoems } from "./poems";
import type { Poem } from "./poems";

/**
 * All Verse writes use one origin-scoped Web Lock. A single read/modify/write
 * callback executes while the lock is held, preventing cross-tab lost updates.
 * No fallback to an unlocked localStorage write is safe.
 */
export const POEM_WRITE_LOCK = `verse:${POEMS_KEY}:exclusive:v1`;

export class PoemConflictError extends Error {
  constructor() {
    super("This poem changed in another tab. Your draft was preserved; save a separate copy or reload the latest version.");
    this.name = "PoemConflictError";
  }
}

export function matchesPoem(actual: Poem, expected: Poem): boolean {
  return actual.id === expected.id &&
    actual.title === expected.title &&
    actual.content === expected.content &&
    actual.selected_poet === expected.selected_poet &&
    actual.is_public === expected.is_public &&
    actual.created_at === expected.created_at &&
    actual.updated_at === expected.updated_at;
}

export interface Change<T> { poems: Poem[]; result: T }

/** Exclusively for browser use. Aborts without writing on read/validation failure. */
export async function commitPoems<T>(change: (current: Poem[]) => Change<T>): Promise<Change<T>> {
  if (!navigator.locks?.request) {
    throw new Error("This browser cannot safely coordinate saves between tabs (Web Locks unavailable). Your draft is unchanged; use a supported browser or copy the text elsewhere.");
  }
  return navigator.locks.request(POEM_WRITE_LOCK, { mode: "exclusive" }, () => {
    const current = readPoems();
    const next = change(current);
    writePoems(next.poems);
    return next;
  });
}
