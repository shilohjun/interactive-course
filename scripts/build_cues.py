"""Turn faster-whisper output into sentence-level cues aligned to slides.

Usage:
    python scripts/build_cues.py .cache/asr.json data/speyer-1a.timeline.json \
        public/course/lectures/speyer-1a/transcript.json [.cache/cues.md]
"""
import json
import re
import sys
from bisect import bisect_right
from pathlib import Path

ASR = Path(sys.argv[1])
CONFIG = Path(sys.argv[2])
OUT = Path(sys.argv[3])
SHEET = Path(sys.argv[4]) if len(sys.argv) > 4 else None


def clean(text: str) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"\s+([,.;:?!])", r"\1", text)
    return text


def main() -> None:
    asr = json.loads(ASR.read_text(encoding="utf-8"))
    config = json.loads(CONFIG.read_text(encoding="utf-8"))
    starts = config["slideStarts"]
    fixes = config.get("fixes", [])

    words = []
    for segment in asr["segments"]:
        segment_words = segment.get("words") or []
        if not segment_words:
            continue
        for word in segment_words:
            token = word["word"]
            if token.strip():
                words.append({"start": word["start"], "end": word["end"], "word": token})

    sentences = []
    current = []
    for index, word in enumerate(words):
        current.append(word)
        text = clean("".join(item["word"] for item in current))
        next_start = words[index + 1]["start"] if index + 1 < len(words) else None
        gap = (next_start - word["end"]) if next_start is not None else 99.0
        duration = word["end"] - current[0]["start"]
        token = word["word"].strip()
        ends_sentence = bool(re.search(r"[.!?][\"')\]]?$", token))
        boundary = False
        if ends_sentence and len(text) >= 25:
            boundary = True
        elif gap > 0.8 and len(text) >= 35:
            boundary = True
        elif duration >= 13.0 or len(text) >= 190:
            boundary = True
        elif duration >= 8.0 and len(text) >= 80 and token.endswith(","):
            boundary = True
        if boundary:
            sentences.append(current)
            current = []
    if current:
        sentences.append(current)

    def slide_of(time: float) -> int:
        return max(1, min(len(starts), bisect_right(starts, time)))

    chapters = []
    for chapter in config["chapters"]:
        chapters.append({**chapter, "start": starts[chapter["slide"] - 1]})

    cues = []
    for sentence in sentences:
        parts = []
        part = []
        for word in sentence:
            if part and slide_of(word["start"]) != slide_of(part[0]["start"]):
                parts.append(part)
                part = []
            part.append(word)
        if part:
            parts.append(part)

        for chunk in parts:
            start = round(chunk[0]["start"], 2)
            end = round(max(chunk[-1]["end"], start + 0.8), 2)
            text = clean("".join(item["word"] for item in chunk))
            for fix in fixes:
                text = text.replace(fix["find"], fix["replace"])
            slide = slide_of(start)
            cue_chapter = None
            for chapter in chapters:
                if chapter["start"] <= start:
                    cue_chapter = chapter["id"]
            cue = {"start": start, "end": end, "slide": slide, "text": text}
            if cue_chapter:
                cue["chapter"] = cue_chapter
            cues.append(cue)

    # Fold very short fragments backwards, then forwards, so a caption never
    # flashes a single word.
    merged = []
    for cue in cues:
        short = (cue["end"] - cue["start"]) < 1.8 or len(cue["text"]) < 12
        if merged and short and cue["start"] - merged[-1]["end"] < 1.0:
            previous = merged[-1]
            previous["text"] = f"{previous['text']} {cue['text']}"
            previous["end"] = cue["end"]
        else:
            merged.append(cue)

    folded = []
    index = 0
    while index < len(merged):
        cue = merged[index]
        short = (cue["end"] - cue["start"]) < 1.8 or len(cue["text"]) < 12
        if short and index + 1 < len(merged):
            following = merged[index + 1]
            following["start"] = cue["start"]
            following["text"] = f"{cue['text']} {following['text']}".strip()
            index += 1
            continue
        folded.append(cue)
        index += 1
    cues = folded

    transcript = {
        "cues": cues,
        "exercises": config.get("exercises", []),
        "explorables": config.get("explorables", []),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(transcript, ensure_ascii=False, indent=1), encoding="utf-8")

    if SHEET:
        SHEET.parent.mkdir(parents=True, exist_ok=True)
        with SHEET.open("w", encoding="utf-8") as handle:
            for cue in cues:
                handle.write(f"[{cue['start']:7.2f}] slide {cue['slide']:2d}  {cue['text']}\n")

    print(f"{len(cues)} cues, {len(chapters)} chapters -> {OUT}")


if __name__ == "__main__":
    main()
