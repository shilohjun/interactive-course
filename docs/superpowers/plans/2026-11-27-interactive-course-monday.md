# Interactive Course — Speyer 1a Monday Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a shared course player with the complete Speyer 1a lecture pack, a draggable "locally approximately linear" explorable, and a one-click exercise entry, deployed as a static site under `/course/`.

**Architecture:** A Vite + React + TypeScript static site. Course packs are JSON + pre-rendered WebP slide images + a lecture video; the video's `currentTime` is the only clock, and cue/chapter/slide state is derived from it on every frame. Exercises are external links to the existing 步步解 service; explorables are registered modules that pause the video on entry and restore its exact time on exit.

**Tech Stack:** Vite 7, React 19, TypeScript, react-router-dom (HashRouter), Vitest + Testing Library, Playwright (system Chrome/Edge channel), PyMuPDF + faster-whisper for content generation.

**Spec:** `详细设计.md` (§12 is authoritative; this plan implements the Monday scope plus the pack format needed for MAT3007).

## Global Constraints

- UI copy and captions are English only. No Chinese strings in the shipped app.
- Built site must work from `base: '/course/'`. No root-absolute asset URLs (`/foo`); always build from `import.meta.env.BASE_URL`.
- Never touch `bubujie` code or its service. Exercises use `http://101.33.230.189/?problem=<id>` in a new tab.
- No Lecture 10 assets. No MAT3007 assets in the public repo (sample folder stays gitignored).
- No video file in git. `public/media/` is gitignored; `scripts/fetch-media.sh` downloads it and verifies a SHA-256.
- Every lecture page shows attribution: instructor, course page, original video, "unofficial re-cut", no CC license claimed.
- No secrets, tokens, or server credentials in the repo, docs, or build log.
- Media `currentTime` is the source of truth; UI never sets page/caption state independently of it.
- Static only: no backend, no cookies, progress in `localStorage`.
- Keyboard operable player; respect `prefers-reduced-motion`.

## Review Focus

- **Subpath deployment:** every slide image, JSON, PDF, and video URL must include the `/course/` base; a page opened at `/course/#/lecture/speyer-1a` must work after refresh. Test: build and serve under `/course/`, assert all asset requests return 200.
- **Missing or slow media:** if the MP4 404s or metadata never loads, slides, captions, chapters, and the exercise entry must still render with an inline "video unavailable" notice, not a blank screen. Test: Playwright route-aborts the MP4.
- **Empty or one-cue transcript:** `cueAt`/`slideAt` must return safe defaults (no crash, slide 1) for `[]`, a single cue, and `t` beyond the last cue. Test: pure unit tests.
- **Rapid seek + play/pause + rate changes:** after any seek, the visible slide and highlighted caption must match `currentTime` on the next frame; no stale highlight. Test: Playwright seeks via caption click, chapter click, next-slide button, and progress bar.
- **Explorable round-trip:** opening pauses the video; closing restores the exact pre-open time and resumes only if it was playing; progress is unchanged. Test: Playwright with a short test pack.
- **Narrow viewport:** at 390×844 the slide, captions, and transport must not overlap. Visual check with screenshots.

---

### Task 1: Bootstrap the repository and app shell

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles.css`, `src/types.ts`, `src/lib/loadCourse.ts`, `src/map/CourseMap.tsx`
- Modify: `.gitignore`
- Create: `public/course/course.json`
- Test: `src/map/CourseMap.test.tsx`

**Interfaces:**
- Produces: `CourseIndex`, `CourseEntry`, `LectureEntry` in `src/types.ts`; `loadCourseIndex(): Promise<CourseIndex>` in `src/lib/loadCourse.ts`; routes `#/` (map) and `#/lecture/:id` (player placeholder).

- [ ] **Step 1: Init git and ignore build/media artifacts**

Run: `git init` in `D:\interactive-course`; add to `.gitignore`: `node_modules/`, `dist/`, `public/media/`, `.cache/`, `tools/`, `playwright-report/`, `test-results/`, `*.log`. Keep existing `samples/mat3007-slides18/` and `internal/`.

