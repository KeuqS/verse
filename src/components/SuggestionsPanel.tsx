import { Lightbulb, Check, X, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Suggestion } from "@/hooks/useLocalSuggestions";

interface Props {
  suggestions: Suggestion[];
  content: string;
  onGenerateSuggestions: () => void;
  onAcceptSuggestion: (id: string) => void;
  onRejectSuggestion: (id: string) => void;
}

/** Static examples are illustrative; applying one changes only an exact matching phrase. */
export function SuggestionsPanel({
  suggestions, content, onGenerateSuggestions, onAcceptSuggestion, onRejectSuggestion,
}: Props) {
  const pending = suggestions.filter(item => item.status === "pending");
  const hasContent = content.trim().length > 0;
  return (
    <Card className="bg-card/60 border-muted">
      <CardHeader>
        <CardTitle className="text-base font-literary flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-literary-sage" /> Literary examples
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Prewritten literary examples selected from a local catalogue.
          They do not analyze your poem or use AI.
        </p>
        <Button variant="outline" onClick={onGenerateSuggestions} disabled={!hasContent} className="w-full">
          <BookOpen className="h-4 w-4 mr-2" /> Show examples
        </Button>
        {!hasContent && <p className="text-sm italic text-muted-foreground">Start writing to explore examples.</p>}
        {pending.map(suggestion => {
          const applicable = content.includes(suggestion.original_text);
          return (
            <div key={suggestion.id} className="p-4 rounded-lg border border-muted bg-background/60 space-y-3">
              <Badge variant="secondary" className="capitalize">{suggestion.type}</Badge>
              <div className="text-sm">
                <p><span className="text-muted-foreground">From:</span> <span className="line-through">{suggestion.original_text}</span></p>
                <p><span className="text-muted-foreground">To:</span> <span className="font-medium text-literary-sage">{suggestion.suggested_text}</span></p>
              </div>
              <p className="text-xs text-muted-foreground italic">{suggestion.explanation}</p>
              {!applicable && <p className="text-xs text-muted-foreground">Illustration only — this phrase is absent from your draft.</p>}
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onAcceptSuggestion(suggestion.id)} disabled={!applicable}>
                  <Check className="h-4 w-4 mr-1" /> Apply to draft
                </Button>
                <Button size="sm" variant="ghost" aria-label="Dismiss example"
                  onClick={() => onRejectSuggestion(suggestion.id)}><X className="h-4 w-4" /></Button>
              </div>
            </div>
          );
        })}
        {suggestions.length > 0 && pending.length === 0 && (
          <p className="text-sm text-muted-foreground">All examples dismissed or applied. Show examples to restart.</p>
        )}
      </CardContent>
    </Card>
  );
}
