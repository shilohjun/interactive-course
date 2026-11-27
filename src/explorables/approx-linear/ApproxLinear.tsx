import { useRef, useState } from "react";
import { CURVE, SLOPE, maxError, tangent } from "./math";

const W = 760;
const H = 420;
const PAD = { left: 50, right: 20, top: 22, bottom: 42 };
const X_MIN = -2.4;
const X_MAX = 2.4;
const Y_MIN = -2.2;
const Y_MAX = 2.2;
const X0_MIN = -2;
const X0_MAX = 2;
const WINDOW_MIN = 0.05;
const WINDOW_MAX = 1.2;

const toX = (x: number) =>
  PAD.left + ((x - X_MIN) / (X_MAX - X_MIN)) * (W - PAD.left - PAD.right);
const toY = (y: number) =>
  H - PAD.bottom - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * (H - PAD.top - PAD.bottom);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number) => Math.round(value * 100) / 100;

function samplePath(
  fn: (x: number) => number,
  from: number,
  to: number,
  steps: number,
  sx: (x: number) => number,
  sy: (y: number) => number,
): string {
  const points: string[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const x = from + ((to - from) * i) / steps;
    points.push(`${sx(x).toFixed(1)},${sy(fn(x)).toFixed(1)}`);
  }
  return `M${points.join(" L")}`;
}

const CURVE_PATH = samplePath(CURVE, X_MIN, X_MAX, 220, toX, toY);
const GRID_X = [-2, -1, 0, 1, 2];
const GRID_Y = [-2, -1, 0, 1, 2];

export function ApproxLinear() {
  const [x0, setX0] = useState(0);
  const [halfWindow, setHalfWindow] = useState(0.8);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const line = tangent(x0);
  const error = maxError(x0, halfWindow);
  const start = x0 - halfWindow;
  const end = x0 + halfWindow;

  const areaPath = (() => {
    const points: string[] = [];
    for (let i = 0; i <= 40; i += 1) {
      const x = start + ((end - start) * i) / 40;
      points.push(`${toX(x).toFixed(1)},${toY(CURVE(x)).toFixed(1)}`);
    }
    for (let i = 40; i >= 0; i -= 1) {
      const x = start + ((end - start) * i) / 40;
      points.push(`${toX(x).toFixed(1)},${toY(line(x)).toFixed(1)}`);
    }
    return `M${points.join(" L")} Z`;
  })();

  const moveTo = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0) return;
    const local = ((clientX - rect.left) / rect.width) * W;
    const x = X_MIN + ((local - PAD.left) / (W - PAD.left - PAD.right)) * (X_MAX - X_MIN);
    setX0(round(clamp(x, X0_MIN, X0_MAX)));
  };

  const pointX = toX(x0);
  const pointY = toY(CURVE(x0));

  return (
    <div className="explorable">
      <div className="explorable__copy">
        <p className="explorable__eyebrow">One variable</p>
        <p className="explorable__lede">
          Drag the point. Close to x₀ the curve and its tangent agree. Move away, and
          they part.
        </p>
      </div>

      <div className="explorable__grid">
        <figure className="explorable__plot">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label="A cubic curve with its tangent line at a draggable point"
            onPointerDown={(event) => {
              dragging.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              moveTo(event.clientX);
            }}
            onPointerMove={(event) => {
              if (dragging.current) moveTo(event.clientX);
            }}
            onPointerUp={() => {
              dragging.current = false;
            }}
            onPointerCancel={() => {
              dragging.current = false;
            }}
          >
            {GRID_X.map((x) => (
              <line
                key={`gx-${x}`}
                className="explorable__gridline"
                x1={toX(x)}
                x2={toX(x)}
                y1={PAD.top}
                y2={H - PAD.bottom}
              />
            ))}
            {GRID_Y.map((y) => (
              <line
                key={`gy-${y}`}
                className="explorable__gridline"
                x1={PAD.left}
                x2={W - PAD.right}
                y1={toY(y)}
                y2={toY(y)}
              />
            ))}
            <line
              className="explorable__axis"
              x1={PAD.left}
              x2={W - PAD.right}
              y1={toY(0)}
              y2={toY(0)}
            />
            <line
              className="explorable__axis"
              x1={toX(0)}
              x2={toX(0)}
              y1={PAD.top}
              y2={H - PAD.bottom}
            />

            <path className="explorable__area" d={areaPath} />
            <path className="explorable__curve" d={CURVE_PATH} />
            <line
              className="explorable__tangent-ghost"
              x1={toX(X_MIN)}
              x2={toX(X_MAX)}
              y1={toY(line(X_MIN))}
              y2={toY(line(X_MAX))}
            />
            <line
              className="explorable__tangent"
              x1={toX(start)}
              x2={toX(end)}
              y1={toY(line(start))}
              y2={toY(line(end))}
            />
            <line
              className="explorable__guide"
              x1={pointX}
              x2={pointX}
              y1={pointY}
              y2={toY(0)}
            />
            <circle
              className="explorable__handle"
              cx={pointX}
              cy={pointY}
              r={8}
              tabIndex={0}
              role="button"
              aria-label="Tangent point handle"
              onKeyDown={(event) => {
                if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                event.preventDefault();
                const delta = event.key === "ArrowRight" ? 0.05 : -0.05;
                setX0(round(clamp(x0 + delta, X0_MIN, X0_MAX)));
              }}
            />
            <text className="explorable__label" x={pointX + 12} y={pointY - 10}>
              x₀
            </text>

            {GRID_X.map((x) => (
              <text
                key={`tx-${x}`}
                className="explorable__tick"
                x={toX(x)}
                y={H - PAD.bottom + 16}
                textAnchor="middle"
              >
                {x}
              </text>
            ))}
            {GRID_Y.map((y) => (
              <text
                key={`ty-${y}`}
                className="explorable__tick"
                x={PAD.left - 10}
                y={toY(y) + 3}
                textAnchor="end"
              >
                {y}
              </text>
            ))}
          </svg>
          <figcaption>f(x) = x³/3 − x, and its tangent at x₀</figcaption>
        </figure>

        <aside className="explorable__side">
          <output className="explorable__readout" aria-live="polite">
            x₀ = {x0.toFixed(2)} · window ± {halfWindow.toFixed(2)} · max error{" "}
            {error.toFixed(4)}
          </output>

          <dl className="explorable__stats">
            <div>
              <dt>f(x₀)</dt>
              <dd>{CURVE(x0).toFixed(3)}</dd>
            </div>
            <div>
              <dt>f′(x₀)</dt>
              <dd>{SLOPE(x0).toFixed(3)}</dd>
            </div>
          </dl>

          <label className="explorable__control">
            <span>Tangent point x₀</span>
            <input
              type="range"
              min={X0_MIN}
              max={X0_MAX}
              step={0.01}
              value={x0}
              aria-label="Tangent point x0"
              onChange={(event) => setX0(Number(event.target.value))}
            />
          </label>

          <label className="explorable__control">
            <span>Window half-width</span>
            <input
              type="range"
              min={WINDOW_MIN}
              max={WINDOW_MAX}
              step={0.05}
              value={halfWindow}
              aria-label="Window half-width"
              onChange={(event) => setHalfWindow(Number(event.target.value))}
            />
          </label>

          <div className="explorable__buttons">
            <button
              type="button"
              onClick={() =>
                setHalfWindow((value) => round(Math.max(WINDOW_MIN, value / 2)))
              }
            >
              Zoom in
            </button>
            <button
              type="button"
              onClick={() => {
                setX0(0);
                setHalfWindow(0.8);
              }}
            >
              Reset
            </button>
          </div>

          <ZoomInset x0={x0} halfWindow={halfWindow} />

          <p className="explorable__note">
            In one variable this is calculus. Linear algebra does the same thing when
            there are many functions of many variables.
          </p>
        </aside>
      </div>
    </div>
  );
}

