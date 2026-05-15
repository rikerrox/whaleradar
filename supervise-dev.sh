#!/bin/bash
# Supervise Next.js dev server - auto-restart on crash
LOCKFILE="/tmp/whaleradar-dev.lock"

# Prevent multiple instances
if [ -f "$LOCKFILE" ]; then
  OLD_PID=$(cat "$LOCKFILE" 2>/dev/null)
  if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
    echo "Another instance already running (PID: $OLD_PID)"
    exit 0
  fi
fi
echo $$ > "$LOCKFILE"

cleanup() {
  rm -f "$LOCKFILE"
  kill 0 2>/dev/null
}
trap cleanup EXIT

while true; do
  echo "[$(date)] Starting Next.js dev server..." >> /home/z/my-project/dev.log
  cd /home/z/my-project
  NODE_OPTIONS="--max-old-space-size=512" ./node_modules/.bin/next dev -p 3000 >> /home/z/my-project/dev.log 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 2s..." >> /home/z/my-project/dev.log
  sleep 2
done
