"""Build the Lecture 10 official-example pack from public sources.

Downloads the official slides PDF and timed transcript, writes meta.json
and English cues, and renders slide WebPs. Videos stay out of git;
scripts/fetch-media.sh fetches and concatenates the official chapter files.
"""
from __future__ import annotations

import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LECTURE = ROOT / "public" / "course" / "lectures" / "lecture-10"
SLIDES_DIR = LECTURE / "slides"
COURSE_JSON = ROOT / "public" / "course" / "course.json"

DATA_URL = "https://nlp-course-cuhksz.github.io/js/lecture10-data.js"
PDF_URL = "https://nlp-course-cuhksz.github.io/materials/2026_fall_slides/Lecture10_Multimodal_LLMs.pdf"
PAGE_URL = "https://nlp-course-cuhksz.github.io/lecture10.html"

# Actual durations of the official chapter mp4s, used so cue times match
# the concatenated lecture-10.mp4 produced by scripts/fetch-media.sh.
PART_DURS = [
    445.666667,
    1174.000000,
    1149.133333,
    723.733333,
    970.000000,
    307.933333,
    633.800000,
    371.066667,
    660.200000,
]
CONCAT_DURATION = 6435.565

CHAPTER_IDS = [
    "why-multimodality",
    "clip-and-flamingo",
    "architecture",
    "training",
    "speech",
    "generation",
    "vla-world-models",
    "3d-understanding",
    "outlook",
]


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"GET {url}")
    with urllib.request.urlopen(url, timeout=120) as response:
        dest.write_bytes(response.read())
    print(f"  -> {dest} ({dest.stat().st_size} bytes)")


