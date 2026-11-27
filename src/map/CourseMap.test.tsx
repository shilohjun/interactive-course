import { render, screen } from "@testing-library/react";
import { CourseMapView } from "./CourseMap";
import type { CourseIndex } from "../types";

const DATA: CourseIndex = {
  site: {
    title: "Interactive Course",
    tagline: "A lecture you can stop, rewind, and take apart.",
    attribution: "Attribution line.",
  },
  courses: [
    {
      id: "speyer-214",
      title: "Applied Linear Algebra",
      institution: "University of Michigan · Math 214",
      instructor: "David E. Speyer",
      status: "live",
      lectures: [
        {
          id: "speyer-1a",
          title: "1a · Introduction to linear algebra",
          duration: 841,
          slides: 11,
          chapters: 5,
          status: "live",
        },
      ],
    },
    {
      id: "mat3007",
      title: "Optimization",
      institution: "CUHK-Shenzhen · MAT3007",
      instructor: "Rui Chen",
      status: "soon",
      lectures: [],
    },
  ],
};

describe("CourseMapView", () => {
  it("links live lectures to the hash route", () => {
    render(<CourseMapView data={DATA} />);
    const link = screen.getByRole("link", {
      name: /introduction to linear algebra/i,
    });
    expect(link).toHaveAttribute("href", "#/lecture/speyer-1a");
  });

  it("marks courses that are still in preparation", () => {
    render(<CourseMapView data={DATA} />);
    expect(screen.getByText(/in preparation/i)).toBeInTheDocument();
  });
});
