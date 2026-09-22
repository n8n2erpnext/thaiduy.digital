#!/usr/bin/env bash
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WATCHER="$ROOT/ops/logrotate/watch-dev-log.sh"
NEXT_BIN="$ROOT/node_modules/.bin/next"

if command -v logrotate >/dev/null 2>&1 && [ -x "$WATCHER" ]; then
  if ! pgrep -f "^bash $WATCHER$" >/dev/null 2>&1; then
    nohup bash "$WATCHER" >/tmp/thaiduy-digital-logrotate-watch.log 2>&1 &
  fi
fi

exec "$NEXT_BIN" dev "$@"
