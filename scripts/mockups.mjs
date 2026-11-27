import { chromium } from "@playwright/test";

const styles = [
  ["a-product", "a-product.html"],
  ["b-cinema", "b-cinema.html"],
  ["c-academic", "c-academic.html"],
  ["d-swiss", "d-swiss.html"],
  ["e-focus", "e-focus.html"],
];

const browser = await chromium.launch({ channel: "chrome" });
for (const [name, file] of styles) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`http://127.0.0.1:5180/.cache/mockups/${file}`, {
    waitUntil: "networkidle",
  });
  await page.waitForFunction(() => [...document.images].every((image) => image.complete));
  await page.screenshot({ path: `.cache/mockups/${name}.png` });
  await page.close();
  console.log(`shot ${name}`);
}
await browser.close();
