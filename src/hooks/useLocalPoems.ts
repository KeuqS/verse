import { useCallback, useEffect, useRef, useState } from "react";
import type { Poem } from "@/lib/poems";
import {
  POEMS_CHANNEL, listPoems, addPoem, changePoem, removePoem, importPoemBackup,
} from "@/lib/poemStore";
export type { Poem } from "@/lib/poems";

interface Snapshot { poems: Poem[]; error: string | null; loading: boolean }

export function useLocalPoems() {
  const [state, setState] = useState<Snapshot>({ poems: [], error: null, loading: true });
  const refreshEpoch = useRef(0);

  const refetch = useCallback(async () => {
    const epoch = ++refreshEpoch.current;
    try {
      const poems = await listPoems();
      if (epoch === refreshEpoch.current) setState({ poems, error: null, loading: false });
    } catch (cause) {
      if (epoch === refreshEpoch.current) {
        setState(previous => ({
          poems: previous.poems,
          loading: false,
          error: cause instanceof Error ? cause.message : "Cannot read browser database.",
        }));
      }
    }
  }, []);

  useEffect(() => {
    void refetch();
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(POEMS_CHANNEL);
    channel.onmessage = () => { void refetch(); };
    return () => { channel.close(); refreshEpoch.current += 1; };
  }, [refetch]);

  const apply = async <T,>(operation: () => Promise<T>): Promise<T> => {
    try {
      const result = await operation();
      await refetch();
      return result;
    } catch (cause) {
      setState(previous => ({
        ...previous,
        error: cause instanceof Error ? cause.message : "Cannot save to browser database.",
        loading: false,
      }));
      throw cause;
    }
  };

  return {
    poems: state.poems,
    error: state.error,
    loading: state.loading,
    savePoem: (title: string, content: string, selectedPoet?: string) =>
      apply(() => addPoem(title, content, selectedPoet)),
    updatePoem: (id: string, changes: Partial<Pick<Poem, "title" | "content" | "selected_poet">>, expected: Poem) =>
      apply(() => changePoem(id, changes, expected)),
    deletePoem: (id: string, expected: Poem) =>
      apply(() => removePoem(id, expected)),
    importPoems: (incoming: Poem[]) =>
      apply(() => importPoemBackup(incoming)),
    refetch,
  };
}
