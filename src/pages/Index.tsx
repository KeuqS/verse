import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WritingCanvas } from "@/components/WritingCanvas";
import { PoetSelector } from "@/components/PoetSelector";
import { SuggestionsPanel } from "@/components/SuggestionsPanel";
import { SharingPanel } from "@/components/SharingPanel";
import { FileUpload } from "@/components/FileUpload";
import { CollectionLink } from "@/components/CollectionLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Feather, Scroll } from "lucide-react";
import { useLocalPoems } from "@/hooks/useLocalPoems";
import { useLocalSuggestions } from "@/hooks/useLocalSuggestions";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [content, setContent] = useState("");
  const [selectedPoet, setSelectedPoet] = useState<string>("");
  const [title, setTitle] = useState("Untitled Poem");
  const [currentPoemId, setCurrentPoemId] = useState<string | null>(null);
  
  const { savePoem, updatePoem } = useLocalPoems();
  const { suggestions, loading: suggestionsLoading, generateSuggestions, acceptSuggestion, rejectSuggestion, remixSuggestion } = useLocalSuggestions();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleTextImport = (text: string) => {
    setContent(text);
    setCurrentPoemId(null);
  };

  const handleSavePoem = async (): Promise<boolean> => {
    if (!content.trim()) {
      toast({ title: "Nothing to save", description: "Write a poem before saving.", variant: "destructive" });
      return false;
    }

    try {
      if (currentPoemId) {
        const updated = await updatePoem(currentPoemId, {
          title, content, selected_poet: selectedPoet
        });
        if (!updated) throw new Error("Unable to update poem");
      } else {
        const poem = await savePoem(title, content, selectedPoet);
        if (!poem) throw new Error("Unable to save poem");
        setCurrentPoemId(poem.id);
      }
      toast({ title: "Poem saved", description: "Saved in this browser's collection." });
      return true;
    } catch {
      toast({ title: "Save failed", description: "Browser storage may be unavailable or full. Copy your poem to a safe location.", variant: "destructive" });
      return false;
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!content.trim()) {
      toast({
        title: "Nothing to analyze",
        description: "Please write some content before getting suggestions.",
        variant: "destructive"
      });
      return;
    }

    // Save poem first if not already saved
    let poemId = currentPoemId;
    if (!poemId) {
      const poem = await savePoem(title, content, selectedPoet);
      if (poem) {
        poemId = poem.id;
        setCurrentPoemId(poemId);
      }
    }

    await generateSuggestions(poemId || '', content, selectedPoet);
  };

  const handleAcceptSuggestion = async (id: string) => {
    const suggestion = suggestions.find(s => s.id === id);
    if (suggestion && !content.includes(suggestion.original_text)) {
      toast({ title: "Example does not match", description: "The source phrase is absent from your draft.", variant: "destructive" });
      return;
    }
    if (suggestion) {
      // Replace the original text with the suggested text
      const newContent = content.replace(suggestion.original_text, suggestion.suggested_text);
      setContent(newContent);
      
      // Update poem in storage if it exists
      if (currentPoemId) {
        await updatePoem(currentPoemId, {
          title,
          content: newContent,
          selected_poet: selectedPoet
        });
      }
    }
    
    const success = await acceptSuggestion(id);
    if (success) {
      toast({
        title: "Suggestion accepted",
        description: "Your text has been updated with the suggestion.",
      });
    }
  };

  const handleRejectSuggestion = async (id: string) => {
    const success = await rejectSuggestion(id);
    if (success) {
      toast({
        title: "Suggestion rejected",
        description: "The suggestion has been dismissed.",
      });
    }
  };

  const handleRemixSuggestion = async (id: string) => {
    await remixSuggestion(id, currentPoemId || '', content, selectedPoet);
    toast({
      title: "Generating variations",
      description: "Creating new suggestions based on this one.",
    });
  };

  return (
    <div className="min-h-screen bg-background font-literary">
      {/* Header */}
      <header className="border-b border-muted bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-literary-sage/10 rounded-full">
                <Feather className="h-6 w-6 text-literary-sage" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Verse</h1>
                <p className="text-sm text-muted-foreground italic">A companion for poets</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSavePoem}
                className="font-literary"
              >
                Save Poem
              </Button>
              <CollectionLink />
              <Badge variant="secondary" className="font-literary">
                <Scroll className="h-3 w-3 mr-1" />
                {currentPoemId ? "Saved" : "Draft"}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Writing Canvas - Takes up most space */}
          <div className="lg:col-span-2">
            <Input
              aria-label="Poem title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mb-4 bg-card/60 font-literary text-lg"
              placeholder="Poem title"
            />
            <WritingCanvas
              content={content}
              onContentChange={setContent}
              placeholder="In the quiet moments between words,
poetry finds its voice...

Begin here, let your thoughts flow freely."
            />
          </div>

          {/* Sidebar with controls and suggestions */}
          <div className="space-y-6">
            <PoetSelector
              selectedPoet={selectedPoet}
              onPoetSelect={setSelectedPoet}
            />
            
            <FileUpload onTextImport={handleTextImport} />
            
            <SuggestionsPanel
              suggestions={suggestions}
              selectedPoet={selectedPoet}
              content={content}
              loading={suggestionsLoading}
              onGenerateSuggestions={handleGenerateSuggestions}
              onAcceptSuggestion={handleAcceptSuggestion}
              onRejectSuggestion={handleRejectSuggestion}
              onRemixSuggestion={handleRemixSuggestion}
            />
            
            <SharingPanel 
              content={content} 
              title={title}
              onSavePoem={handleSavePoem}
            />
          </div>
        </div>
      </main>

      {/* Subtle footer */}
      <footer className="mt-16 py-8 border-t border-muted bg-background/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground font-literary italic">
            "The best words in the best order" — Samuel Taylor Coleridge
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
