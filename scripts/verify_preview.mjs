import { chromium } from "@playwright/test";

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const failed = [];
page.on("response", (response) => {
  if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`);
});
page.on("console", (message) => {
  if (message.type() === "error") failed.push(`console: ${message.text()}`);
});

await page.goto("http://localhost:5176/course/#/lecture/speyer-1a", {
  waitUntil: "networkidle",
});
await page.waitForFunction(() => {
  const video = document.querySelector("video");
  return video !== null && video.readyState >= 1;
});
await page.evaluate(() => {
  const video = document.querySelector("video");
  if (video) video.currentTime = 180;
});
await page.waitForTimeout(800);
await page.screenshot({ path: ".cache/shot-prod.png" });
console.log("failed:", failed.length ? failed : "none");
await browser.close();
