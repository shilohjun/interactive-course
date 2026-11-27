#!/usr/bin/env bash
# Build locally and ship the artifact. A human with SSH runs this and then
# applies the nginx snippet; the harness never edits the server itself.
set -euo pipefail

HOST="${1:?usage: deploy/deploy.sh user@host}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

npm ci --no-audit --no-fund
bash scripts/fetch-media.sh
npm run build

ssh "$HOST" "sudo mkdir -p /opt/interactive-course/current && sudo chown -R \$(id -u):\$(id -g) /opt/interactive-course"
rsync -az --delete --partial --progress "$ROOT/dist/" "$HOST:/opt/interactive-course/current/"
scp "$ROOT/deploy/server.mjs" "$HOST:/opt/interactive-course/current/server.mjs"
scp "$ROOT/deploy/course.service" "$HOST:/tmp/interactive-course.service"
ssh "$HOST" "sudo install -m 0644 /tmp/interactive-course.service /etc/systemd/system/course.service && sudo systemctl daemon-reload && sudo systemctl enable --now course && sudo systemctl restart course"

cat <<'EOF'
Artifact deployed.
Next, a human adds deploy/nginx-course.conf inside the existing server block:

    sudo nginx -t && sudo systemctl reload nginx

Then verify:
    http://101.33.230.189/course/   (new player)
    http://101.33.230.189/          (existing 步步解, must be unchanged)
EOF
