import assert from "node:assert/strict";
import test from "node:test";
import { makeBackup, mergePoems, parseBackup, readPoems, writePoems, POEMS_KEY } from "./poems.ts";
import type { Poem } from "./poems.ts";

const poem: Poem = {
  id: "poem-1", title: "First", content: "a line", is_public: false,
  created_at: "2026-10-12T00:00:00.000Z", updated_at: "2026-10-12T00:00:00.000Z",
};

test("round trip backup preserves writing and metadata", () => {
  assert.deepEqual(parseBackup(JSON.stringify(makeBackup([poem]))), [poem]);
});

test("import retains an existing poem on conflicting IDs", () => {
  const modified = { ...poem, content: "different" };
  assert.deepEqual(mergePoems([poem], [modified]), [poem]);
});

test("invalid backups never pass validation", () => {
  for (const text of ['{}', '{"schemaVersion":2,"poems":[]}', '{"schemaVersion":1,"poems":[{}]}', 'not json']) {
    assert.throws(() => parseBackup(text));
  }
  assert.throws(() => parseBackup(JSON.stringify(makeBackup([poem, poem]))));
});

test("storage reading and writing rejects corruption", () => {
  const data = new Map<string, string>();
  const fake = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
  writePoems([poem], fake);
  assert.deepEqual(readPoems(fake), [poem]);
  data.set(POEMS_KEY, "corrupt");
  assert.throws(() => readPoems(fake));
  assert.equal(data.get(POEMS_KEY), "corrupt");
});

test("write failure does not create a phantom success", () => {
  assert.throws(() => writePoems([poem], { setItem: () => { throw new Error("quota"); } }));
});
