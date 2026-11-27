import type { Chapter, Cue } from "../types";
import {
  chapterAt,
  clampTime,
  cueIndexAt,
  firstTimeOfSlide,
  formatTime,
  nextSlide,
  slideAt,
  activeCueAt,
} from "./timeline";

const CUES: Cue[] = [
  { start: 0, end: 10, slide: 1, text: "one" },
  { start: 10, end: 20, slide: 1, text: "two" },
  { start: 20, end: 30, slide: 2, text: "three" },
  { start: 35, end: 45, slide: 3, text: "four" },
];

const CHAPTERS: Chapter[] = [
  { id: "a", title: "First", start: 0, slide: 1 },
  { id: "b", title: "Second", start: 20, slide: 2 },
  { id: "c", title: "Third", start: 35, slide: 3 },
];

describe("cueIndexAt", () => {
  it("returns -1 for an empty transcript", () => {
    expect(cueIndexAt([], 12)).toBe(-1);
  });

  it("finds the last cue that has started", () => {
    expect(cueIndexAt(CUES, -1)).toBe(-1);
    expect(cueIndexAt(CUES, 0)).toBe(0);
    expect(cueIndexAt(CUES, 9.99)).toBe(0);
    expect(cueIndexAt(CUES, 10)).toBe(1);
    expect(cueIndexAt(CUES, 34.9)).toBe(2);
    expect(cueIndexAt(CUES, 35)).toBe(3);
    expect(cueIndexAt(CUES, 1000)).toBe(3);
  });
});

describe("activeCueAt", () => {
  it("returns the cue containing t, end exclusive", () => {
    expect(activeCueAt(CUES, 0)).toBe(CUES[0]);
    expect(activeCueAt(CUES, 10)).toBe(CUES[1]);
    expect(activeCueAt(CUES, 30)).toBeNull();
    expect(activeCueAt(CUES, 33)).toBeNull();
    expect(activeCueAt(CUES, 35)).toBe(CUES[3]);
  });

  it("returns null when there is no transcript", () => {
    expect(activeCueAt([], 5)).toBeNull();
  });
});

describe("slideAt", () => {
  it("defaults to the first slide before the lecture starts", () => {
    expect(slideAt([], 0)).toBe(1);
    expect(slideAt(CUES, -3)).toBe(1);
  });

  it("keeps the last slide after the final cue", () => {
    expect(slideAt(CUES, 999)).toBe(3);
  });

  it("switches at the cue that starts a new slide", () => {
    expect(slideAt(CUES, 19.9)).toBe(1);
    expect(slideAt(CUES, 20)).toBe(2);
    expect(slideAt(CUES, 34)).toBe(2);
    expect(slideAt(CUES, 35)).toBe(3);
  });
});

describe("chapterAt", () => {
  it("finds the current chapter", () => {
    expect(chapterAt(CHAPTERS, 0)?.id).toBe("a");
    expect(chapterAt(CHAPTERS, 19.9)?.id).toBe("a");
    expect(chapterAt(CHAPTERS, 20)?.id).toBe("b");
    expect(chapterAt(CHAPTERS, 35)?.id).toBe("c");
  });

  it("returns null before the first chapter", () => {
    expect(chapterAt(CHAPTERS, -1)).toBeNull();
    expect(chapterAt([], 10)).toBeNull();
  });
});

describe("firstTimeOfSlide", () => {
  it("returns the first cue time for a slide", () => {
    expect(firstTimeOfSlide(CUES, 1)).toBe(0);
    expect(firstTimeOfSlide(CUES, 2)).toBe(20);
    expect(firstTimeOfSlide(CUES, 3)).toBe(35);
  });

  it("returns null for a slide that is never shown", () => {
    expect(firstTimeOfSlide(CUES, 9)).toBeNull();
  });
});

describe("nextSlide", () => {
  it("moves to the next or previous slide in the deck", () => {
    expect(nextSlide(CUES, 1, 1, 3)).toBe(2);
    expect(nextSlide(CUES, 2, 1, 3)).toBe(3);
    expect(nextSlide(CUES, 3, 1, 3)).toBe(3);
    expect(nextSlide(CUES, 1, -1, 3)).toBe(1);
    expect(nextSlide(CUES, 3, -1, 3)).toBe(2);
  });

  it("skips slides that have no cues", () => {
    const sparse: Cue[] = [
      { start: 0, end: 5, slide: 1, text: "a" },
      { start: 5, end: 10, slide: 3, text: "b" },
      { start: 10, end: 15, slide: 5, text: "c" },
    ];
    expect(nextSlide(sparse, 1, 1, 11)).toBe(3);
    expect(nextSlide(sparse, 3, 1, 11)).toBe(5);
    expect(nextSlide(sparse, 5, -1, 11)).toBe(3);
  });
});

describe("formatTime", () => {
  it("formats whole seconds as m:ss", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(75)).toBe("1:15");
    expect(formatTime(841)).toBe("14:01");
    expect(formatTime(59.6)).toBe("0:59");
  });

  it("never shows a negative or invalid time", () => {
    expect(formatTime(-5)).toBe("0:00");
    expect(formatTime(Number.NaN)).toBe("0:00");
  });
});

describe("clampTime", () => {
  it("keeps a seek inside the media", () => {
    expect(clampTime(5, 10)).toBe(5);
    expect(clampTime(-1, 10)).toBe(0);
    expect(clampTime(20, 10)).toBe(10);
  });

  it("falls back to zero when the duration is unknown", () => {
    expect(clampTime(5, Number.NaN)).toBe(0);
    expect(clampTime(Number.NaN, 10)).toBe(0);
  });
});
