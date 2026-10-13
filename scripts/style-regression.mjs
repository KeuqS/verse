import assert from "node:assert/strict";
import { chromium, firefox, webkit } from "playwright";

const engine = process.env.VERSE_BROWSER || "chromium";
const browsers = { chromium, firefox, webkit };
const browser = await browsers[engine].launch({ headless: true });
const base = "http://127.0.0.1:4173/verse/";

async function check(viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  try {
    await page.goto(base);
    await page.evaluate(() => document.fonts.ready);
    const landing = await page.evaluate(() => {
      const hero = document.querySelector("main h2");
      const action = document.querySelector("a[href$='/write']");
      if (!hero || !action) throw new Error("Required landing elements absent");
      const h = getComputedStyle(hero);
      const b = getComputedStyle(document.body);
      const a = getComputedStyle(action);
      return {
        titleFamily: h.fontFamily,
        titleWeight: h.fontWeight,
        titleSize: parseFloat(h.fontSize),
        bodyBackground: b.backgroundColor,
        actionBackground: a.backgroundColor,
        actionRadius: a.borderRadius,
        hasOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      };
    });
    assert.match(landing.titleFamily, /Crimson Text/i);
    assert.ok(landing.titleSize >= (viewport.width < 600 ? 42 : 52), JSON.stringify(landing));
    assert.notEqual(landing.bodyBackground, "rgba(0, 0, 0, 0)");
    assert.notEqual(landing.actionBackground, "rgba(0, 0, 0, 0)");
    assert.equal(landing.hasOverflow, false, JSON.stringify(landing));

    await page.goto(base + "write");
    const writing = await page.evaluate(() => {
      const main = document.querySelector("main > div");
      const input = document.querySelector("#poem-content");
      if (!main || !input) throw new Error("Writing grid or editor not found");
      const display = getComputedStyle(main);
      const font = getComputedStyle(input);
      return {
        grid: display.display,
        columns: display.gridTemplateColumns.split(" ").length,
        font: font.fontFamily,
        hasOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      };
    });
    assert.equal(writing.grid, "grid");
    assert.match(writing.font, /Crimson Text/i);
    assert.equal(writing.hasOverflow, false, JSON.stringify(writing));

    await page.getByLabel("Poem", { exact: true }).fill("Toast animation regression");
    await page.getByRole("button", { name: "Save poem" }).click();
    await page.getByText("Poem saved").first().waitFor();
    const animation = await page.locator("[data-state='open'].verse-toast").first()
      .evaluate(e => getComputedStyle(e).animationName);
    assert.ok(animation.includes("verse-toast-enter"), `Unexpected toast animation ${animation}`);
    console.log(`PASS (${engine}, ${viewport.width}px): theme, local fonts, responsive grid, landing, toast animation`);
  } finally {
    await context.close();
  }
}

try {
  await check({ width: 375, height: 812 });
  await check({ width: 1440, height: 900 });
} finally {
  await browser.close();
}