function ZoomInset({ x0, halfWindow }: { x0: number; halfWindow: number }) {
  const ZW = 340;
  const ZH = 190;
  const pad = 20;
  const line = tangent(x0);
  const values = [
    CURVE(x0 - halfWindow),
    CURVE(x0 + halfWindow),
    line(x0 - halfWindow),
    line(x0 + halfWindow),
  ];
  const yMin = Math.min(...values) - 0.2;
  const yMax = Math.max(...values) + 0.2;

  const zx = (x: number) =>
    pad + ((x - (x0 - halfWindow)) / (2 * halfWindow)) * (ZW - 2 * pad);
  const zy = (y: number) =>
    ZH - pad - ((y - yMin) / Math.max(yMax - yMin, 0.1)) * (ZH - 2 * pad);

  const curve = samplePath(CURVE, x0 - halfWindow, x0 + halfWindow, 60, zx, zy);

  return (
    <figure className="explorable__zoom">
      <svg viewBox={`0 0 ${ZW} ${ZH}`} role="img" aria-label="Zoomed view near the tangent point">
        <rect className="explorable__zoom-bg" x={0} y={0} width={ZW} height={ZH} />
        <path className="explorable__curve" d={curve} />
        <line
          className="explorable__tangent"
          x1={zx(x0 - halfWindow)}
          x2={zx(x0 + halfWindow)}
          y1={zy(line(x0 - halfWindow))}
          y2={zy(line(x0 + halfWindow))}
        />
        <circle className="explorable__handle" cx={zx(x0)} cy={zy(CURVE(x0))} r={5} />
      </svg>
      <figcaption>Zoom · ±{halfWindow.toFixed(2)}</figcaption>
    </figure>
  );
}

