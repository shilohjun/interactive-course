import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { LectureMeta, Transcript } from "../types";

const root = process.cwd();

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(join(root, path), "utf8")) as T;
}

const meta = readJson<LectureMeta>("public/course/lectures/speyer-1a/meta.json");
const transcript = readJson<Transcript>("public/course/lectures/speyer-1a/transcript.json");

const lecture10 = readJson<LectureMeta>("public/course/lectures/lecture-10/meta.json");
const lecture10Transcript = readJson<Transcript>(
  "public/course/lectures/lecture-10/transcript.json",
);

describe("Speyer 1a course pack", () => {
  it("has an ordered chapter list inside the deck", () => {
    expect(meta.chapters).toHaveLength(6);
    for (let index = 1; index < meta.chapters.length; index += 1) {
      expect(meta.chapters[index].start).toBeGreaterThan(meta.chapters[index - 1].start);
    }
    for (const chapter of meta.chapters) {
      expect(chapter.slide).toBeGreaterThanOrEqual(1);
      expect(chapter.slide).toBeLessThanOrEqual(meta.slides.count);
    }
  });

  it("has sorted cues with positive duration and valid slides", () => {
    expect(transcript.cues.length).toBeGreaterThan(50);
    const chapterIds = new Set(meta.chapters.map((chapter) => chapter.id));
    for (let index = 0; index < transcript.cues.length; index += 1) {
      const cue = transcript.cues[index];
      expect(cue.start).toBeLessThan(cue.end);
      expect(cue.slide).toBeGreaterThanOrEqual(1);
      expect(cue.slide).toBeLessThanOrEqual(meta.slides.count);
      expect(cue.text.length).toBeGreaterThan(0);
      if (cue.chapter) expect(chapterIds.has(cue.chapter)).toBe(true);
      if (index > 0) expect(cue.start).toBeGreaterThanOrEqual(transcript.cues[index - 1].start);
    }
    expect(transcript.cues[transcript.cues.length - 1].end).toBeGreaterThan(830);
  });

  it("links exactly one exercise and one explorable", () => {
    expect(transcript.exercises).toHaveLength(1);
    expect(transcript.exercises[0].url).toMatch(
      /^http:\/\/101\.33\.230\.189\/\?problem=/,
    );
    expect(transcript.explorables).toHaveLength(1);
    expect(transcript.explorables[0].module).toBe("approx-linear");
    expect(transcript.explorables[0].slide).toBe(6);
  });
});

describe("Lecture 10 course pack", () => {
  it("keeps every chapter inside the 134-page deck", () => {
    expect(lecture10.slides.count).toBe(134);
    expect(lecture10.chapters).toHaveLength(9);
    for (let index = 1; index < lecture10.chapters.length; index += 1) {
      expect(lecture10.chapters[index].start).toBeGreaterThan(
        lecture10.chapters[index - 1].start,
      );
    }
    for (const chapter of lecture10.chapters) {
      expect(chapter.slide).toBeGreaterThanOrEqual(1);
      expect(chapter.slide).toBeLessThanOrEqual(lecture10.slides.count);
    }
  });

  it("has sorted cues that stay inside the lecture", () => {
    const { cues } = lecture10Transcript;
    expect(cues.length).toBeGreaterThan(500);
    const chapterIds = new Set(lecture10.chapters.map((chapter) => chapter.id));
    for (let index = 0; index < cues.length; index += 1) {
      const cue = cues[index];
      expect(cue.start).toBeLessThan(cue.end);
      expect(cue.slide).toBeGreaterThanOrEqual(1);
      expect(cue.slide).toBeLessThanOrEqual(lecture10.slides.count);
      expect(cue.text.length).toBeGreaterThan(0);
      if (cue.chapter) expect(chapterIds.has(cue.chapter)).toBe(true);
      if (index > 0) expect(cue.start).toBeGreaterThanOrEqual(cues[index - 1].start);
    }
    expect(cues[cues.length - 1].end).toBeLessThanOrEqual(lecture10.duration);
    expect(cues[cues.length - 1].end).toBeGreaterThan(lecture10.duration - 10);
  });

  it("carries the official bilingual transcript", () => {
    const { cues } = lecture10Transcript;
    const withChinese = cues.filter((cue) => cue.text_zh && cue.text_zh.length > 0);
    expect(withChinese).toHaveLength(cues.length);
    // Chinese lines are Chinese, not a copy of the English.
    expect(withChinese[0].text_zh).not.toBe(withChinese[0].text);
    expect(withChinese[0].text_zh).toMatch(/[\u4e00-\u9fff]/);
  });

  it("ships one slide image per page and a deck to download", () => {
    const dir = join(root, "public/course/lectures/lecture-10");
    const images = readdirSync(join(dir, "slides")).filter((name) => name.endsWith(".webp"));
    expect(images).toHaveLength(lecture10.slides.count);
    expect(existsSync(join(dir, lecture10.slides.pdf))).toBe(true);
    expect(existsSync(join(dir, "transcript.json"))).toBe(true);
  });
});
