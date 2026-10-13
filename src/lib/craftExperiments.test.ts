import assert from "node:assert/strict";
import test from "node:test";
import {
  CRAFT_OPERATIONS, MAX_CRAFT_SELECTION, isValidDraftSelection,
  isCurrentCraftPreview, previewCraftOperation,
} from "./craftExperiments.ts";
import type { DraftSelection } from "./craftExperiments.ts";

function pick(source: string, text: string, position = 0): DraftSelection {
  const start = source.indexOf(text, position);
  assert.notEqual(start, -1);
  return { source, text, start, end: start + text.length };
}

test("explicit operations have a documented, unique selection", () => {
  assert.deepEqual(CRAFT_OPERATIONS.map(x => x.id), ["echo", "isolate", "omit"]);
  assert.ok(CRAFT_OPERATIONS.every(x => x.explanation.length > 20));
});

test("preview changes only the selected span without normalizing surrounding text", () => {
  const original = "First line\nA gentle rain falls.\nLast line";
  const selection = pick(original, "gentle rain");
  const echo = previewCraftOperation(original, selection, "echo");
  assert.equal(echo?.result, "First line\nA gentle rain\ngentle rain falls.\nLast line");
  const isolate = previewCraftOperation(original, selection, "isolate");
  assert.equal(isolate?.result, "First line\nA \ngentle rain\n falls.\nLast line");
  const omit = previewCraftOperation(original, selection, "omit");
  assert.equal(omit?.result, "First line\nA  falls.\nLast line");
  for (const candidate of [echo, isolate, omit]) {
    assert.ok(isCurrentCraftPreview(original, selection, candidate));
    assert.equal(candidate?.source, original);
    assert.equal(candidate?.selection.text, "gentle rain");
  }
});

test("stale or changed selections fail closed", () => {
  const original = "the river moves";
  const selection = pick(original, "river");
  const preview = previewCraftOperation(original, selection, "echo");
  assert.ok(preview);
  assert.equal(isCurrentCraftPreview(original, selection, preview), true);
  assert.equal(isCurrentCraftPreview(original + "!", selection, preview), false);
  assert.equal(isCurrentCraftPreview(original, pick(original, "moves"), preview), false);
  assert.equal(isCurrentCraftPreview(original, null, preview), false);
  assert.equal(isValidDraftSelection(original, { ...selection, source: original + "!" }), false);
  assert.equal(isValidDraftSelection(original, { ...selection, text: "other" }), false);
  assert.equal(isValidDraftSelection(original, { ...selection, end: 100 }), false);
  assert.equal(isValidDraftSelection(original, { ...selection, start: -1 }), false);
  assert.equal(isValidDraftSelection(original, { ...selection, end: 3.5 }), false);
});

test("empty, multiline, whitespace and oversized selections are rejected", () => {
  assert.equal(previewCraftOperation("rain", pick("rain", "rain"), "omit"), null);
  assert.equal(previewCraftOperation("single", pick("single", "single"), "isolate"), null);
  assert.equal(previewCraftOperation("a\nb", pick("a\nb", "a\nb"), "echo"), null);
  assert.equal(previewCraftOperation("a b", pick("a b", " "), "echo"), null);
  const text = "a".repeat(MAX_CRAFT_SELECTION + 1);
  assert.equal(previewCraftOperation(text, pick(text, text), "echo"), null);
});

test("UTF-16 offsets remain stable for whole emoji and refuse partial surrogates", () => {
  const text = "a😀b";
  const whole = pick(text, "😀");
  assert.equal(whole.start, 1);
  assert.equal(whole.end, 3);
  assert.equal(previewCraftOperation(text, whole, "echo")?.result, "a😀\n😀b");
  const half = { source: text, text: text.slice(1, 2), start: 1, end: 2 };
  assert.equal(isValidDraftSelection(text, half), false);
});

test("preview can only apply to its original source and operation", () => {
  const content = "small bright room";
  const selection = pick(content, "bright");
  const planned = previewCraftOperation(content, selection, "isolate");
  assert.ok(planned);
  assert.equal(isCurrentCraftPreview(content, selection, { ...planned, result: "unexpected" }), false);
  assert.equal(isCurrentCraftPreview(planned.result, selection, planned), false);
});
