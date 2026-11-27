import { expect, test } from "@playwright/test";

async function open(page: import("@playwright/test").Page) {
  await page.goto("/course/#/lecture/lecture-10");
  await page.waitForFunction(() => {
    const video = document.querySelector("video");
    return video !== null && video.readyState >= 1;
  });
}

test("Lecture 10 plays, follows chapters, and offers Chinese captions", async ({ page }) => {
  await open(page);

  const video = page.locator("video");
  await expect(page.getByAltText(/slide 1 of 134/i)).toBeVisible();
  expect(await video.evaluate((element) => element.duration)).toBeGreaterThan(6400);

  // Chapters land on their own slide of the 134-page deck.
  await page.getByRole("button", { name: "Chapters" }).click();
  const chapters = page.getByRole("navigation", { name: "Chapters" });
  await chapters.getByRole("button", { name: /Architecture/i }).click();
  await expect(page.getByAltText(/slide 36 of 134/i)).toBeVisible();

  // The official pack ships a Chinese line for every cue.
  const pills = page.locator(".caption__lang-switch button");
  await expect(pills).toHaveCount(3);
  await expect(page.locator(".caption__text--secondary")).toHaveCount(0);
  await pills.nth(2).click();
  const chinese = page.locator(".caption__text--secondary");
  await expect(chinese).toHaveCount(1);
  await expect(chinese).toContainText(/[\u4e00-\u9fff]/);

  // Bilingual transcript lines are there too.
  await page.locator(".player-bar").getByRole("button", { name: "Transcript" }).click();
  const transcript = page.getByRole("region", { name: "Transcript" });
  await expect(transcript.locator(".cue__text--secondary").first()).toContainText(
    /[\u4e00-\u9fff]/,
  );

  // And the clock really runs.
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.waitForTimeout(1200);
  expect(await video.evaluate((element) => element.currentTime)).toBeGreaterThan(
    1619,
  );
});
