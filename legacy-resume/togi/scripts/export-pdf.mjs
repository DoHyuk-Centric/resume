import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createServer } from "vite";
import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const workspaceRoot = resolve(root, "../..");
const output = resolve(root, "resume.pdf");

const server = await createServer({
  root,
  server: {
    port: 4173,
    strictPort: true,
    fs: { allow: [workspaceRoot] },
  },
});

await server.listen();
const base = server.resolvedUrls.local[0];
const url = new URL("resume.html", base).href;

const browser = await puppeteer.launch({
  headless: true,
  args: ["--font-render-hinting=none"],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
  await page.emulateMediaType("print");
  await page.goto(url, { waitUntil: "networkidle0" });

  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map(async (image) => {
        if (!image.complete) {
          await new Promise((resolveImage) => {
            image.addEventListener("load", resolveImage, { once: true });
            image.addEventListener("error", resolveImage, { once: true });
          });
        }
        if (typeof image.decode === "function") {
          await image.decode().catch(() => {});
        }
      }),
    );
  });

  const validation = await page.evaluate(() => ({
    pageCount: document.querySelectorAll("main").length,
    overflowPages: [...document.querySelectorAll("main")].filter(
      (item) => item.scrollHeight > item.clientHeight + 1,
    ).length,
  }));

  if (validation.pageCount !== 3 || validation.overflowPages) {
    throw new Error(`이력서 레이아웃 검증 실패: ${JSON.stringify(validation)}`);
  }

  await page.pdf({
    path: output,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
  });

  console.log(`PDF 생성 완료 (${validation.pageCount}페이지) -> ${output}`);
} finally {
  await browser.close();
  await server.close();
}
