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
const workspaceRoot = resolve(root, "../..");
const output = resolve(root, "portfolio.pdf");

const server = await createServer({
  root,
  server: {
    port: 4174,
    strictPort: true,
    // Pretendard가 상위 workspace의 node_modules에 설치되어 있습니다.
    fs: { allow: [workspaceRoot] },
  },
});
await server.listen();
const base = server.resolvedUrls.local[0];
const url = new URL("portfolio.html", base).href;

const browser = await puppeteer.launch({
  headless: true,
  args: ["--font-render-hinting=none"],
});
try {
  const page = await browser.newPage();
  // A4 landscape를 96dpi CSS 픽셀로 환산한 고정 뷰포트입니다.
  // 실행한 브라우저 창이나 모니터 크기가 PDF 레이아웃에 개입하지 않게 합니다.
  await page.setViewport({ width: 1123, height: 794, deviceScaleFactor: 1 });
  await page.emulateMediaType("print");
  await page.goto(url, { waitUntil: "networkidle0" });

  // 웹폰트와 모든 이미지의 디코딩이 끝난 뒤에만 레이아웃을 검증합니다.
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
    slideCount: document.querySelectorAll(".slide").length,
    hasProjectFocus: ["Kanto", "DoHyuk.dev"].every((name) =>
      document.body.innerText.includes(name),
    ),
    overflowSlides: [...document.querySelectorAll(".slide")]
      .map((item, index) => ({
        slide: index + 1,
        height: item.scrollHeight - item.clientHeight,
        width: item.scrollWidth - item.clientWidth,
      }))
      // 1번 표지는 좌측 장식 SVG를 의도적으로 캔버스 밖에 배치합니다.
      .filter((item) => {
        const allowedDeviceOverflow = item.slide === 14 && item.height <= 30;
        return (!allowedDeviceOverflow && item.height > 1) || (item.slide !== 1 && item.width > 1);
      }),
  }));
  if (validation.slideCount !== 17 || !validation.hasProjectFocus || validation.overflowSlides.length) {
    throw new Error(`포트폴리오 레이아웃 검증 실패: ${JSON.stringify(validation)}`);
  }

  await page.pdf({
    path: output,
    width: "297mm",
    height: "210mm",
    scale: 1,
    printBackground: true,   // 커버/클로징 슬라이드 그라디언트, 태그 배경 포함
    preferCSSPageSize: true, // portfolio.html의 @page 규칙(A4 가로) 사용
  });

  console.log(`✅ PDF 생성 완료 (${validation.slideCount}슬라이드, 넘침 없음) → ${output}`);
} finally {
  await browser.close();
  await server.close();
}
