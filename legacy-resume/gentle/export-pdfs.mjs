import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createServer } from "vite";
import puppeteer from "puppeteer";

const currentDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(currentDir, "..");

const server = await createServer({
  root,
  server: { port: 4175 },
});

await server.listen();
const base = server.resolvedUrls.local[0];
const browser = await puppeteer.launch({ channel: "chrome" });

async function exportResume() {
  const page = await browser.newPage();
  await page.goto(new URL("gentle/resume.html", base).href, {
    waitUntil: "networkidle0",
  });

  const validation = await page.evaluate(() => ({
    pageCount: document.querySelectorAll("main").length,
    hasGentlelion: document.body.innerText.includes("Gentlelion"),
    hasFrontie: document.body.innerText.includes("Frontie"),
    overflowPages: [...document.querySelectorAll("main")].filter(
      (item) => item.scrollHeight > item.clientHeight + 1,
    ).length,
  }));

  if (
    validation.pageCount !== 2 ||
    !validation.hasGentlelion ||
    validation.hasFrontie ||
    validation.overflowPages
  ) {
    throw new Error(`이력서 검증 실패: ${JSON.stringify(validation)}`);
  }

  await page.pdf({
    path: resolve(currentDir, "resume.pdf"),
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
  });
  await page.close();
  return validation;
}

async function exportPortfolio() {
  const page = await browser.newPage();
  await page.goto(new URL("gentle/portfolio.html", base).href, {
    waitUntil: "networkidle0",
  });

  const validation = await page.evaluate(() => ({
    slideCount: document.querySelectorAll(".slide").length,
    hasProjectFocus: ["Kanto", "DoHyuk.dev", "Gentlelion"].every((name) =>
      document.body.innerText.includes(name),
    ),
    hasFrontie: document.body.innerText.includes("Frontie"),
    overflowSlides: [...document.querySelectorAll(".slide")]
      .map((item, index) => ({
        slide: index + 1,
        height: item.scrollHeight - item.clientHeight,
        width: item.scrollWidth - item.clientWidth,
      }))
      .filter((item) => item.height > 1 || (item.slide !== 1 && item.width > 1)),
  }));

  if (
    validation.slideCount !== 13 ||
    !validation.hasProjectFocus ||
    validation.hasFrontie ||
    validation.overflowSlides.length
  ) {
    throw new Error(`포트폴리오 검증 실패: ${JSON.stringify(validation)}`);
  }

  await page.pdf({
    path: resolve(currentDir, "portfolio.pdf"),
    printBackground: true,
    preferCSSPageSize: true,
  });
  await page.close();
  return validation;
}

try {
  const resume = await exportResume();
  const portfolio = await exportPortfolio();
  console.log(
    `Gentlelion 반영본 PDF 생성 완료: 이력서 ${resume.pageCount}페이지, 포트폴리오 ${portfolio.slideCount}슬라이드`,
  );
} finally {
  await browser.close();
  await server.close();
}
