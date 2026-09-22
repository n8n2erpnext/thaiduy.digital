#!/usr/bin/env bash
set -u

STATE="/home/ubuntu/.local/state/thaiduy-digital-logrotate.status"
CONFIG="/home/ubuntu/n8n2erpnext/thaiduy.digital/ops/logrotate/thaiduy-digital-dev.conf"
INTERVAL_SECONDS="${THAIDUY_LOGROTATE_INTERVAL_SECONDS:-1800}"

mkdir -p "$(dirname "$STATE")"

while true; do
  /usr/sbin/logrotate -s "$STATE" "$CONFIG" >/dev/null 2>&1 || true
  sleep "$INTERVAL_SECONDS"
done
