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

  return (
    <section className="video-float" hidden={!visible} aria-label="Lecture video">
      <header className="video-float__head">
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
      />
    </section>
  );
}
