// portfolio.html → portfolio.pdf 자동 추출 (A4 가로 슬라이드)
// 사용법:  npm run portfolio-pdf
//
// resume.html의 export-pdf.mjs와 동일하게 로컬 Vite 서버(http://)를 거칩니다.
// portfolio.html의 @page 규칙과 각 슬라이드의 break-after-page를 사용합니다.
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createServer } from "vite";
import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const output = resolve(root, "portfolio.pdf");

const server = await createServer({ root, server: { port: 4174 } });
await server.listen();
const base = server.resolvedUrls.local[0];
const url = new URL("portfolio.html", base).href;

const browser = await puppeteer.launch({ channel: "chrome" });
try {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle0" });

  const validation = await page.evaluate(() => ({
    slideCount: document.querySelectorAll(".slide").length,
    hasProjectFocus: ["Kanto", "DoHyuk.dev", "GentleLion"].every((name) =>
      document.body.innerText.includes(name),
    ),
    overflowSlides: [...document.querySelectorAll(".slide")]
      .map((item, index) => ({
        slide: index + 1,
        height: item.scrollHeight - item.clientHeight,
        width: item.scrollWidth - item.clientWidth,
      }))
      // 1번 표지는 좌측 장식 SVG를 의도적으로 캔버스 밖에 배치합니다.
      .filter((item) => item.height > 1 || (item.slide !== 1 && item.width > 1)),
  }));
  if (validation.slideCount !== 12 || !validation.hasProjectFocus || validation.overflowSlides.length) {
    throw new Error(`포트폴리오 레이아웃 검증 실패: ${JSON.stringify(validation)}`);
  }

  await page.pdf({
    path: output,
    printBackground: true,   // 커버/클로징 슬라이드 그라디언트, 태그 배경 포함
    preferCSSPageSize: true, // portfolio.html의 @page 규칙(16:9 가로) 사용
  });

  console.log(`✅ PDF 생성 완료 (${validation.slideCount}슬라이드, 넘침 없음) → ${output}`);
} finally {
  await browser.close();
  await server.close();
}
