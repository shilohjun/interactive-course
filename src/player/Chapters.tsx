import type { Chapter } from "../types";
import { formatTime } from "../lib/timeline";

type ChaptersProps = {
  chapters: Chapter[];
  current: Chapter | null;
  onSelect: (chapter: Chapter) => void;
  onClose?: () => void;
};

export function Chapters({ chapters, current, onSelect, onClose }: ChaptersProps) {
  return (
    <nav aria-label="Chapters" className="chapters-nav">
      <header className="panel-head">
        <p>Chapters</p>
        {onClose ? (
          <button
            type="button"
            className="panel-close"
            onClick={onClose}
            aria-label="Close chapters"
          >
            Close
          </button>
        ) : null}
      </header>
      <ol className="chapters">
        {chapters.map((chapter) => (
          <li key={chapter.id}>
            <button
              type="button"
              className="chapter"
              aria-current={current?.id === chapter.id ? "true" : undefined}
              onClick={() => onSelect(chapter)}
            >
              <span className="chapter__title">{chapter.title}</span>
              <span className="chapter__time">{formatTime(chapter.start)}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
