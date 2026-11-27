import { useEffect, useRef, useState } from "react";
import type { LectureMeta } from "../types";

type VideoPaneProps = {
  meta: LectureMeta;
  baseUrl: string;
  videoRef: (element: HTMLVideoElement | null) => void;
  onLoadedMetadata: () => void;
  onVideoError: () => void;
  visible: boolean;
  onToggle: () => void;
};

type Position = { x: number; y: number };
type Size = { width: number; height: number };

const MIN_WIDTH = 160;
const MIN_HEIGHT = 90;
const MAX_WIDTH = 480;
const MAX_HEIGHT = 270;
const DEFAULT_WIDTH = 320;
const DEFAULT_HEIGHT = 180;

export function VideoPane({
  meta,
  baseUrl,
  videoRef,
  onLoadedMetadata,
  onVideoError,
  visible,
  onToggle,
}: VideoPaneProps) {
  const pack = `${baseUrl}course/lectures/${meta.id}/`;
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; initialWidth: number; initialHeight: number } | null>(null);

  // Default position: the top-right corner of the board area, clear of the side panel.
  const [position, setPosition] = useState<Position>(() => {
    const saved = localStorage.getItem("video-pane-position");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fall through to default
      }
    }
    return { x: window.innerWidth - DEFAULT_WIDTH - 20, y: 20 };
  });
  const placedRef = useRef(false);
  /** Whether the reader's own placement was already on disk when the pane mounted. */
  const hadSavedPosition = useRef(localStorage.getItem("video-pane-position") !== null);

  const [size, setSize] = useState<Size>(() => {
    const saved = localStorage.getItem("video-pane-size");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fall through to default
      }
    }
    return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
  });

  // Save position and size to localStorage, once the pane has actually been placed.
  useEffect(() => {
    if (!placedRef.current) return;
    localStorage.setItem("video-pane-position", JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    localStorage.setItem("video-pane-size", JSON.stringify(size));
  }, [size]);

  // A remembered position can fall outside a smaller window: pull it back in.
  useEffect(() => {
    if (!visible) return;
    // First ever open: sit at the board area's top-right, not over the transcript panel.
    if (!placedRef.current) {
      placedRef.current = true;
      if (!hadSavedPosition.current) {
        const area = document.querySelector(".board-area");
        if (area instanceof HTMLElement) {
          const rect = area.getBoundingClientRect();
          setPosition({
            x: Math.max(0, rect.right - size.width - 16),
            y: Math.max(0, rect.top + 12),
          });
        }
      }
    }
    const maxX = Math.max(0, window.innerWidth - size.width);
    const maxY = Math.max(0, window.innerHeight - size.height);
    setPosition((current) => ({
      x: Math.min(Math.max(current.x, 0), maxX),
      y: Math.min(Math.max(current.y, 0), maxY),
    }));
  }, [visible, size.width, size.height]);

  // Drag handlers
  const handleDragStart = (e: React.PointerEvent) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const newX = dragRef.current.initialX + dx;
    const newY = dragRef.current.initialY + dy;

    // Constrain to viewport
    const maxX = window.innerWidth - size.width;
    const maxY = window.innerHeight - size.height;
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  const handleDragEnd = () => {
    dragRef.current = null;
  };

  // Resize handlers
  const handleResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: size.width,
      initialHeight: size.height,
    };
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (!resizeRef.current) return;
    const dx = e.clientX - resizeRef.current.startX;
    const dy = e.clientY - resizeRef.current.startY;
    // Diagonal resize: either axis counts, then the 16:9 ratio decides the rest.
    const delta = Math.max(dx, dy);
    const aspectRatio = 16 / 9;
    let finalWidth = Math.max(
      MIN_WIDTH,
      Math.min(resizeRef.current.initialWidth + delta, MAX_WIDTH),
    );
    let finalHeight = finalWidth / aspectRatio;

    if (finalHeight > MAX_HEIGHT) {
      finalHeight = MAX_HEIGHT;
      finalWidth = finalHeight * aspectRatio;
    }
    if (finalHeight < MIN_HEIGHT) {
      finalHeight = MIN_HEIGHT;
      finalWidth = finalHeight * aspectRatio;
    }

    setSize({ width: finalWidth, height: finalHeight });

    // Adjust position if needed to keep in viewport
    const maxX = window.innerWidth - finalWidth;
    const maxY = window.innerHeight - finalHeight;
    if (position.x > maxX || position.y > maxY) {
      setPosition({
        x: Math.min(position.x, maxX),
        y: Math.min(position.y, maxY),
      });
    }
  };

  const handleResizeEnd = () => {
    resizeRef.current = null;
  };

  // The element stays mounted even when hidden: it is the lecture's clock.

  return (
    <div
      ref={containerRef}
      className="video-float"
      hidden={!visible}
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: 100,
      }}
      aria-label="Lecture video"
    >
      <header
        className="video-float__head"
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
        style={{ cursor: dragRef.current ? "grabbing" : "grab" }}
      >
        <span>Lecture video</span>
        <button type="button" onClick={onToggle}>
          Hide
        </button>
      </header>
      <video
        ref={videoRef}
        className="video-float__video"
        src={`${baseUrl}media/${meta.media.file}`}
        poster={`${pack}poster.jpg`}
        playsInline
        preload="metadata"
        onLoadedMetadata={onLoadedMetadata}
        onError={onVideoError}
        style={{ width: "100%", height: "calc(100% - 32px)" }}
      />
      <div
        className="video-float__resize-handle"
        onPointerDown={handleResizeStart}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeEnd}
        onPointerCancel={handleResizeEnd}
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: "16px",
          height: "16px",
          cursor: "nwse-resize",
        }}
        aria-label="Resize video"
      />
    </div>
  );
}
