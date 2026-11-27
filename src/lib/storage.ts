const PREFIX = "ic:v1:progress:";

type Progress = {
  time: number;
  updatedAt: number;
};

function key(id: string): string {
  return `${PREFIX}${id}`;
}

export function saveProgress(id: string, time: number): void {
  if (!Number.isFinite(time) || time < 0) return;
  const payload: Progress = { time: Math.round(time * 10) / 10, updatedAt: Date.now() };
  try {
    localStorage.setItem(key(id), JSON.stringify(payload));
  } catch {
    // Storage can be full or disabled; losing a resume point is acceptable.
  }
}

export function loadProgress(id: string): number | null {
  try {
    const raw = localStorage.getItem(key(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Progress>;
    const time = parsed.time;
    if (typeof time !== "number" || !Number.isFinite(time)) return null;
    if (time < 1 || time > 86_400) return null;
    return time;
  } catch {
    return null;
  }
}

export function clearProgress(id: string): void {
  try {
    localStorage.removeItem(key(id));
  } catch {
    // Ignore unavailable storage.
  }
}
