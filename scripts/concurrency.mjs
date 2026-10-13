import assert from "node:assert/strict";
import { chromium, firefox, webkit } from "playwright";
import { poemsIn } from "./browser-db.mjs";

const base = "http://127.0.0.1:4173/verse/";
const engine = process.env.VERSE_BROWSER || "chromium";
const browsers = { chromium, firefox, webkit };
if (!browsers[engine]) throw new Error("Unknown engine: " + engine);
const browser = await browsers[engine].launch({ headless: true });

async function waitFor(page, predicate, timeout = 15000) {
  const deadline = Date.now() + timeout;
  let current = [];
  while (Date.now() < deadline) {
    current = await poemsIn(page);
    if (predicate(current)) return current;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("IndexedDB polling timed out: " + JSON.stringify(current.map(p => ({ id: p.id, title: p.title }))));
}

async function open(context, path = "write") {
  const page = await context.newPage();
  await page.goto(base + path);
  return page;
}

async function save(page, title, content) {
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Poem", { exact: true }).fill(content);
  await page.getByRole("button", { name: "Save poem" }).click();
}

try {
  const context = await browser.newContext();
  const a = await open(context);
  const b = await open(context);
  await Promise.all([
    save(a, "Simultaneous A", "First distinct poem"),
    save(b, "Simultaneous B", "Second distinct poem"),
  ]);
  const initial = await waitFor(a, all => all.length === 2);
  assert.deepEqual(new Set(initial.map(p => p.content)), new Set(["First distinct poem", "Second distinct poem"]));

  // Concurrency stress: transactions across multiple tabs may not lose any ID.
  const pages = await Promise.all(Array.from({ length: 8 }, () => open(context)));
  await Promise.all(pages.map((page, i) => save(page, "Parallel " + i, "Exact poem " + i)));
  await waitFor(a, all => all.length === 10);
  const many = await poemsIn(a);
  assert.equal(new Set(many.map(p => p.id)).size, 10);

  // Stale same-poem revision is refused; the losing draft can be saved separately.
  const id = initial.find(p => p.title === "Simultaneous A").id;
  const editA = await open(context, "write?poem=" + encodeURIComponent(id));
  const editB = await open(context, "write?poem=" + encodeURIComponent(id));
  await editA.getByLabel("Poem", { exact: true }).waitFor();
  await editA.waitForTimeout(150);
  assert.equal(await editA.getByLabel("Poem", { exact: true }).inputValue(), "First distinct poem");
  assert.equal(await editB.getByLabel("Poem", { exact: true }).inputValue(), "First distinct poem");
  await editA.getByLabel("Poem", { exact: true }).fill("First revision A");
  await editB.getByLabel("Poem", { exact: true }).fill("Independent revision B");
  await editA.getByRole("button", { name: "Save poem" }).click();
  await waitFor(a, all => all.some(p => p.id === id && p.content === "First revision A"));
  await editB.getByRole("button", { name: "Save poem" }).click();
  await editB.getByRole("button", { name: "Save a separate copy" }).waitFor();
  assert.equal(await editB.getByLabel("Poem", { exact: true }).inputValue(), "Independent revision B");
  await editB.getByRole("button", { name: "Save a separate copy" }).click();
  await waitFor(a, all => all.some(p => p.content === "Independent revision B"));
  assert.equal((await poemsIn(a)).find(p => p.id === id).content, "First revision A");

  // An imported version-1 backup and another new poem both survive overlapping operations.
  const importer = await open(context, "collection");
  const creator = await open(context);
  const one = { id: "migrated-import", title: "Imported", content: "Backup document",
    is_public: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  await Promise.all([
    importer.getByLabel("Choose a Verse backup file").setInputFiles({
      name: "verse-backup.json", mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), poems: [one] })),
    }),
    save(creator, "During import", "Simultaneous with import"),
  ]);
  const all = await waitFor(a, all => all.some(p => p.id === "migrated-import") &&
    all.some(p => p.content === "Simultaneous with import"));
  assert.equal(all.length, 13);

  // Seed genuine legacy localStorage and verify non-destructive first-use migration.
  const legacyContext = await browser.newContext();
  const legacy = { id: "legacy-v1", title: "Legacy poem", content: "Written before IndexedDB",
    is_public: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  await legacyContext.addInitScript(record => {
    if (localStorage.getItem("verse_poems") === null)
      localStorage.setItem("verse_poems", JSON.stringify([record]));
  }, legacy);
  const migrated = await open(legacyContext, "collection");
  await migrated.getByText("Legacy poem").first().waitFor();
  assert.deepEqual((await poemsIn(migrated)).map(x => x.id), [legacy.id]);
  assert.equal(await migrated.evaluate(() => JSON.parse(localStorage.getItem("verse_poems"))[0].content), legacy.content);
  await migrated.reload();
  assert.deepEqual((await poemsIn(migrated)).map(x => x.id), [legacy.id]);
  await migrated.getByRole("button", { name: "Back to writing" }).click();
  await save(migrated, "New DB only", "Do not alter old key");
  await waitFor(migrated, docs => docs.length === 2);
  assert.equal(await migrated.evaluate(() => JSON.parse(localStorage.getItem("verse_poems")).length), 1);
  await legacyContext.close();

  // Invalid prior data must not be silently erased or considered migrated.
  const corruptContext = await browser.newContext();
  await corruptContext.addInitScript(() => localStorage.setItem("verse_poems", "invalid-original-json"));
  const corrupt = await open(corruptContext);
  await corrupt.getByRole("alert").first().waitFor();
  await corrupt.getByLabel("Poem", { exact: true }).fill("Preserve unsaved text");
  await corrupt.getByRole("button", { name: "Save poem" }).click();
  await corrupt.getByText("Save failed").first().waitFor();
  assert.equal(await corrupt.evaluate(() => localStorage.getItem("verse_poems")), "invalid-original-json");
  assert.equal(await corrupt.getByLabel("Poem", { exact: true }).inputValue(), "Preserve unsaved text");
  await corruptContext.close();

  // Disabled IndexedDB fails closed without inventing a successful save.
  const blockedContext = await browser.newContext();
  await blockedContext.addInitScript(() => Object.defineProperty(window, "indexedDB", { configurable: true, value: undefined }));
  const blocked = await open(blockedContext);
  await blocked.getByRole("alert").first().waitFor();
  await blocked.getByLabel("Poem", { exact: true }).fill("Cannot save in unavailable storage");
  await blocked.getByRole("button", { name: "Save poem" }).click();
  await blocked.getByText("Save failed").first().waitFor();
  assert.equal(await blocked.getByLabel("Poem", { exact: true }).inputValue(), "Cannot save in unavailable storage");
  await blockedContext.close();

  console.log(`PASS (${engine}): concurrent IndexedDB transactions, conflict recovery, backup import, lossless v1 migration, corrupt and blocked storage`);
  await context.close();
} finally {
  await browser.close();
}
