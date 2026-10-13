import { useCallback, useEffect, useState } from "react";
import { Poem, POEMS_KEY, readPoems, mergePoems } from "@/lib/poems";
import { commitPoems, matchesPoem, PoemConflictError } from "@/lib/poemTransactions";
export type { Poem } from "@/lib/poems";

interface Snapshot { poems: Poem[]; error: string | null }

function initialSnapshot(): Snapshot {
  try {
    return { poems: readPoems(), error: null };
  } catch (error) {
    return { poems: [], error: error instanceof Error ? error.message : "Cannot access browser storage." };
  }
}

export function useLocalPoems() {
  const [state, setState] = useState<Snapshot>(initialSnapshot);

  const refetch = useCallback(() => setState(initialSnapshot()), []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === POEMS_KEY || event.key === null) refetch();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refetch]);

  const apply = async <T,>(change: (current: Poem[]) => { poems: Poem[]; result: T }): Promise<T> => {
    try {
      const next = await commitPoems(change);
      setState({ poems: next.poems, error: null });
      return next.result;
    } catch (error) {
      setState(previous => ({ ...previous, error: error instanceof Error ? error.message : "Cannot save to browser storage." }));
      throw error;
    }
  };

  const savePoem = async (title: string, content: string, selectedPoet?: string): Promise<Poem> => {
    if (!content.trim()) throw new Error("Cannot save an empty poem.");
    return apply(previous => {
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
      return { poems: [poem, ...previous], result: poem };
    });
  };

  /** Reject edits based on an obsolete snapshot, even when timestamps collide. */
  const updatePoem = async (
    id: string, changes: Partial<Pick<Poem, "title" | "content" | "selected_poet">>, expected: Poem,
  ): Promise<Poem> => apply(previous => {
    const latest = previous.find(poem => poem.id === id);
    if (!latest || !matchesPoem(latest, expected)) throw new PoemConflictError();
    const updated = { ...latest, ...changes, updated_at: new Date().toISOString() };
    return { poems: previous.map(poem => poem.id === id ? updated : poem), result: updated };
  });

  const deletePoem = async (id: string, expected: Poem): Promise<void> => apply(previous => {
    const latest = previous.find(poem => poem.id === id);
    if (!latest || !matchesPoem(latest, expected)) throw new PoemConflictError();
    return { poems: previous.filter(poem => poem.id !== id), result: undefined };
  });

  const importPoems = async (incoming: Poem[]): Promise<number> => apply(previous => {
    const merged = mergePoems(previous, incoming);
    return { poems: merged, result: merged.length - previous.length };
  });

  return {
    poems: state.poems, error: state.error, loading: false,
    savePoem, updatePoem, deletePoem, importPoems, refetch,
  };
}
