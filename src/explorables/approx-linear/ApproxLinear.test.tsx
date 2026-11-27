import { fireEvent, render, screen } from "@testing-library/react";
import { ApproxLinear } from "./ApproxLinear";

describe("ApproxLinear", () => {
  it("updates the point from the tangent slider", () => {
    render(<ApproxLinear />);
    const slider = screen.getByRole("slider", { name: /tangent point x0/i });
    fireEvent.change(slider, { target: { value: "1" } });
    expect(screen.getByText(/x₀ = 1\.00/)).toBeInTheDocument();
  });

  it("narrows the window from the window slider", () => {
    render(<ApproxLinear />);
    const slider = screen.getByRole("slider", { name: /window half-width/i });
    fireEvent.change(slider, { target: { value: "0.4" } });
    expect(screen.getByText(/window ± 0\.40/)).toBeInTheDocument();
  });

  it("zooms in with a button", () => {
    render(<ApproxLinear />);
    fireEvent.click(screen.getByRole("button", { name: /zoom in/i }));
    expect(screen.getByText(/window ± 0\.40/)).toBeInTheDocument();
  });
});
