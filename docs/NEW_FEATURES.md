# 新增功能使用说明

## 0. 可自由摆放的课件板

### 功能
- **默认**：贴合居中，跟着窗口和面板自动缩放到刚好放下，行为与之前一致。
- **移动**：直接在课件板上按住拖动（鼠标或手指）。板面光标是 `grab`。
- **缩放**：拖右下角手柄。宽高锁定课件自身比例，最小宽 240px，最大到板区边界。
- **贴合**：右上角 `Fit` 回到自动贴合，并清掉记住的位置。
- **边界**：不会拖出板区的留白，窗口或侧栏变化时会自动收回可见范围。
- **位置记忆**：按讲座分别存 `board-box:<lectureId>`，重开同一直播仍在同一位置。
- **键盘**：板获得焦点后，`Shift + 方向键` 移动、`Alt + 方向键` 缩放；方向键本身仍归翻页。

### 结构
- `src/player/BoardFrame.tsx` — 拖动/缩放/记忆的容器，包住 `SlideStage` 与叠在板上的练习卡。
- `SlideStage` 在图片加载后回报原始宽高，供 `ratio` 锁定比例。

### CSS 类
- `.board-wrap` / `.board-wrap--floating` — 贴合态 / 浮动态
- `.board-grip` — 左上角页码提示（hover 或浮动时显示）
- `.board-fit` — 右上角回到贴合
- `.board-resizer` — 右下角缩放手柄

---

## 1. 可拖动调整的视频窗口

### 功能
- 点击顶部 "Lecture video" 按钮打开视频窗口
- **默认位置**：板区右上角（不遮住 Transcript 面板）
- **拖动**：按住视频窗口顶部标题栏拖动到任意位置
- **调整大小**：拖动右下角的调整手柄
  - 保持 16:9 比例
  - 最小尺寸：160×90
  - 最大尺寸：480×270
- **边界约束**：自动防止拖出视口
- **位置记忆**：关闭后重新打开会恢复上次位置和尺寸（存储在 localStorage）
- **元素常驻**：窗口隐藏时 `<video>` 仍挂载，它就是这节课的时钟，开关窗口不打断播放。

### CSS 类
- `.video-float` - 主容器（fixed 定位）
- `.video-float__head` - 标题栏（可拖动区域，cursor: grab）
- `.video-float__resize-handle` - 右下角调整手柄（16×16px）

---

## 2. 中英双语字幕切换

### 功能
- **三种模式**：
  - EN（仅英文）
  - 中（仅中文）
  - 双语（英文在上，中文在下）
- **两个切换位置**：
  1. 底部字幕条右侧
  2. 右侧 Transcript 面板顶部
- **语言偏好记忆**：存储在 localStorage，下次打开恢复

### 数据格式
字幕文件 `transcript.json` 中的 `cues` 数组，每个 cue 对象新增可选字段 `text_zh`：

```json
{
  "cues": [
    {
      "start": 4.27,
      "end": 12.99,
      "slide": 1,
      "text": "Hello, welcome to math 214...",
      "text_zh": "你好，欢迎来到数学214...",
      "chapter": "what-is"
    }
  ]
}
```

### 生成中文字幕

**已经有的**：官方范例 Lecture 10 的双语字幕来自官方时间轴，`scripts/build_lecture10_pack.py` 直接把中文写进 `text_zh`，不需要调任何 API，也不需要 key。

**需要新翻的**（例如 Speyer 1a 全片）：用 DeepSeek 批量翻译。

**前置条件**：
```bash
pip install openai
export DEEPSEEK_API_KEY=sk-xxx  # 或在 Windows: $env:DEEPSEEK_API_KEY="sk-xxx"
```

**运行翻译**：
```bash
python scripts/translate_cues.py \
  public/course/lectures/speyer-1a/transcript.json \
  public/course/lectures/speyer-1a/transcript.json
```

脚本会：
1. 读取现有 `transcript.json`
2. 调用 DeepSeek API 批量翻译（每批 10 条）
3. 为每个 cue 添加 `text_zh` 字段
4. 保存回原文件（或指定的输出文件）

**参数**：
- 温度：0.3（稳定翻译）
- 批次大小：10 条/次
- 模型：`deepseek-chat`

**示例输出**：
```
Translating 171 cues...
Batch 1/18... ✓
Batch 2/18... ✓
...
Translated transcript saved to public/course/lectures/speyer-1a/transcript.json

Sample translations:
[1] EN: Hello, welcome to math 214 applied linear algebra...
    ZH: 你好，欢迎来到数学214应用线性代数...
```

