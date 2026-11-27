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
import { TimeRuler } from "./TimeRuler";
import { SlideStage } from "./SlideStage";
import { VideoPane } from "./VideoPane";
import { ExerciseCard } from "./ExerciseCard";
import { ExplorableOverlay } from "./ExplorableOverlay";
import { Attribution } from "./Attribution";

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

  const [videoVisible, setVideoVisible] = useState(false);
  const [activeExplorable, setActiveExplorable] = useState<ExplorableRef | null>(null);
  const [resumePoint, setResumePoint] = useState<{ time: number; playing: boolean } | null>(null);
  const [openedExercises, setOpenedExercises] = useState<Record<string, boolean>>({});

  const exercise = transcript.exercises.find((item) => item.after_slide === slide) ?? null;
  const explorable =
    transcript.explorables.find((item) => item.slide === slide && time >= item.at) ?? null;

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
    setOpenedExercises((previous) => ({ ...previous, [item.problem]: true }));
    window.open(item.url, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (activeExplorable) return;
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
    <main className="player">
      <h1 className="sr-only">{meta.title}</h1>

      <header className="bar player__bar">
        <a className="brand" href="#/">
          interactive course
        </a>
        <p className="bar__crumb">
          {meta.source.course} <span>/</span> {meta.title}
        </p>
        <div className="bar__actions">
          <button
            type="button"
            className="bar__button"
            onClick={() => setVideoVisible((visible) => !visible)}
            aria-expanded={videoVisible}
          >
            Lecture video
          </button>
          <a className="bar__link" href={pdfHref} download>
            Slides (PDF)
          </a>
        </div>
      </header>

      {mediaError ? (
        <p className="notice" role="status">
          Video unavailable. The slides and transcript still work.
        </p>
      ) : null}

      <div className="player__body">
        <aside className="rail">
          <Chapters chapters={meta.chapters} current={currentChapter} onSelect={goToChapter} />
        </aside>

        <section className="stage">
          <SlideStage meta={meta} baseUrl={baseUrl} slide={slide} />

          <TimeRuler
            time={time}
            duration={duration}
            chapters={meta.chapters}
            currentChapter={currentChapter}
            onSeek={onSeek}
          />

          <Transport
            time={time}
            duration={duration}
            playing={playing}
            rate={rate}
            onToggle={onToggle}
            onRate={onRate}
            onStep={step}
          />

          {exercise ? <ExerciseCard exercise={exercise} onOpen={openExercise} /> : null}

          {explorable ? (
            <button type="button" className="try" onClick={() => openExplorable(explorable)}>
              {explorable.label}
            </button>
          ) : null}

          {Object.keys(openedExercises).length > 0 ? (
            <p className="stage__hint" role="status">
              Question opened in a new tab. Your place here is kept.
            </p>
          ) : null}
        </section>

        <aside className="panel">
          <VideoPane
            meta={meta}
            baseUrl={baseUrl}
            videoRef={videoRef}
            onLoadedMetadata={onLoadedMetadata}
            onVideoError={onVideoError ?? (() => {})}
            visible={videoVisible}
            onToggle={() => setVideoVisible((visible) => !visible)}
          />
          <Captions cues={cues} active={activeCue} onSeek={onSeek} />
        </aside>
      </div>

      <Attribution source={meta.source} />

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
