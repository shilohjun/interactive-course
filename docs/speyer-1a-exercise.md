# Speyer 1a · 步步解题目草案

给发发：只加题数据，不改 bubujie 代码。题面语言与 1a 讲解一致（英文）。题号暂用 `LINALG1`，正式 id 出来后替换 `data/speyer-1a.timeline.json` 与 `public/course/lectures/speyer-1a/transcript.json` 里的 `problem` / `url`。

## 题目

**Problem id:** `LINALG1`
**After slide:** 3（“What is linear algebra?”的代数/几何定义之后）
**Language:** English
**Type:** short constructed response + multiple choice

**Prompt**

> Which of these equations is linear, in the sense used in the lecture?
>
> (a) \(5x + 3y + z = 7\)
> (b) \(x^2 + y = 7\)
> (c) \(3xy + z = 1\)
> (d) \(2x + \sin(y) = 0\)
>
> Choose one, then explain what makes an equation linear.

**Hint chain（提示式，不给最终答案）**

1. Look at each variable separately. Is it raised to a power, multiplied by another variable, or trapped inside a function?
2. In (b) one variable is squared. In (c) two variables are multiplied. In (d) \(y\) sits inside \(\sin\).
3. A linear equation has every variable by itself, to the first power, with a constant coefficient — like \(5x+3y+z=7\).
4. So which option survives all three tests? Say the rule in your own words before you answer.

**Expected reasoning**

(a) only. Each variable appears to the first power, is not multiplied by another variable, and is not inside a function. (b) violates the power rule, (c) the product rule, (d) the “inside a function” rule.

## 可选第二题（周一后）

**Problem id:** `LINALG2`
**After slide:** 6 / explorable
**Prompt**

> In your own words: why can a curved graph be approximated by a straight line near a point, and why does the approximation get worse as you move away? Give one example where the tangent line is a bad approximation.

**Hints**

1. What does the tangent line match at the point itself — value, slope, both?
2. The error is the gap between the curve and the line. What happens to that gap as the window shrinks?
3. Think of a curve that bends sharply, or a point where the curve turns around.

**Expected reasoning**

The tangent matches value and slope at \(x_0\); the gap is governed by curvature times the square of the distance, so it shrinks with the window. Far away, or near a sharp bend, the line misses the curve.
