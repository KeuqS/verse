import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const mark = "assets/verse-mark.jpg";
const favicon = "public/" + mark;
const files = ["index.html", "README.md"];
function collect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) collect(path);
    else if (/\.(ts|tsx|html)$/.test(entry.name)) files.push(path);
  }
}
collect("src");
if (!existsSync(favicon)) throw new Error("Shared favicon art is missing");
if (!existsSync("docs/assets/verse-readme-cover.svg")) throw new Error("Missing README editorial illustration");

const emDash = String.fromCodePoint(0x2014);
const violations = files.filter(path => readFileSync(path, "utf8").includes(emDash));
if (violations.length) {
  throw new Error("Em dash is prohibited in authored website copy and README: " + violations.join(", "));
}
for (const [path, reference] of [
  ["index.html", '%BASE_URL%' + mark],
  ["src/components/VerseMark.tsx", mark],
  ["README.md", "./public/" + mark],
  ["src/pages/Landing.tsx", "<VerseMark />"],
  ["src/pages/Index.tsx", "<VerseMark />"],
]) {
  if (!readFileSync(path, "utf8").includes(reference)) {
    throw new Error("Shared Verse brand mark missing from " + path);
  }
}
console.log("PASS: shared website and README brand mark; em-dash-free source content");
