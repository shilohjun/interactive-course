import type { LectureMeta } from "../types";
import { Attribution } from "./Attribution";

type InfoPanelProps = {
  meta: LectureMeta;
  pdfHref: string;
  onClose: () => void;
};

export function InfoPanel({ meta, pdfHref, onClose }: InfoPanelProps) {
  return (
    <section className="info-panel" role="region" aria-label="About this lecture">
      <header className="panel-head">
        <p>About this lecture</p>
        <button type="button" className="panel-close" onClick={onClose} aria-label="Close info">
          Close
        </button>
      </header>
      <div className="info-panel__body">
        <h2>{meta.title}</h2>
        <p className="info-panel__meta">
          {meta.source.course} · {meta.source.institution}
        </p>
        <p>{meta.source.instructor}</p>
        <p>
          One clock: the video's current time drives the slide, the transcript, and the
          chapter list. Click a sentence to jump. Questions open in a new tab; your place
          here is kept.
        </p>
        <a className="info-panel__pdf" href={pdfHref} download>
          Slides (PDF)
        </a>
        <Attribution source={meta.source} />
      </div>
    </section>
  );
}
