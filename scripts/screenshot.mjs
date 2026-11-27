import { chromium } from "@playwright/test";

const base = "http://localhost:5174/course/";
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("requestfailed", (request) => {
  errors.push(`FAILED ${request.url()} ${request.failure()?.errorText ?? ""}`);
});

await page.goto(base, { waitUntil: "networkidle" });
await page.getByText("Applied Linear Algebra").waitFor();
await page.screenshot({ path: ".cache/shot-map.png", fullPage: true });

await page.goto(`${base}#/lecture/speyer-1a`, { waitUntil: "networkidle" });
await page.locator('img[alt^="Slide"]').waitFor();
await page.waitForTimeout(1200);
await page.screenshot({ path: ".cache/shot-player.png" });

await page.evaluate(() => {
  const video = document.querySelector("video");
  if (video) video.currentTime = 180;
});
await page.waitForTimeout(1000);
await page.screenshot({ path: ".cache/shot-slide6.png" });

await page.getByRole("button", { name: /try it/i }).click();
await page.waitForTimeout(700);
await page.screenshot({ path: ".cache/shot-explorable.png" });

await page.keyboard.press("Escape");
await page.waitForTimeout(400);

await page.evaluate(() => {
  const video = document.querySelector("video");
  if (video) video.currentTime = 80;
});
await page.waitForTimeout(1000);
await page.screenshot({ path: ".cache/shot-exercise.png" });

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(`${base}#/lecture/speyer-1a`, { waitUntil: "networkidle" });
await mobile.waitForTimeout(1200);
await mobile.screenshot({ path: ".cache/shot-mobile.png", fullPage: false });

console.log("errors:", errors.length ? errors : "none");
await browser.close();

