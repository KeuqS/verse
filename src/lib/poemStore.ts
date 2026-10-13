import { mergePoems, POEMS_KEY, readPoems, validatePoems } from "./poems.ts";
import type { Poem } from "./poems.ts";

/**
 * Each poem is an IndexedDB object-store record. A readwrite transaction
 * serializes updates across tabs/processes; no read-modify-write of a JSON
 * collection in localStorage occurs once the legacy collection is migrated.
 */
const DATABASE = "verse-local-poems";
const DB_VERSION = 1;
const STORE = "poems";
const META = "metadata";
const LEGACY_MARKER = "verse_poems_v1_imported";
export const POEMS_CHANNEL = "verse-local-poems-changed-v1";
const MAX_POEMS = 10000;

let ready: Promise<IDBDatabase> | null = null;

export class PoemConflictError extends Error {
  constructor() {
    super("This poem changed in another tab. Your draft was preserved. Save a separate copy or reopen the latest version.");
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

/** Any rejected or aborted transaction reports failure before the UI claims a save. */
function transaction<T>(
  tx: IDBTransaction,
  enqueue: (result: (value: T) => void, abort: (error: Error) => void) => void,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let value: T;
    let specificError: Error | null = null;
    tx.oncomplete = () => resolve(value);
    tx.onabort = () => reject(specificError ?? tx.error ?? new Error("Browser database transaction was aborted."));
    tx.onerror = () => { /* A failed request aborts the transaction; onabort carries the error. */ };
    const abort = (error: Error) => {
      specificError = error;
      try { tx.abort(); } catch { reject(error); }
    };
    try { enqueue(next => { value = next; }, abort); }
    catch (cause) { abort(cause instanceof Error ? cause : new Error(String(cause))); }
  });
}

function requestValue<T>(db: IDBDatabase, store: string, key: IDBValidKey): Promise<T | undefined> {
  const tx = db.transaction(store, "readonly");
  return transaction<T | undefined>(tx, set => {
    const request = tx.objectStore(store).get(key);
    request.onsuccess = () => set(request.result as T | undefined);
  });
}

async function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    throw new Error("This browser does not provide IndexedDB. Writing has not been saved; copy your text to another location.");
  }
  return new Promise<IDBDatabase>((resolve, reject) => {
    let request: IDBOpenDBRequest;
    try { request = indexedDB.open(DATABASE, DB_VERSION); }
    catch (error) { reject(error); return; }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META);
    };
    request.onerror = () => reject(request.error ?? new Error("Browser database failed to open."));
    request.onblocked = () => reject(new Error("Browser database upgrade is blocked by another tab. Close other Verse tabs and reload."));
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => { db.close(); ready = null; };
      resolve(db);
    };
  });
}

/**
 * Copy legacy localStorage data into IndexedDB, never delete or modify it.
 * The marker and all inserts belong to one transaction. A second racing tab
 * sees the marker after the first transaction commits and does not replay.
 * Existing IndexedDB records win ID collisions (no overwriting newer work).
 */
async function migrateLegacy(db: IDBDatabase): Promise<void> {
  if (await requestValue<boolean>(db, META, LEGACY_MARKER)) return;
  // Refuse corrupt or inaccessible legacy data, preventing silent empty migration.
  const legacy = readPoems();
  const tx = db.transaction([STORE, META], "readwrite");
  await transaction<void>(tx, (done, abort) => {
    const meta = tx.objectStore(META);
    const poems = tx.objectStore(STORE);
    const check = meta.get(LEGACY_MARKER);
    check.onsuccess = () => {
      if (check.result) { done(undefined); return; }
      try {
        for (const poem of legacy) {
          const request = poems.get(poem.id);
          request.onsuccess = () => {
            if (!request.result) poems.add(poem);
          };
        }
        meta.put(true, LEGACY_MARKER);
        done(undefined);
      } catch (error) {
        abort(error instanceof Error ? error : new Error(String(error)));
      }
    };
  });
}

