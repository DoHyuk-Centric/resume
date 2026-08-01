import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import puppeteer from "puppeteer";

const outputDir = resolve(import.meta.dirname, "../myblog");
const url = "https://dohyuk.dev/pages/about.html";
const browser = await puppeteer.launch({ headless: true });

async function capture(name, viewport, mode) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.evaluate(async (captureMode) => {
    await document.fonts.ready;
    const content = captureMode === "desktop"
      ? document.querySelector("#winXPContents")?.parentElement
      : document.querySelector("#mobileHome")?.parentElement;
    if (content) {
      content.style.setProperty("display", "flex", "important");
      content.style.position = "fixed";
      content.style.inset = "0";
      content.style.zIndex = "9999";
      content.style.width = "100vw";
      content.style.height = "100vh";
      content.dataset.captureTarget = "true";
    }
  }, mode);
  await page.waitForSelector('[data-capture-target="true"]');
  await new Promise((resolveWait) => setTimeout(resolveWait, 700));
  const section = await page.$('[data-capture-target="true"]');
  await section.screenshot({ path: resolve(outputDir, name) });
  await page.close();
}

async function captureViewport(name, pageUrl, viewport) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.goto(pageUrl, { waitUntil: "networkidle0" });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.screenshot({ path: resolve(outputDir, name) });
  await page.close();
}

async function captureAboutSections() {
  const captureDir = resolve(outputDir, "about-sections");
  await mkdir(captureDir, { recursive: true });

  const page = await browser.newPage();
  await page.setViewport({ width: 2560, height: 1440, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    const container = document.querySelector("#maincontainer");
    if (container) {
      container.style.scrollSnapType = "none";
      container.style.scrollBehavior = "auto";
    }
  });

  const sectionCount = await page.$$eval("[data-section='about']", (sections) => sections.length);
  for (let index = 0; index < sectionCount; index += 1) {
    await page.evaluate((sectionIndex) => {
      const container = document.querySelector("#maincontainer");
      const sections = [...document.querySelectorAll("[data-section='about']")];
      if (container && sections[sectionIndex]) {
        container.scrollTop = sections[sectionIndex].offsetTop;
      }
    }, index);
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
    await page.screenshot({
      path: resolve(captureDir, `${String(index + 1).padStart(2, "0")}.png`),
    });
  }

  await page.close();
}

try {
  await capture("dohyuk-xp-desktop.png", { width: 1440, height: 900, deviceScaleFactor: 1 }, "desktop");
  await capture("dohyuk-mobile.png", { width: 390, height: 844, deviceScaleFactor: 1 }, "mobile");
  await captureViewport("dohyuk-blog-mobile.png", "https://dohyuk.dev/pages/devLog.html", { width: 390, height: 844, deviceScaleFactor: 1 });
  await captureAboutSections();
} finally {
  await browser.close();
}
