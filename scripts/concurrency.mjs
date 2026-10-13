import assert from "node:assert/strict";
import { chromium, firefox, webkit } from "playwright";

const url = "http://127.0.0.1:4173/verse/";
const engine = process.env.VERSE_BROWSER || "chromium";
const browsers = { chromium, firefox, webkit };
if (!browsers[engine]) throw new Error("Unknown engine: " + engine);
const browser = await browsers[engine].launch({ headless: true });
const context = await browser.newContext();

async function pageAt(path = "write") {
  const page = await context.newPage();
  await page.goto(url + path);
  return page;
}

async function save(page, title, content) {
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Poem", { exact: true }).fill(content);
  await page.getByRole("button", { name: "Save poem" }).click();
}

async function poems(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("verse_poems") || "[]"));
}

/**
 * Playwright's default waitForFunction uses requestAnimationFrame, which is
 * suspended in background tabs in some browsers. Poll via the Node runner.
 */
async function waitFor(page, predicate, arg) {
  const deadline = Date.now() + 15000;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      if (await page.evaluate(predicate, arg)) return;
    } catch (error) {
      lastError = String(error);
    }
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  const diagnostic = await page.evaluate(async () => ({
    records: JSON.parse(localStorage.getItem("verse_poems") || "[]").map(p => ({ id: p.id, title: p.title })),
    locks: await navigator.locks.query(),
    errors: [...document.querySelectorAll('[role="alert"]')].map(x => x.textContent),
    toast: document.querySelector('[data-testid="verse-toast-viewport"]')?.textContent,
  })).catch(error => ({ diagnosticError: String(error) }));
  throw new Error(`Timed out waiting for storage or lock state: ${JSON.stringify(diagnostic)}, previous error: ${lastError}`);
}

