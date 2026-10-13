import assert from "node:assert/strict";
import { chromium, firefox, webkit } from "playwright";
import { poemsIn } from "./browser-db.mjs";

const engine = process.env.VERSE_BROWSER || "chromium";
const browserType = { chromium, firefox, webkit }[engine];
if (!browserType) throw new Error("Unsupported browser: " + engine);

const browser = await browserType.launch({ headless: true });
const root = "http://127.0.0.1:4173/verse/";

try {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(root + "write");
  const editor = page.getByLabel("Poem", { exact: true });

  // Preview is a no-write operation: the poem stays unchanged until Apply.
  await editor.fill("Quiet river");
  await editor.selectText();
  await page.getByText("Selected passage", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Preview echo" }).click();
  await page.getByRole("region", { name: "Craft experiment preview" }).waitFor();
  assert.equal(await page.getByLabel("Proposed full draft").innerText(), "Quiet river\nQuiet river");
  assert.equal(await editor.inputValue(), "Quiet river");
  assert.deepEqual(await poemsIn(page), [], "Preview must not save or modify IndexedDB");

  // Applying a preview changes only the editor; a guarded undo restores it.
  await page.getByRole("button", { name: "Apply preview to draft" }).click();
  assert.equal(await editor.inputValue(), "Quiet river\nQuiet river");
  await page.getByRole("button", { name: "Undo experiment" }).click();
  assert.equal(await editor.inputValue(), "Quiet river");

  // The preview is invalidated if the writer changes the source.
  await editor.selectText();
  await page.getByRole("button", { name: "Preview echo" }).click();
  await page.getByRole("region", { name: "Craft experiment preview" }).waitFor();
  await editor.fill("Quiet river changed");
  assert.equal(await page.getByRole("region", { name: "Craft experiment preview" }).count(), 0);
  assert.equal(await page.getByRole("button", { name: "Apply preview to draft" }).count(), 0);
  assert.equal(await page.getByRole("button", { name: "Undo experiment" }).count(), 0);

  // Whole-poem omission would create an unsavable empty document.
  await editor.selectText();
  await page.getByRole("button", { name: "Preview omit" }).click();
  assert.equal(await page.getByRole("region", { name: "Craft experiment preview" }).count(), 0);
  assert.equal(await editor.inputValue(), "Quiet river changed");

  // A keyboard text selection within a longer line retains all outside bytes.
  await editor.fill("before green after");
  await editor.focus();
  await editor.press("Home");
  for (let index = 0; index < 7; index++) await page.keyboard.press("ArrowRight");
  await page.keyboard.down("Shift");
  for (let index = 0; index < 5; index++) await page.keyboard.press("ArrowRight");
  await page.keyboard.up("Shift");
  await page.getByText("green", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Preview isolate" }).click();
  await page.getByRole("region", { name: "Craft experiment preview" }).waitFor();
  assert.equal(await page.getByLabel("Proposed full draft").innerText(), "before \ngreen\n after");
  await page.getByRole("button", { name: "Apply preview to draft" }).click();
  assert.equal(await editor.inputValue(), "before \ngreen\n after");

  // A subsequent manual edit disables the earlier undo, preventing clobber.
  await editor.fill("New writing from the author");
  assert.equal(await page.getByRole("button", { name: "Undo experiment" }).count(), 0);
  await editor.selectText();
  await page.getByRole("button", { name: "Preview echo" }).click();
  await page.getByRole("button", { name: "Apply preview to draft" }).click();
  await page.getByRole("button", { name: "Save poem" }).click();
  await page.getByText("Poem saved").first().waitFor();
  const documents = await poemsIn(page);
  assert.equal(documents.length, 1);
  assert.equal(documents[0].content, "New writing from the author\nNew writing from the author");
  await page.getByRole("button", { name: "Undo experiment" }).click();
  await page.locator("header").getByText("Modified", { exact: true }).waitFor();
  assert.equal(await editor.inputValue(), "New writing from the author");

  console.log(`PASS (${engine}): local preview, guarded apply/undo, invalidation, keyboard selection and explicit saving`);
  await context.close();
} finally {
  await browser.close();
}
