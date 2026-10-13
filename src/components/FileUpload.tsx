import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onTextImport: (text: string) => void;
}

export const FileUpload = ({ onTextImport }: FileUploadProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [importedText, setImportedText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setImportedText(text);
        setIsExpanded(true);
      };
      reader.readAsText(file);
    }
  };

  const handleImport = () => {
    if (importedText.trim()) {
      onTextImport(importedText);
      setImportedText("");
      setIsExpanded(false);
    }
  };

  const handleCancel = () => {
    setImportedText("");
    setIsExpanded(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-muted">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-literary text-foreground/80">
          <FileText className="h-4 w-4 text-literary-gold" />
          Import Existing Work
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isExpanded ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground font-literary italic">
              Upload a text file to refine existing poetry through your chosen influence.
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full font-literary bg-background/50 hover:bg-background/80"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium font-literary">Imported Text</span>
              <Button
                onClick={handleCancel}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              value={importedText}
              onChange={(e) => setImportedText(e.target.value)}
              className={cn(
                "min-h-[200px] resize-none font-literary text-sm leading-relaxed",
                "bg-background/30 border-muted"
              )}
              placeholder="Your imported text will appear here..."
            />
            <div className="flex gap-2">
              <Button
                onClick={handleImport}
                className="flex-1 font-literary bg-literary-sage hover:bg-literary-sage/90"
              >
                Import to Canvas
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="font-literary"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};