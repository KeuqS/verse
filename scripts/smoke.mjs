import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium, firefox, webkit } from "playwright";

const root = "http://127.0.0.1:4173/verse/";
const engine = process.env.VERSE_BROWSER || "chromium";
const types = { chromium, firefox, webkit };
if (!(engine in types)) throw new Error(`Unsupported browser: ${engine}`);
const browser = await types[engine].launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 850 },
  acceptDownloads: true,
});
const page = await context.newPage();
page.on("pageerror", error => console.error("BROWSER_EXCEPTION", error.stack || error.message));
page.on("console", message => {
  if (message.type() === "error" || message.type() === "warning") {
    console.error("BROWSER_CONSOLE", message.type(), message.text());
  }
});
page.on("requestfailed", request => console.error("FAILED_REQUEST", request.url(), request.failure()?.errorText));
page.on("response", response => {
  if (response.status() >= 400) console.error("HTTP_ERROR", response.status(), response.url());
});

const screenshots = `test-artifacts/${engine}`;
await mkdir(screenshots, { recursive: true });
page.on("dialog", dialog => dialog.accept());

async function navigate(url) {
  await page.goto(url);
  try {
    await page.locator("#root").waitFor({ state: "visible", timeout: 8000 });
  } catch (cause) {
    console.error("PAGE_DEBUG", await page.evaluate(() => ({
      title: document.title,
      url: location.href,
      root: document.getElementById("root")?.innerHTML.slice(0, 800),
      scripts: [...document.querySelectorAll("script")].map(s => s.src),
      links: [...document.querySelectorAll('link[rel="stylesheet"]')].map(l => l.href)
    })));
    throw cause;
  }
}

try {
  await navigate(root);
  await page.getByRole("heading", { name: "Refine Your Poetic Voice" }).waitFor();
  await page.screenshot({ path: `${screenshots}/landing.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${screenshots}/landing-mobile.png`, fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 2, `Landing horizontal overflow: ${overflow}px`);
  await page.setViewportSize({ width: 1280, height: 850 });
  await page.getByRole("link", { name: /Begin Writing/ }).click();
  await page.getByLabel("Title").fill("Smoke Test Poem");
  await page.locator("textarea").first().fill("very sad in the garden");
  await page.getByRole("button", { name: "Save poem" }).click();
  await page.getByText("Saved", { exact: true }).first().waitFor();
  await page.screenshot({ path: `${screenshots}/writing.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  // Wait for the responsive layout to finish painting before capturing a full-page screenshot.
  await page.getByText("Literary Influence", { exact: true }).waitFor({ state: "visible" });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const toastRect = await page.getByTestId("verse-toast-viewport").boundingBox();
  assert.ok(toastRect && toastRect.y > 844 / 2, "Mobile toast viewport must not cover the editor header");
  await page.screenshot({ path: `${screenshots}/writing-mobile.png`, fullPage: true });
  const editorOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(editorOverflow <= 2, `Writing page horizontal overflow: ${editorOverflow}px`);
  await page.setViewportSize({ width: 1280, height: 850 });

  await page.getByRole("button", { name: "My Collection" }).click();
  await page.getByRole("heading", { name: "My Collection" }).waitFor();
  await page.getByRole("button", { name: "Continue editing" }).click();
  await page.waitForFunction(() => document.querySelector("#poem-title")?.value === "Smoke Test Poem");
  assert.equal(await page.getByLabel("Title").inputValue(), "Smoke Test Poem");
  assert.equal(await page.locator("textarea").first().inputValue(), "very sad in the garden");

  await page.getByRole("button", { name: "Show examples" }).click();
  await page.locator('button:has-text("Apply to draft"):not([disabled])').first().click();
  assert.ok((await page.locator("textarea").first().inputValue()).includes("melancholy"));
  await page.getByRole("button", { name: "Save poem" }).click();
  await page.getByRole("button", { name: "My Collection" }).click();
  await page.getByRole("heading", { name: "My Collection" }).waitFor();
  await page.locator("button[aria-current='true']").first().waitFor();
  assert.equal(await page.locator("button[aria-current='true']").count(), 1);
  await page.screenshot({ path: `${screenshots}/collection.png`, fullPage: true });

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export backup" }).click();
  const download = await downloadPromise;
  await download.saveAs(`${screenshots}/verse-backup.json`);
  await page.getByRole("button", { name: "Delete selected poem" }).click();
  await page.getByText("Your collection is empty").waitFor();
  await page.getByLabel("Choose a Verse backup file").setInputFiles(`${screenshots}/verse-backup.json`);
  await page.getByRole("button", { name: "Continue editing" }).waitFor();

  await navigate(root);
  await page.getByRole("link", { name: /Upload a Poem/ }).click();
  await page.getByLabel("Choose a plain text poem").setInputFiles({
    name: "example.txt", mimeType: "text/plain", buffer: Buffer.from("A restored line"),
  });
  await page.getByRole("button", { name: "Use this text" }).click();
  assert.equal(await page.locator("textarea").first().inputValue(), "A restored line");

  await navigate(`${root}collection`);
  await page.getByRole("heading", { name: "My Collection" }).waitFor();
  console.log(`PASS (${engine}): routes, editing, save/update, examples, export/restore, text import`);
} catch (error) {
  await page.screenshot({ path: `${screenshots}/failure.png`, fullPage: true });
  throw error;
} finally {
  await context.close();
  await browser.close();
}
