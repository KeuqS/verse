import { useState } from "react";
import { Instagram, Share2, Copy, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface Props {
  content: string;
  title?: string;
  onSavePoem: () => Promise<boolean>;
}

export function SharingPanel({ content, title = "Untitled Poem", onSavePoem }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [sharing, setSharing] = useState(false);
  const { toast } = useToast();
  const disabled = !content.trim();

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: "The poem is ready to paste." });
    } catch {
      toast({ title: "Copy failed", description: "Copy the text from the writing canvas manually.", variant: "destructive" });
    }
  }

  function open(url: string, destination: string) {
    // Share URLs transmit poem text to the destination as soon as the URL opens.
    if (!window.confirm(`Send your poem text to ${destination}? It will be included in the URL sent to that service before you decide whether to publish.`)) return;
    window.open(url, "_blank", "noopener,noreferrer,width=540,height=600");
  }

  async function quickShare() {
    if (!navigator.share) {
      await copy(`${title}\n\n${content}`);
      return;
    }
    try {
      setSharing(true);
      await navigator.share({ title, text: content });
    } catch (cause) {
      if (!(cause instanceof Error && cause.name === "AbortError")) {
        toast({ title: "Sharing failed", description: "Try copying the poem instead.", variant: "destructive" });
      }
    } finally {
      setSharing(false);
    }
  }

  function tumblr() {
    open(`https://www.tumblr.com/widgets/share/tool?posttype=text&title=${encodeURIComponent(title)}&content=${encodeURIComponent(content)}&tags=poetry,writing`, "Tumblr");
  }

  function xShare() {
    const truncated = content.length > 230 ? `${content.slice(0, 227)}...` : content;
    open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(truncated)}`, "X");
  }

  return (
    <Card className="bg-card/60 border-literary-sage/20">
      <CardHeader><CardTitle className="text-base font-literary flex gap-2 items-center">
        <Share2 className="h-4 w-4 text-literary-sage" /> Share your verse
      </CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Choose exactly where to share. Nothing is published automatically.</p>
        {!expanded ? (
          <Button className="w-full" disabled={disabled}
            onClick={async () => { if (await onSavePoem()) setExpanded(true); }}>
            Save and show sharing options
          </Button>
        ) : (
          <>
            <Button className="w-full" disabled={disabled || sharing} onClick={() => void quickShare()}>
              <Share2 className="h-4 w-4 mr-2" /> {sharing ? "Sharing…" : "Share…"}
            </Button>
            <Button className="w-full" variant="outline" disabled={disabled} onClick={() => void copy(`${title}\n\n${content}`)}>
              <Copy className="h-4 w-4 mr-2" /> Copy poem
            </Button>
            <Separator />
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={() => void copy(`${title}\n\n${content}\n\n#poetry`)} disabled={disabled}>
                <Instagram className="h-4 w-4 mr-1" /> Instagram copy
              </Button>
              <Button size="sm" variant="outline" onClick={tumblr} disabled={disabled}>
                <ExternalLink className="h-4 w-4 mr-1" /> Tumblr
              </Button>
              <Button size="sm" variant="outline" onClick={xShare} disabled={disabled}>
                <ExternalLink className="h-4 w-4 mr-1" /> X
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">External sharing sends text to the chosen service before publication. Confirm before opening Tumblr or X.</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