- [ ] **Step 2: Write package.json and configs**

`package.json` scripts: `dev` (vite), `build` (`tsc -b && vite build`), `preview` (vite preview), `test` (`vitest run`), `e2e` (`playwright test`). Dependencies: `react`, `react-dom`, `react-router-dom`. Dev: `vite`, `@vitejs/plugin-react`, `typescript`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `@playwright/test`. `vite.config.ts`: `base: process.env.BASE_PATH ?? '/course/'`, `test: { environment: 'jsdom', setupFiles: './src/test/setup.ts' }`.

- [ ] **Step 3: Build the course map page**

`src/map/CourseMap.tsx` renders `site.title`, `site.tagline`, and one card per course with lecture rows (`title`, duration as `14:01`, slide count, status "live"/"In preparation"). Live lectures link to `#/lecture/:id`; `soon` courses render a disabled card. Footer renders attribution text from `course.json.site.attribution`.

- [ ] **Step 4: Add a failing test for the map**

`CourseMap.test.tsx`: render with a two-course fixture; assert the live lecture link has `href` containing `#/lecture/speyer-1a` and the soon course shows "In preparation".

Run: `npm test -- CourseMap` → FAIL (component missing).

- [ ] **Step 5: Implement routing and make the test pass**

`App.tsx`: `HashRouter` with `Route path="/"` → `CourseMap`, `Route path="/lecture/:id"` → placeholder `PlayerPage` (Task 3 fills it). `loadCourse.ts` fetches `${import.meta.env.BASE_URL}course/course.json`, validates `courses` is an array, throws a typed error otherwise.

Run: `npm test -- CourseMap` → PASS. `npm run build` → succeeds.

- [ ] **Step 6: Commit**

`git add -A && git commit -m "chore: bootstrap course player shell"`.

---

### Task 2: Timeline engine

**Files:**
- Create: `src/lib/timeline.ts`
- Test: `src/lib/timeline.test.ts`

**Interfaces:**
- Consumes: `Cue`, `Chapter` from `src/types.ts`.
- Produces:
  - `cueIndexAt(cues: Cue[], t: number): number` (last cue with `start <= t`, `-1` if none)
  - `activeCueAt(cues: Cue[], t: number): Cue | null` (`start <= t < end`)
  - `slideAt(cues: Cue[], t: number): number` (slide of `cueIndexAt`, `1` when `-1`)
  - `chapterAt(chapters: Chapter[], t: number): Chapter | null`
  - `firstTimeOfSlide(cues: Cue[], slide: number): number | null`
  - `nextSlide(cues: Cue[], current: number, direction: 1 | -1, slideCount: number): number`
  - `formatTime(seconds: number): string` (`m:ss`, `0:00` for negative/NaN)
  - `clampTime(t: number, duration: number): number`

- [ ] **Step 1: Write failing tests for edge cases**

Tests: empty array → `cueIndexAt` `-1`, `slideAt` `1`, `activeCueAt` null, `nextSlide` stays 1. One cue `{start:5,end:9,slide:3}` → at `4` slide 1, at `5` slide 3 and active, at `9` slide 3 but active null. `t` beyond last → last slide. `nextSlide([...slides 1,3,5], 3, 1, 5)` → 5; from 5 forward → 5; from 1 back → 1. `formatTime(0)` `"0:00"`, `formatTime(75)` `"1:15"`, `formatTime(NaN)` `"0:00"`.

- [ ] **Step 2: Run tests to confirm failure**

Run: `npm test -- timeline` → FAIL.

- [ ] **Step 3: Implement with binary search**

Implement `cueIndexAt` over sorted `start` using binary search; derive the rest from it. `nextSlide` finds the nearest slide number in the requested direction by scanning cue slides, not by ±1.

- [ ] **Step 4: Run tests to confirm pass**

Run: `npm test -- timeline` → PASS.

- [ ] **Step 5: Commit**

`git commit -m "feat: timeline engine with edge-case tests"`.

---

### Task 3: Player clock, sync, and transport

