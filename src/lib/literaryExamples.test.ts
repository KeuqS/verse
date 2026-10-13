import assert from "node:assert/strict";
import test from "node:test";
import {
  GENERAL_EXAMPLES, INFLUENCES, EXAMPLES_BY_INFLUENCE,
  examplesForInfluence, findExampleMatch, applyLiteraryExample,
} from "./literaryExamples.ts";

test("each selectable influence has distinct, authored craft exercises", () => {
  assert.equal(INFLUENCES.length, 12);
  assert.equal(new Set(INFLUENCES.map(poet => poet.id)).size, 12);
  assert.deepEqual(
    Object.keys(EXAMPLES_BY_INFLUENCE).sort(),
    INFLUENCES.map(poet => poet.id).sort(),
  );
  const identifiers: string[] = [];
  for (const poet of INFLUENCES) {
    const examples = examplesForInfluence(poet.id);
    assert.equal(examples, EXAMPLES_BY_INFLUENCE[poet.id]);
    assert.ok(examples.length >= 2, `No dedicated examples for ${poet.id}`);
    for (const item of examples) {
      identifiers.push(item.id);
      assert.ok(item.original_text.trim().length > 0);
      assert.ok(item.suggested_text.trim().length > 0);
      assert.notEqual(item.original_text, item.suggested_text);
      assert.ok(item.explanation.length > 20);
      assert.ok(applyLiteraryExample(item.original_text, item) === item.suggested_text);
    }
  }
  for (const item of GENERAL_EXAMPLES) identifiers.push(item.id);
  assert.equal(new Set(identifiers).size, identifiers.length, "Exercise IDs must be unique");
});

test("general exercises are an explicit selection and unknown saved IDs have safe fallback", () => {
  assert.equal(examplesForInfluence(), GENERAL_EXAMPLES);
  assert.equal(examplesForInfluence(""), GENERAL_EXAMPLES);
  assert.equal(examplesForInfluence("legacy-unknown-id"), GENERAL_EXAMPLES);
  assert.notEqual(examplesForInfluence("bishop"), GENERAL_EXAMPLES);
});

test("exact phrase substitution preserves the rest of the user's writing", () => {
  const example = { original_text: "very sad", suggested_text: "melancholy" };
  assert.deepEqual(findExampleMatch("a very sad, quiet poem", example.original_text), { start: 2, end: 10 });
  assert.equal(applyLiteraryExample("a very sad, quiet poem", example), "a melancholy, quiet poem");
  assert.equal(applyLiteraryExample("very sad\nvery sad", example), "melancholy\nvery sad");
  assert.equal(applyLiteraryExample("very sadness", example), null);
  assert.equal(applyLiteraryExample("unvery sad", example), null);
  assert.equal(applyLiteraryExample("VERY SAD", example), null);
  assert.equal(applyLiteraryExample("a very sadder sentence", example), null);
  assert.equal(applyLiteraryExample("unrelated text", example), null);
  assert.equal(findExampleMatch("anything", ""), null);
});

test("standalone phrase matching respects Unicode letter boundaries", () => {
  const item = { original_text: "time", suggested_text: "hour" };
  assert.equal(applyLiteraryExample("ététime", item), null);
  assert.equal(applyLiteraryExample("timeé", item), null);
  assert.equal(applyLiteraryExample("time!", item), "hour!");
  assert.equal(applyLiteraryExample("(time)", item), "(hour)");
  assert.equal(applyLiteraryExample("🔔time", item), "🔔hour");
});

test("literal matching treats punctuation as text, never regex patterns", () => {
  const item = { original_text: "a (memory)", suggested_text: "a recollection" };
  assert.equal(applyLiteraryExample("a (memory) and more", item), "a recollection and more");
  assert.equal(applyLiteraryExample("a memory and more", item), null);
});
