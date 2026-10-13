/**
 * Explicit, deterministic editing experiments applied to a user's selected text.
 * All indices are UTF-16 offsets from the native textarea selection API.
 * The complete source snapshot is checked before creating or applying a preview.
 * No network, language model or hidden poem analysis participates.
 */
export type CraftOperation = "echo" | "isolate" | "omit";

export interface DraftSelection {
  start: number;
  end: number;
  text: string;
  source: string;
}

export interface CraftPreview {
  operation: CraftOperation;
  selection: DraftSelection;
  source: string;
  result: string;
}

export const CRAFT_OPERATIONS: readonly {
  id: CraftOperation;
  label: string;
  explanation: string;
}[] = [
  { id: "echo", label: "Echo", explanation: "Repeat the selected phrase on a new line, as an experiment in refrain." },
  { id: "isolate", label: "Isolate", explanation: "Set the selected phrase apart with line breaks. Surrounding spaces are preserved." },
  { id: "omit", label: "Omit", explanation: "Remove the selected phrase to explore what its absence changes." },
];

export const MAX_CRAFT_SELECTION = 160;

/** Detect an index that bisects a UTF-16 surrogate pair. */
function splitsSurrogate(value: string, offset: number): boolean {
  if (offset <= 0 || offset >= value.length) return false;
  const a = value.charCodeAt(offset - 1);
  const b = value.charCodeAt(offset);
  return a >= 0xd800 && a <= 0xdbff && b >= 0xdc00 && b <= 0xdfff;
}

/** Refuse invalid, stale, multiline, oversized and partially selected text. */
export function isValidDraftSelection(content: string, selection: DraftSelection | null): selection is DraftSelection {
  if (selection === null || selection.source !== content) return false;
  const { start, end, text } = selection;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end)) return false;
  if (start < 0 || start >= end || end > content.length) return false;
  if (end - start > MAX_CRAFT_SELECTION || !text.trim()) return false;
  if (text.includes("\n") || text.includes("\r")) return false;
  if (splitsSurrogate(content, start) || splitsSurrogate(content, end)) return false;
  return content.slice(start, end) === text;
}

export function previewCraftOperation(
  content: string,
  selection: DraftSelection | null,
  operation: CraftOperation,
): CraftPreview | null {
  if (!isValidDraftSelection(content, selection)) return null;
  const before = content.slice(0, selection.start);
  const after = content.slice(selection.end);
  let replacement: string;
  switch (operation) {
    case "echo":
      replacement = selection.text + "\n" + selection.text;
      break;
    case "isolate":
      replacement =
        (before.length && !before.endsWith("\n") ? "\n" : "") +
        selection.text +
        (after.length && !after.startsWith("\n") ? "\n" : "");
      break;
    case "omit":
      replacement = "";
      break;
    default:
      return null;
  }
  const result = before + replacement + after;
  // An empty poem cannot be saved; prevent irreversible-looking blanking.
  if (!result.trim() || result === content) return null;
  return { operation, selection, source: content, result };
}

/** An explicit preview is applicable only to its original unmodified draft. */
export function isCurrentCraftPreview(
  content: string,
  selection: DraftSelection | null,
  preview: CraftPreview | null,
): preview is CraftPreview {
  return preview !== null &&
    isValidDraftSelection(content, selection) &&
    preview.source === content &&
    preview.selection.start === selection.start &&
    preview.selection.end === selection.end &&
    preview.selection.text === selection.text &&
    preview.selection.source === selection.source &&
    previewCraftOperation(content, selection, preview.operation)?.result === preview.result;
}
