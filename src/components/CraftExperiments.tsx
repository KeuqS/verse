import { useState } from "react";
import { FlaskConical, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CRAFT_OPERATIONS, MAX_CRAFT_SELECTION, isCurrentCraftPreview,
  isValidDraftSelection, previewCraftOperation,
} from "@/lib/craftExperiments";
import type { CraftOperation, CraftPreview, DraftSelection } from "@/lib/craftExperiments";

interface Props {
  content: string;
  selection: DraftSelection | null;
  onApply: (preview: CraftPreview) => void;
  canUndo: boolean;
  onUndo: () => void;
}

/**
 * A small private workbench for the actual selection in the editor.
 * Previews are transient; mutations require a second, explicit user action.
 */
export function CraftExperiments({ content, selection, onApply, canUndo, onUndo }: Props) {
  const [preview, setPreview] = useState<CraftPreview | null>(null);
  const selected = isValidDraftSelection(content, selection) ? selection : null;
  const currentPreview = isCurrentCraftPreview(content, selection, preview) ? preview : null;

  function prepare(operation: CraftOperation) {
    setPreview(previewCraftOperation(content, selected, operation));
  }

  function apply() {
    if (!currentPreview) return;
    onApply(currentPreview);
    setPreview(null);
  }

  return (
    <Card className="bg-card/60 border-muted">
      <CardHeader>
        <CardTitle className="text-base font-literary flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-literary-sage" />
          Craft experiments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Select a word or short, single-line phrase in your writing. Explore a possible
          repetition, line break, or omission before applying it. Nothing changes automatically.
        </p>
        {selected ? (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Selected passage</p>
            <p className="font-literary whitespace-pre-wrap break-words rounded-md bg-background/70 p-3 text-sm">
              {selected.text}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground" role="status">
            Select up to {MAX_CRAFT_SELECTION} characters on one line of the writing canvas to begin.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {CRAFT_OPERATIONS.map(operation => (
            <Button key={operation.id} size="sm" variant="outline"
              disabled={!selected} onClick={() => prepare(operation.id)}
              title={operation.explanation}>
              Preview {operation.label.toLowerCase()}
            </Button>
          ))}
        </div>
        {currentPreview && (
          <section aria-label="Craft experiment preview" className="space-y-3 rounded-md border border-literary-sage/30 p-3">
            <p className="font-medium text-sm">
              Preview only: {CRAFT_OPERATIONS.find(item => item.id === currentPreview.operation)?.label}
            </p>
            <p className="text-xs text-muted-foreground">
              Complete draft preview. Read the change in context before deciding.
            </p>
            <pre aria-label="Proposed full draft" className="font-literary text-sm whitespace-pre-wrap break-words overflow-y-auto max-h-48">
              {currentPreview.result}
            </pre>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={apply}>Apply preview to draft</Button>
              <Button size="sm" variant="ghost" onClick={() => setPreview(null)}>Cancel preview</Button>
            </div>
          </section>
        )}
        {canUndo && (
          <div className="space-y-2 border-t border-muted pt-3">
            <p className="text-xs text-muted-foreground">
              Undo the last craft experiment while its result is still unchanged.
            </p>
            <Button size="sm" variant="outline" onClick={onUndo}>
              <RotateCcw className="mr-1 h-4 w-4" /> Undo experiment
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          These mechanical changes are creative options, not judgments of literary quality.
          The full poem stays in your browser and is saved only through Save poem.
        </p>
      </CardContent>
    </Card>
  );
}
