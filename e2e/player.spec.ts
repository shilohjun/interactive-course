import { expect, test } from "@playwright/test";

test("the media clock drives slides, captions, and chapters", async ({ page }) => {
  await page.goto("/course/#/lecture/speyer-1a");
  const video = page.locator("video");
  await page.waitForFunction(() => {
    const element = document.querySelector("video");
    return element !== null && element.readyState >= 1;
  });

  await expect(page.getByAltText(/slide 1 of 11/i)).toBeVisible();
  await page.getByRole("button", { name: "Play" }).click();
  await page.waitForTimeout(1500);
  expect(await video.evaluate((element) => element.currentTime)).toBeGreaterThan(1);
  await page.getByRole("button", { name: "Pause", exact: true }).click();

  const captions = page.getByRole("region", { name: "Transcript" });
  await captions.getByRole("button", { name: /We can have some very complicated/i }).click();
  await expect(page.getByAltText(/slide 6 of 11/i)).toBeVisible();
  await expect
    .poll(async () => video.evaluate((element) => element.currentTime))
    .toBeGreaterThan(177);

  const chapters = page.getByRole("navigation", { name: "Chapters" });
  await chapters.getByRole("button", { name: /Light travels in straight lines/i }).click();
  await expect(page.getByAltText(/slide 9 of 11/i)).toBeVisible();

  await page.getByRole("button", { name: "Next slide" }).click();
  await expect(page.getByAltText(/slide 10 of 11/i)).toBeVisible();
});

test("the exercise opens a new tab without moving the lecture", async ({ page }) => {
  await page.goto("/course/#/lecture/speyer-1a");
  await page.waitForFunction(() => {
    const element = document.querySelector("video");
    return element !== null && element.readyState >= 1;
  });

  await page.evaluate(() => {
    const video = document.querySelector("video");
    if (video) video.currentTime = 80;
    (window as unknown as { __opened: string[] }).__opened = [];
    window.open = (url?: string | URL) => {
      (window as unknown as { __opened: string[] }).__opened.push(String(url));
      return null;
    };
  });

  await expect(page.getByRole("link", { name: /start a question/i })).toBeVisible();
  await page.getByRole("link", { name: /start a question/i }).click();
  const opened = await page.evaluate(
    () => (window as unknown as { __opened: string[] }).__opened,
  );
  expect(opened).toEqual(["http://101.33.230.189/?problem=LINALG1"]);
});

test("the explorable pauses, then restores time and play state", async ({ page }) => {
  await page.goto("/course/#/lecture/speyer-1a");
  const video = page.locator("video");
  await page.waitForFunction(() => {
    const element = document.querySelector("video");
    return element !== null && element.readyState >= 1;
  });

  await page.getByRole("button", { name: "Play" }).click();
  await page.evaluate(() => {
    const element = document.querySelector("video");
    if (element) element.currentTime = 180;
  });
  await page.waitForTimeout(500);

  await page.getByRole("button", { name: /try it/i }).click();
  const dialog = page.getByRole("dialog", { name: /explorable/i });
  await expect(dialog).toBeVisible();
  await expect.poll(async () => video.evaluate((element) => element.paused)).toBe(true);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect
    .poll(async () => video.evaluate((element) => element.currentTime))
    .toBeGreaterThan(179);
  await expect.poll(async () => video.evaluate((element) => element.paused)).toBe(false);
});

test("a missing video leaves slides and captions usable", async ({ page }) => {
  await page.route("**/media/*.mp4", (route) => route.abort());
  await page.goto("/course/#/lecture/speyer-1a");
  await expect(page.getByText(/video unavailable/i)).toBeVisible();
  await expect(page.getByAltText(/slide 1 of 11/i)).toBeVisible();
  await expect(page.getByRole("region", { name: "Transcript" })).toBeVisible();
});