try {
  const a = await pageAt();
  const b = await pageAt();
  const supported = await a.evaluate(() => Boolean(navigator.locks?.request));
  assert.ok(supported, "Web Locks must be supported for the current browser release");

  // A held lock forces two write operations to queue behind the same origin lock.
  await a.evaluate(() => {
    window.__ready = false;
    void navigator.locks.request("verse:verse_poems:exclusive:v1", { mode: "exclusive" }, async () => {
      window.__ready = true;
      await new Promise(resolve => { window.__release = resolve; });
    });
  });
  await waitFor(a,() => window.__ready);
  await save(a, "First concurrent title", "First concurrent poem");
  await save(b, "Second concurrent title", "Second concurrent poem");
  // Dispatching a UI click does not guarantee its asynchronous handler has
  // actually queued the lock request, especially under WebKit scheduling.
  await waitFor(a,async () => {
    const snapshot = await navigator.locks.query();
    return snapshot.pending.filter(lock => lock.name === "verse:verse_poems:exclusive:v1").length >= 2;
  });
  assert.deepEqual(await poems(a), [], "No write is allowed while the shared lock is held");
  await a.evaluate(() => window.__release());
  await waitFor(a,() => JSON.parse(localStorage.getItem("verse_poems") || "[]").length === 2);
  const committed = await poems(a);
  assert.equal(committed.length, 2);
  assert.deepEqual(new Set(committed.map(p => p.content)), new Set(["First concurrent poem", "Second concurrent poem"]));

  // The same saved poem edited in two tabs must conflict instead of last-write-wins.
  const id = committed.find(p => p.title === "First concurrent title").id;
  const editA = await pageAt("write?poem=" + encodeURIComponent(id));
  const editB = await pageAt("write?poem=" + encodeURIComponent(id));
  await waitFor(editA,() => document.querySelector("#poem-content")?.value === "First concurrent poem");
  await waitFor(editB,() => document.querySelector("#poem-content")?.value === "First concurrent poem");

  await editA.getByLabel("Poem", { exact: true }).fill("Author A's final revision");
  await editB.getByLabel("Poem", { exact: true }).fill("Author B's independent revision");
  await editA.getByRole("button", { name: "Save poem" }).click();
  await waitFor(editA,id => JSON.parse(localStorage.getItem("verse_poems") || "[]").some(p => p.id === id && p.content === "Author A's final revision"), id);
  await editB.getByRole("button", { name: "Save poem" }).click();
  await editB.getByRole("button", { name: "Save a separate copy" }).waitFor();
  assert.equal(await editB.getByLabel("Poem", { exact: true }).inputValue(), "Author B's independent revision");
  assert.equal((await poems(editB)).find(p => p.id === id).content, "Author A's final revision");
  await editB.getByRole("button", { name: "Save a separate copy" }).click();
  await waitFor(editB,() => JSON.parse(localStorage.getItem("verse_poems") || "[]").some(p => p.content === "Author B's independent revision"));
  const resolved = await poems(editB);
  assert.equal(resolved.length, 3);
  assert.equal(resolved.find(p => p.id === id).content, "Author A's final revision");

  // Import and new poem creation queued in either order must preserve both.
  const importer = await pageAt("collection");
  const creator = await pageAt();
  await a.evaluate(() => {
    window.__ready = false;
    void navigator.locks.request("verse:verse_poems:exclusive:v1", { mode: "exclusive" }, async () => {
      window.__ready = true;
      await new Promise(resolve => { window.__release = resolve; });
    });
  });
  await waitFor(a,() => window.__ready);
  const one = { id: "imported-concurrent", title: "Imported", content: "Imported text", is_public: false,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  const backup = JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), poems: [one] });
  await importer.getByLabel("Choose a Verse backup file").setInputFiles({
    name: "verse-backup.json", mimeType: "application/json", buffer: Buffer.from(backup),
  });
  // File.text() resolves asynchronously, and event dispatch does not establish
  // that importPoems has reached the lock. Wait for its queued request first.
  await waitFor(a,async () => {
    const snapshot = await navigator.locks.query();
    return snapshot.pending.some(lock => lock.name === "verse:verse_poems:exclusive:v1");
  });
  await save(creator, "New while restoring", "New poem while restoring");
  // Both operations must be queued BEFORE unlocking; no timing assumption.
  await waitFor(a,async () => {
    const snapshot = await navigator.locks.query();
    return snapshot.pending.filter(lock => lock.name === "verse:verse_poems:exclusive:v1").length >= 2;
  });
  await a.evaluate(() => window.__release());
  await importer.getByText("Backup restored").first().waitFor();
  await waitFor(creator,() => JSON.parse(localStorage.getItem("verse_poems") || "[]").some(p => p.content === "New poem while restoring"));
  await waitFor(importer,() => JSON.parse(localStorage.getItem("verse_poems") || "[]").some(p => p.id === "imported-concurrent"));
  const both = await poems(creator);
  assert.equal(both.length, 5, "Merge-only restore and concurrent save must preserve all five poems");

  // Unsupported-lock browsers refuse writes instead of silently risking data loss.
  const unsupported = await browser.newContext();
  await unsupported.addInitScript(() => {
    Object.defineProperty(navigator, "locks", { configurable: true, value: undefined });
  });
  const denied = await unsupported.newPage();
  await denied.goto(url + "write");
  await denied.getByLabel("Poem", { exact: true }).fill("Never silently discard");
  await denied.getByRole("button", { name: "Save poem" }).click();
  await denied.getByText("Save failed").first().waitFor();
  assert.equal(await denied.getByLabel("Poem", { exact: true }).inputValue(), "Never silently discard");
  assert.equal(await denied.evaluate(() => localStorage.getItem("verse_poems")), null);
  await unsupported.close();

  console.log(`PASS (${engine}): serialized concurrent saves/imports; stale edit refusal; explicit conflict copy; unsupported-lock fail-closed`);
} finally {
  await context.close();
  await browser.close();
}
