// resume.html → resume.pdf 자동 추출 (Ctrl+P 없이)
// 사용법:  npm run pdf   (내부적으로 vite build 를 먼저 실행)
//
// 왜 preview 서버를 쓰나:
//   Vite 빌드 결과물의 <link> 에는 crossorigin 속성이 붙습니다.
//   이걸 file:// 로 열면 CORS 정책상 CSS 가 차단되어 스타일이 사라집니다.
//   그래서 로컬 http 서버(vite preview)를 띄워 http:// 로 로드합니다.
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { preview } from "vite";
import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const output = resolve(root, "resume.pdf");

const server = await preview({ root, preview: { port: 4173 } });
const base = server.resolvedUrls.local[0]; // 예: http://localhost:4173/
const url = new URL("resume.html", base).href;

const browser = await puppeteer.launch({ channel: "chrome" });
try {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle0" });

  await page.pdf({
    path: output,
    format: "A4",
    printBackground: true,   // 강조색 · 구분선 · 태그 배경 포함
    preferCSSPageSize: true, // resume.html 의 @page 규칙(A4) 사용
  });

  console.log(`✅ PDF 생성 완료 → ${output}`);
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}
