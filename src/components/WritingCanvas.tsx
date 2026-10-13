import { useState } from "react";
import type { SyntheticEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DraftSelection } from "@/lib/craftExperiments";

interface WritingCanvasProps {
  content: string;
  onContentChange: (content: string) => void;
  onPassageSelect?: (selection: DraftSelection) => void;
  placeholder?: string;
}

export const WritingCanvas = ({ content, onContentChange, onPassageSelect, placeholder }: WritingCanvasProps) => {
  const [isFocused, setIsFocused] = useState(false);

  /** Capture native selections on both pointer release and keyboard navigation. */
  const captureSelection = (event: SyntheticEvent<HTMLTextAreaElement>) => {
    const field = event.currentTarget;
    if (field.selectionEnd > field.selectionStart) {
      onPassageSelect?.({
        start: field.selectionStart,
        end: field.selectionEnd,
        text: field.value.slice(field.selectionStart, field.selectionEnd),
        source: field.value,
      });
    }
  };

  return (
    <Card className={cn(
      "border-none shadow-none bg-card/50 backdrop-blur-sm transition-all duration-300",
      isFocused && "bg-card/80 shadow-lg"
    )}>
      <div className="p-4 sm:p-8">
        <Textarea
          id="poem-content"
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          onSelect={captureSelection}
          onMouseUp={captureSelection}
          onKeyUp={captureSelection}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder || "Begin your verse..."}
          className={cn(
            "min-h-[500px] resize-none border-none bg-transparent",
            "font-literary text-lg leading-relaxed tracking-wide",
            "placeholder:text-muted-foreground/60 placeholder:italic",
            "focus-visible:ring-0 focus-visible:ring-offset-0",
            "text-foreground/90"
          )}
        />
      </div>
    </Card>
  );
};