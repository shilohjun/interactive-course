import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

/** Free-floating rectangle, relative to the offset parent (the board area). */
export type BoardBox = { x: number; y: number; width: number; height: number };

/** The board area's size and padding, so the board never sits over its edge. */
type Area = {
  width: number;
  height: number;
  padLeft: number;
  padTop: number;
  padRight: number;
  padBottom: number;
};

const MIN_WIDTH = 240;
const FALLBACK_RATIO = 4 / 3;
const NUDGE = 40;

type BoardFrameProps = {
  /** localStorage key holding this lecture's last box. */
  storageKey: string;
  /** Natural width / height of the slide, so resizing never distorts it. */
  ratio: number;
  label: string;
  children: ReactNode;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max));

function readBox(key: string): BoardBox | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const { x, y, width, height } = parsed as Partial<BoardBox>;
    if (
      typeof x !== "number" ||
      typeof y !== "number" ||
      typeof width !== "number" ||
      typeof height !== "number" ||
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    ) {
      return null;
    }
    return { x, y, width, height };
  } catch {
    return null;
  }
}

function isInteractive(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest("button, a, input, select, textarea, [data-no-drag]") !== null
  );
}

/**
 * The slide board. It stays centred and fitted to the available space until the
 * reader touches it; from then on it floats, remembering where they put it.
 */
