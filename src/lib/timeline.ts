import type { Chapter, Cue } from "../types";

/** Index of the last cue that has started at `t`, or -1. Cues must be sorted by start. */
export function cueIndexAt(cues: Cue[], t: number): number {
  if (!Number.isFinite(t) || cues.length === 0) return -1;
  let low = 0;
  let high = cues.length - 1;
  let found = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (cues[mid].start <= t) {
      found = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return found;
}

/** The cue whose [start, end) interval contains `t`. */
export function activeCueAt(cues: Cue[], t: number): Cue | null {
  const index = cueIndexAt(cues, t);
  if (index === -1) return null;
  const cue = cues[index];
  return t < cue.end ? cue : null;
}

/** Slide shown at `t`; 1 before the first cue and after empty transcripts. */
export function slideAt(cues: Cue[], t: number): number {
  const index = cueIndexAt(cues, t);
  return index === -1 ? 1 : cues[index].slide;
}

/** Chapter containing `t`, or null before the first chapter. */
export function chapterAt(chapters: Chapter[], t: number): Chapter | null {
  if (!Number.isFinite(t) || chapters.length === 0) return null;
  let low = 0;
  let high = chapters.length - 1;
  let found = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (chapters[mid].start <= t) {
      found = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return found === -1 ? null : chapters[found];
}

/** Time of the first cue on `slide`, or null when the slide is never shown. */
export function firstTimeOfSlide(cues: Cue[], slide: number): number | null {
  let best: number | null = null;
  for (const cue of cues) {
    if (cue.slide === slide && (best === null || cue.start < best)) {
      best = cue.start;
    }
  }
  return best;
}

/**
 * The slide one step away from `current` in the requested direction, skipping
 * slides that have no cues. Stays at `current` at the edges.
 */
export function nextSlide(
  cues: Cue[],
  current: number,
  direction: 1 | -1,
  slideCount: number,
): number {
  const slides = [...new Set(cues.map((cue) => cue.slide))].sort((a, b) => a - b);
  let target = current;

  if (direction === 1) {
    const next = slides.find((slide) => slide > current);
    if (next !== undefined) target = next;
  } else {
    for (let i = slides.length - 1; i >= 0; i -= 1) {
      if (slides[i] < current) {
        target = slides[i];
        break;
      }
    }
  }

  return Math.min(Math.max(target, 1), Math.max(1, slideCount));
}

/** `m:ss`, clamped at zero. */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, "0")}`;
}

/** Clamp a seek target into [0, duration]; 0 when the duration is unknown. */
export function clampTime(t: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  if (!Number.isFinite(t)) return 0;
  return Math.min(Math.max(t, 0), duration);
}
