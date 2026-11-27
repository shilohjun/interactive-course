import { expect, test } from "@playwright/test";

/** Waits until the slide image is decoded, so the board knows its aspect ratio. */
async function ready(page: import("@playwright/test").Page) {
  await page.goto("/course/#/lecture/speyer-1a");
  await page.waitForFunction(() => {
    const img = document.querySelector(".board img");
    return img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0;
  });
}

const boardBox = async (page: import("@playwright/test").Page) => {
  const box = await page.locator("[data-board-drag]").boundingBox();
  if (!box) throw new Error("board has no box");
  return box;
};

test("the board starts fitted, then drags and resizes freely", async ({ page }) => {
  await ready(page);
  const wrap = page.locator("[data-board-drag]");

  // Fitted by default: it follows the layout, not an explicit box.
  await expect(wrap).not.toHaveClass(/board-wrap--floating/);
  const fitted = await boardBox(page);

  // Shrink first: a fitted board fills the area, so there is nowhere to move it.
  const handle = await page.locator(".board-resizer").boundingBox();
  if (!handle) throw new Error("no resize handle");
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x - 160, handle.y - 120, { steps: 8 });
  await page.mouse.up();

  await expect(wrap).toHaveClass(/board-wrap--floating/);
  const smaller = await boardBox(page);
  expect(smaller.width).toBeLessThan(fitted.width - 100);
  expect(smaller.width / smaller.height).toBeCloseTo(fitted.width / fitted.height, 1);

  // Drag the slide by its middle: left/top move, size stays put.
  const gripX = smaller.x + smaller.width / 2;
  const gripY = smaller.y + smaller.height / 2;
  await page.mouse.move(gripX, gripY);
  await page.mouse.down();
  await page.mouse.move(gripX + 60, gripY + 30, { steps: 8 });
  await page.mouse.up();

  const moved = await boardBox(page);
  expect(Math.round(moved.x - smaller.x)).toBeGreaterThan(50);
  expect(Math.round(moved.y - smaller.y)).toBeGreaterThan(20);
  expect(Math.abs(moved.width - smaller.width)).toBeLessThan(2);

  // Resize the other way: bigger again, still the same aspect ratio.
  const ratioBefore = moved.width / moved.height;
  const handle2 = await page.locator(".board-resizer").boundingBox();
  if (!handle2) throw new Error("no resize handle");
  await page.mouse.move(handle2.x + handle2.width / 2, handle2.y + handle2.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle2.x + 120, handle2.y + handle2.height / 2, { steps: 8 });
  await page.mouse.up();

  const resized = await boardBox(page);
  expect(resized.width).toBeGreaterThan(moved.width + 40);
  expect(resized.width / resized.height).toBeCloseTo(ratioBefore, 1);

  // Fit returns to the fitted, non-floating layout.
  await page.getByRole("button", { name: "Fit" }).click();
  await expect(wrap).not.toHaveClass(/board-wrap--floating/);
  const refitted = await boardBox(page);
  expect(Math.abs(refitted.x - fitted.x)).toBeLessThan(2);
  expect(Math.abs(refitted.width - fitted.width)).toBeLessThan(2);
});

test("the board remembers where it was left", async ({ page }) => {
  await ready(page);
  const wrap = page.locator("[data-board-drag]");
  const fitted = await boardBox(page);

  await page.mouse.move(fitted.x + fitted.width / 2, fitted.y + fitted.height / 2);
  await page.mouse.down();
  await page.mouse.move(fitted.x + fitted.width / 2 - 40, fitted.y + fitted.height / 2 + 25, {
    steps: 6,
  });
  await page.mouse.up();
  await expect(wrap).toHaveClass(/board-wrap--floating/);
  const placed = await boardBox(page);

  await page.reload();
  await ready(page);
  await expect(wrap).toHaveClass(/board-wrap--floating/);
  const restored = await boardBox(page);
  expect(Math.abs(restored.x - placed.x)).toBeLessThan(3);
  expect(Math.abs(restored.width - placed.width)).toBeLessThan(3);
});

test("the lecture video opens in the top-right corner and can be resized", async ({ page }) => {
  await ready(page);

  await page.getByRole("button", { name: "Lecture video" }).click();
  const pane = page.locator(".video-float");
  await expect(pane).toBeVisible();

  const viewport = page.viewportSize();
  if (!viewport) throw new Error("no viewport");
  const area = await page.locator(".board-area").boundingBox();
  if (!area) throw new Error("no board area");
  const opened = await pane.boundingBox();
  if (!opened) throw new Error("no video pane box");

  // Top-right of the board, clear of the transcript panel on the right.
  const gap = area.x + area.width - (opened.x + opened.width);
  expect(gap).toBeGreaterThanOrEqual(0);
  expect(gap).toBeLessThan(40);
  expect(opened.y - area.y).toBeLessThan(40);
  expect(opened.x + opened.width).toBeLessThan(viewport.width - 300);

  const handle = await page.locator(".video-float__resize-handle").boundingBox();
  if (!handle) throw new Error("no video resize handle");
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + 90, handle.y + 50, { steps: 8 });
  await page.mouse.up();

  const resized = await pane.boundingBox();
  if (!resized) throw new Error("no video pane box after resize");
  expect(resized.width).toBeGreaterThan(opened.width + 20);
  expect(resized.width / resized.height).toBeCloseTo(16 / 9, 1);
});
