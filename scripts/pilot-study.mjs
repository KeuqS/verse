import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium, firefox, webkit } from "playwright";

const engine = process.env.VERSE_BROWSER || "chromium";
const browserType = { chromium, firefox, webkit }[engine];
if (!browserType) throw new Error("Invalid browser: " + engine);
const browser = await browserType.launch({ headless: true });
const base = "http://127.0.0.1:4173/verse/";
const outgoing = [];

try {
  const context = await browser.newContext({ acceptDownloads: true });
  context.on("request", request => {
    if (!request.url().startsWith(new URL(base).origin + "/")) outgoing.push(request.url());
  });
  const page = await context.newPage();
  await page.goto(base + "study");

  await page.getByRole("heading", { name: "A small study of writing tools" }).waitFor();
  assert.equal(await page.getByRole("button", { name: "I choose to participate" }).isDisabled(), true);
  await page.getByLabel("Allocation code").fill("36");
  assert.equal(await page.getByRole("button", { name: "I choose to participate" }).isDisabled(), true);
  await page.getByLabel("Allocation code").fill("0");
  await page.getByRole("button", { name: "I choose to participate" }).click();

  const expected = [
    ["Station", "unaided"],
    ["Path", "examples"],
    ["Trees", "experiments"],
  ];
  for (let index = 0; index < expected.length; index++) {
    const [label, condition] = expected[index];
    await page.getByRole("heading", { name: `Task ${index + 1} of 3` }).waitFor();
    await page.getByText(`Allocation 0 · ${label}`).waitFor();
    const instructions = await page.locator("main").innerText();
    if (condition === "unaided") assert.match(instructions, /Revise the sample by typing/);
    if (condition === "examples") assert.match(instructions, /Choose Robert Frost/);
    if (condition === "experiments") assert.match(instructions, /use Craft experiments to preview/);

    const link = page.getByRole("link", { name: "Open writing room" });
    assert.equal(await link.getAttribute("target"), "_blank");
    assert.ok((await link.getAttribute("href")).endsWith("/verse/write"));

    await page.getByRole("group", { name: "Did you complete a revision?" })
      .getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("group", { name: "How useful was the assigned approach for this task?" })
      .getByRole("radio", { name: "4" }).check();
    await page.getByRole("group", { name: "How much difficulty did you encounter using the assigned approach?" })
      .getByRole("radio", { name: "2" }).check();
    await page.getByRole("group", { name: "Did you follow the assigned tool instructions?" })
      .getByRole("radio", { name: "Yes" }).check();
    await page.getByRole("button", { name: index === 2 ? "Record response and finish" : "Record response and continue" }).click();
  }

  await page.getByRole("heading", { name: "Session complete" }).waitFor();
  const downloadReady = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download responses" }).click();
  const download = await downloadReady;
  const json = await readFile(await download.path(), "utf8");
  const record = JSON.parse(json);
  assert.deepEqual(Object.keys(record).sort(), ["allocation", "protocol", "schemaVersion", "trials"]);
  assert.equal(record.allocation, 0);
  assert.equal(record.protocol, "verse-craft-pilot-v1");
  assert.deepEqual(record.trials.map(x => [x.condition, x.stimulusId]), [
    ["unaided", "station"], ["examples", "path"], ["experiments", "trees"],
  ]);
  assert.deepEqual(record.trials.map(x => x.usefulness), [4, 4, 4]);
  assert.deepEqual(record.trials.map(x => x.friction), [2, 2, 2]);
  assert.equal(json.includes("I feel very sad"), false);
  assert.equal(json.includes("the road splits"), false);
  assert.equal(json.includes("trees are tall"), false);
  assert.equal(json.includes("email"), false);

  await page.getByRole("button", { name: "Clear this session" }).click();
  await page.getByLabel("Allocation code").waitFor();
  await page.reload();
  await page.getByRole("button", { name: "I choose to participate" }).waitFor();
  assert.equal(await page.getByLabel("Allocation code").inputValue(), "");
  const state = await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }));
  assert.equal(state.local, 0, "Pilot form must not store responses in localStorage");
  assert.equal(state.session, 0, "Pilot form must not store responses in sessionStorage");
  assert.deepEqual(outgoing, [], "Pilot must never contact third-party hosts");
  console.log(`PASS (${engine}): opt-in pilot, three conditions, poem-free local export, clear and network isolation`);
  await context.close();
} finally {
  await browser.close();
}
