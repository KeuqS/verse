import { useCallback, useEffect, useState } from "react";
import { Poem, POEMS_KEY, readPoems, writePoems, mergePoems } from "@/lib/poems";
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

  const persist = (poems: Poem[]): boolean => {
    try {
      writePoems(poems);
      setState({ poems, error: null });
      return true;
    } catch (error) {
      setState(previous => ({ ...previous, error: error instanceof Error ? error.message : "Cannot save to browser storage." }));
      return false;
    }
  };

  const savePoem = async (title: string, content: string, selectedPoet?: string): Promise<Poem | null> => {
    if (!content.trim()) return null;
    try {
      const previous = readPoems();
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
      return persist([poem, ...previous]) ? poem : null;
    } catch (error) {
      setState(previous => ({ ...previous, error: String(error) }));
      return null;
    }
  };

  const updatePoem = async (id: string, changes: Partial<Pick<Poem, "title" | "content" | "selected_poet">>): Promise<boolean> => {
    try {
      const previous = readPoems();
      if (!previous.some(poem => poem.id === id)) return false;
      return persist(previous.map(poem => poem.id === id
        ? { ...poem, ...changes, updated_at: new Date().toISOString() }
        : poem));
    } catch (error) {
      setState(previous => ({ ...previous, error: String(error) }));
      return false;
    }
  };

  const deletePoem = async (id: string): Promise<boolean> => {
    try {
      const previous = readPoems();
      if (!previous.some(poem => poem.id === id)) return false;
      return persist(previous.filter(poem => poem.id !== id));
    } catch (error) {
      setState(previous => ({ ...previous, error: String(error) }));
      return false;
    }
  };

  const importPoems = (incoming: Poem[]): number => {
    const previous = readPoems();
    const merged = mergePoems(previous, incoming);
    if (!persist(merged)) throw new Error("Could not save imported poems in this browser.");
    return merged.length - previous.length;
  };

  return {
    poems: state.poems, error: state.error, loading: false,
    savePoem, updatePoem, deletePoem, importPoems, refetch,
  };
}