**Files:**
- Create: `src/player/PlayerPage.tsx`, `src/player/useMediaClock.ts`, `src/player/SlideStage.tsx`, `src/player/Captions.tsx`, `src/player/Chapters.tsx`, `src/player/Transport.tsx`, `src/lib/storage.ts`, `src/lib/loadLecture.ts`
- Test: `src/player/PlayerPage.test.tsx`, `src/lib/storage.test.ts`

**Interfaces:**
- Consumes: timeline functions; `LectureMeta`, `Transcript`.
- Produces: `useMediaClock(videoRef, duration)` → `{ time, playing, toggle, play, pause, seek, rate, setRate }`; `saveProgress(id, time)`, `loadProgress(id): number | null` (localStorage key `ic:v1:progress:<id>`); `PlayerPage` loads `${base}course/lectures/<id>/meta.json` + `transcript.json`.

- [ ] **Step 1: Write failing storage tests**

`saveProgress('a', 12.5)` then `loadProgress('a')` → `12.5`; unknown key → `null`; invalid JSON → `null`; values `< 1` or `> 86400` ignored on load.

- [ ] **Step 2: Implement storage**

Try/catch around `localStorage`; round to 0.1s; ignore malformed payloads.

- [ ] **Step 3: Write failing component test with a mocked clock**

Mock `useMediaClock` to return `time: 300`; render `PlayerPage` with fixture meta/transcript; assert slide 6 image `src`, caption containing that cue is highlighted (`aria-current="true"`), chapter list has 5 items, and clicking the chapter "Light" calls `seek(463)`. Also assert `slide 1` and no `aria-current` for an empty-transcript fixture.

- [ ] **Step 4: Implement the player**

Layout: left chapter rail, center stage (slide image + 32% video overlay with a "Video" toggle), right captions panel, bottom transport. Clock: `requestAnimationFrame` loop while `playing`, plus `seeked`/`timeupdate`/`loadedmetadata`. `time` from `video.currentTime`. Slide/caption/chapter derived only from `time`. Seek actions: caption click → `seek(cue.start)`; chapter click → `seek(chapter.start)`; prev/next → `firstTimeOfSlide` of `nextSlide`; progress range input → `seek`. Keyboard: Space toggles (when not in an input), ArrowLeft/Right = prev/next slide. On load, `loadProgress` restores time if between 1s and `duration - 5` and shows "Resumed at m:ss" for 4s. Save progress every 2s while playing and on pause/unload.

- [ ] **Step 5: Run tests, build, and commit**

Run: `npm test -- PlayerPage storage` → PASS; `npm run build` → PASS; commit `feat: synchronized player`.

---

### Task 4: Exercise entry and lecture downloads

**Files:**
- Create: `src/player/ExerciseCard.tsx`, `src/components/Attribution.tsx`, `src/lib/loadLecture.ts` (extend)
- Modify: `src/player/PlayerPage.tsx`
- Test: `src/player/ExerciseCard.test.tsx`

**Interfaces:**
- Consumes: `Exercise`, `LectureMeta`.
- Produces: `ExerciseCard({ exercise, onOpen })`; `Attribution({ source })`; header "Slides (PDF)" link.

- [ ] **Step 1: Write failing test**

Render `ExerciseCard` with `{after_slide:3,label:'Start a question',problem:'p1',url:'http://101.33.230.189/?problem=p1'}`; assert link has `target="_blank"`, `rel` contains `noopener`, `href` exact; click calls `onOpen` and not navigation (mock `window.open`). Assert a card with `problem: ''` renders disabled text "Question coming soon".

- [ ] **Step 2: Implement**

Card appears when `currentSlide === exercise.after_slide` (or `>=` if configured `persist: true`; default exact). On open: pause video, `window.open(url, '_blank', 'noopener,noreferrer')`, mark `ic:v1:exercise:<id>` in localStorage. Attribution row: "Lecture by David E. Speyer · University of Michigan Math 214 · [Course page] · [Original video] · Unofficial re-cut for a course demo; no CC license is claimed."

- [ ] **Step 3: Test, build, commit**

