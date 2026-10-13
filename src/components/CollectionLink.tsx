import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CollectionLink = () => {
  const navigate = useNavigate();
  
  return (
    <Button
      onClick={() => navigate('/collection')}
      variant="ghost"
      size="sm"
      className="font-literary text-muted-foreground hover:text-foreground"
    >
      <BookOpen className="h-4 w-4 mr-2" />
      My Collection
    </Button>
  );
};