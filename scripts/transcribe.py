"""Transcribe the lecture audio with faster-whisper (CPU int8).

Usage:
    python scripts/transcribe.py .cache/speyer-1a.wav .cache/asr.json
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel

AUDIO = Path(sys.argv[1] if len(sys.argv) > 1 else ".cache/speyer-1a.wav")
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else ".cache/asr.json")
MODEL = sys.argv[3] if len(sys.argv) > 3 else "medium.en"


def read_wav(path: Path) -> np.ndarray:
    """Read a mono 16-bit PCM wav as float32 samples without PyAV."""
    with wave.open(str(path), "rb") as handle:
        if handle.getnchannels() != 1 or handle.getsampwidth() != 2:
            raise SystemExit(f"{path} must be mono 16-bit PCM")
        raw = handle.readframes(handle.getnframes())
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0


model = WhisperModel(MODEL, device="cpu", compute_type="int8", cpu_threads=16)
segments, info = model.transcribe(
    read_wav(AUDIO),
    language="en",
    beam_size=5,
    vad_filter=True,
    vad_parameters={"min_silence_duration_ms": 400},
    word_timestamps=True,
    condition_on_previous_text=False,
)

data = {
    "model": MODEL,
    "language": info.language,
    "duration": info.duration,
    "segments": [],
}
for seg in segments:
    item = {
        "start": round(seg.start, 3),
        "end": round(seg.end, 3),
        "text": seg.text.strip(),
        "words": [
            {
                "start": round(w.start, 3),
                "end": round(w.end, 3),
                "word": w.word,
                "probability": round(w.probability, 3),
            }
            for w in (seg.words or [])
        ],
    }
    data["segments"].append(item)
    print(f"[{seg.start:7.2f} -> {seg.end:7.2f}] {seg.text.strip()}", flush=True)

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"\nwrote {OUT} ({len(data['segments'])} segments)")
