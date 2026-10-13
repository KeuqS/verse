import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Instagram, Share2, Copy, ExternalLink } from "lucide-react";

interface SharingPanelProps {
  content: string;
  title?: string;
  onSavePoem: () => Promise<boolean>;
}

export const SharingPanel = ({ content, title = "Untitled Poem", onSavePoem }: SharingPanelProps) => {
  const [isSharing, setIsSharing] = useState(false);
  const [showSharingOptions, setShowSharingOptions] = useState(false);
  const { toast } = useToast();

  const shareToInstagram = () => {
    // Instagram doesn't have direct web sharing, but we can copy formatted text
    const formattedText = `${title}\n\n${content}\n\n#poetry #poem #writing #verse`;
    navigator.clipboard.writeText(formattedText).then(() => {
      toast({ title: "Copied to clipboard", description: "Open Instagram and paste your poem." });
    }).catch(() => {
      toast({ title: "Copy failed", description: "Please copy the poem manually.", variant: "destructive" });
    });
  };

  const shareToTumblr = () => {
    const tumblrUrl = `https://www.tumblr.com/widgets/share/tool?posttype=text&title=${encodeURIComponent(title)}&content=${encodeURIComponent(content)}&tags=poetry,poem,writing,verse`;
    window.open(tumblrUrl, '_blank', 'width=540,height=600');
  };

  const shareToTwitter = () => {
    const tweetText = content.length > 200 
      ? `${content.substring(0, 200)}...\n\n#poetry #poem`
      : `${content}\n\n#poetry #poem`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank', 'width=540,height=600');
  };

  const shareToPoetizer = () => {
    // Poetizer doesn't have a direct sharing API, so we'll open their submit page
    window.open('https://poetizer.com/submit', '_blank');
    toast({
      title: "Poetizer opened",
      description: "Create a new post on Poetizer and paste your poem.",
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${title}\n\n${content}`);
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

  const shareViaWebShare = async () => {
    if (navigator.share) {
      try {
        setIsSharing(true);
        await navigator.share({
          title: title,
          text: content,
        });
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          toast({
            title: "Sharing failed",
            description: "Please use the platform-specific buttons below.",
            variant: "destructive",
          });
        }
      } finally {
        setIsSharing(false);
      }
    } else {
      copyToClipboard();
    }
  };

  const isContentEmpty = !content.trim();

  return (
    <Card className="border-literary-sage/20 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-literary text-foreground flex items-center gap-2">
          <Share2 className="h-5 w-5 text-literary-sage" />
          Share Your Verse
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isContentEmpty ? (
          <p className="text-sm text-muted-foreground italic font-literary">
            Write something beautiful to share with the world...
          </p>
        ) : (
          <>
            {!showSharingOptions ? (
              <Button
                onClick={async () => {
                  if (await onSavePoem()) setShowSharingOptions(true);
                }}
                className="w-full font-literary"
                variant="default"
              >
                <Share2 className="h-4 w-4 mr-2" />
                I'm proud of my poem
              </Button>
            ) : (
              <>
                {/* Quick Actions */}
                <div className="space-y-2">
                  <Button
                    onClick={shareViaWebShare}
                    disabled={isSharing}
                    className="w-full font-literary"
                    variant="default"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    {isSharing ? "Sharing..." : "Quick Share"}
                  </Button>
                  
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    className="w-full font-literary"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </Button>
                </div>

                <Separator className="bg-literary-sage/20" />

                {/* Platform-specific sharing */}
                <div className="space-y-2">
                  <p className="text-sm font-literary text-muted-foreground">
                    Share to poetry communities:
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={shareToInstagram}
                      variant="outline"
                      size="sm"
                      className="font-literary"
                    >
                      <Instagram className="h-4 w-4 mr-2" />
                      Instagram
                    </Button>
                    
                    <Button
                      onClick={shareToTumblr}
                      variant="outline"
                      size="sm"
                      className="font-literary"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Tumblr
                    </Button>
                    
                    <Button
                      onClick={shareToTwitter}
                      variant="outline"
                      size="sm"
                      className="font-literary"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Twitter
                    </Button>
                    
                    <Button
                      onClick={shareToPoetizer}
                      variant="outline"
                      size="sm"
                      className="font-literary"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Poetizer
                    </Button>
                  </div>
                </div>
              </>
            )}

            <div className="mt-4 p-3 bg-literary-sage/5 rounded-md border border-literary-sage/20">
              <p className="text-xs text-muted-foreground font-literary italic">
                Some platforms may require you to paste your poem manually. 
                We've made it easy to copy and share across all your favorite communities.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};