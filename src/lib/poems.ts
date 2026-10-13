/** Versioned, validated browser storage for Verse documents. */
export const POEMS_KEY = "verse_poems";
export const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 2 * 1024 * 1024;

export interface Poem {
  id: string;
  title: string;
  content: string;
  selected_poet?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Backup {
  schemaVersion: typeof BACKUP_VERSION;
  exportedAt: string;
  poems: Poem[];
}

function isPoem(value: unknown): value is Poem {
  if (typeof value !== "object" || value === null) return false;
  const p = value as Partial<Poem>;
  return typeof p.id === "string" && p.id.length > 0 &&
    typeof p.title === "string" && typeof p.content === "string" &&
    (p.selected_poet === undefined || typeof p.selected_poet === "string") &&
    typeof p.is_public === "boolean" &&
    typeof p.created_at === "string" && !Number.isNaN(Date.parse(p.created_at)) &&
    typeof p.updated_at === "string" && !Number.isNaN(Date.parse(p.updated_at));
}

/** Refuse malformed data rather than silently overwriting a broken collection. */
export function validatePoems(input: unknown): Poem[] {
  if (!Array.isArray(input) || input.length > 10000 || !input.every(isPoem)) {
    throw new Error("Collection format is invalid. Existing data has not been modified.");
  }
  const ids = new Set(input.map(p => p.id));
  if (ids.size !== input.length) throw new Error("Collection contains duplicate poem IDs.");
  return input;
}

export function readPoems(storage: Pick<Storage, "getItem"> = localStorage): Poem[] {
  const stored = storage.getItem(POEMS_KEY);
  if (stored === null) return [];
  try {
    return validatePoems(JSON.parse(stored));
  } catch {
    throw new Error("Stored poems could not be read. Export your browser data before changing this collection.");
  }
}

/** Commit before changing UI state; quota/security errors never masquerade as success. */
export function writePoems(poems: Poem[], storage: Pick<Storage, "setItem"> = localStorage): void {
  validatePoems(poems);
  storage.setItem(POEMS_KEY, JSON.stringify(poems));
}

export function makeBackup(poems: Poem[]): Backup {
  return { schemaVersion: BACKUP_VERSION, exportedAt: new Date().toISOString(), poems: validatePoems(poems) };
}

export function parseBackup(text: string): Poem[] {
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) {
    throw new Error("Backup exceeds the 2 MB import limit.");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Backup file is not valid JSON.");
  }
  if (typeof parsed !== "object" || parsed === null ||
      (parsed as Partial<Backup>).schemaVersion !== BACKUP_VERSION) {
    throw new Error("Unsupported backup version.");
  }
  return validatePoems((parsed as Backup).poems);
}

/** Keep existing versions in conflicts; an import never overwrites a local poem. */
export function mergePoems(existing: Poem[], incoming: Poem[]): Poem[] {
  validatePoems(existing);
  validatePoems(incoming);
  const byId = new Map(existing.map(poem => [poem.id, poem]));
  for (const poem of incoming) if (!byId.has(poem.id)) byId.set(poem.id, poem);
  return [...byId.values()].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
