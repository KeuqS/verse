import assert from "node:assert/strict";
import { chromium, firefox, webkit } from "playwright";
import { poemsIn } from "./browser-db.mjs";

const engine = process.env.VERSE_BROWSER || "chromium";
const browsers = { chromium, firefox, webkit };
if (!browsers[engine]) throw new Error("Unknown browser: " + engine);

const root = "http://127.0.0.1:4173/verse/";
const browser = await browsers[engine].launch({ headless: true });

try {
  const context = await browser.newContext();
  const page = await context.newPage();

  // A history POP must not discard an edited draft.
  await page.goto(root);
  await page.getByRole("link", { name: /Begin Writing/ }).click();
  await page.getByLabel("Poem", { exact: true }).fill("A draft without a backup");
  await page.evaluate(() => history.back());
  await page.getByRole("heading", { name: "Unsaved draft" }).waitFor();
  assert.ok(page.url().endsWith("/verse/write"), "Browser Back unexpectedly left the editor");
  await page.getByRole("button", { name: "Keep writing" }).click();
  assert.equal(await page.getByLabel("Poem", { exact: true }).inputValue(), "A draft without a backup");

  // A normal in-app link receives the same protection, with no second prompt.
  await page.getByRole("button", { name: "My Collection" }).click();
  await page.getByRole("heading", { name: "Unsaved draft" }).waitFor();
  await page.getByRole("button", { name: "Discard changes and leave" }).click();
  await page.getByRole("heading", { name: "My Collection" }).waitFor();

  // Title-only edits are also draft changes, even before a poem has body text.
  await page.getByRole("button", { name: "Back to writing" }).click();
  await page.getByLabel("Title").fill("An unfinished title");
  await page.getByRole("button", { name: "My Collection" }).click();
  await page.getByRole("heading", { name: "Unsaved draft" }).waitFor();
  await page.getByRole("button", { name: "Keep writing" }).click();
  assert.equal(await page.getByLabel("Title").inputValue(), "An unfinished title");
  await page.getByRole("button", { name: "My Collection" }).click();
  await page.getByRole("button", { name: "Discard changes and leave" }).click();
  await page.getByRole("heading", { name: "My Collection" }).waitFor();

  // An explicitly confirmed text import clears the upload query and retains its draft.
  const upload = await context.newPage();
  upload.on("dialog", dialog => dialog.accept());
  await upload.goto(root + "write?upload=true");
  await upload.getByLabel("Choose a plain text poem").setInputFiles({
    name: "draft.txt", mimeType: "text/plain", buffer: Buffer.from("Imported unsaved draft"),
  });
  await upload.getByRole("button", { name: "Use this text" }).click();
  await upload.waitForURL(root + "write");
  assert.equal(await upload.getByLabel("Poem", { exact: true }).inputValue(), "Imported unsaved draft");
  await upload.getByRole("button", { name: "My Collection" }).click();
  await upload.getByRole("heading", { name: "Unsaved draft" }).waitFor();
  await upload.getByRole("button", { name: "Keep writing" }).click();
  await upload.close();

  // Deterministically defer delivery of a successful IndexedDB transaction's
  // completion event. The write is already committed, but the editor's awaited
  // save promise is still pending. This exercises a real user edit in that gap.
  const race = await context.newPage();
  await race.addInitScript(() => {
    window.__verseCommitGate = { hold: false, committed: false, release: null };
    const nativeTransaction = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (...args) {
      const tx = nativeTransaction.apply(this, args);
      if (tx.mode === "readwrite") {
        tx.addEventListener("complete", event => {
          if (!window.__verseCommitGate.hold) return;
          event.stopImmediatePropagation();
          window.__verseCommitGate.committed = true;
          window.__verseCommitGate.release = () => tx.dispatchEvent(new Event("complete"));
        }, { capture: true, once: true });
      }
      return tx;
    };
  });
  await race.goto(root + "write");
  await race.getByLabel("Poem", { exact: true }).fill("very sad");
  await race.getByRole("button", { name: "Show examples" }).click();
  await race.evaluate(() => { window.__verseCommitGate.hold = true; });
  await race.getByRole("button", { name: "Save poem" }).click();
  await race.waitForFunction(() => window.__verseCommitGate.committed);
  const applicable = race.locator('button:has-text("Apply to draft"):not([disabled])');
  await applicable.first().click();
  assert.equal(await race.getByLabel("Poem", { exact: true }).inputValue(), "melancholy");
  await race.evaluate(() => window.__verseCommitGate.release());
  await race.getByText("Poem saved").first().waitFor();
  await race.locator("header").getByText("Modified", { exact: true }).waitFor();

  const committed = await poemsIn(race);
  assert.equal(committed.length, 1);
  assert.equal(committed[0].content, "very sad", "The first save must contain only its submitted snapshot");
  await race.evaluate(() => { window.__verseCommitGate.hold = false; });
  await race.getByRole("button", { name: "Save poem" }).click();
  await race.locator("header").getByText("Saved", { exact: true }).waitFor();
  const finalPoems = await poemsIn(race);
  assert.equal(finalPoems.length, 1);
  assert.equal(finalPoems[0].content, "melancholy", "The later edit must be saved in a second revision");

  console.log(`PASS (${engine}): protected Back/link navigation, title-only drafts, explicit import, and mid-save edits`);
  await context.close();
} finally {
  await browser.close();
}
