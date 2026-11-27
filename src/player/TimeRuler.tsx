import type { Chapter } from "../types";

type TimeRulerProps = {
  time: number;
  duration: number;
  chapters: Chapter[];
  currentChapter: Chapter | null;
  onSeek: (time: number) => void;
};

export function TimeRuler({
  time,
  duration,
  chapters,
  currentChapter,
  onSeek,
}: TimeRulerProps) {
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 1;
  const percent = (value: number) =>
    Math.min(100, Math.max(0, (value / safeDuration) * 100));
  const position = percent(time);

  return (
    <div className="ruler">
      <input
        className="ruler__input"
        type="range"
        min={0}
        max={safeDuration}
        step={0.1}
        value={Math.min(time, safeDuration)}
        aria-label="Seek"
        onChange={(event) => onSeek(Number(event.target.value))}
      />
      <div className="ruler__track" />
      <div className="ruler__fill" style={{ width: `${position}%` }} />
      {chapters.map((chapter) => (
        <span
          key={chapter.id}
          className={`ruler__tick${currentChapter?.id === chapter.id ? " ruler__tick--active" : ""}`}
          style={{ left: `${percent(chapter.start)}%` }}
        />
      ))}
      <span className="ruler__dot" style={{ left: `calc(${position}% - 6px)` }} />
    </div>
  );
}
