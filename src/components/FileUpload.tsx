import { useEffect, useRef, useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Props {
  onTextImport: (text: string) => void;
  initialOpen?: boolean;
}

const MAX_TEXT_SIZE = 1024 * 1024;

/** Imports UTF-8 plain text only. Existing drafts are replaced on explicit confirmation. */
export function FileUpload({ onTextImport, initialOpen = false }: Props) {
  const [expanded, setExpanded] = useState(initialOpen);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!initialOpen) return;
    const frame = requestAnimationFrame(() => buttonRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }));
    return () => cancelAnimationFrame(frame);
  }, [initialOpen]);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".txt") || file.size > MAX_TEXT_SIZE) {
      toast({ title: "Invalid file", description: "Choose a .txt file smaller than 1 MB.", variant: "destructive" });
      return;
    }
    try {
      setText(await file.text());
      setExpanded(true);
    } catch {
      toast({ title: "Unable to read text file", variant: "destructive" });
    }
  }

  function importText() {
    if (!text.trim()) return;
    if (!window.confirm("Replace the current writing canvas with this imported text? Save your previous draft first.")) return;
    onTextImport(text);
    setText("");
    setExpanded(false);
  }

  return (
    <Card className="bg-card/60 border-muted">
      <CardHeader><CardTitle className="text-base font-literary flex gap-2 items-center">
        <FileText className="h-4 w-4 text-literary-sage" /> Import existing work
      </CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Open a UTF-8 .txt file (up to 1 MB). Text stays in your browser.</p>
        {initialOpen && <p className="text-sm font-medium text-literary-sage">Choose a file below to begin importing.</p>}
        <Button ref={buttonRef} variant="outline" className="w-full" onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4 mr-2" /> Choose text file
        </Button>
        <input ref={inputRef} type="file" className="sr-only" accept=".txt,text/plain"
          aria-label="Choose a plain text poem" onChange={handleFile} />
        {expanded && text && (
          <div className="space-y-3">
            <Textarea aria-label="Imported text preview" value={text} onChange={event => setText(event.target.value)}
              className="min-h-40 font-literary" />
            <div className="flex flex-wrap gap-2">
              <Button onClick={importText} disabled={!text.trim()}>Use this text</Button>
              <Button variant="ghost" onClick={() => { setExpanded(false); setText(""); }}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
