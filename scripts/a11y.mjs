import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";

const root = "http://127.0.0.1:4173/verse/";
const browser = await chromium.launch({ headless: true });
const findings = [];
const reports = [];
try {
  for (const viewport of [
    { width: 1280, height: 850, label: "desktop" },
    { width: 390, height: 844, label: "mobile" },
  ]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    page.on("dialog", dialog => dialog.accept());

    for (const route of ["/", "/write", "/collection"]) {
      if (route === "/collection") {
        await page.goto(root + "write");
        await page.locator("#poem-title").fill("Accessibility Test Poem");
        await page.locator("#poem-content").fill("A sample written for accessibility testing.");
        await page.getByRole("button", { name: "Save poem" }).click();
        await page.getByText("Saved", { exact: true }).first().waitFor();
      }
      await page.goto(root + route.replace(/^\//, ""));
      await page.locator("#root").waitFor({ state: "visible" });
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const violations = result.violations.map(v => ({
        id: v.id, impact: v.impact, help: v.help, helpUrl: v.helpUrl,
        nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })),
      }));
      reports.push({ viewport: viewport.label, route, violations });
      if (violations.length > 0) findings.push({ viewport: viewport.label, route, violations });
    }
    await context.close();
  }
} finally {
  await browser.close();
  await mkdir("test-artifacts", { recursive: true });
  await writeFile("test-artifacts/axe-results.json", JSON.stringify(reports, null, 2));
}
if (findings.length) {
  console.error("WCAG_AUDIT_FINDINGS", JSON.stringify(findings, null, 2));
  throw new Error(`Automated accessibility audit failed for ${findings.length} views`);
}
console.log("PASS: WCAG 2.0/2.1 A and AA axe rules across 3 routes at 2 viewport sizes");
