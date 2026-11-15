#!/usr/bin/env bash
# Serve Qwen3.6-35B-A3B (MLX 4-bit) on http://127.0.0.1:8080 with memory limits and a /flush endpoint.
# Extra arguments are passed to mlx_lm.server and override the defaults below. See README.md, section 1.
set -euo pipefail

DRIVE=/Volumes/ExternalSSD
MODEL=mlx-community/Qwen3.6-35B-A3B-4bit
HOST=${HOST:-127.0.0.1}
PORT=${PORT:-8080}
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG="$REPO/.driver-logs/qwen-server.log"

if [ ! -d "$DRIVE" ]; then
  echo "External drive not mounted at $DRIVE" >&2
  exit 1
fi

export HF_HOME="$DRIVE/models/hf"
export HF_HUB_OFFLINE=1            # weights are already local; don't hit the network
export HF_HUB_DISABLE_TELEMETRY=1

mkdir -p "$REPO/.driver-logs"
echo "Server log: $LOG"
exec > >(tee -a "$LOG") 2>&1

exec "$HOME/.local/share/uv/tools/mlx-lm/bin/python" "$REPO/harness/local/qwen_server.py" \
  --model "$MODEL" --host "$HOST" --port "$PORT" \
  --prefill-step-size 512 --prompt-concurrency 1 --decode-concurrency 1 \
  --prompt-cache-size 2 --prompt-cache-bytes 4000000000 "$@"
