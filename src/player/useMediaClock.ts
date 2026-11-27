import { useCallback, useEffect, useState } from "react";
import { clampTime } from "../lib/timeline";

export type MediaClock = {
  time: number;
  playing: boolean;
  duration: number;
  rate: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  setRate: (rate: number) => void;
};

export function useMediaClock(video: HTMLVideoElement | null): MediaClock {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [rate, setRateState] = useState(1);

  useEffect(() => {
    if (!video) return;

    let raf = 0;
    const sync = () => setTime(video.currentTime);
    const loop = () => {
      sync();
      raf = requestAnimationFrame(loop);
    };

    const onPlay = () => {
      setPlaying(true);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    };
    const onPause = () => {
      setPlaying(false);
      cancelAnimationFrame(raf);
      raf = 0;
      sync();
    };
    const onLoaded = () => {
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
      sync();
    };
    const onSeeked = () => sync();
    const onTimeUpdate = () => {
      if (!video.paused) sync();
    };
    const onRateChange = () => setRateState(video.playbackRate);

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ratechange", onRateChange);

    if (video.readyState >= 1) onLoaded();

    return () => {
      cancelAnimationFrame(raf);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ratechange", onRateChange);
    };
  }, [video]);

  const play = useCallback(() => {
    video?.play().catch(() => {
      // Autoplay can be blocked; the play button remains available.
    });
  }, [video]);

  const pause = useCallback(() => {
    video?.pause();
  }, [video]);

  const toggle = useCallback(() => {
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {
        // Autoplay can be blocked; the play button remains available.
      });
    } else {
      video.pause();
    }
  }, [video]);

  const seek = useCallback(
    (target: number) => {
      if (!video) return;
      const next = clampTime(target, video.duration || duration);
      video.currentTime = next;
      setTime(next);
    },
    [video, duration],
  );

  const setRate = useCallback(
    (next: number) => {
      if (!video) return;
      video.playbackRate = next;
      setRateState(next);
    },
    [video],
  );

  return { time, playing, duration, rate, play, pause, toggle, seek, setRate };
}
