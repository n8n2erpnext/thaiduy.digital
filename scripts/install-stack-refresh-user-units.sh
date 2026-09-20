#!/usr/bin/env sh
set -eu

REPO_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
UNIT_SRC="$REPO_DIR/deploy/systemd"
UNIT_DST="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"

mkdir -p "$UNIT_DST"
for unit in \
  thaiduy-stack-refresh-request.service \
  thaiduy-stack-refresh-request.timer \
  thaiduy-stack-refresh.service \
  thaiduy-stack-refresh.timer
do
  cp "$UNIT_SRC/$unit" "$UNIT_DST/$unit"
done

if [ -z "${XDG_RUNTIME_DIR:-}" ]; then
  export XDG_RUNTIME_DIR="/run/user/$(id -u)"
fi
if [ -S "$XDG_RUNTIME_DIR/bus" ] && [ -z "${DBUS_SESSION_BUS_ADDRESS:-}" ]; then
  export DBUS_SESSION_BUS_ADDRESS="unix:path=$XDG_RUNTIME_DIR/bus"
fi

systemctl --user daemon-reload
systemctl --user enable --now \
  thaiduy-stack-refresh-request.timer \
  thaiduy-stack-refresh.timer

printf '%s\n' "Installed Stack host refresh timers."
systemctl --user list-timers --all --no-pager | grep thaiduy-stack-refresh || true
