// resume.html → resume.pdf 자동 추출 (Ctrl+P 없이)
// 사용법:  npm run pdf
//
// file:// 의 CSS/CORS 문제를 피하기 위해 로컬 Vite 서버에서 원본 HTML을 렌더링합니다.
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createServer } from "vite";
import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const output = resolve(root, "resume.pdf");

const server = await createServer({ root, server: { port: 4173 } });
await server.listen();
const base = server.resolvedUrls.local[0]; // 예: http://localhost:4173/
const url = new URL("resume.html", base).href;

const browser = await puppeteer.launch({ channel: "chrome" });
try {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle0" });

  const validation = await page.evaluate(() => ({
    pageCount: document.querySelectorAll("main").length,
    hasRevisedIntro: document.body.innerText.includes("구조를 고민하고 실측"),
    hasRevisedProject: document.body.innerText.includes("팀 평가 96점, 파이널 프로젝트 5개 팀 중 1위"),
    overflowPages: [...document.querySelectorAll("main")].filter(
      (item) => item.scrollHeight > item.clientHeight + 1,
    ).length,
  }));
  if (
    validation.pageCount !== 2 ||
    !validation.hasRevisedIntro ||
    !validation.hasRevisedProject ||
    validation.overflowPages
  ) {
    throw new Error(`이력서 레이아웃 검증 실패: ${JSON.stringify(validation)}`);
  }

  await page.pdf({
    path: output,
    format: "A4",
    printBackground: true,   // 강조색 · 구분선 · 태그 배경 포함
    preferCSSPageSize: true, // resume.html 의 @page 규칙(A4) 사용
  });

  console.log(`✅ PDF 생성 완료 (${validation.pageCount}페이지, 넘침 없음) → ${output}`);
} finally {
  await browser.close();
  await server.close();
}