def load_official_data(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    match = re.search(r"window\.L10\s*=\s*(\{.*)\s*;\s*$", text, re.S)
    if not match:
        raise SystemExit("could not parse official lecture10-data.js")
    raw = match.group(1).strip()
    if raw.endswith(";"):
        raw = raw[:-1]
    return json.loads(raw)


def write_pack(data: dict) -> None:
    LECTURE.mkdir(parents=True, exist_ok=True)
    cues: list[dict] = []
    chapters: list[dict] = []
    offset = 0.0
    for part, chapter_id, part_dur in zip(data["parts"], CHAPTER_IDS, PART_DURS):
        chapters.append(
            {
                "id": chapter_id,
                "title": part["title"],
                "start": round(offset, 3),
                "slide": int(part["first"]),
            }
        )
        for start, end, slide, english, chinese in part["sents"]:
            start_t = round(offset + start, 3)
            end_t = round(offset + end, 3)
            if end_t <= start_t:
                end_t = round(start_t + 0.2, 3)
            text = english.strip()
            if not text:
                continue
            cue = {
                "start": start_t,
                "end": end_t,
                "slide": int(slide),
                "text": text,
            }
            # The official transcript is bilingual; keep the Chinese line so the
            # player can offer EN / 中 / 双语 without calling a translation API.
            zh = (chinese or "").strip()
            if zh:
                cue["text_zh"] = zh
            cue["chapter"] = chapter_id
            cues.append(cue)
        offset += part_dur

    meta = {
        "id": "lecture-10",
        "title": "Multimodal LLMs",
        "subtitle": "Can large models see, hear, speak, act — and understand 3D space?",
        "courseId": "cuhksz-nlp",
        "duration": CONCAT_DURATION,
        "slides": {"count": 134, "pdf": "slides.pdf"},
        "media": {"file": "lecture-10.mp4"},
        "chapters": chapters,
        "source": {
            "instructor": "Benyou Wang",
            "course": "CSC5051 / CSC6052 / MDS5110 · Natural Language Processing",
            "institution": "CUHK-Shenzhen",
            "courseUrl": PAGE_URL,
            "videoUrl": PAGE_URL,
            "licenseNote": "Official example course pack, used with attribution and a link back to the original lecture page. The video is the official AI-narrated recording; this pack does not clone the instructor's voice.",
        },
    }
    transcript = {"cues": cues, "exercises": [], "explorables": []}
    (LECTURE / "meta.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (LECTURE / "transcript.json").write_text(
        json.dumps(transcript, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (LECTURE / "SOURCES.txt").write_text(
        "\n".join(
            [
                "Official example course pack for Lecture 10: Multimodal LLMs.",
                "",
                f"Original lecture: {PAGE_URL}",
                "Instructor: Benyou Wang, CUHK-Shenzhen",
                "Course: CSC5051 / CSC6052 / MDS5110 Natural Language Processing",
                f"Slides: {PDF_URL}",
                "Official chapter videos (not stored in this repository):",
                "  https://wabyking.github.io/nlp2026-videos-2/lecture10/",
                "  Downloaded and concatenated by scripts/fetch-media.sh",
                "",
                "The video is the official AI-narrated recording. This pack does not clone the instructor's voice.",
                "English and Chinese cues both come from the official bilingual transcript.",
                "",
            ]
        ),
        encoding="utf-8",
    )
    with_zh = sum(1 for cue in cues if cue.get("text_zh"))
    print(f"wrote meta, transcript ({len(cues)} cues, {with_zh} with Chinese), SOURCES.txt")


def render_slides(pdf: Path, width: int = 1440) -> None:
    import pymupdf
    from PIL import Image

    SLIDES_DIR.mkdir(parents=True, exist_ok=True)
    doc = pymupdf.open(pdf)
    print(f"rendering {doc.page_count} slides")
    for index, page in enumerate(doc):
        scale = width / page.rect.width
        pix = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale), alpha=False)
        image = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        target = SLIDES_DIR / f"{index + 1:02d}.webp"
        image.save(target, "WEBP", quality=84, method=6)
        if index < 2 or index + 1 == doc.page_count or (index + 1) % 40 == 0:
            print(f"  {target.name} {image.width}x{image.height} {target.stat().st_size // 1024}KB")
    if doc.page_count != 134:
        raise SystemExit(f"expected 134 slides, got {doc.page_count}")
    print(f"{doc.page_count} slides -> {SLIDES_DIR}")


def write_course_json() -> None:
    current = json.loads(COURSE_JSON.read_text(encoding="utf-8"))
    site = current["site"]
    site["attribution"] = (
        "Math 214 © David E. Speyer, University of Michigan, used with attribution and linked back; no Creative Commons license is claimed. "
        "Lecture 10 © Benyou Wang, CUHK-Shenzhen, official example course pack, linked back to the original lecture page. "
        "MAT3007 © Rui Chen, CUHK-Shenzhen, used with attribution for this course demo."
    )
    lecture_card = {
        "id": "lecture-10",
        "code": "CSC5051",
        "course": "Natural Language Processing",
        "title": "Lecture 10 · Multimodal LLMs",
        "institution": "CUHK-Shenzhen",
        "instructor": "Benyou Wang",
        "status": "live",
        "href": "/lecture/lecture-10",
        "cover": {"src": "course/lectures/lecture-10/slides/01.webp"},
        "meta": "Official example · 1:47:16 · 134 slides · 9 chapters",
        "sourceNote": "Official example course pack. Lecture 10: Multimodal LLMs, CUHK-Shenzhen.",
        "sourceUrl": PAGE_URL,
        "videoUrl": PAGE_URL,
        "licenseNote": "Official public lecture used as an example pack, with attribution and a link back to the original page. The video is the official AI-narrated recording; this pack does not clone the instructor's voice.",
    }
    shelf = []
    replaced = False
    for card in current["shelf"]:
        if card["id"] in {"speyer-1b", "lecture-10"}:
            if not replaced:
                shelf.append(lecture_card)
                replaced = True
            continue
        shelf.append(card)
    if not replaced:
        # Keep Speyer first, MAT3007 last if present.
        ids = [card["id"] for card in shelf]
        if "speyer-1a" in ids:
            insert_at = ids.index("speyer-1a") + 1
            shelf.insert(insert_at, lecture_card)
        else:
            shelf.insert(0, lecture_card)
    current["shelf"] = shelf
    COURSE_JSON.write_text(json.dumps(current, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("updated course.json shelf")


def patch_readme() -> None:
    path = ROOT / "README.md"
    text = path.read_text(encoding="utf-8")
    text = text.replace(
        "当前可演示的课：**University of Michigan Math 214 · Lecture 1a**（Speyer）。",
        "当前可演示的课：**University of Michigan Math 214 · Lecture 1a**（Speyer），以及官方范例课包 **CUHK-Shenzhen NLP Lecture 10 · Multimodal LLMs**。",
    )
    text = text.replace(
        "  - Speyer 1a 可进；`Math 214 · Lecture 1b` 与 MAT3007 标 `In preparation`，可居中但不能进。",
        "  - Speyer 1a 与官方范例 Lecture 10 可进；MAT3007 标 `In preparation`，可居中但不能进。",
    )
    old_tree = """public/course/lectures/speyer-1a/
  meta.json                                   # 标题、来源、许可说明、章节、页数
  transcript.json                             # cues + exercises + explorables
  slides/01.webp … 11.webp                    # 按页导出的图
  slides.pdf                                  # 课件原件（公开材料，带署名）
  poster.jpg                                  # 视频首帧，播放器占位
public/course/lectures/mat3007/slides/01.webp # 只放 slides18 第一页（公开已获许可）
public/media/speyer-1a.mp4                    # 不进 git，部署前拉取"""
    new_tree = """public/course/lectures/speyer-1a/
  meta.json                                   # 标题、来源、许可说明、章节、页数
  transcript.json                             # cues + exercises + explorables
  slides/01.webp … 11.webp                    # 按页导出的图
  slides.pdf                                  # 课件原件（公开材料，带署名）
  poster.jpg                                  # 视频首帧，播放器占位
public/course/lectures/lecture-10/            # 官方范例课包，署名并链回原讲页
  meta.json
  transcript.json                             # 英文字幕（官方逐句时间轴）
  slides/01.webp … 134.webp
  slides.pdf
public/course/lectures/mat3007/slides/01.webp # 只放 slides18 第一页（公开已获许可）
public/media/speyer-1a.mp4                    # 不进 git，部署前拉取
public/media/lecture-10.mp4                   # 不进 git，由九段官方章节录像拼接"""
    if old_tree not in text:
        print("README tree block not found exactly; skipped that edit", file=sys.stderr)
    else:
        text = text.replace(old_tree, new_tree)
    text = text.replace(
        "- 题目范例 Lecture 10 只做内部交互对照，不进仓库、不进提交。",
        "- Lecture 10 是官方范例课包：使用其已公开的课件、讲稿时间轴和 AI 讲解录像，署名并链回[原讲页](https://nlp-course-cuhksz.github.io/lecture10.html)，不克隆教师声线。录像不进仓库，由 `scripts/fetch-media.sh` 拉取后拼接。",
    )
    text = text.replace(
        "- MAT3007 完整课包与约束拖动小样在周一之后按同一流水线补；现在只有公开许可的封面第一页。",
        "- MAT3007 完整课包仍在准备中；现在只有公开许可的封面第一页。",
    )
    path.write_text(text, encoding="utf-8")
    print("patched README.md")


def main() -> None:
    cache = ROOT / ".cache" / "lecture-10"
    cache.mkdir(parents=True, exist_ok=True)
    data_js = cache / "lecture10-data.js"
    if not data_js.exists():
        download(DATA_URL, data_js)
    data = load_official_data(data_js)
    if len(data.get("parts", [])) != 9:
        raise SystemExit("official data should have 9 parts")
    write_pack(data)
    pdf = LECTURE / "slides.pdf"
    if not pdf.exists():
        download(PDF_URL, pdf)
    render_slides(pdf)
    write_course_json()
    patch_readme()
    print("Lecture 10 pack is ready (video is still fetched by scripts/fetch-media.sh)")


if __name__ == "__main__":
    main()
