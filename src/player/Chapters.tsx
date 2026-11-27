import type { Chapter } from "../types";
import { formatTime } from "../lib/timeline";

type ChaptersProps = {
  chapters: Chapter[];
  current: Chapter | null;
  onSelect: (chapter: Chapter) => void;
};

export function Chapters({ chapters, current, onSelect }: ChaptersProps) {
  return (
    <nav className="rail__inner" aria-label="Chapters">
      <p className="rail__kicker">Chapters</p>
      <ol className="chapters">
        {chapters.map((chapter, index) => (
          <li key={chapter.id}>
            <button
              type="button"
              className="chapter"
              aria-current={current?.id === chapter.id ? "true" : undefined}
              onClick={() => onSelect(chapter)}
            >
              <span className="chapter__num">{String(index + 1).padStart(2, "0")}</span>
              <span className="chapter__title">{chapter.title}</span>
              <span className="chapter__time">{formatTime(chapter.start)}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
