// portfolio.html → portfolio.pdf 자동 추출 (16:9 슬라이드, 1280x720px = 13.333in x 7.5in)
// 사용법:  npm run portfolio-pdf   (내부적으로 vite build 를 먼저 실행)
//
// resume.html의 export-pdf.mjs와 동일하게 vite preview 서버(http://)를 거칩니다.
// portfolio.html은 @page 규칙 대신 각 슬라이드에 명시적 px 크기 + break-after-page를
// 사용하므로, preferCSSPageSize 없이 width/height를 직접 지정합니다.
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { preview } from "vite";
import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const output = resolve(root, "portfolio.pdf");

const server = await preview({ root, preview: { port: 4174 } });
const base = server.resolvedUrls.local[0];
const url = new URL("portfolio.html", base).href;

const browser = await puppeteer.launch({ channel: "chrome" });
try {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle0" });

  await page.pdf({
    path: output,
    printBackground: true,   // 커버/클로징 슬라이드 그라디언트, 태그 배경 포함
    preferCSSPageSize: true, // portfolio.html의 @page 규칙(16:9 가로) 사용
  });

  console.log(`✅ PDF 생성 완료 → ${output}`);
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}
