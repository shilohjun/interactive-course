import { useEffect, useState } from "react";
import type { ExplorableRef, Exercise, LectureMeta, Transcript } from "../types";
import {
  activeCueAt,
  chapterAt,
  firstTimeOfSlide,
  formatTime,
  nextSlide,
  slideAt,
} from "../lib/timeline";
import { Chapters } from "./Chapters";
import { Captions } from "./Captions";
import { Transport } from "./Transport";
import { SlideStage } from "./SlideStage";
import { VideoPane } from "./VideoPane";
import { ExerciseCard } from "./ExerciseCard";
import { ExplorableOverlay } from "./ExplorableOverlay";
import { InfoPanel } from "./InfoPanel";

type Panel = "chapters" | "transcript" | "info" | null;

export type PlayerViewProps = {
  meta: LectureMeta;
  transcript: Transcript;
  baseUrl: string;
  time: number;
  duration: number;
  playing: boolean;
  rate: number;
  videoRef: (element: HTMLVideoElement | null) => void;
  onLoadedMetadata: () => void;
  onVideoError?: () => void;
  onToggle: () => void;
  onSeek: (time: number) => void;
  onRate: (rate: number) => void;
  onPause: () => void;
  onPlay: () => void;
  mediaError?: boolean;
  resumedAt?: number | null;
};

