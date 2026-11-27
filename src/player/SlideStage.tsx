import type { LectureMeta } from "../types";

type SlideStageProps = {
  meta: LectureMeta;
  baseUrl: string;
  slide: number;
};

export function SlideStage({ meta, baseUrl, slide }: SlideStageProps) {
  const src = `${baseUrl}course/lectures/${meta.id}/slides/${String(slide).padStart(2, "0")}.webp`;

  return (
    <figure className="slide-mat">
      <img src={src} alt={`Slide ${slide} of ${meta.slides.count}`} />
    </figure>
  );
}
