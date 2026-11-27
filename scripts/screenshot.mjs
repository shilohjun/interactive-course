import { chromium } from "@playwright/test";

const base = "http://localhost:5174/course/";
const browser = await chromium.launch({ channel: "chrome" });
const errors = [];

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});

await page.goto(base, { waitUntil: "networkidle" });
await page.getByRole("heading", { name: "Applied Linear Algebra" }).waitFor();
await page.screenshot({ path: ".cache/shot-map.png" });

await page.getByRole("button", { name: "Next course" }).click();
await page.getByRole("button", { name: "Next course" }).click();
await page.getByRole("button", { name: "About" }).click();
await page.screenshot({ path: ".cache/shot-map-mat3007.png" });

await page.goto(`${base}#/lecture/speyer-1a`, { waitUntil: "networkidle" });
await page.locator('img[alt^="Slide"]').waitFor();
await page.waitForTimeout(1000);
await page.screenshot({ path: ".cache/shot-player.png" });

await page.getByRole("button", { name: "Transcript" }).first().click();
await page.waitForTimeout(300);
await page.screenshot({ path: ".cache/shot-board.png" });

await page.getByRole("button", { name: "Lecture video" }).click();
await page.waitForTimeout(700);
await page.screenshot({ path: ".cache/shot-video.png" });
await page.getByRole("button", { name: "Hide" }).click();
await page.waitForTimeout(200);

await page.evaluate(() => {
  const video = document.querySelector("video");
  if (video) video.currentTime = 180;
});
await page.waitForTimeout(800);
await page.screenshot({ path: ".cache/shot-slide6.png" });

await page.getByRole("button", { name: /try it/i }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: ".cache/shot-explorable.png" });
await page.keyboard.press("Escape");
await page.waitForTimeout(300);

await page.evaluate(() => {
  const video = document.querySelector("video");
  if (video) video.currentTime = 80;
});
await page.waitForTimeout(800);
await page.screenshot({ path: ".cache/shot-exercise.png" });

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(base, { waitUntil: "networkidle" });
await mobile.waitForTimeout(600);
await mobile.screenshot({ path: ".cache/shot-mobile-home.png" });

await mobile.goto(`${base}#/lecture/speyer-1a`, { waitUntil: "networkidle" });
await mobile.waitForTimeout(1000);
await mobile.screenshot({ path: ".cache/shot-mobile-board.png" });

await mobile.getByRole("button", { name: "Transcript" }).first().click();
await mobile.waitForTimeout(300);
await mobile.screenshot({ path: ".cache/shot-mobile-transcript.png" });

const metrics = await page.evaluate(() => ({
  viewport: window.innerHeight,
  page: document.documentElement.scrollHeight,
}));
console.log("errors:", errors.length ? errors : "none");
console.log("player metrics:", metrics);
await browser.close();
