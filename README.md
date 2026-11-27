# Interactive Course

一台共用播放器，把已有课程材料变成可以讲解、同步翻页、随时提问的交互课程。当前可演示的课：**University of Michigan Math 214 · Lecture 1a**（Speyer）。

- 设计说明：[`详细设计.md`](详细设计.md)（§12 为 2026-11-27 第二轮确认）
- 实现计划：[`docs/superpowers/plans/2026-11-27-interactive-course-monday.md`](docs/superpowers/plans/2026-11-27-interactive-course-monday.md)
- 构建日志：[`docs/build-log.md`](docs/build-log.md)
- 周一演示脚本：[`docs/demo-script.md`](docs/demo-script.md)
- 一页说明初稿：[`docs/one-pager.md`](docs/one-pager.md)

## 现在能做什么

- **课程地图** `/course/#/`：三门课程位（Speyer 已上线；MAT3007 标注 In preparation）。
- **播放器** `/course/#/lecture/speyer-1a`
  - 媒体 `currentTime` 是唯一时钟；自动翻页、字幕高亮、章节状态都从它推导。
  - 手动翻页、点章节、点字幕都会 seek 到对应起点，seek 后页码与字幕重新对齐。
  - 英文逐句字幕、点句跳转、当前句滚动高亮。
  - 1× / 1.25× / 1.5×、进度条、上一页/下一页、空格与方向键。
  - 进度存 `localStorage`，重新打开会回到上次位置。
  - 官方录像默认收起；点顶部 “Lecture video” 打开，音频继续。
  - 课件 PDF 下载与完整署名。
- **探索小样**「局部近似线性」：拖动切点、显示切线与误差、放大窗、Zoom in / Reset；打开时暂停主媒体，关闭后回到原秒并恢复播放。
- **练习入口**：在配置的页出现，新标签打开步步解；课程页保留进度。

## 本地运行

需要 Node 20+（本机用 Node 24）、npm、Python 3.10+（只在重建内容时需要）。

```bash
npm ci
npm run dev          # http://localhost:5174/course/
npm run build        # 产物在 dist/，base 为 /course/
npm test             # Vitest：时间轴、存储、组件、课包校验
npx playwright test  # 端到端：同步、练习、探索小样、视频缺失降级
```

开发服务器只监听 `localhost`；如果要用 `127.0.0.1` 访问，请用 `localhost` 或自行加 `--host`。

## 课包结构

```text
public/course/course.json                     # 课程列表、封面文案、署名
public/course/lectures/speyer-1a/
  meta.json                                   # 标题、来源、许可说明、章节、页数
  transcript.json                             # cues + exercises + explorables
  slides/01.webp … 11.webp                    # 按页导出的图
  slides.pdf                                  # 课件原件（公开材料，带署名）
  poster.jpg                                  # 视频首帧，播放器占位
public/media/speyer-1a.mp4                    # 不进 git，部署前拉取
```

`transcript.json` 的字幕字段是 `{ start, end, slide, text, chapter? }`（秒）。播放器不关心媒体是官方录像还是 TTS，换一套课包就能上新课。

## 内容流水线

```bash
# 1. 拉官方录像到 public/media/，并校验 SHA-256（仓库只留脚本，不留视频）
bash scripts/fetch-media.sh

# 2. 抽 16 kHz 单声道音频（需 ffmpeg；imageio-ffmpeg 也可）
ffmpeg -i public/media/speyer-1a.mp4 -vn -ac 1 -ar 16000 -c:a pcm_s16le .cache/speyer-1a.wav

# 3. Whisper 转写（CPU int8，medium.en；词级时间戳）
KF_DUPLICATE_LIB_OK=TRUE python scripts/transcribe.py .cache/speyer-1a.wav .cache/asr.json medium.en

# 4. 按画面翻页点切句并生成 transcript.json
python scripts/build_cues.py .cache/asr.json data/speyer-1a.timeline.json \
  public/course/lectures/speyer-1a/transcript.json .cache/cues.md

# 5. 课件页图（可选，已提交）
python scripts/slides_to_webp.py samples/speyer-1a/Lecture1a.pdf \
  public/course/lectures/speyer-1a/slides 1440
```

翻页点来自逐帧比对（`scripts/detect_slides.py` 与 `scripts/inspect_frames.py`），当前值写在 `data/speyer-1a.timeline.json` 的 `slideStarts`：`[0, 33, 73, 107, 115, 167, 271, 399, 463, 631, 726]`。校对词表也在这个文件的 `fixes` 里，重跑不会丢。

Speyer 视频没有任何字幕轨，英文字幕由 Whisper 生成后逐句校对。已知少量自动切句仍会在幻灯片切换处断开，属可接受范围；课程页的页与句同步不受影响。

## 部署（人工执行）

设计约定：dsh 只交构建产物和部署文件，**不直接改服务器、不碰 Nginx 根路径、不碰步步解**。

1. 构建机执行 `bash deploy/deploy.sh user@101.33.230.189`。脚本会 `npm ci`、拉视频、构建，然后 rsync 到 `/opt/interactive-course/current/`。
2. 在服务器上把 [`deploy/nginx-course.conf`](deploy/nginx-course.conf) 放进现有的 `server {}`，`nginx -t && systemctl reload nginx`。只新增 `/course`，保留已有 `/` → 5173。
3. 安装 [`deploy/course.service`](deploy/course.service)，`systemctl enable --now course`。服务只监听 `127.0.0.1:5174`。
4. 打开 `http://101.33.230.189/course/`，按 [`docs/demo-script.md`](docs/demo-script.md) 走一遍。
5. 确认 `http://101.33.230.189/` 的步步解仍然正常。

`/course` 必须 301 到 `/course/`；构建 `base` 固定为 `/course/`，避免资源打到根路径。

## 署名与许可

- Speyer Math 214 的材料是公开的，但没有标准 Creative Commons 声明。本仓库与站点使用其 slides 和官方录像时**署名并链回**课程页与原视频，不暗示官方授权，也不改变原许可。
- 课程页底部与每讲 `meta.json` 都带 instructor、课程页、原视频和「非官方转制」说明。
- 公开仓库不存录像，只存 `fetch-media.sh` 与 SHA-256。
- 题目范例 Lecture 10 只做内部交互对照，不进仓库、不进提交。

## 已知限制

- 练习 Deep link 的题号目前是占位 `LINALG1`，等步步解题库真 id 到位后替换。
- 字幕是自动转写后校对的；个别数学符号（如 `f′(x₀)`）在字幕里写作文字形式。
- 高亮做到「页级」；区域级高亮字段已预留（`highlight`），尚未实现。
- MAT3007 课包与约束拖动小样在周一之后按同一流水线补。
- 移动端可用，但播放器为桌面优先设计。

## 目录

```text
src/                 React 应用（课程地图、播放器、探索小样）
public/course/       课包与课程索引
data/                每讲的翻页点、章节、校对配置
scripts/             转写、切句、页图、抽帧、截图
deploy/              nginx 片段、systemd 单元、静态服务器、部署脚本
docs/                计划、构建日志、一页说明、演示脚本
e2e/                 Playwright 端到端
samples/             原始课件（MAT3007 不进公开仓库）
```
