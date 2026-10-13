import assert from "node:assert/strict";
import { chromium, firefox, webkit } from "playwright";

const engine = process.env.VERSE_BROWSER || "chromium";
const browser = await ({ chromium, firefox, webkit })[engine].launch({ headless: true });
const base = "http://127.0.0.1:4173/verse/";

try {
  const context = await browser.newContext();
  // A tab can have stale in-memory state when BroadcastChannel is unavailable.
  // That must never make its downloaded backup omit committed documents.
  await context.addInitScript(() => {
    Object.defineProperty(window, "BroadcastChannel", { value: undefined, configurable: true });
  });

  const collection = await context.newPage();
  await collection.goto(base + "collection");
  await collection.getByText("Your collection is empty").waitFor();

  const editor = await context.newPage();
  await editor.goto(base + "write");
  await editor.getByLabel("Title").fill("Fresh export regression");
  await editor.getByLabel("Poem", { exact: true }).fill("Committed by a different tab");
  await editor.getByRole("button", { name: "Save poem" }).click();
  await editor.getByText("Poem saved").first().waitFor();

  assert.equal(await collection.getByText("Your collection is empty").count(), 1,
    "Collection's React state must intentionally be stale for this test");

  const downloadPromise = collection.waitForEvent("download");
  await collection.getByRole("button", { name: "Export backup" }).click();
  const download = await downloadPromise;
  const readable = await download.createReadStream();
  const chunks = [];
  for await (const chunk of readable) chunks.push(chunk);
  const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  assert.equal(data.schemaVersion, 1);
  assert.equal(data.poems.length, 1);
  assert.equal(data.poems[0].title, "Fresh export regression");
  assert.equal(data.poems[0].content, "Committed by a different tab");

  console.log(`PASS (${engine}): exported backup reflects committed IndexedDB state even while collection UI is stale`);
  await context.close();
} finally {
  await browser.close();
}
