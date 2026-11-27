import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import type { LectureMeta, Transcript } from "../types";
import { PlayerView } from "./PlayerView";

const META: LectureMeta = {
  id: "speyer-1a",
  title: "Introduction to linear algebra",
  subtitle: "Why do we study it?",
  courseId: "speyer-214",
  duration: 841,
  slides: { count: 11, pdf: "slides.pdf" },
  media: { file: "speyer-1a.mp4" },
  chapters: [
    { id: "what", title: "What is linear algebra?", start: 0, slide: 1 },
    { id: "why", title: "Why study it?", start: 106, slide: 4 },
    { id: "linear", title: "Everything is approximately linear", start: 262, slide: 6 },
    { id: "light", title: "Light travels in straight lines", start: 463, slide: 9 },
    { id: "data", title: "Data and nature", start: 633, slide: 10 },
  ],
  source: {
    instructor: "David E. Speyer",
    course: "Math 214 · Applied Linear Algebra",
    institution: "University of Michigan",
    courseUrl: "https://sites.lsa.umich.edu/speyer/conferences/linear-algebra-videos/",
    videoUrl: "https://www.youtube.com/watch?v=Cu5v0QY6cmk",
    licenseNote: "Public course material; no Creative Commons license is claimed.",
  },
};

const TRANSCRIPT: Transcript = {
  cues: [
    { start: 0, end: 32, slide: 1, text: "What is linear algebra, and why do we study it?" },
    { start: 33, end: 71, slide: 2, text: "Algebraically, we study linear equations." },
    { start: 72, end: 105, slide: 3, text: "Geometrically, we study flat objects." },
    { start: 106, end: 165, slide: 4, text: "Can simple concepts be interesting?" },
    { start: 166, end: 261, slide: 5, text: "Yes, and here is the first reason." },
    { start: 262, end: 399, slide: 6, text: "Everything is approximately linear." },
    { start: 400, end: 462, slide: 7, text: "This is true in the real world." },
    { start: 463, end: 632, slide: 9, text: "Light travels in straight lines." },
    { start: 633, end: 726, slide: 10, text: "Linear methods handle huge data." },
    { start: 727, end: 840, slide: 11, text: "The fundamental equations are linear." },
  ],
  exercises: [
    {
      after_slide: 3,
      label: "Start a question",
      problem: "linear-1",
      url: "http://101.33.230.189/?problem=linear-1",
    },
  ],
  explorables: [
    {
      id: "approx-linear",
      at: 262,
      slide: 6,
      label: "Try it: everything is approximately linear",
      module: "approx-linear",
    },
  ],
};

function setup(overrides: Partial<Parameters<typeof PlayerView>[0]> = {}) {
  const props: Parameters<typeof PlayerView>[0] = {
    meta: META,
    transcript: TRANSCRIPT,
    baseUrl: "/course/",
    time: 300,
    duration: 841,
    playing: false,
    rate: 1,
    videoRef: () => {},
    onLoadedMetadata: () => {},
    onToggle: vi.fn(),
    onSeek: vi.fn(),
    onRate: vi.fn(),
    onPause: vi.fn(),
    onPlay: vi.fn(),
    ...overrides,
  };
  const view = render(<PlayerView {...props} />);
  return { ...view, props };
}

describe("PlayerView", () => {
  it("shows the slide and active caption for the current time", () => {
    setup();
    const image = screen.getByAltText(/slide 6 of 11/i);
    expect(image.getAttribute("src")).toContain("slides/06.webp");

    const captions = screen.getByRole("region", { name: /transcript/i });
    const active = within(captions).getByRole("button", {
      name: /everything is approximately linear/i,
    });
    expect(active).toHaveAttribute("aria-current", "true");
  });

  it("seeks when a chapter is clicked", async () => {
    const { props } = setup();
    const chapters = screen.getByRole("navigation", { name: /chapters/i });
    await userEvent.click(
      within(chapters).getByRole("button", { name: /light travels in straight lines/i }),
    );
    expect(props.onSeek).toHaveBeenCalledWith(463);
  });

  it("seeks from the time ruler", () => {
    const { props } = setup();
    const ruler = screen.getByRole("slider", { name: "Seek" });
    fireEvent.change(ruler, { target: { value: "420" } });
    expect(props.onSeek).toHaveBeenCalledWith(420);
  });

  it("steps forward to the first cue of the next slide", async () => {
    const { props } = setup();
    await userEvent.click(screen.getByRole("button", { name: /next slide/i }));
    expect(props.onSeek).toHaveBeenCalledWith(400);
  });

  it("never crashes on an empty transcript", () => {
    setup({ transcript: { cues: [], exercises: [], explorables: [] } });
    const image = screen.getByAltText(/slide 1 of 11/i);
    expect(image.getAttribute("src")).toContain("slides/01.webp");
    const captions = screen.getByRole("region", { name: /transcript/i });
    expect(captions.querySelector('[aria-current="true"]')).toBeNull();
  });

  it("offers the exercise on its configured slide and opens a new tab", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const { props } = setup({ time: 80 });
    const link = screen.getByRole("link", { name: /start a question/i });
    await userEvent.click(link);
    expect(props.onPause).toHaveBeenCalled();
    expect(open).toHaveBeenCalledWith(
      "http://101.33.230.189/?problem=linear-1",
      "_blank",
      "noopener,noreferrer",
    );
    open.mockRestore();
  });

  it("pauses for the explorable and restores time and play state on close", async () => {
    const { props } = setup({ playing: true });
    await userEvent.click(screen.getByRole("button", { name: /try it/i }));
    expect(props.onPause).toHaveBeenCalled();
    const dialog = screen.getByRole("dialog", { name: /explorable/i });
    await userEvent.click(within(dialog).getByRole("button", { name: /close/i }));
    expect(props.onSeek).toHaveBeenCalledWith(300);
    expect(props.onPlay).toHaveBeenCalled();
  });
});