Run tests; commit `feat: exercise entry and attribution`.

---

### Task 5: Explorable integration

**Files:**
- Create: `src/player/ExplorableOverlay.tsx`, `src/explorables/registry.ts`
- Modify: `src/player/PlayerPage.tsx`
- Test: `src/player/ExplorableOverlay.test.tsx`

**Interfaces:**
- Consumes: `ExplorableRef`; registry maps `module` → React component.
- Produces: `ExplorableOverlay({ explorable, onClose })`; `openExplorable(e)` pauses and stores `{ time, playing }`; `closeExplorable()` seeks back and resumes if it was playing; Esc closes.

- [ ] **Step 1: Write failing test**

Mock a `TestExplorable`; open at time 300 while playing; assert `pause` called; close; assert `seek(300)` and `play` called. Open while paused; close; assert no `play`.

- [ ] **Step 2: Implement overlay and card**

"Try it" card appears when `currentSlide === e.slide && time >= e.at`; label from data. Overlay: full-stage panel, header label + close, rendered module, `role="dialog"` `aria-modal="true"`, Esc handler, focus the close button.

- [ ] **Step 3: Test, commit**

`feat: explorable overlay with pause/resume`.

---

### Task 6: ApproxLinear explorable

**Files:**
- Create: `src/explorables/approx-linear/ApproxLinear.tsx`, `src/explorables/approx-linear/math.ts`
- Test: `src/explorables/approx-linear/math.test.ts`, `src/explorables/approx-linear/ApproxLinear.test.tsx`

**Interfaces:**
- Produces: `f(x)`, `df(x)`, `tangent(f, df, x0)` → `(x) => number`, `maxError(f, tangent, x0, window)` → number; component with a draggable tangent point, window-width slider, tangent line, curve, zoom inset, and error readout.

- [ ] **Step 1: Failing math tests**

`f(0)=0`; `df(0)` for `f(x)=x**3/3 - x` is `-1`; tangent at 0: `g(1)=-1`; `maxError` on window `[−0.5,0.5]` shrinks as window shrinks (assert `maxError(0.25) < maxError(0.5)`).

- [ ] **Step 2: Implement math and SVG component**

Curve `f(x) = x³/3 − x` on `x ∈ [−2.4, 2.4]`. Drag the point horizontally (pointer events + keyboard ArrowLeft/Right on a focusable handle). Show `x₀`, `f(x₀)`, `f′(x₀)`, max error over the window. Zoom inset: plot `f` and tangent over `[x₀−w, x₀+w]`. Copy: "Near x₀, the curve and its tangent agree. That is what 'approximately linear' means." and "In one variable this is calculus. Linear algebra does it for many functions of many variables."

- [ ] **Step 3: Test interaction and commit**

Component test: dragging the handle (fire pointer events) changes displayed `x₀`; ArrowRight moves it. Commit `feat: locally approximately linear explorable`.

---

### Task 7: Content pack — transcript, slides, chapters

**Files:**
- Create: `scripts/build_cues.py`, `scripts/fetch-media.sh`, `public/course/lectures/speyer-1a/meta.json`, `public/course/lectures/speyer-1a/transcript.json`, `public/course/lectures/speyer-1a/slides.pdf`, `public/course/lectures/speyer-1a/slides/*.webp`
- Test: `src/lib/content.test.ts` (schema validation)

**Interfaces:**
- Produces: valid `meta.json` + `transcript.json` for `speyer-1a`; slide times: `[1→0, 2→33, 3→72, 4→106, 5→166, 6→262, 7→400, 8→444, 9→463, 10→633, 11→727]` (verify against frames, ±2s); 5 chapters; 1 explorable at slide 6; 1 exercise after slide 3.

- [ ] **Step 1: Run ASR and build cues**

`python scripts/transcribe.py .cache/speyer-1a.wav .cache/asr.json medium.en`; `python scripts/build_cues.py .cache/asr.json .cache/slide-times.json public/course/lectures/speyer-1a/transcript.json`. Sentence cues 3–12s, split on `.!?` and gaps > 0.7s; assign slide by cue start; assign chapter by slide.

