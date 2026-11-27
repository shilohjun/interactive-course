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
    const list = listRef.current;
    if (!active || !list) return;
    const element = list.querySelector<HTMLElement>('[aria-current="true"]');
    if (!element) return;
    const listBox = list.getBoundingClientRect();
    const cueBox = element.getBoundingClientRect();
    const target =
      list.scrollTop + (cueBox.top - listBox.top) - list.clientHeight / 2 + cueBox.height / 2;
    if (typeof list.scrollTo === "function") {
      list.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
    }
  }, [active]);

  return (
    <section className="transcript" role="region" aria-label="Transcript">
      <header className="transcript__head">
        <span>Transcript</span>
        <span>English</span>
      </header>
      <ol className="cues" ref={listRef}>
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
