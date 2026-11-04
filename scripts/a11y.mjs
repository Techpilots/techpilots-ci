// Tillgänglighetskontroll med axe-core (WCAG 2.0/2.1 A + AA) av alla sidor i en statisk export.
// Användning: node a11y.mjs <exportmapp> <bas-url>
// Fel (exit 1) vid brott med påverkan "serious" eller "critical". Övriga skrivs som varningar.
import { readdir } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const dir = resolve(process.argv[2] ?? "out");
const base = (process.argv[3] ?? "http://localhost:4173").replace(/\/$/, "");
const viewports = [
  { name: "mobil 375", width: 375, height: 800 },
  { name: "desktop 1280", width: 1280, height: 800 },
];

async function htmlFiles(d) {
  const out = [];
  for (const e of await readdir(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) {
      if (e.name === "_next" || e.name.startsWith("__next")) continue;
      out.push(...(await htmlFiles(p)));
    } else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

const paths = (await htmlFiles(dir))
  .map((f) => "/" + relative(dir, f).replaceAll("\\", "/").replace(/(^|\/)index\.html$/, "$1").replace(/\.html$/, ""))
  .filter((p) => !/^\/(404|_not-found)$/.test(p) && !p.startsWith("/_"))
  .sort();

console.log(`Kontrollerar ${paths.length} sidor × ${viewports.length} bredder`);
const browser = await chromium.launch();
let failures = 0;
let warnings = 0;

for (const vp of viewports) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, reducedMotion: "reduce" });
  for (const path of paths) {
    const page = await ctx.newPage();
    await page.goto(base + path, { waitUntil: "networkidle" });
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    for (const v of violations) {
      const blocking = v.impact === "serious" || v.impact === "critical";
      blocking ? failures++ : warnings++;
      const level = blocking ? "error" : "warning";
      const nodes = v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ");
      console.log(`::${level} title=a11y ${v.id}::${path} (${vp.name}) ${v.help} [${v.impact}] ${nodes}`);
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();
console.log(`Klart: ${failures} fel, ${warnings} varningar`);
process.exit(failures ? 1 : 0);