export function BoardFrame({ storageKey, ratio, label, children }: BoardFrameProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    mode: "move" | "resize";
    startX: number;
    startY: number;
    origin: BoardBox;
  } | null>(null);
  const [box, setBox] = useState<BoardBox | null>(() => readBox(storageKey));
  const boxRef = useRef<BoardBox | null>(box);
  const [active, setActive] = useState<"move" | "resize" | null>(null);

  const floating = box !== null;
  const safeRatio = ratio > 0 ? ratio : FALLBACK_RATIO;

  const persist = useCallback(
    (value: BoardBox | null) => {
      try {
        if (value) window.localStorage.setItem(storageKey, JSON.stringify(value));
        else window.localStorage.removeItem(storageKey);
      } catch {
        // Storage may be full or blocked; the board still works this session.
      }
    },
    [storageKey],
  );

  const applyBox = useCallback((next: BoardBox) => {
    // Keep the ref in step so a gesture can persist the final rectangle.
    boxRef.current = next;
    setBox(next);
  }, []);

  const reset = useCallback(() => {
    dragRef.current = null;
    boxRef.current = null;
    setActive(null);
    setBox(null);
    persist(null);
  }, [persist]);

  // A new lecture means a new key: start fitted again.
  useEffect(() => {
    const next = readBox(storageKey);
    boxRef.current = next;
    setBox(next);
  }, [storageKey]);

  // Persist late enough that dragging does not hammer localStorage.
  useEffect(() => {
    if (!box) return;
    const timer = window.setTimeout(() => persist(box), 250);
    return () => window.clearTimeout(timer);
  }, [box, persist]);

  /** The currently rendered rectangle, so a drag can start from the fitted position. */
  const measure = useCallback((): BoardBox | null => {
    const el = wrapRef.current;
    const parent = el?.offsetParent;
    if (!el || !(parent instanceof HTMLElement)) return null;
    const rect = el.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    return {
      x: rect.left - parentRect.left,
      y: rect.top - parentRect.top,
      width: rect.width,
      height: rect.height,
    };
  }, []);

  const areaSize = useCallback((): Area | null => {
    const parent = wrapRef.current?.offsetParent;
    if (!(parent instanceof HTMLElement)) return null;
    const style = window.getComputedStyle(parent);
    const px = (value: string) => Number.parseFloat(value) || 0;
    return {
      width: parent.clientWidth,
      height: parent.clientHeight,
      padLeft: px(style.paddingLeft),
      padTop: px(style.paddingTop),
      padRight: px(style.paddingRight),
      padBottom: px(style.paddingBottom),
    };
  }, []);

  /** Where the board may sit: inside the area's padding, never over its edge. */
  const limits = useCallback(
    (area: Area, width: number, height: number) => ({
      minX: area.padLeft,
      maxX: Math.max(area.padLeft, area.width - area.padRight - width),
      minY: area.padTop,
      maxY: Math.max(area.padTop, area.height - area.padBottom - height),
    }),
    [],
  );

  const beginDrag = (mode: "move" | "resize") => (event: ReactPointerEvent<HTMLElement>) => {
    // The resize handle sits inside the move surface; it claims the gesture first.
    if (mode === "resize") event.stopPropagation();
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (isInteractive(event.target)) return;
    const origin = box ?? measure();
    if (!origin) return;
    event.preventDefault();
    wrapRef.current?.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { mode, startX: event.clientX, startY: event.clientY, origin };
    applyBox(origin);
    setActive(mode);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const area = areaSize();
    if (!area) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const { origin } = drag;

    if (drag.mode === "move") {
      const bounds = limits(area, origin.width, origin.height);
      applyBox({
        ...origin,
        x: clamp(origin.x + dx, bounds.minX, bounds.maxX),
        y: clamp(origin.y + dy, bounds.minY, bounds.maxY),
      });
      return;
    }

    // Resize from the bottom-right corner, keeping the slide's own aspect ratio.
    const maxWidth = Math.max(
      MIN_WIDTH,
      Math.min(area.width - area.padRight - origin.x, (area.height - area.padBottom - origin.y) * safeRatio),
    );
    const width = clamp(origin.width + dx, MIN_WIDTH, maxWidth);
    applyBox({ x: origin.x, y: origin.y, width, height: width / safeRatio });
  };

  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setActive(null);
    persist(boxRef.current);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  // Keep the board inside the area when the window or the side panel changes size.
  useEffect(() => {
    if (!floating) return;
    const onResize = () => {
      const area = areaSize();
      const current = boxRef.current;
      if (!area || !current) return;
      const width = Math.min(current.width, Math.max(MIN_WIDTH, area.width - area.padLeft - area.padRight));
      const height = Math.min(current.height, area.height - area.padTop - area.padBottom);
      const bounds = limits(area, width, height);
      applyBox({
        width,
        height,
        x: clamp(current.x, bounds.minX, bounds.maxX),
        y: clamp(current.y, bounds.minY, bounds.maxY),
      });
    };
    window.addEventListener("resize", onResize);

    const parent = wrapRef.current?.offsetParent;
    const observer =
      typeof ResizeObserver === "function" && parent instanceof HTMLElement
        ? new ResizeObserver(onResize)
        : null;
    if (observer && parent instanceof HTMLElement) observer.observe(parent);

    return () => {
      window.removeEventListener("resize", onResize);
      observer?.disconnect();
    };
  }, [floating, areaSize, applyBox, limits]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (isInteractive(event.target)) return;
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;

    // Plain arrows belong to slide navigation, so only the modified forms are ours.
    const resizing = event.altKey;
    const moving = !event.altKey && event.shiftKey;
    if (!resizing && !moving) return;

    const origin = box ?? measure();
    const area = areaSize();
    if (!origin || !area) return;

    event.preventDefault();
    event.stopPropagation();
    applyBox(origin);

    const step = NUDGE;
    const growing = event.key === "ArrowRight" || event.key === "ArrowDown";
    const delta = growing ? step : -step;

    if (resizing) {
      const maxWidth = Math.max(
        MIN_WIDTH,
        Math.min(area.width - area.padRight - origin.x, (area.height - area.padBottom - origin.y) * safeRatio),
      );
      const width = clamp(origin.width + delta, MIN_WIDTH, maxWidth);
      const next = { ...origin, width, height: width / safeRatio };
      applyBox(next);
      persist(next);
      return;
    }

    const bounds = limits(area, origin.width, origin.height);
    const next = {
      ...origin,
      x: clamp(
        event.key === "ArrowLeft" || event.key === "ArrowRight" ? origin.x + delta : origin.x,
        bounds.minX,
        bounds.maxX,
      ),
      y: clamp(
        event.key === "ArrowUp" || event.key === "ArrowDown" ? origin.y + delta : origin.y,
        bounds.minY,
        bounds.maxY,
      ),
    };
    applyBox(next);
    persist(next);
  };

  const style: CSSProperties | undefined = box
    ? { left: box.x, top: box.y, width: box.width, height: box.height }
    : undefined;

  const className = [
    "board-wrap",
    floating ? "board-wrap--floating" : "",
    active ? `board-wrap--${active}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={wrapRef}
      className={className}
      style={style}
      data-board-drag=""
      onPointerDown={beginDrag("move")}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="group"
      aria-label={`${label}. Drag to move, use the corner handle to resize; Shift with arrows moves, Alt with arrows resizes.`}
    >
      {children}

      <span className="board-grip" aria-hidden="true">
        {label}
      </span>

      {floating ? (
        <button
          type="button"
          className="board-fit"
          onClick={reset}
          onPointerDown={(event) => event.stopPropagation()}
        >
          Fit
        </button>
      ) : null}

      <span
        className="board-resizer"
        role="presentation"
        onPointerDown={beginDrag("resize")}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
    </div>
  );
}
