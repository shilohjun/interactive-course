import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CourseMapView } from "./CourseMap";
import type { CourseIndex } from "../types";

const DATA: CourseIndex = {
  site: {
    title: "Interactive Course",
    tagline: "A lecture you can stop, rewind, and take apart.",
    attribution: "Attribution line.",
    playerNote: "One clock drives the slide and transcript.",
  },
  shelf: [
    {
      id: "speyer-1a",
      code: "Math 214",
      course: "Applied Linear Algebra",
      title: "1a · Introduction to linear algebra",
      institution: "University of Michigan",
      instructor: "David E. Speyer",
      status: "live",
      href: "/lecture/speyer-1a",
      cover: { src: "course/lectures/speyer-1a/slides/06.webp" },
      meta: "14:01 · 11 slides · 6 chapters",
      sourceNote: "Math 214 · Applied Linear Algebra, University of Michigan",
      licenseNote: "Attribution only.",
    },
    {
      id: "speyer-1b",
      code: "Math 214",
      course: "Applied Linear Algebra",
      title: "1b · Solving linear systems",
      institution: "University of Michigan",
      instructor: "David E. Speyer",
      status: "soon",
      cover: { kicker: "Math 214", big: "Lecture 1b", small: "In preparation" },
      meta: "In preparation",
      sourceNote: "Math 214 · Applied Linear Algebra, University of Michigan",
      licenseNote: "Not built yet.",
    },
    {
      id: "mat3007",
      code: "MAT3007",
      course: "Optimization",
      title: "Optimality Conditions for Constrained Problems",
      institution: "CUHK-Shenzhen",
      instructor: "Rui Chen",
      status: "soon",
      cover: { src: "course/lectures/mat3007/slides/01.webp" },
      meta: "slides18 · in preparation",
      sourceNote: "MAT3007 · Optimization, CUHK-Shenzhen",
      licenseNote: "Course slides used with permission.",
    },
  ],
};

function renderView() {
  return render(
    <MemoryRouter>
      <CourseMapView data={DATA} />
    </MemoryRouter>,
  );
}

describe("CourseMapView", () => {
  it("opens the live lecture from the center cover", () => {
    renderView();
    expect(screen.getByRole("link", { name: /open lecture/i })).toHaveAttribute(
      "href",
      "#/lecture/speyer-1a",
    );
  });

  it("centers the next card and disables entry while in preparation", async () => {
    renderView();
    await userEvent.click(screen.getByRole("button", { name: "Next course" }));
    expect(screen.getByText(/1b · solving linear systems/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^in preparation$/i })).toBeDisabled();
  });

  it("opens the About panel on the same screen", async () => {
    renderView();
    await userEvent.click(screen.getByRole("button", { name: "About" }));
    expect(screen.getByRole("dialog", { name: /about this course/i })).toBeInTheDocument();
  });
});
