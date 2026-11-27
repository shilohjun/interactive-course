import type { LectureMeta } from "../types";

type SlideStageProps = {
  meta: LectureMeta;
  baseUrl: string;
  slide: number;
  videoRef: (element: HTMLVideoElement | null) => void;
  onLoadedMetadata: () => void;
  onVideoError: () => void;
  videoVisible: boolean;
  onToggleVideo: () => void;
  mediaError: boolean;
};

export function SlideStage({
  meta,
  baseUrl,
  slide,
  videoRef,
  onLoadedMetadata,
  onVideoError,
  videoVisible,
  onToggleVideo,
  mediaError,
}: SlideStageProps) {
  const src = `${baseUrl}course/lectures/${meta.id}/slides/${String(slide).padStart(2, "0")}.webp`;

  return (
    <div className="stage__frame">
      {mediaError ? (
        <p className="stage__notice" role="status">
          Video unavailable. The slides and transcript still work.
        </p>
      ) : null}

      <figure className="stage__slide">
        <img src={src} alt={`Slide ${slide} of ${meta.slides.count}`} />
        <div className={`stage__video ${videoVisible ? "" : "stage__video--off"}`}>
          <video
            ref={videoRef}
            src={`${baseUrl}media/${meta.media.file}`}
            playsInline
            preload="metadata"
            onLoadedMetadata={onLoadedMetadata}
            onError={onVideoError}
          />
        </div>
        <button
          type="button"
          className="stage__video-toggle"
          onClick={onToggleVideo}
          aria-pressed={videoVisible}
        >
          {videoVisible ? "Hide video" : "Show video"}
        </button>
      </figure>
    </div>
  );
}
