import assert from "node:assert/strict";
import { chromium, firefox, webkit } from "playwright";

const engine = process.env.VERSE_BROWSER || "chromium";
const type = { chromium, firefox, webkit }[engine];
if (!type) throw new Error("Unknown browser " + engine);
const browser = await type.launch({ headless: true });
const base = "http://127.0.0.1:4173/verse/";

try {
  const page = await browser.newPage();
  for (const path of ["", "write", "collection"]) {
    await page.goto(base + path);
    const favicon = page.locator('link[rel="icon"]');
    const href = await favicon.getAttribute("href");
    assert.ok(href?.endsWith("/verse/assets/verse-mark.jpg"), `Unexpected favicon: ${href}`);
    assert.equal(await favicon.getAttribute("type"), "image/jpeg");

    const title = await page.title();
    assert.ok(title.startsWith("Verse"));
    assert.ok(!title.includes(String.fromCodePoint(0x2014)));

    if (path !== "collection") {
      const headerLogo = page.locator('header img[src*="verse-mark.jpg"]');
      await headerLogo.waitFor({ state: "visible" });
      assert.equal(
        new URL(await headerLogo.getAttribute("src"), base).href,
        new URL(href, base).href,
        `Favicon and header brand art must use the identical URL on ${path || "landing"}`,
      );
      await headerLogo.evaluate(img => new Promise((resolve, reject) => {
        if (img.complete && img.naturalWidth > 0) return resolve();
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", () => reject(new Error("Header logo failed to load")), { once: true });
      }));
    }
    const copy = await page.locator("body").innerText();
    assert.ok(!copy.includes(String.fromCodePoint(0x2014)), "An em dash appeared on " + path);
  }

  await page.goto(base + "write");
  await page.getByLabel("Poem", { exact: true }).fill("walking through the garden");
  await page.getByRole("button", { name: "Show examples" }).click();
  assert.ok(!((await page.locator("body").innerText()).includes(String.fromCodePoint(0x2014))));

  console.log(`PASS (${engine}): favicon equals rendered brand mark; logo loads; no em dashes in page copy`);
  await browser.close();
} catch (err) {
  await browser.close();
  throw err;
}
