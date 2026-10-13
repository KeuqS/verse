import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Copy, Download, Edit3, Home, Pencil, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLocalPoems } from "@/hooks/useLocalPoems";
import { makeBackup, MAX_BACKUP_BYTES, parseBackup } from "@/lib/poems";
import { listPoems } from "@/lib/poemStore";
import type { Poem } from "@/lib/poems";

export default function Collection() {
  const { poems, error, loading, deletePoem, updatePoem, importPoems } = useLocalPoems();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const editingBaseline = useRef<Poem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const selectedPoem = poems.find(p => p.id === selectedId) ?? poems[0] ?? null;

  const showError = (message: string) =>
    toast({ title: "Unable to complete action", description: message, variant: "destructive" });

  async function copyPoem() {
    if (!selectedPoem) return;
    try {
      await navigator.clipboard.writeText(`${selectedPoem.title}\n\n${selectedPoem.content}`);
      toast({ title: "Copied to clipboard" });
    } catch {
      showError("Your browser denied clipboard access. Select the poem and copy it manually.");
    }
  }

  async function renamePoem() {
    if (!editingId || !editingBaseline.current) return;
    const title = editingTitle.trim() || "Untitled Poem";
    try {
      await updatePoem(editingId, { title }, editingBaseline.current);
      editingBaseline.current = null;
      setEditingId(null);
      toast({ title: "Title saved" });
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : "The title was not saved.");
    }
  }

  async function removeSelected() {
    if (!selectedPoem) return;
    const expected = selectedPoem;
    if (!window.confirm(`Permanently delete “${expected.title}” from this browser? Export a backup first if needed.`)) return;
    try {
      await deletePoem(expected.id, expected);
      setSelectedId(null);
      toast({ title: "Poem deleted" });
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : "The poem could not be deleted.");
    }
  }

  async function exportCollection() {
    try {
      // Export the last committed database state, not a possibly stale React snapshot.
      const persisted = await listPoems();
      const payload = JSON.stringify(makeBackup(persisted), null, 2);
      const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `verse-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast({ title: "Backup prepared", description: "Keep the downloaded JSON file in a safe location." });
    } catch {
      showError("Unable to export the collection.");
    }
  }

  async function importCollection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) { showError("Backup exceeds the 20 MB import limit."); return; }
    try {
      const imported = parseBackup(await file.text());
      const added = await importPoems(imported);
      toast({ title: "Backup restored", description: `${added} poems added. Existing IDs were preserved.` });
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : "Invalid backup file.");
    }
  }

  return (
    <div className="min-h-screen bg-background font-literary px-4 py-8 sm:px-6">
      <main className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <Button variant="ghost" onClick={() => navigate("/write")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to writing
          </Button>
          <Button variant="ghost" onClick={() => navigate("/")} aria-label="Home">
            <Home className="mr-2 h-4 w-4" /> Home
          </Button>
        </div>
        <header className="mb-7">
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <BookOpen className="h-9 w-9 text-literary-sage" /> My Collection
          </h1>
          <p className="mt-2 text-muted-foreground">Saved only in this browser. Download backups to protect your work.</p>
        </header>
        {error && <div role="alert" className="border border-destructive rounded-md p-4 mb-6 text-destructive">{error}</div>}
        <div className="mb-8 flex flex-wrap gap-3">
          <Button onClick={exportCollection} variant="outline" disabled={!!error || loading}>
            <Download className="h-4 w-4 mr-2" /> Export backup
          </Button>
          <Button onClick={() => fileRef.current?.click()} variant="outline" disabled={!!error || loading}>
            <Upload className="h-4 w-4 mr-2" /> Restore backup
          </Button>
          <input
            ref={fileRef} type="file" accept=".json,application/json"
            aria-label="Choose a Verse backup file" className="sr-only"
            onChange={importCollection}
          />
        </div>
        {loading ? <p role="status">Loading your local collection…</p> : poems.length === 0 ? (
          <Card className="border-literary-sage/20">
            <CardContent className="py-16 text-center">
              <BookOpen className="h-12 w-12 text-literary-sage/50 mx-auto mb-4" />
              <h2 className="text-xl font-semibold">Your collection is empty</h2>
              <p className="my-4 text-muted-foreground">Write a poem or restore a previous backup.</p>
              <Button onClick={() => navigate("/write")}>Begin writing</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <section className="lg:col-span-1 space-y-3" aria-label="Saved poems">
              <h2 className="font-semibold mb-3">{poems.length} saved {poems.length === 1 ? "poem" : "poems"}</h2>
              {poems.map(poem => (
                <Card key={poem.id} className={selectedPoem?.id === poem.id ? "border-literary-sage shadow-sm" : "border-muted"}>
                  <CardContent className="p-3 flex items-center gap-2">
                    <button
                      type="button"
                      className="text-left flex-1 min-w-0 p-2 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-literary-sage"
                      aria-current={selectedPoem?.id === poem.id ? "true" : undefined}
                      onClick={() => { setSelectedId(poem.id); setEditingId(null); editingBaseline.current = null; }}
                    >
                      <span className="block font-semibold truncate">{poem.title}</span>
                      <span className="block text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap">{poem.content}</span>
                    </button>
                    <Button
                      variant="ghost" size="icon" aria-label={`Rename ${poem.title}`}
                      onClick={() => { setSelectedId(poem.id); setEditingId(poem.id); setEditingTitle(poem.title); editingBaseline.current = poem; }}
                    ><Pencil className="h-4 w-4" /></Button>
                  </CardContent>
                </Card>
              ))}
            </section>
            <section className="lg:col-span-2" aria-label="Selected poem">
              {selectedPoem && (
                <Card className="border-literary-sage/20">
                  <CardHeader>
                    {editingId === selectedPoem.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          aria-label="Edit poem title" autoFocus value={editingTitle}
                          onChange={event => setEditingTitle(event.target.value)}
                          onKeyDown={event => {
                            if (event.key === "Enter") void renamePoem();
                            if (event.key === "Escape") setEditingId(null);
                          }}
                        />
                        <Button onClick={renamePoem}>Save title</Button>
                        <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    ) : <CardTitle className="text-2xl">{selectedPoem.title}</CardTitle>}
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedPoem.created_at).toLocaleDateString()}
                      {selectedPoem.selected_poet && <Badge className="ml-2" variant="secondary">{selectedPoem.selected_poet}</Badge>}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-6">
                      <Button onClick={() => navigate(`/write?poem=${encodeURIComponent(selectedPoem.id)}`)}>
                        <Edit3 className="h-4 w-4 mr-2" /> Continue editing
                      </Button>
                      <Button variant="outline" onClick={copyPoem}><Copy className="h-4 w-4 mr-2" /> Copy</Button>
                      <Button variant="ghost" onClick={removeSelected} aria-label="Delete selected poem">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <pre className="whitespace-pre-wrap break-words font-literary text-lg leading-relaxed" tabIndex={0}>{selectedPoem.content}</pre>
                  </CardContent>
                </Card>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
