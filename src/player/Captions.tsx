import { useEffect, useRef } from "react";
import type { Cue } from "../types";
import type { CaptionLang } from "../lib/captions";
import { formatTime } from "../lib/timeline";
import { formatCaptionForDisplay } from "../lib/captions";

type CaptionsProps = {
  cues: Cue[];
  active: Cue | null;
  lang: CaptionLang;
  onSeek: (time: number) => void;
  onLangChange: (lang: CaptionLang) => void;
  onClose?: () => void;
};

export function Captions({ cues, active, lang, onSeek, onLangChange, onClose }: CaptionsProps) {
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

  const hasChinese = cues.some((cue) => cue.text_zh);

  return (
    <section className="transcript" role="region" aria-label="Transcript">
      <header className="transcript__head">
        <span>Transcript</span>
        <div className="transcript__lang-switch">
          <button
            type="button"
            className={lang === "en" ? "is-active" : undefined}
            onClick={() => onLangChange("en")}
            aria-label="English only"
          >
            EN
          </button>
          {hasChinese && (
            <>
              <button
                type="button"
                className={lang === "zh" ? "is-active" : undefined}
                onClick={() => onLangChange("zh")}
                aria-label="Chinese only"
              >
                中文
              </button>
              <button
                type="button"
                className={lang === "both" ? "is-active" : undefined}
                onClick={() => onLangChange("both")}
                aria-label="Bilingual"
              >
                双语
              </button>
            </>
          )}
        </div>
        {onClose ? (
          <button
            type="button"
            className="panel-close"
            onClick={onClose}
            aria-label="Close transcript"
          >
            Close
          </button>
        ) : null}
      </header>
      <ol className="cues" ref={listRef}>
        {cues.map((cue, index) => {
          const display = formatCaptionForDisplay(cue, lang);
          return (
            <li key={`${cue.start}-${index}`}>
              <button
                type="button"
                className="cue"
                aria-current={active === cue ? "true" : undefined}
                onClick={() => onSeek(cue.start)}
              >
                <span className="cue__time">{formatTime(cue.start)}</span>
                <span className="cue__text">
                  {display.primary}
                  {display.secondary && (
                    <>
                      <br />
                      <span className="cue__text--secondary">{display.secondary}</span>
                    </>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
