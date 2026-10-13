import { useEffect, useRef, useState } from "react";
import { useBlocker, useNavigate, useSearchParams } from "react-router-dom";
import { FilePlus2, Scroll } from "lucide-react";
import { VerseMark } from "@/components/VerseMark";
import { WritingCanvas } from "@/components/WritingCanvas";
import { CraftExperiments } from "@/components/CraftExperiments";
import { isCurrentCraftPreview } from "@/lib/craftExperiments";
import type { CraftPreview, DraftSelection } from "@/lib/craftExperiments";
import { PoetSelector } from "@/components/PoetSelector";
import { SuggestionsPanel } from "@/components/SuggestionsPanel";
import { SharingPanel } from "@/components/SharingPanel";
import { FileUpload } from "@/components/FileUpload";
import { CollectionLink } from "@/components/CollectionLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocalPoems } from "@/hooks/useLocalPoems";
import type { Poem } from "@/lib/poems";
import { PoemConflictError } from "@/lib/poemStore";
import { applyLiteraryExample } from "@/lib/literaryExamples";
import { useLocalSuggestions } from "@/hooks/useLocalSuggestions";
import { useToast } from "@/hooks/use-toast";

export default function Index() {
  const [content, setContent] = useState("");
  const [selectedPoet, setSelectedPoet] = useState("");
  const [title, setTitle] = useState("Untitled Poem");
  const [currentPoemId, setCurrentPoemId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clearWriteUrl, setClearWriteUrl] = useState(false);
  const [craftSelection, setCraftSelection] = useState<DraftSelection | null>(null);
  const [experimentUndo, setExperimentUndo] = useState<{ before: string; after: string } | null>(null);
  const savingRef = useRef(false);
  const revision = useRef(0);
  const baseline = useRef<Poem | null>(null);
  const loadedId = useRef<string | null>(null);
  const keepWritingButton = useRef<HTMLButtonElement>(null);
  const { poems, error: storageError, loading, savePoem, updatePoem } = useLocalPoems();
  const { suggestions, generateSuggestions, acceptSuggestion, rejectSuggestion, clearSuggestions } = useLocalSuggestions();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestedPoem = searchParams.get("poem");

  // Blocks all in-app route and query changes, including browser Back/Forward.
  // A confirmed New/import action clears the URL through the single-use
  // clearWriteUrl state, without disabling protection on unrelated navigations.
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    (dirty || saving) && !clearWriteUrl &&
    (currentLocation.pathname !== nextLocation.pathname ||
      currentLocation.search !== nextLocation.search ||
      currentLocation.hash !== nextLocation.hash),
  );

  useEffect(() => {
    if (blocker.state === "blocked") keepWritingButton.current?.focus();
  }, [blocker.state]);

  useEffect(() => {
    if (!clearWriteUrl) return;
    navigate("/write", { replace: true });
    setClearWriteUrl(false);
  }, [clearWriteUrl, navigate]);


  useEffect(() => {
    if (!requestedPoem || loadedId.current === requestedPoem) return;
    const poem = poems.find(item => item.id === requestedPoem);
    if (!poem) return;
    loadedId.current = poem.id;
    baseline.current = poem;
    revision.current += 1;
    setConflict(false);
    setCurrentPoemId(poem.id);
    setContent(poem.content);
    setCraftSelection(null);
    setExperimentUndo(null);
    setTitle(poem.title);
    setSelectedPoet(poem.selected_poet || "");
    setDirty(false);
    clearSuggestions();
  }, [requestedPoem, poems, clearSuggestions]); // The loaded ID prevents reloading over unsaved edits.

  useEffect(() => {
    if (!dirty && !saving) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saving]);

  const changeContent = (text: string) => {
    setContent(text);
    setCraftSelection(null);
    setExperimentUndo(null);
    revision.current += 1;
    setDirty(true);
    clearSuggestions();
  };

  const changePoet = (poet: string) => {
    setSelectedPoet(poet);
    revision.current += 1;
    setDirty(true);
    clearSuggestions();
  };

  const resetDraft = () => {
    if (savingRef.current) return;
    if (dirty && !window.confirm("Discard unsaved changes to your current poem?")) return;
    loadedId.current = null;
    baseline.current = null;
    revision.current += 1;
    setConflict(false);
    setContent("");
    setCraftSelection(null);
    setExperimentUndo(null);
    setTitle("Untitled Poem");
    setSelectedPoet("");
    setCurrentPoemId(null);
    setDirty(false);
    clearSuggestions();
    setClearWriteUrl(true);
  };

  const save = async (): Promise<boolean> => {
    if (savingRef.current) return false;
    if (!content.trim()) {
      toast({ title: "Nothing to save", description: "Write some text first.", variant: "destructive" });
      return false;
    }
    savingRef.current = true;
    setSaving(true);
    const submittedRevision = revision.current;
    try {
      if (currentPoemId) {
        if (!baseline.current) throw new PoemConflictError();
        baseline.current = await updatePoem(currentPoemId,
          { title: title.trim() || "Untitled Poem", content, selected_poet: selectedPoet },
          baseline.current);
      } else {
        const poem = await savePoem(title, content, selectedPoet);
        setCurrentPoemId(poem.id);
        loadedId.current = poem.id;
        baseline.current = poem;
      }
      setConflict(false);
      if (revision.current === submittedRevision) setDirty(false);
      toast({ title: "Poem saved", description: "Stored in this browser. Export a backup from My Collection." });
      return true;
    } catch (error) {
      if (error instanceof PoemConflictError) {
        setConflict(true);
        toast({ title: "Edit conflict", description: "Another tab changed this poem. Your draft remains here; save a separate copy.", variant: "destructive" });
      } else {
        toast({ title: "Save failed", description: "Check browser storage or export your text elsewhere.", variant: "destructive" });
      }
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const saveConflictCopy = async () => {
    if (savingRef.current || !content.trim()) return;
    savingRef.current = true;
    setSaving(true);
    const submittedRevision = revision.current;
    try {
      const poem = await savePoem(`${title.trim() || "Untitled Poem"} (conflict copy)`, content, selectedPoet);
      baseline.current = poem;
      loadedId.current = poem.id;
      setCurrentPoemId(poem.id);
      setConflict(false);
      if (revision.current === submittedRevision) setDirty(false);
      toast({ title: "Separate copy saved", description: "The other tab's version was preserved." });
    } catch {
      toast({ title: "Copy not saved", description: "Your draft remains here. Copy the text elsewhere if necessary.", variant: "destructive" });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const showExamples = async () => {
    if (!content.trim()) return;
    await generateSuggestions("", content, selectedPoet);
  };

  const applyExample = async (id: string) => {
    const suggestion = suggestions.find(item => item.id === id && item.status === "pending");
    if (!suggestion) return;
    const changed = applyLiteraryExample(content, suggestion);
    if (changed === null) {
      toast({ title: "Example does not match", description: "The exact source phrase is absent from your draft.", variant: "destructive" });
      return;
    }
    setContent(changed);
    setCraftSelection(null);
    setExperimentUndo(null);
    revision.current += 1;
    setDirty(true);
    await acceptSuggestion(id);
  };

  const applyCraftExperiment = (preview: CraftPreview) => {
    if (!isCurrentCraftPreview(content, craftSelection, preview)) {
      toast({ title: "Preview expired", description: "Select the passage again before applying an experiment.", variant: "destructive" });
      return;
    }
    const before = content;
    changeContent(preview.result);
    setExperimentUndo({ before, after: preview.result });
  };

  const undoCraftExperiment = () => {
    if (!experimentUndo || content !== experimentUndo.after) return;
    changeContent(experimentUndo.before);
  };

  return (
    <div className="min-h-screen bg-background font-literary">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <VerseMark />
            <div><h1 className="text-xl font-bold">Verse</h1><p className="text-xs text-muted-foreground">Your writing space</p></div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" disabled={saving} onClick={resetDraft}><FilePlus2 className="mr-1 h-4 w-4" /> New</Button>
            <Button variant="outline" size="sm" disabled={saving} onClick={() => void save()}>Save poem</Button>
            <CollectionLink />
            <Badge variant="secondary"><Scroll className="h-3 w-3 mr-1" />
              {!currentPoemId ? "Unsaved" : dirty ? "Modified" : "Saved"}
            </Badge>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {blocker.state === "blocked" && (
          <section role="alert" aria-labelledby="verse-unsaved-heading"
            className="mb-6 space-y-3 rounded border border-destructive p-4">
            <h2 id="verse-unsaved-heading" className="font-semibold">Unsaved draft</h2>
            <p>Your writing has not been saved. Keep editing or explicitly discard
              your local changes before leaving this page.</p>
            {saving && <p role="status">A save is still in progress. Finish it before leaving.</p>}
            <div className="flex flex-wrap gap-2">
              <Button ref={keepWritingButton} variant="outline"
                onClick={() => blocker.reset()}>Keep writing</Button>
              <Button variant="destructive" disabled={saving}
                onClick={() => blocker.proceed()}>Discard changes and leave</Button>
            </div>
          </section>
        )}
        {storageError && <div role="alert" className="mb-6 p-4 rounded border border-destructive text-destructive">{storageError}</div>}
        {conflict && (
          <div role="alert" className="mb-6 p-4 rounded border border-destructive text-destructive space-y-3">
            <p>This poem changed in another tab. Your current draft has not been overwritten. Save it as a separate poem, or copy the text before reopening the latest version.</p>
            <Button variant="outline" disabled={saving} onClick={() => void saveConflictCopy()}>Save a separate copy</Button>
          </div>
        )}
        {requestedPoem && !loading && !poems.some(poem => poem.id === requestedPoem) && !storageError && (
          <p role="alert" className="mb-6 text-destructive">That poem is unavailable in this browser. You may start a new one.</p>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <label className="block mb-2 text-sm font-medium" htmlFor="poem-title">Title</label>
            <Input id="poem-title" value={title} onChange={event => { setTitle(event.target.value); revision.current += 1; setDirty(true); }}
              className="mb-4 bg-card/60 text-lg" maxLength={200} />
            <label htmlFor="poem-content" className="block mb-2 text-sm font-medium">Poem</label>
            <WritingCanvas content={content} onContentChange={changeContent}
              onPassageSelect={setCraftSelection}
              placeholder={"Begin your verse here...\n\nYour words stay in this browser."} />
            <p className="mt-3 text-sm text-muted-foreground">Save explicitly. Your work is not synchronized to another device.</p>
          </div>
          <aside className="space-y-6" aria-label="Writing tools">
            <PoetSelector selectedPoet={selectedPoet} onPoetSelect={changePoet} />
            <FileUpload onTextImport={text => { setContent(text); setCraftSelection(null); setExperimentUndo(null); setCurrentPoemId(null); loadedId.current = null; baseline.current = null; revision.current += 1; setConflict(false); setDirty(true); clearSuggestions(); setClearWriteUrl(true); }}
              initialOpen={searchParams.get("upload") === "true"} />
            <CraftExperiments content={content} selection={craftSelection}
              onApply={applyCraftExperiment}
              canUndo={experimentUndo !== null && content === experimentUndo.after}
              onUndo={undoCraftExperiment} />
            <SuggestionsPanel suggestions={suggestions} content={content}
              onGenerateSuggestions={showExamples} onAcceptSuggestion={applyExample}
              onRejectSuggestion={rejectSuggestion} />
            <SharingPanel content={content} title={title} onSavePoem={save} />
          </aside>
        </div>
      </main>
      <footer className="mt-12 py-8 border-t text-center text-sm text-muted-foreground">
        Verse | A private, browser-based writing companion
      </footer>
    </div>
  );
}
