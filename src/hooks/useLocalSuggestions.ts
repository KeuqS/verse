import { useCallback, useState } from "react";
import { examplesForInfluence } from "@/lib/literaryExamples";
import type { LiteraryExample } from "@/lib/literaryExamples";

export interface Suggestion {
  id: string;
  type: LiteraryExample["technique"];
  original_text: string;
  suggested_text: string;
  explanation: string;
  status: "pending" | "accepted" | "rejected";
}

/** Returns fixed, locally bundled craft examples; no user text is analyzed or uploaded. */
export const useLocalSuggestions = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const generateSuggestions = async (_poemId: string, _content: string, selectedPoet?: string) => {
    setLoading(true);
    try {
      const examples = examplesForInfluence(selectedPoet).map(example => ({
        id: example.id,
        type: example.technique,
        original_text: example.original_text,
        suggested_text: example.suggested_text,
        explanation: example.explanation,
        status: "pending" as const,
      }));
      setSuggestions(examples);
      return examples;
    } finally {
      setLoading(false);
    }
  };

  const acceptSuggestion = async (id: string) => {
    setSuggestions(previous => previous.map(example =>
      example.id === id ? { ...example, status: "accepted" } : example,
    ));
    return true;
  };

  const rejectSuggestion = async (id: string) => {
    setSuggestions(previous => previous.map(example =>
      example.id === id ? { ...example, status: "rejected" } : example,
    ));
    return true;
  };

  const clearSuggestions = useCallback(() => setSuggestions([]), []);

  return { suggestions, loading, generateSuggestions, acceptSuggestion, rejectSuggestion, clearSuggestions };
};
