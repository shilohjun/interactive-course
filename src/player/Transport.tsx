import { formatTime } from "../lib/timeline";

type TransportProps = {
  time: number;
  duration: number;
  playing: boolean;
  rate: number;
  onToggle: () => void;
  onSeek: (time: number) => void;
  onRate: (rate: number) => void;
  onStep: (direction: 1 | -1) => void;
};

const RATES = [1, 1.25, 1.5];

export function Transport({
  time,
  duration,
  playing,
  rate,
  onToggle,
  onSeek,
  onRate,
  onStep,
}: TransportProps) {
  const max = Math.max(duration, 1);
  const value = Math.min(Math.max(time, 0), max);

  return (
    <div className="transport">
      <button
        type="button"
        className="transport__play"
        onClick={onToggle}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? "❚❚" : "▶"}
      </button>

      <span className="transport__time">
        {formatTime(time)}
        <span className="transport__duration"> / {formatTime(duration)}</span>
      </span>

      <input
        className="transport__range"
        type="range"
        min={0}
        max={max}
        step={0.1}
        value={value}
        aria-label="Seek"
        onChange={(event) => onSeek(Number(event.target.value))}
      />

      <div className="transport__steps">
        <button type="button" aria-label="Previous slide" onClick={() => onStep(-1)}>
          ←
        </button>
        <button type="button" aria-label="Next slide" onClick={() => onStep(1)}>
          →
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