export function PlayerView({
  meta,
  transcript,
  baseUrl,
  time,
  duration,
  playing,
  rate,
  videoRef,
  onLoadedMetadata,
  onVideoError,
  onToggle,
  onSeek,
  onRate,
  onPause,
  onPlay,
  mediaError = false,
  resumedAt = null,
}: PlayerViewProps) {
  const cues = transcript.cues;
  const slide = slideAt(cues, time);
  const activeCue =
    activeCueAt(cues, time) ??
    (cues.length > 0 && time < cues[0].start ? cues[0] : null);
  const currentChapter = chapterAt(meta.chapters, time);

  const [panel, setPanel] = useState<Panel>(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return "transcript";
    }
    return window.matchMedia("(max-width: 900px)").matches ? null : "transcript";
  });
  const [videoOpen, setVideoOpen] = useState(false);
  const [activeExplorable, setActiveExplorable] = useState<ExplorableRef | null>(null);
  const [resumePoint, setResumePoint] = useState<{ time: number; playing: boolean } | null>(null);

  const exercise = transcript.exercises.find((item) => item.after_slide === slide) ?? null;
  const explorable =
    transcript.explorables.find((item) => item.slide === slide && time >= item.at) ?? null;

  const togglePanel = (next: Exclude<Panel, null>) => {
    setPanel((current) => (current === next ? null : next));
  };

  const step = (direction: 1 | -1) => {
    const target = nextSlide(cues, slide, direction, meta.slides.count);
    const at = firstTimeOfSlide(cues, target);
    if (at !== null) onSeek(at);
  };

  const goToChapter = (chapter: { slide: number; start: number }) => {
    const at = firstTimeOfSlide(cues, chapter.slide);
    onSeek(at ?? chapter.start);
  };

  const openExplorable = (item: ExplorableRef) => {
    setResumePoint({ time, playing });
    onPause();
    setActiveExplorable(item);
  };

  const closeExplorable = () => {
    const saved = resumePoint;
    setResumePoint(null);
    setActiveExplorable(null);
    if (saved) {
      onSeek(saved.time);
      if (saved.playing) onPlay();
    }
  };

  const openExercise = (item: Exercise) => {
    onPause();
    window.open(item.url, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (activeExplorable) return;
      if (event.key === "Escape") {
        setPanel(null);
        setVideoOpen(false);
        return;
      }
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag && ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(tag)) return;

      if (event.key === " ") {
        event.preventDefault();
        onToggle();
        return;
      }
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const target = nextSlide(cues, slide, direction, meta.slides.count);
        const at = firstTimeOfSlide(cues, target);
        if (at !== null) onSeek(at);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeExplorable, cues, meta.slides.count, onSeek, onToggle, slide]);

  const pdfHref = `${baseUrl}course/lectures/${meta.id}/${meta.slides.pdf}`;

  return (
    <main className={`player${panel ? " player--panel" : ""}`}>
      <h1 className="sr-only">{meta.title}</h1>

      <header className="bar player-bar">
        <a className="brand" href="#/">
          ← Courses
        </a>
        <p className="player-crumb">
          {meta.source.course} <span>/</span> {meta.title}
        </p>
        <div className="bar-actions">
          <button
            type="button"
            className={panel === "chapters" ? "is-active" : undefined}
            onClick={() => togglePanel("chapters")}
            aria-expanded={panel === "chapters"}
          >
            Chapters
          </button>
          <button
            type="button"
            className={panel === "transcript" ? "is-active" : undefined}
            onClick={() => togglePanel("transcript")}
            aria-expanded={panel === "transcript"}
          >
            Transcript
          </button>
          <button
            type="button"
            className={videoOpen ? "is-active" : undefined}
            onClick={() => setVideoOpen((open) => !open)}
            aria-expanded={videoOpen}
          >
            Lecture video
          </button>
          <button
            type="button"
            className={panel === "info" ? "is-active" : undefined}
            onClick={() => togglePanel("info")}
            aria-expanded={panel === "info"}
          >
            Info
          </button>
        </div>
      </header>

      <div className="player-body">
        <div className="board-area">
          <div className="board-wrap">
            <SlideStage meta={meta} baseUrl={baseUrl} slide={slide} />

            {exercise ? <ExerciseCard exercise={exercise} onOpen={openExercise} /> : null}

            {explorable ? (
              <button type="button" className="try" onClick={() => openExplorable(explorable)}>
                {explorable.label}
              </button>
            ) : null}

            <VideoPane
              meta={meta}
              baseUrl={baseUrl}
              videoRef={videoRef}
              onLoadedMetadata={onLoadedMetadata}
              onVideoError={onVideoError ?? (() => {})}
              visible={videoOpen}
              onToggle={() => setVideoOpen(false)}
            />
          </div>

          {mediaError ? (
            <p className="player-notice" role="status">
              Video unavailable. The slides and transcript still work.
            </p>
          ) : null}
        </div>

        {panel ? (
          <aside className={`side-panel side-panel--${panel}`}>
            {panel === "chapters" ? (
              <Chapters
                chapters={meta.chapters}
                current={currentChapter}
                onSelect={goToChapter}
                onClose={() => setPanel(null)}
              />
            ) : null}
            {panel === "transcript" ? (
              <Captions
                cues={cues}
                active={activeCue}
                onSeek={onSeek}
                onClose={() => setPanel(null)}
              />
            ) : null}
            {panel === "info" ? (
              <InfoPanel meta={meta} pdfHref={pdfHref} onClose={() => setPanel(null)} />
            ) : null}
          </aside>
        ) : null}
      </div>

      <div className="player-bottom">
        <div className="caption">
          <span className="caption__time">
            {activeCue ? formatTime(activeCue.start) : formatTime(time)}
          </span>
          <p className="caption__text">
            {activeCue ? activeCue.text : "No transcript line at this point."}
          </p>
          <button
            type="button"
            className="caption__open"
            onClick={() => togglePanel("transcript")}
          >
            Transcript
          </button>
        </div>

        <Transport
          time={time}
          duration={duration}
          playing={playing}
          rate={rate}
          chapters={meta.chapters}
          currentChapter={currentChapter}
          onToggle={onToggle}
          onSeek={onSeek}
          onRate={onRate}
          onStep={step}
        />
      </div>

      {activeExplorable ? (
        <ExplorableOverlay explorable={activeExplorable} onClose={closeExplorable} />
      ) : null}

      {resumedAt !== null ? (
        <div className="toast" role="status">
          Resumed at {formatTime(resumedAt)}
        </div>
      ) : null}
    </main>
  );
}
