import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { LectureMeta, Transcript } from "../types";

const root = process.cwd();

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(join(root, path), "utf8")) as T;
}

const meta = readJson<LectureMeta>("public/course/lectures/speyer-1a/meta.json");
const transcript = readJson<Transcript>("public/course/lectures/speyer-1a/transcript.json");

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