- [ ] **Step 2: Proofread**

Read all cues; fix math terms (`f′(x₀)`, `superimpose`, `linear equations`, `planes`, `electromagnetism`); ensure no ASR hallucination in silence. Keep timings.

- [ ] **Step 3: Write meta/course JSON and copy assets**

`meta.json`: title, course, instructor, source URLs, license note, 5 chapters, 11 slides, `media.file: "speyer-1a.mp4"`. Copy `Lecture1a.pdf` → `slides.pdf`. Add `scripts/fetch-media.sh` with URL, output path, and SHA-256 of `speyer-1a.mp4`.

- [ ] **Step 4: Validate schema and commit**

`content.test.ts`: parses both JSON files, asserts cues sorted, `start < end`, slides 1..11, chapters sorted, exactly one exercise/explorable, URLs start with `http://101.33.230.189/?problem=`. Run tests; commit `feat: speyer 1a course pack`.

---

### Task 8: End-to-end verification, deploy artifacts, docs

**Files:**
- Create: `playwright.config.ts`, `e2e/player.spec.ts`, `deploy/nginx-course.conf`, `deploy/course.service`, `deploy/deploy.sh`, `README.md`, `docs/build-log.md`, `docs/one-pager.md`, `docs/demo-script.md`
- Modify: `src/player/PlayerPage.tsx` (error states), `src/styles.css`

- [ ] **Step 1: Add Playwright config and smoke test**

Use `channel: 'chrome'` (fallback `msedge`), `webServer` runs `npm run dev -- --port 5174`. Test: open `/course/` → click lecture → video metadata ready → click caption → `video.currentTime` ≈ cue start; click next slide → slide image matches; open explorable → video paused → close → time restored; exercise link target/rel; reload → progress restored.

- [ ] **Step 2: Error-state tests**

Route-abort `**/media/*.mp4`; assert "Video unavailable" notice and captions still render. Missing transcript → error panel with retry, no crash.

- [ ] **Step 3: Build deploy artifacts**

`nginx-course.conf`: `location /course/ { alias <dist>/; try_files $uri $uri/ /course/index.html; }` plus `location /course { return 301 /course/; }` and media caching headers. `course.service`: run a static server on `127.0.0.1:5174` from `dist/`. `deploy.sh`: rsync `dist/` + `public/media/` to the server path (host arg, no credentials embedded), then `systemctl restart course`. Document that a human with SSH runs it.

- [ ] **Step 4: Write README, build log, one-pager draft, demo script**

README: what it is, live URL, reproduce (`npm ci`, `npm run build`, `scripts/fetch-media.sh`), pack format, attribution/licensing, deploy steps, Monday checklist. `docs/build-log.md`: started 2026-11-27, entries with time/model/cost. `docs/one-pager.md`: results, contribution, AI tools/costs, human time, non-AI person-month breakdown (measured per-lecture time × lectures), limitations. `docs/demo-script.md`: 2–3 minute shot list.

- [ ] **Step 5: Visual polish and screenshots**

Load `frontend-design` guidance; review desktop 1440×900 and mobile 390×844 screenshots; fix overlap, contrast, focus states. Commit `feat: deploy artifacts and docs`.

---

## Self-Review

- **Spec coverage:** §12.1 Monday scope → Tasks 1–8; §12.2 final scope → pack format supports MAT3007 (Task 7); §12.3 stack → Task 1; §12.4 media/attribution → Tasks 4, 7, 8; §12.5 exercise → Task 4; §12.6 deploy → Task 8; §12.7 repo → Task 1; §12.8 transcript/build log → Tasks 7, 8.
- **Type consistency:** `Cue.start/end/slide/text/chapter` used in Tasks 2, 3, 7; `ExplorableRef.at/slide/module` used in Tasks 3, 5; `Exercise.after_slide/problem/url` used in Task 4.
- **Review focus tests:** subpath (Task 8), missing media (Task 8), empty cues (Task 2), rapid seek (Task 8), explorable round-trip (Tasks 5, 8), narrow viewport (Task 8).
