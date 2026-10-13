import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Lightbulb, 
  Check, 
  X, 
  Shuffle, 
  Music, 
  Palette, 
  BookOpen,
  Sparkles 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Suggestion {
  id: string;
  type: 'rhyme' | 'meter' | 'tone' | 'diction';
  original_text: string;
  suggested_text: string;
  explanation: string;
  confidence: number;
  status: 'pending' | 'accepted' | 'rejected';
}

interface SuggestionsPanelProps {
  suggestions: Suggestion[];
  selectedPoet?: string;
  content: string;
  loading?: boolean;
  onGenerateSuggestions: () => void;
  onAcceptSuggestion: (id: string) => void;
  onRejectSuggestion: (id: string) => void;
  onRemixSuggestion: (id: string) => void;
}

const getSuggestionIcon = (type: Suggestion['type']) => {
  switch (type) {
    case 'rhyme': return <Music className="h-3 w-3" />;
    case 'meter': return <BookOpen className="h-3 w-3" />;
    case 'tone': return <Palette className="h-3 w-3" />;
    case 'diction': return <Sparkles className="h-3 w-3" />;
  }
};

const getSuggestionColor = (type: Suggestion['type']) => {
  switch (type) {
    case 'rhyme': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'meter': return 'bg-green-50 text-green-700 border-green-200';
    case 'tone': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'diction': return 'bg-orange-50 text-orange-700 border-orange-200';
  }
};

// Generate poet-specific suggestions
const getPoetInfluencedSuggestions = (poetId?: string): Suggestion[] => {
  const baseSuggestions = {
    dickinson: [
      {
        id: crypto.randomUUID(),
        type: 'diction' as const,
        original_text: 'very sad',
        suggested_text: 'circumference of grief',
        explanation: 'Dickinson\'s precise, geometric language for emotional states',
        confidence: 0.88,
        status: 'pending' as const
      },
      {
        id: crypto.randomUUID(),
        type: 'meter' as const,
        original_text: 'walking through the garden',
        suggested_text: 'I walked — the Garden —',
        explanation: 'Dickinson\'s characteristic dashes and ballad meter',
        confidence: 0.82,
        status: 'pending' as const
      }
    ],
    shakespeare: [
      {
        id: crypto.randomUUID(),
        type: 'meter' as const,
        original_text: 'beautiful morning light',
        suggested_text: 'fair morning\'s golden light',
        explanation: 'Iambic pentameter with Shakespearean diction',
        confidence: 0.90,
        status: 'pending' as const
      },
      {
        id: crypto.randomUUID(),
        type: 'diction' as const,
        original_text: 'love is strong',
        suggested_text: 'love bears it out',
        explanation: 'Shakespearean verb choice emphasizing endurance',
        confidence: 0.85,
        status: 'pending' as const
      }
    ],
    rumi: [
      {
        id: crypto.randomUUID(),
        type: 'tone' as const,
        original_text: 'I feel lost',
        suggested_text: 'in this yearning, I dissolve',
        explanation: 'Rumi\'s mystical transformation of longing into spiritual surrender',
        confidence: 0.87,
        status: 'pending' as const
      },
      {
        id: crypto.randomUUID(),
        type: 'diction' as const,
        original_text: 'heart beats fast',
        suggested_text: 'the heart drums its ecstasy',
        explanation: 'Elevated, mystical language for physical sensation',
        confidence: 0.83,
        status: 'pending' as const
      }
    ],
    oliver: [
      {
        id: crypto.randomUUID(),
        type: 'tone' as const,
        original_text: 'trees are tall',
        suggested_text: 'trees counsel patience',
        explanation: 'Oliver\'s gentle personification of nature',
        confidence: 0.86,
        status: 'pending' as const
      },
      {
        id: crypto.randomUUID(),
        type: 'diction' as const,
        original_text: 'morning sun',
        suggested_text: 'morning\'s first blessing',
        explanation: 'Oliver\'s reverent language for natural phenomena',
        confidence: 0.89,
        status: 'pending' as const
      }
    ],
    plath: [
      {
        id: crypto.randomUUID(),
        type: 'diction' as const,
        original_text: 'feeling angry',
        suggested_text: 'rage crystallizes',
        explanation: 'Plath\'s precise, scientific imagery for intense emotion',
        confidence: 0.84,
        status: 'pending' as const
      },
      {
        id: crypto.randomUUID(),
        type: 'tone' as const,
        original_text: 'dark thoughts',
        suggested_text: 'thoughts blacken like burnt paper',
        explanation: 'Plath\'s unflinching, visceral metaphors',
        confidence: 0.88,
        status: 'pending' as const
      }
    ]
  };

  const defaultSuggestions: Suggestion[] = [
    {
      id: crypto.randomUUID(),
      type: 'rhyme',
      original_text: 'moonlight bright',
      suggested_text: 'moonlight\'s sight',
      explanation: 'Creates internal rhyme and enhances visual imagery',
      confidence: 0.85,
      status: 'pending'
    },
    {
      id: crypto.randomUUID(),
      type: 'diction',
      original_text: 'very sad',
      suggested_text: 'melancholy',
      explanation: 'More precise and poetic word choice',
      confidence: 0.92,
      status: 'pending'
    }
  ];

  return poetId && baseSuggestions[poetId as keyof typeof baseSuggestions] 
    ? baseSuggestions[poetId as keyof typeof baseSuggestions] 
    : defaultSuggestions;
};

