import type { LectureMeta } from "../types";

type VideoPaneProps = {
  meta: LectureMeta;
  baseUrl: string;
  videoRef: (element: HTMLVideoElement | null) => void;
  onLoadedMetadata: () => void;
  onVideoError: () => void;
  visible: boolean;
  onToggle: () => void;
  mediaError: boolean;
};

export function VideoPane({
  meta,
  baseUrl,
  videoRef,
  onLoadedMetadata,
  onVideoError,
  visible,
  onToggle,
  mediaError,
}: VideoPaneProps) {
  const pack = `${baseUrl}course/lectures/${meta.id}/`;

  return (
    <section className="video-pane" aria-label="Lecture video">
      <header className="video-pane__head">
        <span>Lecture video</span>
        <button type="button" onClick={onToggle} aria-pressed={visible}>
          {visible ? "Hide" : "Show"}
        </button>
      </header>
      {mediaError ? (
        <p className="video-pane__notice" role="status">
          Video unavailable. The slides and transcript still work.
        </p>
      ) : null}
      <video
        ref={videoRef}
        className={visible ? "video-pane__video" : "video-pane__video video-pane__video--off"}
        src={`${baseUrl}media/${meta.media.file}`}
        poster={`${pack}poster.jpg`}
        playsInline
        preload="metadata"
        onLoadedMetadata={onLoadedMetadata}
        onError={onVideoError}
      />
    </section>
  );
}
