import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CollectionLink = ({ confirmUnsaved = false }: { confirmUnsaved?: boolean }) => {
  const navigate = useNavigate();
  
  return (
    <Button
      onClick={() => {
        if (confirmUnsaved && !window.confirm('Leave the editor and discard unsaved changes?')) return;
        navigate('/collection');
      }}
      variant="ghost"
      size="sm"
      className="font-literary text-muted-foreground hover:text-foreground"
    >
      <BookOpen className="h-4 w-4 mr-2" />
      My Collection
    </Button>
  );
};