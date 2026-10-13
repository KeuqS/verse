import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  Calendar, 
  Copy, 
  Trash2, 
  ArrowLeft,
  Heart,
  Scroll,
  Edit3,
  Check,
  X,
  Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalPoems, Poem } from "@/hooks/useLocalPoems";

export default function Collection() {
  const { poems: savedPoems, loading, updatePoem, deletePoem: removePoem } = useLocalPoems();
  const [selectedPoem, setSelectedPoem] = useState<Poem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const copyToClipboard = async (poem: Poem) => {
    try {
      await navigator.clipboard.writeText(`${poem.title}\n\n${poem.content}`);
      toast({
        title: "Copied to clipboard",
        description: "Your poem is ready to share anywhere.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please select and copy the text manually.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePoem = async (id: string) => {
    await removePoem(id);
    setSelectedPoem(null);
    toast({
      title: "Poem removed",
      description: "The poem has been removed from your collection.",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const generateUniqueTitle = (baseTitle: string, excludeId?: string) => {
    const existingTitles = savedPoems
      .filter(poem => poem.id !== excludeId)
      .map(poem => poem.title.toLowerCase());
    
    if (!existingTitles.includes(baseTitle.toLowerCase())) {
      return baseTitle;
    }
    
    let counter = 2;
    let uniqueTitle = `${baseTitle} (${counter})`;
    while (existingTitles.includes(uniqueTitle.toLowerCase())) {
      counter++;
      uniqueTitle = `${baseTitle} (${counter})`;
    }
    return uniqueTitle;
  };

  const startEditing = (poem: Poem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(poem.id);
    setEditingTitle(poem.title);
  };

  const saveTitle = async () => {
    if (!editingId) return;
    
    const trimmedTitle = editingTitle.trim();
    const finalTitle = trimmedTitle || "Untitled Poem";
    const uniqueTitle = generateUniqueTitle(finalTitle, editingId);
    
    await updatePoem(editingId, { title: uniqueTitle });
    
    if (selectedPoem?.id === editingId) {
      setSelectedPoem({ ...selectedPoem, title: uniqueTitle });
    }
    
    setEditingId(null);
    setEditingTitle("");
    
    if (uniqueTitle !== finalTitle) {
      toast({
        title: "Title updated",
        description: "A similar title existed, so we made it unique.",
      });
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveTitle();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const getPoetLabel = (poetId?: string) => {
    const poets: Record<string, string> = {
      dickinson: "Emily Dickinson",
      frost: "Robert Frost",
      plath: "Sylvia Plath",
      vuong: "Ocean Vuong",
      rimbaud: "Arthur Rimbaud",
      oliver: "Mary Oliver",
    };
    return poetId ? poets[poetId] || poetId : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-literary-cream via-literary-pearl to-literary-sage/10 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-8 w-8 text-literary-sage mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading your collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-literary-cream via-literary-pearl to-literary-sage/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 relative">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            size="sm"
            className="absolute top-0 right-0 text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100 transition-opacity"
            title="Home"
          >
            <Home className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={() => navigate('/write')}
            variant="ghost"
            className="mb-4 font-literary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Writing
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-literary-sage" />
            <h1 className="text-4xl font-literary font-bold text-foreground">
              My Collection
            </h1>
          </div>
          <p className="text-muted-foreground font-literary italic">
            Your proudest verses, preserved and cherished
          </p>
        </div>

        {savedPoems.length === 0 ? (
          <Card className="border-literary-sage/20 bg-card/80 backdrop-blur-sm">
            <CardContent className="text-center py-16">
              <Scroll className="h-16 w-16 mx-auto mb-4 text-literary-sage/50" />
              <h3 className="text-xl font-literary font-semibold mb-2">No poems yet</h3>
              <p className="text-muted-foreground font-literary italic mb-6">
                Your collection awaits your first proud verse
              </p>
              <Button
                onClick={() => navigate('/write')}
                className="font-literary"
              >
                Start Writing
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Poems List */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-lg font-literary font-semibold text-foreground mb-4">
                {savedPoems.length} {savedPoems.length === 1 ? 'Poem' : 'Poems'}
              </h2>
              {savedPoems.map((poem) => (
                <Card
                  key={poem.id}
                  className={cn(
                    "group border-literary-sage/20 bg-card/80 backdrop-blur-sm cursor-pointer transition-all duration-200 hover:bg-card/90",
                    selectedPoem?.id === poem.id && "ring-2 ring-literary-sage"
                  )}
                  onClick={() => setSelectedPoem(poem)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        {editingId === poem.id ? (
                          <div className="flex items-center gap-1 flex-1">
                            <Input
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={handleKeyPress}
                              className="h-6 text-sm font-literary font-semibold"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                saveTitle();
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelEditing();
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <h3 className="font-literary font-semibold text-sm line-clamp-1 flex-1">
                              {poem.title}
                            </h3>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => startEditing(poem, e)}
                              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                      <Heart className="h-4 w-4 text-literary-sage/60 flex-shrink-0 ml-2" />
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2 font-literary leading-relaxed">
                      {poem.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-literary">
                        {formatDate(poem.created_at)}
                      </span>
                      {poem.selected_poet && (
                        <Badge variant="secondary" className="text-xs font-literary">
                          {getPoetLabel(poem.selected_poet)}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Selected Poem Display */}
            <div className="lg:col-span-2">
              {selectedPoem ? (
                <Card className="border-literary-sage/20 bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {editingId === selectedPoem.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={handleKeyPress}
                                className="text-2xl font-literary font-bold h-10"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={saveTitle}
                                className="h-8 w-8 p-0"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={cancelEditing}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <CardTitle className="text-2xl font-literary text-foreground flex-1">
                                {selectedPoem.title}
                              </CardTitle>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => startEditing(selectedPoem, e)}
                                className="h-8 w-8 p-0 opacity-0 hover:opacity-100 transition-opacity"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(selectedPoem.created_at)}
                          </div>
                          {selectedPoem.selected_poet && (
                            <Badge variant="secondary" className="font-literary">
                              Inspired by {getPoetLabel(selectedPoem.selected_poet)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => copyToClipboard(selectedPoem)}
                          variant="outline"
                          size="sm"
                          className="font-literary"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button
                          onClick={() => handleDeletePoem(selectedPoem.id)}
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive font-literary"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <Separator className="bg-literary-sage/20" />
                  <CardContent className="pt-6">
                    <div className="prose prose-lg max-w-none">
                      <pre className="font-literary text-lg leading-relaxed tracking-wide whitespace-pre-wrap text-foreground/90 bg-transparent border-none p-0">
                        {selectedPoem.content}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-literary-sage/20 bg-card/80 backdrop-blur-sm">
                  <CardContent className="text-center py-16">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-literary-sage/50" />
                    <p className="text-muted-foreground font-literary italic">
                      Select a poem to read it in full
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
