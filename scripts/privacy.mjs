import assert from "node:assert/strict";
import { chromium, firefox, webkit } from "playwright";

// Privacy regression: independent browser profiles must never share saved poems.
// The sole permitted network destination is the preview site's own origin.
const base = "http://127.0.0.1:4173/verse/";
const browserName = process.env.VERSE_BROWSER || "chromium";
const browsers = { chromium, firefox, webkit };
if (!browsers[browserName]) throw new Error("Unknown browser: " + browserName);
const browser = await browsers[browserName].launch({ headless: true });
const token = "private-poem-7f39-DO-NOT-TRANSMIT";
const outbound = [];
const appOrigin = new URL(base).origin;

const register = context => context.on("request", request => {
  const url = request.url();
  if (!url.startsWith(appOrigin + "/")) outbound.push(url);
  if (url.includes(token) || url.includes(encodeURIComponent(token)) || (request.postData() || "").includes(token)) {
    outbound.push("Sensitive poem content included in network request: " + new URL(url).origin);
  }
});

try {
  const alice = await browser.newContext();
  const bob = await browser.newContext();
  register(alice);
  register(bob);
  const a = await alice.newPage();
  const b = await bob.newPage();

  await a.goto(base + "write");
  await a.getByLabel("Title").fill("Alice's private poem");
  await a.getByLabel("Poem", { exact: true }).fill(token);
  await a.getByRole("button", { name: "Save poem" }).click();
  await a.getByText("Saved", { exact: true }).first().waitFor();
  const aData = await a.evaluate(() => JSON.parse(localStorage.getItem("verse_poems") || "[]"));
  assert.equal(aData.length, 1);
  assert.equal(aData[0].content, token);

  await b.goto(base + "collection");
  await b.getByText("Your collection is empty").waitFor();
  const bData = await b.evaluate(() => localStorage.getItem("verse_poems"));
  assert.equal(bData, null, "Second user's independent browser storage must be empty");

  await b.getByRole("button", { name: "Begin writing" }).click();
  await b.getByLabel("Title").fill("Bob's poem");
  await b.getByLabel("Poem", { exact: true }).fill("Hello, world!");
  await b.getByRole("button", { name: "Save poem" }).click();
  await b.getByText("Saved", { exact: true }).first().waitFor();
  await a.reload();
  assert.equal((await a.evaluate(() => JSON.parse(localStorage.getItem("verse_poems") || "[]"))).length, 1);
  assert.equal((await a.evaluate(() => JSON.parse(localStorage.getItem("verse_poems") || "[]")))[0].content, token);
  assert.equal((await b.evaluate(() => JSON.parse(localStorage.getItem("verse_poems") || "[]")))[0].title, "Bob's poem");

  // Restoring a local editor must not require any external network or accounts.
  await a.goto(base + "collection");
  await a.getByRole("button", { name: "Continue editing" }).click();
  await a.getByLabel("Poem", { exact: true }).waitFor();
  await a.waitForFunction(text => document.querySelector("#poem-content")?.value === text, token);
  assert.equal(await a.getByLabel("Poem", { exact: true }).inputValue(), token);

  // Transmitting poem content to an external service requires an explicit confirmation.
  await a.getByRole("button", { name: "Save and show sharing options" }).click();
  let prompted = false;
  a.on("dialog", async dialog => {
    prompted = true;
    assert.match(dialog.message(), /send your poem text/i);
    await dialog.dismiss();
  });
  await a.getByRole("button", { name: "Tumblr" }).click();
  assert.ok(prompted, "External sharing must disclose that text will be transmitted");

  // Storage denied by the browser: fail visibly without claiming a successful save.
  const denied = await browser.newContext();
  await denied.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() { throw new DOMException("Blocked by user settings", "SecurityError"); },
    });
  });
  const d = await denied.newPage();
  await d.goto(base + "write");
  await d.getByRole("alert").first().waitFor();
  await d.getByLabel("Poem", { exact: true }).fill("Unsaved work must remain in the editor");
  await d.getByRole("button", { name: "Save poem" }).click();
  await d.getByText("Save failed").first().waitFor();
  assert.equal(await d.getByLabel("Poem", { exact: true }).inputValue(), "Unsaved work must remain in the editor");

  assert.deepEqual(outbound, [], "All ordinary application requests must stay on the self-hosted origin");
  console.log(`PASS (${browserName}): independent users, browser persistence, explicit outbound consent, denied-storage safety, zero third-party application requests`);
} finally {
  await browser.close();
}
