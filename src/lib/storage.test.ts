import { clearProgress, loadProgress, saveProgress } from "./storage";

describe("progress storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips a lecture position", () => {
    saveProgress("speyer-1a", 12.53);
    expect(loadProgress("speyer-1a")).toBe(12.5);
  });

  it("returns null for an unknown lecture", () => {
    expect(loadProgress("nope")).toBeNull();
  });

  it("ignores malformed payloads", () => {
    localStorage.setItem("ic:v1:progress:bad", "{not json");
    expect(loadProgress("bad")).toBeNull();
  });

  it("ignores positions at the very start or absurd ones", () => {
    saveProgress("early", 0.4);
    expect(loadProgress("early")).toBeNull();

    saveProgress("late", 999999);
    expect(loadProgress("late")).toBeNull();
  });

  it("clears a position", () => {
    saveProgress("gone", 30);
    clearProgress("gone");
    expect(loadProgress("gone")).toBeNull();
  });
});
