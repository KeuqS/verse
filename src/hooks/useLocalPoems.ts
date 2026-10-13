import { useState, useEffect } from "react";

export interface Poem {
  id: string;
  title: string;
  content: string;
  selected_poet?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = "verse_poems";

export const useLocalPoems = () => {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load poems from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPoems(JSON.parse(stored));
      } catch (e) {
        console.error("Error parsing stored poems:", e);
      }
    }
    setLoading(false);
  }, []);

  // Save poems to localStorage whenever they change
  const saveToStorage = (updatedPoems: Poem[]): boolean => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPoems));
      setPoems(updatedPoems);
      return true;
    } catch (error) {
      console.error("Cannot save poem data in this browser:", error);
      return false;
    }
  };

  const savePoem = async (title: string, content: string, selectedPoet?: string): Promise<Poem | null> => {
    if (!content.trim()) return null;

    const newPoem: Poem = {
      id: crypto.randomUUID(),
      title: title || "Untitled Poem",
      content,
      selected_poet: selectedPoet,
      is_public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedPoems = [newPoem, ...poems];
    return saveToStorage(updatedPoems) ? newPoem : null;
  };

  const updatePoem = async (id: string, updates: Partial<Poem>): Promise<boolean> => {
    const updatedPoems = poems.map((poem) =>
      poem.id === id
        ? { ...poem, ...updates, updated_at: new Date().toISOString() }
        : poem
    );
    return saveToStorage(updatedPoems);
  };

  const deletePoem = async (id: string): Promise<boolean> => {
    const updatedPoems = poems.filter((poem) => poem.id !== id);
    saveToStorage(updatedPoems);
    return true;
  };

  const refetch = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPoems(JSON.parse(stored));
      } catch (e) {
        console.error("Error parsing stored poems:", e);
      }
    }
  };

  return {
    poems,
    loading,
    savePoem,
    updatePoem,
    deletePoem,
    refetch,
  };
};