### UI 组件更新
- `src/lib/captions.ts` - 新增字幕文本提取逻辑
- `src/player/Captions.tsx` - Transcript 面板支持语言切换
- `src/player/PlayerView.tsx` - 底部字幕条支持双语显示
- `src/types.ts` - Cue 类型添加 `text_zh?: string`

---

## 3. 本地测试

```bash
# 1. 启动开发服务器
npm run dev  # http://localhost:5174/course/

# 2. 打开浏览器
# - 进入 Speyer 1a 播放器
# - 点击 "Lecture video" 测试拖动和调整大小
# - 点击字幕条右侧的 "EN / 中 / 双语" 按钮测试切换
#   （如果还没有中文字幕，只会显示 EN 按钮）

# 3. 生成中文字幕后刷新页面，三个按钮都会出现
```

---

## 4. 文件清单

**新增文件**：
- `scripts/translate_cues.py` - DeepSeek 翻译脚本
- `src/lib/captions.ts` - 字幕文本处理工具函数
- `src/player/BoardFrame.tsx` - 课件板的拖动/缩放/贴合/记忆
- `e2e/board.spec.ts` - 板的拖动缩放、位置记忆、视频窗口的端到端用例

**修改文件**：
- `src/types.ts` - Cue 类型添加 `text_zh`
- `src/player/SlideStage.tsx` - 回报课件原始宽高，禁用图片原生拖拽
- `src/player/PlayerView.tsx` - 用 `BoardFrame` 包住板；双语字幕与语言状态
- `src/player/VideoPane.tsx` - 可拖动调整的窗口；默认落位板区右上角；元素常驻
- `src/player/Captions.tsx` - 添加语言切换 UI
- `src/styles.css` - 板/视频窗口的手柄样式、字幕语言按钮

---

## 5. 下一步

- [ ] 运行翻译脚本生成 speyer-1a 的完整中文字幕（现在只有前 10 句示例）
- [ ] 手机端实际触摸验证（拖动板面、双指缩放暂未支持）
- [ ] 为 MAT3007 课程也生成中文字幕

---

## 6. 技术细节

### 拖动实现
- 使用 Pointer Events API（支持触摸和鼠标）
- `setPointerCapture` 确保拖动时鼠标移出窗口仍然跟随
- 实时计算边界约束，防止拖出视口

### 课件板的坐标与边界
- `box` 为 `null` 时板走正常流布局（贴合居中）；一旦拖动或缩放就写入显式矩形，变成浮动态。
- 开始拖动时用 `getBoundingClientRect` 反算当前贴合位置，因此第一次拖动不会跳变。
- 坐标相对板区（`.board-area`）的 padding box，上下左右都留出板区自身的内边距，所以板不会贴到窗口边。
- 缩放锁课件比例：`ratio` 来自 `SlideStage` 上报的图片原始宽高（首次加载后固定）。
- 窗口尺寸或侧栏变化时，用 `ResizeObserver` + `resize` 把矩形收回可见范围。
- 拖动过程中的写入只在 `pointerup` 落盘，避免每帧写 `localStorage`。

### 调整大小实现
- 拖动右下角时同时考虑 dx 和 dy（取最大值）
- 锁定 16:9 比例（先用 width 计算 height，然后检查是否超限）
- 调整大小时如果新尺寸会导致窗口超出视口，自动调整位置

### 字幕切换实现
- `CaptionLang` 类型：`"en" | "zh" | "both"`
- 存储在 localStorage 的 `caption-lang` 键
- 双语模式下在 Transcript 面板中用 `<br>` 和 `.cue__text--secondary` 样式区分两行
- 底部字幕条用两个 `<p>` 标签，第二个带 `.caption__text--secondary` 样式

### 样式细节
- 语言切换按钮组用 `.caption__lang-switch` 包裹，背景色 `var(--mat)`
- 活动按钮用 `.is-active` 类，背景色 `var(--surface)`，文字色 `var(--accent)`
- 视频窗口添加 `box-shadow: 0 4px 12px rgba(0,0,0,0.15)` 提升层次感
- 调整手柄在 hover 时改变不透明度和背景色，提供视觉反馈

### 回归保护
- `e2e/board.spec.ts` 覆盖：贴合开局 → 缩放 → 拖动 → 再缩放 → `Fit` 复位、重载后位置记忆、视频窗口默认落位与缩放。
- 视频窗口隐藏时 `<video>` 必须仍然挂载——它同时是时钟，`e2e/player.spec.ts` 第一条用例（不开视频窗口也能播放并推进时间）守着这一点。
