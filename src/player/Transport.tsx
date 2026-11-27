import type { Chapter } from "../types";
import { formatTime } from "../lib/timeline";
import { TimeRuler } from "./TimeRuler";

type TransportProps = {
  time: number;
  duration: number;
  playing: boolean;
  rate: number;
  chapters: Chapter[];
  currentChapter: Chapter | null;
  onToggle: () => void;
  onSeek: (time: number) => void;
  onRate: (rate: number) => void;
  onStep: (direction: 1 | -1) => void;
};

const RATES = [1, 1.25, 1.5];

function PlayIcon() {
  return (
    <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
      <path d="M3 1.5 10 6 3 10.5Z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
      <rect x="2.5" y="1.5" width="2.5" height="9" fill="currentColor" />
      <rect x="7" y="1.5" width="2.5" height="9" fill="currentColor" />
    </svg>
  );
}

export function Transport({
  time,
  duration,
  playing,
  rate,
  chapters,
  currentChapter,
  onToggle,
  onSeek,
  onRate,
  onStep,
}: TransportProps) {
  return (
    <div className="transport">
      <button
        type="button"
        className="transport__play"
        onClick={onToggle}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>

      <p className="transport__time">
        {formatTime(time)} <span>/ {formatTime(duration)}</span>
      </p>

      <TimeRuler
        time={time}
        duration={duration}
        chapters={chapters}
        currentChapter={currentChapter}
        onSeek={onSeek}
      />

      <div className="transport__steps">
        <button type="button" aria-label="Previous slide" onClick={() => onStep(-1)}>
          <svg viewBox="0 0 12 12" width="14" height="14" aria-hidden="true">
            <path d="M7.5 1.5 3 6l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
        <button type="button" aria-label="Next slide" onClick={() => onStep(1)}>
          <svg viewBox="0 0 12 12" width="14" height="14" aria-hidden="true">
            <path d="M4.5 1.5 9 6l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
      </div>

      <label className="transport__speed">
        <span>Speed</span>
        <select
          value={rate}
          aria-label="Playback speed"
          onChange={(event) => onRate(Number(event.target.value))}
        >
          {RATES.map((value) => (
            <option key={value} value={value}>
              {value}×
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
