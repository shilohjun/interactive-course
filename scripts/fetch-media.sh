#!/usr/bin/env bash
# Fetch the official lecture video into the build tree, then verify it.
# The public repository never stores the video; only this script and its hash.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/public/media/speyer-1a.mp4"
URL="https://www.youtube.com/watch?v=Cu5v0QY6cmk"
SHA256="ec28c7e015cdbb010531ef187abbb7afb6913ba4abe68a7345f5e5692932d13b"

mkdir -p "$(dirname "$OUT")"

if [[ ! -f "$OUT" ]]; then
  command -v yt-dlp >/dev/null || { echo "yt-dlp is required: pip install yt-dlp" >&2; exit 1; }
  yt-dlp -f "136+140-12/136+140-0" -o "${OUT%.mp4}.%(ext)s" "$URL"
fi

echo "$SHA256  $OUT" | sha256sum -c -
