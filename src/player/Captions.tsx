import { useEffect, useRef } from "react";
import type { Cue } from "../types";
import { formatTime } from "../lib/timeline";

type CaptionsProps = {
  cues: Cue[];
  active: Cue | null;
  onSeek: (time: number) => void;
};

export function Captions({ cues, active, onSeek }: CaptionsProps) {
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (!active || !listRef.current) return;
    const element = listRef.current.querySelector<HTMLElement>('[aria-current="true"]');
    element?.scrollIntoView?.({ block: "center", behavior: "smooth" });
  }, [active]);

  return (
    <section className="panel__inner" role="region" aria-label="Transcript">
      <header className="panel__head">
        <span>Transcript</span>
        <span>{cues.length} lines</span>
      </header>
      <ol className="captions" ref={listRef}>
        {cues.map((cue, index) => (
          <li key={`${cue.start}-${index}`}>
            <button
              type="button"
              className="cue"
              aria-current={active === cue ? "true" : undefined}
              onClick={() => onSeek(cue.start)}
            >
              <span className="cue__time">{formatTime(cue.start)}</span>
              <span className="cue__text">{cue.text}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
