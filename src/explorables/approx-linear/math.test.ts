import { CURVE, SLOPE, maxError, tangent } from "./math";

describe("the local-linearity curve", () => {
  it("evaluates f(x) = x^3/3 - x", () => {
    expect(CURVE(0)).toBe(0);
    expect(CURVE(3)).toBe(6);
    expect(CURVE(-3)).toBe(-6);
  });

  it("evaluates the derivative f'(x) = x^2 - 1", () => {
    expect(SLOPE(0)).toBe(-1);
    expect(SLOPE(2)).toBe(3);
  });
});

describe("tangent", () => {
  it("passes through (x0, f(x0)) with slope f'(x0)", () => {
    const atZero = tangent(0);
    expect(atZero(0)).toBe(0);
    expect(atZero(2)).toBe(-2);

    const atTwo = tangent(2);
    expect(atTwo(2)).toBeCloseTo(2 / 3, 12);
    expect(atTwo(3)).toBeCloseTo(11 / 3, 12);
  });
});

describe("maxError", () => {
  it("is the cubic error of the tangent at the origin", () => {
    expect(maxError(0, 0.5)).toBeCloseTo(1 / 24, 5);
  });

  it("shrinks as the window shrinks", () => {
    expect(maxError(0, 0.25)).toBeLessThan(maxError(0, 0.5));
    expect(maxError(1, 0.25)).toBeLessThan(maxError(1, 0.5));
  });
});
