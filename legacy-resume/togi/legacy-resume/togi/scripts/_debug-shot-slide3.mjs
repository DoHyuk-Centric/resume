import { resolve } from "node:path";
import { createServer } from "vite";
import puppeteer from "puppeteer";

const root = resolve(process.cwd());
const workspaceRoot = resolve(root, "../..");
const output = resolve(root, "scripts/_slide3-print.png");

const server = await createServer({
  root,
  server: {
    port: 4175,
    strictPort: true,
    fs: { allow: [workspaceRoot] },
  },
});
await server.listen();
const base = server.resolvedUrls.local[0];
const url = new URL("portfolio.html", base).href;

const browser = await puppeteer.launch({ headless: true, args: ["--font-render-hinting=none"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1123, height: 794, deviceScaleFactor: 2 });
  await page.emulateMediaType("print");
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map(async (image) => {
        if (!image.complete) {
          await new Promise((r) => {
            image.addEventListener("load", r, { once: true });
            image.addEventListener("error", r, { once: true });
          });
        }
        if (typeof image.decode === "function") await image.decode().catch(() => {});
      }),
    );
  });

  const count = await page.evaluate(() => document.querySelectorAll(".slide").length);
  console.log("url", url, "slide count", count);
  const slide3 = await page.evaluateHandle(() => document.querySelectorAll(".slide")[2]);
  const el = slide3.asElement();
  if (!el) throw new Error("slide 3 element not found");
  await el.screenshot({ path: output });
  console.log("saved", output);
} finally {
  await browser.close();
  await server.close();
}
