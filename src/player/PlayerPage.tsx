import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { LectureMeta, Transcript } from "../types";
import { loadLecture } from "../lib/loadLecture";
import { loadProgress, saveProgress } from "../lib/storage";
import { useMediaClock } from "./useMediaClock";
import { PlayerView } from "./PlayerView";

type LectureData = { meta: LectureMeta; transcript: Transcript };

export function PlayerPage() {
  const { id = "" } = useParams();
  const [data, setData] = useState<LectureData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [mediaError, setMediaError] = useState(false);
  const [resumedAt, setResumedAt] = useState<number | null>(null);

  // A stable callback ref: an inline one would be re-created on every render,
  // detaching the video and clearing its error state each time.
  const attachVideo = useCallback((element: HTMLVideoElement | null) => {
    setVideo(element);
    if (!element) setMediaError(false);
  }, []);

  const clock = useMediaClock(video);

  useEffect(() => {
    let active = true;
    setData(null);
    setError(null);
    setResumedAt(null);
    loadLecture(id)
      .then((next) => {
        if (active) setData(next);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load the lecture.");
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (resumedAt === null) return;
    const timer = window.setTimeout(() => setResumedAt(null), 5000);
    return () => window.clearTimeout(timer);
  }, [resumedAt]);

  useEffect(() => {
    if (!data || !video || !clock.playing) return;
    const save = () => saveProgress(data.meta.id, video.currentTime);
    const timer = window.setInterval(save, 2000);
    const onLeave = () => save();
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("beforeunload", onLeave);
      save();
    };
  }, [data, video, clock.playing]);

  const handleLoadedMetadata = () => {
    if (!data || !video) return;
    const duration = video.duration || data.meta.duration;
    const saved = loadProgress(data.meta.id);
    if (saved !== null && saved > 1 && saved < duration - 3) {
      video.currentTime = saved;
      setResumedAt(saved);
    }
  };

  if (error) {
    return (
      <main className="page">
        <p className="state state--error" role="alert">
          {error}
        </p>
        <p className="state">
          <a href="#/">← Back to the course map</a>
        </p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="page">
        <p className="state">Loading lecture…</p>
      </main>
    );
  }

  return (
    <PlayerView
      meta={data.meta}
      transcript={data.transcript}
      baseUrl={import.meta.env.BASE_URL}
      time={clock.time}
      duration={clock.duration || data.meta.duration}
      playing={clock.playing}
      rate={clock.rate}
      videoRef={attachVideo}
      onLoadedMetadata={handleLoadedMetadata}
      onVideoError={() => setMediaError(true)}
      onToggle={clock.toggle}
      onSeek={clock.seek}
      onRate={clock.setRate}
      onPause={clock.pause}
      onPlay={clock.play}
      mediaError={mediaError}
      resumedAt={resumedAt}
    />
  );
}
