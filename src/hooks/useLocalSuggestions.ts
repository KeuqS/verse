import { useCallback, useState } from "react";

export interface Suggestion {
  id: string;
  type: 'rhyme' | 'meter' | 'tone' | 'diction';
  original_text: string;
  suggested_text: string;
  explanation: string;
  status: 'pending' | 'accepted' | 'rejected';
}

// Poet-specific suggestion templates
const poetSuggestions: Record<string, Suggestion[]> = {
  dickinson: [
    {
      id: '',
      type: 'diction',
      original_text: 'very sad',
      suggested_text: 'circumference of grief',
      explanation: "Dickinson's precise, geometric language for emotional states",
      status: 'pending'
    },
    {
      id: '',
      type: 'meter',
      original_text: 'walking through the garden',
      suggested_text: 'I walked — the Garden —',
      explanation: "Dickinson's characteristic dashes and ballad meter",
      status: 'pending'
    },
    {
      id: '',
      type: 'tone',
      original_text: 'death came',
      suggested_text: 'Death kindly stopped',
      explanation: "Dickinson's personification of abstract concepts",
      status: 'pending'
    }
  ],
  frost: [
    {
      id: '',
      type: 'meter',
      original_text: 'the road splits',
      suggested_text: 'Two roads diverged',
      explanation: "Frost's contemplative, measured iambic rhythm",
      status: 'pending'
    },
    {
      id: '',
      type: 'tone',
      original_text: 'nature is beautiful',
      suggested_text: 'Nature\'s first green is gold',
      explanation: "Frost's deceptively simple observation of nature",
      status: 'pending'
    }
  ],
  plath: [
    {
      id: '',
      type: 'diction',
      original_text: 'feeling angry',
      suggested_text: 'rage crystallizes',
      explanation: "Plath's precise, scientific imagery for intense emotion",
      status: 'pending'
    },
    {
      id: '',
      type: 'tone',
      original_text: 'dark thoughts',
      suggested_text: 'thoughts blacken like burnt paper',
      explanation: "Plath's unflinching, visceral metaphors",
      status: 'pending'
    }
  ],
  vuong: [
    {
      id: '',
      type: 'tone',
      original_text: 'I remember my mother',
      suggested_text: 'my mother—a body of water',
      explanation: "Vuong's intimate, embodied memory work",
      status: 'pending'
    },
    {
      id: '',
      type: 'diction',
      original_text: 'the past hurts',
      suggested_text: 'history opens like a wound',
      explanation: "Vuong's visceral approach to inherited trauma",
      status: 'pending'
    }
  ],
  rimbaud: [
    {
      id: '',
      type: 'diction',
      original_text: 'colors blend',
      suggested_text: 'vowels ignite in spectrum',
      explanation: "Rimbaud's synesthetic sensory experience",
      status: 'pending'
    },
    {
      id: '',
      type: 'tone',
      original_text: 'I want freedom',
      suggested_text: 'I is another',
      explanation: "Rimbaud's dissolution of the self",
      status: 'pending'
    }
  ],
  oliver: [
    {
      id: '',
      type: 'tone',
      original_text: 'trees are tall',
      suggested_text: 'trees counsel patience',
      explanation: "Oliver's gentle personification of nature",
      status: 'pending'
    },
    {
      id: '',
      type: 'diction',
      original_text: 'morning sun',
      suggested_text: "morning's first blessing",
      explanation: "Oliver's reverent language for natural phenomena",
      status: 'pending'
    }
  ]
};

const defaultSuggestions: Suggestion[] = [
  {
    id: '',
    type: 'rhyme',
    original_text: 'moonlight bright',
    suggested_text: "moonlight's sight",
    explanation: 'Creates internal rhyme and enhances visual imagery',
    status: 'pending'
  },
  {
    id: '',
    type: 'diction',
    original_text: 'very sad',
    suggested_text: 'melancholy',
    explanation: 'More precise and poetic word choice',
    status: 'pending'
  },
  {
    id: '',
    type: 'meter',
    original_text: 'beautiful morning light',
    suggested_text: "fair morning's golden light",
    explanation: 'Iambic pentameter with elevated diction',
    status: 'pending'
  }
];

export const useLocalSuggestions = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const generateSuggestions = async (_poemId: string, _content: string, selectedPoet?: string) => {
    setLoading(true);
    
    // These are static literary examples; no generative model is invoked.
    // Get poet-specific or default suggestions
    const baseSuggestions = selectedPoet && poetSuggestions[selectedPoet]
      ? poetSuggestions[selectedPoet]
      : defaultSuggestions;
    
    // Add unique IDs to each suggestion
    const newSuggestions = baseSuggestions.map(s => ({
      ...s,
      id: crypto.randomUUID(),
      status: 'pending' as const
    }));
    
    setSuggestions(newSuggestions);
    setLoading(false);
    return newSuggestions;
  };

  const acceptSuggestion = async (id: string) => {
    setSuggestions(prev =>
      prev.map(s => (s.id === id ? { ...s, status: 'accepted' } : s))
    );
    return true;
  };

  const rejectSuggestion = async (id: string) => {
    setSuggestions(prev =>
      prev.map(s => (s.id === id ? { ...s, status: 'rejected' } : s))
    );
    return true;
  };

  const clearSuggestions = useCallback(() => setSuggestions([]), []);

  return {
    suggestions,
    loading,
    generateSuggestions,
    acceptSuggestion,
    rejectSuggestion,
    clearSuggestions,
  };
};
