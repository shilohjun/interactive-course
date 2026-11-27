import type { Cue } from "../types";

export type CaptionLang = "en" | "zh" | "both";

export function getCaptionText(cue: Cue, lang: CaptionLang): string {
  switch (lang) {
    case "en":
      return cue.text;
    case "zh":
      return cue.text_zh || cue.text;
    case "both":
      return cue.text_zh ? `${cue.text}\n${cue.text_zh}` : cue.text;
  }
}

export function hasChinese(cue: Cue): boolean {
  return !!cue.text_zh;
}

export function formatCaptionForDisplay(cue: Cue, lang: CaptionLang): { primary: string; secondary?: string } {
  if (lang === "both" && cue.text_zh) {
    return {
      primary: cue.text,
      secondary: cue.text_zh,
    };
  }
  return {
    primary: getCaptionText(cue, lang),
  };
}
