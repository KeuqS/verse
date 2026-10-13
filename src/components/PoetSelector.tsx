import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Palette } from "lucide-react";
import { INFLUENCES } from "@/lib/literaryExamples";

interface PoetSelectorProps {
  selectedPoet?: string;
  onPoetSelect: (poetId: string) => void;
}

/** Catalogue descriptions state craft interests, not authorial imitation claims. */
export const PoetSelector = ({ selectedPoet, onPoetSelect }: PoetSelectorProps) => {
  const selected = INFLUENCES.find(poet => poet.id === selectedPoet);

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-muted">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-literary text-foreground/80">
          <Palette className="h-4 w-4 text-literary-sage" />
          Literary Influence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedPoet || "general"}
          onValueChange={id => onPoetSelect(id === "general" ? "" : id)}>
          <SelectTrigger aria-label="Literary influence" className="font-literary bg-background/50 border-muted">
            <SelectValue placeholder="Choose a poetic voice..." />
          </SelectTrigger>
          <SelectContent className="bg-card border-muted">
            <SelectItem value="general">General craft exercises</SelectItem>
            {INFLUENCES.map(poet => (
              <SelectItem key={poet.id} value={poet.id}
                className="font-literary focus:bg-accent focus:text-accent-foreground">
                <div className="flex flex-col">
                  <span className="font-medium">{poet.name}</span>
                  <span className="text-xs text-muted-foreground">{poet.period}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selected ? (
          <div className="mt-4 p-4 bg-background/30 rounded-md border border-muted">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-literary-sage" />
              <span className="font-medium font-literary text-sm">{selected.name}</span>
              <Badge variant="secondary" className="text-xs font-literary">{selected.style}</Badge>
            </div>
            <p className="text-xs text-muted-foreground italic font-literary leading-relaxed">
              {selected.description}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              These are editorial exercises, not quotations or reproductions of the poet's voice.
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            General exercises explore language and imagery without an author attribution.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