async function database(): Promise<IDBDatabase> {
  if (!ready) {
    ready = (async () => {
      const db = await openDatabase();
      await migrateLegacy(db);
      return db;
    })().catch(error => { ready = null; throw error; });
  }
  return ready;
}

function changed() {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(POEMS_CHANNEL);
  channel.postMessage("changed");
  channel.close();
}

export async function listPoems(): Promise<Poem[]> {
  const db = await database();
  const tx = db.transaction(STORE, "readonly");
  const poems = await transaction<Poem[]>(tx, set => {
    const request = tx.objectStore(STORE).getAll();
    request.onsuccess = () => set(request.result as Poem[]);
  });
  return validatePoems(poems).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function addPoem(title: string, content: string, selectedPoet?: string): Promise<Poem> {
  if (!content.trim()) throw new Error("Cannot save an empty poem.");
  const db = await database();
  const now = new Date().toISOString();
  const poem: Poem = {
    id: crypto.randomUUID(),
    title: title.trim() || "Untitled Poem",
    content,
    selected_poet: selectedPoet || undefined,
    is_public: false,
    created_at: now,
    updated_at: now,
  };
  const tx = db.transaction(STORE, "readwrite");
  await transaction<void>(tx, (done, abort) => {
    const store = tx.objectStore(STORE);
    const count = store.count();
    count.onsuccess = () => {
      if (count.result >= MAX_POEMS) {
        abort(new Error("This collection has reached its 10,000-poem limit. Export a backup before changing the collection."));
      } else {
        store.add(poem);
        done(undefined);
      }
    };
  });
  changed();
  return poem;
}

export async function changePoem(
  id: string, updates: Partial<Pick<Poem, "title" | "content" | "selected_poet">>, expected: Poem,
): Promise<Poem> {
  const db = await database();
  const tx = db.transaction(STORE, "readwrite");
  const result = await transaction<Poem>(tx, (done, abort) => {
    const store = tx.objectStore(STORE);
    const get = store.get(id);
    get.onsuccess = () => {
      const latest = get.result as Poem | undefined;
      if (!latest || !matchesPoem(latest, expected)) {
        abort(new PoemConflictError());
        return;
      }
      const updated = { ...latest, ...updates, updated_at: new Date().toISOString() };
      store.put(updated);
      done(updated);
    };
  });
  changed();
  return result;
}

export async function removePoem(id: string, expected: Poem): Promise<void> {
  const db = await database();
  const tx = db.transaction(STORE, "readwrite");
  await transaction<void>(tx, (done, abort) => {
    const store = tx.objectStore(STORE);
    const get = store.get(id);
    get.onsuccess = () => {
      const latest = get.result as Poem | undefined;
      if (!latest || !matchesPoem(latest, expected)) {
        abort(new PoemConflictError());
        return;
      }
      store.delete(id);
      done(undefined);
    };
  });
  changed();
}

export async function importPoemBackup(incoming: Poem[]): Promise<number> {
  validatePoems(incoming);
  const db = await database();
  const tx = db.transaction(STORE, "readwrite");
  const added = await transaction<number>(tx, (done, abort) => {
    const store = tx.objectStore(STORE);
    const all = store.getAll();
    all.onsuccess = () => {
      try {
        const current = validatePoems(all.result as Poem[]);
        const merged = mergePoems(current, incoming);
        if (merged.length > MAX_POEMS) {
          abort(new Error("Collection exceeds the 10,000-poem limit. No changes were imported."));
          return;
        }
        const ids = new Set(current.map(poem => poem.id));
        for (const poem of incoming) if (!ids.has(poem.id)) store.add(poem);
        done(merged.length - current.length);
      } catch (error) {
        abort(error instanceof Error ? error : new Error(String(error)));
      }
    };
  });
  changed();
  return added;
}

/** POEMS_KEY is intentionally not written: legacy data is retained for recovery. */
export { POEMS_KEY };
