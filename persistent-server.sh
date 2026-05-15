#!/bin/bash
# WhaleRadar AI - Persistent Dev Server Manager
# Auto-restarts Next.js dev server when it crashes
# Usage: bash /home/z/my-project/persistent-server.sh

LOGFILE="/home/z/my-project/dev.log"
PIDFILE="/tmp/nextjs-dev.pid"
MAX_RESTARTS=100
RESTART_COUNT=0

cleanup() {
  echo "[$(date)] Supervisor shutting down..." >> "$LOGFILE"
  if [ -f "$PIDFILE" ]; then
    OLD_PID=$(cat "$PIDFILE" 2>/dev/null)
    if [ -n "$OLD_PID" ]; then
      kill "$OLD_PID" 2>/dev/null
    fi
    rm -f "$PIDFILE"
  fi
  exit 0
}

trap cleanup SIGTERM SIGINT

echo "[$(date)] === WhaleRadar Dev Server Supervisor Started ===" >> "$LOGFILE"

while [ $RESTART_COUNT -lt $MAX_RESTARTS ]; do
  echo "[$(date)] Starting Next.js dev server (attempt $((RESTART_COUNT + 1)))..." >> "$LOGFILE"
  
  cd /home/z/my-project
  NODE_OPTIONS="--max-old-space-size=512" ./node_modules/.bin/next dev -p 3000 >> "$LOGFILE" 2>&1
  EXIT_CODE=$?
  
  RESTART_COUNT=$((RESTART_COUNT + 1))
  echo "[$(date)] Server exited with code $EXIT_CODE (restart #$RESTART_COUNT)" >> "$LOGFILE"
  
  # Brief pause before restart
  sleep 2
done

echo "[$(date)] Max restarts reached. Stopping supervisor." >> "$LOGFILE"
