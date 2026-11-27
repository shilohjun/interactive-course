import { useEffect, useRef } from "react";
import type { LectureMeta } from "../types";

type SlideStageProps = {
  meta: LectureMeta;
  baseUrl: string;
  slide: number;
  /** Natural size of the exported page, so the board can keep its aspect ratio. */
  onIntrinsicSize?: (width: number, height: number) => void;
};

export function SlideStage({ meta, baseUrl, slide, onIntrinsicSize }: SlideStageProps) {
  const src = `${baseUrl}course/lectures/${meta.id}/slides/${String(slide).padStart(2, "0")}.webp`;
  const imgRef = useRef<HTMLImageElement>(null);

  // A cached image can finish decoding before React attaches onLoad.
  useEffect(() => {
    const img = imgRef.current;
    if (!img || !img.complete) return;
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      onIntrinsicSize?.(img.naturalWidth, img.naturalHeight);
    }
  }, [src, onIntrinsicSize]);

  return (
    <figure className="board">
      <img
        ref={imgRef}
        src={src}
        alt={`Slide ${slide} of ${meta.slides.count}`}
        draggable={false}
        onLoad={(event) => {
          const img = event.currentTarget;
          if (img.naturalWidth > 0 && img.naturalHeight > 0) {
            onIntrinsicSize?.(img.naturalWidth, img.naturalHeight);
          }
        }}
      />
    </figure>
  );
}