export const SuggestionsPanel = ({ 
  suggestions, 
  selectedPoet,
  content,
  loading,
  onGenerateSuggestions,
  onAcceptSuggestion, 
  onRejectSuggestion, 
  onRemixSuggestion 
}: SuggestionsPanelProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasTriedGenerating, setHasTriedGenerating] = useState(false);
  const hasContent = content.trim().length > 0;
  const canShowSuggestions = hasContent && showSuggestions;
  
  // Only show fallback suggestions if we haven't tried generating or if API fails
  const displaySuggestions = canShowSuggestions 
    ? (suggestions.length > 0 ? suggestions : (hasTriedGenerating ? [] : getPoetInfluencedSuggestions(selectedPoet)))
    : [];

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-muted h-fit">
      <CardHeader className="pb-4">
      <CardTitle className="flex items-center gap-2 text-base font-literary text-foreground/80">
        <Lightbulb className="h-4 w-4 text-literary-gold" />
        Writing Examples
      </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasContent ? (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="font-literary italic text-sm">
              Begin writing to receive gentle guidance...
            </p>
          </div>
        ) : !showSuggestions ? (
          <div className="text-center py-6">
            <Button
              onClick={() => {
                setShowSuggestions(true);
                setHasTriedGenerating(true);
                onGenerateSuggestions();
              }}
              variant="outline"
              className="font-literary border-muted hover:bg-background/50"
              disabled={loading}
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              {loading ? "Generating..." : "Get personalized suggestions"}
            </Button>
          </div>
        ) : loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="animate-pulse">
              <Sparkles className="h-8 w-8 mx-auto mb-2" />
              <p className="font-literary italic text-sm">
                Finding writing examples...
              </p>
            </div>
          </div>
        ) : displaySuggestions.length === 0 && hasTriedGenerating ? (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="font-literary italic text-sm">
              No writing examples available. Try another literary influence.
            </p>
            <Button
              onClick={() => onGenerateSuggestions()}
              variant="ghost"
              size="sm"
              className="mt-3 text-xs font-literary"
            >
              Try again
            </Button>
          </div>
        ) : (
          displaySuggestions.map((suggestion, index) => (
            <div key={suggestion.id} className="space-y-2">
              <div className="p-4 bg-background/30 rounded-lg border border-muted hover:bg-background/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-xs font-literary capitalize flex items-center gap-1",
                      getSuggestionColor(suggestion.type)
                    )}
                  >
                    {getSuggestionIcon(suggestion.type)}
                    {suggestion.type}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <div className="text-xs text-muted-foreground font-mono">
                      Example
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground font-literary">From: </span>
                    <span className="font-literary line-through text-muted-foreground/70">
                      "{suggestion.original_text}"
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground font-literary">To: </span>
                    <span className="font-literary text-literary-sage font-medium">
                      "{suggestion.suggested_text}"
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground italic font-literary mb-3 leading-relaxed">
                  {suggestion.explanation}
                </p>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onAcceptSuggestion(suggestion.id)}
                    className="h-7 px-3 text-xs font-literary bg-literary-sage hover:bg-literary-sage/90"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemixSuggestion(suggestion.id)}
                    className="h-7 px-3 text-xs font-literary"
                  >
                    <Shuffle className="h-3 w-3 mr-1" />
                    Remix
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRejectSuggestion(suggestion.id)}
                    className="h-7 px-3 text-xs font-literary text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {index < displaySuggestions.length - 1 && <Separator className="opacity-30" />}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};