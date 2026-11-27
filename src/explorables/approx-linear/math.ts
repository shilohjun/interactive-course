export const CURVE = (x: number): number => (x ** 3) / 3 - x;

export const SLOPE = (x: number): number => x ** 2 - 1;

export function tangent(x0: number): (x: number) => number {
  const y0 = CURVE(x0);
  const slope = SLOPE(x0);
  return (x: number) => y0 + slope * (x - x0);
}

export function maxError(x0: number, halfWindow: number, samples = 64): number {
  const line = tangent(x0);
  let worst = 0;
  for (let i = 0; i <= samples; i += 1) {
    const x = x0 - halfWindow + (2 * halfWindow * i) / samples;
    worst = Math.max(worst, Math.abs(CURVE(x) - line(x)));
  }
  return worst;
}
