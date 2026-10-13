import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Palette } from "lucide-react";

interface Poet {
  id: string;
  name: string;
  period: string;
  style: string;
  description: string;
}

const poets: Poet[] = [
  {
    id: "dickinson",
    name: "Emily Dickinson",
    period: "1830-1886",
    style: "Contemplative & Precise",
    description: "Master of compressed language and profound imagery"
  },
  {
    id: "rimbaud",
    name: "Arthur Rimbaud",
    period: "1854-1891", 
    style: "Visionary & Bold",
    description: "Revolutionary symbolist with vivid, transformative language"
  },
  {
    id: "vuong",
    name: "Ocean Vuong",
    period: "Contemporary",
    style: "Intimate & Lyrical",
    description: "Contemporary voice exploring identity and family through stunning metaphor"
  },
  {
    id: "bishop",
    name: "Elizabeth Bishop",
    period: "1911-1979",
    style: "Observational & Precise",
    description: "Careful observer with exquisite attention to detail and place"
  },
  {
    id: "neruda",
    name: "Pablo Neruda",
    period: "1904-1973",
    style: "Passionate & Sensual",
    description: "Nobel laureate known for love poetry and political verse"
  },
  {
    id: "shakespeare",
    name: "William Shakespeare",
    period: "1564-1616",
    style: "Dramatic & Musical",
    description: "Master of iambic pentameter and timeless human truths"
  },
  {
    id: "angelou",
    name: "Maya Angelou",
    period: "1928-2014",
    style: "Powerful & Resilient",
    description: "Voice of strength, grace, and profound human dignity"
  },
  {
    id: "frost",
    name: "Robert Frost",
    period: "1874-1963",
    style: "Natural & Accessible",
    description: "Rural New England voice with deep philosophical undertones"
  },
  {
    id: "plath",
    name: "Sylvia Plath",
    period: "1932-1963",
    style: "Intense & Confessional",
    description: "Bold, unflinching exploration of inner landscapes"
  },
  {
    id: "rumi",
    name: "Rumi",
    period: "1207-1273",
    style: "Mystical & Ecstatic",
    description: "Sufi poet of divine love and spiritual transformation"
  },
  {
    id: "hughes",
    name: "Langston Hughes",
    period: "1901-1967",
    style: "Jazz-inspired & Social",
    description: "Voice of the Harlem Renaissance with musical rhythms"
  },
  {
    id: "oliver",
    name: "Mary Oliver",
    period: "1935-2019",
    style: "Nature-centered & Meditative",
    description: "Gentle observer of the natural world and human connection"
  }
];

interface PoetSelectorProps {
  selectedPoet?: string;
  onPoetSelect: (poetId: string) => void;
}

export const PoetSelector = ({ selectedPoet, onPoetSelect }: PoetSelectorProps) => {
  const selectedPoetData = poets.find(p => p.id === selectedPoet);

  const handlePoetSelect = (poetId: string) => {
    onPoetSelect(poetId);
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-muted">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-literary text-foreground/80">
          <Palette className="h-4 w-4 text-literary-sage" />
          Literary Influence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedPoet} onValueChange={handlePoetSelect}>
          <SelectTrigger aria-label="Literary influence" className="font-literary bg-background/50 border-muted">
            <SelectValue placeholder="Choose a poetic voice..." />
          </SelectTrigger>
          <SelectContent className="bg-card border-muted">
            {poets.map((poet) => (
              <SelectItem 
                key={poet.id} 
                value={poet.id}
                className="font-literary focus:bg-accent focus:text-accent-foreground"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{poet.name}</span>
                  <span className="text-xs text-muted-foreground">{poet.period}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedPoetData && (
          <div className="mt-4 p-4 bg-background/30 rounded-md border border-muted">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-literary-sage" />
              <span className="font-medium font-literary text-sm">{selectedPoetData.name}</span>
              <Badge variant="secondary" className="text-xs font-literary">
                {selectedPoetData.style}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground italic font-literary leading-relaxed">
              {selectedPoetData.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};