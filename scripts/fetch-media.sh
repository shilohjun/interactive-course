#!/usr/bin/env bash
# Fetch official lecture videos into the build tree, then verify them.
# The public repository never stores the videos; only this script and its hashes.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MEDIA="$ROOT/public/media"
mkdir -p "$MEDIA"

# --- Speyer Math 214 1a ---
SPEYER_OUT="$MEDIA/speyer-1a.mp4"
SPEYER_URL="https://www.youtube.com/watch?v=Cu5v0QY6cmk"
SPEYER_SHA256="ec28c7e015cdbb010531ef187abbb7afb6913ba4abe68a7345f5e5692932d13b"

if [[ ! -f "$SPEYER_OUT" ]]; then
  command -v yt-dlp >/dev/null || { echo "yt-dlp is required: pip install yt-dlp" >&2; exit 1; }
  yt-dlp -f "136+140-12/136+140-0" -o "${SPEYER_OUT%.mp4}.%(ext)s" "$SPEYER_URL"
fi
echo "$SPEYER_SHA256  $SPEYER_OUT" | sha256sum -c -

# --- Lecture 10 official example (nine chapter files, concatenated) ---
# Source: https://wabyking.github.io/nlp2026-videos-2/lecture10/
# Official page: https://nlp-course-cuhksz.github.io/lecture10.html
L10_BASE="https://wabyking.github.io/nlp2026-videos-2/lecture10"
L10_OUT="$MEDIA/lecture-10.mp4"
L10_PARTS="$ROOT/.cache/lecture-10-parts"
mkdir -p "$L10_PARTS"

L10_HASHES=(
  "1 de63fa840e05c27e1b31359177e05d4f3bb23606a4dcac8941fd631e629401a5"
  "2 6ad3efead191b2ad7cb9bbdae62a8606311682a0bbd8ccea608ab330ca4451b0"
  "3 356e0d6b20ea5d2d3bae7ca544385de9f7d011a4708581c583229cead39e914c"
  "4 b744a5935bda7cf248112501e03190bf239d81343e51d173f64a4dfd091e1fa2"
  "5 fcfa0c10d4f44460ddcd7fea2dc8c917f41960b021ed591680e01e9417b1baec"
  "6 4568684728de882e5294a49626f17bdf33d80378ab875e065b86b3d53f7275b2"
  "7 293b20b5cb56a4d43a904ef0aa0ec61e30afda80be1a019a98e6b1e390b122ed"
  "8 3ea4a1155a3b9d3313319de31ff51829d78d032a0e46e0fd3e2df839900133d3"
  "9 5661f435642f1fd1a9a46a0f06901de453bead34e49e8ad857c276211b14652d"
)

for entry in "${L10_HASHES[@]}"; do
  n="${entry%% *}"
  hash="${entry#* }"
  dest="$L10_PARTS/lecture10_part${n}.mp4"
  if [[ ! -f "$dest" ]]; then
    curl -fL --retry 3 -o "$dest" "$L10_BASE/lecture10_part${n}.mp4"
  fi
  echo "$hash  $dest" | sha256sum -c -
done

if [[ ! -f "$L10_OUT" ]]; then
  command -v ffmpeg >/dev/null || { echo "ffmpeg is required to join Lecture 10 chapters" >&2; exit 1; }
  list="$L10_PARTS/concat.txt"
  : > "$list"
  for n in 1 2 3 4 5 6 7 8 9; do
    printf "file '%s'\n" "$L10_PARTS/lecture10_part${n}.mp4" >> "$list"
  done
  ffmpeg -y -hide_banner -loglevel error -f concat -safe 0 -i "$list" -c copy "$L10_OUT"
fi
